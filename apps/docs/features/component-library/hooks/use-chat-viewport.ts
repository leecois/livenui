import { type RefObject, useLayoutEffect } from 'react'

export function useChatViewport(dialog: RefObject<HTMLDialogElement | null>, open: boolean) {
  useLayoutEffect(() => {
    const element = dialog.current
    const viewport = window.visualViewport
    if (!open || !element || !viewport) return
    let frame = 0
    const clear = () => {
      element.style.removeProperty('--chat-viewport-height')
      element.style.removeProperty('--chat-viewport-top')
    }
    const update = () => {
      if (viewport.scale > 1.01) {
        clear()
        return
      }
      if (!Number.isFinite(viewport.height) || viewport.height <= 0) return
      element.style.setProperty('--chat-viewport-height', `${viewport.height}px`)
      element.style.setProperty('--chat-viewport-top', `${Math.max(0, viewport.offsetTop)}px`)
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    viewport.addEventListener('resize', schedule)
    viewport.addEventListener('scroll', schedule)
    return () => {
      viewport.removeEventListener('resize', schedule)
      viewport.removeEventListener('scroll', schedule)
      cancelAnimationFrame(frame)
      clear()
    }
  }, [dialog, open])
}
