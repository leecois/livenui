import { expect, test } from '@playwright/test'
import { chooseOption } from './helpers/choices'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('long preset choices expand inline and keep the selected native configuration visible', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=avatars')
  const context = page.locator('.studio-context')
  const starting = context.getByRole('group', { name: 'Starting point', exact: true })
  await expect(starting.getByRole('radio')).toHaveCount(6)
  await expect(context.locator('select')).toHaveCount(0)
  await chooseOption(context, 'Starting point', 'avatars-type-connector')
  await expect(page.locator('.preview-stage canvas')).toHaveAttribute(
    'data-bot-avatar',
    'connector'
  )
  await expect(page.locator('.code-panel code')).toContainText('type={"connector"}')
  await starting
    .getByRole('button', { name: 'Show fewer starting point options', exact: true })
    .click()
  const selected = starting.locator('input:checked')
  await expect(selected).toHaveValue('avatars-type-connector')
  await expect(selected).toBeVisible()
  await expect(starting.getByRole('radio')).toHaveCount(7)
  const options = await starting.locator('.field-option').evaluateAll((items) =>
    items.map((item) => ({
      height: item.getBoundingClientRect().height,
      contained: item.scrollWidth <= item.clientWidth,
    }))
  )
  expect(options.every((option) => option.height >= 44 && option.contained)).toBe(true)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({
    path: testInfo.outputPath('direct-studio-full-page.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 640, height: 1000 })
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(selected).toBeVisible()
  await context.screenshot({ path: testInfo.outputPath('direct-choices-zoom.png') })
})

test('outfit expansion preserves an option outside the compact set and the main renderer', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.choiceProbe = 'retained'
  })
  const settings = chat.locator('.avatar-chat-settings')
  if (!(await settings.isVisible()))
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(settings.locator('select')).toHaveCount(0)
  const outfit = settings.getByRole('group', { name: 'Outfit', exact: true })
  await chooseOption(settings, 'Outfit', 'Guard')
  await outfit.getByRole('button', { name: 'Show fewer outfit options', exact: true }).click()
  const guard = outfit.getByRole('radio', { name: 'Guard', exact: true })
  await expect(guard).toBeChecked()
  await expect(guard).toBeVisible()
  await expect(outfit.getByRole('radio')).toHaveCount(7)
  await guard.press('Space')
  expect(await guard.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  await expect(actor).toHaveAttribute('data-choice-probe', 'retained')
  await page.screenshot({ path: testInfo.outputPath('direct-chat-full-page.png'), fullPage: true })
  await settings.getByRole('tab', { name: 'Code', exact: true }).click()
  for (const prop of ['hat={"crown"}', 'glasses={"shades"}', 'bowTie={false}'])
    await expect(settings.locator('.code-panel code')).toContainText(prop)
})
