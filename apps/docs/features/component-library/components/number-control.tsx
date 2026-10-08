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
  const [dragging, setDragging] = useState(false)
  const invalidNumber = useRef(false)
  const exact = useRef<HTMLInputElement>(null)
  const gesture = useRef<{
    value: unknown
    x: number
    pointer: number
    edit: boolean
    moved?: boolean
    cancelled?: boolean
  } | null>(null)
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
  const hint = `${range} while dragging, in steps of ${spec.step}. Drag across the field; its left and right edges select the minimum and maximum. Click the value to type. Arrow keys adjust; Shift uses larger steps. Enter applies a typed value; Escape cancels. Double-click the track or use Default to omit this prop.`

  const commit = () => {
    const input = draft.trim()
    if (input === text && !invalidNumber.current) {
      setError('')
      return value
    }
    const next = input === '' ? undefined : Number(input)
    if (allowLength && input && !Number.isFinite(next) && CSS.supports('width', input)) {
      if (value !== input) set(input)
      setError('')
      return input
    }
    const message = invalidNumber.current
      ? 'Enter a valid number.'
      : next === undefined
        ? undefined
        : numberError(next, spec)
    if (message) {
      setError(message)
      return value
    }
    if (value !== next) set(next)
    setDraft(next === undefined ? '' : String(next))
    setError('')
    return next
  }
  const reset = () => {
    gesture.current = null
    setDragging(false)
    invalidNumber.current = false
    setDraft('')
    setError('')
    set(undefined)
  }
  const finish = (input: HTMLInputElement, pointer: number, cancel = false) => {
    const active = gesture.current
    if (!active || active.pointer !== pointer) return
    gesture.current = null
    setDragging(false)
    if (cancel && !active.cancelled) set(active.value)
    if (input.hasPointerCapture(active.pointer)) input.releasePointerCapture(active.pointer)
    if (!cancel && !active.cancelled && !active.moved && active.edit) {
      exact.current?.focus({ preventScroll: true })
    }
  }
  return (
    <div className="field field-numeric">
      <div
        className="number-row"
        data-dragging={dragging || undefined}
        data-auto={value === undefined || undefined}
        data-custom={custom || undefined}
        data-invalid={!!error || undefined}
        style={{ '--number-fill': `${value === undefined ? 0 : position * 100}%` } as CSSProperties}
      >
        <span className="number-meter" aria-hidden="true" />
        <span className="number-ruler" aria-hidden="true">
          {typeof value === 'number' && !custom && <span className="number-marker" />}
        </span>
        <input
          className="number-track"
          type="range"
          id={`${id}-range`}
          aria-label={`Adjust ${label}`}
          aria-describedby={`${id}-hint`}
          title={`${description} ${hint}`}
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
            if (gesture.current) {
              event.currentTarget.value = String(Math.max(spec.min, Math.min(spec.max, numeric)))
            } else {
              set(snapNumber(Number(event.target.value), spec))
            }
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 || !event.isPrimary) return
            event.preventDefault()
            const initial = commit()
            const input = event.currentTarget
            const valueBounds = exact.current?.parentElement?.getBoundingClientRect()
            input.focus({ preventScroll: true })
            input.setPointerCapture(event.pointerId)
            gesture.current = {
              value: initial,
              x: event.clientX,
              pointer: event.pointerId,
              edit:
                !!valueBounds &&
                event.clientX >= valueBounds.left &&
                event.clientX <= valueBounds.right,
            }
            onDraft()
            setDragging(true)
          }}
          onPointerMove={(event) => {
            const active = gesture.current
            if (!active || active.cancelled || event.pointerId !== active.pointer) return
            if (!active.moved && Math.abs(event.clientX - active.x) < 4) return
            active.moved = true
            const bounds = event.currentTarget.getBoundingClientRect()
            const position = (event.clientX - bounds.left) / bounds.width
            set(snapNumber(spec.min + position * (spec.max - spec.min), spec))
          }}
          onPointerUp={(event) => finish(event.currentTarget, event.pointerId)}
          onPointerCancel={(event) => finish(event.currentTarget, event.pointerId, true)}
          onLostPointerCapture={(event) => finish(event.currentTarget, event.pointerId, true)}
          onDoubleClick={reset}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && gesture.current) {
              event.preventDefault()
              set(gesture.current.value)
              gesture.current.cancelled = true
              setDragging(false)
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
        <label
          className="field-heading number-heading"
          htmlFor={id}
          title={`${description} ${hint}`}
        >
          <span>{label}</span>
          <span className="field-range" aria-hidden="true">
            {range}
          </span>
        </label>
        <div className="number-value">
          <input
            ref={exact}
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
          onClick={reset}
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
