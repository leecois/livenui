import { expect, test } from 'bun:test'
import {
  configuredLibrary,
  libraries,
  parseProps,
} from '../apps/docs/features/component-library/lib/config'
import {
  controlVisible,
  numberError,
  numberSpec,
  snapNumber,
} from '../apps/docs/features/component-library/lib/controls'

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing control metadata')
  return value
}

test('every numeric control has a usable drag window for its exact component variant', () => {
  for (const library of libraries) {
    for (const variant of library.variants) {
      const configured = configuredLibrary(library, variant.id)
      for (const field of variant.fields.filter((field) => field.kind === 'number')) {
        const spec = numberSpec(configured, field.name)
        expect(spec, `${library.id}/${variant.id}/${field.name}`).toBeDefined()
        if (!spec) continue
        expect(spec.max).toBeGreaterThan(spec.min)
        expect(spec.step).toBeGreaterThan(0)
        expect(numberError(spec.min, spec)).toBeUndefined()
        expect(numberError(spec.max, spec)).toBeUndefined()
        expect(snapNumber(spec.max + 100, spec)).toBeCloseTo(spec.max, 6)
        expect(snapNumber(spec.min - 100, spec)).toBe(spec.min)
      }
    }
  }
})

test('numeric editing separates effective limits from recommended drag windows', () => {
  const metal = required(libraries.find((library) => library.id === 'metal'))
  const image = required(libraries.find((library) => library.id === 'image'))
  expect(numberError(1.01, required(numberSpec(metal, 'strength')))).toBe('Use 1 or less.')
  expect(
    numberError(1.5, required(numberSpec(configuredLibrary(metal, 'text'), 'strength')))
  ).toBeUndefined()
  expect(numberError(2.01, required(numberSpec(image, 'strength')))).toBe('Use 2 or less.')
  const speed = required(numberSpec(image, 'speed'))
  expect(numberError(0, speed)).toBe('Use a number greater than 0.')
  expect(numberError(0.001, speed)).toBeUndefined()
  expect(numberError(8.125, speed)).toBeUndefined()
  expect(numberError(Number.NaN, speed)).toContain('finite')
  expect(numberError(10001, speed)).toContain('10000')
  expect(snapNumber(1.734, speed)).toBe(1.75)
  expect(parseProps('{"strength":3,"speed":8.125}', image)).toEqual({ strength: 3, speed: 8.125 })
})

test('material and look controls hide without removing configuration values', () => {
  const avatar = required(libraries.find((library) => library.id === 'avatars'))
  const voice = required(libraries.find((library) => library.id === 'voice'))
  const fur = required(avatar.fields.find((field) => field.name === 'furLength'))
  const props = { shading: 'plastic', furLength: 1.7 }
  expect(controlVisible(avatar, fur, props)).toBe(false)
  expect(controlVisible(avatar, fur, { ...props, shading: 'fabric' })).toBe(true)
  expect(props.furLength).toBe(1.7)
  const dots = required(voice.fields.find((field) => field.name === 'dotSize'))
  const lines = required(voice.fields.find((field) => field.name === 'lineWidth'))
  expect(controlVisible(voice, dots, { look: 'dots' })).toBe(true)
  expect(controlVisible(voice, lines, { look: 'dots' })).toBe(false)
  expect(controlVisible(voice, lines, { look: 'lines' })).toBe(true)
})

test('integer counts and signed avatar landing timing retain their semantics', () => {
  const avatar = required(libraries.find((library) => library.id === 'avatars'))
  expect(numberError(1.5, required(numberSpec(avatar, 'jumpSpin')))).toBe('Use a whole number.')
  expect(numberError(-0.4, required(numberSpec(avatar, 'jumpLand')))).toBeUndefined()
})

test('Orb exact density editing stays within the playground hard limit', () => {
  const orb = required(libraries.find((library) => library.id === 'orbs'))
  const density = required(numberSpec(orb, 'dots'))
  expect(density.max).toBe(3)
  expect(numberError(4, density)).toBeUndefined()
  expect(numberError(10.01, density)).toBe('Use 10 or less.')
  expect(numberError(0, density)).toBe('Use 0.1 or greater.')
})
