import { expect, test } from 'bun:test'
import {
  libraries,
  parseConfiguration,
  parseProps,
  readPresets,
  studioHref,
} from '../apps/docs/features/component-library/lib/config'
import {
  orbRenderCost,
  validateOrbConfiguration,
} from '../apps/docs/features/component-library/lib/orb-limits'
import { scaleCounts } from '../packages/thinking-orbs/src/engine/profiles'
import { MODE_FRAMES } from '../packages/thinking-orbs/src/engine/registry'
import { resolvePreset, STATE_TO_MODE } from '../packages/thinking-orbs/src/presets'
import type { OrbState } from '../packages/thinking-orbs/src/types'

const orb = libraries.find((library) => library.id === 'orbs')
if (!orb) throw new Error('Missing Orb library fixture')

test('Orb resource limits cover imported props, shared configurations and stored presets', () => {
  const invalid = [
    { state: 'connecting', dots: 10000 },
    { state: 'connecting', opts: { nodeN: 10000 } },
    { state: 'connecting', opts: { nodeN: -2 } },
    { state: 'working', opts: { nodeN: -2 } },
    { state: 'solving', opts: { moveCount: 1.5 } },
    { state: 'searching', opts: { latRings: 0 } },
    { state: 'listening', opts: { rings: 0 } },
    { state: 'working', opts: { orbitN: 1000, ghostN: 1000 } },
    { state: 'searching', opts: { latRings: 1000, lonDensity: 1000 } },
    { state: 'solving', opts: { latRings: 999, lonDensity: 0, moveCount: 10000 } },
    { state: 'weaving', opts: { strandN: 10000 } },
    { state: 'composing', opts: { lanes: 1000, segs: 1000 } },
    { state: 'breathing', opts: { lanes: 10000, segs: 0, bandMul: 10000 } },
    { state: 'shaping', opts: { iconD: 10000 } },
    { state: 'shaping', speed: -1 },
    { dots: -1 },
  ]
  for (const props of invalid) {
    const text = JSON.stringify(props)
    expect(() => parseProps(text, orb), text).toThrow()
    expect(() => parseConfiguration(JSON.stringify({ props }), orb), text).toThrow()
    expect(() => studioHref(orb, props, 'ring'), text).toThrow()
    expect(
      readPresets({
        getItem: () => JSON.stringify([{ id: 'unsafe', name: 'Unsafe', library: 'orbs', props }]),
      })
    ).toEqual([])
  }
})

test('Orb budgets preserve moderate custom values and revalidate changed states', () => {
  for (const props of [
    { state: 'working', dots: 4, opts: { custom: 1 } },
    { state: 'connecting', dots: 3, opts: { nodeN: 100, signals: 0 } },
    { state: 'solving', opts: { moveCount: 24, latRings: 10, lonDensity: 32 } },
    { state: 'composing', opts: { bandMul: 1.5, lanes: 8, segs: 120, ghostN: 0 } },
    { state: 'shaping', opts: { iconD: 2.5 } },
    { state: 'working', speed: -1 },
    { state: 'shaping', speed: 0 },
  ])
    expect(parseProps(JSON.stringify(props), orb)).toEqual(props)
  const props = { state: 'searching', dots: 6 }
  expect(() => validateOrbConfiguration(props)).not.toThrow()
  expect(() => validateOrbConfiguration({ ...props, state: 'connecting' })).toThrow(
    'Orb configuration exceeds the playground render budget.'
  )
  expect(() => validateOrbConfiguration({ ...props, state: 'working' })).toThrow(
    'Orb configuration exceeds the playground render budget.'
  )
  expect(() => validateOrbConfiguration({ state: 'working', speed: -1 })).not.toThrow()
  expect(() => validateOrbConfiguration({ state: 'shaping', speed: -1 })).toThrow(
    'Shaping orbs require a non-negative speed'
  )
})

test('negative shaping time reaches an invalid native morph path before validation', () => {
  const { mode, opts } = resolvePreset('shaping', 64)
  expect(() => MODE_FRAMES[mode](64, -0.6, opts)).toThrow(TypeError)
  expect(() => parseProps('{"state":"shaping","speed":-1}', orb)).toThrow(
    'Shaping orbs require a non-negative speed'
  )
})

test('Orb cost bounds cover real presets across all states, sizes and ordinary densities', () => {
  for (const state of Object.keys(STATE_TO_MODE) as OrbState[]) {
    for (const size of [20, 32, 64] as const) {
      for (const dots of [0.1, 1, 3]) {
        const props = { state, size, dots }
        expect(() => validateOrbConfiguration(props)).not.toThrow()
        const { mode, opts } = resolvePreset(state, size)
        const effective = dots === 1 ? opts : scaleCounts(opts, dots)
        const frame = MODE_FRAMES[mode](size, 0.6, effective)
        const upper = orbRenderCost(props)
        const actual = orbRenderCost({ ...props, opts: effective })
        expect(upper.marks).toBeGreaterThanOrEqual(frame.dots.length + frame.lines.length)
        expect(upper.marks).toBeGreaterThanOrEqual(actual.marks)
        expect(upper.pairs).toBeGreaterThanOrEqual(actual.pairs)
        expect(upper.iterations).toBeGreaterThanOrEqual(actual.iterations)
      }
    }
  }
})
