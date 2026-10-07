import { expect, test } from '@playwright/test'
import { openAvatarComponentPreview } from './helpers/component-preview'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('avatar workspace brings the character and configuration before code and examples', async ({
  page,
}, testInfo) => {
  for (const route of ['/agents/avatars', '/studio?library=avatars']) {
    await page.goto(route)
    if (route === '/agents/avatars') await openAvatarComponentPreview(page)
    const workspace = page.locator('.avatar-workspace')
    const preview = workspace.locator('.playground-column')
    const controls = workspace.locator('.controls-panel')
    await expect(preview.locator('canvas[data-bot-avatar="clover"]')).toBeVisible()
    const boxes = await workspace.evaluate((element) => {
      const preview = element.querySelector('.playground-column')?.getBoundingClientRect()
      const controls = element.querySelector('.controls-panel')?.getBoundingClientRect()
      const code = element.parentElement?.querySelector('.code-panel')?.getBoundingClientRect()
      if (!preview || !controls || !code) throw new Error('Missing avatar workspace panel')
      return {
        width: element.clientWidth,
        preview: preview.toJSON(),
        controls: controls.toJSON(),
        code: code.toJSON(),
      }
    })
    if (boxes.width >= 900) {
      expect(boxes.controls.left - boxes.preview.right).toBeCloseTo(24, 0)
      expect(boxes.controls.top).toBeCloseTo(boxes.preview.top, 0)
      expect(boxes.controls.width).toBe(384)
    } else {
      expect(boxes.controls.top - boxes.preview.bottom).toBeCloseTo(24, 0)
      expect(boxes.controls.left).toBeCloseTo(boxes.preview.left, 0)
      expect(boxes.controls.width).toBeCloseTo(boxes.preview.width, 0)
    }
    expect(boxes.code.top - Math.max(boxes.preview.bottom, boxes.controls.bottom)).toBeCloseTo(
      24,
      0
    )
    await expect(preview.locator('.avatar-identity h3')).toHaveText('Clover bot')
    await expect(preview.locator('.avatar-activity')).toHaveText('Idle')
    await expect(
      controls.getByRole('group', { name: 'Shape', exact: true }).getByRole('radio')
    ).toHaveCount(8)
    await expect(
      controls
        .getByRole('group', { name: 'Hat', exact: true })
        .getByRole('radio', { name: 'None', exact: true })
    ).toBeChecked()
    await expect(
      controls
        .getByRole('group', { name: 'Glasses', exact: true })
        .getByRole('radio', { name: 'None', exact: true })
    ).toBeChecked()
    await expect(
      controls.getByRole('group', { name: 'Color palette' }).getByRole('button')
    ).toHaveCount(6)
    await controls.scrollIntoViewIfNeeded()
    await expect(controls.locator('.avatar-shape-thumbnail canvas')).toHaveCount(8)
    if (route === '/agents/avatars') {
      const examples = await page.locator('.component-showcase').boundingBox()
      const code = await page.locator('.code-panel').boundingBox()
      if (!examples || !code) throw new Error('Missing avatar examples or code')
      expect(examples.y).toBeGreaterThan(code.y + code.height)
      for (const [index, example] of (await page.locator('.showcase-example').all()).entries()) {
        await example.scrollIntoViewIfNeeded()
        await expect(example.locator('canvas')).toBeVisible()
        await example.screenshot({ path: testInfo.outputPath(`avatar-example-${index}.png`) })
      }
      await page.locator('.avatar-context').scrollIntoViewIfNeeded()
      await expect(page.locator('.avatar-context canvas')).toHaveCount(2)
      await page
        .locator('.avatar-context')
        .screenshot({ path: testInfo.outputPath('avatar-agent-list.png') })
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    if (route === '/agents/avatars') {
      await expect(page.locator('.showcase-example').first().locator('canvas')).toHaveCount(0)
    }
    await page.screenshot({
      path: testInfo.outputPath(
        route.includes('studio') ? 'avatar-studio-full-page.png' : 'avatar-guide-full-page.png'
      ),
      fullPage: true,
    })
    await controls.screenshot({
      path: testInfo.outputPath(
        route.includes('studio') ? 'avatar-studio-settings.png' : 'avatar-guide-settings.png'
      ),
    })
  }
})

test('shape thumbnails, color and accessories keep one native renderer and working code', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=avatars')
  const canvas = page.locator('.preview-stage canvas')
  await expect(canvas).toBeVisible()
  await canvas.evaluate((element) => {
    element.dataset.layoutProbe = 'retained'
  })
  const controls = page.locator('.controls-panel')
  const code = page.locator('.code-panel code')
  await controls
    .getByRole('group', { name: 'Hat', exact: true })
    .getByRole('radio', { name: 'Crown', exact: true })
    .check()
  await controls
    .getByRole('group', { name: 'Glasses', exact: true })
    .getByRole('radio', { name: 'Round', exact: true })
    .check()
  await controls
    .getByRole('group', { name: 'Activity', exact: true })
    .getByRole('radio', { name: 'Working', exact: true })
    .check()
  await controls
    .getByRole('group', { name: 'Material', exact: true })
    .getByRole('radio', { name: 'Plastic', exact: true })
    .check()
  await controls.getByRole('button', { name: 'Use Mint color', exact: true }).click()
  const shape = controls.getByRole('group', { name: 'Shape', exact: true })
  await shape.getByRole('button', { name: 'Browse all 22 shapes' }).click()
  await expect(shape.getByRole('radio')).toHaveCount(22)
  const flower = shape.getByRole('radio', { name: 'Flower', exact: true })
  await flower.check()
  await flower.press('ArrowRight')
  await expect(shape.getByRole('radio', { name: 'Triangle', exact: true })).toBeChecked()
  await shape.getByRole('button', { name: 'Show fewer shapes' }).click()
  await expect(shape.getByRole('radio')).toHaveCount(9)
  await expect(shape.getByRole('radio', { name: 'Triangle', exact: true })).toBeChecked()
  for (const prop of [
    'type={"triangle"}',
    'hat={"crown"}',
    'glasses={"round"}',
    'shading={"plastic"}',
    'state={"working"}',
    'color={"#1ED3C6"}',
  ]) {
    await expect(code).toContainText(prop)
  }
  await expect(canvas).toHaveAttribute('data-bot-avatar', 'triangle')
  await expect(canvas).toHaveAttribute('data-layout-probe', 'retained')
  await expect(page.locator('.avatar-identity h3')).toHaveText('Triangle bot')
  await expect(page.locator('.avatar-activity')).toHaveText('Working')
  const color = controls.getByRole('textbox', { name: 'Color', exact: true })
  await color.fill('invalid-color')
  await color.press('Enter')
  await expect(color).toHaveAttribute('aria-invalid', 'true')
  await controls.getByRole('button', { name: 'Use Sky color', exact: true }).click()
  await expect(color).toHaveAttribute('aria-invalid', 'false')
  await expect(code).toContainText('color={"#41C4FF"}')
  const sky = controls.getByRole('button', { name: 'Use Sky color', exact: true })
  await expect(sky).toHaveAttribute('aria-pressed', 'true')
  const selected = await sky.evaluate((element) => ({
    fill: getComputedStyle(element).backgroundImage,
    color: getComputedStyle(element).color,
  }))
  expect(selected.fill).toContain('linear-gradient')
  expect(selected.color).toBe('rgb(255, 255, 255)')
  await page.locator('.preview-stage').scrollIntoViewIfNeeded()
  await page
    .locator('.preview-stage')
    .screenshot({ path: testInfo.outputPath('avatar-accessories.png') })
  await controls.getByRole('button', { name: 'Use default for Color', exact: true }).click()
  await expect(code).not.toContainText('color={')
  await shape.getByRole('button', { name: 'Use default for Shape', exact: true }).click()
  await expect(canvas).toHaveAttribute('data-bot-avatar', 'clover')
  await expect(code).not.toContainText('type={')
  await expect(code).toContainText('hat={"crown"}')
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
    expect(
      await controls.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return [...element.querySelectorAll('input,button,select')].every((node) => {
          const box = node.getBoundingClientRect()
          return !box.width || (box.left >= bounds.left && box.right <= bounds.right)
        })
      })
    ).toBe(true)
    if (width === 320) {
      await controls.screenshot({ path: testInfo.outputPath('avatar-customized-compact.png') })
    }
  }
  const config = new URLSearchParams({
    config: JSON.stringify({
      library: 'avatars',
      variant: 'ring',
      props: { type: 'flower', hat: 'beanie', size: '4rem', color: '#123456' },
    }),
  })
  await page.goto(`/studio?library=avatars#${config}`)
  await expect(shape.getByRole('radio', { name: 'Flower', exact: true })).toBeChecked()
  await expect(shape.getByRole('radio')).toHaveCount(9)
  await expect(code).toContainText('size={"4rem"}')
  await expect(code).toContainText('hat={"beanie"}')
  await expect(code).toContainText('color={"#123456"}')
})
