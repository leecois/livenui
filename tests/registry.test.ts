import { expect, test } from 'bun:test'
import { mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { getPlannedFilePaths } from '@shadcn/registry/internal/utils/updaters/update-files'
import {
  type Output,
  toShadcnRegistry,
  writeLivenUIRegistry,
  writeShadcnRegistry,
} from 'livenui-cli/build'
import { registryItemSchema } from 'shadcn/schema'
import ts from 'typescript'
import {
  configuredLibrary,
  defaults,
  libraries,
  snippet,
  variantDefaults,
} from '../apps/docs/features/component-library/lib/config'
import { sourceImport } from '../apps/docs/features/component-library/lib/distribution'
import { buildAgentRegistry, writePublicLicenses } from '../apps/docs/scripts/build-registry'
import { createComponentInstaller } from '../packages/cli/src/utils/add/install-component'

let built: Promise<Output> | undefined
const build = () => (built ??= buildAgentRegistry())

test('website license copies regenerate from package notices with unchanged public paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'livenui-licenses-'))
  const sources = {
    'border-beam.txt': 'packages/border-beam/LICENSE',
    'thinking-orbs.txt': 'packages/thinking-orbs/LICENSE',
    'metal-fx.txt': 'packages/metal-fx/LICENSE',
    'liquid-gooey.txt': 'packages/liquid-gooey/LICENSE',
    'voice-glow.txt': 'packages/voice-glow/LICENSE',
    'img-fx.txt': 'packages/img-fx/LICENSE',
    'bot-avatars.txt': 'packages/bot-avatars/LICENSE',
    'shaders.txt': 'packages/metal-fx/LICENSE-APACHE-2.0',
    'metal-notice.txt': 'packages/metal-fx/NOTICE',
  }
  try {
    const output = join(directory, 'public/licenses')
    await writePublicLicenses(output)
    expect((await readdir(output)).sort()).toEqual(Object.keys(sources).sort())
    await writeFile(join(output, 'metal-notice.txt'), 'outdated notice')
    await writePublicLicenses(output)
    for (const [name, source] of Object.entries(sources))
      expect(await readFile(join(output, name), 'utf8')).toBe(await readFile(source, 'utf8'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('registry contains complete local source and licenses without upstream effect dependencies', async () => {
  const registry = await build()
  expect(registry.index.map((item) => item.name).sort()).toEqual(
    libraries.map((library) => library.id).sort()
  )
  for (const library of libraries) {
    const item = registry.components.find((component) => component.name === library.id)
    if (!item) throw new Error(`Missing registry item: ${library.id}`)
    expect(item.files[0].content).toBe(`'use client'\n\nexport * from './${library.id}/index'\n`)
    expect(item.files[0].target).toBe(`components/livenui/${library.id}.tsx`)
    expect(
      item.files.some((file) => file.target === `components/livenui/${library.id}/index.ts`)
    ).toBe(true)
    expect(
      item.files.some((file) => file.target === `components/livenui/${library.id}/LICENSE`)
    ).toBe(true)
    const legalFiles = item.files
      .map((file) => file.target?.split('/').at(-1) ?? '')
      .filter((name) => /^(LICENSE(?:[.-].+)?|NOTICE)$/.test(name))
      .sort()
    expect(legalFiles).toEqual(
      library.id === 'metal' ? ['LICENSE', 'LICENSE-APACHE-2.0', 'NOTICE'] : ['LICENSE']
    )
    for (const source of item.files.slice(1)) {
      expect(source.content).toBe(await readFile(resolve(source.path), 'utf8'))
    }
    for (const other of libraries) expect(item.dependencies[other.package]).toBeUndefined()
    expect(JSON.stringify(item)).not.toContain('workspace:')
    expect(
      registry.components.find((component) => component.name === library.package)?.files
    ).toEqual(item.files)
  }
  expect(registry.components.find((item) => item.name === 'image')?.dependencies.three).toMatch(
    /^\^0\./
  )
  expect(
    registry.components.find((item) => item.name === 'metal')?.dependencies['@paper-design/shaders']
  ).toBeDefined()
})

test('both registry formats discard retired outputs and preserve legal file payloads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'livenui-registry-'))
  try {
    const output = await build()
    const names = output.components.map((component) => `${component.name}.json`)
    await writeFile(join(dir, 'blur-text.json'), '{}')
    await writeLivenUIRegistry(output, { dir, cleanDir: true, log: false })
    expect((await readdir(dir)).sort()).toEqual(['_registry.json', ...names].sort())
    const metal = JSON.parse(await readFile(join(dir, 'metal.json'), 'utf8'))
    expect(
      metal.files.find((file: { target: string }) => file.target.endsWith('/LICENSE-APACHE-2.0'))
        .content
    ).toBe(await readFile('packages/metal-fx/LICENSE-APACHE-2.0', 'utf8'))
    await writeShadcnRegistry(output, { dir, cleanDir: true, baseUrl: 'http://localhost:3000' })
    expect((await readdir(dir)).sort()).toEqual(names.sort())
    for (const library of libraries) {
      const payload = JSON.parse(await readFile(join(dir, `${library.id}.json`), 'utf8'))
      expect(registryItemSchema.safeParse(payload).success).toBe(true)
      expect(payload.files[0].target).toBe(`@components/livenui/${library.id}.tsx`)
      const license = payload.files.find((file: { target: string }) =>
        file.target.endsWith('/LICENSE')
      )
      expect(license.type).toBe('registry:file')
      expect(license.content).toContain('MIT License')
      if (library.id === 'metal') {
        const apache = payload.files.find((file: { target: string }) =>
          file.target.endsWith('/LICENSE-APACHE-2.0')
        )
        expect(apache.type).toBe('registry:file')
        expect(apache.content).toBe(await readFile('packages/metal-fx/LICENSE-APACHE-2.0', 'utf8'))
        expect(apache.content).toContain('END OF TERMS AND CONDITIONS')
      }
      expect(
        payload.dependencies.some((dependency: string) =>
          libraries.some((item) => dependency.startsWith(`${item.package}@`))
        )
      ).toBe(false)
    }
    const image = JSON.parse(await readFile(join(dir, 'image.json'), 'utf8'))
    expect(image.dependencies.some((dependency: string) => dependency.startsWith('three@'))).toBe(
      true
    )
    expect(
      image.devDependencies.some((dependency: string) => dependency.startsWith('@types/three@'))
    ).toBe(true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('all registry sources install and exported examples typecheck in a separate project', async () => {
  const project = await mkdtemp(join(tmpdir(), 'livenui-consumer-'))
  try {
    const output = await build()
    await symlink(resolve('node_modules'), join(project, 'node_modules'))
    await writeFile(
      join(project, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } })
    )
    const installer = createComponentInstaller({
      projectDir: project,
      config: {
        baseDir: '.',
        aliases: {
          componentsDir: 'components',
          blockDir: 'components',
          uiDir: 'components/ui',
          cssDir: 'styles',
          libDir: 'lib',
        },
        commands: {},
      },
      resolver: async (name) => {
        const component = output.components.find((component) => `${component.name}.json` === name)
        if (!component) throw new Error(`Missing registry item: ${name}`)
        return component
      },
    })
    const examples: string[] = []
    for (const library of libraries) {
      await installer.install(library.id)
      for (const variant of library.id === 'metal'
        ? ['ring', 'text', 'badge']
        : library.id === 'avatars'
          ? ['ring', 'arrowhead', 'chat', 'connector', 'bulb']
          : ['ring']) {
        const props =
          library.id === 'metal'
            ? variantDefaults(library, variant)
            : library.id === 'avatars' && variant !== 'ring'
              ? { ...defaults.avatars, type: variant }
              : defaults[library.id]
        const code = snippet(
          configuredLibrary(library, library.id === 'avatars' ? 'ring' : variant),
          props
        )
        expect(code).toContain(sourceImport(library))
        const split = code.lastIndexOf('\n\n')
        const source = code.includes('export function ')
          ? code
          : `${code.slice(0, split)}\nexport function Example() { return (${code.slice(split)}) }`
        const file = join(project, `${library.id}-${variant}.tsx`)
        await writeFile(file, source)
        examples.push(file)
      }
    }
    const program = ts.createProgram(examples, {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      types: ['react', 'react-dom'],
      typeRoots: [resolve('node_modules/@types')],
      paths: { '@/*': [`${project}/*`] },
    })
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    ).toEqual([])
    const bundle = await Bun.build({
      entrypoints: examples,
      target: 'browser',
      external: ['react', 'react-dom', 'three', '@paper-design/shaders'],
      write: false,
    })
    expect(bundle.success).toBe(true)
  } finally {
    await rm(project, { recursive: true, force: true })
  }
}, 30_000)

test('standard registry installer keeps source and licenses together across custom aliases', async () => {
  const registry = toShadcnRegistry(await build(), 'http://localhost:3000')
  for (const prefix of ['', 'src']) {
    const cwd = resolve('consumer-fixture')
    const components = join(cwd, prefix, 'widgets')
    const config = {
      style: 'new-york',
      rsc: false,
      tsx: true,
      tailwind: { css: 'styles.css', baseColor: 'neutral', cssVariables: true },
      aliases: { components: '@/widgets', utils: '@/lib/utils' },
      resolvedPaths: {
        cwd,
        components,
        utils: join(cwd, 'lib/utils'),
        ui: join(components, 'ui'),
        lib: join(cwd, 'lib'),
        hooks: join(cwd, 'hooks'),
        tailwindConfig: '',
        tailwindCss: join(cwd, 'styles.css'),
      },
    }
    for (const library of libraries) {
      const item = registry.items.find((item) => item.name === library.id)
      if (!item?.files) throw new Error(`Missing source files: ${library.id}`)
      const paths = getPlannedFilePaths(item.files, config, { isSrcDir: prefix === 'src' }).map(
        (path) => resolve(cwd, path)
      )
      expect(paths).toContain(join(components, 'livenui', `${library.id}.tsx`))
      expect(paths).toContain(join(components, 'livenui', library.id, 'LICENSE'))
      expect(paths.every((path) => path.startsWith(`${components}/livenui/`))).toBe(true)
    }
  }
})
