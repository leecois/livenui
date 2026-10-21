import { describe, expect, test } from 'bun:test'
import { access, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spinner } from '@clack/prompts'
import { x } from 'tinyexec'
import { validateOutput } from '../packages/cli/src/build/validate'
import { createOrLoadConfig, type LoadedConfig } from '../packages/cli/src/config'
import { createProgram } from '../packages/cli/src/program'
import type { OutputComponent, OutputFile } from '../packages/cli/src/registry/schema'
import {
  createComponentInstaller,
  localResolver,
  remoteResolver,
} from '../packages/cli/src/utils/add/install-component'
import { createDependencyInstaller } from '../packages/cli/src/utils/add/install-deps'
import type { PackageManager } from '../packages/cli/src/utils/get-package-manager'

const config: LoadedConfig = {
  baseDir: 'src',
  aliases: {
    componentsDir: 'components',
    blockDir: 'components',
    uiDir: 'components/ui',
    cssDir: '../styles',
    libDir: 'lib',
  },
  commands: {},
}
const file = (target: string): OutputFile => ({
  type: 'components',
  path: 'sample.txt',
  target,
  content: 'installed',
})
const component = (files: OutputFile[]): OutputComponent => ({
  name: 'sample',
  files,
  dependencies: {},
  devDependencies: {},
  subComponents: [],
})

async function inProject(run: (project: string, outside: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'livenui-cli-'))
  const project = join(directory, 'project')
  const outside = join(directory, 'outside')
  await mkdir(project)
  await mkdir(outside)
  try {
    await run(project, outside)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

describe('registry installation containment', () => {
  for (const separateInstalls of [false, true]) {
    test(`keeps matching file names in distinct namespaces across ${separateInstalls ? 'successive installs' : 'one dependency graph'}`, async () => {
      await inProject(async (project) => {
        const files: OutputFile[] = [
          { type: 'components', path: 'index.txt', content: 'component' },
          { type: 'lib', path: 'index.txt', content: 'library' },
        ]
        const installer = createComponentInstaller({
          projectDir: project,
          config,
          resolver: async (name) =>
            separateInstalls
              ? component([files[name === 'first.json' ? 0 : 1]])
              : name === 'first.json'
                ? { ...component([files[0]]), subComponents: ['second'] }
                : component([files[1]]),
        })
        await installer.install('first')
        if (separateInstalls) await installer.install('second')
        expect(await readFile(join(project, 'src/components/index.txt'), 'utf8')).toBe('component')
        expect(await readFile(join(project, 'src/lib/index.txt'), 'utf8')).toBe('library')
      })
    })
  }

  test('deduplicates identical destinations after normalizing dot prefixes', async () => {
    await inProject(async (project) => {
      const installer = createComponentInstaller({
        projectDir: project,
        config,
        resolver: async () =>
          component([file('sample.txt'), file('sample.txt'), file('./sample.txt')]),
      })
      await installer.install('sample')
      expect(await readFile(join(project, 'src/sample.txt'), 'utf8')).toBe('installed')
      expect(await readdir(join(project, 'src'))).toEqual(['sample.txt'])
    })
  })

  for (const nested of [false, true]) {
    test(`rejects conflicting destination content in ${nested ? 'child components' : 'one component'} before writes`, async () => {
      await inProject(async (project) => {
        const first = [file('safe.txt'), file('shared.txt')]
        const second = [{ ...file('./shared.txt'), content: 'different' }]
        const installer = createComponentInstaller({
          projectDir: project,
          config,
          resolver: async (name) =>
            nested
              ? name === 'sample.json'
                ? { ...component(first), subComponents: ['child'] }
                : component(second)
              : component([...first, ...second]),
        })
        await expect(installer.install('sample')).rejects.toThrow('Conflicting output content')
        expect(await readdir(project)).toEqual([])
      })
    })
  }

  for (const targets of [
    ['shared', 'shared/nested.txt'],
    ['shared/nested.txt', './shared'],
    ['shared', 'shared/deep/nested.txt'],
  ]) {
    test(`rejects planned file/ancestor conflicts before writing ${targets.join(', ')}`, async () => {
      await inProject(async (project) => {
        const installer = createComponentInstaller({
          projectDir: project,
          config,
          resolver: async (name) =>
            name === 'sample.json'
              ? { ...component([file('safe.txt'), file(targets[0])]), subComponents: ['child'] }
              : component([file(targets[1])]),
        })
        await expect(installer.install('sample')).rejects.toThrow('Conflicting output paths')
        expect(await readdir(project)).toEqual([])
      })
    })
  }

  test('preflights directory targets and can retry after the blocker is removed', async () => {
    await inProject(async (project) => {
      const blocked = join(project, 'src/blocked.txt')
      await mkdir(blocked, { recursive: true })
      const installer = createComponentInstaller({
        projectDir: project,
        config,
        resolver: async () => component([file('first.txt'), file('blocked.txt')]),
      })
      await expect(installer.install('sample')).rejects.toThrow('Output target is not a file')
      expect(await readdir(join(project, 'src'))).toEqual(['blocked.txt'])
      await rm(blocked, { recursive: true })
      await installer.install('sample')
      expect(await readFile(join(project, 'src/first.txt'), 'utf8')).toBe('installed')
      expect(await readFile(blocked, 'utf8')).toBe('installed')
    })
  })

  test('resolves registry references to dot-prefixed output targets', async () => {
    await inProject(async (project) => {
      const installer = createComponentInstaller({
        projectDir: project,
        config,
        resolver: async () =>
          component([
            {
              type: 'components',
              path: 'sample.ts',
              target: './components/sample.ts',
              content: "import { value } from '@/lib/value.ts'; export { value };",
            },
            {
              type: 'lib',
              path: 'value.ts',
              target: './lib/value.ts',
              content: 'export const value = 42;',
            },
          ]),
      })
      await installer.install('sample')
      expect(await readFile(join(project, 'src/components/sample.ts'), 'utf8')).toContain(
        '../lib/value'
      )
      expect(await readFile(join(project, 'src/lib/value.ts'), 'utf8')).toContain('value = 42')
    })
  })
  test('downloads shared child components once in dependency order', async () => {
    const requests: string[] = []
    const children: Record<string, string[]> = {
      parent: ['left', 'right'],
      left: ['shared'],
      right: ['shared'],
      shared: [],
    }
    const installer = createComponentInstaller({
      config,
      resolver: async (name) => {
        requests.push(name)
        const id = name.replace(/\.json$/, '')
        return { ...component([]), name: id, subComponents: children[id] }
      },
    })
    expect((await installer.download('parent')).map((item) => item.name)).toEqual([
      'parent',
      'left',
      'shared',
      'right',
    ])
    await installer.download('right')
    expect(requests).toEqual(['parent.json', 'left.json', 'shared.json', 'right.json'])
  })

  for (const children of [['parent'], ['child']]) {
    test(`rejects ${children[0] === 'parent' ? 'self' : 'indirect'} dependency cycles before writes`, async () => {
      await inProject(async (project) => {
        const installer = createComponentInstaller({
          projectDir: project,
          config,
          resolver: async (name) => ({
            ...component([file(`${name}.txt`)]),
            subComponents: name === 'parent.json' ? children : ['parent'],
          }),
        })
        await expect(installer.install('parent')).rejects.toThrow('Circular registry dependency')
        expect(await readdir(project)).toEqual([])
      })
    })
  }

  test('retries a failed child without reusing an incomplete dependency list', async () => {
    let childRequests = 0
    const installer = createComponentInstaller({
      config,
      resolver: async (name) => {
        if (name === 'parent.json')
          return { ...component([]), name: 'parent', subComponents: ['child'] }
        if (++childRequests === 1) return { name: 'invalid' }
        return { ...component([]), name: 'child' }
      },
    })
    await expect(installer.download('parent')).rejects.toThrow()
    expect((await installer.download('parent')).map((item) => item.name)).toEqual([
      'parent',
      'child',
    ])
    expect(childRequests).toBe(2)
  })

  for (const target of [
    '../../outside/new.txt',
    '/tmp/escape.txt',
    'C:\\outside\\new.txt',
    '..\\..\\outside\\new.txt',
    '%2e%2e/outside.txt',
    '%252e%252e%252foutside.txt',
  ]) {
    test(`rejects unsafe target ${target} before writing valid files`, async () => {
      await inProject(async (project) => {
        const installer = createComponentInstaller({
          projectDir: project,
          config,
          resolver: async () => component([file('safe.txt'), file(target)]),
        })
        await expect(installer.install('sample')).rejects.toThrow('Unsafe registry path')
        expect(await readdir(project)).toEqual([])
      })
    })
  }

  test('preflights child components before writing parent files', async () => {
    await inProject(async (project) => {
      const parent = { ...component([file('safe.txt')]), subComponents: ['child'] }
      const installer = createComponentInstaller({
        projectDir: project,
        config,
        resolver: async (name) =>
          name === 'sample.json' ? parent : component([file('../escape.txt')]),
      })
      await expect(installer.install('sample')).rejects.toThrow('Unsafe registry path')
      expect(await readdir(project)).toEqual([])
    })
  })

  test('rejects directory and file symlinks escaping the project before any write', async () => {
    await inProject(async (project, outside) => {
      await mkdir(join(project, 'src'))
      await writeFile(join(outside, 'existing.txt'), 'original')
      await symlink(outside, join(project, 'src', 'linked'))
      await symlink(join(outside, 'existing.txt'), join(project, 'src', 'existing.txt'))
      for (const target of ['linked/new.txt', 'existing.txt']) {
        const installer = createComponentInstaller({
          projectDir: project,
          config,
          resolver: async () => component([file('safe.txt'), file(target)]),
        })
        await expect(installer.install('sample')).rejects.toThrow('Symlink leaves project root')
      }
      expect((await readdir(join(project, 'src'))).sort()).toEqual(['existing.txt', 'linked'])
      expect(await readFile(join(outside, 'existing.txt'), 'utf8')).toBe('original')
      expect(await readdir(outside)).toEqual(['existing.txt'])
    })
  })

  test('preserves nested targets, in-project symlinks and configured sibling aliases', async () => {
    await inProject(async (project) => {
      await mkdir(join(project, 'src'))
      await mkdir(join(project, 'shared'))
      await symlink(join(project, 'shared'), join(project, 'src', 'linked'))
      const installer = createComponentInstaller({
        projectDir: project,
        config,
        resolver: async () =>
          component([
            file('components/agents/sample.txt'),
            file('linked/sample.txt'),
            { type: 'css', path: 'nested/sample.css', content: 'style' },
          ]),
      })
      await installer.install('sample')
      expect(await readFile(join(project, 'src/components/agents/sample.txt'), 'utf8')).toBe(
        'installed'
      )
      expect(await readFile(join(project, 'shared/sample.txt'), 'utf8')).toBe('installed')
      expect(await readFile(join(project, 'styles/sample.css'), 'utf8')).toBe('style')
    })
  })

  test('rejects configured aliases outside project', async () => {
    await inProject(async (project) => {
      const installer = createComponentInstaller({
        projectDir: project,
        config: { ...config, aliases: { ...config.aliases, cssDir: '../../outside' } },
        resolver: async () => component([{ type: 'css', path: 'sample.css', content: 'style' }]),
      })
      await expect(installer.install('sample')).rejects.toThrow('Path leaves project root')
      expect(await readdir(project)).toEqual([])
    })
  })

  test('local registry resolution rejects traversal and symlink reads', async () => {
    await inProject(async (project, outside) => {
      await writeFile(join(project, 'sample.json'), '{"name":"sample"}')
      await writeFile(join(outside, 'secret.json'), '{"private":true}')
      await symlink(join(outside, 'secret.json'), join(project, 'linked.json'))
      const resolve = localResolver(project)
      expect(await resolve('sample.json')).toEqual({ name: 'sample' })
      await expect(resolve('../outside/secret.json')).rejects.toThrow('Unsafe registry path')
      await expect(resolve('linked.json')).rejects.toThrow('Symlink leaves project root')
    })
  })

  test('remote registry resolution rejects encoded and Windows traversal before network requests', async () => {
    const resolve = remoteResolver('http://127.0.0.1:1/registry')
    for (const target of [
      '../outside.json',
      '%2e%2e/outside.json',
      '%252e%252e%252foutside.json',
      '..\\outside.json',
      'C:\\outside.json',
      '%2foutside.json',
    ])
      await expect(resolve(target)).rejects.toThrow('Unsafe registry path')
  })
})

test('partial aliases retain the same omitted defaults as an absent aliases object', async () => {
  await inProject(async (project) => {
    const selected = join(project, 'config.json')
    await writeFile(selected, '{}')
    const defaults = (await createOrLoadConfig(selected)).aliases
    expect(defaults.componentsDir).toBe('./components')
    expect(defaults.cssDir).toBe('./styles')
    for (const aliases of [{}, { uiDir: './custom/ui' }]) {
      await writeFile(selected, JSON.stringify({ aliases }))
      expect((await createOrLoadConfig(selected)).aliases).toEqual({ ...defaults, ...aliases })
    }
  })
})

test('registry production rejects cycles while preserving shared-child and duplicate-file checks', () => {
  const comp = (name: string, subComponents: string[], files: OutputFile[] = []) => ({
    ...component(files),
    name,
    subComponents,
  })
  const output = (components: OutputComponent[]) => ({ name: 'test', index: [], components })
  expect(() => validateOutput(output([comp('self', ['self'])]))).toThrow(
    'Circular registry dependency'
  )
  expect(() => validateOutput(output([comp('a', ['b']), comp('b', ['a'])]))).toThrow(
    'Circular registry dependency'
  )
  expect(() =>
    validateOutput(
      output([
        comp('root', ['left', 'right']),
        comp('left', ['shared']),
        comp('right', ['shared']),
        comp('shared', [], [file('shared.txt')]),
      ])
    )
  ).not.toThrow()
  expect(() =>
    validateOutput(output([comp('a', ['b'], [file('a.txt')]), comp('b', [], [file('b.txt')])]))
  ).toThrow('Duplicated file')
})

describe('dependency subprocess results', () => {
  const managers = {
    npm: 'i',
    yarn: 'add',
    pnpm: 'add',
    bun: 'add',
    deno: 'add',
    nub: 'add',
    aube: 'add',
  } satisfies Record<PackageManager, string>

  for (const [manager, command] of Object.entries(managers) as [PackageManager, string][]) {
    for (const failedCommand of [1, 2]) {
      test(`${manager} propagates failure from install command ${failedCommand} and never reports success`, async () => {
        const events: string[] = []
        let calls = 0
        const install = createDependencyInstaller({
          getInstalled: async () => ({ dependencies: new Map(), devDependencies: new Map() }),
          getManager: async () => manager,
          confirm: async () => true,
          spinner: () => ({
            ...spinner(),
            start: () => undefined,
            stop: (message) => {
              events.push(message ?? '')
            },
          }),
          run: (_manager, _args, options) => {
            calls++
            return x(
              process.execPath,
              ['-e', `process.exit(${calls === failedCommand ? 37 : 0})`],
              options
            )
          },
        })
        await expect(install({ react: '^19' }, { typescript: '^7' })).rejects.toThrow()
        expect(calls).toBe(failedCommand)
        expect(events).toEqual(['Dependency installation failed.'])
      })
    }

    test(`${manager} adds runtime/dev dependencies and skips existing dependencies`, async () => {
      const calls: { command: string; args: string[]; throwOnError: boolean }[] = []
      const events: string[] = []
      const install = createDependencyInstaller({
        getInstalled: async () => ({
          dependencies: new Map([['existing', '^1']]),
          devDependencies: new Map(),
        }),
        getManager: async () => manager,
        confirm: async () => true,
        spinner: () => ({
          ...spinner(),
          start: () => undefined,
          stop: (message) => {
            events.push(message ?? '')
          },
        }),
        run: async (command, args, options) => {
          calls.push({ command, args, ...options })
        },
      })
      await install(
        { existing: '^1', react: '^19' },
        { existing: '^1', react: '^18', typescript: '^7' }
      )
      expect(calls).toEqual([
        {
          command: manager,
          args: [
            command,
            'react@^19',
            ...(manager === 'npm' || manager === 'pnpm' ? ['--save-prod'] : []),
          ],
          throwOnError: true,
        },
        { command: manager, args: [command, 'typescript@^7', '-D'], throwOnError: true },
      ])
      expect(events).toEqual(['Dependencies installed.'])
    })
  }
})

test('add loads the supplied global config and retains its aliases without creating default config', async () => {
  await inProject(async (project) => {
    const customConfig = join(project, 'custom.json')
    await writeFile(customConfig, JSON.stringify(config))
    for (const args of [
      ['--config', customConfig, 'add', 'metal-fx'],
      ['add', 'metal-fx', '--config', customConfig],
    ]) {
      let installed: LoadedConfig | undefined
      let names: string[] | undefined
      await createProgram({
        loadConfig: async (selected) => {
          expect(selected).toBe(customConfig)
          return createOrLoadConfig(selected)
        },
        add: async (selected, _resolver, loaded) => {
          names = selected
          installed = loaded
        },
      }).parseAsync(args, { from: 'user' })
      expect(names).toEqual(['metal-fx'])
      expect(installed).toEqual(config)
    }
    expect(
      await access(join(project, 'cli.json')).then(
        () => true,
        () => false
      )
    ).toBe(false)
    expect(await readdir(project)).toEqual(['custom.json'])
  })
})
