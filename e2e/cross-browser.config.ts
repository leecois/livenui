import { resolve } from 'node:path'
import { defineConfig } from '@playwright/test'
import base from '../playwright.config'

export default defineConfig(
  { ...base, projects: [] },
  {
    testDir: resolve('e2e'),
    testMatch: [
      'control-feedback.spec.ts',
      'integration-layout.spec.ts',
      'preview-width.spec.ts',
      'avatar-chat-viewport.spec.ts',
      'avatar-chat-keyboard.spec.ts',
    ],
    grepInvert:
      /touch dragging resizes without scrolling and pointer cancellation restores the preset/,
    outputDir: resolve('test-results/cross-browser'),
    reporter: [
      ['list'],
      ['html', { outputFolder: resolve('playwright-report/cross-browser'), open: 'never' }],
    ],
    use: { ...base.use, channel: undefined, launchOptions: {} },
    projects: (['firefox', 'webkit'] as const).flatMap((browserName) =>
      (['light', 'dark'] as const).flatMap((colorScheme) =>
        [1440, 390].map((width) => ({
          name: `${browserName}-${width}-${colorScheme}`,
          use: { browserName, viewport: { width, height: 1000 }, colorScheme },
        }))
      )
    ),
  }
)
