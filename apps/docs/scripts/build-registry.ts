import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type Output,
  type OutputComponent,
  type OutputFile,
  writeLivenUIRegistry,
  writeShadcnRegistry,
} from 'livenui-cli/build'
import { registry } from '../components/registry.mjs'
import { siteUrl } from '../lib/site'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = resolve(appRoot, '../..')

async function sourceFiles(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(prefix, entry.name)
      return entry.isDirectory()
        ? sourceFiles(join(directory, entry.name), path)
        : /\.(ts|tsx)$/.test(entry.name)
          ? [path]
          : []
    })
  )
  return files.flat().sort()
}

export async function buildAgentRegistry(): Promise<Output> {
  const components = await Promise.all(
    registry.components.map(async (component): Promise<OutputComponent> => {
      const root = join(projectRoot, component.source)
      const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>
      }
      const sources = await sourceFiles(join(root, 'src'))
      const files: OutputFile[] = await Promise.all(
        sources.map(async (file) => ({
          type: 'components',
          path: `${component.source}/src/${file}`,
          target: `${component.target}/${file}`,
          content: await readFile(join(root, 'src', file), 'utf8'),
        }))
      )
      files.unshift({
        type: 'components',
        path: `livenui/${component.name}.tsx`,
        target: `${component.target}.tsx`,
        content: `'use client'\n\nexport * from './${component.name}/index'\n`,
      })
      const legalFiles = (await readdir(root, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && /^(LICENSE(?:[.-].+)?|NOTICE)$/.test(entry.name))
        .map((entry) => entry.name)
        .sort()
      if (!legalFiles.includes('LICENSE')) throw new Error(`Missing LICENSE: ${component.source}`)
      for (const file of legalFiles) {
        files.push({
          type: 'components',
          path: `${component.source}/${file}`,
          target: `${component.target}/${file}`,
          content: await readFile(join(root, file), 'utf8'),
        })
      }
      const dependencies = { ...manifest.dependencies }
      const devDependencies: Record<string, string> = {}
      if (component.name === 'image') {
        const appManifest = JSON.parse(await readFile(join(appRoot, 'package.json'), 'utf8'))
        dependencies.three = appManifest.dependencies.three
        const rootManifest = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'))
        devDependencies['@types/three'] = rootManifest.devDependencies['@types/three']
      }
      return {
        name: component.name,
        title: `Liven UI ${component.title}`,
        description: component.description,
        files,
        dependencies,
        devDependencies,
        subComponents: [],
      }
    })
  )
  return {
    name: registry.name,
    index: components.map(({ name, title, description }) => ({ name, title, description })),
    components: [
      ...components,
      ...components.map((component, index) => ({
        ...component,
        name: registry.components[index].legacyName,
      })),
    ],
  }
}

export async function buildRegistry() {
  const output = await buildAgentRegistry()
  await Promise.all([
    writeLivenUIRegistry(output, { dir: 'public/registry', cleanDir: true }),
    writeShadcnRegistry(output, {
      dir: 'public/r',
      cleanDir: true,
      baseUrl: siteUrl.origin,
    }),
  ])
}
