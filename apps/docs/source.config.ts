import {
  rehypeCodeDefaultOptions,
  remarkSteps,
} from 'fumadocs-core/mdx-plugins'
import { remarkTypeScriptToJavaScript } from 'fumadocs-docgen/remark-ts2js'
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config'
import lastModified from 'fumadocs-mdx/plugins/last-modified'
import { transformerTwoslash } from 'fumadocs-twoslash'
import { createFileSystemTypesCache } from 'fumadocs-twoslash/cache-fs'
import { remarkAutoTypeTable } from 'fumadocs-typescript'
import type { ElementContent } from 'hast'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { z } from 'zod'

export const docs = defineDocs({
  docs: {
    async: true,
    schema: frontmatterSchema.extend({
      index: z.boolean().default(false),
      method: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional(),
    }),
  },
})

export default defineConfig({
  plugins: [lastModified()],
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      langs: ['ts', 'js', 'html', 'tsx', 'mdx'],
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          typesCache: createFileSystemTypesCache(),
        }),
        {
          name: '@shikijs/transformers:remove-notation-escape',
          code(hast) {
            function replace(node: ElementContent): void {
              if (node.type === 'text') {
                node.value = node.value.replace('[\\!code', '[!code')
              } else if ('children' in node) {
                for (const child of node.children) {
                  replace(child)
                }
              }
            }

            replace(hast)
            return hast
          },
        },
      ],
    },
    remarkCodeTabOptions: {
      parseMdx: true,
    },
    remarkImageOptions: false,
    remarkNpmOptions: {
      persist: {
        id: 'package-manager',
      },
    },
    remarkPlugins: [
      remarkSteps,
      remarkMath,
      remarkAutoTypeTable,
      remarkTypeScriptToJavaScript,
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
})
