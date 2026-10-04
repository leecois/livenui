import type { Metadata } from 'next/types'
import { siteUrl } from './site'

export { siteUrl as baseUrl } from './site'

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    metadataBase: siteUrl,
    openGraph: {
      type: 'website',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: '/',
      images: '/og/agents/image.webp',
      siteName: 'Liven UI',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: '/og/agents/image.webp',
      ...override.twitter,
    },
    alternates: {
      canonical: override.openGraph?.url || '/',
      ...override.alternates,
    },
  }
}
