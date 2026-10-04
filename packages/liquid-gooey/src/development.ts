export function isDevelopment() {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: { NODE_ENV?: string } }
  }
  return runtime.process?.env?.NODE_ENV === 'development'
}
