import { expect, test } from '@playwright/test'
import { changeLibrary, chooseOption } from './helpers/choices'
import { closeStudioBrowser, openStudioBrowser, openStudioPresets } from './helpers/studio'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('Studio scroll panels omit focus frames while controls retain focus cues', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: testInfo.project.use.viewport?.width || 1440, height: 800 })
  await page.goto('/studio?library=beam')
  await expect(page.locator('.preview-stage .beam-host')).toBeVisible()
  const browser = await openStudioBrowser(page)
  const panels = [
    { name: 'browser', region: browser.locator('.studio-panel-scroll') },
    { name: 'preview', region: page.locator('.studio-preview') },
    { name: 'inspector', region: page.locator('.studio-inspector > .studio-panel-scroll') },
  ]
  for (const { name, region } of panels) {
    if (name === 'preview') await closeStudioBrowser(page)
    await page.keyboard.press('Tab')
    const original = await region.getAttribute('tabindex')
    const before = await region.boundingBox()
    await region.evaluate((element) => {
      element.tabIndex = -1
      element.focus({ preventScroll: true })
    })
    await expect(region).toBeFocused()
    const focus = await region.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        visible: element.matches(':focus-visible'),
        outline: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
        shadow: style.boxShadow,
        overflow: element.scrollHeight > element.clientHeight,
      }
    })
    expect(focus.visible).toBe(true)
    expect(focus.outline).toBe('none')
    expect(focus.width).toBe(0)
    expect(focus.shadow).toBe('none')
    await expect(region).toHaveCSS('outline-style', 'none')
    await expect(region).toHaveCSS('outline-width', '0px')
    expect(await region.boundingBox()).toEqual(before)
    await page.screenshot({
      path: testInfo.outputPath(`${name}-scroll-focus-full-page.png`),
      fullPage: true,
    })
    if (focus.overflow) {
      await region.press('End')
      await expect.poll(() => region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
      await expect
        .poll(() =>
          region.evaluate(
            (element) => element.scrollHeight - element.clientHeight - element.scrollTop
          )
        )
        .toBeLessThanOrEqual(1)
      await region.press('Home')
      await expect.poll(() => region.evaluate((element) => element.scrollTop)).toBe(0)
    }
    await region.evaluate((element, value) => {
      if (value === null) element.removeAttribute('tabindex')
      else element.setAttribute('tabindex', value)
    }, original)
  }
  await openStudioBrowser(page)
  await page.keyboard.press('Tab')
  const link = browser.getByRole('link', { name: 'Border beam', exact: true })
  await link.focus()
  expect(await link.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  await expect(link).toHaveCSS('outline-width', '2px')
  await expect(link).toHaveCSS('outline-offset', '-2px')
  const starting = browser.getByRole('group', { name: 'Starting point', exact: true })
  const option = starting.getByRole('radio').first()
  await option.focus()
  expect(await option.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  await expect(starting.locator('.field-option > span').first()).toHaveCSS('box-shadow', /inset/)
  await page.screenshot({
    path: testInfo.outputPath('choice-focus-full-page.png'),
    fullPage: true,
  })
  await openStudioPresets(page)
  const inspector = page.locator('.studio-inspector')
  const input = inspector.getByRole('textbox', { name: 'Preset name', exact: true })
  await input.focus()
  expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  await expect(input).toHaveCSS('outline-width', '2px')
  await expect(input).toHaveCSS('outline-offset', '-2px')
  await expect(inspector.locator('.studio-panel-scroll')).toHaveCSS('outline-style', 'none')
  await page.screenshot({
    path: testInfo.outputPath('input-focus-full-page.png'),
    fullPage: true,
  })
  await page.keyboard.press('Shift+Tab')
  const save = inspector.getByRole('button', { name: 'Save preset', exact: true })
  await expect(save).toBeFocused()
  await expect(save).toHaveCSS('outline-width', '2px')
  await expect(save).toHaveCSS('outline-offset', '-2px')
})

test('Studio Presets keeps configuration saving beside editing and code', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=beam')
  const scene = page.locator('.preview-stage .beam-host')
  await expect(scene).toBeVisible()
  await scene.evaluate((element) => element.setAttribute('data-preset-probe', 'retained'))
  const tabs = page.getByRole('tablist', { name: 'Studio view', exact: true })
  await expect(tabs.getByRole('tab')).toHaveText(['Customize', 'Presets', 'Code'])
  await expect(page.locator('.studio-browser .studio-presets')).toHaveCount(0)
  await tabs.getByRole('tab', { name: 'Customize', exact: true }).focus()
  for (const [key, name] of [
    ['ArrowRight', 'Presets'],
    ['ArrowRight', 'Code'],
    ['ArrowRight', 'Customize'],
    ['ArrowLeft', 'Code'],
    ['ArrowLeft', 'Presets'],
    ['Home', 'Customize'],
    ['End', 'Code'],
  ]) {
    await page.keyboard.press(key)
    const tab = tabs.getByRole('tab', { name, exact: true })
    await expect(tab).toBeFocused()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible()
    await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1)
  }
  await expect(scene).toHaveAttribute('data-preset-probe', 'retained')
  await tabs.getByRole('tab', { name: 'Customize', exact: true }).click()
  const duration = page.locator('#prop-duration')
  await duration.fill('6')
  await duration.press('Enter')
  const code = page.locator('.code-panel code')
  await expect(code).toContainText('duration={6}')
  const configured = await code.textContent()
  await page.getByRole('button', { name: 'Name a preset', exact: true }).click()
  const presets = page.getByRole('tabpanel', { name: 'Presets', exact: true })
  await expect(presets).toBeVisible()
  await expect(tabs.getByRole('tab', { name: 'Presets', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  const input = presets.getByRole('textbox', { name: 'Preset name', exact: true })
  await expect(input).toBeFocused()
  await input.fill('Beam configuration')
  await tabs.getByRole('tab', { name: 'Code', exact: true }).click()
  await expect(code).toHaveText(configured || '')
  await openStudioPresets(page)
  await expect(input).toHaveValue('Beam configuration')
  await expect(scene).toHaveAttribute('data-preset-probe', 'retained')
  await page.screenshot({ path: testInfo.outputPath('presets-name-full-page.png'), fullPage: true })
  await input.press('Enter')
  const saved = presets.locator('.preset-row').getByRole('button', {
    name: 'Beam configuration',
    exact: true,
  })
  await expect(saved).toBeVisible()
  await expect(presets.getByRole('status')).toContainText('Preset saved on this device.')
  await tabs.getByRole('tab', { name: 'Customize', exact: true }).click()
  await duration.fill('2')
  await duration.press('Enter')
  await expect(code).toContainText('duration={2}')
  await openStudioPresets(page)
  await saved.click()
  await expect(code).toHaveText(configured || '')
  await page.screenshot({
    path: testInfo.outputPath('presets-saved-full-page.png'),
    fullPage: true,
  })
  await page.reload()
  await openStudioPresets(page)
  await saved.click()
  await expect(code).toHaveText(configured || '')
  await presets.getByRole('button', { name: 'Delete Beam configuration', exact: true }).click()
  await expect(saved).toHaveCount(0)
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
  await expect(workspace.getByRole('heading', { name: 'Install', exact: true })).toBeVisible()
  const notes = workspace.locator('details').filter({ hasText: 'Integration notes' })
  await expect(notes).not.toHaveAttribute('open')
  await notes.locator('summary').click()
  await expect(notes.getByText(/Adjust the import/)).toBeVisible()
  await notes.locator('summary').click()
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
  await page.getByRole('button', { name: 'Play', exact: true }).click()
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
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
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
