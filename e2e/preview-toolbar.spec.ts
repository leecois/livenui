import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('preview actions stay grouped and retain the scene through width and playback changes', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=orbs')
  const toolbar = page.locator('.preview-toolbar')
  const canvas = page.locator('.preview-stage canvas').first()
  await expect(canvas).toBeVisible()
  await canvas.evaluate((element) => {
    element.dataset.toolbarProbe = 'retained'
  })
  const play = toolbar.getByRole('button', { name: 'Play', exact: true })
  await expect(play).toHaveAttribute('title', 'Play')
  await play.focus()
  await play.press('Enter')
  const pause = toolbar.getByRole('button', { name: 'Pause', exact: true })
  await expect(pause).toBeFocused()
  await expect(pause).toHaveCSS('outline-style', 'solid')
  await pause.press('Enter')
  await toolbar.getByRole('button', { name: 'Mobile', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-toolbar-probe', 'retained')
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect
      .poll(() =>
        toolbar.getByRole('button').evaluateAll((buttons) =>
          buttons.every((button) => {
            const rect = button.getBoundingClientRect()
            return button.contains(
              document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
            )
          })
        )
      )
      .toBe(true)
    const boxes = await toolbar.getByRole('button').evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect()
        return {
          ...rect.toJSON(),
          hit: button.contains(
            document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
          ),
        }
      })
    )
    expect(boxes).toHaveLength(5)
    for (const box of boxes) {
      expect(box.width).toBe(44)
      expect(box.height).toBe(44)
      expect(box.y).toBeCloseTo(boxes[0].y, 0)
      expect(box.hit).toBe(true)
    }
    expect(boxes[3].x - boxes[2].right).toBeLessThanOrEqual(32)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(canvas).toHaveAttribute('data-toolbar-probe', 'retained')
  }
  await toolbar.getByRole('button', { name: 'Replay', exact: true }).click()
  await expect(canvas).toBeVisible()
  await expect(canvas).not.toHaveAttribute('data-toolbar-probe')
  await page.setViewportSize(testInfo.project.use.viewport || { width: 390, height: 1000 })
  await page.screenshot({
    path: testInfo.outputPath('studio-toolbar-full-page.png'),
    fullPage: true,
  })
  await page.goto('/agents/orbs')
  await expect(page.locator('.preview-stage canvas').first()).toBeVisible()
  await page.setViewportSize({ width: 320, height: 1000 })
  await toolbar.scrollIntoViewIfNeeded()
  expect(await toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await toolbar.screenshot({ path: testInfo.outputPath('guide-toolbar-320.png') })
})
