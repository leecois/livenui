import { expect, type Page, test } from '@playwright/test'

const chat = (page: Page) =>
  page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })

async function openPanel(page: Page, side: 'settings' | 'examples') {
  const panel = chat(page).locator(`.avatar-chat-${side}`)
  if (!(await panel.isVisible()))
    await chat(page)
      .getByRole('button', {
        name: side === 'settings' ? 'Playground' : 'Chats and examples',
        exact: true,
      })
      .click()
  await expect(panel).toBeVisible()
  return panel
}

async function closePanel(page: Page, side: 'settings' | 'examples') {
  const button = chat(page).locator(`.avatar-chat-${side} .avatar-chat-mobile`)
  if (await button.isVisible()) await button.click()
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('avatar guide opens a complete chat playground with independent sidebars and compact overlays', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  await expect(chat(page)).toBeVisible()
  const actor = chat(page).locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.chatProbe = 'retained'
  })
  await expect(chat(page).getByRole('heading', { name: 'Who’s helping?' })).toBeVisible()
  await expect(chat(page).getByRole('button', { name: 'Send message' })).toBeDisabled()
  const box = await chat(page).boundingBox()
  expect(box?.x).toBe(0)
  expect(box?.y).toBe(0)
  expect(box?.width).toBe(testInfo.project.use.viewport?.width)
  expect(box?.height).toBe(1000)
  await expect.poll(() => chat(page).evaluate((element) => element.matches(':modal'))).toBe(true)
  if (testInfo.project.use.viewport?.width === 1440) {
    const panels = await chat(page)
      .locator('.avatar-chat-layout > *')
      .evaluateAll((nodes) => nodes.map((element) => element.getBoundingClientRect().toJSON()))
    expect(panels[0].width).toBe(256)
    expect(panels[2].width).toBe(320)
    expect(panels[1].x).toBe(panels[0].right)
    expect(panels[1].right).toBe(panels[2].x)
    expect(panels.every((panel) => panel.height === 1000)).toBe(true)
    await expect(
      chat(page).getByRole('navigation', { name: 'Chat examples' }).getByRole('button')
    ).toHaveCount(20)
  } else {
    await expect(chat(page).locator('.avatar-chat-settings')).not.toBeVisible()
    await expect(chat(page).locator('.avatar-chat-examples')).not.toBeVisible()
  }
  await page.screenshot({ path: testInfo.outputPath('chat-empty-full-page.png'), fullPage: true })
  const settings = await openPanel(page, 'settings')
  await expect(
    settings.getByRole('group', { name: 'Outfit', exact: true }).getByRole('radio')
  ).toHaveCount(18)
  if (testInfo.project.use.viewport?.width === 390) {
    await expect.poll(() => settings.evaluate((element) => element.matches(':modal'))).toBe(true)
    const close = settings.getByRole('button', { name: 'Close Playground', exact: true })
    await close.focus()
    for (let index = 0; index < 32; index++) {
      await page.keyboard.press('Tab')
      expect(
        await page.evaluate(() => !!document.activeElement?.closest('.avatar-chat-settings'))
      ).toBe(true)
    }
    await page.screenshot({
      path: testInfo.outputPath('chat-settings-overlay.png'),
      fullPage: true,
    })
    await page.keyboard.press('Escape')
    await expect(settings).not.toBeVisible()
    await expect(chat(page).getByRole('button', { name: 'Playground', exact: true })).toBeFocused()
  }
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
    await expect(actor).toHaveAttribute('data-chat-probe', 'retained')
    const composer = await chat(page).locator('.avatar-chat-composer').boundingBox()
    expect(composer?.x).toBeGreaterThanOrEqual(0)
    expect((composer?.x ?? 0) + (composer?.width ?? 0)).toBeLessThanOrEqual(width)
    expect((composer?.y ?? 0) + (composer?.height ?? 0)).toBeLessThanOrEqual(844)
  }
})

test('scripted chat streams, stops, preserves conversations and performs no chat requests', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const actor = chat(page).locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.chatProbe = 'one-renderer'
  })
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.method() !== 'HEAD') requests.push(request.url())
  })
  const input = chat(page).getByRole('textbox', { name: 'Message Clover', exact: true })
  await input.fill('Show me a longer reply I can stop')
  await input.press('Enter')
  const reply = chat(page).locator('.avatar-chat-message-assistant p').last()
  await expect(chat(page).getByRole('button', { name: 'Stop reply' })).toBeVisible()
  await expect.poll(async () => (await reply.textContent())?.length ?? 0).toBeGreaterThan(25)
  await chat(page).getByRole('button', { name: 'Stop reply' }).click()
  const stopped = await reply.textContent()
  await page.waitForTimeout(180)
  await expect(reply).toHaveText(stopped ?? '')
  await expect(actor).toHaveAttribute('data-chat-probe', 'one-renderer')
  await page.screenshot({ path: testInfo.outputPath('chat-stopped-full-page.png'), fullPage: true })
  const examples = await openPanel(page, 'examples')
  await examples.getByRole('button', { name: 'New chat', exact: true }).click()
  await expect(chat(page).getByRole('heading', { name: 'Who’s helping?' })).toBeVisible()
  await expect(actor).toHaveAttribute('data-chat-probe', 'one-renderer')
  await input.fill('Reply with one word')
  await input.press('Enter')
  await expect(reply).toHaveText('Hello.')
  await expect(chat(page).getByRole('button', { name: 'Stop reply' })).toHaveCount(0)
  const history = await openPanel(page, 'examples')
  await history
    .getByRole('navigation', { name: 'Conversations' })
    .getByRole('button', { name: 'Show me a longer reply I can stop', exact: true })
    .click()
  await expect(reply).toHaveText(stopped ?? '')
  await expect(chat(page).locator('.avatar-chat-message-user p')).toHaveText(
    'Show me a longer reply I can stop'
  )
  expect(requests).toEqual([])
})

test('outfits, colors, named bots and code share the existing avatar configuration', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const actor = chat(page).locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.chatProbe = 'configured'
  })
  const settings = await openPanel(page, 'settings')
  await settings.getByRole('radio', { name: 'Builder', exact: true }).check()
  await settings.getByRole('button', { name: 'Use Mint color', exact: true }).click()
  await settings
    .getByRole('group', { name: 'Activity', exact: true })
    .getByRole('radio', { name: 'Working', exact: true })
    .check()
  await settings.locator('summary').click()
  await settings
    .getByRole('group', { name: 'Material', exact: true })
    .getByRole('radio', { name: 'Plastic', exact: true })
    .check()
  await settings
    .getByRole('group', { name: 'Size', exact: true })
    .getByRole('radio', { name: '64px', exact: true })
    .check()
  await settings.getByRole('tab', { name: 'Code', exact: true }).click()
  for (const prop of [
    'hat={"beanie"}',
    'glasses={"square"}',
    'color={"#1ED3C6"}',
    'state={"working"}',
    'shading={"plastic"}',
    'size={64}',
  ])
    await expect(settings.locator('.code-panel code')).toContainText(prop)
  await closePanel(page, 'settings')
  await chat(page).getByRole('combobox', { name: 'Bot', exact: true }).selectOption('connector')
  await expect(actor).toHaveAttribute('data-bot-avatar', 'connector')
  await expect(actor).toHaveAttribute('data-chat-probe', 'configured')
  await chat(page).getByRole('button', { name: 'New bot', exact: true }).click()
  const creator = page.getByRole('dialog', { name: 'New bot', exact: true })
  await creator.getByRole('textbox', { name: 'Name', exact: true }).fill('Support buddy')
  await creator
    .getByRole('textbox', { name: 'What it helps with', exact: true })
    .fill('Helps me test the interface')
  await creator.getByRole('button', { name: 'Create bot', exact: true }).click()
  await expect(creator).toHaveCount(0)
  await expect(
    chat(page).getByRole('textbox', { name: 'Message Support buddy', exact: true })
  ).toBeVisible()
  await expect(chat(page).getByText('Helps me test the interface', { exact: true })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('chat-custom-bot-full-page.png'),
    fullPage: true,
  })
  await chat(page).getByRole('button', { name: 'Component preview', exact: true }).click()
  await expect(chat(page)).toHaveCount(0)
  await expect(page.locator('.preview-stage canvas')).toHaveAttribute(
    'data-bot-avatar',
    'connector'
  )
  await expect(page.locator('.code-panel code')).toContainText('color={"#1ED3C6"}')
  await expect(page.locator('.code-panel code')).toContainText('hat={"beanie"}')
  await page.getByRole('button', { name: 'Chat playground', exact: true }).click()
  await expect(
    chat(page).getByRole('textbox', { name: 'Message Support buddy', exact: true })
  ).toBeVisible()
})

test('offline and instant modes, theme switching and leaving chat release active work', async ({
  page,
}) => {
  await page.goto('/agents/avatars')
  const input = chat(page).getByRole('textbox', { name: 'Message Clover', exact: true })
  await input.fill('Show me a longer reply I can stop')
  await input.press('Enter')
  await expect(chat(page).getByRole('button', { name: 'Stop reply' })).toBeVisible()
  const settings = await openPanel(page, 'settings')
  await settings
    .getByRole('group', { name: 'Connection', exact: true })
    .getByRole('radio', { name: 'Offline', exact: true })
    .check()
  await closePanel(page, 'settings')
  await expect(input).toBeDisabled()
  await expect(chat(page).getByRole('button', { name: 'Stop reply' })).toHaveCount(0)
  const reply = chat(page).locator('.avatar-chat-message-assistant p')
  const stopped = await reply.textContent()
  await page.waitForTimeout(180)
  await expect(reply).toHaveText(stopped ?? '')
  await openPanel(page, 'settings')
  await settings
    .getByRole('group', { name: 'Connection', exact: true })
    .getByRole('radio', { name: 'Online', exact: true })
    .check()
  await settings
    .getByRole('group', { name: 'Replies', exact: true })
    .getByRole('radio', { name: 'Instant', exact: true })
    .check()
  await closePanel(page, 'settings')
  await input.fill('Reply with one word')
  await input.press('Enter')
  await expect(reply.last()).toHaveText('Hello.')
  const theme = chat(page).getByRole('button', { name: /Switch to .* theme/ })
  const before = await theme.getAttribute('aria-label')
  await theme.click()
  await expect(theme).not.toHaveAttribute('aria-label', before ?? '')
  await openPanel(page, 'settings')
  await settings
    .getByRole('group', { name: 'Replies', exact: true })
    .getByRole('radio', { name: 'Stream', exact: true })
    .check()
  await closePanel(page, 'settings')
  await input.fill('Show me a longer reply I can stop')
  await input.press('Enter')
  await expect(chat(page).getByRole('button', { name: 'Stop reply' })).toBeVisible()
  await chat(page).getByRole('button', { name: 'Component preview', exact: true }).click()
  await expect(chat(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Chat playground', exact: true }).click()
  await expect(chat(page).getByRole('button', { name: 'Stop reply' })).toHaveCount(0)
  const retained = await reply.last().textContent()
  await page.waitForTimeout(180)
  await expect(reply.last()).toHaveText(retained ?? '')
})
