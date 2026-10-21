import fs from 'node:fs/promises'
import path from 'node:path'
import { confirm, isCancel, log, outro } from '@clack/prompts'
import type { LoadedConfig } from '@/config'
import { typescriptExtensions } from '@/constants'
import { validateRegistryComponent } from '@/registry/client'
import type { OutputComponent, OutputFile } from '@/registry/schema'
import { assertContainedPath, registryPath } from '@/utils/paths'
import { toImportSpecifier, transformReferences } from '@/utils/transform-references'
import { createEmptyProject } from '@/utils/typescript'

export type Resolver = (file: string) => Promise<unknown>

type DownloadedComponents = Omit<OutputComponent, 'subComponents'>[]

export type ComponentInstaller = ReturnType<typeof createComponentInstaller>

export function createComponentInstaller(options: {
  resolver: Resolver
  config: LoadedConfig
  projectDir?: string
}) {
  const { config, resolver } = options
  const projectDir = path.resolve(options.projectDir ?? process.cwd())
  const project = createEmptyProject()
  const installedFiles = new Set<string>()
  const downloadedComps = new Map<string, OutputComponent>()

  function buildFileList(
    downloaded: DownloadedComponents,
    resolveOutputPath: (file: OutputFile) => string
  ): OutputFile[] {
    const map = new Map<string, OutputFile>()
    for (const item of downloaded) {
      for (const file of item.files) {
        const filePath = resolveOutputPath(file)

        const existing = map.get(filePath)
        if (existing) {
          if (existing.content !== file.content)
            throw new Error(`Conflicting output content: ${filePath}`)
          continue
        }

        map.set(filePath, file)
      }
    }

    for (const filePath of map.keys()) {
      let parent = path.dirname(filePath)
      while (parent !== path.dirname(parent)) {
        if (map.has(parent)) throw new Error(`Conflicting output paths: ${parent} and ${filePath}`)
        parent = path.dirname(parent)
      }
    }

    return Array.from(map.values())
  }

  return {
    async install(name: string) {
      const downloaded = await this.download(name)
      const dependencies: Record<string, string | null> = {}
      const devDependencies: Record<string, string | null> = {}

      for (const item of downloaded) {
        Object.assign(dependencies, item.dependencies)
        Object.assign(devDependencies, item.devDependencies)
      }

      const fileList = buildFileList(downloaded, (file) => this.resolveOutputPath(file))
      const outputPaths: { file: OutputFile; outPath: string }[] = []
      for (const file of fileList) {
        const outputPath = this.resolveOutputPath(file)
        await assertContainedPath(projectDir, outputPath)
        const existing = await fs.stat(outputPath).catch((error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return undefined
          throw error
        })
        if (existing && !existing.isFile())
          throw new Error(`Output target is not a file: ${outputPath}`)
        outputPaths.push({ file, outPath: outputPath })
      }

      for (const { file, outPath } of outputPaths) {
        const filePath = file.target ?? file.path
        if (installedFiles.has(outPath)) continue

        const output = typescriptExtensions.includes(path.extname(filePath))
          ? this.transform(outPath, file, fileList)
          : file.content

        const status = await fs
          .readFile(outPath)
          .then((res) => {
            if (res.toString() === output) return 'ignore'
            return 'need-update'
          })
          .catch(() => 'write')

        if (status === 'ignore') {
          installedFiles.add(outPath)
          continue
        }

        if (status === 'need-update') {
          const override = await confirm({
            message: `Do you want to override ${outPath}?`,
            initialValue: false,
          })

          if (isCancel(override)) {
            outro('Ended')
            process.exit(0)
          }

          if (!override) {
            installedFiles.add(outPath)
            continue
          }
        }

        await assertContainedPath(projectDir, outPath)
        await fs.mkdir(path.dirname(outPath), { recursive: true })
        await assertContainedPath(projectDir, outPath)
        await fs.writeFile(outPath, output)
        installedFiles.add(outPath)
        log.step(`downloaded ${outPath}`)
      }

      return {
        dependencies,
        devDependencies,
      }
    },
    async download(name: string): Promise<DownloadedComponents> {
      const result: DownloadedComponents = []
      const visited = new Set<string>()
      const ancestors = new Set<string>()
      const visit = async (id: string): Promise<void> => {
        registryPath(id)
        if (ancestors.has(id)) throw new Error(`Circular registry dependency: ${id}`)
        if (visited.has(id)) return

        let comp = downloadedComps.get(id)
        if (!comp) {
          comp = validateRegistryComponent(await resolver(`${id}.json`))
          downloadedComps.set(id, comp)
        }
        visited.add(id)
        ancestors.add(id)
        result.push(comp)
        for (const sub of comp.subComponents) await visit(sub)
        ancestors.delete(id)
      }
      await visit(name)
      return result
    },
    transform(filePath: string, file: OutputFile, fileList: OutputFile[]) {
      const sourceFile = project.createSourceFile(filePath, file.content, {
        overwrite: true,
      })

      transformReferences(sourceFile, (specifier) => {
        const prefix = '@/'

        if (specifier.startsWith(prefix)) {
          const lookup = specifier.substring(prefix.length)

          const target = fileList.find((item) => {
            const filePath = item.target ?? item.path

            return path.posix.normalize(registryPath(filePath)) === lookup
          })

          if (!target) {
            console.warn(`cannot find the referenced file of ${specifier}`)
            return specifier
          }

          return toImportSpecifier(filePath, this.resolveOutputPath(target))
        }
      })

      return sourceFile.getFullText()
    },

    resolveOutputPath(ref: OutputFile): string {
      if (ref.target) {
        return path.resolve(projectDir, config.baseDir, registryPath(ref.target))
      }

      const base = path.basename(ref.path)
      const dir = (
        {
          components: config.aliases.componentsDir,
          block: config.aliases.blockDir,
          ui: config.aliases.uiDir,
          css: config.aliases.cssDir,
          lib: config.aliases.libDir,
          route: './',
        } as const
      )[ref.type]

      return path.resolve(projectDir, config.baseDir, dir, base)
    },
  }
}

export function remoteResolver(url: string): Resolver {
  return async (file) => {
    const res = await fetch(`${url}/${registryPath(file)}`)
    if (!res.ok) {
      throw new Error(`failed to fetch ${url}/${file}: ${res.statusText}`)
    }

    return await res.json()
  }
}

export function localResolver(dir: string): Resolver {
  const root = path.resolve(dir)
  return async (file) => {
    const filePath = path.resolve(root, registryPath(file))
    await assertContainedPath(root, filePath)

    return await fs
      .readFile(filePath)
      .then((res) => JSON.parse(res.toString()))
      .catch((e) => {
        throw new Error(`failed to resolve local file "${filePath}"`, {
          cause: e,
        })
      })
  }
}
