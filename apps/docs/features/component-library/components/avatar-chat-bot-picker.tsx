import { Button } from '@livenui/agent-ui'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export type ChatBotOption = {
  id: string
  name: string
  description: string
  group: string
  color: string
}

export function AvatarChatBotPicker({
  name,
  value,
  options,
  onPick,
  label = 'bot',
}: {
  name: string
  value: string
  options: ChatBotOption[]
  onPick: (value: string) => void
  label?: 'bot' | 'outfit'
}) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const groups = [...new Set(options.map((option) => option.group))]
  const place = () => {
    const button = trigger.current
    const element = popup.current
    if (!button || !element) return
    const bounds = button.getBoundingClientRect()
    const width = Math.min(320, innerWidth - 24)
    const below = innerHeight - bounds.bottom - 20
    const above = bounds.top - 20
    const upwards = below < 240 && above > below
    const height = Math.min(384, upwards ? above : below)
    element.style.width = `${width}px`
    element.style.maxHeight = `${Math.max(44, height)}px`
    element.style.left = `${Math.min(Math.max(12, bounds.left), innerWidth - width - 12)}px`
    element.style.top = `${upwards ? bounds.top - height - 8 : bounds.bottom + 8}px`
  }
  useEffect(() => {
    if (!expanded) return
    const element = popup.current
    const selected = element?.querySelector<HTMLElement>('[aria-selected="true"]')
    const first = element?.querySelector<HTMLElement>('[role="option"]')
    const focused = selected ?? first
    focused?.focus()
  }, [expanded])
  useEffect(() => {
    const close = () => {
      if (popup.current?.matches(':popover-open')) popup.current.hidePopover()
    }
    addEventListener('resize', close)
    return () => removeEventListener('resize', close)
  }, [])
  return (
    <>
      <Button
        ref={trigger}
        className="button-accent avatar-chat-bot-trigger"
        aria-label={`Choose ${label}: ${name}`}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={id}
        popoverTarget={id}
        onClick={place}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          event.preventDefault()
          place()
          popup.current?.showPopover()
        }}
      >
        <span>{name}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </Button>
      <div
        ref={popup}
        id={id}
        popover="auto"
        role="listbox"
        aria-label={label === 'outfit' ? 'Choose an outfit' : 'Choose a bot'}
        className="avatar-chat-bot-picker"
        onToggle={(event) => setExpanded((event.nativeEvent as ToggleEvent).newState === 'open')}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            popup.current?.hidePopover()
            trigger.current?.focus({ preventScroll: true })
          } else if (event.key === 'Tab') popup.current?.hidePopover()
          else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault()
            const choices = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')
            )
            const current = choices.indexOf(document.activeElement as HTMLElement)
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? choices.length - 1
                  : (current + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) %
                    choices.length
            choices[next]?.focus()
          }
        }}
      >
        {groups.map((group, index) => (
          <fieldset key={group} aria-labelledby={`${id}-${index}`}>
            <legend id={`${id}-${index}`}>{group}</legend>
            {options
              .filter((option) => option.group === group)
              .map((option) => (
                <button
                  type="button"
                  role="option"
                  key={option.id}
                  aria-selected={value === option.id}
                  title={`${option.name}: ${option.description}`}
                  tabIndex={value === option.id ? 0 : -1}
                  onClick={() => {
                    onPick(option.id)
                    popup.current?.hidePopover()
                    trigger.current?.focus({ preventScroll: true })
                  }}
                >
                  <span
                    className="avatar-chat-outfit-dot"
                    style={{ backgroundColor: option.color }}
                    aria-hidden="true"
                  />
                  <span className="avatar-chat-bot-option-text">
                    <strong>{option.name}</strong>
                    <span>{option.description}</span>
                  </span>
                  {value === option.id && <Check size={16} aria-hidden="true" />}
                </button>
              ))}
          </fieldset>
        ))}
      </div>
    </>
  )
}
