import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { LivenUIIconMinimal } from '~/app/layout.client'

export const logo = (
  <>
    <LivenUIIconMinimal className="size-5 [.uwu_&]:hidden" fill="currentColor" />
  </>
)

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {logo}
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">Liven UI</span>
        </>
      ),
      transparentMode: 'top',
    },
  }
}
