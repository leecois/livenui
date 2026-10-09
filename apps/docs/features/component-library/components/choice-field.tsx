import { SelectionTrack } from '@livenui/agent-ui'
import { RotateCcw } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { StatusLabel } from './status-label'

export function ChoiceField({
  label,
  options,
  value,
  onChange,
  onDefault,
  description,
  className = '',
  children,
  limit = 8,
  layout = 'auto',
}: {
  label: string
  options: {
    value: string | number
    label: string
    accessibleLabel?: string
    icon?: ReactNode
    description?: string
  }[]
  value: unknown
  onChange: (value: string | number) => void
  onDefault?: () => void
  description?: string
  className?: string
  children?: ReactNode
  limit?: number
  layout?: 'auto' | 'grid'
}) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const grid = layout === 'grid' || options.length > 3
  const visible = expanded
    ? options
    : options.filter((option, index) => index < limit || option.value === value)
  const Track = grid ? 'div' : SelectionTrack
  return (
    <fieldset
      className={`field field-choice ${className}`}
      aria-label={label}
      aria-describedby={value === undefined && onDefault ? `${id}-default` : undefined}
      data-choice-grid={grid || undefined}
    >
      <legend className="sr-only">{label}</legend>
      <div className="choice-row">
        <div className="choice-heading">
          <span className="field-heading" title={description} aria-hidden="true">
            {label}
          </span>
          {onDefault && (
            <button
              type="button"
              className="field-default"
              aria-label={`Use default for ${label}`}
              title="Use component default"
              onClick={onDefault}
            >
              <RotateCcw size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <Track className={`field-options ${grid ? 'choice-grid' : ''}`} id={id}>
          {visible.map((option) => (
            <label className="field-option" key={String(option.value)} title={option.description}>
              <input
                type="radio"
                name={id}
                value={String(option.value)}
                aria-label={option.accessibleLabel}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <span>
                {option.icon}
                {option.label}
              </span>
            </label>
          ))}
        </Track>
      </div>
      {options.length > limit && (
        <button
          type="button"
          className="text-button choices-expand"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={
            expanded
              ? `Show fewer ${label.toLowerCase()} options`
              : `Browse all ${options.length} ${label.toLowerCase()} options`
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show fewer' : `All ${options.length}`}
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
      )}
      {value === undefined && onDefault && (
        <p className="helper-text field-status">
          <StatusLabel icon={RotateCcw} title="Using component default" aria-hidden="true">
            Default
          </StatusLabel>
          <span className="sr-only" id={`${id}-default`}>
            Using component default
          </span>
        </p>
      )}
      {children}
    </fieldset>
  )
}
