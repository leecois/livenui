import { expect, test } from 'bun:test'
import {
  configuredLibrary,
  libraries,
  parseProps,
  readPresets,
  snippet,
} from '../apps/docs/features/component-library/lib/config'
import { content, optionLabel } from '../apps/docs/features/component-library/lib/content'
import {
  avatarContexts,
  examples,
  findExample,
} from '../apps/docs/features/component-library/lib/examples'

test('component starting points and agent contexts use valid local examples and public labels', () => {
  for (const library of libraries) {
    const featured = content[library.id].featured
    expect(featured.length).toBeGreaterThanOrEqual(3)
    expect(featured.length).toBeLessThanOrEqual(4)
    for (const id of featured) expect(findExample(library.id, id)?.library).toBe(library.id)
  }
  for (const { example } of avatarContexts) {
    const library = libraries.find((item) => item.id === example.library)
    if (!library) throw new Error('Missing avatar library')
    expect(parseProps(JSON.stringify(example.props), library)).toEqual(example.props)
  }
  expect(optionLabel('state', 'default')).toBe('Idle')
  expect(optionLabel('size', 96)).toBe('96px')
})

test('every gallery example can be imported, persisted and exported for its selected component', () => {
  expect(new Set(examples.map((example) => example.id)).size).toBe(examples.length)
  for (const example of examples) {
    const library = libraries.find((library) => library.id === example.library)
    if (!library) throw new Error(`Unknown example library: ${example.id}`)
    const configured = configuredLibrary(library, example.variant)
    expect(parseProps(JSON.stringify(example.props), configured)).toEqual(example.props)
    const preset = { ...example, name: example.name }
    expect(readPresets({ getItem: () => JSON.stringify([preset]) })).toEqual([preset])
    expect(snippet(configured, example.props)).toMatch(
      new RegExp(`import \\{[^}]*\\b${configured.component}\\b[^}]*\\}`)
    )
    expect(findExample(library.id, example.id)).toBe(example)
  }
  expect(findExample('orbs', 'metal-text')).toBeUndefined()
  expect(findExample('orbs', 'missing')).toBeUndefined()
})
