import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { PlaygroundState } from '../hooks/use-playground'
import type { Library } from '../lib/config'
import { content } from '../lib/content'
import type { Theme } from '../lib/types'
import { Preview, PreviewBoundary } from './preview'

const devices = [
  { name: 'Desktop', width: null, icon: Monitor },
  { name: 'Tablet', width: 768, icon: Tablet },
  { name: 'Mobile', width: 375, icon: Smartphone },
]

export function PreviewPanel({
  library,
  theme,
  state,
  width,
  onWidthChange,
}: {
  library: Library
  theme: Theme
  state: PlaygroundState
  width: number | null
  onWidthChange: (width: number | null) => void
}) {
  const { paused, setPaused, revision, props, variant, chooseVariant, update, replay } = state
  const viewport = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(0)
  const id = useId()
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setAvailable(Math.floor(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const actualWidth = Math.min(width ?? available, available)
  const selected = devices.find((device) => device.width === width)?.name ?? 'Custom'
  return (
    <div className="playground-column">
      <div className="preview-toolbar">
        <fieldset className="preview-devices" aria-label="Preview device">
          {devices.map((device) => (
            <button
              type="button"
              className="pill"
              key={device.name}
              aria-label={device.name}
              title={device.width ? `${device.name} · ${device.width}px` : 'Desktop · Full width'}
              aria-pressed={width === device.width}
              onClick={() => onWidthChange(device.width)}
            >
              <device.icon size={16} aria-hidden="true" />
              <span className="preview-device-name">{device.name}</span>
            </button>
          ))}
        </fieldset>
        <div className="preview-playback">
          <button
            type="button"
            className="pill"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? '▶ Play' : 'Ⅱ Pause'}
          </button>
          <button type="button" className="pill" onClick={() => replay()}>
            ↻ Replay
          </button>
        </div>
      </div>
      <div className="preview-viewport" ref={viewport}>
        <div className="preview-frame" style={{ width: width === null ? '100%' : width }}>
          <div className={`preview-stage stage-${library.id}`}>
            <PreviewBoundary key={revision}>
              <Preview
                id={library.id}
                props={props}
                paused={paused}
                theme={theme}
                variant={variant}
                onVariantChange={chooseVariant}
                onPropsChange={update}
              />
            </PreviewBoundary>
          </div>
        </div>
      </div>
      <div className="preview-sizing">
        <label htmlFor={`${id}-width`}>Preview width</label>
        <input
          id={`${id}-width`}
          type="range"
          min={Math.min(320, available)}
          max={available}
          value={actualWidth}
          disabled={!available || available <= 320}
          aria-valuetext={`${actualWidth} pixels`}
          onChange={(event) => onWidthChange(Number(event.target.value))}
        />
        <output htmlFor={`${id}-width`}>
          {selected} · {actualWidth}px
          {width !== null && width > available ? ' · Fits available space' : ''}
        </output>
      </div>
      <div className="preview-caption">
        <span className="eyebrow">{paused ? 'PREVIEW PAUSED' : 'LIVE PREVIEW'}</span>
        <span>{content[library.id].hint}</span>
      </div>
    </div>
  )
}
