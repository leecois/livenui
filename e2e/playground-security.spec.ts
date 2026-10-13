import { expect, test } from '@playwright/test'
import { closeStudioBrowser } from './helpers/studio'

test('orb render budgets reject unsafe links, imports, presets and direct edits', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const props = { state: 'connecting', size: 64, dots: 10000 }
  await page.addInitScript(
    ({ theme, props }) => {
      localStorage.setItem('theme', theme)
      localStorage.setItem(
        'livenui-presets',
        JSON.stringify([
          { id: 'unsafe', name: 'Excessive density', library: 'orbs', variant: 'ring', props },
          {
            id: 'safe',
            name: 'Safe connections',
            library: 'orbs',
            variant: 'ring',
            props: { state: 'connecting', dots: 1.5 },
          },
        ])
      )
    },
    { theme: testInfo.project.name.endsWith('dark') ? 'dark' : 'light', props }
  )
  const hash = new URLSearchParams({
    config: JSON.stringify({ library: 'orbs', variant: 'ring', props }),
  })
  await page.goto(`/studio?library=orbs#${hash}`)
  await closeStudioBrowser(page)
  const canvas = page.locator('.preview-stage canvas')
  const code = page.locator('.code-panel code')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.control-notice')).toContainText('playground')
  const before = await code.textContent()
  await canvas.evaluate((element) => {
    element.dataset.auditRetained = 'true'
  })
  await page.getByRole('button', { name: 'Edit JSON', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Edit component props', exact: true })
  for (const invalid of [
    { state: 'connecting', opts: { nodeN: 10000 } },
    { state: 'connecting', opts: { nodeN: -2 } },
  ]) {
    await editor.fill(JSON.stringify(invalid))
    await page.getByRole('button', { name: 'Apply configuration', exact: true }).click()
    await expect(code).toHaveText(before || '')
    await expect(canvas).toHaveAttribute('data-audit-retained', 'true')
  }
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await page.getByLabel('Import configuration file').setInputFiles({
    name: 'excessive-orb.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ library: 'orbs', props })),
  })
  await expect(page.locator('.transfer-notice')).toContainText('playground')
  await expect(code).toHaveText(before || '')
  await page.getByRole('tab', { name: 'Presets', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Excessive density', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Safe connections', exact: true }).click()
  await page.getByRole('tab', { name: 'Customize', exact: true }).click()
  await page.getByRole('button', { name: 'Show advanced settings', exact: true }).click()
  const density = page.locator('#prop-dots')
  await density.fill('10000')
  await density.press('Enter')
  await expect(code).toContainText('dots={1.5}')
  await density.press('Escape')
  await density.fill('2')
  await density.press('Enter')
  await expect(code).toContainText('dots={2}')
  await editor.fill(JSON.stringify({ state: 'working', opts: { nodeN: 10000 } }))
  await page.getByRole('button', { name: 'Apply configuration', exact: true }).click()
  await expect(code).toContainText('state={"working"}')
  await page.getByRole('radio', { name: 'Connecting', exact: true }).click()
  await expect(page.locator('.control-notice')).toContainText('playground render budget')
  await expect(code).toContainText('state={"working"}')
  await page.getByRole('radio', { name: 'Working', exact: true }).check()
  await expect(canvas).toBeVisible()
  await expect(page.locator('.preview-stage [role="alert"]')).toHaveCount(0)
  expect(errors).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('safe-orb-full-page.png'), fullPage: true })
})

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
