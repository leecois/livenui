import { registryOrigin } from '../features/component-library/lib/distribution'

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : registryOrigin)
)
