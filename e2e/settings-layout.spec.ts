import { expect, type Locator, test } from '@playwright/test'

async function contained(panel: Locator) {
  expect(
    await panel.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return [...element.querySelectorAll('input,select,button,.field-options')].every((node) => {
        const box = node.getBoundingClientRect()
        if (!box.width || !box.height) return true
        return box.left >= bounds.left && box.right <= bounds.right
      })
    })
  ).toBe(true)
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('settings keep labels and values aligned in compact rows across every library', async ({
  page,
}, testInfo) => {
  for (const library of ['beam', 'orbs', 'metal', 'gooey', 'voice', 'image', 'avatars']) {
    await page.goto(`/studio?library=${library}`)
    const panel = page.locator('.controls-panel')
    await expect(panel.getByRole('heading', { name: 'Customize', exact: true })).toBeVisible()
    await contained(panel)
    const rows = await panel.locator('.field-inline,.field-switch').evaluateAll((nodes) =>
      nodes.map((node) => {
        const label = node.querySelector('label')?.getBoundingClientRect()
        const control = node.querySelector('input,select')?.getBoundingClientRect()
        if (!label || !control) throw new Error('Incomplete settings row')
        const input = node.querySelector('input:not([type="checkbox"]),select')
        return {
          height: node.getBoundingClientRect().height,
          labelCenter: label.y + label.height / 2,
          controlCenter: control.y + control.height / 2,
          labelRight: label.right,
          controlLeft: control.left,
          controlHeight: control.height,
          inputBorder: input ? getComputedStyle(input).borderLeftWidth : null,
          inputBackground: input ? getComputedStyle(input).backgroundColor : null,
        }
      })
    )
    for (const row of rows) {
      expect(row.height).toBeLessThanOrEqual(62)
      expect(row.controlHeight).toBeGreaterThanOrEqual(44)
      expect(Math.abs(row.labelCenter - row.controlCenter)).toBeLessThan(1)
      expect(row.labelRight).toBeLessThanOrEqual(row.controlLeft)
      if (row.inputBorder !== null) {
        expect(row.inputBorder).toBe('0px')
        expect(row.inputBackground).toBe('rgba(0, 0, 0, 0)')
      }
    }
    const heading = await panel.locator('.controls-heading').boundingBox()
    const tabs = await panel.getByRole('tablist').boundingBox()
    if (!heading || !tabs) throw new Error('Missing settings navigation')
    expect(tabs.width).toBeLessThan(230)
    expect(tabs.y).toBeGreaterThanOrEqual(heading.y)
    if (testInfo.project.use.viewport?.width === 1440) {
      const title = await panel.getByRole('heading', { name: 'Customize' }).boundingBox()
      if (!title) throw new Error('Missing settings title')
      expect(Math.abs(title.y + title.height / 2 - (tabs.y + tabs.height / 2))).toBeLessThan(1)
    }
    await panel.screenshot({ path: testInfo.outputPath(`settings-${library}.png`) })
  }
  await page.goto('/agents/image')
  await contained(page.locator('.controls-panel'))
  await expect(page.locator('.controls-panel').getByRole('tablist')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('guide-full-page.png'), fullPage: true })
  await page.goto('/studio?library=image')
  await page.screenshot({ path: testInfo.outputPath('studio-full-page.png'), fullPage: true })
})

test('inline numbers, switches and radio tracks preserve typed configuration and keyboard focus', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=image')
  const speed = page.getByRole('spinbutton', { name: 'Speed', exact: true })
  await speed.fill('1.75')
  await expect(page.locator('.code-panel code')).toContainText('speed={1.75}')
  await speed.fill('')
  await expect(page.locator('.code-panel code')).not.toContainText('speed={')
  const toggle = page.getByRole('checkbox', { name: 'Auto Reveal', exact: true })
  await expect(toggle).toBeChecked()
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).not.toBeChecked()
  await expect(toggle).toBeFocused()
  await expect(page.locator('.code-panel code')).toContainText('autoReveal={false}')
  expect(
    await toggle.evaluate((input) => {
      const track = input.nextElementSibling
      if (!track) throw new Error('Missing switch track')
      return getComputedStyle(track).outlineStyle
    })
  ).toBe('solid')
  await page.locator('label[for="prop-autoReveal"]').click()
  await expect(toggle).toBeChecked()
  const appearance = await toggle.evaluate((input) => {
    const track = input.nextElementSibling
    if (!track) throw new Error('Missing switch track')
    return {
      background: getComputedStyle(track).backgroundImage,
      thumb: getComputedStyle(track, '::after').backgroundColor,
    }
  })
  expect(appearance.background).toContain('linear-gradient')
  expect(appearance.thumb).toBe('rgb(255, 255, 255)')
  await page.goto('/studio?library=avatars')
  const material = page.getByRole('group', { name: 'Material', exact: true })
  const fabric = material.getByRole('radio', { name: 'Fabric', exact: true })
  await fabric.focus()
  await page.keyboard.press('ArrowRight')
  await expect(material.getByRole('radio', { name: 'Plastic', exact: true })).toBeChecked()
  await expect(page.locator('.code-panel code')).toContainText('shading={"plastic"}')
  await page
    .locator('.controls-panel')
    .screenshot({ path: testInfo.outputPath('keyboard-settings.png') })
})

test('advanced settings and configuration tabs fit narrow widths and long saved names', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=metal')
  const panel = page.locator('.controls-panel')
  await panel.getByRole('button', { name: 'Show advanced settings' }).click()
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await contained(panel)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  const search = panel.getByRole('searchbox', { name: 'Search controls' })
  await search.fill('normalizeHostStyles')
  await expect(panel.locator('.field')).toHaveCount(1)
  await contained(panel)
  await search.fill('unmatched-control')
  await expect(panel.getByText('No matching controls.', { exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Show essential controls' }).click()
  await expect(search).toHaveCount(0)
  const controls = panel.getByRole('tab', { name: 'Controls', exact: true })
  await controls.focus()
  await page.keyboard.press('ArrowRight')
  await expect(panel.getByRole('tab', { name: 'Saved', exact: true })).toBeFocused()
  const name = 'A deliberately long preset name to check compact settings and wrapping'.slice(0, 80)
  await panel.getByRole('textbox', { name: 'Preset name', exact: true }).fill(name)
  await panel.getByRole('button', { name: 'Save preset' }).click()
  await expect(
    panel.locator('.preset-row').getByRole('button', { name, exact: true })
  ).toBeVisible()
  await contained(panel)
  await panel.screenshot({ path: testInfo.outputPath('saved-320.png') })
  await panel.getByRole('tab', { name: 'Saved', exact: true }).focus()
  await page.keyboard.press('End')
  await expect(panel.getByRole('tab', { name: 'JSON', exact: true })).toBeFocused()
  await panel.getByRole('textbox', { name: 'Edit component props' }).fill('{invalid}')
  await panel.getByRole('button', { name: 'Apply configuration' }).click()
  await expect(panel.getByRole('status')).not.toBeEmpty()
  await contained(panel)
  await panel.screenshot({ path: testInfo.outputPath('json-320.png') })
})
