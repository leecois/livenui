import { Button } from '@livenui/agent-ui'
import { Check, Copy as CopyIcon, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

export function Copy({
  text,
  children = 'Copy code',
  emphasis = false,
  iconOnly = false,
}: {
  text: string
  children?: ReactNode
  emphasis?: boolean
  iconOnly?: boolean
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
  const label = typeof children === 'string' ? children : 'Copy code'
  const Icon = status === 'Copied' ? Check : status === 'Copy failed' ? X : CopyIcon
  return (
    <Button
      className={`${emphasis ? 'button-accent' : ''} ${iconOnly ? 'copy-icon' : ''}`}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? status || label : undefined}
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
          <span aria-live="polite">{status || children}</span>
          <span aria-hidden="true">{status === 'Copied' ? '✓' : '⧉'}</span>
        </>
      )}
    </Button>
  )
}
