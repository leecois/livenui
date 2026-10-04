type Tick = (dt: number) => void
export const pointer = { x: NaN, y: NaN }
const subs = new Set<Tick>()
let raf = 0
let last = 0
function frame(now: number) {
  raf = 0
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
  last = now
  subs.forEach((fn) => {
    fn(dt)
  })
  if (subs.size && !raf && !document.hidden) raf = requestAnimationFrame(frame)
}
function start() {
  if (raf || typeof document === 'undefined' || document.hidden) return
  last = 0
  raf = requestAnimationFrame(frame)
}
let wired = false
function onMove(e: PointerEvent): void {
  pointer.x = e.clientX
  pointer.y = e.clientY
}
function onLeave(): void {
  pointer.x = NaN
  pointer.y = NaN
}
function onVisibility(): void {
  if (document.hidden) {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  } else if (subs.size) start()
}
function wire() {
  if (wired || typeof document === 'undefined') return
  wired = true
  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
  document.addEventListener('visibilitychange', onVisibility)
}
function unwire(): void {
  if (!wired) return
  document.removeEventListener('pointermove', onMove)
  document.removeEventListener('pointerleave', onLeave)
  window.removeEventListener('blur', onLeave)
  document.removeEventListener('visibilitychange', onVisibility)
  wired = false
  onLeave()
}
export function subscribe(fn: Tick): () => void {
  wire()
  subs.add(fn)
  start()
  return () => {
    subs.delete(fn)
    if (!subs.size) {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      unwire()
    }
  }
}
