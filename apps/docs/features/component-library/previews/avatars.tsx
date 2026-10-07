import { BotAvatar, type BotAvatarProps } from 'bot-avatars'
import type { PreviewProps } from '../components/preview'
import { optionLabel } from '../lib/content'

export default function Renderer({ props, paused, theme, showcase }: PreviewProps) {
  const type = String(props.type ?? 'clover')
  const avatar = (
    <BotAvatar
      {...(props as BotAvatarProps)}
      theme={theme}
      paused={paused}
      aria-label={`${type} bot avatar`}
    />
  )
  if (showcase) return avatar
  return (
    <div className="avatar-demo">
      {avatar}
      <div className="avatar-identity">
        <span className="eyebrow">YOUR BOT</span>
        <h3>{optionLabel('type', type)} bot</h3>
        <span className="avatar-activity">
          {optionLabel('state', String(props.state ?? 'default'))}
        </span>
      </div>
    </div>
  )
}
