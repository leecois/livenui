import { Button } from '@livenui/agent-ui'
import { Check, Copy as CopyIcon, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

export function Copy({
  text,
  children = 'Copy code',
  label,
  emphasis = false,
  iconOnly = false,
  disabled = false,
}: {
  text: string
  children?: ReactNode
  label?: string
  emphasis?: boolean
  iconOnly?: boolean
  disabled?: boolean
}) {
  const [status, setStatus] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revision = useRef(0)
  useEffect(() => {
    revision.current++
    setStatus('')
    return () => {
      revision.current++
      if (timer.current) clearTimeout(timer.current)
    }
  }, [text])
  const copy = async () => {
    const request = ++revision.current
    if (timer.current) clearTimeout(timer.current)
    let result: string
    try {
      await navigator.clipboard.writeText(text)
      result = 'Copied'
    } catch {
      result = 'Copy failed'
    }
    if (request !== revision.current) return
    setStatus(result)
    timer.current = setTimeout(() => setStatus(''), 1800)
  }
  const name = label || (typeof children === 'string' ? children : 'Copy code')
  const Icon = status === 'Copied' ? Check : status === 'Copy failed' ? X : CopyIcon
  return (
    <Button
      className={`${emphasis ? 'button-accent' : ''} ${iconOnly ? 'copy-icon' : ''}`}
      aria-label={name}
      title={status || name}
      disabled={disabled}
      onClick={() => void copy()}
    >
      {iconOnly ? (
        <>
          <Icon size={18} aria-hidden="true" />
          <span className="sr-only" aria-live="polite">
            {status}
          </span>
        </>
      ) : (
        <>
          <span className="copy-label">
            <span className="copy-label-width" aria-hidden="true">
              {children}
            </span>
            <span className="copy-label-width" aria-hidden="true">
              Copy failed
            </span>
            <span aria-live="polite">{status || children}</span>
          </span>
          <Icon size={18} aria-hidden="true" />
        </>
      )}
    </Button>
  )
}
