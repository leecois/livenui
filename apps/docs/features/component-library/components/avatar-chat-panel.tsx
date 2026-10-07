import { X } from 'lucide-react'
import { type KeyboardEvent, type ReactNode, useLayoutEffect, useRef } from 'react'

export function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab' || event.defaultPrevented) return
  const active = document.activeElement
  const owner = active?.closest('dialog')
  if (owner !== event.currentTarget && owner?.matches(':modal')) return
  const elements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.getClientRects().length > 0 && element.tabIndex !== -1)
  const first = elements[0]
  const last = elements.at(-1)
  if (event.shiftKey && active === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}

export function AvatarChatPanel({
  title,
  side,
  wide,
  expanded,
  onClose,
  toolbar,
  children,
}: {
  title: string
  side: 'examples' | 'settings'
  wide: boolean
  expanded: boolean
  onClose: () => void
  toolbar?: ReactNode
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const previous = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    const focus = document.activeElement
    if (element.open) element.close()
    if (wide) {
      element.show()
      if (focus instanceof HTMLElement && focus.isConnected) focus.focus({ preventScroll: true })
    } else if (expanded) {
      previous.current = focus instanceof HTMLElement ? focus : null
      element.showModal()
    } else if (previous.current?.isConnected) {
      previous.current.focus({ preventScroll: true })
      previous.current = null
    }
  }, [wide, expanded])
  return (
    <dialog
      ref={dialog}
      suppressHydrationWarning
      className={`avatar-chat-panel avatar-chat-${side}`}
      aria-label={title}
      aria-modal={!wide && expanded ? true : undefined}
      onKeyDown={(event) => {
        if (!wide) containDialogFocus(event)
      }}
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }}
    >
      <div className="avatar-chat-panel-heading">
        <h2>
          {side === 'examples' && <span className="avatar-chat-brand" aria-hidden="true" />}
          {title}
        </h2>
        <button
          type="button"
          className="pill avatar-chat-icon avatar-chat-mobile"
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {toolbar && <div className="avatar-chat-panel-toolbar">{toolbar}</div>}
      <div className="avatar-chat-panel-content">{children}</div>
    </dialog>
  )
}
