import createBundleAnalyzer from '@next/bundle-analyzer'
import { createMDX } from 'fumadocs-mdx/next'
import type { NextConfig } from 'next'

const withAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const config: NextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/blog/:path*', destination: '/agents', permanent: true },
      ...['beam', 'orbs', 'metal', 'gooey', 'voice', 'image', 'avatars'].map((id) => ({
        source: `/${id}`,
        destination: `/agents/${id}`,
        permanent: false,
      })),
      { source: '/gallery', destination: '/agents/gallery', permanent: false },
      { source: '/bots', destination: '/agents/avatars', permanent: false },
      { source: '/studio/app', destination: '/studio', permanent: false },
      { source: '/docs', destination: '/agents/integration', permanent: false },
      { source: '/skill', destination: '/agents/integration', permanent: false },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ]
  },
  serverExternalPackages: [
    'ts-morph',
    'typescript',
    'oxc-transform',
    'twoslash',
    'shiki',
    '@takumi-rs/core',
    '@takumi-rs/image-response',
  ],
}

const withMDX = createMDX()

export default withAnalyzer(withMDX(config))
