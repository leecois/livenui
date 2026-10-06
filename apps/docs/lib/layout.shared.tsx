import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export const logo = <span className="livenui-brand-mark" aria-hidden="true" />

export const brandTitle = (
  <>
    {logo}
    <span className="livenui-brand-name">Liven UI</span>
  </>
)

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: brandTitle,
      transparentMode: 'top',
    },
  }
}
