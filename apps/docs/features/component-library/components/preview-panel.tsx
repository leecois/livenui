import { SelectionTrack } from '@livenui/agent-ui'
import { Monitor, Pause, Play, RotateCcw, Smartphone, Tablet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PlaygroundState } from '../hooks/use-playground'
import type { Library } from '../lib/config'
import { content } from '../lib/content'
import type { Theme } from '../lib/types'
import { Preview, PreviewBoundary } from './preview'
import { PreviewResizer } from './preview-resizer'

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
  const [resizing, setResizing] = useState(false)
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
        <SelectionTrack as="fieldset" className="preview-devices" aria-label="Preview device">
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
            </button>
          ))}
        </SelectionTrack>
        <div className="preview-playback">
          <button
            type="button"
            className="pill"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? (
              <Play size={18} aria-hidden="true" />
            ) : (
              <Pause size={18} aria-hidden="true" />
            )}
            {paused ? 'Play' : 'Pause'}
          </button>
          <button type="button" className="pill" onClick={() => replay()}>
            <RotateCcw size={18} aria-hidden="true" />
            Replay
          </button>
        </div>
      </div>
      <div
        className="preview-viewport"
        ref={viewport}
        data-resizing={resizing || undefined}
        data-resizable={available > 320 || undefined}
      >
        <div className="preview-frame" style={{ width: width === null ? '100%' : width }}>
          <div className={`preview-stage stage-${library.id}`}>
            <PreviewBoundary key={revision}>
              <Preview
                id={library.id}
                props={props}
                paused={paused}
                theme={props.theme === 'dark' || props.theme === 'light' ? props.theme : theme}
                variant={variant}
                onVariantChange={chooseVariant}
                onPropsChange={update}
              />
            </PreviewBoundary>
          </div>
        </div>
        <PreviewResizer
          width={width}
          available={available}
          onWidthChange={onWidthChange}
          onResizingChange={setResizing}
        />
        <output
          className="preview-width-indicator"
          aria-live="off"
          data-visible={width !== null || resizing || undefined}
        >
          {actualWidth}px
        </output>
      </div>
      <div className="preview-caption">
        <span className="preview-dimensions">
          {selected} · {actualWidth}px
          {width !== null && width > available ? ' · Fits available space' : ''}
        </span>
        <span>{content[library.id].hint}</span>
      </div>
    </div>
  )
}
