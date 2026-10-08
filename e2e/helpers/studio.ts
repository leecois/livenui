import { expect, type Page } from '@playwright/test'

export async function openStudioBrowser(page: Page) {
  const root = page.locator('.studio-root')
  await expect
    .poll(async () =>
      root.evaluate((element) => element.clientWidth >= 1100 === element.hasAttribute('data-wide'))
    )
    .toBe(true)
  const browser = page.getByRole('dialog', { name: 'Components', exact: true, includeHidden: true })
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
  await closeStudioBrowser(page)
  await page.getByRole('tab', { name: 'Presets', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'Presets', exact: true })).toBeVisible()
}
