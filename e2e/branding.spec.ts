import { writeFile } from 'node:fs/promises'
import { expect, type Page, test } from '@playwright/test'

async function inspectImage(
  page: Page,
  bytes: Buffer,
  type: string,
  ink: 'light' | 'dark',
  region?: { x: number; y: number; width: number; height: number }
) {
  return page.evaluate(
    async ({ data, type, ink, region }) => {
      const image = new Image()
      image.src = `data:${type};base64,${data}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = region?.width ?? image.naturalWidth
      canvas.height = region?.height ?? image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Missing image inspection context')
      if (region)
        context.drawImage(
          image,
          region.x,
          region.y,
          region.width,
          region.height,
          0,
          0,
          canvas.width,
          canvas.height
        )
      else context.drawImage(image, 0, 0)
      const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height)
      let mark = 0
      let colored = 0
      let clipped = 0
      let upperBands = 0
      let previousOpaque = false
      const upperRow = Math.floor(canvas.height * 0.25)
      for (let i = 0; i < pixels.length; i += 4) {
        const x = (i / 4) % canvas.width
        const y = Math.floor(i / 4 / canvas.width)
        const low = Math.min(pixels[i], pixels[i + 1], pixels[i + 2])
        const high = Math.max(pixels[i], pixels[i + 1], pixels[i + 2])
        const opaque = pixels[i + 3] >= 128
        const isMark = opaque && high - low < 16 && (ink === 'light' ? low > 225 : high < 45)
        if (y === upperRow) {
          if (isMark && !previousOpaque) upperBands++
          previousOpaque = isMark
        }
        if (!opaque) continue
        if (high - low >= 16) colored++
        if (!isMark) continue
        mark++
        if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) clipped++
      }
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        mark,
        colored,
        clipped,
        upperBands,
      }
    },
    { data: bytes.toString('base64'), type, ink, region }
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
      color: style.backgroundColor,
      mask: style.maskImage,
      motion: node.getAnimations({ subtree: true }).length,
    }
  })
  expect(style.width).toBe('24px')
  expect(style.height).toBe('24px')
  expect(style.fill).toBe('none')
  const foreground = theme === 'dark' ? 'rgb(235, 235, 235)' : 'rgb(10, 10, 10)'
  expect(style.color).toBe(foreground)
  const actionFill = await page
    .getByRole('button', { name: 'Copy agent prompt', exact: true })
    .evaluate((node) => getComputedStyle(node).backgroundImage)
  expect(actionFill).toContain('linear-gradient(120deg')
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
  const image = await inspectImage(
    page,
    await svg.body(),
    'image/svg+xml',
    theme === 'dark' ? 'light' : 'dark'
  )
  expect(image.mark).toBeGreaterThan(200)
  expect(image.colored).toBe(0)
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
    const icon = await inspectImage(page, pixels, 'image/png', 'light')
    expect(icon.width).toBe(size)
    expect(icon.height).toBe(size)
    expect(icon.mark).toBeGreaterThan(size * size * 0.15)
    expect(icon.colored).toBe(0)
    expect(icon.clipped).toBe(0)
    expect(icon.upperBands).toBe(2)
    await writeFile(testInfo.outputPath(`favicon-${size}.png`), pixels)
  }
  const touch = await request.get('/apple-touch-icon.png')
  expect(touch.ok()).toBe(true)
  const touchImage = await inspectImage(page, await touch.body(), 'image/png', 'light')
  expect(touchImage.width).toBe(180)
  expect(touchImage.height).toBe(180)
  expect(touchImage.mark).toBeGreaterThan(3000)
  expect(touchImage.colored).toBe(0)
  await writeFile(testInfo.outputPath('touch-icon.png'), await touch.body())

  const og = await request.get('/og/agents/orbs/image.webp')
  expect(og.ok()).toBe(true)
  const sharing = await inspectImage(page, await og.body(), 'image/webp', 'dark', {
    x: 64,
    y: 518,
    width: 56,
    height: 56,
  })
  expect(sharing.width).toBe(1200)
  expect(sharing.height).toBe(630)
  expect(sharing.mark).toBeGreaterThan(300)
  expect(sharing.clipped).toBe(0)
  expect(sharing.upperBands).toBe(2)
  await writeFile(testInfo.outputPath('sharing.webp'), await og.body())

  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true })
  if (mobile) await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click()
  await brand.focus()
  await expect(brand).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/agents$/)
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  if (mobile) await chat.getByRole('button', { name: 'Chats and examples', exact: true }).click()
  const chatMark = chat.locator('.avatar-chat-brand')
  await expect(chatMark).toBeVisible()
  const chatStyle = await chatMark.evaluate((node) => ({
    fill: getComputedStyle(node).backgroundImage,
    color: getComputedStyle(node).backgroundColor,
    mask: getComputedStyle(node).maskImage,
  }))
  expect(chatStyle.fill).toBe('none')
  expect(chatStyle.color).toBe(foreground)
  expect(chatStyle.mask).toContain('/logo.svg')
  await page.screenshot({ path: testInfo.outputPath('chat-brand-full-page.png'), fullPage: true })
})
