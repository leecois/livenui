import { Button } from '@livenui/agent-ui'
import { type ReactNode, useEffect, useRef, useState } from 'react'

export function Copy({
  text,
  children = 'Copy code',
  emphasis = false,
}: {
  text: string
  children?: ReactNode
  emphasis?: boolean
}) {
  const [status, setStatus] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('Copied')
    } catch {
      setStatus('Copy failed')
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(''), 1800)
  }
  return (
    <Button className={emphasis ? 'button-accent' : ''} onClick={() => void copy()}>
      <span aria-live="polite">{status || children}</span>
      <span aria-hidden="true">{status === 'Copied' ? '✓' : '⧉'}</span>
    </Button>
  )
}
