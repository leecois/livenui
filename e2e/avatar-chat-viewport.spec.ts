import { expect, test } from '@playwright/test'

test('fullscreen chat stays anchored while scrolling, focusing and resizing', async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const input = chat.getByRole('textbox', { name: 'Message Clover', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.viewportProbe = 'retained'
  })

  for (const [width, height] of [
    [1440, 1000],
    [1440, 600],
    [2048, 1169],
    [390, 844],
    [390, 600],
  ]) {
    await page.setViewportSize({ width, height })
    await input.fill('A short message')
    await chat.locator('.avatar-chat-character').hover()
    await page.mouse.wheel(0, 800)
    await page.waitForTimeout(150)
    await expect.poll(() => chat.evaluate((element) => element.scrollTop)).toBe(0)
    const bounds = await chat.locator('.avatar-chat-layout').boundingBox()
    expect(bounds?.y).toBe(0)
    expect(bounds?.height).toBe(height)
    const composer = await chat.locator('.avatar-chat-composer-area').boundingBox()
    expect((composer?.y ?? 0) + (composer?.height ?? 0)).toBe(height)
    await expect(actor).toHaveAttribute('data-viewport-probe', 'retained')
    await page.screenshot({
      path: testInfo.outputPath(`chat-anchored-${width}-${height}.png`),
      fullPage: true,
    })
  }

  await page.setViewportSize(testInfo.project.use.viewport ?? { width: 390, height: 1000 })
  const settings = chat.locator('.avatar-chat-settings')
  if (testInfo.project.use.viewport?.width === 390)
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(settings).toBeVisible()
  const content = settings.locator('.avatar-chat-panel-content')
  const reset = settings.getByRole('button', { name: 'Reset appearance', exact: true })
  await reset.focus()
  await expect(reset).toBeFocused()
  await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  await reset.hover()
  await page.mouse.wheel(0, 2000)
  await page.waitForTimeout(150)
  await expect.poll(() => chat.evaluate((element) => element.scrollTop)).toBe(0)
  const heading = await settings.locator('.avatar-chat-panel-heading').boundingBox()
  expect(heading?.y).toBe(testInfo.project.use.viewport?.width === 1440 ? 0 : 73)
  await page.screenshot({
    path: testInfo.outputPath('chat-panel-focus-full-page.png'),
    fullPage: true,
  })
  const close = settings.getByRole('button', { name: 'Close Playground', exact: true })
  if (await close.isVisible()) await close.click()

  await input.fill('A long message line\n'.repeat(50))
  await expect(input).toBeFocused()
  const composer = await chat.locator('.avatar-chat-composer-area').boundingBox()
  expect((composer?.y ?? 0) + (composer?.height ?? 0)).toBe(1000)
  await input.press('Enter')
  await expect(chat.locator('.avatar-chat-message-assistant p')).toContainText('clear next step.')
  await expect(chat.getByRole('button', { name: 'Stop reply', exact: true })).toHaveCount(0)
  const feed = chat.locator('.avatar-chat-body')
  const before = await feed.evaluate((element) => element.scrollTop)
  expect(before).toBeGreaterThan(0)
  await feed.hover()
  await page.mouse.wheel(0, -2000)
  await expect.poll(() => feed.evaluate((element) => element.scrollTop)).toBeLessThan(before)
  await page.mouse.wheel(0, 4000)
  await input.focus()
  await expect(input).toBeFocused()
  await expect.poll(() => chat.evaluate((element) => element.scrollTop)).toBe(0)
  expect((await chat.locator('.avatar-chat-layout').boundingBox())?.y).toBe(0)
  await expect(actor).toHaveAttribute('data-viewport-probe', 'retained')
  await page.screenshot({ path: testInfo.outputPath('chat-feed-full-page.png'), fullPage: true })
})
