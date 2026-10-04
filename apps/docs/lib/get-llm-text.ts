import { siteUrl } from '~/lib/site'
import type { Page } from '~/lib/source'

export async function getLLMText(page: Page) {
  const category =
    {
      blog: 'Liven UI Blog',
    }[page.slugs[0]] ?? page.slugs[0]

  const processed = await page.data.getText('raw')

  return `# ${category}: ${page.data.title}
URL: ${page.url}
Source: ${new URL(page.url, siteUrl).href}

${page.data.description}

${processed}`
}
