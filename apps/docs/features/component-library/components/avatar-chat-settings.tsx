import { SelectionTrack } from '@livenui/agent-ui'
import { useId } from 'react'
import type { PlaygroundState } from '../hooks/use-playground'
import { avatarHelpers, avatarOutfits, selectedOutfit } from '../lib/avatar-chat'
import type { Library } from '../lib/config'
import { content } from '../lib/content'
import type { Theme } from '../lib/types'
import { AvatarShapeControl } from './avatar-shape-control'
import { ChoiceField } from './choice-field'
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
    <fieldset className="field field-choice avatar-chat-choice" aria-label={label}>
      <legend className="sr-only">{label}</legend>
      <div className="choice-row">
        <span className="field-heading" aria-hidden="true">
          {label}
        </span>
        <SelectionTrack className="field-options">
          {options.map((option) => (
            <label className="field-option" key={option}>
              <input
                type="radio"
                name={id}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </SelectionTrack>
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
  theme,
}: {
  library: Library
  state: PlaygroundState
  online: boolean
  connect: (value: boolean) => void
  replies: string
  setReplies: (value: string) => void
  theme: Theme
}) {
  const outfit = selectedOutfit(state.props)
  const field = (name: string) => {
    const field = library.fields.find((item) => item.name === name)
    return field && name === 'type' ? (
      <AvatarShapeControl
        key={`${name}-${state.controlVersion}`}
        field={field}
        value={state.props[name]}
        set={(value) => state.update(name, value)}
        theme={theme}
      />
    ) : field ? (
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
    <div className="avatar-chat-settings-fields avatar-chat-settings-groups">
      <section className="avatar-chat-settings-fields" aria-label="Character">
        <h3>Character</h3>
        {field('type')}
        <ChoiceField
          label="Outfit"
          value={outfit ?? ''}
          limit={6}
          options={avatarOutfits.map((outfit) => ({
            value: outfit.name,
            label: outfit.name,
            description: avatarHelpers.find((helper) => helper.outfit === outfit.name)?.description,
          }))}
          onChange={(value) => {
            const item = avatarOutfits.find((item) => item.name === value)
            if (!item) return
            for (const name of ['hat', 'glasses', 'headphones', 'bowTie'] as const)
              state.update(name, item[name])
          }}
        >
          {!outfit && <p className="helper-text">Custom outfit</p>}
        </ChoiceField>
        {field('color')}
      </section>
      <section className="avatar-chat-settings-fields" aria-label="Animation">
        {field('state')}
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
        </div>
      </section>
      <section className="avatar-chat-settings-fields" aria-label="Chat demo">
        <h3>Chat demo</h3>
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
        <p className="helper-text">Connection is simulated.</p>
      </section>
      <details className="avatar-chat-appearance">
        <summary>Appearance & motion</summary>
        <div className="avatar-chat-settings-fields">
          {[
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
      <button type="button" className="text-button" onClick={state.reset}>
        Reset appearance
      </button>
    </div>
  )
}
