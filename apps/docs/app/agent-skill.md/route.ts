import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { registryOrigin } from '~/features/component-library/lib/distribution'
import { siteUrl } from '~/lib/site'

export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  const reference = await readFile(join(process.cwd(), 'content/agent-skill.md'), 'utf8')
  return new Response(reference.replaceAll(`${registryOrigin}/r/`, `${siteUrl.origin}/r/`), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
