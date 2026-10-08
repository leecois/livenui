import { expect, type Locator, type Page, test } from '@playwright/test'
import { openAvatarComponentPreview } from './helpers/component-preview'
import { closeStudioBrowser, openStudioPresets } from './helpers/studio'

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

async function alignedFields(panel: Locator) {
  const fields = await panel.locator('.fields > .field').evaluateAll((nodes) =>
    nodes.map((node) => {
      const label = node.querySelector('.field-heading')
      const heading = (node.querySelector('.choice-heading') || label)?.getBoundingClientRect()
      const shell = (
        node.matches('.field-select')
          ? node
          : node.querySelector(
              '.field-options,.number-row,.color-row,.switch-row,.text-row,.select-control'
            )
      )?.getBoundingClientRect()
      if (!label || !heading || !shell) throw new Error('Incomplete settings field')
      const exact = node
        .querySelector('.number-value,.color-row > input,.text-row > input,select')
        ?.getBoundingClientRect()
      const targets = [...node.querySelectorAll('input,select')].map(
        (target) => target.getBoundingClientRect().height
      )
      return {
        labelFont: getComputedStyle(label).fontSize,
        labelLine: getComputedStyle(label).lineHeight,
        categorical: node.matches('.field-choice,.field-select,.field-switch'),
        inline: node.matches('.field-numeric,.field-color,.field-text,.field-select'),
        valueGap: exact ? exact.left - heading.right : undefined,
        contained:
          heading.left >= shell.left &&
          heading.right <= shell.right &&
          heading.top >= shell.top &&
          heading.bottom <= shell.bottom,
        inset: shell.left - heading.right,
        centered: Math.abs(heading.top + heading.height / 2 - (shell.top + shell.height / 2)),
        grid: node.hasAttribute('data-choice-grid'),
        headingGap:
          shell.top -
          (node.querySelector('.choice-heading')?.getBoundingClientRect().bottom ?? heading.bottom),
        minimumHeight: node.matches('.field-switch')
          ? 44
          : node.matches('.field-avatar-shapes')
            ? 52
            : node.hasAttribute('data-choice-grid')
              ? 44
              : 54,
        top: node.getBoundingClientRect().top,
        bottom: node.getBoundingClientRect().bottom,
        headingTop: heading.top,
        gap: shell.top - heading.bottom,
        shellTop: shell.top,
        shellHeight: shell.height,
        targets,
      }
    })
  )
  expect(fields.length).toBeGreaterThan(0)
  for (const field of fields) {
    expect(field.labelFont).toBe('13px')
    expect(field.labelLine).toBe('19.5px')
    if (field.grid) {
      expect(field.headingGap).toBeCloseTo(8, 0)
    } else if (field.inline) {
      expect(field.contained).toBe(true)
      expect(field.centered).toBeLessThan(1)
      expect(field.valueGap).toBeGreaterThanOrEqual(0)
    } else if (field.categorical && field.inset >= 0) {
      expect(field.inset).toBeCloseTo(12, 0)
      expect(field.centered).toBeLessThan(1)
    } else {
      expect(field.gap).toBeCloseTo(8, 0)
    }
    expect(field.shellHeight).toBeGreaterThanOrEqual(field.minimumHeight)
    for (const height of field.targets) expect(height).toBeGreaterThanOrEqual(44)
    for (const sibling of fields) {
      if (
        !field.categorical &&
        !sibling.categorical &&
        Math.abs(field.headingTop - sibling.headingTop) < 1
      ) {
        expect(Math.abs(field.shellTop - sibling.shellTop)).toBeLessThan(1)
      }
    }
  }
  if (!(await panel.locator('[data-advanced]').count())) {
    expect(fields.map((field) => field.top)).toEqual(
      [...fields.map((field) => field.top)].sort((a, b) => a - b)
    )
    const categories = fields.filter((field) => field.categorical)
    const values = fields.filter((field) => !field.categorical)
    if (categories.length && values.length) {
      expect(
        Math.min(...values.map((field) => field.top)) -
          Math.max(...categories.map((field) => field.bottom))
      ).toBeGreaterThanOrEqual(24)
    }
  }
}

async function fullCapture(page: Page, path: string) {
  const renderer = '[data-beam],canvas,.metal-fx-root'
  await page.locator('.preview-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.preview-stage').locator(renderer).first()).toBeVisible()
  for (const example of await page.locator('.showcase-example').all()) {
    await example.scrollIntoViewIfNeeded()
    await expect(example.locator(renderer).first()).toBeVisible()
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.screenshot({ path, fullPage: true })
}

test('categorical rows and value grids align across Guide and Studio libraries', async ({
  page,
}, testInfo) => {
  for (const library of ['beam', 'orbs', 'metal', 'gooey', 'voice', 'image', 'avatars']) {
    for (const view of ['guide', 'studio']) {
      await page.goto(view === 'guide' ? `/agents/${library}` : `/studio?library=${library}`)
      if (library === 'avatars' && view === 'guide') await openAvatarComponentPreview(page)
      const panel = page.locator('.controls-panel')
      await expect(
        panel.getByRole('group', {
          name: view === 'guide' ? 'Quick settings' : 'Customize settings',
          exact: true,
        })
      ).toBeVisible()
      if (view === 'guide')
        await expect(panel.getByRole('heading', { name: 'Quick settings' })).toBeVisible()
      await contained(panel)
      await alignedFields(panel)
      await expect(panel.locator('.control-group-heading')).toHaveCount(0)
      await expect(panel.getByRole('tablist')).toHaveCount(0)
      if (view === 'studio') {
        const tabs = page.getByRole('tablist', { name: 'Studio view', exact: true })
        await expect(tabs.getByRole('tab')).toHaveText(['Customize', 'Presets', 'Code'])
        const bounds = await tabs.boundingBox()
        const reset = await panel.getByRole('button', { name: 'Reset', exact: true }).boundingBox()
        if (!bounds || !reset) throw new Error('Missing settings navigation')
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(reset.y)
        await expect(panel.getByRole('heading', { name: 'Customize' })).toHaveCount(0)
      }
      await panel.screenshot({ path: testInfo.outputPath(`settings-${library}-${view}.png`) })
      if (library === 'beam' || library === 'metal' || library === 'image') {
        await fullCapture(page, testInfo.outputPath(`${library}-${view}-full-page.png`))
      }
      if (view === 'studio') {
        await panel.getByRole('button', { name: 'Show advanced settings' }).click()
        await contained(panel)
        await alignedFields(panel)
        for (const heading of await panel.locator('.control-group-heading').all()) {
          await expect(heading).toBeVisible()
        }
        await panel.screenshot({ path: testInfo.outputPath(`settings-${library}-advanced.png`) })
      }
    }
  }
})

test('numeric focus has one indicator and keeps quick settings geometry stable', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/metal')
  const panel = page.locator('.controls-panel')
  await panel.scrollIntoViewIfNeeded()
  const scale = panel.getByRole('spinbutton', { name: 'Scale', exact: true })
  const row = scale.locator('xpath=ancestor::*[contains(@class,"number-row")]')
  const geometry = () =>
    panel.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const number = element.querySelector('#prop-scale')?.getBoundingClientRect()
      if (!number) throw new Error('Missing Scale control')
      return { width: bounds.width, height: bounds.height, offset: number.top - bounds.top }
    })
  const before = await geometry()
  for (const input of [scale, panel.getByRole('slider', { name: 'Adjust Scale', exact: true })]) {
    await input.focus()
    expect(await geometry()).toEqual(before)
    expect(
      await row.evaluate(
        (element) =>
          [element, ...element.querySelectorAll('*')].filter(
            (node) => getComputedStyle(node).outlineStyle === 'solid'
          ).length
      )
    ).toBe(1)
    expect(await row.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
    expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none')
    await alignedFields(panel)
  }
  await scale.focus()
  await fullCapture(page, testInfo.outputPath('metal-focused-full-page.png'))
  await panel.screenshot({ path: testInfo.outputPath('metal-focused-settings.png') })
})

test('Guide and Studio expose categorical grids with native keys and default actions', async ({
  page,
}) => {
  for (const path of ['/agents/beam', '/studio?library=beam']) {
    await page.goto(path)
    const panel = page.locator('.controls-panel')
    const styles = panel.getByRole('group', { name: 'Style', exact: true })
    await expect(styles.getByRole('radio')).toHaveCount(5)
    expect(
      await styles.locator('.field-options').evaluate((element) => ({
        gap: getComputedStyle(element).gap,
        heights: [...element.querySelectorAll('label')].map(
          (child) => child.getBoundingClientRect().height
        ),
        columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      }))
    ).toEqual({ gap: '8px', heights: Array(5).fill(44), columns: expect.any(Number) })
    const line = styles.getByRole('radio', { name: 'Line', exact: true })
    await line.check()
    await expect(page.locator('.code-panel code')).toContainText('size={"line"}')
    await line.focus()
    await line.press('ArrowRight')
    await expect(styles.getByRole('radio', { name: 'Outer pulse', exact: true })).toBeChecked()
    await expect(page.locator('.code-panel code')).toContainText('size={"pulse-outside"}')
    const colors = panel.getByRole('group', { name: 'Color Variant', exact: true })
    const sunset = colors.getByRole('radio', { name: 'Sunset', exact: true })
    await sunset.check()
    await expect(page.locator('.code-panel code')).toContainText('colorVariant={"sunset"}')
    await sunset.press('Space')
    await expect
      .poll(() =>
        sunset.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          outline: getComputedStyle(element.nextElementSibling as Element).outlineStyle,
          shadow: getComputedStyle(element.nextElementSibling as Element).boxShadow,
          background: getComputedStyle(element.nextElementSibling as Element).backgroundImage,
          color: getComputedStyle(element.nextElementSibling as Element).color,
        }))
      )
      .toEqual({
        height: 44,
        outline: 'none',
        shadow: expect.stringContaining('inset'),
        background: expect.stringContaining('linear-gradient'),
        color: 'rgb(255, 255, 255)',
      })
    await colors.getByRole('button', { name: 'Use default for Color Variant', exact: true }).click()
    await expect(page.locator('.code-panel code')).not.toContainText('colorVariant={')
    await expect(colors.getByText('Using component default', { exact: true })).toBeVisible()
    await expect(panel.locator('select')).toHaveCount(0)
    await contained(panel)
  }
})

test('numbers, switches and radio tracks preserve typed configuration and keyboard focus', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=image')
  await page.getByRole('radio', { name: 'Organic pixels', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('checkbox', { name: 'Auto Reveal', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('slider', { name: 'Adjust Strength', exact: true })).toBeFocused()
  const speed = page.getByRole('spinbutton', { name: 'Speed', exact: true })
  await speed.fill('1.75')
  await speed.press('Enter')
  await expect(page.locator('.code-panel code')).toContainText('speed={1.75}')
  await speed.fill('')
  await speed.press('Enter')
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
  await expect(panel.locator('.control-group-heading')).not.toHaveCount(0)
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
  const customize = page.getByRole('tab', { name: 'Customize', exact: true })
  await customize.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Presets', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Code', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(customize).toBeFocused()
  await openStudioPresets(page)
  const saved = page.locator('.studio-presets')
  const nameField = saved.getByRole('textbox', { name: 'Preset name', exact: true })
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await openStudioPresets(page)
    await contained(saved)
    await expect(nameField).toHaveAccessibleDescription('Saved in this browser.')
    const geometry = await saved.evaluate((element) => {
      const form = element.querySelector('form')
      const input = element.querySelector('input')
      const button = element.querySelector('button[type="submit"]')
      if (!form || !input || !button) throw new Error('Missing preset form')
      const field = input.getBoundingClientRect()
      const action = button.getBoundingClientRect()
      const style = getComputedStyle(input)
      const canvas = document.createElement('canvas').getContext('2d')
      if (!canvas) throw new Error('Missing text measurement context')
      canvas.font = `${style.fontSize} ${style.fontFamily}`
      return {
        width: field.width,
        formWidth: form.getBoundingClientRect().width,
        gap: field.top - action.bottom,
        height: field.height,
        actionHeight: action.height,
        font: style.fontSize,
        textWidth: canvas.measureText(input.placeholder).width,
        textSpace:
          input.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight),
      }
    })
    expect(geometry.width).toBeCloseTo(geometry.formWidth, 0)
    expect(geometry.gap).toBeCloseTo(12, 0)
    expect(geometry.height).toBeGreaterThanOrEqual(44)
    expect(geometry.actionHeight).toBeGreaterThanOrEqual(44)
    expect(geometry.font).toBe('13px')
    expect(geometry.textWidth).toBeLessThan(geometry.textSpace)
    await saved.screenshot({ path: testInfo.outputPath(`presets-empty-${width}.png`) })
    await page.screenshot({
      path: testInfo.outputPath(`presets-full-page-${width}.png`),
      fullPage: true,
    })
  }
  const name = 'A deliberately long preset name to check compact settings and wrapping'.slice(0, 80)
  await nameField.fill(name)
  await nameField.press('Enter')
  await expect(
    saved.locator('.preset-row').getByRole('button', { name, exact: true })
  ).toBeVisible()
  await contained(saved)
  await saved.screenshot({ path: testInfo.outputPath('saved-320.png') })
  await closeStudioBrowser(page)
  await customize.click()
  await page.locator('.studio-json-toggle').click()
  await panel.getByRole('textbox', { name: 'Edit component props' }).fill('{invalid}')
  await panel.getByRole('button', { name: 'Apply configuration' }).click()
  await expect(panel.getByRole('status')).not.toBeEmpty()
  await contained(panel)
  await panel.screenshot({ path: testInfo.outputPath('json-320.png') })
})
