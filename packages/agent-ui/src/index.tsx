import { type ButtonHTMLAttributes, forwardRef, type SelectHTMLAttributes } from 'react'

export { SelectionTrack } from './selection-track'

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = '', ...props }, ref) => (
    <button type="button" className={`button ${className}`} {...props} ref={ref} />
  )
)
Button.displayName = 'Button'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, ...props }, ref) => (
    <span className="select-control">
      <select {...props} ref={ref}>
        {children}
      </select>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  )
)
Select.displayName = 'Select'

export const EMPHASIS_FILL = 'var(--gradient-accent)'
