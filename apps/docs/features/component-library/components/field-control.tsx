import { Select } from '@livenui/agent-ui'
import type { Library } from '../lib/config'
import { fieldLabel, optionLabel } from '../lib/content'

export function FieldControl({
  field,
  value,
  set,
  label = fieldLabel(field.name),
  choices,
}: {
  field: Library['fields'][number]
  value: unknown
  set: (value: unknown) => void
  label?: string
  choices?: (string | number)[]
}) {
  const id = `prop-${field.name}`
  if (choices?.length)
    return (
      <fieldset
        className="field field-choice"
        aria-label={label}
        data-wide={choices.length > 3 || undefined}
      >
        <legend title={field.description}>{label}</legend>
        <div className="field-options">
          {choices.map((option) => (
            <label className="field-option" key={String(option)}>
              <input
                type="radio"
                name={id}
                value={String(option)}
                checked={value === option}
                onChange={() => set(option)}
              />
              <span>{optionLabel(field.name, option)}</span>
            </label>
          ))}
        </div>
        {value !== undefined && !choices.includes(value as string | number) && (
          <p className="helper-text">Custom value: {String(value).slice(0, 80)}</p>
        )}
      </fieldset>
    )
  if (field.kind === 'select')
    return (
      <div className="field field-inline">
        <label htmlFor={id} title={field.description}>
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
        <label htmlFor={id} title={field.description}>
          {label}
        </label>
        <span className="field-toggle">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(event) => set(event.target.checked)}
          />
          <span className="field-toggle-track" aria-hidden="true" />
        </span>
      </div>
    )
  if (field.kind === 'number')
    return (
      <div className="field field-inline field-number">
        <label htmlFor={id} title={field.description}>
          {label}
        </label>
        <input
          id={id}
          type="number"
          step="any"
          min="-10000"
          max="10000"
          placeholder="Default"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            set(event.target.value === '' ? undefined : Number(event.target.value))
          }
        />
      </div>
    )
  return (
    <div className="field field-inline">
      <label htmlFor={id} title={field.description}>
        {label}
      </label>
      <input
        id={id}
        placeholder="Default"
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => set(event.target.value || undefined)}
      />
    </div>
  )
}
