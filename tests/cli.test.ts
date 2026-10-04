import { describe, expect, test } from 'bun:test'
import { access, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spinner } from '@clack/prompts'
import { x } from 'tinyexec'
import { createOrLoadConfig, type LoadedConfig } from '../packages/cli/src/config'
import { createProgram } from '../packages/cli/src/program'
import type { OutputComponent, OutputFile } from '../packages/cli/src/registry/schema'
import {
  createComponentInstaller,
  localResolver,
  remoteResolver,
} from '../packages/cli/src/utils/add/install-component'
import { createDependencyInstaller } from '../packages/cli/src/utils/add/install-deps'

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
      expect(await readdir(join(project, 'src'))).toEqual(['existing.txt', 'linked'])
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

describe('dependency subprocess results', () => {
  for (const failedCommand of [1, 2]) {
    test(`propagates failure from install command ${failedCommand} and never reports success`, async () => {
      const events: string[] = []
      let calls = 0
      const install = createDependencyInstaller({
        getInstalled: async () => new Map(),
        getManager: async () => 'bun',
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

  test('successful installs preserve runtime/dev flags and skip existing dependencies', async () => {
    const calls: { command: string; args: string[]; throwOnError: boolean }[] = []
    const events: string[] = []
    const install = createDependencyInstaller({
      getInstalled: async () => new Map([['existing', '^1']]),
      getManager: async () => 'bun',
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
    await install({ existing: '^1', react: '^19' }, { typescript: '^7' })
    expect(calls).toEqual([
      { command: 'bun', args: ['install', 'react@^19'], throwOnError: true },
      { command: 'bun', args: ['install', 'typescript@^7', '-D'], throwOnError: true },
    ])
    expect(events).toEqual(['Dependencies installed.'])
  })
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
