import { expect, test } from '@playwright/test'
import { chooseOption } from './helpers/choices'
import { openStudioBrowser } from './helpers/studio'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('Image starting points keep text in separate full-width rows', async ({ page }, testInfo) => {
  await page.goto('/studio?library=image')
  await expect(page.locator('.preview-stage .image-gen-shader')).toBeVisible()
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await openStudioBrowser(page)
    const starting = page.getByRole('group', { name: 'Starting point', exact: true })
    await expect(starting.getByRole('radio')).toHaveCount(3)
    await starting.scrollIntoViewIfNeeded()
    const geometry = await starting.evaluate((element) => {
      const group = element.getBoundingClientRect()
      const heading = element.querySelector('.choice-heading')?.getBoundingClientRect()
      if (!heading) throw new Error('Missing starting point heading')
      return [...element.querySelectorAll('.field-option')].map((option) => {
        const label = option.querySelector('span')
        if (!label) throw new Error('Missing starting point label')
        const row = option.getBoundingClientRect()
        const text = document.createRange()
        text.selectNodeContents(label)
        const bounds = text.getBoundingClientRect()
        return {
          top: row.top,
          bottom: row.bottom,
          height: row.height,
          width: row.width,
          groupWidth: group.width,
          headingBottom: heading.bottom,
          alignment: getComputedStyle(label).justifyContent,
          border: getComputedStyle(label).borderColor,
          textContained:
            bounds.left >= row.left &&
            bounds.right <= row.right &&
            bounds.top >= row.top &&
            bounds.bottom <= row.bottom,
        }
      })
    })
    for (const [index, row] of geometry.entries()) {
      expect(row.height).toBeGreaterThanOrEqual(44)
      expect(row.width).toBeCloseTo(row.groupWidth, 0)
      expect(row.textContained).toBe(true)
      expect(row.alignment).toBe('flex-start')
      expect(row.border).toBe('rgba(0, 0, 0, 0)')
      expect(row.top - (index ? geometry[index - 1].bottom : row.headingBottom)).toBeCloseTo(
        index ? 4 : 8,
        0
      )
    }
    await page.screenshot({
      path: testInfo.outputPath(`starting-${width}-full-page.png`),
      fullPage: true,
    })
  }
  await chooseOption(page, 'Starting point', 'image-preset-pixels-mechanic')
  await openStudioBrowser(page)
  const starting = page.getByRole('group', { name: 'Starting point', exact: true })
  const selected = starting.locator('input:checked')
  await expect(selected).toBeVisible()
  await selected.focus()
  await selected.press('ArrowDown')
  await openStudioBrowser(page)
  await expect(starting.getByRole('radio').nth(2)).toBeChecked()
  await expect(page.locator('.code-panel code')).toContainText('preset={"sweep-gradient"}')
  await page.setViewportSize({ width: 640, height: 1000 })
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  await openStudioBrowser(page)
  await expect(starting.getByRole('radio').nth(2)).toBeVisible()
  await starting.scrollIntoViewIfNeeded()
  expect(await starting.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true
  )
  await page.screenshot({
    path: testInfo.outputPath('starting-zoom-full-page.png'),
    fullPage: true,
  })
})

test('long preset choices expand inline and keep the selected native configuration visible', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=avatars')
  await openStudioBrowser(page)
  const context = page.locator('.studio-context')
  const starting = context.getByRole('group', { name: 'Starting point', exact: true })
  await expect(starting.getByRole('radio')).toHaveCount(6)
  await expect(context.locator('select')).toHaveCount(0)
  await chooseOption(context, 'Starting point', 'avatars-type-connector')
  await expect(page.locator('.preview-stage canvas')).toHaveAttribute(
    'data-bot-avatar',
    'connector'
  )
  await expect(page.locator('.code-panel code')).toContainText('type={"connector"}')
  await openStudioBrowser(page)
  await starting
    .getByRole('button', { name: 'Show fewer starting point options', exact: true })
    .click()
  const selected = starting.locator('input:checked')
  await expect(selected).toHaveValue('avatars-type-connector')
  await expect(selected).toBeVisible()
  await expect(starting.getByRole('radio')).toHaveCount(7)
  const options = await starting.locator('.field-option').evaluateAll((items) =>
    items.map((item) => ({
      height: item.getBoundingClientRect().height,
      contained: item.scrollWidth <= item.clientWidth,
    }))
  )
  expect(options.every((option) => option.height >= 44 && option.contained)).toBe(true)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({
    path: testInfo.outputPath('direct-studio-full-page.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 640, height: 1000 })
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2'
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await openStudioBrowser(page)
  await expect(selected).toBeVisible()
  await context.screenshot({ path: testInfo.outputPath('direct-choices-zoom.png') })
})

test('outfit expansion preserves an option outside the compact set and the main renderer', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const actor = chat.locator('.avatar-chat-actor canvas')
  await expect(actor).toBeVisible()
  await actor.evaluate((element) => {
    element.dataset.choiceProbe = 'retained'
  })
  const settings = chat.locator('.avatar-chat-settings')
  if (!(await settings.isVisible()))
    await chat.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(settings.locator('select')).toHaveCount(0)
  const outfit = settings.getByRole('group', { name: 'Outfit', exact: true })
  await chooseOption(settings, 'Outfit', 'Guard')
  await outfit.getByRole('button', { name: 'Show fewer outfit options', exact: true }).click()
  const guard = outfit.getByRole('radio', { name: 'Guard', exact: true })
  await expect(guard).toBeChecked()
  await expect(guard).toBeVisible()
  await expect(outfit.getByRole('radio')).toHaveCount(7)
  await guard.press('Space')
  expect(await guard.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
  await expect(actor).toHaveAttribute('data-choice-probe', 'retained')
  await page.screenshot({ path: testInfo.outputPath('direct-chat-full-page.png'), fullPage: true })
  await settings.getByRole('tab', { name: 'Code', exact: true }).click()
  for (const prop of ['hat={"crown"}', 'glasses={"shades"}', 'bowTie={false}'])
    await expect(settings.locator('.code-panel code')).toContainText(prop)
})

test('expanded choices reveal without animating existing rows or losing focus', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/studio?library=avatars')
  await openStudioBrowser(page)
  const group = page.getByRole('group', { name: 'Starting point', exact: true })
  const toggle = group.getByRole('button', { name: /Browse all/ })
  await toggle.focus()
  const motion = await group.evaluate(async (element) => {
    const existing = [...element.querySelectorAll('.field-option')]
    const before = existing.map((item) => item.getBoundingClientRect().toJSON())
    const button = element.querySelector<HTMLButtonElement>('.choices-expand')
    button?.click()
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    const animations = element.getAnimations({ subtree: true }).filter((animation) => {
      const target = (animation.effect as KeyframeEffect).target
      return target instanceof HTMLElement && target.matches('.field-option')
    })
    const results = animations.map((animation) => {
      const target = (animation.effect as KeyframeEffect).target as HTMLElement
      animation.pause()
      animation.currentTime = 80
      return {
        existing: existing.includes(target),
        duration: animation.effect?.getTiming().duration,
        opacity: Number(getComputedStyle(target).opacity),
      }
    })
    const after = existing.map((item) => item.getBoundingClientRect().toJSON())
    for (const animation of animations) animation.finish()
    return { before, after, results, focused: document.activeElement === button }
  })
  expect(motion.results.length).toBeGreaterThan(0)
  expect(motion.focused).toBe(true)
  expect(motion.after).toEqual(motion.before)
  for (const animation of motion.results) {
    expect(animation.existing).toBe(false)
    expect(animation.duration).toBe(160)
    expect(animation.opacity).toBeGreaterThan(0)
    expect(animation.opacity).toBeLessThan(1)
  }
  await group.getByRole('button', { name: /Show fewer/ }).click()
  await expect(group.getByRole('radio')).toHaveCount(6)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await group.getByRole('button', { name: /Browse all/ }).click()
  const reduced = await group.evaluate((element) =>
    [...element.querySelectorAll('.field-option')].every(
      (item) => getComputedStyle(item).opacity === '1' && item.getAnimations().length === 0
    )
  )
  expect(reduced).toBe(true)
})
