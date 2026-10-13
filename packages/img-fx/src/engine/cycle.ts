import { loadImage, pickRandomImage, type RevealState } from './reveal'
export type CyclePhase = 'idle' | 'reveal' | 'visible' | 'hide'
export interface CycleEvent {
  phase: CyclePhase
  src: string | null
}
export interface CycleOptions {
  reveal: RevealState
  images: string[]
  delayRange: [number, number]
  holdMs: number | [number, number]
  fadeOutMs: number
  initialDelayMs?: number
  onPhase?: (event: CycleEvent) => void
  excludeSrcs?: () => string[] | Set<string> | null | undefined
}
export interface Cycle {
  start: () => void
  stop: () => void
  setExcludeSrcs: (fn: CycleOptions['excludeSrcs'] | null) => void
  triggerOnce: (opts?: { hold?: 'auto' | 'manual' }) => void
  triggerHide: () => void
  triggerBoil: (opts?: { autoRevealAfterMs?: number }) => void
  getPhase: () => CyclePhase
  setPaused: (paused: boolean) => void
  setImages: (images: string[]) => void
  setOptions: (
    opts: Partial<Pick<CycleOptions, 'delayRange' | 'holdMs' | 'fadeOutMs' | 'onPhase'>>
  ) => void
  isRunning: () => boolean
  dispose: () => void
}
export function createCycle(opts: CycleOptions): Cycle {
  let images = opts.images.slice()
  let delayRange = opts.delayRange
  let holdMs = opts.holdMs
  let fadeOutMs = opts.fadeOutMs
  let onPhase = opts.onPhase
  let excludeSrcs = opts.excludeSrcs
  let phase: CyclePhase = 'idle'
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastIdx = -1
  let running = false
  let paused = false
  let currentSrc: string | null = null
  let activeReschedule = false
  let activeHoldMode: 'auto' | 'manual' = 'auto'
  let generation = 0
  function emit(p: CyclePhase): void {
    phase = p
    onPhase?.({ phase: p, src: currentSrc })
  }
  function clearTimer(): void {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  }
  function pickHoldMs(): number {
    if (typeof holdMs === 'number') return Math.max(0, holdMs)
    const [min, max] = holdMs
    const lo = Math.max(0, Math.min(min, max))
    const hi = Math.max(0, Math.max(min, max))
    return lo + Math.random() * (hi - lo)
  }
  function scheduleIdle(
    initialMs?: number,
    reschedule = true,
    holdMode: 'auto' | 'manual' = 'auto'
  ): void {
    if (!running || paused) return
    const request = generation
    emit('idle')
    if (!running || paused || request !== generation) return
    const [min, max] = delayRange
    const delaySec = min + Math.random() * Math.max(0, max - min)
    const ms = initialMs ?? delaySec * 1000
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      runReveal(reschedule, holdMode)
    }, ms)
  }
  function finishHide(request: number): void {
    if (!running || paused || request !== generation) return
    currentSrc = null
    if (activeReschedule) {
      scheduleIdle()
    } else {
      running = false
      emit('idle')
    }
  }
  function performHide(): void {
    if (paused) return
    const request = ++generation
    emit('hide')
    if (!running || paused || request !== generation) return
    opts.reveal.startHide(fadeOutMs)
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      finishHide(request)
    }, fadeOutMs)
  }
  function pickAvoidingExcluded(): {
    src: string
    idx: number
  } | null {
    if (images.length === 0) return null
    const raw = excludeSrcs?.()
    const exclSet = raw == null ? null : raw instanceof Set ? raw : new Set(raw)
    if (!exclSet || exclSet.size === 0) {
      return pickRandomImage(images, lastIdx)
    }
    const lastSrc = lastIdx >= 0 && lastIdx < images.length ? images[lastIdx] : null
    const candidates: number[] = []
    for (let i = 0; i < images.length; i++) {
      const src = images[i]
      if (exclSet.has(src)) continue
      if (src === lastSrc && images.length > exclSet.size + 1) continue
      candidates.push(i)
    }
    if (candidates.length === 0) {
      return pickRandomImage(images, lastIdx)
    }
    const idx = candidates[Math.floor(Math.random() * candidates.length)]
    return { src: images[idx], idx }
  }
  function runReveal(reschedule: boolean, holdMode: 'auto' | 'manual'): void {
    if (!running || paused) return
    const request = ++generation
    if (images.length === 0) {
      if (reschedule) scheduleIdle(500)
      else running = false
      return
    }
    const pick = pickAvoidingExcluded()
    if (!running || paused || request !== generation) return
    if (!pick) {
      if (reschedule) scheduleIdle(500)
      else running = false
      return
    }
    lastIdx = pick.idx
    currentSrc = pick.src
    activeReschedule = reschedule
    activeHoldMode = holdMode
    loadImage(pick.src)
      .then((img) => {
        if (!running || paused || request !== generation) return
        emit('reveal')
        if (!running || paused || request !== generation) return
        opts.reveal.startReveal({
          image: img,
          cssWidth: opts.reveal.canvas.clientWidth || opts.reveal.canvas.width,
          cssHeight: opts.reveal.canvas.clientHeight || opts.reveal.canvas.height,
          onRevealComplete: () => {
            if (!running || paused || request !== generation) return
            emit('visible')
            if (!running || paused || request !== generation) return
            if (holdMode === 'manual') {
              clearTimer()
              return
            }
            clearTimer()
            const thisHoldMs = pickHoldMs()
            timer = setTimeout(() => {
              timer = null
              if (!running || paused || request !== generation) return
              performHide()
            }, thisHoldMs)
          },
        })
      })
      .catch(() => {
        if (!running || paused || request !== generation) return
        currentSrc = null
        if (reschedule) scheduleIdle(500)
        else running = false
      })
  }
  function triggerOnceImpl(triggerOpts?: { hold?: 'auto' | 'manual' }): void {
    if (paused) return
    if (phase === 'reveal' || phase === 'visible' || phase === 'hide') return
    const wasRunning = running
    clearTimer()
    if (!wasRunning) {
      running = true
    }
    runReveal(wasRunning, triggerOpts?.hold ?? 'auto')
  }
  return {
    start() {
      if (running) return
      running = true
      activeReschedule = true
      activeHoldMode = 'auto'
      const initial = opts.initialDelayMs ?? Math.random() * 1500
      scheduleIdle(initial)
    },
    stop() {
      generation++
      running = false
      clearTimer()
      opts.reveal.clear()
      currentSrc = null
      phase = 'idle'
    },
    triggerOnce(triggerOpts) {
      triggerOnceImpl(triggerOpts)
    },
    triggerHide() {
      if (paused) return
      if (phase !== 'reveal' && phase !== 'visible') return
      performHide()
    },
    triggerBoil(boilOpts) {
      if (paused) return
      if (phase !== 'reveal' && phase !== 'visible') return
      const request = ++generation
      clearTimer()
      opts.reveal.startBoil()
      currentSrc = null
      running = false
      emit('idle')
      if (paused || running || request !== generation) return
      const afterMs = boilOpts?.autoRevealAfterMs
      if (afterMs != null && Number.isFinite(afterMs)) {
        timer = setTimeout(
          () => {
            timer = null
            triggerOnceImpl({ hold: 'manual' })
          },
          Math.max(0, afterMs)
        )
      }
    },
    getPhase() {
      return phase
    },
    setPaused(p) {
      if (paused === p) return
      paused = p
      if (paused) {
        generation++
        clearTimer()
      } else if (running) {
        if (phase === 'visible') {
          if (activeHoldMode === 'manual') {
            return
          }
          clearTimer()
          timer = setTimeout(
            () => {
              timer = null
              performHide()
            },
            Math.min(pickHoldMs(), 500)
          )
        } else if (phase === 'hide') {
          clearTimer()
          const request = generation
          timer = setTimeout(() => {
            timer = null
            finishHide(request)
          }, fadeOutMs)
        } else {
          scheduleIdle(undefined, activeReschedule, activeHoldMode)
        }
      }
    },
    setImages(next) {
      images = next.slice()
      lastIdx = -1
    },
    setExcludeSrcs(fn) {
      excludeSrcs = fn ?? undefined
    },
    setOptions(next) {
      if (next.delayRange) delayRange = next.delayRange
      if (next.holdMs != null) holdMs = next.holdMs
      if (next.fadeOutMs != null) fadeOutMs = next.fadeOutMs
      if (next.onPhase) onPhase = next.onPhase
    },
    isRunning() {
      return running && !paused
    },
    dispose() {
      generation++
      running = false
      clearTimer()
    },
  }
}
