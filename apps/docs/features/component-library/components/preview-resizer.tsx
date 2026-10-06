import { type PointerEvent, useRef } from 'react'

export function PreviewResizer({
  width,
  available,
  onWidthChange,
  onResizingChange,
}: {
  width: number | null
  available: number
  onWidthChange: (width: number | null) => void
  onResizingChange: (resizing: boolean) => void
}) {
  const gesture = useRef<{ id: number; x: number; start: number; original: number | null } | null>(
    null
  )
  const current = Math.min(width ?? available, available)
  const minimum = Math.min(320, available)
  const enabled = available > minimum
  const commit = (next: number) => {
    const clamped = Math.round(Math.max(minimum, Math.min(available, next)))
    onWidthChange(clamped >= available ? null : clamped)
  }
  const finish = (element: HTMLHRElement) => {
    const active = gesture.current
    gesture.current = null
    onResizingChange(false)
    if (active && element.hasPointerCapture(active.id)) element.releasePointerCapture(active.id)
  }
  const cancel = (event: PointerEvent<HTMLHRElement>) => {
    if (gesture.current?.id !== event.pointerId) return
    onWidthChange(gesture.current.original)
    finish(event.currentTarget)
  }
  return (
    <hr
      className="preview-resize-handle"
      tabIndex={enabled ? 0 : -1}
      aria-label="Resize preview"
      aria-orientation="vertical"
      aria-valuemin={minimum}
      aria-valuemax={available}
      aria-valuenow={current}
      aria-valuetext={`${current} pixels`}
      aria-disabled={!enabled}
      title="Drag to resize · Double-click to reset"
      style={{ left: Math.max(8, Math.min(current - 22, available - 52)) }}
      onPointerDown={(event) => {
        if (!enabled || !event.isPrimary || event.button !== 0 || gesture.current) return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        gesture.current = { id: event.pointerId, x: event.clientX, start: current, original: width }
        onResizingChange(true)
      }}
      onPointerMove={(event) => {
        const active = gesture.current
        if (active?.id === event.pointerId) commit(active.start + event.clientX - active.x)
      }}
      onPointerUp={(event) => {
        if (gesture.current?.id === event.pointerId) finish(event.currentTarget)
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={() => {
        gesture.current = null
        onResizingChange(false)
      }}
      onDoubleClick={() => onWidthChange(null)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && gesture.current) {
          event.preventDefault()
          onWidthChange(gesture.current.original)
          finish(event.currentTarget)
          return
        }
        if (!enabled) return
        const step = event.shiftKey ? 50 : 10
        const next =
          event.key === 'ArrowLeft'
            ? current - step
            : event.key === 'ArrowRight'
              ? current + step
              : event.key === 'Home'
                ? minimum
                : event.key === 'End'
                  ? available
                  : null
        if (next !== null) {
          event.preventDefault()
          commit(next)
        }
      }}
    />
  )
}
