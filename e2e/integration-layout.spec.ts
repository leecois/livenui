import { expect, test } from '@playwright/test'
import { chooseOption } from './helpers/choices'
import { tabKey } from './helpers/keyboard'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => {
      localStorage.setItem('theme', theme)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            if (Reflect.get(window, 'denyCopy')) throw new Error('Clipboard unavailable')
            Reflect.set(window, 'copiedText', text)
          },
        },
      })
    },
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('installation shows complete commands with compact choices and icon copying', async ({
  page,
  browserName,
}, testInfo) => {
  await page.goto('/studio?library=orbs')
  const canvas = page.locator('.preview-stage canvas')
  await expect(canvas).toBeVisible()
  await canvas.evaluate((element) => {
    element.dataset.installProbe = 'retained'
  })
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  const install = page.locator('.install-panel')
  const command = install.locator('.install-command code')
  const copy = install.getByRole('button', { name: 'Copy command', exact: true })
  const managers = install.getByRole('group', { name: 'Package manager', exact: true })
  const code = await page.locator('.code-panel code').textContent()
  await managers.getByRole('radio', { name: 'npm', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(managers.getByRole('radio', { name: 'pnpm', exact: true })).toBeChecked()
  await expect(managers.locator('.selection-track')).toHaveCount(0)
  await expect(managers.locator('.choice-heading')).toBeHidden()
  await expect(copy).toHaveClass(/copy-icon/)
  expect(await copy.innerText()).toBe('')
  const bounds = await copy.boundingBox()
  expect(bounds).toMatchObject({ width: 44, height: 44 })
  await page.screenshot({
    path: testInfo.outputPath('studio-install-full-page.png'),
    fullPage: true,
  })
  for (const [value, runner] of [
    ['npm', 'npx'],
    ['pnpm', 'pnpm dlx'],
    ['bun', 'bunx'],
  ]) {
    await chooseOption(page, 'Package manager', value)
    const expected = `${runner} shadcn@latest add https://livenui.dev/r/orbs.json`
    await expect(command).toHaveText(expected)
    await copy.click()
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'copiedText'))).toBe(expected)
    await expect(copy).toHaveAttribute('title', 'Copied')
    await expect(copy.locator('[aria-live]')).toHaveText('Copied')
    expect(await copy.boundingBox()).toEqual(bounds)
    await expect(canvas).toHaveAttribute('data-install-probe', 'retained')
    await expect(page.locator('.code-panel code')).toHaveText(code || '')
  }
  await chooseOption(page, 'Package manager', 'pnpm')
  await expect(copy).toHaveAttribute('title', 'Copy command')
  await copy.focus()
  await page.keyboard.press(tabKey(browserName))
  await page.keyboard.press(tabKey(browserName, true))
  await expect(copy).toBeFocused()
  await copy.press('Enter')
  await expect(copy).toHaveCSS('outline-style', 'solid')
  await expect(copy).toHaveAttribute('title', 'Copied')
  await page.evaluate(() => Reflect.set(window, 'denyCopy', true))
  await copy.click()
  await expect(copy).toHaveAttribute('title', 'Copy failed')
  await expect(copy.locator('[aria-live]')).toHaveText('Copy failed')
  expect(await copy.boundingBox()).toEqual(bounds)

  const contained = async () => {
    expect(
      await install.evaluate((element) => {
        const code = element.querySelector('code')
        if (!code) return false
        const bounds = code.getBoundingClientRect()
        const text = document.createRange()
        text.selectNodeContents(code)
        return (
          code.scrollWidth <= code.clientWidth + 1 &&
          [...text.getClientRects()].every(
            (line) =>
              line.left >= bounds.left - 1 &&
              line.right <= bounds.right + 1 &&
              line.top >= bounds.top - 1 &&
              line.bottom <= bounds.bottom + 1
          )
        )
      })
    ).toBe(true)
    expect(
      await page
        .locator('.code-panel pre')
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1)
    ).toBe(true)
    const targets = await managers.locator('input').evaluateAll((elements) =>
      elements.map((element) => ({
        ...element.getBoundingClientRect().toJSON(),
        parent: element.parentElement?.getBoundingClientRect().toJSON(),
      }))
    )
    for (const target of targets) {
      expect(target.width).toBeGreaterThanOrEqual(44)
      expect(target.height).toBe(44)
      expect(target.x).toBe(target.parent?.x)
      expect(target.width).toBe(target.parent?.width)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(command).toBeVisible()
    await contained()
    await expect(canvas).toHaveAttribute('data-install-probe', 'retained')
    if (width === 320)
      await page.screenshot({ path: testInfo.outputPath('studio-install-320.png'), fullPage: true })
  }
  await page.setViewportSize(testInfo.project.use.viewport || { width: 390, height: 1000 })
  await chooseOption(page, 'Package manager', 'npm')
  await chooseOption(page, 'Package manager', 'pnpm')
  await install.screenshot({ path: testInfo.outputPath('studio-install-panel.png') })
  await page
    .locator('.code-panel')
    .screenshot({ path: testInfo.outputPath('studio-react-code.png') })
  await page.goto('/agents/orbs')
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
  await chooseOption(page, 'Package manager', 'pnpm')
  await contained()
  await page.screenshot({
    path: testInfo.outputPath('guide-install-full-page.png'),
    fullPage: true,
  })
  await install.screenshot({ path: testInfo.outputPath('guide-install-panel.png') })
  await page.setViewportSize({ width: 320, height: 1000 })
  await contained()
})

test('copy feedback follows the current command and latest clipboard request', async ({ page }) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  await page.evaluate(() => {
    const requests: { resolve: () => void; reject: () => void }[] = []
    navigator.clipboard.writeText = () =>
      new Promise<void>((resolve, reject) => {
        requests.push({ resolve, reject: () => reject(new Error('Clipboard unavailable')) })
      })
    Reflect.set(window, 'settleCopy', (index: number, failed: boolean) => {
      if (failed) requests[index].reject()
      else requests[index].resolve()
    })
  })
  const copy = page
    .locator('.install-panel')
    .getByRole('button', { name: 'Copy command', exact: true })
  await copy.click()
  await chooseOption(page, 'Package manager', 'bun')
  await page.evaluate(async () => {
    Reflect.get(window, 'settleCopy')(0, false)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
  await expect(copy).toHaveAttribute('title', 'Copy command')
  await expect(copy.locator('[aria-live]')).toBeEmpty()
  await copy.click()
  await copy.click()
  await page.evaluate(() => Reflect.get(window, 'settleCopy')(2, false))
  await expect(copy).toHaveAttribute('title', 'Copied')
  await page.evaluate(async () => {
    Reflect.get(window, 'settleCopy')(1, true)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
  await expect(copy).toHaveAttribute('title', 'Copied')
  await expect(copy.locator('[aria-live]')).toHaveText('Copied')
})

test('copy result motion settles without moving the action and respects reduced motion', async ({
  page,
}) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  const copy = page
    .locator('.install-panel')
    .getByRole('button', { name: 'Copy command', exact: true })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const motion = await copy.evaluate(async (element) => {
    if (!(element instanceof HTMLButtonElement)) throw new Error('Copy requires a native button')
    const before = element.getBoundingClientRect().toJSON()
    element.click()
    for (let frame = 0; frame < 2; frame++) await new Promise(requestAnimationFrame)
    const icon = element.querySelector('.copy-feedback-icon')
    const animations = icon?.getAnimations() || []
    const durations = animations.map((animation) => animation.effect?.getTiming().duration)
    await Promise.all(animations.map((animation) => animation.finished))
    return { before, after: element.getBoundingClientRect().toJSON(), durations }
  })
  expect(motion.durations).toContain(160)
  expect(motion.after).toEqual(motion.before)
  await expect(copy).toHaveAttribute('title', 'Copied')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => Reflect.set(window, 'denyCopy', true))
  await copy.click()
  await expect(copy).toHaveAttribute('title', 'Copy failed')
  expect(
    await copy.locator('.copy-feedback-icon').evaluate((element) => element.getAnimations().length)
  ).toBe(0)
})
