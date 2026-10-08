import { useState } from 'react'
import type { Library, Props } from '../lib/config'
import { avatarColors, fieldLabel, optionLabel } from '../lib/content'
import { booleanDefault, isColorField, numberSpec } from '../lib/controls'
import { ChoiceField } from './choice-field'
import { ColorControl } from './color-control'
import { NumberControl } from './number-control'

export function FieldControl({
  field,
  value,
  set,
  label = fieldLabel(field.name),
  choices: quickChoices,
  library,
  onDraft,
}: {
  field: Library['fields'][number]
  value: unknown
  set: (value: unknown) => void
  label?: string
  choices?: (string | number)[]
  library: Library
  onDraft: () => void
}) {
  const id = `prop-${field.name}`
  const [customSize, setCustomSize] = useState(false)
  if (library.id === 'gooey' && field.name === 'item' && quickChoices) {
    const item = (value ?? {}) as Props
    return (
      <ChoiceField
        className="field-liquid-behavior"
        label={label}
        description={field.description}
        value={item.effect ?? 'morph'}
        options={quickChoices.map((effect) => ({
          value: effect,
          label: optionLabel('effect', effect),
        }))}
        onChange={(effect) => set({ ...item, effect })}
      />
    )
  }
  const sizeSpec =
    library.id === 'avatars' && field.name === 'size' ? numberSpec(library, 'size') : undefined
  const selected =
    value === undefined && library.id === 'avatars' && ['hat', 'glasses'].includes(field.name)
      ? 'none'
      : value
  const choices = quickChoices || (field.kind === 'select' ? field.options : undefined)
  if (choices?.length)
    return (
      <ChoiceField
        label={label}
        description={field.description}
        value={
          sizeSpec && (customSize || (value !== undefined && !choices.includes(value as number)))
            ? 'custom-size'
            : selected
        }
        onDefault={field.kind === 'select' ? () => set(undefined) : undefined}
        options={[
          ...choices.map((option) => ({
            value: option,
            label: optionLabel(field.name, option),
            icon:
              sizeSpec && typeof option === 'number' ? (
                <svg className="size-preview" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r={option / 16} fill="currentColor" />
                </svg>
              ) : undefined,
          })),
          ...(sizeSpec ? [{ value: 'custom-size', label: 'Custom' }] : []),
        ]}
        onChange={(option) => {
          if (sizeSpec && option === 'custom-size') {
            onDraft()
            setCustomSize(true)
          } else {
            setCustomSize(false)
            set(option)
          }
        }}
      >
        {sizeSpec &&
          (customSize || (value !== undefined && !choices.includes(value as number))) && (
            <NumberControl
              name={field.name}
              label="Custom size"
              description={field.description}
              value={value}
              spec={sizeSpec}
              set={set}
              onDraft={onDraft}
              allowLength
            />
          )}
        {!sizeSpec && value !== undefined && !choices.includes(value as string | number) && (
          <p className="helper-text">Custom value: {String(value).slice(0, 80)}</p>
        )}
      </ChoiceField>
    )
  if (field.kind === 'boolean')
    return (
      <div className="field field-switch">
        <label className="field-heading" htmlFor={id} title={field.description}>
          {label}
        </label>
        <div className="switch-row">
          <span className="switch-status" aria-hidden="true">
            {value === undefined ? 'Auto · ' : ''}
            {(value === undefined ? booleanDefault(library, field.name) : value === true)
              ? 'On'
              : 'Off'}
          </span>
          <span className="field-toggle">
            <input
              id={id}
              type="checkbox"
              checked={value === undefined ? booleanDefault(library, field.name) : value === true}
              onChange={(event) => set(event.target.checked)}
            />
            <span className="field-toggle-track" aria-hidden="true" />
          </span>
        </div>
      </div>
    )
  const spec = numberSpec(library, field.name)
  if (field.kind === 'number' && spec)
    return (
      <NumberControl
        name={field.name}
        label={label}
        description={field.description}
        value={value}
        spec={spec}
        set={set}
        onDraft={onDraft}
      />
    )
  if (isColorField(field))
    return (
      <ColorControl
        name={field.name}
        label={label}
        description={field.description}
        value={value}
        set={set}
        onDraft={onDraft}
        format={library.id === 'orbs' ? 'rgb' : library.id === 'avatars' ? 'rgb-hsl' : 'css'}
        palette={library.id === 'avatars' && field.name === 'color' ? avatarColors : undefined}
      />
    )
  return (
    <div className="field field-text">
      <div className="text-row">
        <label className="field-heading text-heading" htmlFor={id} title={field.description}>
          {label}
        </label>
        <input
          id={id}
          placeholder="Default"
          title={typeof value === 'string' ? value : 'Use component default'}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => set(event.target.value || undefined)}
        />
      </div>
    </div>
  )
}
