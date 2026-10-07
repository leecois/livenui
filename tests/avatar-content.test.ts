import { expect, test } from 'bun:test'
import { avatarColors } from '../apps/docs/features/component-library/lib/content'
import { botAvatarPalette } from '../packages/bot-avatars/src/presets'

test('quick avatar colors use the retained SDK palette and supported hex syntax', () => {
  const colors = Object.values(botAvatarPalette)
  expect(new Set(avatarColors.map((color) => color.value)).size).toBe(avatarColors.length)
  for (const color of avatarColors) {
    expect(colors).toContain(color.value)
    expect(color.value).toMatch(/^#[0-9a-f]{6}$/i)
  }
})
