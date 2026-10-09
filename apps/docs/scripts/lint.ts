import { readdir, stat } from 'node:fs/promises'
import type { InferPageType } from 'fumadocs-core/source'
import {
  type FileObject,
  printErrors,
  scanURLs,
  validateFiles,
} from 'next-validate-link'
import { source } from '~/lib/source'

type AnySource = typeof source

async function checkLinks() {
  const scanned = await scanURLs({
    pages: (await readdir('app', { recursive: true })).filter((file) =>
      /(^|\/)route\.[jt]s$/.test(file)
    ),
    populate: {
      '[...slug]': source.getPages().map((page) => {
        return {
          value: {
            slug: page.slugs,
          },
          hashes: getHeadings(page),
        }
      }),
    },
  })

  for (const asset of await readdir('public', { recursive: true })) {
    if ((await stat(`public/${asset}`)).isFile()) scanned.urls.set(`/${asset}`, {})
  }

  console.log(
    `collected ${scanned.urls.size} URLs, ${scanned.fallbackUrls.length} fallbacks`
  )

  printErrors(
    await validateFiles([...(await getFiles(source))], {
      scanned,
      markdown: {
        components: {
          Card: { attributes: ['href'] },
        },
      },
      checkRelativePaths: 'as-url',
    }),
    true
  )
}

function getHeadings({ data }: InferPageType<AnySource>) {
  const headings: string[] = []

  const toc = (data as any).toc
  if (toc && Array.isArray(toc)) {
    headings.push(...toc.map((item: any) => item.url.slice(1)))
  }

  const elementIds = (data as any).elementIds
  if (Array.isArray(elementIds)) {
    headings.push(...elementIds)
  }

  return headings
}

async function getFiles(source: AnySource) {
  const files: FileObject[] = []
  for (const page of source.getPages()) {
    files.push({
      data: page.data,
      url: page.url,
      path: page.absolutePath ?? page.path,
      content: await page.data.getText('raw'),
    })
  }

  return files
}

void checkLinks()
