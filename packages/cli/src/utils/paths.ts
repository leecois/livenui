import fs from 'node:fs/promises'
import path from 'node:path'

export function registryPath(value: string): string {
  let candidate = value
  for (let depth = 0; depth < 5; depth++) {
    if (
      !candidate ||
      candidate.includes('\0') ||
      path.posix.isAbsolute(candidate) ||
      path.win32.isAbsolute(candidate) ||
      candidate.split(/[/\\]/).includes('..')
    )
      throw new Error(`Unsafe registry path: ${value}`)

    let decoded: string
    try {
      decoded = decodeURIComponent(candidate)
    } catch {
      throw new Error(`Unsafe registry path: ${value}`)
    }
    if (decoded === candidate) return value.replaceAll('\\', '/')
    candidate = decoded
  }

  throw new Error(`Unsafe registry path: ${value}`)
}

function contains(root: string, destination: string): boolean {
  const relative = path.relative(root, destination)
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export async function assertContainedPath(root: string, destination: string): Promise<void> {
  if (!contains(root, destination)) throw new Error(`Path leaves project root: ${destination}`)

  const canonicalRoot = await fs.realpath(root)
  let current = root
  for (const segment of path.relative(root, destination).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    const entry = await fs.lstat(current).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })
    if (entry?.isSymbolicLink()) {
      const resolved = await fs.realpath(current)
      if (!contains(canonicalRoot, resolved))
        throw new Error(`Symlink leaves project root: ${current}`)
    }
  }
}
