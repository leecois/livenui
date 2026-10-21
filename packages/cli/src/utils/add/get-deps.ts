import fs from 'node:fs/promises'
import { exists } from '@/utils/fs'

export async function getDeps() {
  const manifest = await exists('package.json')
    ? JSON.parse(await fs.readFile('package.json', 'utf8'))
    : {}
  return {
    dependencies: new Map<string, string>(Object.entries(manifest.dependencies ?? {})),
    devDependencies: new Map<string, string>(Object.entries(manifest.devDependencies ?? {})),
  }
}
