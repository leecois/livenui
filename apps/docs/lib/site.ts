import { registryOrigin } from '../features/component-library/lib/distribution'

export function resolveSiteUrl(value = registryOrigin): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('NEXT_PUBLIC_APP_URL must be an HTTP(S) origin')
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('NEXT_PUBLIC_APP_URL must be an HTTP(S) origin without credentials or a path')
  }
  return url
}

export const siteUrl = resolveSiteUrl(
  process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : registryOrigin)
)
