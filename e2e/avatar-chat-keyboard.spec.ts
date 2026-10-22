import { expect, type Page, test } from '@playwright/test'

test.use({ hasTouch: true })

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' })
})

test('local chat sends and creates conversations on an insecure device origin', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Production server origin unavailable')
  const origin = 'http://device.livenui.test'
  await page.route(`${origin}/**`, async (route) => {
    const source = new URL(route.request().url())
    await route.continue({ url: `${baseURL}${source.pathname}${source.search}` })
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${origin}/agents/avatars`)
  expect(await page.evaluate(() => window.isSecureContext)).toBe(false)
  expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined')
  expect(await page.evaluate(() => typeof crypto.getRandomValues)).toBe('function')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  await expect(chat.locator('.avatar-chat-actor canvas')).toBeVisible()
  await chat.getByRole('textbox', { name: 'Message Clover', exact: true }).fill('Say hello')
  await chat.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(chat.getByRole('article', { name: 'Your message' })).toContainText('Say hello')
  await expect(chat.locator('.avatar-chat-message-assistant p')).toContainText('clear next step.')
  const examples = chat.locator('.avatar-chat-examples')
  if (!(await examples.isVisible()))
    await chat.getByRole('button', { name: 'Chats and examples', exact: true }).click()
  await examples.getByRole('button', { name: 'New chat', exact: true }).click()
  await expect(chat.getByRole('article', { name: 'Your message' })).toHaveCount(0)
  await chat.getByRole('textbox', { name: 'Message Clover', exact: true }).fill('A second chat')
  await chat.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(chat.getByRole('article', { name: 'Your message' })).toContainText('A second chat')
  await expect(chat.locator('.avatar-chat-message-assistant p')).toContainText('clear next step.')
  if (!(await examples.isVisible()))
    await chat.getByRole('button', { name: 'Chats and examples', exact: true }).click()
  await examples.getByRole('button', { name: 'New chat', exact: true }).click()
  await chat.getByRole('button', { name: 'New bot', exact: true }).click()
  const create = chat.getByRole('dialog', { name: 'New bot', exact: true })
  await create.getByRole('textbox', { name: 'Name', exact: true }).fill('Device bot')
  await create.getByRole('button', { name: 'Create bot', exact: true }).click()
  await expect(chat.getByRole('textbox', { name: 'Message Device bot', exact: true })).toBeVisible()
  await page.goto(`${origin}/studio?library=beam`)
  const editor = page.getByRole('dialog', { name: 'Studio workspace', exact: true })
  await editor.getByRole('tab', { name: 'Presets', exact: true }).click()
  await editor.locator('.preset-save > input').fill('Device preset')
  await editor.getByRole('button', { name: 'Save preset', exact: true }).click()
  await expect(editor.getByRole('button', { name: 'Device preset', exact: true })).toBeVisible()
  await page.reload()
  await editor.getByRole('tab', { name: 'Presets', exact: true }).click()
  await expect(editor.getByRole('button', { name: 'Device preset', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

async function visualViewport(page: Page, height: number, offsetTop = 0, scale = 1) {
  await page.evaluate(
    (geometry) => {
      const viewport = window.visualViewport
      if (!viewport) throw new Error('Visual viewport unavailable')
      Object.assign(viewport, geometry)
      viewport.dispatchEvent(new Event('resize'))
      viewport.dispatchEvent(new Event('scroll'))
    },
    { height, offsetTop, scale }
  )
}

test('chat keeps native input and Send inside a shortened visual viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 402, height: 844 })
  await page.addInitScript(
    (theme) => {
      localStorage.setItem('theme', theme)
      const viewport = Object.assign(new EventTarget(), {
        height: window.innerHeight,
        width: window.innerWidth,
        offsetTop: 0,
        offsetLeft: 0,
        scale: 1,
      })
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
    },
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const input = chat.getByRole('textbox', { name: 'Message Clover', exact: true })
  const send = chat.getByRole('button', { name: 'Send message', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.keyboardProbe = 'retained'
  })
  await expect(input).toHaveCSS('font-size', '16px')
  await expect.poll(() => page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)

  for (const [height, top] of [
    [390, 0],
    [324, 153],
    [280, 40],
  ]) {
    await visualViewport(page, height, top)
    await input.fill('Say hello\nA second line\nA third line')
    await expect.poll(async () => (await chat.boundingBox())?.height).toBe(height)
    expect((await chat.boundingBox())?.y).toBe(top)
    expect(await page.evaluate(() => window.innerHeight)).toBe(844)
    const composer = await chat.locator('.avatar-chat-composer-area').boundingBox()
    if (!composer) throw new Error('Composer is not rendered')
    expect(composer.y + composer.height).toBe(top + height)
    const button = await send.boundingBox()
    if (!button) throw new Error('Send is not rendered')
    expect(button.y).toBeGreaterThanOrEqual(top)
    expect(button.y + button.height).toBeLessThanOrEqual(top + height)
    expect(button.width).toBe(44)
    expect(button.height).toBe(44)
    expect(
      await send.evaluate((element) => {
        const box = element.getBoundingClientRect()
        return element.contains(
          document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        )
      })
    ).toBe(true)
    await expect(send).toBeEnabled()
    await expect(actor).toHaveAttribute('data-keyboard-probe', 'retained')
    await page.screenshot({
      path: testInfo.outputPath(`keyboard-${height}-${top}.png`),
      fullPage: true,
    })
  }
  await send.click()
  await expect(chat.getByRole('article', { name: 'Your message' })).toContainText('A third line')
  await expect(input).toHaveValue('')
  await expect(chat.locator('.avatar-chat-message-assistant p')).toContainText('clear next step.')
  await expect(actor).toHaveAttribute('data-keyboard-probe', 'retained')

  await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  const settings = chat.getByRole('dialog', { name: 'Playground', exact: true })
  await expect(settings).toBeVisible()
  const reset = settings.getByRole('button', { name: 'Reset appearance', exact: true })
  await reset.focus()
  await expect(reset).toBeFocused()
  const box = await settings.boundingBox()
  if (!box) throw new Error('Settings are not rendered')
  expect(box.y).toBe(112)
  expect(box.y + box.height).toBe(308)
  expect(await settings.evaluate((element) => element.scrollTop)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('keyboard-settings.png'), fullPage: true })
  await settings.getByRole('button', { name: 'Close Playground', exact: true }).click()

  await visualViewport(page, 844)
  await expect.poll(async () => (await chat.boundingBox())?.height).toBe(844)
  expect((await chat.boundingBox())?.y).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('keyboard-dismissed.png'), fullPage: true })
  await visualViewport(page, 422, 80, 2)
  await expect
    .poll(() =>
      chat.evaluate((element) => element.style.getPropertyValue('--chat-viewport-height'))
    )
    .toBe('')
  expect((await chat.boundingBox())?.height).toBe(844)
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:,|$)/i)
  await visualViewport(page, 844)
  await chat.getByRole('button', { name: 'Component preview', exact: true }).click()
  await visualViewport(page, 390, 100)
  await expect(chat).toHaveCount(0)
  await page.getByRole('button', { name: 'Chat playground', exact: true }).click()
  await expect.poll(async () => (await chat.boundingBox())?.height).toBe(390)
  expect((await chat.boundingBox())?.y).toBe(100)
})

test('touch editors use readable input type without enlarging control labels', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 402, height: 844 })
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  await chat.getByRole('button', { name: 'New bot', exact: true }).click()
  const create = page.getByRole('dialog', { name: 'New bot', exact: true })
  await expect(create.getByRole('textbox', { name: 'Name', exact: true })).toHaveCSS(
    'font-size',
    '16px'
  )
  await expect(create.getByRole('textbox', { name: 'What it helps with', exact: true })).toHaveCSS(
    'font-size',
    '16px'
  )
  await create.getByRole('button', { name: 'Close New bot', exact: true }).click()
  await page.goto('/studio?library=beam')
  const editor = page.getByRole('dialog', { name: 'Studio workspace', exact: true })
  await expect(editor.locator('.number-value input').first()).toHaveCSS('font-size', '16px')
  await expect(editor.locator('.number-heading > span').first()).toHaveCSS('font-size', '13px')
  await editor.getByRole('tab', { name: 'Presets', exact: true }).click()
  await expect(editor.locator('.preset-save > input')).toHaveCSS('font-size', '16px')
  await page.screenshot({ path: testInfo.outputPath('touch-editor-full-page.png'), fullPage: true })
})
