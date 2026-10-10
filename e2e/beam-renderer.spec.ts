import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import type { BorderBeamProps } from '../packages/border-beam/src'
import type {} from './fixtures/beam'

let output: string
let bundle: string

test.beforeAll(async () => {
  output = await mkdtemp(resolve('tmp/beam-fixture-'))
  execFileSync(
    'bun',
    ['build', 'e2e/fixtures/beam.tsx', '--target', 'browser', '--outdir', output],
    { stdio: 'pipe' }
  )
  bundle = await readFile(join(output, 'beam.js'), 'utf8')
})

test.afterAll(async () => {
  if (output) await rm(output, { recursive: true, force: true })
})

async function fixture(page: Page) {
  await page.route('**/__beam-fixture.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: bundle })
  )
  await page.route('**/__beam-fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;font:14px system-ui;background:light-dark(#fafafa,#111);color:light-dark(#171717,#eee)}main{padding:40px;max-width:900px;margin:auto}h1{font-size:18px;margin:0 0 16px}button{min-height:44px;border-radius:999px;padding:8px 16px;border:1px solid #8886;background:transparent;color:inherit}#primary,#secondary{margin:24px 0 56px}</style></head><body><div id="root"></div><script type="module" src="/__beam-fixture.js"></script></body></html>`,
    })
  )
  await page.goto('/__beam-fixture')
  await expect(page.locator('#primary svg')).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('#primary svg')).toHaveAttribute('data-beam-running', 'true')
  await expect
    .poll(() =>
      page
        .locator('#primary [data-beam-surface]')
        .evaluate((node) => getComputedStyle(node).opacity)
    )
    .toBe('1')
}

async function configure(page: Page, props: Partial<BorderBeamProps>) {
  await page.evaluate((value) => window.beamProbe.configure(value), props)
}

test('beam shapes paint changing frames and keep content interactive', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await fixture(page)
  const main = page.locator('#primary [data-beam]')
  await page.getByRole('button', { name: 'Inspect forwarded ref' }).click()
  expect(
    await page.evaluate(
      () => window.beamProbe.references[0] === document.querySelector('#primary [data-beam]')
    )
  ).toBe(true)
  for (const size of ['sm', 'md', 'line', 'pulse-inner', 'pulse-outside'] as const) {
    await configure(page, { size, staticColors: true })
    await expect(main).toHaveAttribute('data-beam-size', size)
    const motion = main.locator('[data-beam-motion]')
    await expect
      .poll(() => motion.evaluate((node) => node.getAnimations()[0]?.playState))
      .toBe('running')
    await motion.evaluate((node) => {
      node.getAnimations()[0].currentTime = 100
    })
    const first = await main.screenshot()
    await motion.evaluate((node) => {
      node.getAnimations()[0].currentTime = 500
    })
    const second = await main.screenshot({ path: testInfo.outputPath(`${size}.png`) })
    expect(first.equals(second)).toBe(false)
    await page.getByRole('button', { name: 'Try the action' }).click()
  }
  expect(
    await page.evaluate(
      () => window.beamProbe.callbacks.filter((value) => value === 'content-click').length
    )
  ).toBe(5)
  expect(
    await main
      .locator('[data-beam-surface]')
      .evaluate((node) => getComputedStyle(node).pointerEvents)
  ).toBe('none')
  await configure(page, { strength: 0 })
  await expect(main.locator('svg')).toHaveCSS('opacity', '0')
  await expect(page.getByRole('heading', { name: 'Make room for ideas.' })).toBeVisible()
  await configure(page, { strength: 1, colorVariant: 'mono' })
  await expect(main.locator('[data-beam-color]')).toHaveCSS('filter', 'none')
  expect(errors).toEqual([])
})

test('beam tracks geometry, isolates custom CSS and responds to theme and reduced motion', async ({
  page,
}, testInfo) => {
  await fixture(page)
  const main = page.locator('#primary [data-beam]')
  await page.evaluate(() => window.beamProbe.resize(240, 40))
  await expect(main.locator('svg')).toHaveAttribute('viewBox', '0 0 240 144')
  await expect(main.locator('clipPath rect')).toHaveAttribute('rx', '40')
  await page.evaluate(() => window.beamProbe.replaceChild())
  await expect(page.getByRole('button', { name: 'Replacement action' })).toBeVisible()
  await page.evaluate(() => window.beamProbe.resize(260, 16))
  await expect(main.locator('svg')).toHaveAttribute('viewBox', '0 0 260 144')
  await expect(main.locator('clipPath rect')).toHaveAttribute('rx', '16')
  await configure(page, {
    borderRadius: 999,
    css: '[data-beam="{id}"] [data-beam-stroke] { stroke-width: 3px; }',
  })
  await expect(main.locator('clipPath rect')).toHaveAttribute('rx', '72')
  await expect(main.locator('[data-beam-stroke]')).toHaveCSS('stroke-width', '3px')
  await expect(page.locator('#secondary [data-beam-stroke]')).toHaveCSS('stroke-width', '1.5px')
  const primaryId = await main.getAttribute('data-beam')
  expect(primaryId).not.toBe(await page.locator('#secondary [data-beam]').getAttribute('data-beam'))
  const originalTheme = testInfo.project.use.colorScheme || 'light'
  const changedTheme = originalTheme === 'light' ? 'dark' : 'light'
  await page.emulateMedia({ colorScheme: changedTheme, reducedMotion: 'reduce' })
  await expect(main).toHaveAttribute('data-beam-theme', changedTheme)
  await expect(main.locator('svg')).toHaveAttribute('data-beam-running', 'false')
  const paused = await main.screenshot()
  await page.waitForTimeout(180)
  expect(paused.equals(await main.screenshot())).toBe(true)
  await page.emulateMedia({ colorScheme: originalTheme })
  await expect(main).toHaveAttribute('data-beam-theme', originalTheme)
  await page.screenshot({ path: testInfo.outputPath('beam-full-page.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('beam pauses outside the viewport and cancels animations and callbacks on teardown', async ({
  page,
}) => {
  await fixture(page)
  const main = page.locator('#primary [data-beam]')
  const svg = main.locator('svg')
  await page.locator('#bottom').scrollIntoViewIfNeeded()
  await expect(svg).toHaveAttribute('data-beam-running', 'false')
  await main.locator('[data-beam-motion]').evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.ready))
  })
  const currentTime = await main
    .locator('[data-beam-motion]')
    .evaluate((node) => node.getAnimations()[0].currentTime)
  await page.waitForTimeout(160)
  expect(
    await main.locator('[data-beam-motion]').evaluate((node) => node.getAnimations()[0].currentTime)
  ).toBe(currentTime)
  await main.scrollIntoViewIfNeeded()
  await expect(svg).toHaveAttribute('data-beam-running', 'true')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(svg).toHaveAttribute('data-beam-running', 'false')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(svg).toHaveAttribute('data-beam-running', 'true')
  await page.evaluate(() => {
    window.beamProbe.callbacks.length = 0
  })
  await configure(page, { active: false })
  await expect(main).not.toHaveAttribute('data-active')
  await configure(page, { active: true })
  await expect.poll(() => page.evaluate(() => window.beamProbe.callbacks)).toEqual(['active'])
  await configure(page, { active: false })
  await expect
    .poll(() => page.evaluate(() => window.beamProbe.callbacks))
    .toEqual(['active', 'inactive'])
  await expect(main.locator('[data-beam-surface]')).toHaveCSS('opacity', '0')
  await expect(page.locator('#secondary svg')).toHaveAttribute('data-beam-running', 'true')
  await configure(page, { active: true })
  await expect(main).toHaveAttribute('data-active')
  await page.evaluate(() => {
    window.beamProbe.animations = document.getAnimations()
    window.beamProbe.unmount()
  })
  await page.waitForTimeout(220)
  expect(await page.evaluate(() => window.beamProbe.callbacks)).toEqual(['active', 'inactive'])
  expect(
    await page.evaluate(() =>
      window.beamProbe.animations.every((animation) => animation.playState === 'idle')
    )
  ).toBe(true)
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
})
