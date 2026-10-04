import { expect, test } from 'bun:test'
import { libraries } from '../apps/docs/features/component-library/lib/config'
import {
  content,
  installCommand,
  matchesSearch,
  orderExamples,
  searchExamples,
} from '../apps/docs/features/component-library/lib/content'
import { examples } from '../apps/docs/features/component-library/lib/examples'

test('every library has a use case, an interaction hint and valid essential controls', () => {
  for (const library of libraries) {
    expect(content[library.id].purpose.length).toBeGreaterThan(0)
    expect(content[library.id].hint.length).toBeGreaterThan(0)
    const fields = [...library.fields, ...library.variants.flatMap((variant) => variant.fields)]
    for (const name of content[library.id].controls) {
      expect(fields.some((field) => field.name === name)).toBe(true)
    }
  }
})

test('example discovery supports public names, use cases, combined words and library filters', () => {
  expect(searchExamples(examples, libraries, 'all', '')).toHaveLength(83)
  const avatars = searchExamples(examples, libraries, 'all', '  BOT   AVATARS ')
  expect(avatars.length).toBeGreaterThan(0)
  expect(avatars.every((example) => example.library === 'avatars')).toBe(true)
  const audio = searchExamples(examples, libraries, 'all', 'audio')
  expect(audio.length).toBeGreaterThan(0)
  expect(audio.every((example) => example.library === 'voice')).toBe(true)
  expect(searchExamples(examples, libraries, 'metal', 'audio')).toEqual([])
  const text = searchExamples(examples, libraries, 'metal', 'text')
  expect(text.length).toBeGreaterThan(0)
  expect(text.every((example) => example.library === 'metal')).toBe(true)
  expect(searchExamples(examples, libraries, 'all', 'no matching component')).toEqual([])
  expect(matchesSearch('  speech audio ', 'Visualize audio', 'Speech input')).toBe(true)
})

test('installation commands consume Liven UI source for every supported package manager', () => {
  const image = libraries.find((library) => library.id === 'image')
  const orbs = libraries.find((library) => library.id === 'orbs')
  if (!image || !orbs) throw new Error('Missing component library')
  expect(installCommand(image, 'npm')).toBe(
    'npx shadcn@latest add http://localhost:3000/r/image.json'
  )
  expect(installCommand(image, 'pnpm')).toBe(
    'pnpm dlx shadcn@latest add http://localhost:3000/r/image.json'
  )
  expect(installCommand(image, 'bun')).toBe(
    'bunx shadcn@latest add http://localhost:3000/r/image.json'
  )
  expect(installCommand(orbs, 'npm')).toBe(
    'npx shadcn@latest add http://localhost:3000/r/orbs.json'
  )
})

test('the initial gallery batch represents all seven libraries without losing examples', () => {
  const ordered = orderExamples(examples)
  expect(new Set(ordered.slice(0, 12).map((example) => example.library)).size).toBe(7)
  expect(new Set(ordered.map((example) => example.id))).toEqual(
    new Set(examples.map((example) => example.id))
  )
  expect(ordered).toHaveLength(83)
})

test('developers can find examples by their public component import names', () => {
  for (const library of libraries) {
    for (const variant of library.variants) {
      const matches = searchExamples(examples, libraries, 'all', variant.component)
      expect(matches.length).toBeGreaterThan(0)
      expect(
        matches.some((example) => example.library === library.id && example.variant === variant.id)
      ).toBe(true)
    }
  }
  expect(
    searchExamples(examples, libraries, 'all', 'MetalText').map((example) => example.id)
  ).toEqual(['metal-text'])
})
