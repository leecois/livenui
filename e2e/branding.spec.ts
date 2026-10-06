import { writeFile } from 'node:fs/promises'
import { expect, type Page, test } from '@playwright/test'

async function inspectImage(page: Page, bytes: Buffer, type: string) {
  return page.evaluate(
    async ({ data, type }) => {
      const image = new Image()
      image.src = `data:${type};base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Missing image inspection context')
      context.drawImage(image, 0, 0)
      const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height)
      let accent = 0
      let clipped = 0
      let upperBands = 0
      let previousOpaque = false
      const upperRow = Math.floor(canvas.height * 0.25)
      for (let i = 0; i < pixels.length; i += 4) {
        const x = (i / 4) % canvas.width
        const y = Math.floor(i / 4 / canvas.width)
        const opaque = pixels[i + 3] >= 128
        if (y === upperRow) {
          if (opaque && !previousOpaque) upperBands++
          previousOpaque = opaque
        }
        if (!opaque) continue
        if (pixels[i + 2] > pixels[i] + 60 && pixels[i + 2] > pixels[i + 1] + 60) accent++
        if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) clipped++
      }
      return { width: canvas.width, height: canvas.height, accent, clipped, upperBands }
    },
    { data: bytes.toString('base64'), type }
  )
}

test('brand remains readable, accessible and consistent across site icons and sharing', async ({
  page,
  request,
}, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
  await page.goto('/agents/orbs')
  const mobile = testInfo.project.use.viewport?.width === 390
  if (mobile) await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click()
  const brand = page
    .locator('a:visible')
    .filter({ has: page.locator('.livenui-brand-mark') })
    .first()
  await expect(brand).toHaveAccessibleName('Liven UI')
  const mark = brand.locator('.livenui-brand-mark')
  await expect(mark).toBeVisible()
  await expect(mark).toHaveAttribute('aria-hidden', 'true')
  const style = await mark.evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      width: style.width,
      height: style.height,
      fill: style.backgroundImage,
      mask: style.maskImage,
      motion: node.getAnimations({ subtree: true }).length,
    }
  })
  expect(style.width).toBe('24px')
  expect(style.height).toBe('24px')
  expect(style.fill).toContain('linear-gradient(120deg')
  const actionFill = await page
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
    .evaluate((node) => getComputedStyle(node).backgroundImage)
  expect(style.fill).toBe(actionFill)
  expect(style.mask).toContain('/logo.svg')
  expect(style.motion).toBe(0)
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/logo.svg'
  )
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png'
  )

  const svg = await request.get('/logo.svg')
  expect(svg.ok()).toBe(true)
  const image = await inspectImage(page, await svg.body(), 'image/svg+xml')
  expect(image.accent).toBeGreaterThan(200)
  expect(image.clipped).toBe(0)
  expect(image.upperBands).toBe(2)
  await page.evaluate(async () => {
    const image = new Image()
    image.src = '/logo.svg'
    await image.decode()
  })
  await brand.screenshot({ path: testInfo.outputPath('brand.png') })
  if (mobile) {
    await page.locator('#nd-sidebar-mobile').screenshot({ path: testInfo.outputPath('drawer.png') })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).toBeHidden()
  }

  const ico = await request.get('/favicon.ico')
  expect(ico.ok()).toBe(true)
  const buffer = await ico.body()
  expect(buffer.readUInt16LE(2)).toBe(1)
  expect(buffer.readUInt16LE(4)).toBe(3)
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16
    expect(buffer[entry]).toBe(size)
    expect(buffer[entry + 1]).toBe(size)
    const offset = buffer.readUInt32LE(entry + 12)
    const pixels = buffer.subarray(offset, offset + buffer.readUInt32LE(entry + 8))
    const icon = await inspectImage(page, pixels, 'image/png')
    expect(icon.width).toBe(size)
    expect(icon.height).toBe(size)
    expect(icon.accent).toBeGreaterThan(size * size * 0.15)
    expect(icon.clipped).toBe(0)
    expect(icon.upperBands).toBe(2)
    await writeFile(testInfo.outputPath(`favicon-${size}.png`), pixels)
  }
  const touch = await request.get('/apple-touch-icon.png')
  expect(touch.ok()).toBe(true)
  const touchImage = await inspectImage(page, await touch.body(), 'image/png')
  expect(touchImage.width).toBe(180)
  expect(touchImage.height).toBe(180)
  expect(touchImage.accent).toBeGreaterThan(3000)
  await writeFile(testInfo.outputPath('touch-icon.png'), await touch.body())

  const og = await request.get('/og/agents/orbs/image.webp')
  expect(og.ok()).toBe(true)
  const sharing = await inspectImage(page, await og.body(), 'image/webp')
  expect(sharing.width).toBe(1200)
  expect(sharing.height).toBe(630)
  expect(sharing.accent).toBeGreaterThan(300)
  await writeFile(testInfo.outputPath('sharing.webp'), await og.body())

  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true })
  if (mobile) await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click()
  await brand.focus()
  await expect(brand).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/agents$/)
})
