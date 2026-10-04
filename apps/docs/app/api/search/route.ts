import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '~/lib/source'

export const { GET } = createFromSource(source, {
  async buildIndex(page) {
    const { structuredData } = await page.data.load()
    return {
      id: page.url,
      url: page.url === '/agents/studio' ? '/studio' : page.url,
      title: page.data.title,
      description: page.data.description,
      tag: page.slugs[0],
      structuredData,
    }
  },
})
