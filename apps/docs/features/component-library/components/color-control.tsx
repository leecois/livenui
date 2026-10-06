import { RotateCcw } from 'lucide-react'
import { type CSSProperties, useState } from 'react'

export function ColorControl({
  name,
  label,
  description,
  value,
  set,
  onDraft,
  format = 'css',
}: {
  name: string
  label: string
  description: string
  value: unknown
  set: (value: unknown) => void
  onDraft: () => void
  format?: 'css' | 'rgb' | 'rgb-hsl'
}) {
  const text = typeof value === 'string' ? value : ''
  const [draft, setDraft] = useState(text)
  const [previous, setPrevious] = useState(value)
  const [error, setError] = useState('')
  if (previous !== value) {
    setPrevious(value)
    setDraft(text)
    setError('')
  }
  const id = `prop-${name}`
  const hint =
    format === 'css'
      ? 'CSS colors, variables and color-mix are accepted.'
      : `Use a 3 or 6 digit hex color, rgb()${format === 'rgb-hsl' ? ' or hsl()' : ''}.`
  const hex = /^#[0-9a-f]{6}$/i.test(text)
    ? text
    : /^#[0-9a-f]{3}$/i.test(text)
      ? `#${text
          .slice(1)
          .split('')
          .map((char) => char + char)
          .join('')}`
      : '#808080'
  const commit = () => {
    const next = draft.trim()
    if (next === text) {
      setError('')
      return
    }
    const supportedFormat =
      format === 'css' ||
      /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(next) ||
      /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+/i.test(next) ||
      (format === 'rgb-hsl' && /^hsla?\(\s*[\d.]+(?:deg)?[,\s]+[\d.]+%[,\s]+[\d.]+%/i.test(next)) ||
      (format === 'rgb-hsl' && /^rgba?\(\s*[\d.]+\s+[\d.]+\s+[\d.]+/i.test(next))
    if (next && (!CSS.supports('color', next) || !supportedFormat)) {
      setError(format === 'css' ? 'Enter a valid CSS color.' : hint)
      return
    }
    set(next || undefined)
    setDraft(next)
    setError('')
  }
  return (
    <div className="field field-color">
      <div className="color-row" data-invalid={!!error || undefined}>
        <label htmlFor={id} title={description}>
          {label}
        </label>
        <span
          className="color-picker"
          style={{ '--swatch': text || 'var(--surface)' } as CSSProperties}
        >
          <input
            type="color"
            aria-label={`Pick ${label}`}
            aria-describedby={`${id}-hint`}
            value={hex}
            onChange={(event) => {
              setDraft(event.target.value)
              setError('')
              set(event.target.value)
            }}
          />
          <span aria-hidden="true" />
        </span>
        <input
          id={id}
          type="text"
          placeholder="Auto"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
          value={draft}
          onChange={(event) => {
            onDraft()
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
            }
          }}
        />
        <button
          type="button"
          className="field-default"
          aria-label={`Use default for ${label}`}
          title="Use component default"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setDraft('')
            setError('')
            set(undefined)
          }}
        >
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
      <p id={`${id}-hint`} className="sr-only">
        {hint} Enter applies; Escape cancels; Default omits this prop.
      </p>
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
