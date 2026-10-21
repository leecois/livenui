import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeLivenUIRegistry, writeShadcnRegistry } from '../packages/cli/src/build'
import type { Output, OutputComponent } from '../packages/cli/src/registry/schema'

const component = (name: string, subComponents: string[] = []): OutputComponent => ({
  name,
  subComponents,
  files: [],
  dependencies: {},
  devDependencies: {},
})

const invalidOutputs: [string, OutputComponent[], string][] = [
  ['duplicates', [component('same'), component('same')], 'duplicated component name'],
  [
    'normalized duplicates',
    [component('folder/item'), component('folder/./item')],
    'duplicated component name',
  ],
  ['cycles', [component('first', ['second']), component('second', ['first'])], 'Circular'],
  ['traversal', [component('../escaped')], 'Unsafe registry path'],
  ['file ancestors', [component('foo'), component('foo.json/bar')], 'Conflicting registry output'],
  [
    'reversed normalized ancestors',
    [component('folder/foo.json/./bar'), component('folder/foo')],
    'Conflicting registry output',
  ],
]

for (const format of ['native', 'standard'] as const) {
  for (const cleanDir of [false, true]) {
    for (const [label, components, message] of invalidOutputs) {
      test(`${format} output rejects ${label} before ${cleanDir ? 'cleaning' : 'writing'}`, async () => {
        const root = await mkdtemp(join(tmpdir(), 'livenui-output-'))
        const dir = join(root, 'registry')
        try {
          await mkdir(dir)
          await writeFile(join(dir, 'existing.json'), 'preserve existing output')
          const output: Output = { name: 'test', index: [], components }
          const result =
            format === 'native'
              ? writeLivenUIRegistry(output, { dir, cleanDir, log: false })
              : writeShadcnRegistry(output, {
                  dir,
                  cleanDir,
                  baseUrl: 'https://example.test',
                })
          await expect(result).rejects.toThrow(message)
          expect(await readdir(root)).toEqual(['registry'])
          expect(await readdir(dir)).toEqual(['existing.json'])
          expect(await readFile(join(dir, 'existing.json'), 'utf8')).toBe(
            'preserve existing output'
          )
        } finally {
          await rm(root, { recursive: true, force: true })
        }
      })
    }
  }
}

test('native registry reserves its index filename before cleaning output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'livenui-output-'))
  try {
    await writeFile(join(dir, '_registry.json'), 'preserve existing index')
    for (const name of ['_registry', './_registry', '.\\_registry', '_registry.json/child']) {
      await expect(
        writeLivenUIRegistry(
          { name: 'test', index: [], components: [component(name)] },
          { dir, cleanDir: true, log: false }
        )
      ).rejects.toThrow('Reserved registry component name')
      expect(await readFile(join(dir, '_registry.json'), 'utf8')).toBe('preserve existing index')
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('standard registry conversion errors leave existing output intact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'livenui-output-'))
  try {
    await writeFile(join(dir, 'existing.json'), 'preserve existing output')
    await expect(
      writeShadcnRegistry(
        {
          name: 'test',
          index: [],
          components: [component('parent', ['child']), component('child')],
        },
        { dir, cleanDir: true, baseUrl: 'not-a-url' }
      )
    ).rejects.toThrow()
    expect(await readdir(dir)).toEqual(['existing.json'])
    expect(await readFile(join(dir, 'existing.json'), 'utf8')).toBe('preserve existing output')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
