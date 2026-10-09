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

export const AvatarChatThumbnail = memo(
  function AvatarChatThumbnail({ props, theme }: { props: Props; theme: 'light' | 'dark' }) {
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
            }}
            theme={theme}
            paused
            showcase
          />
        </PreviewBoundary>
      </span>
    )
  },
  (previous, next) =>
    previous.theme === next.theme &&
    identityKeys.every((key) => previous.props[key] === next.props[key])
)
