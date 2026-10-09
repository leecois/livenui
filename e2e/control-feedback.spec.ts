import { expect, type Locator, test } from '@playwright/test'
import { tabKey } from './helpers/keyboard'

async function containedFocus(shell: Locator, input: Locator) {
  await shell.scrollIntoViewIfNeeded()
  const bounds = await shell.boundingBox()
  await input.focus()
  await expect(input).toBeFocused()
  await expect(shell).toHaveCSS('outline-style', 'solid')
  await expect(shell).toHaveCSS('outline-width', '2px')
  await expect(shell).toHaveCSS('outline-offset', '-2px')
  await expect(input).toHaveCSS('outline-style', 'none')
  expect(await shell.boundingBox()).toEqual(bounds)
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => {
      localStorage.setItem('theme', theme)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => Reflect.set(window, 'copiedText', text),
        },
      })
    },
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('compound editors keep one contained cue while applying exported values', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=orbs')
  const actor = page.locator('.preview-stage canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.focusProbe = 'retained'
  })
  const speed = page
    .locator('.controls-panel .number-row')
    .filter({ has: page.locator('#prop-speed') })
  const number = speed.getByRole('spinbutton', { name: 'Speed', exact: true })
  await containedFocus(speed, number)
  await number.fill('1.5')
  await number.press('Enter')
  await expect(page.locator('.code-panel code')).toContainText('speed={1.5}')
  await speed.screenshot({ path: testInfo.outputPath('number-focus.png') })
  const color = page.locator('.controls-panel .color-row').first()
  const input = color.locator(':scope > input')
  await containedFocus(color, input)
  await input.fill('#38bdf8')
  await input.press('Enter')
  await expect(page.locator('.code-panel code')).toContainText('color={"#38bdf8"}')
  await expect(actor).toHaveAttribute('data-focus-probe', 'retained')
  await page.screenshot({ path: testInfo.outputPath('color-focus-full-page.png'), fullPage: true })
  await color.screenshot({ path: testInfo.outputPath('color-focus.png') })

  await page.goto('/studio?library=gooey')
  await page.getByRole('button', { name: 'Show advanced settings', exact: true }).click()
  const text = page
    .locator('.controls-panel .text-row')
    .filter({ has: page.locator('#prop-filter') })
  const filter = text.locator('input')
  await containedFocus(text, filter)
  await filter.fill('blur(0px)')
  await expect(page.locator('.code-panel code')).toContainText('filter={"blur(0px)"}')
  await text.screenshot({ path: testInfo.outputPath('text-focus.png') })
  await page.setViewportSize({ width: 320, height: 1000 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('native focus and press feedback preserve emphasis and stationary segmented targets', async ({
  page,
  browserName,
}, testInfo) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  const copy = page
    .locator('.install-panel')
    .getByRole('button', { name: 'Copy command', exact: true })
  await page.mouse.click(1, 1)
  await copy.click()
  await expect(copy).not.toHaveCSS('outline-style', 'solid')
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'copiedText')))
    .toContain('shadcn@latest')
  await copy.focus()
  await page.keyboard.press(tabKey(browserName))
  await page.keyboard.press(tabKey(browserName, true))
  await expect(copy).toBeFocused()
  await expect(copy).toHaveCSS('outline-offset', '-2px')
  await expect(copy).toHaveCSS('outline-width', '2px')
  await page.screenshot({
    path: testInfo.outputPath('keyboard-focus-full-page.png'),
    fullPage: true,
  })

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const replay = page.getByRole('button', { name: 'Replay', exact: true })
  await replay.hover()
  await page.mouse.down()
  await expect(replay).toHaveCSS('transform', 'matrix(0.98, 0, 0, 0.98, 0, 0)')
  await page.mouse.up()
  await expect(replay).toHaveCSS('transform', 'none')
  const code = page.getByRole('tab', { name: 'Code', exact: true })
  const before = await code.boundingBox()
  await code.hover()
  await page.mouse.down()
  await expect(code).toHaveCSS('transform', 'none')
  expect(await code.boundingBox()).toEqual(before)
  await expect(code).toHaveCSS('color', 'rgb(255, 255, 255)')
  const indicator = code.locator('..').locator('.selection-indicator')
  expect(
    await indicator.evaluate((element) => getComputedStyle(element).backgroundImage)
  ).toContain('linear-gradient')
  await page.mouse.up()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await replay.hover()
  await page.mouse.down()
  await expect(replay).toHaveCSS('transform', 'none')
  await page.mouse.up()
})

test('composer and send action have independent contained focus without replacing the avatar', async ({
  page,
  browserName,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.focusProbe = 'retained'
  })
  const composer = chat.locator('.avatar-chat-composer')
  const input = chat.getByRole('textbox', { name: 'Message Clover', exact: true })
  await containedFocus(composer, input)
  await input.fill('Say hello')
  await page.screenshot({
    path: testInfo.outputPath('composer-focus-full-page.png'),
    fullPage: true,
  })
  await composer.screenshot({ path: testInfo.outputPath('composer-focus.png') })
  await page.keyboard.press(tabKey(browserName))
  const send = chat.getByRole('button', { name: 'Send message', exact: true })
  await expect(send).toBeFocused()
  await expect(composer).toHaveCSS('outline-style', 'none')
  await expect(send).toHaveCSS('outline-width', '2px')
  await expect(send).toHaveCSS('outline-offset', '-2px')
  await expect(send).toHaveCSS('color', 'rgb(255, 255, 255)')
  await send.press('Enter')
  await expect(chat.locator('.avatar-chat-message')).not.toHaveCount(0)
  await expect(actor).toHaveAttribute('data-focus-probe', 'retained')
})
