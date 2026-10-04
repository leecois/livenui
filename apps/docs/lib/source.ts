import { docs } from 'fumadocs-mdx:collections/server'
import type { InferMetaType, InferPageType } from 'fumadocs-core/source'
import { loader } from 'fumadocs-core/source'
import { icons } from 'lucide-react'
import { createElement } from 'react'

export const source = loader({
  baseUrl: '/',
  plugins: [
    {
      name: 'studio-navigation',
      transformPageTree: {
        file(node) {
          return node.type === 'page' && node.url === '/agents/studio'
            ? { ...node, url: '/studio' }
            : node
        },
      },
    },
  ],
  icon(icon) {
    if (icon && icon in icons) return createElement(icons[icon as keyof typeof icons])
    return undefined
  },
  source: docs.toFumadocsSource(),
})

export type Page = InferPageType<typeof source>
export type Meta = InferMetaType<typeof source>
