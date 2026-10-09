import { expect, test } from '@playwright/test'
import { closeStudioBrowser } from './helpers/studio'

test('untrusted SVG filters cannot execute through shared configuration, JSON or presets', async ({
  page,
}, testInfo) => {
  const filter =
    '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="/__audit_missing_image__" onerror="document.documentElement.dataset.auditSvg=1"></div></foreignObject>'
  const props = { filter }
  await page.addInitScript(
    ({ theme, props }) => {
      localStorage.setItem('theme', theme)
      localStorage.setItem(
        'livenui-presets',
        JSON.stringify([
          { id: 'unsafe', name: 'Unsafe filter', library: 'gooey', variant: 'ring', props },
          { id: 'safe', name: 'Safe blur', library: 'gooey', variant: 'ring', props: { blur: 8 } },
        ])
      )
    },
    { theme: testInfo.project.name.endsWith('dark') ? 'dark' : 'light', props }
  )
  const hash = new URLSearchParams({
    config: JSON.stringify({ library: 'gooey', variant: 'ring', props }),
  })
  await page.goto(`/studio?library=gooey#${hash}`)
  await closeStudioBrowser(page)
  const scene = page.locator('[data-gooey-svg]').first()
  await expect(scene).toBeVisible()
  await expect(
    page.getByRole('status').filter({ hasText: 'filter requires application code' })
  ).toBeVisible()
  await expect(page.locator('[onerror], [onload]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.dataset.auditSvg)).toBeUndefined()
  await page.getByRole('button', { name: 'Edit JSON', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Edit component props', exact: true })
    .fill(JSON.stringify(props))
  await page.getByRole('button', { name: 'Apply configuration', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'filter requires application code' })
  ).toBeVisible()
  await expect(scene).toBeVisible()
  await page.getByRole('tab', { name: 'Presets', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unsafe filter', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Safe blur', exact: true }).click()
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  await expect(page.locator('.code-panel code')).toContainText('blur={8}')
  await expect(page.locator('[onerror], [onload]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.dataset.auditSvg)).toBeUndefined()
  await page.screenshot({ path: testInfo.outputPath('safe-gooey-full-page.png'), fullPage: true })
})
