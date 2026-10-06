import { expect, type Locator, type Page, test } from '@playwright/test'

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
      const heading = label?.getBoundingClientRect()
      const shell = node
        .querySelector(
          '.field-options,.number-row,.color-row,.switch-row,.text-row,.select-control'
        )
        ?.getBoundingClientRect()
      if (!label || !heading || !shell) throw new Error('Incomplete settings field')
      const targets = [...node.querySelectorAll('input,select')].map(
        (target) => target.getBoundingClientRect().height
      )
      return {
        labelFont: getComputedStyle(label).fontSize,
        labelLine: getComputedStyle(label).lineHeight,
        categorical: node.matches('.field-choice,.field-select,.field-switch'),
        inset: shell.left - heading.right,
        centered: Math.abs(heading.top + heading.height / 2 - (shell.top + shell.height / 2)),
        minimumHeight: node.matches('.field-select,.field-switch') ? 44 : 54,
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
    if (field.categorical && field.inset >= 0) {
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
      const panel = page.locator('.controls-panel')
      await expect(
        panel.getByRole('heading', {
          name: view === 'guide' ? 'Quick settings' : 'Customize',
          exact: true,
        })
      ).toBeVisible()
      await contained(panel)
      await alignedFields(panel)
      await expect(panel.locator('.control-group-heading')).toHaveCount(0)
      await expect(panel.getByRole('tablist')).toHaveCount(view === 'studio' ? 1 : 0)
      if (view === 'studio') {
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

test('Guide and Studio share direct style choices and compact native selects', async ({ page }) => {
  for (const path of ['/agents/beam', '/studio?library=beam']) {
    await page.goto(path)
    const panel = page.locator('.controls-panel')
    const styles = panel.getByRole('group', { name: 'Style', exact: true })
    await expect(styles.getByRole('radio')).toHaveCount(5)
    const line = styles.getByRole('radio', { name: 'Line', exact: true })
    await line.check()
    await expect(page.locator('.code-panel code')).toContainText('size={"line"}')
    await line.focus()
    await line.press('ArrowRight')
    await expect(styles.getByRole('radio', { name: 'Outer pulse', exact: true })).toBeChecked()
    await expect(page.locator('.code-panel code')).toContainText('size={"pulse-outside"}')
    const select = panel.getByRole('combobox', { name: 'Color Variant', exact: true })
    await select.selectOption('sunset')
    await expect(page.locator('.code-panel code')).toContainText('colorVariant={"sunset"}')
    await select.focus()
    expect(
      await select.locator('..').evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        rings: [element, ...element.querySelectorAll('*')].filter(
          (node) => getComputedStyle(node).outlineStyle === 'solid'
        ).length,
        chevron: getComputedStyle(element.querySelector('svg') as SVGElement).pointerEvents,
      }))
    ).toEqual({ width: expect.any(Number), height: 44, rings: 1, chevron: 'none' })
    expect(
      await select.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeLessThanOrEqual(240)
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
