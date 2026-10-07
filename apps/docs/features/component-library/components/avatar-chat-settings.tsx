import { useId } from 'react'
import type { PlaygroundState } from '../hooks/use-playground'
import { avatarOutfits, selectedOutfit } from '../lib/avatar-chat'
import type { Library } from '../lib/config'
import { avatarColors, content } from '../lib/content'
import { FieldControl } from './field-control'

export function ChatChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <fieldset className="avatar-chat-choice" aria-label={label}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              className="avatar-chat-radio"
              type="radio"
              name={id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span className="pill">{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function AvatarChatSettings({
  library,
  state,
  online,
  connect,
  replies,
  setReplies,
}: {
  library: Library
  state: PlaygroundState
  online: boolean
  connect: (value: boolean) => void
  replies: string
  setReplies: (value: string) => void
}) {
  const outfit = selectedOutfit(state.props)
  const id = useId()
  const field = (name: string) => {
    const field = library.fields.find((item) => item.name === name)
    return field ? (
      <FieldControl
        key={`${name}-${state.controlVersion}`}
        library={library}
        field={field}
        value={state.props[name]}
        label={content.avatars.labels?.[name]}
        choices={
          content.avatars.choices?.[name] ||
          (field.kind === 'select' && field.options.length <= 6 ? field.options : undefined)
        }
        set={(value) => state.update(name, value)}
        onDraft={state.editControl}
      />
    ) : null
  }
  return (
    <div className="avatar-chat-settings-fields">
      <fieldset className="avatar-chat-choice avatar-chat-outfits" aria-label="Outfit">
        <legend>Outfit</legend>
        <div>
          {avatarOutfits.map((item, index) => (
            <label key={item.name}>
              <input
                className="avatar-chat-radio"
                type="radio"
                name={id}
                value={item.name}
                checked={outfit === item.name}
                onChange={() => {
                  for (const name of ['hat', 'glasses', 'headphones', 'bowTie'] as const)
                    state.update(name, item[name])
                }}
              />
              <span className="pill">
                <span
                  className="avatar-chat-outfit-dot"
                  aria-hidden="true"
                  style={{ background: avatarColors[index % avatarColors.length].value }}
                />
                {item.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {field('state')}
      {field('color')}
      <ChatChoice
        label="Connection"
        options={['Online', 'Offline']}
        value={online ? 'Online' : 'Offline'}
        onChange={(value) => connect(value === 'Online')}
      />
      <ChatChoice
        label="Replies"
        options={['Stream', 'Instant']}
        value={replies}
        onChange={setReplies}
      />
      <details className="avatar-chat-appearance">
        <summary>Appearance & motion</summary>
        <div className="avatar-chat-settings-fields">
          {[
            'type',
            'shading',
            'face',
            'hat',
            'glasses',
            'headphones',
            'bowTie',
            'speed',
            'interactive',
          ].map(field)}
        </div>
      </details>
      <div className="avatar-chat-playback">
        <button
          type="button"
          className="pill"
          aria-pressed={!state.paused}
          onClick={() => state.setPaused(!state.paused)}
        >
          {state.paused ? 'Play avatar' : 'Pause avatar'}
        </button>
        <button type="button" className="pill" onClick={state.replay}>
          Replay
        </button>
        <button type="button" className="text-button" onClick={state.reset}>
          Reset appearance
        </button>
      </div>
      <p className="helper-text">
        Local chat demo with scripted replies. Connection controls simulate availability. Messages
        stay in this tab.
      </p>
    </div>
  )
}
