'use client'

import { useSidebar } from 'fumadocs-ui/components/sidebar/base'
import { SidebarDrawer } from 'fumadocs-ui/layouts/glass/slots/sidebar'
import { type KeyboardEvent, useEffect } from 'react'

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function MobileNavigation() {
  const { open, mode, setOpen } = useSidebar()

  useEffect(() => {
    if (!open || mode !== 'drawer') return
    const previous = document.activeElement
    const focusFrame = requestAnimationFrame(() => {
      document.getElementById('nd-sidebar-mobile')?.querySelector<HTMLElement>(focusable)?.focus()
    })
    return () => {
      cancelAnimationFrame(focusFrame)
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true })
    }
  }, [open, mode])

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
    if (event.key !== 'Tab') return
    const elements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(focusable)
    ).filter((element) => element.getClientRects().length > 0)
    const first = elements[0]
    const last = elements.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <SidebarDrawer
      contentProps={{
        role: 'dialog',
        'aria-modal': true,
        'aria-label': 'Navigation',
        onKeyDown: handleKeyboard,
      }}
    />
  )
}
