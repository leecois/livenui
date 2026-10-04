import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

for (const library of ['orbs', 'beam', 'voice']) {
  test(`${library}: playback controls and JSON match the preview`, async ({ page }) => {
    await page.goto(`/studio?library=${library}`)
    const property = library === 'orbs' ? 'paused' : 'active'
    const initiallyChecked = library === 'orbs'
    const field = page.locator(`#prop-${property}`)
    await expect(page.getByRole('button', { name: '▶ Play', exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Show advanced settings/ }).click()
    await expect(field).toBeChecked({ checked: initiallyChecked })
    await page.getByRole('button', { name: '▶ Play', exact: true }).click()
    await expect(field).toBeChecked({ checked: !initiallyChecked })
    await page.getByRole('tab', { name: 'JSON', exact: true }).click()
    const editor = page.getByLabel('Edit component props')
    const configuration = JSON.parse(await editor.inputValue())
    expect(configuration[property]).toBe(!initiallyChecked)
    await expect(page.locator('.code-panel code')).toContainText(
      `${property}={${!initiallyChecked}}`
    )
    await editor.fill('{ invalid draft')
    await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
    await expect(editor).toHaveValue('{ invalid draft')
    await page.getByRole('tab', { name: 'Controls', exact: true }).click()
    await expect(field).toBeChecked({ checked: initiallyChecked })
  })
}

test('saved presets restore playback after a reduced-motion reload', async ({ page }) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.getByRole('tab', { name: 'Examples & saved', exact: true }).click()
  await page.getByLabel('Preset name', { exact: true }).fill('Playing configuration')
  await page.getByRole('button', { name: /Save preset/ }).click()
  await expect(page.locator('.control-notice')).toContainText('Preset saved')
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('livenui-presets') || '[]')[0].props)
  ).toMatchObject({ paused: false })
  await page.reload()
  await expect(page.getByRole('button', { name: '▶ Play', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Examples & saved', exact: true }).click()
  await page.getByRole('button', { name: /^Playing configuration/ }).click()
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeVisible()
  await expect(page.locator('.code-panel code')).toContainText('paused={false}')
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  expect(JSON.parse(await page.getByLabel('Edit component props').inputValue()).paused).toBe(false)
})

test('Voice native freeze remains independent from toolbar activation', async ({ page }) => {
  await page.goto('/studio?library=voice')
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  await page.getByLabel('Edit component props').fill('{"active":true,"paused":true,"level":0.5}')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toHaveText('Configuration applied.')
  const pause = page.getByRole('button', { name: 'Ⅱ Pause', exact: true })
  const code = page.locator('.code-panel code')
  await expect(pause).toBeVisible()
  await expect(code).toContainText('active={true}')
  await expect(code).toContainText('paused={true}')
  await page.getByRole('tab', { name: 'Controls', exact: true }).click()
  await page.getByRole('button', { name: /Show advanced settings/ }).click()
  const freeze = page.locator('#prop-paused')
  const active = page.locator('#prop-active')
  await expect(freeze).toBeChecked()
  await freeze.uncheck()
  await expect(pause).toBeVisible()
  await expect(active).toBeChecked()
  await freeze.check()
  await expect(pause).toBeVisible()
  await expect(code).toContainText('paused={true}')
  await pause.click()
  await expect(code).toContainText('active={false}')
  await expect(code).toContainText('paused={true}')
  await expect(freeze).toBeChecked()
  await expect(active).not.toBeChecked()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await expect(code).toContainText('active={true}')
  await expect(code).toContainText('paused={true}')
  await expect(freeze).toBeChecked()
})

test('Metal variant changes replace the open JSON editor with valid variant props', async ({
  page,
}) => {
  await page.goto('/studio?library=metal')
  await expect(page.locator('.preview-stage .metal-fx-root')).toBeVisible()
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  const editor = page.getByLabel('Edit component props')
  await page.getByRole('button', { name: 'text', exact: true }).click()
  expect(JSON.parse(await editor.inputValue())).toMatchObject({
    font: '500 24px/1.2 system-ui',
    paused: true,
  })
  expect(JSON.parse(await editor.inputValue())).not.toHaveProperty('preset')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toHaveText('Configuration applied.')
  await expect(page.locator('.code-panel code')).toContainText('MetalText')
  await page.getByRole('button', { name: 'badge', exact: true }).click()
  expect(JSON.parse(await editor.inputValue())).toMatchObject({ scale: 1, paused: true })
  expect(JSON.parse(await editor.inputValue())).not.toHaveProperty('font')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toHaveText('Configuration applied.')
  await expect(page.locator('.code-panel code')).toContainText('MetalBadge')
})

test('import and reset update an already open JSON editor', async ({ page }) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  const editor = page.getByLabel('Edit component props')
  await editor.fill('{ invalid draft')
  await page.locator('summary').filter({ hasText: 'Save or hand off' }).click()
  await page.getByLabel('Import configuration file').setInputFiles({
    name: 'playing-orbs.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      '{"library":"orbs","variant":"ring","props":{"state":"listening","paused":false}}'
    ),
  })
  await expect(page.locator('.transfer-notice')).toContainText('Configuration imported.')
  expect(JSON.parse(await editor.inputValue())).toEqual({ state: 'listening', paused: false })
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  expect(JSON.parse(await editor.inputValue())).toMatchObject({
    state: 'working',
    size: 64,
    paused: false,
  })
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toHaveText('Configuration applied.')
})
