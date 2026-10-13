import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Registry } from 'livenui-cli/build'

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../')

export const registry: Registry = {
  name: 'livenui-ui',
  dir: srcDir,
  tsconfigPath: '../tsconfig.json',
  packageJson: '../package.json',
  onResolve(ref) {
    if (ref.type !== 'file') return ref

    const filePath = path.relative(srcDir, ref.file)
    if (filePath === 'icons.tsx')
      return {
        type: 'dependency',
        dep: 'lucide-react',
        specifier: 'lucide-react',
      }

    return ref
  },
  onUnknownFile(file) {
    const relativePath = path.relative(srcDir, file)
    if (relativePath.startsWith('utils/'))
      return {
        type: 'lib',
        path: relativePath,
      }
    if (relativePath.startsWith('components/ui/')) {
      return {
        type: 'components',
        path: relativePath,
      }
    }
  },
  components: [
    {
      name: 'is-active',
      unlisted: true,
      files: [
        {
          type: 'lib',
          path: 'utils/is-active.ts',
        },
      ],
    },
    {
      name: 'cn',
      unlisted: true,
      files: [
        {
          type: 'lib',
          path: 'utils/cn.ts',
        },
      ],
    },
    {
      name: 'merge-refs',
      unlisted: true,
      files: [
        {
          type: 'lib',
          path: 'utils/merge-refs.ts',
        },
      ],
    },
    {
      name: 'accordion',
      files: [
        {
          type: 'components',
          path: 'components/accordion.tsx',
        },
      ],
    },
    {
      name: 'github-info',
      files: [
        {
          type: 'components',
          path: 'components/github-info.tsx',
        },
      ],
      description: 'A card to display GitHub repo info',
    },
    {
      name: 'banner',
      files: [
        {
          type: 'components',
          path: 'components/banner.tsx',
        },
      ],
    },
    {
      name: 'callout',
      files: [
        {
          type: 'components',
          path: 'components/callout.tsx',
        },
      ],
    },
    {
      name: 'card',
      files: [
        {
          type: 'components',
          path: 'components/card.tsx',
        },
      ],
    },
    {
      name: 'files',
      files: [
        {
          type: 'components',
          path: 'components/files.tsx',
        },
      ],
    },
    {
      name: 'heading',
      files: [
        {
          type: 'components',
          path: 'components/heading.tsx',
        },
      ],
    },
    {
      name: 'inline-toc',
      files: [
        {
          type: 'components',
          path: 'components/inline-toc.tsx',
        },
      ],
    },
    {
      name: 'steps',
      files: [
        {
          type: 'components',
          path: 'components/steps.tsx',
        },
      ],
    },
    {
      name: 'button',
      unlisted: true,
      files: [
        {
          type: 'ui',
          path: 'components/ui/button.tsx',
        },
      ],
    },
    {
      name: 'popover',
      unlisted: true,
      files: [
        {
          type: 'ui',
          path: 'components/ui/popover.tsx',
        },
      ],
    },
    {
      name: 'scroll-area',
      unlisted: true,
      files: [
        {
          type: 'ui',
          path: 'components/ui/scroll-area.tsx',
        },
      ],
    },
    {
      name: 'collapsible',
      unlisted: true,
      files: [
        {
          type: 'ui',
          path: 'components/ui/collapsible.tsx',
        },
      ],
    },
  ],
  dependencies: {
    'fumadocs-core': null,
    'lucide-react': null,
    react: null,
  },
}
