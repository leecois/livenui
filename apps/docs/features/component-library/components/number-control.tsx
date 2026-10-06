import { RotateCcw } from 'lucide-react'
import { type CSSProperties, useRef, useState } from 'react'
import { type NumberSpec, numberError, snapNumber } from '../lib/controls'

export function NumberControl({
  name,
  label,
  description,
  value,
  spec,
  set,
  allowLength = false,
  onDraft,
}: {
  name: string
  label: string
  description: string
  value: unknown
  spec: NumberSpec
  set: (value: unknown) => void
  allowLength?: boolean
  onDraft: () => void
}) {
  const text = value === undefined ? '' : String(value)
  const [draft, setDraft] = useState(text)
  const [previous, setPrevious] = useState(value)
  const [error, setError] = useState('')
  const invalidNumber = useRef(false)
  const gesture = useRef<{ value: unknown; cancelled?: boolean } | null>(null)
  if (previous !== value) {
    setPrevious(value)
    setDraft(text)
    setError('')
    invalidNumber.current = false
  }
  const id = `prop-${name}`
  const numeric = typeof value === 'number' ? value : spec.min
  const position = Math.max(0, Math.min(1, (numeric - spec.min) / (spec.max - spec.min)))
  const custom = typeof value === 'number' && (value < spec.min || value > spec.max)
  const range = `${spec.min}–${spec.max}${spec.unit || ''}`
  const hint = `${range} while dragging, in steps of ${spec.step}. Arrow keys adjust; Shift uses larger steps. Enter applies a typed value; Escape cancels. Default omits this prop.`

  const commit = () => {
    const input = draft.trim()
    if (input === text && !invalidNumber.current) {
      setError('')
      return
    }
    const next = input === '' ? undefined : Number(input)
    if (allowLength && input && !Number.isFinite(next) && CSS.supports('width', input)) {
      if (value !== input) set(input)
      setError('')
      return
    }
    const message = invalidNumber.current
      ? 'Enter a valid number.'
      : next === undefined
        ? undefined
        : numberError(next, spec)
    if (message) {
      setError(message)
      return
    }
    if (value !== next) set(next)
    setDraft(next === undefined ? '' : String(next))
    setError('')
  }
  return (
    <div className="field field-numeric">
      <label className="field-heading" htmlFor={id} title={`${description} ${hint}`}>
        <span>{label}</span>
        <span className="field-range" aria-hidden="true">
          {range}
        </span>
      </label>
      <div
        className="number-row"
        data-auto={value === undefined || undefined}
        data-custom={custom || undefined}
        data-invalid={!!error || undefined}
        style={{ '--number-fill': `${value === undefined ? 0 : position * 100}%` } as CSSProperties}
      >
        <div className="number-track">
          <input
            type="range"
            id={`${id}-range`}
            aria-label={`Adjust ${label}`}
            aria-describedby={`${id}-hint`}
            title={hint}
            aria-valuetext={
              value === undefined
                ? 'Auto; drag to set a value'
                : `${text}${typeof value === 'number' ? spec.unit || '' : ''}${custom ? '; outside drag range' : ''}`
            }
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={Math.max(spec.min, Math.min(spec.max, numeric))}
            onChange={(event) => {
              if (!gesture.current?.cancelled) set(snapNumber(Number(event.target.value), spec))
            }}
            onPointerDown={() => {
              gesture.current = { value }
            }}
            onPointerUp={() => {
              gesture.current = null
            }}
            onPointerCancel={() => {
              if (gesture.current) set(gesture.current.value)
              gesture.current = null
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && gesture.current) {
                event.preventDefault()
                set(gesture.current.value)
                gesture.current.cancelled = true
              } else if (
                event.shiftKey &&
                ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
              ) {
                event.preventDefault()
                const sign = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 1
                set(snapNumber(numeric + sign * spec.step * 10, spec))
              }
            }}
          />
          <span className="number-meter" aria-hidden="true" />
        </div>
        <div className="number-value">
          <input
            id={id}
            type={allowLength ? 'text' : 'number'}
            inputMode="decimal"
            step="any"
            min={spec.limitMin}
            max={spec.limitMax}
            placeholder="Auto"
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
            value={draft}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              onDraft()
              invalidNumber.current = event.currentTarget.validity.badInput
              setDraft(event.target.value)
              setError('')
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commit()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setDraft(text)
                setError('')
                invalidNumber.current = false
              }
            }}
          />
          {spec.unit && !!draft && (!allowLength || Number.isFinite(Number(draft))) && (
            <span className="number-unit" aria-hidden="true">
              {spec.unit}
            </span>
          )}
        </div>
        <button
          type="button"
          className="field-default"
          aria-label={`Use default for ${label}`}
          title="Use component default"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            gesture.current = null
            invalidNumber.current = false
            setDraft('')
            setError('')
            set(undefined)
          }}
        >
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
      <p id={`${id}-hint`} className="sr-only">
        {hint}
        {allowLength ? ' CSS lengths are also accepted.' : ''}
      </p>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
      {custom && !error && <p className="helper-text">Custom value · outside drag range</p>}
    </div>
  )
}
