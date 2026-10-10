import { type BorderBeamSize, bounded } from './model'

type MotionOptions = {
  size: BorderBeamSize
  duration?: number
  hueRange: number
  shiftColors: boolean
}

export function animateBeam(svg: SVGSVGElement, options: MotionOptions) {
  const owner = svg.ownerDocument
  const window = owner.defaultView
  const motion = svg.querySelector<SVGGElement>('[data-beam-motion]')
  const color = svg.querySelector<SVGGElement>('[data-beam-color]')
  if (!window || !motion || !color) return { setActive: () => {}, destroy: () => {} }
  const pulse = options.size.startsWith('pulse-')
  const duration =
    bounded(options.duration, pulse ? 2.3 : options.size === 'line' ? 3.1 : 1.96, 0.05, 3600) * 1000
  const animations: Animation[] = []
  if (typeof motion.animate === 'function') {
    animations.push(
      motion.animate(
        pulse
          ? [{ opacity: 0.25 }, { opacity: 1, offset: 0.5 }, { opacity: 0.25 }]
          : [{ strokeDashoffset: 0 }, { strokeDashoffset: -100 }],
        {
          duration,
          iterations: Infinity,
          easing: pulse ? 'ease-in-out' : 'linear',
          id: 'liven-beam-motion',
        }
      )
    )
    if (options.shiftColors && options.hueRange !== 0) {
      animations.push(
        color.animate(
          [
            { filter: 'hue-rotate(0deg)' },
            { filter: `hue-rotate(${options.hueRange}deg)` },
            { filter: 'hue-rotate(0deg)' },
          ],
          {
            duration: duration * 3,
            iterations: Infinity,
            easing: 'ease-in-out',
            id: 'liven-beam-color',
          }
        )
      )
    }
  }
  for (const animation of animations) {
    animation.pause()
    animation.currentTime = 0
  }
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let active = false
  let visible = typeof window.IntersectionObserver !== 'function'
  let destroyed = false
  const sync = () => {
    if (destroyed) return
    const run = active && visible && !owner.hidden && !preference.matches
    svg.dataset.beamRunning = String(run)
    for (const animation of animations) {
      if (run) animation.play()
      else animation.pause()
      if (preference.matches) animation.currentTime = 0
    }
  }
  const observer =
    typeof window.IntersectionObserver === 'function'
      ? new window.IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting)
          sync()
        })
      : undefined
  observer?.observe(svg)
  preference.addEventListener('change', sync)
  owner.addEventListener('visibilitychange', sync)
  sync()
  return {
    setActive(value: boolean) {
      active = value
      sync()
    },
    destroy() {
      destroyed = true
      observer?.disconnect()
      preference.removeEventListener('change', sync)
      owner.removeEventListener('visibilitychange', sync)
      for (const animation of animations) animation.cancel()
      svg.dataset.beamRunning = 'false'
    },
  }
}

export function fadeBeam(element: HTMLElement, active: boolean, complete: () => void) {
  const window = element.ownerDocument.defaultView
  const preference = window?.matchMedia('(prefers-reduced-motion: reduce)')
  let cancelled = false
  let settled = false
  let animation: Animation | undefined
  const finish = () => {
    if (cancelled || settled) return
    settled = true
    element.style.opacity = active ? '1' : '0'
    animation?.cancel()
    complete()
  }
  if (typeof element.animate === 'function' && !preference?.matches) {
    animation = element.animate(
      [{ opacity: window?.getComputedStyle(element).opacity || '0' }, { opacity: active ? 1 : 0 }],
      { duration: 180, easing: 'ease-out', fill: 'forwards', id: 'liven-beam-fade' }
    )
    animation.onfinish = finish
  } else queueMicrotask(finish)
  const reduce = () => {
    if (preference?.matches) finish()
  }
  preference?.addEventListener('change', reduce)
  return () => {
    cancelled = true
    preference?.removeEventListener('change', reduce)
    element.style.opacity = window?.getComputedStyle(element).opacity || (active ? '1' : '0')
    animation?.cancel()
  }
}
