import { expect, type Locator, type Page } from '@playwright/test'
import { openStudioBrowser } from './studio'

export async function chooseOption(scope: Page | Locator, label: string, value: string) {
  if (label === 'Starting point') await openStudioBrowser('page' in scope ? scope.page() : scope)
  const group = scope.getByRole('group', {
    name: label,
    exact: true,
    includeHidden: label === 'Starting point',
  })
  await expect(group).toBeVisible()
  const option = group.locator(`input[type="radio"][value=${JSON.stringify(value)}]`)
  if (!(await option.count())) await group.getByRole('button', { name: /^Browse all / }).click()
  await option.check()
  await expect(option).toBeChecked()
  return option
}

export async function changeLibrary(page: Page, library: string) {
  await openStudioBrowser(page)
  await page
    .getByRole('navigation', { name: 'Component', exact: true })
    .locator(`a[href="/studio?library=${library}"]`)
    .click()
}
