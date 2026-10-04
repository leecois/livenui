import { Select } from '@livenui/agent-ui'
import type { Library } from '../lib/config'
import { fieldLabel } from '../lib/content'

export function FieldControl({
  field,
  value,
  set,
}: {
  field: Library['fields'][number]
  value: unknown
  set: (value: unknown) => void
}) {
  const id = `prop-${field.name}`
  if (field.kind === 'select')
    return (
      <div className="field">
        <label htmlFor={id} title={field.description}>
          {fieldLabel(field.name)}
        </label>
        <Select
          id={id}
          value={value === undefined ? '' : String(value)}
          onChange={(event) => {
            const next = field.options.find((option) => String(option) === event.target.value)
            set(next)
          }}
        >
          <option value="">Default</option>
          {field.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    )
  if (field.kind === 'boolean')
    return (
      <div className="field field-switch">
        <label htmlFor={id} title={field.description}>
          {fieldLabel(field.name)}
        </label>
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(event) => set(event.target.checked)}
        />
      </div>
    )
  if (field.kind === 'number')
    return (
      <div className="field">
        <label htmlFor={id} title={field.description}>
          {fieldLabel(field.name)}
          <span>{value === undefined ? 'default' : String(value)}</span>
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
    <div className="field">
      <label htmlFor={id} title={field.description}>
        {fieldLabel(field.name)}
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
