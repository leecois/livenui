import { DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/glass/page'
import type { Metadata } from 'next'
import { AgentWorkbench } from '~/features/component-library'
import { createMetadata } from '~/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Studio',
  description:
    'Customize a component, preview its behavior and copy React code for your application.',
  openGraph: { url: '/studio' },
})

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string; example?: string }>
}) {
  const { library = 'orbs', example } = await searchParams
  return (
    <DocsPage full>
      <DocsTitle>Studio</DocsTitle>
      <DocsDescription>
        Choose a component, adjust its behavior and copy the code. Start from an example or save a
        configuration for later.
      </DocsDescription>
      <AgentWorkbench library={library} example={example} studio />
    </DocsPage>
  )
}
