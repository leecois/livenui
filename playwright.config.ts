import { defineConfig } from '@playwright/test'

const port = process.env.LIVENUI_TEST_PORT || '43187'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    channel: process.env.LIVENUI_BROWSER_CHANNEL,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  projects: ['light', 'dark'].flatMap((colorScheme) =>
    [1440, 390].map((width) => ({
      name: `${width}-${colorScheme}`,
      use: { viewport: { width, height: 1000 }, colorScheme: colorScheme as 'light' | 'dark' },
    }))
  ),
  webServer: {
    command: 'bun run start',
    env: { PORT: port },
    url: baseURL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
})
