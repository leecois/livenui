import { expect, test } from '@playwright/test'

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
      await expect(page.locator('.preview-sizing output')).toContainText(name)
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
  const slider = page.getByRole('slider', { name: 'Preview width' })
  await slider.focus()
  await page.keyboard.press('Home')
  await expect(slider).toHaveValue('320')
  await expect(page.locator('.preview-sizing output')).toContainText('Custom · 320px')
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('321')
  await page.getByRole('tab', { name: 'Install & Usage' }).click()
  await expect(page.locator('.preview-stage')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await expect(slider).toHaveValue('321')
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
      await expect(page.locator('.preview-sizing output')).toContainText('Fits available space')
      if (Number(await slider.getAttribute('max')) <= 320) await expect(slider).toBeDisabled()
      else await expect(slider).toBeEnabled()
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
  await page.getByRole('slider', { name: 'Preview width' }).focus()
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
