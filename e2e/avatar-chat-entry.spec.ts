import { expect, test } from '@playwright/test'

test('avatar chat covers the guide before hydration on entry and reload', async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const input = chat.getByRole('textbox', { name: 'Message Clover', exact: true })
  for (const entry of ['navigation', 'reload']) {
    let release = () => {}
    const hydration = new Promise<void>((resolve) => {
      release = resolve
    })
    let held = 0
    await page.route('**/_next/**/*.js', async (route) => {
      held++
      await hydration
      await route.continue()
    })
    try {
      if (entry === 'reload') await page.reload({ waitUntil: 'commit' })
      else await page.goto('/agents/avatars', { waitUntil: 'commit' })
      await expect.poll(() => held).toBeGreaterThan(0)
      await expect(chat).toBeVisible()
      await expect.poll(() => chat.evaluate((element) => element.matches(':modal'))).toBe(true)
      await expect(input).toBeVisible()
      await expect(chat.locator('.avatar-chat-actor canvas')).toHaveCount(0)
      const before = await chat.locator('.avatar-chat-main').boundingBox()
      const character = await chat.locator('.avatar-chat-actor').boundingBox()
      const heading = await chat.locator('.avatar-chat-who').boundingBox()
      expect(character).toMatchObject({ width: 128, height: 128 })
      const bounds = await chat.boundingBox()
      expect(bounds).toMatchObject({ x: 0, y: 0, ...testInfo.project.use.viewport })
      expect(
        await input.evaluate(
          (element) =>
            document.elementFromPoint(
              element.getBoundingClientRect().x + 10,
              element.getBoundingClientRect().y + 10
            ) === element
        )
      ).toBe(true)
      if (testInfo.project.use.viewport?.width === 1440) {
        await expect(chat.getByRole('dialog', { name: 'Playground', exact: true })).toBeVisible()
        await expect(chat.getByRole('navigation', { name: 'Chat examples' })).toBeVisible()
        expect(before?.x).toBe(256)
        expect(before?.width).toBe(864)
        const thumbnails = await chat
          .locator('.avatar-shape-thumbnail .demo-note')
          .evaluateAll((elements) =>
            elements.map((element) => ({
              font: getComputedStyle(element).fontSize,
              ...element.getBoundingClientRect().toJSON(),
            }))
          )
        expect(thumbnails).toHaveLength(8)
        for (const thumbnail of thumbnails) {
          expect(thumbnail).toMatchObject({ font: '0px', width: 24, height: 24 })
        }
      } else {
        await expect(chat.locator('.avatar-chat-settings')).toBeHidden()
        await expect(chat.locator('.avatar-chat-examples')).toBeHidden()
        expect(before?.x).toBe(0)
        expect(before?.width).toBe(390)
      }
      await page.screenshot({
        path: testInfo.outputPath(`chat-${entry}-before-hydration.png`),
        fullPage: true,
      })
      release()
      await expect(chat.locator('.avatar-chat-actor canvas')).toBeVisible()
      await expect(input).toBeFocused()
      expect(await chat.locator('.avatar-chat-main').boundingBox()).toEqual(before)
      expect(await chat.locator('.avatar-chat-actor').boundingBox()).toEqual(character)
      expect(await chat.locator('.avatar-chat-who').boundingBox()).toEqual(heading)
      await page.screenshot({
        path: testInfo.outputPath(`chat-${entry}-ready.png`),
        fullPage: true,
      })
    } finally {
      release()
      await page.unrouteAll({ behavior: 'wait' })
    }
  }
  await chat.getByRole('button', { name: 'Component preview', exact: true }).click()
  await expect(chat).toHaveCount(0)
  await expect(page.locator('.avatar-workspace .preview-stage canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Chat playground', exact: true }).click()
  await expect.poll(() => chat.evaluate((element) => element.matches(':modal'))).toBe(true)
  await expect(input).toBeFocused()
  expect(errors).toEqual([])
})
