import { describe, expect, test } from 'bun:test'
import { createRequire } from 'node:module'
import type { OrbState } from 'thinking-orbs'
import { MODE_FRAMES, resolvePreset, STATE_TO_MODE } from 'thinking-orbs'

const require = createRequire(import.meta.url)
const surfaces = {
  'border-beam': 'BorderBeam',
  'thinking-orbs': 'ThinkingOrb',
  'metal-fx': 'MetalFx',
  'liquid-gooey': 'Liquid',
  'voice-glow': 'VoiceBeam',
  'img-fx': 'ImageGeneration',
  'bot-avatars': 'BotAvatar',
}

describe('ported package contracts', () => {
  test('all packages expose usable ESM and CJS entries', async () => {
    for (const [name, component] of Object.entries(surfaces)) {
      expect((await import(name))[component]).toBeDefined()
      expect(require(name)[component]).toBeDefined()
    }
    expect(require('thinking-orbs/engine').MODE_FRAMES).toBeDefined()
  })
  test('all nine orb states produce finite frames at all three supported sizes', () => {
    expect(Object.keys(STATE_TO_MODE)).toHaveLength(9)
    const inspect = (value: unknown): void => {
      if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true)
      else if (value && typeof value === 'object')
        for (const item of Object.values(value)) inspect(item)
    }
    for (const state of Object.keys(STATE_TO_MODE) as OrbState[]) {
      for (const size of [20, 32, 64] as const) {
        const resolved = resolvePreset(state, size)
        expect(resolved.speed).toBeGreaterThan(0)
        const frame = MODE_FRAMES[resolved.mode](size, 1.25, resolved.opts)
        expect(frame.dots.length + frame.lines.length).toBeGreaterThan(0)
        inspect(frame)
      }
    }
  })
})
