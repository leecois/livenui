import env from '@next/env'
import { updateSearchIndexes } from './update-orama-index'

env.loadEnvConfig(process.cwd())

await updateSearchIndexes().catch((e) => {
  console.error('Failed to synchronize search index', e)
  process.exitCode = 1
})
