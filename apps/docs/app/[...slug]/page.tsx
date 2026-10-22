import { getPageTreePeers } from 'fumadocs-core/page-tree'
import * as Twoslash from 'fumadocs-twoslash/ui'
import { createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable } from 'fumadocs-typescript/ui'
import { Banner } from 'fumadocs-ui/components/banner'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/glass/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createMetadata } from '~/lib/metadata'
import { source } from '~/lib/source'
import { getMDXComponents } from '~/mdx-components'

const generator = createGenerator()
export const revalidate = false

export default async function Page(props: PageProps<'/[...slug]'>) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()
  const discovery = page.url === '/agents' || page.url === '/agents/gallery'
  const { body: Mdx, toc } = await page.data.load()
  return (
    <DocsPage
      toc={page.slugs[0] === 'agents' && page.slugs[1] !== 'integration' ? [] : toc}
      full={page.slugs[0] === 'agents'}
    >
      <DocsTitle className="text-3xl font-semibold">{page.data.title}</DocsTitle>
      {!discovery && (
        <DocsDescription className="text-lg text-fd-muted-foreground">
          {page.data.description}
        </DocsDescription>
      )}
      <DocsBody className="text-fd-foreground/90" data-library-discovery={discovery || undefined}>
        <Mdx
          components={getMDXComponents({
            ...Twoslash,
            Banner,
            TypeTable,
            AutoTypeTable: (props) => <AutoTypeTable generator={generator} {...props} />,
            DocsCategory: ({ url }) => <DocsCategory url={url ?? page.url} />,
          })}
        />
        {page.data.index ? <DocsCategory url={page.url} /> : null}
      </DocsBody>
    </DocsPage>
  )
}

function DocsCategory({ url }: { url: string }) {
  return (
    <Cards>
      {getPageTreePeers(source.pageTree, url).map((peer) => (
        <Card key={peer.url} title={peer.name} href={peer.url}>
          {peer.description}
        </Card>
      ))}
    </Cards>
  )
}

export async function generateMetadata(props: PageProps<'/[...slug]'>): Promise<Metadata> {
  const { slug = [] } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()
  const image = { url: ['/og', ...slug, 'image.webp'].join('/'), width: 1200, height: 630 }
  return createMetadata({
    title: page.data.title,
    description: page.data.description ?? 'Expressive components for agent interfaces.',
    openGraph: { url: page.url, images: [image] },
    twitter: { images: [image] },
  })
}

export function generateStaticParams() {
  return source.generateParams()
}
