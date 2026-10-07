import { expect, test } from '@playwright/test'
import { imageDemoSources, meltDemoImages } from '../apps/docs/features/component-library/lib/media'
import { chooseOption } from './helpers/choices'

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

test('original demo media decodes locally and retired photos are absent', async ({
  page,
  request,
}) => {
  await page.goto('/agents/image')
  for (const src of [...imageDemoSources, ...meltDemoImages.map((image) => image.src)]) {
    const response = await request.get(src)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/webp')
    const size = await page.evaluate(async (url) => {
      const image = new Image()
      image.src = url
      await image.decode()
      return [image.naturalWidth, image.naturalHeight]
    }, src)
    expect(Math.min(...size)).toBeGreaterThanOrEqual(512)
  }
  for (const name of ['gen-1', 'gen-2', 'gen-3', 'melt-a', 'melt-b'])
    expect((await request.get(`/agent-images/${name}.jpg`)).status()).toBe(404)
})

test('Image reveals each original artwork through the native renderer', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000)
  const errors: string[] = []
  const requested: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('/agent-images/')) requested.push(new URL(request.url()).pathname)
  })
  await page.goto('/studio?library=image')
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  for (const [index, src] of imageDemoSources.entries()) {
    await page
      .getByLabel('Edit component props')
      .fill(JSON.stringify({ images: [src], autoReveal: false, paused: true }))
    await page.getByRole('button', { name: /Apply configuration/ }).click()
    await expect(page.locator('.code-panel code')).toContainText(src)
    await page.getByRole('button', { name: '▶ Play', exact: true }).click()
    await page.getByRole('button', { name: 'Reveal', exact: true }).click()
    await expect(page.locator('.image-demo .demo-note')).toHaveText('visible')
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
    const canvas = page.locator('.preview-stage .image-gen-overlay')
    expect(
      await canvas.evaluate((node: HTMLCanvasElement) => {
        const context = node.getContext('2d')
        if (!context) throw new Error('Missing native image canvas')
        const { data } = context.getImageData(0, 0, node.width, node.height)
        let opaque = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 200) opaque++
        return opaque / (node.width * node.height)
      })
    ).toBeGreaterThan(0.8)
    await page
      .locator('.preview-stage')
      .screenshot({ path: testInfo.outputPath(`image-${index + 1}.png`) })
    if (index === 0)
      await page.screenshot({ path: testInfo.outputPath('image-full-page.png'), fullPage: true })
    if (index === 0) {
      const original = page.viewportSize()
      if (!original) throw new Error('Missing test viewport')
      const before = await canvas.evaluate((node: HTMLCanvasElement) => [node.width, node.height])
      await page.setViewportSize({ width: 320, height: original.height })
      await expect
        .poll(() => canvas.evaluate((node: HTMLCanvasElement) => [node.width, node.height]))
        .not.toEqual(before)
      await expect
        .poll(() =>
          canvas.evaluate((node: HTMLCanvasElement) => {
            const context = node.getContext('2d')
            if (!context) throw new Error('Missing native image canvas')
            const { data } = context.getImageData(0, 0, node.width, node.height)
            let opaque = 0
            for (let i = 3; i < data.length; i += 4) if (data[i] > 200) opaque++
            return opaque / (node.width * node.height)
          })
        )
        .toBeGreaterThan(0.8)
      await expect(page.getByRole('button', { name: '▶ Play', exact: true })).toBeVisible()
      await page
        .locator('.preview-stage')
        .screenshot({ path: testInfo.outputPath('image-paused-resize.png') })
      await page.setViewportSize(original)
    }
  }
  for (const src of imageDemoSources) expect(requested).toContain(src)
  expect(requested.every((src) => imageDemoSources.includes(src))).toBe(true)
  expect(errors).toEqual([])
})

test('Melt renders original ribbon art and exports matching image paths', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=gooey')
  await chooseOption(page, 'Liquid behavior', 'melt')
  const cards = page.locator('.preview-stage .liquid-melt-card img')
  await expect(cards).toHaveCount(2)
  for (const [index, image] of meltDemoImages.entries()) {
    await expect(cards.nth(index)).toHaveAttribute('src', image.src)
    await expect(cards.nth(index)).toHaveAttribute('alt', image.alt)
    await expect
      .poll(() => cards.nth(index).evaluate((node: HTMLImageElement) => node.naturalWidth))
      .toBeGreaterThan(0)
    await expect(page.locator('.code-panel code')).toContainText(image.src)
  }
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath('melt-full-page.png'), fullPage: true })
  const warm = page.getByRole('button', { name: /Drag warm image/ })
  const initial = await warm.getAttribute('style')
  await warm.focus()
  await page.keyboard.press('ArrowRight')
  await expect(warm).not.toHaveAttribute('style', initial || '')
  await page.locator('.preview-stage').screenshot({ path: testInfo.outputPath('melt-moved.png') })
})
