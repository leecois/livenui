import { BotAvatar, type BotAvatarProps } from 'bot-avatars'
import type { PreviewProps } from '../components/preview'

export default function Renderer({ props, paused, theme }: PreviewProps) {
  return (
    <div className="avatar-demo">
      <BotAvatar
        {...(props as BotAvatarProps)}
        theme={theme}
        paused={paused}
        aria-label={`${String(props.type ?? 'clover')} bot avatar`}
      />
    </div>
  )
}
