import type { MetadataRoute } from 'next'
import { siteUrl } from '~/lib/site'
import { source } from '~/lib/source'

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = new Set([
    '/studio',
    ...source.getPages().map((page) => (page.url === '/agents/studio' ? '/studio' : page.url)),
  ])
  return [...paths].sort().map((path) => ({ url: new URL(path, siteUrl).href }))
}
