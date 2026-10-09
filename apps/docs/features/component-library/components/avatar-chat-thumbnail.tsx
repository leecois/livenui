import { memo } from 'react'
import type { Props } from '../lib/config'
import { Preview, PreviewBoundary } from './preview'

const identityKeys = [
  'type',
  'path',
  'face',
  'color',
  'ink',
  'brightness',
  'saturation',
  'hat',
  'glasses',
  'headphones',
  'bowTie',
  'accessoryColor',
] as const

const restingPose = { yaw: 0, pitch: 0, roll: 0 }

export const AvatarChatThumbnail = memo(
  function AvatarChatThumbnail({
    props,
    theme,
    animated,
  }: {
    props: Props
    theme: 'light' | 'dark'
    animated: boolean
  }) {
    return (
      <span className="avatar-chat-list-icon avatar-chat-thumbnail" aria-hidden="true" inert>
        <PreviewBoundary>
          <Preview
            id="avatars"
            props={{
              ...Object.fromEntries(identityKeys.map((key) => [key, props[key]])),
              size: 32,
              shading: 'flat',
              interactive: false,
              speed: 0.8,
              turn: 0.35,
              jumpEvery: 0,
              pose: animated ? undefined : restingPose,
            }}
            theme={theme}
            paused={animated ? undefined : true}
            showcase
          />
        </PreviewBoundary>
      </span>
    )
  },
  (previous, next) =>
    previous.theme === next.theme &&
    previous.animated === next.animated &&
    identityKeys.every((key) => previous.props[key] === next.props[key])
)
