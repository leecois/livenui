import type { MouseEvent, ReactNode } from 'react'
import type { Navigate } from '../lib/types'

export function Link({
  href,
  navigate,
  children,
  className = '',
}: {
  href: string
  navigate: Navigate
  children: ReactNode
  className?: string
}) {
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return
    event.preventDefault()
    navigate(href)
  }
  return (
    <a href={href} onClick={click} className={className}>
      {children}
    </a>
  )
}
