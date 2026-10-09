import { useId, useState } from 'react'
import type { Props } from '../lib/config'
import type { Theme } from '../lib/types'
import { AvatarChatThumbnail } from './avatar-chat-thumbnail'

export function AvatarChatRow({
  label,
  preview,
  avatarProps,
  theme,
  selected,
  motionEnabled,
  disabled,
  onSelect,
}: {
  label: string
  preview: string
  avatarProps: Props
  theme: Theme
  selected: boolean
  motionEnabled: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const previewId = useId()
  return (
    <button
      type="button"
      aria-label={label}
      aria-describedby={previewId}
      aria-current={selected ? 'true' : undefined}
      disabled={disabled}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={onSelect}
    >
      <AvatarChatThumbnail
        props={avatarProps}
        theme={theme}
        animated={motionEnabled && (selected || (!disabled && (hovered || focused)))}
      />
      <span className="avatar-chat-list-label">
        <span className="avatar-chat-list-title">{label}</span>
        <span id={previewId} className="avatar-chat-list-preview">
          {preview}
        </span>
      </span>
    </button>
  )
}
