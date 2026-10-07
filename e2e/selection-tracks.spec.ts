import { expect, type Locator, test } from '@playwright/test'
import { chooseOption } from './helpers/choices'

async function aligned(track: Locator) {
  await expect(track).toHaveAttribute('data-selection-ready', '')
  await expect
    .poll(() =>
      track.evaluate((element) => {
        const active = element.querySelector<HTMLElement>(
          'input:checked, [aria-selected="true"], [aria-pressed="true"]'
        )
        const target = active instanceof HTMLInputElement ? active.closest('label') : active
        const fill = element.querySelector('.selection-indicator')
        if (!target || !fill) return Infinity
        const a = target.getBoundingClientRect()
        const b = fill.getBoundingClientRect()
        return Math.max(
          Math.abs(a.left - b.left),
          Math.abs(a.top - b.top),
          Math.abs(a.width - b.width),
          Math.abs(a.height - b.height)
        )
      })
    )
    .toBeLessThan(1)
  expect(
    await track.locator('.selection-indicator').evaluate((element) => ({
      fill: getComputedStyle(element).backgroundImage,
      pointer: getComputedStyle(element).pointerEvents,
    }))
  ).toMatchObject({ fill: expect.stringContaining('linear-gradient'), pointer: 'none' })
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('native activity choices slide without moving controls and respect reduced motion', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  const settings = chat.locator('.avatar-chat-settings')
  if (!(await settings.isVisible()))
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  const activity = settings.getByRole('group', { name: 'Activity', exact: true })
  const track = activity.locator('.field-options')
  await aligned(track)
  const initial = await track.boundingBox()
  const options = await activity
    .getByRole('radio')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))
  expect(options.every((option) => option.height >= 44)).toBe(true)
  expect(options[1].left - options[0].right).toBeCloseTo(4, 1)
  expect(options[0].left - (initial?.x ?? 0)).toBeCloseTo(5, 1)
  await actor.evaluate((element) => {
    element.dataset.selectionProbe = 'retained'
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const working = activity.getByRole('radio', { name: 'Working', exact: true })
  const motion = await working.evaluate(async (node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Activity requires a native radio')
    const fill = node.closest('.field-options')?.querySelector('.selection-indicator')
    if (!fill) throw new Error('Missing activity indicator')
    const start = fill.getBoundingClientRect().left
    node.click()
    for (let frame = 0; frame < 4; frame++) await new Promise(requestAnimationFrame)
    return {
      start,
      middle: fill.getBoundingClientRect().left,
      target: node.getBoundingClientRect().left,
      transitions: fill.getAnimations().map((animation) => animation.effect?.getTiming().duration),
    }
  })
  expect(motion.middle).toBeGreaterThan(motion.start)
  expect(motion.middle).toBeLessThan(motion.target)
  expect(motion.transitions).toContain(240)
  await aligned(track)
  expect(await track.boundingBox()).toEqual(initial)
  await expect(actor).toHaveAttribute('data-selection-probe', 'retained')
  await working.press('ArrowRight')
  await expect(activity.getByRole('radio', { name: 'Sleeping', exact: true })).toBeChecked()
  await aligned(track)
  await activity.getByRole('radio', { name: 'Idle', exact: true }).click()
  await working.click()
  await activity.getByRole('radio', { name: 'Sleeping', exact: true }).click()
  await aligned(track)
  await expect(activity.getByRole('radio', { name: 'Sleeping', exact: true })).toBeChecked()
  await page.screenshot({
    path: testInfo.outputPath('selection-settings-full-page.png'),
    fullPage: true,
  })
  await settings.screenshot({ path: testInfo.outputPath('selection-settings.png') })
  await settings.getByRole('tab', { name: 'Code', exact: true }).click()
  await expect(settings.locator('.code-panel code')).toContainText('state={"sleeping"}')
  await settings.getByRole('tab', { name: 'Customize', exact: true }).click()
  await aligned(settings.getByRole('tablist'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await activity.getByRole('radio', { name: 'Idle', exact: true }).check()
  await aligned(track)
  expect(
    await track.locator('.selection-indicator').evaluate((node) => node.getAnimations().length)
  ).toBe(0)
  await page.setViewportSize({ width: 320, height: 800 })
  await expect(settings).toHaveAttribute('aria-modal', 'true')
  if (testInfo.project.use.viewport?.width === 1440) {
    await expect(settings).not.toBeVisible()
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  }
  await aligned(track)
  await page.setViewportSize({ width: 640, height: 1000 })
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  await aligned(track)
  expect(await settings.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  await expect(actor).toHaveAttribute('data-selection-probe', 'retained')
})

test('Guide, Studio, workflow and device tracks share selection geometry', async ({
  page,
}, testInfo) => {
  for (const path of ['/agents/beam', '/studio?library=beam']) {
    await page.goto(path)
    const panel = page.locator('.controls-panel')
    const style = panel.getByRole('group', { name: 'Style', exact: true })
    await style.getByRole('radio', { name: 'Inner pulse', exact: true }).check()
    await expect(style.locator('.choice-grid')).toBeVisible()
    await expect(page.locator('.code-panel code')).toContainText('size={"pulse-inner"}')
    await chooseOption(panel, 'Color Variant', 'sunset')
    await expect(page.locator('.code-panel code')).toContainText('colorVariant={"sunset"}')
    await aligned(page.getByRole('tablist', { name: 'Component workflow', exact: true }))
    const devices = page.getByRole('group', { name: 'Preview device', exact: true })
    await devices.getByRole('button', { name: 'Mobile', exact: true }).click()
    await aligned(devices)
    if (path.startsWith('/studio')) {
      const tabs = panel.getByRole('tablist', { name: 'Configuration view', exact: true })
      await tabs.getByRole('tab', { name: 'Saved', exact: true }).click()
      await aligned(tabs)
      await tabs.getByRole('tab', { name: 'Controls', exact: true }).click()
      await aligned(tabs)
    }
    await page.screenshot({
      path: testInfo.outputPath(
        path.startsWith('/studio')
          ? 'selection-studio-full-page.png'
          : 'selection-guide-full-page.png'
      ),
      fullPage: true,
    })
  }
})
