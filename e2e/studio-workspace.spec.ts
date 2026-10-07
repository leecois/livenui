import { expect, test } from '@playwright/test'
import { changeLibrary, chooseOption } from './helpers/choices'
import { closeStudioBrowser, openStudioBrowser } from './helpers/studio'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('Studio keeps preview, independent scrolling and keyboard tabs in its viewport', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=avatars')
  const workspace = page.getByRole('dialog', { name: 'Studio workspace', exact: true })
  await expect(workspace).toBeVisible()
  await expect(page.locator('.preview-stage canvas')).toBeVisible()
  const canvas = await page.locator('.preview-stage canvas').elementHandle()
  const layout = await workspace.evaluate((element) => {
    const root = element.getBoundingClientRect()
    const preview = element.querySelector('.studio-preview')?.getBoundingClientRect()
    const inspector = element.querySelector('.studio-inspector')?.getBoundingClientRect()
    if (!preview || !inspector) throw new Error('Missing workspace panels')
    return {
      width: root.width,
      height: root.height,
      vertical: inspector.top >= preview.bottom - 1,
      horizontal: inspector.left >= preview.right - 1,
    }
  })
  expect(layout.width).toBe(testInfo.project.use.viewport?.width)
  expect(layout.height).toBe(1000)
  expect(layout.vertical).toBe(layout.width < 700)
  expect(layout.horizontal).toBe(layout.width >= 700)
  const customize = workspace.getByRole('tab', { name: 'Customize', exact: true })
  await customize.focus()
  await page.keyboard.press('End')
  await expect(workspace.getByRole('tab', { name: 'Code', exact: true })).toBeFocused()
  await expect(
    workspace.getByRole('heading', { name: '1. Add Liven UI source', exact: true })
  ).toBeVisible()
  await chooseOption(page, 'Package manager', 'bun')
  await expect(page.locator('.install-command code')).toContainText('bunx')
  expect(await canvas?.evaluate((element) => element.isConnected)).toBe(true)
  await page.keyboard.press('Home')
  await customize.click()
  const before = await page.locator('.studio-inspector-toolbar').boundingBox()
  await page.locator('.studio-inspector > .studio-panel-scroll').evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  expect(await page.locator('.studio-inspector-toolbar').boundingBox()).toEqual(before)
  await expect(customize).toBeVisible()
  expect(await workspace.evaluate((element) => [element.scrollTop, element.scrollLeft])).toEqual([
    0, 0,
  ])
  await page.locator('.studio-inspector > .studio-panel-scroll').evaluate((element) => {
    element.scrollTop = 0
  })
  const browser = await openStudioBrowser(page)
  await expect(
    browser.getByRole('navigation', { name: 'Component', exact: true }).getByRole('link')
  ).toHaveCount(7)
  if (layout.width < 1100) {
    expect(await browser.evaluate((element) => element.matches(':modal'))).toBe(true)
    await closeStudioBrowser(page)
    await expect(page.getByRole('button', { name: 'Components', exact: true })).toBeFocused()
  }
  await page.screenshot({
    path: testInfo.outputPath('studio-workspace-full-page.png'),
    fullPage: true,
  })
  expect(await canvas?.evaluate((element) => element.isConnected)).toBe(true)
})

test('component navigation restores unsaved props, playback, JSON drafts and preview width', async ({
  page,
}) => {
  await page.goto('/studio?library=orbs')
  await expect(page.locator('.preview-stage canvas')).toBeVisible()
  const canvas = await page.locator('.preview-stage canvas').elementHandle()
  await chooseOption(page, 'State', 'listening')
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.getByRole('button', { name: 'Mobile', exact: true }).click()
  await page.locator('.studio-json-toggle').click()
  await page.getByLabel('Edit component props').fill('{ keep this unfinished draft')
  const original = await page.locator('.code-panel code').textContent()
  await changeLibrary(page, 'voice')
  await expect(page.locator('.preview-stage [data-voice-beam]')).toBeVisible()
  expect(await canvas?.evaluate((element) => element.isConnected)).toBe(false)
  await changeLibrary(page, 'orbs')
  await expect(
    page.getByRole('group', { name: 'State', exact: true }).getByLabel('Listening', { exact: true })
  ).toBeChecked()
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mobile', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByLabel('Edit component props')).toHaveValue('{ keep this unfinished draft')
  await expect(page.locator('.code-panel code')).toHaveText(original || '')
  await expect(page.locator('.preview-stage canvas')).toHaveCount(1)
})

test('Studio opens before hydration on entry and reload', async ({ page }, testInfo) => {
  let release!: () => void
  let pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/_next/**/*.js', async (route) => {
    await pending
    await route.continue()
  })
  for (const entry of ['entry', 'reload']) {
    if (entry === 'entry') await page.goto('/studio?library=metal', { waitUntil: 'commit' })
    else await page.reload({ waitUntil: 'commit' })
    const workspace = page.getByRole('dialog', { name: 'Studio workspace', exact: true })
    await expect(workspace).toBeVisible()
    expect(await workspace.evaluate((element) => element.matches(':modal'))).toBe(true)
    await expect(
      workspace.getByRole('heading', { name: 'Studio / Metal', exact: true })
    ).toBeVisible()
    await expect(page.locator('.preview-stage canvas')).toHaveCount(0)
    await page.screenshot({
      path: testInfo.outputPath(`studio-${entry}-before-hydration.png`),
      fullPage: true,
    })
    release()
    await expect(page.locator('.preview-stage .metal-fx-root')).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath(`studio-${entry}-ready.png`),
      fullPage: true,
    })
    pending = new Promise<void>((resolve) => {
      release = resolve
    })
  }
  release()
})

test('fullscreen theme switching keeps rendering and integration code in sync', async ({
  page,
}, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  const next = theme === 'dark' ? 'light' : 'dark'
  const configuration = new URLSearchParams({
    config: JSON.stringify({
      library: 'avatars',
      variant: 'ring',
      props: { type: 'clover', size: 96, theme },
    }),
  })
  await page.goto(`/studio?library=avatars#${configuration}`)
  const canvas = page.locator('.preview-stage canvas')
  await expect(canvas).toBeVisible()
  const instance = await canvas.elementHandle()
  const code = page.locator('.code-panel code')
  await expect(code).toContainText(`theme={"${theme}"}`)
  await page.getByRole('button', { name: `Switch to ${next} theme`, exact: true }).click()
  await expect(page.locator('html')).toHaveClass(new RegExp(next))
  await expect(code).toContainText(`theme={"${next}"}`)
  expect(await instance?.evaluate((element) => element.isConnected)).toBe(true)
  const copy = page
    .locator('.studio-header')
    .getByRole('button', { name: 'Copy code', exact: true })
  const bounds = await copy.boundingBox()
  if (!bounds) throw new Error('Missing header copy action')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(testInfo.project.use.viewport?.width || 1440)
  await page.getByRole('button', { name: `Switch to ${theme} theme`, exact: true }).click()
  await expect(code).toContainText(`theme={"${theme}"}`)
})
