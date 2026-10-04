import './global.css'
import 'katex/dist/katex.css'

import { NextProvider } from 'fumadocs-core/framework/next'
import { TreeContextProvider } from 'fumadocs-ui/contexts/tree'
import { GlassLayout } from 'fumadocs-ui/layouts/glass'
import { Sidebar, SidebarProvider, useSidebar } from 'fumadocs-ui/layouts/glass/slots/sidebar'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { MobileNavigation } from '~/components/mobile-navigation'
import { baseOptions, logo } from '~/lib/layout.shared'
import { createMetadata } from '~/lib/metadata'
import { source } from '~/lib/source'
import { Body } from './layout.client'
import { Provider } from './provider'
export default function Layout({ children }: { children: ReactNode }) {
  const base = baseOptions()
  return (
    <html lang="en" suppressHydrationWarning>
      <Body>
        <NextProvider>
          <TreeContextProvider tree={source.pageTree}>
            <Provider>
              <GlassLayout
                {...base}
                tree={source.pageTree}
                tabs={false}
                slots={{
                  sidebar: {
                    main: Sidebar,
                    drawer: MobileNavigation,
                    provider: SidebarProvider,
                    use: useSidebar,
                  },
                }}
                nav={{
                  ...base.nav,
                  title: (
                    <>
                      {logo}
                      <span className="font-medium [.uwu_&]:hidden">Liven UI</span>
                    </>
                  ),
                }}
              >
                {children}
              </GlassLayout>
            </Provider>
          </TreeContextProvider>
        </NextProvider>
      </Body>
    </html>
  )
}

export const metadata: Metadata = createMetadata({
  title: { default: 'Liven UI', template: '%s · Liven UI' },
  description:
    'Discover, configure and integrate expressive React components for agent interfaces.',
})
