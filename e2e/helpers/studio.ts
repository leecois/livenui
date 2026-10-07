import { expect, type Page } from '@playwright/test'

export async function openStudioBrowser(page: Page) {
  const root = page.locator('.studio-root')
  await expect
    .poll(async () =>
      root.evaluate((element) => element.clientWidth >= 1100 === element.hasAttribute('data-wide'))
    )
    .toBe(true)
  const browser = page.getByRole('dialog', { name: 'Components and presets', includeHidden: true })
  if (!(await browser.isVisible()))
    await page.getByRole('button', { name: 'Components', exact: true }).click()
  await expect(browser).toBeVisible()
  return browser
}

export async function closeStudioBrowser(page: Page) {
  const browser = page.locator('.studio-browser')
  if (await browser.evaluate((element) => element.matches(':modal')))
    await page.keyboard.press('Escape')
}

export async function openStudioPresets(page: Page) {
  const browser = await openStudioBrowser(page)
  await browser.getByLabel('Preset name', { exact: true }).scrollIntoViewIfNeeded()
}
