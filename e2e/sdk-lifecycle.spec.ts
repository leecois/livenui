import { expect, test } from '@playwright/test'
import { libraries, studioHref } from '../apps/docs/features/component-library/lib/config'

test('mounted avatar responds to reduced motion changes without replacing its canvas', async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const library = libraries.find((item) => item.id === 'avatars')
  if (!library) throw new Error('Missing avatar library')
  await page.goto(
    studioHref(library, { shading: 'flat', paused: false, jumpEvery: 0 }, library.variants[0].id)
  )
  const canvas = page.locator('.preview-stage canvas').first()
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveCSS('opacity', '1')
  const handle = await canvas.elementHandle()
  if (!handle) throw new Error('Missing avatar canvas')
  const sample = () =>
    handle.evaluate(
      (element) =>
        new Promise<number>((resolve) => {
          const context = (element as HTMLCanvasElement).getContext('2d')
          if (!context) throw new Error('Missing canvas context')
          const clear = context.clearRect
          let paints = 0
          context.clearRect = function (...args) {
            paints++
            clear.apply(this, args)
          }
          let frames = 0
          const tick = () => {
            if (++frames < 12) requestAnimationFrame(tick)
            else {
              context.clearRect = clear
              resolve(paints)
            }
          }
          requestAnimationFrame(tick)
        })
    )
  await expect.poll(sample).toBeGreaterThan(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(sample).toBe(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(sample).toBeGreaterThan(0)
  await expect(canvas).toHaveCount(1)
  expect(await handle.evaluate((element) => element.isConnected)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(sample).toBe(0)
  await page.screenshot({
    path: testInfo.outputPath('avatar-lifecycle-full-page.png'),
    fullPage: true,
  })
  await page.getByRole('link', { name: 'Back to component guide', exact: true }).click()
  await expect.poll(() => handle.evaluate((element) => element.isConnected)).toBe(false)
})

test('paused Voice refreshes backing pixels when its host resizes', async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  const library = libraries.find((item) => item.id === 'voice')
  if (!library) throw new Error('Missing voice library')
  await page.goto(studioHref(library, { paused: true, look: 'glow' }, library.variants[0].id))
  const host = page.locator('.preview-stage [data-voice-beam]').first()
  const canvas = host.locator('[data-voice-beam-band]').first()
  await expect(host).toBeVisible()
  await expect(canvas).toHaveCount(1)
  for (const width of [180, 240]) {
    await host.evaluate((element, width) => {
      element.style.width = `${width}px`
      element.style.maxWidth = 'none'
    }, width)
    await expect
      .poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).width))
      .toBe(width)
  }
  await page.screenshot({ path: testInfo.outputPath('voice-resize-full-page.png'), fullPage: true })
})
