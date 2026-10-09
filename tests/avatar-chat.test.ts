import { expect, test } from 'bun:test'
import {
  avatarChatExamples,
  avatarChatPreview,
  avatarDemoReply,
  avatarHelperProps,
  avatarHelpers,
  avatarOutfits,
  selectedOutfit,
} from '../apps/docs/features/component-library/lib/avatar-chat'
import { libraries, parseProps } from '../apps/docs/features/component-library/lib/config'

const library = libraries.find((item) => item.id === 'avatars')
if (!library) throw new Error('Missing avatar library')

test('every outfit is distinct and validates against retained avatar component props', () => {
  expect(selectedOutfit({})).toBe('Resting')
  expect(new Set(avatarOutfits.map((item) => item.name)).size).toBe(18)
  for (const { name, ...props } of avatarOutfits) {
    expect(parseProps(JSON.stringify(props), library)).toEqual(props)
    expect(selectedOutfit(props)).toBe(name)
  }
})

test('chat examples have unique topics, known outfits and deterministic local replies', () => {
  expect(new Set(avatarChatExamples.map((item) => item.title)).size).toBe(20)
  for (const example of avatarChatExamples) {
    expect(avatarOutfits.some((item) => item.name === example.outfit)).toBe(true)
    expect(avatarDemoReply(` ${example.prompt.toUpperCase()} `, 'Test bot')).toBe(example.reply)
    expect(example.reply.length).toBeGreaterThan(0)
  }
  expect(avatarDemoReply('A custom message', 'Support buddy')).toContain('Support buddy')
})

test('every helper has a role description and a valid native outfit and color', () => {
  expect(new Set(avatarHelpers.map((item) => item.outfit))).toEqual(
    new Set(avatarOutfits.map((item) => item.name))
  )
  for (const helper of avatarHelpers) {
    const props = avatarHelperProps(helper.outfit)
    expect(parseProps(JSON.stringify(props), library)).toEqual(props)
    expect(selectedOutfit(props)).toBe(helper.outfit)
    expect(helper.description.length).toBeGreaterThan(0)
    expect(props.color).toMatch(/^#[0-9A-F]{6}$/)
  }
  expect(avatarHelperProps('Unknown')).toEqual({})
})

test('chat previews use the latest nonempty message without inventing reply content', () => {
  expect(avatarChatPreview([], 'Starter prompt')).toBe('Starter prompt')
  expect(avatarChatPreview([{ text: 'User question' }, { text: '' }])).toBe('User question')
  expect(
    avatarChatPreview([{ text: 'User question' }, { text: ' First line\n\nNext\tline ' }])
  ).toBe('First line Next line')
  expect(avatarChatPreview([{ text: 'Response stopped.' }, { text: ' \n ' }])).toBe(
    'Response stopped.'
  )
  expect(
    avatarChatPreview([{ text: 'Previous reply' }, { text: 'A follow-up' }, { text: '' }])
  ).toBe('A follow-up')
})
