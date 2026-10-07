import { type HTMLAttributes, useCallback, useLayoutEffect, useRef } from 'react'

export function SelectionTrack({
  as: Element = 'div',
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement> & { as?: 'div' | 'fieldset' }) {
  const track = useRef<HTMLElement | null>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const previous = useRef<{ target: HTMLElement; geometry: string } | undefined>(undefined)
  const attach = useCallback((element: HTMLElement | null) => {
    track.current = element
  }, [])
  const position = useCallback((animate: boolean) => {
    const element = track.current
    const fill = indicator.current
    if (!element || !fill) return
    const active = element.querySelector<HTMLElement>(
      'input:checked, [aria-selected="true"], [aria-pressed="true"]'
    )
    const target = active instanceof HTMLInputElement ? active.closest('label') : active
    if (!target || !target.getClientRects().length) {
      delete element.dataset.selectionReady
      previous.current = undefined
      return
    }
    if (animate && previous.current?.target === target) return
    const bounds = element.getBoundingClientRect()
    const selected = target.getBoundingClientRect()
    const style = getComputedStyle(element)
    const scaleX = bounds.width / Number.parseFloat(style.width)
    const scaleY = bounds.height / Number.parseFloat(style.height)
    if (!scaleX || !scaleY) return
    const width = `${selected.width / scaleX}px`
    const height = `${selected.height / scaleY}px`
    const transform = `translate(${(selected.left - bounds.left) / scaleX - element.clientLeft}px, ${(selected.top - bounds.top) / scaleY - element.clientTop}px)`
    const geometry = `${width} ${height} ${transform}`
    if (previous.current?.target === target && previous.current.geometry === geometry) return
    const moving = animate && previous.current && previous.current.target !== target
    if (!moving) fill.style.transition = 'none'
    fill.style.width = width
    fill.style.height = height
    fill.style.transform = transform
    element.dataset.selectionReady = ''
    if (!moving) {
      fill.getBoundingClientRect()
      fill.style.removeProperty('transition')
    }
    previous.current = { target, geometry }
  }, [])
  useLayoutEffect(() => position(true))
  useLayoutEffect(() => {
    const element = track.current
    if (!element) return
    const observer = new ResizeObserver(() => position(false))
    observer.observe(element)
    for (const child of element.children) {
      if (child !== indicator.current) observer.observe(child)
    }
    return () => observer.disconnect()
  }, [position])
  return (
    <Element {...props} ref={attach} className={`selection-track ${className}`}>
      <span ref={indicator} className="selection-indicator" aria-hidden="true" />
      {children}
    </Element>
  )
}
