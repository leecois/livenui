import { expect, test } from '@playwright/test'
import { openAvatarComponentPreview } from './helpers/component-preview'

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

test('device widths resize every live adapter without changing integration code', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000)
  for (const library of ['beam', 'orbs', 'metal', 'gooey', 'voice', 'image', 'avatars']) {
    await page.goto(`/agents/${library}`)
    if (library === 'avatars') await openAvatarComponentPreview(page)
    const stage = page.locator('.preview-stage')
    await stage.scrollIntoViewIfNeeded()
    await expect(
      stage.locator('[data-beam], canvas, .metal-fx-root, .gooey-demo, .voice-host').first()
    ).toBeVisible()
    const code = await page.locator('.code-panel code').textContent()
    for (const [name, requested] of [
      ['Desktop', null],
      ['Tablet', 768],
      ['Mobile', 375],
    ] as const) {
      const button = page
        .getByRole('group', { name: 'Preview device' })
        .getByRole('button', { name })
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect
        .poll(async () =>
          page.locator('.preview-frame').evaluate((frame, target) => {
            const available = frame.parentElement?.clientWidth ?? 0
            return Math.abs(
              frame.getBoundingClientRect().width - Math.min(target ?? available, available)
            )
          }, requested)
        )
        .toBeLessThan(1)
      await expect(page.locator('.preview-dimensions')).toContainText(name)
      await expect(page.locator('.code-panel code')).toHaveText(code || '')
      await expect(stage.locator('[role="alert"]')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
      const style = await button.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          fill: style.backgroundImage,
          color: style.color,
          height: element.getBoundingClientRect().height,
        }
      })
      expect(style.fill).toContain('linear-gradient')
      expect(style.color).toBe('rgb(255, 255, 255)')
      expect(style.height).toBeGreaterThanOrEqual(44)
      expect(
        await stage.evaluate((element) => {
          const handle = element
            .closest('.preview-viewport')
            ?.querySelector('.preview-resize-handle')
          if (!handle || handle.getAttribute('aria-disabled') === 'true') return false
          const grip = handle.getBoundingClientRect()
          return [
            ...element.querySelectorAll(
              '.beam-host,.voice-host,.image-host,.gooey-demo,.demo-actions button'
            ),
          ].some((node) => {
            const box = node.getBoundingClientRect()
            return (
              box.right > grip.left + 1 &&
              box.left < grip.right - 1 &&
              box.bottom > grip.top + 1 &&
              box.top < grip.bottom - 1
            )
          })
        })
      ).toBe(false)
    }
    if (library === 'avatars') {
      const canvas = await stage.locator('canvas').elementHandle()
      await page.getByRole('button', { name: 'Desktop', exact: true }).click()
      expect(await canvas?.evaluate((element) => element.isConnected)).toBe(true)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
      await page.screenshot({ path: testInfo.outputPath('guide-layout.png'), fullPage: true })
    }
  }
})

test('custom width and device choice survive task switches and compact layouts', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=image')
  await expect(page.locator('.preview-stage .image-gen-shader')).toBeVisible()
  const original = await page.locator('.code-panel code').textContent()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Desktop', exact: true }).click()
  const resizer = page.getByRole('separator', { name: 'Resize preview', includeHidden: true })
  await resizer.focus()
  await page.keyboard.press('Home')
  await expect(resizer).toHaveAttribute('aria-valuenow', '320')
  await expect(page.locator('.preview-dimensions')).toContainText('Custom · 320px')
  await page.keyboard.press('ArrowRight')
  await expect(resizer).toHaveAttribute('aria-valuenow', '330')
  await page.getByRole('tab', { name: 'Install & Usage' }).click()
  await expect(page.locator('.preview-stage')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await expect(resizer).toHaveAttribute('aria-valuenow', '330')
  await page.getByRole('button', { name: 'Tablet', exact: true }).click()
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(page.getByRole('button', { name: 'Tablet', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect
      .poll(() =>
        page
          .locator('.preview-frame')
          .evaluate((frame) =>
            Math.abs(
              frame.getBoundingClientRect().width -
                Math.min(768, frame.parentElement?.clientWidth ?? 0)
            )
          )
      )
      .toBeLessThan(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('button', { name: 'Mobile', exact: true })).toBeVisible()
    if (width <= 390) {
      await expect(page.locator('.preview-dimensions')).toContainText('Fits available space')
      if (Number(await resizer.getAttribute('aria-valuemax')) <= 320)
        await expect(resizer).toHaveAttribute('aria-disabled', 'true')
      else await expect(resizer).toHaveAttribute('aria-disabled', 'false')
    }
  }
  await page.setViewportSize(testInfo.project.use.viewport || { width: 1440, height: 1000 })
  await expect(page.locator('.code-panel code')).toHaveText(original || '')
  await page.locator('.preview-stage').scrollIntoViewIfNeeded()
  await page
    .locator('.playground-column')
    .screenshot({ path: testInfo.outputPath('tablet-preview.png') })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('studio-layout.png'), fullPage: true })
})

test('resizing a paused held image retains its canvas and painted content', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/studio?library=image')
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  await page.getByLabel('Edit component props').fill(
    JSON.stringify({
      images: ['/agent-images/prism-garden.webp'],
      autoReveal: false,
      paused: true,
    })
  )
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.getByRole('button', { name: 'Reveal', exact: true }).click()
  await expect(page.locator('.image-demo .demo-note')).toHaveText('visible')
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
  const canvas = page.locator('.preview-stage .image-gen-overlay')
  const instance = await canvas.elementHandle()
  const before = await canvas.evaluate((node: HTMLCanvasElement) => [node.width, node.height])
  await page.getByRole('separator', { name: 'Resize preview' }).focus()
  await page.keyboard.press('Home')
  await expect
    .poll(() => canvas.evaluate((node: HTMLCanvasElement) => [node.width, node.height]))
    .not.toEqual(before)
  expect(await instance?.evaluate((node) => node.isConnected)).toBe(true)
  await expect
    .poll(() =>
      canvas.evaluate((node: HTMLCanvasElement) => {
        const context = node.getContext('2d')
        if (!context) throw new Error('Missing image canvas context')
        const { data } = context.getImageData(0, 0, node.width, node.height)
        let opaque = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 200) opaque++
        return opaque / (node.width * node.height)
      })
    )
    .toBeGreaterThan(0.8)
  await expect(page.locator('.image-demo .demo-note')).toHaveText('visible')
  await expect(page.getByRole('button', { name: '▶ Play', exact: true })).toBeVisible()
  await page
    .locator('.playground-column')
    .screenshot({ path: testInfo.outputPath('held-image-resize.png') })
})

test('edge dragging captures the pointer, clamps widths and supports reset and cancellation', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/studio?library=avatars')
  const resizer = page.getByRole('separator', { name: 'Resize preview' })
  await expect(resizer).toHaveAttribute('aria-disabled', 'false')
  const original = await page.locator('.code-panel code').textContent()
  const canvas = await page.locator('.preview-stage canvas').elementHandle()
  const drag = async (delta: number, outside = false) => {
    await resizer.scrollIntoViewIfNeeded()
    const box = await resizer.boundingBox()
    if (!box) throw new Error('Missing resize handle')
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + delta, outside ? 5 : y, { steps: 8 })
  }
  const full = Number(await resizer.getAttribute('aria-valuemax'))
  await drag(-200, true)
  await expect(page.locator('.preview-viewport')).toHaveAttribute('data-resizing', 'true')
  await expect(resizer).toHaveAttribute('aria-valuenow', String(full - 200))
  await page.mouse.up()
  await expect(page.locator('.preview-viewport')).not.toHaveAttribute('data-resizing')
  expect(await canvas?.evaluate((element) => element.isConnected)).toBe(true)
  await expect(page.locator('.code-panel code')).toHaveText(original || '')
  await drag(-2000)
  await page.mouse.up()
  await expect(resizer).toHaveAttribute('aria-valuenow', '320')
  await drag(100)
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(resizer).toHaveAttribute('aria-valuenow', '320')
  await expect(page.locator('.preview-viewport')).not.toHaveAttribute('data-resizing')
  await drag(2000)
  await page.mouse.up()
  await expect(resizer).toHaveAttribute('aria-valuenow', String(full))
  await resizer.focus()
  await page.keyboard.press('Home')
  await resizer.focus()
  await page.keyboard.press('Shift+ArrowRight')
  await expect(resizer).toHaveAttribute('aria-valuenow', '370')
  await page.keyboard.press('End')
  await expect(page.getByRole('button', { name: 'Desktop', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await drag(-150)
  await page.mouse.up()
  await resizer.dblclick()
  await expect(resizer).toHaveAttribute('aria-valuenow', String(full))
  await expect(resizer).toBeFocused()
  await drag(-100)
  await page.getByRole('tab', { name: 'Install & Usage' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.preview-viewport')).toHaveCount(0)
  await page.mouse.up()
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await expect(page.locator('.preview-viewport')).not.toHaveAttribute('data-resizing')
  await expect(page.locator('.code-panel code')).toHaveText(original || '')
  await page.getByRole('button', { name: 'Mobile', exact: true }).click()
  await page
    .locator('.playground-column')
    .screenshot({ path: testInfo.outputPath('edge-resize.png') })
})

test('touch dragging resizes without scrolling and pointer cancellation restores the preset', async ({
  browser,
  baseURL,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 768, height: 1000 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
    colorScheme: testInfo.project.name.endsWith('dark') ? 'dark' : 'light',
  })
  try {
    const touchPage = await context.newPage()
    await touchPage.goto(`${baseURL}/studio?library=avatars`)
    const resizer = touchPage.getByRole('separator', { name: 'Resize preview' })
    await expect(resizer).toHaveAttribute('aria-disabled', 'false')
    await resizer.scrollIntoViewIfNeeded()
    const box = await resizer.boundingBox()
    if (!box) throw new Error('Missing touch handle')
    const client = await context.newCDPSession(touchPage)
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const full = Number(await resizer.getAttribute('aria-valuemax'))
    const scroll = await touchPage.evaluate(() => scrollY)
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...point, x: point.x - 80 }],
    })
    await expect(resizer).toHaveAttribute('aria-valuenow', String(full - 80))
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(touchPage.locator('.preview-viewport')).not.toHaveAttribute('data-resizing')
    expect(await touchPage.evaluate(() => scrollY)).toBe(scroll)
    await touchPage.getByRole('button', { name: 'Tablet', exact: true }).click()
    const next = await resizer.boundingBox()
    if (!next) throw new Error('Missing preset handle')
    const start = { x: next.x + next.width / 2, y: next.y + next.height / 2 }
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...start, x: start.x - 50 }],
    })
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await expect(touchPage.getByRole('button', { name: 'Tablet', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(touchPage.locator('.preview-viewport')).not.toHaveAttribute('data-resizing')
  } finally {
    await context.close()
  }
})
