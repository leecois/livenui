import { expect, test } from '@playwright/test'

test('chat settings keep navigation stable and show compact appearance choices', async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  const settings = chat.locator('.avatar-chat-settings')
  if (!(await settings.isVisible()))
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(settings).toBeVisible()
  const tabs = settings.getByRole('tablist', { name: 'Chat playground view', exact: true })
  const customize = tabs.getByRole('tab', { name: 'Customize', exact: true })
  const code = tabs.getByRole('tab', { name: 'Code', exact: true })
  await customize.press('Home')
  await page.screenshot({
    path: testInfo.outputPath('chat-settings-full-page.png'),
    fullPage: true,
  })
  const buttons = await tabs
    .getByRole('tab')
    .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON()))
  expect(buttons[0].width).toBeCloseTo(buttons[1].width, 1)
  expect(buttons.every((button) => button.height >= 44)).toBe(true)
  const focus = await customize.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      visible: element.matches(':focus-visible'),
      outline: style.outlineStyle,
      shadow: style.boxShadow,
    }
  })
  expect(focus.visible).toBe(true)
  expect(focus.outline).toBe('none')
  expect(focus.shadow.match(/inset/g)).toHaveLength(1)
  await settings.screenshot({ path: testInfo.outputPath('chat-settings-focus.png') })
  await actor.evaluate((element) => {
    element.dataset.settingsProbe = 'retained'
  })
  const shape = settings.getByRole('combobox', { name: 'Shape', exact: true })
  await expect(shape).toBeVisible()
  const outfit = settings.getByRole('button', { name: 'Choose outfit: Resting', exact: true })
  await expect(outfit).toBeVisible()
  const row = await settings.locator('.avatar-chat-outfit-row').boundingBox()
  expect(row?.height).toBe(54)
  await settings.getByRole('button', { name: 'Use Mint color', exact: true }).click()
  await outfit.click()
  const choices = settings.getByRole('listbox', { name: 'Choose an outfit', exact: true })
  await expect(choices).toBeVisible()
  await expect(choices.getByRole('option')).toHaveCount(18)
  await page.screenshot({
    path: testInfo.outputPath('chat-outfit-menu-full-page.png'),
    fullPage: true,
  })
  await page.keyboard.press('Escape')
  await expect(choices).not.toBeVisible()
  await expect(outfit).toBeFocused()
  await expect(settings).toBeVisible()
  await outfit.click()
  await choices.getByRole('option', { name: /^Builder / }).click()
  await expect(
    settings.getByRole('button', { name: 'Choose outfit: Builder', exact: true })
  ).toBeFocused()
  await expect(actor).toHaveAttribute('data-settings-probe', 'retained')
  await shape.selectOption('connector')
  await expect(actor).toHaveAttribute('data-bot-avatar', 'connector')
  await expect(actor).toHaveAttribute('data-settings-probe', 'retained')
  await settings.locator('summary').click()
  const content = settings.locator('.avatar-chat-panel-content')
  const before = await tabs.boundingBox()
  await settings
    .getByRole('button', { name: 'Reset appearance', exact: true })
    .scrollIntoViewIfNeeded()
  expect(await content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  expect(await content.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  const after = await tabs.boundingBox()
  expect(after?.y).toBe(before?.y)
  expect(after?.height).toBe(before?.height)
  await expect(code).toBeInViewport()
  await customize.press('End')
  await expect(code).toBeFocused()
  await expect(settings.locator('.code-panel code')).toContainText('hat={"beanie"}')
  await expect(settings.locator('.code-panel code')).toContainText('type={"connector"}')
  await expect(settings.locator('.code-panel code')).toContainText('color={"#1ED3C6"}')
  await code.press('Home')
  await expect(customize).toBeFocused()
  await expect(
    settings.getByRole('button', { name: 'Choose outfit: Builder', exact: true })
  ).toBeVisible()
})
