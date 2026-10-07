import { RotateCcw } from 'lucide-react'
import { useId, useState } from 'react'
import type { Library } from '../lib/config'
import { optionLabel } from '../lib/content'
import type { Theme } from '../lib/types'
import { Preview, PreviewBoundary } from './preview'

const featured = ['clover', 'cat', 'drop', 'ghost', 'arrowhead', 'chat', 'connector', 'bulb']

export function AvatarShapeControl({
  field,
  value,
  set,
  theme,
}: {
  field: Library['fields'][number]
  value: unknown
  set: (value: unknown) => void
  theme: Theme
}) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const selected = value === undefined ? 'clover' : String(value)
  const options = expanded
    ? field.options
    : field.options.filter((option) => featured.includes(String(option)) || option === selected)
  return (
    <fieldset className="field field-choice field-avatar-shapes" aria-label="Shape" data-wide>
      <legend className="sr-only">Shape</legend>
      <div className="choice-row">
        <div className="avatar-shapes-heading">
          <span className="field-heading" title={field.description} aria-hidden="true">
            Shape
          </span>
          <button
            type="button"
            className="field-default"
            aria-label="Use default for Shape"
            title="Use component default"
            onClick={() => set(undefined)}
          >
            <RotateCcw size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="field-options" id={id}>
          {options.map((option) => (
            <label
              className="field-option"
              key={String(option)}
              title={optionLabel('type', option)}
            >
              <input
                type="radio"
                name="prop-type"
                value={String(option)}
                checked={selected === option}
                onChange={() => set(option)}
              />
              <span>
                <span className="avatar-shape-thumbnail" aria-hidden="true" inert>
                  <PreviewBoundary>
                    <Preview
                      id="avatars"
                      props={{ type: option, size: 32, shading: 'flat', interactive: false }}
                      theme={theme}
                      paused
                      showcase
                    />
                  </PreviewBoundary>
                </span>
                <span className="avatar-shape-label">{optionLabel('type', option)}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="text-button avatar-shapes-expand"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Show fewer shapes' : `Browse all ${field.options.length} shapes`}
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
    </fieldset>
  )
}
