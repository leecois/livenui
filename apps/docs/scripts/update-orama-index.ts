import * as fs from 'node:fs/promises'
import { CloudManager } from '@oramacloud/client'
import { type OramaDocument, sync } from 'fumadocs-core/search/orama-cloud'

export async function updateSearchIndexes(): Promise<void> {
  if (process.env.LIVENUI_SYNC_SEARCH !== '1') return

  const apiKey = process.env.ORAMA_PRIVATE_API_KEY

  if (!apiKey) {
    console.log('no api key for Orama found, skipping')
    return
  }

  const index = process.env.ORAMA_INDEX_ID?.trim()
  if (!index) throw new Error('ORAMA_INDEX_ID is required when remote search sync is enabled')

  const content = await fs.readFile('.next/server/app/static.json.body')
  const records = JSON.parse(content.toString()) as OramaDocument[]

  const manager = new CloudManager({ api_key: apiKey })

  await sync(manager, {
    index,
    documents: records,
  })

  console.log(`search updated: ${records.length} records`)
}
