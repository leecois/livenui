import { Select } from '@livenui/agent-ui'
import { useState } from 'react'
import type { Library } from '../lib/config'
import { fieldLabel, optionLabel } from '../lib/content'
import { booleanDefault, isColorField, numberSpec } from '../lib/controls'
import { ColorControl } from './color-control'
import { NumberControl } from './number-control'

export function FieldControl({
  field,
  value,
  set,
  label = fieldLabel(field.name),
  choices,
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
  const sizeSpec =
    library.id === 'avatars' && field.name === 'size' ? numberSpec(library, 'size') : undefined
  if (choices?.length)
    return (
      <fieldset
        className="field field-choice"
        aria-label={label}
        data-wide={choices.length > 3 || undefined}
      >
        <legend className="field-heading" title={field.description}>
          {label}
        </legend>
        <div className="field-options">
          {choices.map((option) => (
            <label className="field-option" key={String(option)}>
              <input
                type="radio"
                name={id}
                value={String(option)}
                checked={value === option && (!sizeSpec || !customSize)}
                onChange={() => {
                  setCustomSize(false)
                  set(option)
                }}
              />
              <span>{optionLabel(field.name, option)}</span>
            </label>
          ))}
          {sizeSpec && (
            <label className="field-option">
              <input
                type="radio"
                name={id}
                checked={customSize || (value !== undefined && !choices.includes(value as number))}
                onChange={() => {
                  onDraft()
                  setCustomSize(true)
                }}
              />
              <span>Custom</span>
            </label>
          )}
        </div>
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
      </fieldset>
    )
  if (field.kind === 'select')
    return (
      <div className="field field-select">
        <label className="field-heading" htmlFor={id} title={field.description}>
          {label}
        </label>
        <Select
          id={id}
          value={value === undefined ? '' : String(value)}
          onChange={(event) => {
            const next = field.options.find((option) => String(option) === event.target.value)
            set(next)
          }}
        >
          <option value="">Use default</option>
          {field.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {optionLabel(field.name, option)}
            </option>
          ))}
        </Select>
      </div>
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
      />
    )
  return (
    <div className="field field-text">
      <label className="field-heading" htmlFor={id} title={field.description}>
        {label}
      </label>
      <div className="text-row">
        <input
          id={id}
          placeholder="Default"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => set(event.target.value || undefined)}
        />
      </div>
    </div>
  )
}
