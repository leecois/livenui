import { BotAvatar, type BotAvatarProps } from 'bot-avatars'
import type { PreviewProps } from '../components/preview'

export default function Renderer({ props, paused, theme, onPropsChange }: PreviewProps) {
  return (
    <div className="avatar-demo">
      <BotAvatar
        {...(props as BotAvatarProps)}
        theme={theme}
        paused={paused}
        aria-label={`${String(props.type ?? 'clover')} bot avatar`}
      />
      <p className="demo-note">Move your pointer to look around. Click to hop.</p>
      {onPropsChange && (
        <fieldset className="demo-actions" aria-label="Avatar activity">
          {['default', 'working', 'sleeping'].map((state) => (
            <button
              key={state}
              type="button"
              className="pill"
              aria-pressed={(props.state ?? 'default') === state}
              onClick={() => onPropsChange('state', state)}
            >
              {state === 'default' ? 'Idle' : state === 'working' ? 'Working' : 'Sleeping'}
            </button>
          ))}
        </fieldset>
      )}
    </div>
  )
}
