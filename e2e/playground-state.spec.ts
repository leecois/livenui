import { expect, type Page, test } from '@playwright/test'
import { closeStudioBrowser, openStudioPresets } from './helpers/studio'

declare global {
  interface Window {
    __configurationReads: { resolve: () => Promise<void>; reject: () => void }[]
  }
}

async function deferConfigurationReads(page: Page) {
  await page.addInitScript(() => {
    window.__configurationReads = []
    const read = File.prototype.text
    File.prototype.text = function () {
      const contents = read.call(this)
      return new Promise<string>((resolve, reject) => {
        window.__configurationReads.push({
          resolve: async () => resolve(await contents),
          reject: () => reject(new Error('Deferred read failed.')),
        })
      })
    }
  })
}

async function importDeferred(page: Page, props: object, variant = 'ring') {
  await page.getByLabel('Import configuration file').setInputFiles({
    name: 'configuration.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ variant, props })),
  })
}

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

test('malformed structured JSON and imports preserve the working Voice preview and code', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/studio?library=voice')
  const code = page.locator('.code-panel code')
  await expect(page.locator('.preview-stage [data-voice-beam]')).toBeVisible()
  const before = await code.textContent()
  await page.locator('.studio-json-toggle').click()
  const editor = page.getByLabel('Edit component props')
  await editor.fill('{"colors":{"core":"red"}}')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toContainText('colors has an incompatible value')
  await expect(code).toHaveText(before || '')
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await page.getByLabel('Import configuration file').setInputFiles({
    name: 'invalid-voice.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"library":"voice","props":{"bandColors":{"core":42}}}'),
  })
  await expect(page.locator('.transfer-notice')).toContainText(
    'bandColors has an incompatible value'
  )
  await expect(code).toHaveText(before || '')
  await expect(page.locator('.preview-stage [data-voice-beam]')).toBeVisible()
  await expect(page.locator('.preview-stage [role="alert"]')).toHaveCount(0)
  expect(errors).toEqual([])
})

for (const library of ['orbs', 'beam', 'voice']) {
  test(`${library}: playback controls and JSON match the preview`, async ({ page }) => {
    await page.goto(`/studio?library=${library}`)
    const property = library === 'orbs' ? 'paused' : 'active'
    const initiallyChecked = library === 'orbs'
    const field = page.locator(`#prop-${property}`)
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Show advanced settings/ }).click()
    await expect(field).toBeChecked({ checked: initiallyChecked })
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(field).toBeChecked({ checked: !initiallyChecked })
    await page.locator('.studio-json-toggle').click()
    const editor = page.getByLabel('Edit component props')
    const configuration = JSON.parse(await editor.inputValue())
    expect(configuration[property]).toBe(!initiallyChecked)
    await expect(page.locator('.code-panel code')).toContainText(
      `${property}={${!initiallyChecked}}`
    )
    await editor.fill('{ invalid draft')
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    await expect(editor).toHaveValue('{ invalid draft')
    await page.getByRole('tab', { name: 'Customize', exact: true }).click()
    await expect(field).toBeChecked({ checked: initiallyChecked })
  })
}

test('saved presets restore playback after a reduced-motion reload', async ({ page }) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await openStudioPresets(page)
  await page.getByRole('button', { name: 'New preset', exact: true }).click()
  await page.getByLabel('Preset name', { exact: true }).fill('Playing configuration')
  await page.getByRole('button', { name: /Save preset/ }).click()
  await expect(page.locator('.studio-save-notice')).toContainText('Preset saved')
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('livenui-presets') || '[]')[0].props)
  ).toMatchObject({ paused: false })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  await openStudioPresets(page)
  await page.getByRole('button', { name: /^Playing configuration/ }).click()
  await closeStudioBrowser(page)
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect(page.locator('.code-panel code')).toContainText('paused={false}')
  await page.getByRole('tab', { name: 'Customize', exact: true }).click()
  await page.locator('.studio-json-toggle').click()
  expect(JSON.parse(await page.getByLabel('Edit component props').inputValue()).paused).toBe(false)
})

test('Voice native freeze remains independent from toolbar activation', async ({ page }) => {
  await page.goto('/studio?library=voice')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.locator('.studio-json-toggle').click()
  await page.getByLabel('Edit component props').fill('{"active":true,"paused":true,"level":0.5}')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toHaveText('Configuration applied.')
  const pause = page.getByRole('button', { name: 'Pause', exact: true })
  const code = page.locator('.code-panel code')
  await expect(pause).toBeVisible()
  await expect(code).toContainText('active={true}')
  await expect(code).toContainText('paused={true}')
  await page.getByRole('tab', { name: 'Customize', exact: true }).click()
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
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(code).toContainText('active={true}')
  await expect(code).toContainText('paused={true}')
  await expect(freeze).toBeChecked()
})

test('Metal variant changes replace the open JSON editor with valid variant props', async ({
  page,
}) => {
  await page.goto('/studio?library=metal')
  await expect(page.locator('.preview-stage .metal-fx-root')).toBeVisible()
  await page.locator('.studio-json-toggle').click()
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
  await page.locator('.studio-json-toggle').click()
  const editor = page.getByLabel('Edit component props')
  await editor.fill('{ invalid draft')
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await page.getByLabel('Import configuration file').setInputFiles({
    name: 'playing-orbs.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      '{"library":"orbs","variant":"ring","props":{"state":"listening","paused":false}}'
    ),
  })
  await expect(page.locator('.transfer-notice')).toContainText('Configuration imported.')
  expect(JSON.parse(await editor.inputValue())).toEqual({ state: 'listening', paused: false })
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  expect(JSON.parse(await editor.inputValue())).toMatchObject({
    state: 'working',
    size: 64,
    paused: false,
  })
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toHaveText('Configuration applied.')
})

for (const completion of ['resolve', 'reject'] as const) {
  test(`a late import ${completion} cannot replace a newer imported configuration`, async ({
    page,
  }) => {
    await deferConfigurationReads(page)
    await page.goto('/studio?library=orbs')
    await page.locator('summary').filter({ hasText: 'Import & export' }).click()
    await importDeferred(page, { state: 'searching', paused: true })
    await importDeferred(page, { state: 'listening', paused: false })
    await expect.poll(() => page.evaluate(() => window.__configurationReads.length)).toBe(2)
    await page.evaluate(() => window.__configurationReads[1].resolve())
    await expect(page.locator('.code-panel code')).toContainText('state={"listening"}')
    await page.evaluate((action) => window.__configurationReads[0][action](), completion)
    await expect(page.locator('.code-panel code')).toContainText('state={"listening"}')
    await expect(page.locator('.transfer-notice')).toHaveText('Configuration imported.')
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  })
}

test('reset cancels a pending configuration import', async ({ page }) => {
  await deferConfigurationReads(page)
  await page.goto('/studio?library=orbs')
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await importDeferred(page, { state: 'listening', paused: false })
  await expect.poll(() => page.evaluate(() => window.__configurationReads.length)).toBe(1)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.evaluate(() => window.__configurationReads[0].resolve())
  await expect(page.locator('.code-panel code')).toContainText('state={"working"}')
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  await expect(page.locator('.transfer-notice')).toBeEmpty()
})

test('an unapplied numeric draft cancels a pending import and a same-value replacement clears it', async ({
  page,
}) => {
  await deferConfigurationReads(page)
  await page.goto('/studio?library=image')
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await importDeferred(page, { speed: 2, strength: 0.5 })
  await expect.poll(() => page.evaluate(() => window.__configurationReads.length)).toBe(1)
  const speed = page.getByRole('spinbutton', { name: 'Speed', exact: true })
  await speed.fill('1.7')
  await page.evaluate(() => window.__configurationReads[0].resolve())
  await expect(speed).toHaveValue('1.7')
  await expect(page.locator('.code-panel code')).toContainText('speed={1}')
  await expect(page.locator('.transfer-notice')).toBeEmpty()
  await importDeferred(page, { speed: 1, strength: 1 })
  await expect.poll(() => page.evaluate(() => window.__configurationReads.length)).toBe(2)
  await expect(speed).toHaveValue('1.7')
  await page.evaluate(() => window.__configurationReads[1].resolve())
  await expect(page.locator('.transfer-notice')).toHaveText('Configuration imported.')
  await expect(speed).toHaveValue('1')
  await speed.press('Enter')
  await expect(page.locator('.code-panel code')).toContainText('speed={1}')
})

test('a component variant selection cancels a pending configuration import', async ({ page }) => {
  await deferConfigurationReads(page)
  await page.goto('/studio?library=metal')
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await importDeferred(page, { strength: 0.4 })
  await expect.poll(() => page.evaluate(() => window.__configurationReads.length)).toBe(1)
  await page.getByRole('button', { name: 'text', exact: true }).click()
  await page.evaluate(() => window.__configurationReads[0].resolve())
  await expect(page.locator('.code-panel code')).toContainText('<MetalText')
  await expect(page.locator('.transfer-notice')).toBeEmpty()
})

test('image one-shot hide completes after pause and resume', async ({ page }) => {
  await page.goto('/studio?library=image')
  await expect(page.locator('.image-host')).toBeVisible()
  await expect(page.locator('.image-demo .demo-note')).toHaveText('Ready')
  await page.locator('.studio-json-toggle').click()
  await page
    .getByLabel('Edit component props')
    .fill(JSON.stringify({ autoReveal: false, revealFadeOutMs: 3000, paused: true }))
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.getByRole('button', { name: 'Reveal', exact: true }).click()
  await expect(page.locator('.image-demo .demo-note')).toHaveText('visible')
  await page.getByRole('button', { name: 'Hide', exact: true }).click()
  await expect(page.locator('.image-demo .demo-note')).toHaveText('hide')
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page.locator('.image-demo .demo-note')).toHaveText('idle')
  await expect(page.locator('.preview-stage [role="alert"]')).toHaveCount(0)
})
