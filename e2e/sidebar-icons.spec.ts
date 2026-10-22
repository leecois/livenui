import { expect, type Page, test } from '@playwright/test'

const destinations = [
  ['/agents', 'Components', 'components'],
  ['/agents/gallery', 'Examples', 'examples'],
  ['/studio', 'Studio', 'studio'],
  ['/agents/beam', 'Border beam', 'beam'],
  ['/agents/orbs', 'Thinking orbs', 'orbs'],
  ['/agents/metal', 'Metal', 'metal'],
  ['/agents/gooey', 'Gooey', 'gooey'],
  ['/agents/voice', 'Voice', 'voice'],
  ['/agents/image', 'Image', 'image'],
  ['/agents/avatars', 'Bot avatars', 'avatars'],
  ['/agents/integration', 'Get started', 'integration'],
]

async function navigation(page: Page, width: number) {
  if (width < 768) {
    await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).toBeVisible()
    return page.locator('#nd-sidebar-mobile')
  }
  return page.locator('#nd-sidebar')
}

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

test('sidebar icons preserve destinations, labels and reduced-motion navigation', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/agents/orbs')
  await expect(page.locator('.preview-stage canvas')).toBeVisible()
  const sidebar = await navigation(page, testInfo.project.use.viewport?.width || 1440)
  await page.keyboard.press('Tab')
  await expect(sidebar.locator('.navigation-icon')).toHaveCount(destinations.length)
  for (const [href, label, id] of destinations) {
    const link = sidebar.locator(`a[href="${href}"]`)
    await expect(link).toHaveCount(1)
    await expect(link).toHaveAccessibleName(label)
    const icon = link.locator('svg.navigation-icon')
    await expect(icon).toHaveAttribute('data-navigation-icon', id)
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expect(icon).toHaveAttribute('focusable', 'false')
    await link.focus()
    await expect(link).toBeFocused()
    const geometry = await link.evaluate((node) => {
      const icon = node.querySelector('svg')
      if (!icon) throw new Error('Missing navigation icon')
      const box = node.getBoundingClientRect()
      const image = icon.getBoundingClientRect()
      const panel = node.closest('#nd-sidebar, #nd-sidebar-mobile')
      const label = Array.from(node.childNodes).find(
        (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
      )
      if (!panel || !label) throw new Error('Missing navigation panel or label')
      const panelBox = panel.getBoundingClientRect()
      const panelStyle = getComputedStyle(panel)
      const range = document.createRange()
      range.selectNode(label)
      return {
        height: box.height,
        gap: range.getBoundingClientRect().left - image.right,
        insetStart: box.left - panelBox.left - Number.parseFloat(panelStyle.borderLeftWidth),
        insetEnd: panelBox.right - box.right - Number.parseFloat(panelStyle.borderRightWidth),
        radius: panelStyle.borderTopLeftRadius,
        focusOffset: getComputedStyle(node).outlineOffset,
        focusWidth: getComputedStyle(node).outlineWidth,
        size: getComputedStyle(icon).width,
        iconHeight: getComputedStyle(icon).height,
        alignment: Math.abs(box.y + box.height / 2 - image.y - image.height / 2),
        animations: icon.getAnimations({ subtree: true }).length,
      }
    })
    expect(geometry.height).toBe(testInfo.project.use.viewport?.width === 390 ? 44 : 32)
    expect(geometry.gap).toBeCloseTo(10, 1)
    expect(geometry.insetStart).toBeCloseTo(8, 1)
    expect(geometry.insetEnd).toBeCloseTo(8, 1)
    expect(geometry.radius).toBe('12px')
    expect(geometry.focusOffset).toBe('-2px')
    expect(geometry.focusWidth).toBe('2px')
    expect(geometry.size).toBe('18px')
    expect(geometry.iconHeight).toBe('18px')
    expect(geometry.alignment).toBeLessThan(1)
    expect(geometry.animations).toBe(0)
  }
  const groupGaps = await sidebar.locator('p').evaluateAll((headings) =>
    headings.flatMap((heading) => {
      const previous = heading.previousElementSibling
      return previous?.matches('a')
        ? [heading.getBoundingClientRect().top - previous.getBoundingClientRect().bottom]
        : []
    })
  )
  expect(groupGaps).toHaveLength(2)
  for (const gap of groupGaps) expect(gap).toBeCloseTo(20, 1)
  await expect(sidebar.locator('a[class~="bg-fd-primary/10"]')).toHaveCount(1)
  await expect(sidebar.locator('a[class~="bg-fd-primary/10"]')).toHaveAttribute(
    'href',
    '/agents/orbs'
  )
  const examples = sidebar.getByRole('link', { name: 'Examples', exact: true })
  await examples.focus()
  await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true })
  await sidebar.screenshot({ path: testInfo.outputPath('sidebar.png') })
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/agents\/gallery$/)
  if (testInfo.project.use.viewport?.width === 390) {
    await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).toBeHidden()
    await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click()
  }
  await expect(sidebar.locator('a[class~="bg-fd-primary/10"]')).toHaveCount(1)
  await expect(sidebar.locator('a[class~="bg-fd-primary/10"]')).toHaveAttribute(
    'href',
    '/agents/gallery'
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (testInfo.project.use.viewport?.width === 390) {
    await page.setViewportSize({ width: 320, height: 640 })
    const guide = sidebar.getByRole('link', { name: 'Get started', exact: true })
    await guide.focus()
    await expect(guide).toBeFocused()
    const bounds = await guide.boundingBox()
    expect(bounds?.y).toBeGreaterThanOrEqual(40)
    expect((bounds?.y || 0) + (bounds?.height || 0)).toBeLessThanOrEqual(640)
    await expect
      .poll(() =>
        guide.evaluate((node) => {
          const rect = node.getBoundingClientRect()
          const drawer = node.closest('#nd-sidebar-mobile')?.getBoundingClientRect()
          return (
            !!drawer &&
            drawer.right <= innerWidth &&
            [0.1, 0.5, 0.9].every((position) =>
              node.contains(
                document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height * position)
              )
            )
          )
        })
      )
      .toBe(true)
    const { list, row } = await guide.evaluate((node) => {
      const parent = node.parentElement
      if (!parent) throw new Error('Missing compact navigation list')
      const list = parent.getBoundingClientRect()
      const row = node.getBoundingClientRect()
      return {
        list: { x: list.x, y: list.y, width: list.width, height: list.height },
        row: { x: row.x, y: row.y, width: row.width, height: row.height },
      }
    })
    expect(row.x).toBeGreaterThanOrEqual(list.x + 2)
    expect(row.x + row.width).toBeLessThanOrEqual(list.x + list.width - 2)
    expect(row.y).toBeGreaterThanOrEqual(list.y + 2)
    expect(row.y + row.height).toBeLessThanOrEqual(list.y + list.height - 2)
    await sidebar.screenshot({ path: testInfo.outputPath('compact-drawer.png') })
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/agents\/integration$/)
    await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).toBeHidden()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  expect(errors).toEqual([])
})

test('sidebar motion is finite, local and available to keyboard focus', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/agents/orbs')
  await expect(page.locator('.preview-stage canvas')).toBeVisible()
  const sidebar = await navigation(page, testInfo.project.use.viewport?.width || 1440)
  const selection = await sidebar
    .locator('a[class~="bg-fd-primary/10"] .navigation-icon')
    .evaluate((node) => {
      const style = getComputedStyle(node)
      return {
        name: style.animationName,
        duration: style.animationDuration,
        iterations: style.animationIterationCount,
      }
    })
  expect(selection).toEqual({ name: 'navigation-arrive', duration: '0.35s', iterations: '1' })
  await expect
    .poll(() =>
      sidebar
        .locator('.navigation-icon')
        .evaluateAll(
          (icons) => icons.flatMap((icon) => icon.getAnimations({ subtree: true })).length
        )
    )
    .toBe(0)
  await page.keyboard.press('Tab')
  for (const [href, , id] of destinations) {
    const link = sidebar.locator(`a[href="${href}"]`)
    const icon = link.locator('.navigation-icon')
    await link.scrollIntoViewIfNeeded()
    const before = await link.boundingBox()
    await link.focus()
    await expect
      .poll(() => icon.evaluate((node) => node.getAnimations({ subtree: true }).length))
      .toBeGreaterThan(0)
    const frame = await icon.evaluate((node) => {
      const detail = node.querySelector('.navigation-icon-detail, .navigation-icon-wave path')
      if (!detail) throw new Error('Missing animated detail')
      const animations = node.getAnimations({ subtree: true })
      const timings = animations.map((animation) => animation.effect?.getTiming())
      for (const animation of animations) {
        animation.pause()
        animation.currentTime = 350
      }
      const style = getComputedStyle(detail)
      return {
        timings,
        transform: style.transform,
        offset: style.strokeDashoffset,
        opacity: style.opacity,
      }
    })
    for (const timing of frame.timings) {
      expect(timing?.iterations).toBe(1)
      expect(timing?.duration).toBe(700)
    }
    if (id === 'beam') expect(Number.parseFloat(frame.offset)).toBeLessThan(-1)
    else expect(frame.transform).not.toBe('none')
    const during = await link.boundingBox()
    expect(during).toEqual(before)
    await icon.screenshot({ path: testInfo.outputPath(`motion-${id}.png`) })
    await icon.evaluate((node) => {
      for (const animation of node.getAnimations({ subtree: true })) animation.finish()
    })
    await expect
      .poll(() => icon.evaluate((node) => node.getAnimations({ subtree: true }).length))
      .toBe(0)
  }
  if (testInfo.project.use.viewport?.width === 1440) {
    await page.mouse.click(800, 20)
    const icon = sidebar.locator('a[href="/agents/beam"] .navigation-icon')
    await sidebar.locator('a[href="/agents/beam"]').hover()
    await expect
      .poll(() => icon.evaluate((node) => node.getAnimations({ subtree: true }).length))
      .toBeGreaterThan(0)
    await expect
      .poll(() => icon.evaluate((node) => node.getAnimations({ subtree: true }).length))
      .toBe(0)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await sidebar.locator('a[href="/agents/voice"]').focus()
  expect(
    await sidebar
      .locator('.navigation-icon')
      .evaluateAll((icons) => icons.flatMap((icon) => icon.getAnimations({ subtree: true })).length)
  ).toBe(0)
})
