import { expect, test } from '@playwright/test'
import { chooseOption } from './helpers/choices'
import { closeStudioBrowser, openStudioBrowser } from './helpers/studio'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => {
      localStorage.setItem('theme', theme)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            if (Reflect.get(window, 'denyCopy')) throw new Error('Clipboard unavailable')
            Reflect.set(window, 'copiedText', text)
          },
        },
      })
    },
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('compact settings retain context, native values and stable copy feedback', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await page.goto('/studio?library=beam')
  const settings = page.locator('.controls-panel')
  const code = page.locator('.code-panel code')
  const palette = settings.getByRole('group', { name: 'Palette', exact: true })
  await chooseOption(settings, 'Palette', 'sunset')
  await expect(code).toContainText('colorVariant={"sunset"}')
  await palette.getByRole('button', { name: 'Use default for Palette', exact: true }).click()
  await expect(code).not.toContainText('colorVariant={')
  await expect(palette).toHaveAccessibleDescription('Using component default')
  const status = palette.locator('.status-label')
  await expect(status).toHaveText('Default')
  expect(
    await status.evaluate((element) => ({
      tag: element.tagName,
      tab: element.hasAttribute('tabindex'),
      height: element.getBoundingClientRect().height,
    }))
  ).toMatchObject({ tag: 'SPAN', tab: false, height: 26 })
  await page.screenshot({
    path: testInfo.outputPath('studio-clean-settings-full-page.png'),
    fullPage: true,
  })
  const sunset = palette.getByRole('radio', { name: 'Sunset', exact: true })
  await sunset.focus()
  await sunset.press('Space')
  await expect(sunset).toBeChecked()
  await expect(code).toContainText('colorVariant={"sunset"}')
  await expect(status).toHaveCount(0)
  const browser = await openStudioBrowser(page)
  const small = browser.getByRole('radio', { name: 'Small beam', exact: true })
  await expect(small.locator('..').locator('span')).toHaveText('Small')
  await small.check()
  await expect(code).toContainText('size={"sm"}')
  await closeStudioBrowser(page)
  const advanced = settings.getByRole('button', { name: 'Show advanced settings', exact: true })
  await expect(advanced).toHaveText('Advanced')
  await advanced.click()
  await expect(
    settings.getByRole('button', { name: 'Show essential controls', exact: true })
  ).toHaveText('Essential')
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  const copy = page
    .locator('.code-panel')
    .getByRole('button', { name: 'Copy snippet', exact: true })
  await expect.poll(() => copy.innerText()).toBe('Copy')
  await page.evaluate(() => document.fonts.ready)
  const bounds = await copy.boundingBox()
  const snippet = await code.textContent()
  await copy.click()
  await expect(copy.locator('[aria-live]')).toHaveText('Copied')
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'copiedText'))).toBe(snippet)
  await expect.poll(() => copy.boundingBox()).toEqual(bounds)
  await expect(copy).toHaveAccessibleName('Copy snippet')
  await page.evaluate(() => Reflect.set(window, 'denyCopy', true))
  await copy.click()
  await expect(copy.locator('[aria-live]')).toHaveText('Copy failed')
  await expect.poll(() => copy.boundingBox()).toEqual(bounds)
  await expect(copy).toHaveAccessibleName('Copy snippet')
  await page.screenshot({
    path: testInfo.outputPath('studio-clean-code-full-page.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 320, height: 1000 })
  await expect(copy).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const headerCopy = page
    .locator('.studio-header')
    .getByRole('button', { name: 'Copy code', exact: true })
  const headerBounds = await headerCopy.boundingBox()
  const iconBounds = await headerCopy.locator('svg').boundingBox()
  if (!headerBounds || !iconBounds) throw new Error('Missing compact copy action')
  expect(headerBounds.width).toBe(44)
  expect(headerBounds.height).toBe(44)
  expect(iconBounds.x).toBeGreaterThanOrEqual(headerBounds.x)
  expect(iconBounds.x + iconBounds.width).toBeLessThanOrEqual(headerBounds.x + headerBounds.width)
  expect(Math.abs(iconBounds.x + iconBounds.width / 2 - headerBounds.x - 22)).toBeLessThan(1)
  await headerCopy.click()
  await expect(headerCopy).toHaveAttribute('title', 'Copy failed')
  await expect.poll(() => headerCopy.boundingBox()).toEqual(headerBounds)
  await page.screenshot({ path: testInfo.outputPath('studio-clean-code-320.png'), fullPage: true })
})

test('avatar labels retain outfit context and playback without replacing the renderer', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.labelProbe = 'retained'
  })
  const settings = chat.locator('.avatar-chat-settings')
  if (!(await settings.isVisible()))
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  const play = settings.getByRole('button', { name: 'Play avatar', exact: true })
  await expect(play).toHaveText('Play')
  await play.click()
  const pause = settings.getByRole('button', { name: 'Pause avatar', exact: true })
  await expect(pause).toHaveText('Pause')
  await pause.click()
  await chooseOption(settings, 'Outfit', 'Chef')
  await settings.locator('summary').click()
  await chooseOption(settings, 'Glasses', 'round')
  const outfit = settings.getByRole('group', { name: 'Outfit', exact: true })
  await expect(outfit.locator('.status-label')).toHaveText('Custom')
  await expect(outfit.locator('.status-label')).toHaveAttribute('title', 'Custom outfit')
  await expect(actor).toBeVisible()
  await expect(actor).toHaveAttribute('data-label-probe', 'retained')
  await outfit.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: testInfo.outputPath('avatar-clean-labels-full-page.png'),
    fullPage: true,
  })
  await settings.getByRole('tab', { name: 'Code', exact: true }).click()
  await expect(settings.locator('.code-panel code')).toContainText('hat={"beret"}')
  await expect(settings.locator('.code-panel code')).toContainText('glasses={"round"}')
  await expect(settings.locator('.code-panel code')).toContainText('bowTie={true}')
  await expect(actor).toHaveAttribute('data-label-probe', 'retained')
})
