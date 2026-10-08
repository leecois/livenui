import { expect, test } from '@playwright/test'
import { libraries, studioHref } from '../apps/docs/features/component-library/lib/config'
import { chooseOption } from './helpers/choices'
import { closeStudioBrowser } from './helpers/studio'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('Gooey behavior belongs to settings while the preview retains direct interaction', async ({
  page,
}, testInfo) => {
  const library = libraries.find((entry) => entry.id === 'gooey')
  if (!library) throw new Error('Missing Gooey library')
  const configured = studioHref(
    library,
    {
      blur: 8,
      contrast: 22,
      item: { effect: 'melt', radius: 30, move: { wobble: 0.25 }, dissolve: 0.4 },
    },
    'ring'
  )
  const scenes = { morph: 'menu', move: 'slider', bend: 'bend', melt: 'melt' }
  for (const view of ['studio', 'guide']) {
    await page.goto(view === 'studio' ? configured : '/agents/gooey')
    const stage = page.locator('.preview-stage')
    const settings = page.locator('.controls-panel')
    const behavior = settings.getByRole('group', { name: 'Liquid behavior', exact: true })
    await expect(behavior).toBeVisible()
    await expect(page.getByRole('group', { name: 'Liquid behavior', exact: true })).toHaveCount(1)
    await expect(stage.getByRole('radio')).toHaveCount(0)
    await expect(stage.locator('.demo-actions')).toHaveCount(0)
    const boxes = await behavior
      .locator('input')
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().toJSON())
      )
    expect(boxes).toHaveLength(4)
    expect(boxes[0].y).toBe(boxes[1].y)
    expect(boxes[2].y).toBe(boxes[3].y)
    expect(boxes[2].y - boxes[0].y).toBe(52)
    expect(boxes[1].x - boxes[0].right).toBe(8)
    for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width, 0)
    if (view === 'guide') {
      await expect(behavior.locator('input:checked')).toHaveValue('morph')
      await page.getByRole('button', { name: 'Try Bend shapes', exact: true }).click()
      await expect(behavior.locator('input:checked')).toHaveValue('bend')
      for (const [name, value] of [
        ['Blur', '8'],
        ['Contrast', '22'],
      ]) {
        const input = settings.getByRole('spinbutton', { name, exact: true })
        await input.fill(value)
        await input.press('Enter')
      }
      await chooseOption(settings, 'Liquid behavior', 'melt')
      await page.getByRole('button', { name: '▶ Play', exact: true }).click()
    }
    await expect(behavior.locator('input:checked')).toHaveValue('melt')
    const code = page.locator('.code-panel code')
    for (const [effect, scene] of Object.entries(scenes)) {
      await chooseOption(settings, 'Liquid behavior', effect)
      await expect(stage.locator(`.liquid-${scene}`).first()).toBeVisible()
      await expect(code).toContainText(`"effect":"${effect}"`)
      for (const retained of [
        'blur={8}',
        'contrast={22}',
        ...(view === 'studio'
          ? ['"radius":30', '"wobble":0.25', '"dissolve":0.4']
          : ['"radius":999']),
      ])
        await expect(code).toContainText(retained)
    }
    const melt = behavior.getByRole('radio', { name: 'Melt', exact: true })
    await melt.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(behavior.getByRole('radio', { name: 'Bend', exact: true })).toBeChecked()
    await expect(stage.locator('.liquid-bend')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(melt).toBeChecked()
    await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeVisible()
    const warm = stage.getByRole('button', { name: /Drag warm image/ })
    const initial = await warm.getAttribute('style')
    await warm.focus()
    await warm.press('ArrowRight')
    await expect(warm).not.toHaveAttribute('style', initial || '')
    await warm.press('Home')
    await expect(warm).toHaveAttribute('style', initial || '')
    if (view === 'guide') {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    }
    await page.screenshot({ path: testInfo.outputPath(`${view}-full-page.png`), fullPage: true })
    await stage.screenshot({ path: testInfo.outputPath(`${view}-preview.png`) })
    await settings.screenshot({ path: testInfo.outputPath(`${view}-settings.png`) })
    if (view === 'studio') {
      await chooseOption(page, 'Starting point', 'gooey-bend')
      await closeStudioBrowser(page)
      await expect(behavior.getByRole('radio', { name: 'Bend', exact: true })).toBeChecked()
      await expect(stage.locator('.liquid-bend')).toBeVisible()
      await expect(code).toContainText('"radius":999')
      await settings.getByRole('button', { name: 'Show advanced settings', exact: true }).click()
      await settings.getByRole('searchbox', { name: 'Search controls' }).fill('Liquid behavior')
      await expect(behavior).toBeVisible()
      await expect(settings.getByText('No matching controls.', { exact: true })).toHaveCount(0)
    }
    await page.setViewportSize({ width: 320, height: 1000 })
    await expect(behavior).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const targets = await behavior.locator('input').evaluateAll((elements) =>
      elements.map((element) => ({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      }))
    )
    for (const target of targets) {
      expect(target.width).toBeGreaterThanOrEqual(44)
      expect(target.height).toBe(44)
    }
    await page.setViewportSize(testInfo.project.use.viewport || { width: 390, height: 1000 })
  }
})
