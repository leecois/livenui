export const registryOrigin = 'https://livenui.dev'

export function sourceImport(library: { id: string }) {
  return `@/components/livenui/${library.id}`
}

export function sourceInstallCommand(
  library: { id: string },
  manager: 'npm' | 'pnpm' | 'bun',
  origin = registryOrigin
) {
  const runner = manager === 'npm' ? 'npx' : manager === 'pnpm' ? 'pnpm dlx' : 'bunx'
  return `${runner} shadcn@latest add ${new URL(`/r/${library.id}.json`, origin).href}`
}
