import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

export function StatusLabel({
  children,
  icon: Icon,
  className = '',
  ...props
}: ComponentProps<'span'> & { icon?: LucideIcon }) {
  return (
    <span className={`status-label ${className}`} {...props}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </span>
  )
}
