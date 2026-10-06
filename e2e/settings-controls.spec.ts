import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('numeric drafts, limits, custom values and default use one configuration', async ({
  page,
}) => {
  await page.goto('/studio?library=image')
  const code = page.locator('.code-panel code')
  const speed = page.getByRole('spinbutton', { name: 'Speed', exact: true })
  await speed.fill('1.75')
  await expect(code).toContainText('speed={1}')
  await speed.press('Enter')
  await expect(code).toContainText('speed={1.75}')
  await speed.fill('0')
  await speed.press('Enter')
  await expect(speed).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('.controls-panel').getByRole('alert')).toContainText('greater than 0')
  await expect(code).toContainText('speed={1.75}')
  for (const action of ['Show advanced settings', 'Show essential controls']) {
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(speed).toHaveValue('0')
    await expect(speed).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('.controls-panel').getByRole('alert')).toContainText('greater than 0')
    await expect(code).toContainText('speed={1.75}')
  }
  await speed.press('Escape')
  await expect(speed).toHaveValue('1.75')
  await speed.press('ControlOrMeta+A')
  await speed.press('-')
  await speed.press('Enter')
  await expect(page.locator('.controls-panel').getByRole('alert')).toContainText('valid number')
  await expect(code).toContainText('speed={1.75}')
  await speed.press('Escape')
  await speed.fill('8.125')
  await speed.press('Tab')
  await expect(code).toContainText('speed={8.125}')
  await expect(page.getByText('Custom value · outside drag range', { exact: true })).toBeVisible()
  const strength = page.getByRole('spinbutton', { name: 'Strength', exact: true })
  await strength.fill('2.1')
  await strength.press('Enter')
  await expect(page.locator('.controls-panel').getByRole('alert')).toContainText('2 or less')
  await expect(code).toContainText('strength={1}')
  await strength.press('Escape')
  await page.getByRole('button', { name: 'Use default for Speed', exact: true }).click()
  await expect(speed).toHaveValue('')
  await expect(code).not.toContainText('speed={')
  await speed.fill('2.4')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(speed).toHaveValue('1')
  await speed.press('Enter')
  await expect(code).toContainText('speed={1}')
  const config = new URLSearchParams({
    config: JSON.stringify({ library: 'image', variant: 'ring', props: { strength: 3, speed: 1 } }),
  })
  await page.goto(`/studio?library=image#${config}`)
  await expect(strength).toHaveValue('3')
  await strength.focus()
  await strength.press('Tab')
  await expect(strength).toHaveAttribute('aria-invalid', 'false')
  await expect(code).toContainText('strength={3}')
})

test('neutral tracks drag live, keep the renderer and support keyboard cancellation', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=image')
  const range = page.getByRole('slider', { name: 'Adjust Speed', exact: true })
  const speed = page.getByRole('spinbutton', { name: 'Speed', exact: true })
  const host = page.locator('.preview-stage canvas').first()
  await expect(host).toBeVisible()
  await host.evaluate((element) => {
    element.dataset.controlProbe = 'retained'
  })
  await range.focus()
  await range.press('Home')
  await expect(speed).toHaveValue('0.25')
  await range.press('End')
  await expect(speed).toHaveValue('3')
  await range.press('Shift+ArrowLeft')
  await expect(speed).toHaveValue('2.5')
  await range.press('ArrowLeft')
  await expect(speed).toHaveValue('2.45')
  await range.scrollIntoViewIfNeeded()
  const box = await range.boundingBox()
  if (!box) throw new Error('Missing numeric track')
  expect(box.height).toBeGreaterThanOrEqual(44)
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 6 })
  await expect(speed).not.toHaveValue('2.45')
  await page.keyboard.press('Escape')
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2)
  await page.mouse.up()
  await expect(speed).toHaveValue('2.45')
  await expect(host).toHaveAttribute('data-control-probe', 'retained')
  await range.focus()
  expect(
    await range.evaluate((input) => {
      const row = input.closest('.number-row')
      return row ? getComputedStyle(row).outlineStyle : ''
    })
  ).toBe('solid')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: testInfo.outputPath('numeric-studio-full-page.png'),
    fullPage: true,
  })
})

test('touch dragging updates values and cancellation restores the prior value', async ({
  page,
}) => {
  await page.goto('/studio?library=image')
  const range = page.getByRole('slider', { name: 'Adjust Speed', exact: true })
  await range.scrollIntoViewIfNeeded()
  const box = await range.boundingBox()
  if (!box) throw new Error('Missing numeric track')
  const session = await page.context().newCDPSession(page)
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.2, y: box.y + box.height / 2 }],
    })
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: box.x + box.width * 0.8, y: box.y + box.height / 2 }],
    })
    await expect(page.locator('#prop-speed')).not.toHaveValue('1')
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await expect(page.locator('#prop-speed')).toHaveValue('1')
  } finally {
    await session.detach()
  }
})

test('contextual settings retain hidden values and size choices accept numbers and CSS', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=avatars')
  await page.getByRole('button', { name: 'Show advanced settings' }).click()
  const fur = page.getByRole('spinbutton', { name: 'Fur Length', exact: true })
  await fur.fill('1.7')
  await fur.press('Enter')
  const material = page.getByRole('group', { name: 'Material', exact: true })
  await material.getByRole('radio', { name: 'Plastic', exact: true }).check()
  await expect(fur).toHaveCount(0)
  await expect(page.locator('.code-panel code')).toContainText('furLength={1.7}')
  await material.getByRole('radio', { name: 'Fabric', exact: true }).check()
  await expect(fur).toHaveValue('1.7')
  const size = page.getByRole('group', { name: 'Size', exact: true })
  await size.getByRole('radio', { name: 'Custom', exact: true }).check()
  const input = size.getByRole('textbox', { name: 'Custom size', exact: true })
  await input.fill('80')
  await input.press('Enter')
  await expect(page.locator('.code-panel code')).toContainText('size={80}')
  await input.fill('4rem')
  await input.press('Enter')
  await expect(page.locator('.code-panel code')).toContainText('size={"4rem"}')
  await size.getByRole('radio', { name: '32px', exact: true }).check()
  await expect(page.locator('.code-panel code')).toContainText('size={32}')
  await expect(input).toHaveCount(0)
  await page
    .locator('.controls-panel')
    .screenshot({ path: testInfo.outputPath('avatar-advanced.png') })
  await page.goto('/studio?library=voice')
  await page.getByRole('button', { name: 'Show advanced settings' }).click()
  const look = page.getByRole('group', { name: 'Look', exact: true })
  await look.getByRole('radio', { name: 'Dots', exact: true }).check()
  await expect(page.locator('#prop-dotSize')).toBeVisible()
  await expect(page.locator('#prop-lineWidth')).toHaveCount(0)
  await look.getByRole('radio', { name: 'Lines', exact: true }).check()
  await expect(page.locator('#prop-dotSize')).toHaveCount(0)
  await expect(page.locator('#prop-lineWidth')).toBeVisible()
})

test('color drafts preserve CSS expressions and reject unsupported input before rendering', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=gooey')
  const fill = page.getByRole('textbox', { name: 'Fill', exact: true })
  const code = page.locator('.code-panel code')
  const color = 'color-mix(in srgb, var(--foreground) 25%, var(--surface))'
  await fill.fill(color)
  await fill.press('Enter')
  await expect(code).toContainText(`fill={"${color}"}`)
  await fill.fill('invalid-color')
  await fill.press('Enter')
  await expect(page.locator('.controls-panel').getByRole('alert')).toContainText('valid CSS color')
  await expect(code).toContainText(color)
  await fill.press('Escape')
  await expect(fill).toHaveValue(color)
  await page.getByLabel('Pick Fill', { exact: true }).evaluate((input) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '#ff9900')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(fill).toHaveValue('#ff9900')
  await expect(code).toContainText('fill={"#ff9900"}')
  await page.getByRole('button', { name: 'Use default for Fill', exact: true }).click()
  await expect(code).not.toContainText('fill={')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath('color-guide-full-page.png'), fullPage: true })
  await page.goto('/studio?library=avatars')
  await page.getByRole('button', { name: 'Show advanced settings' }).click()
  const tint = page.getByRole('textbox', { name: 'Color', exact: true })
  await tint.fill('hsl(120 50% 50%)')
  await tint.press('Enter')
  await expect(code).toContainText('color={"hsl(120 50% 50%)"}')
  await tint.fill('hsl(-120 50% 50%)')
  await tint.press('Enter')
  await expect(tint).toHaveAttribute('aria-invalid', 'true')
  await expect(code).toContainText('color={"hsl(120 50% 50%)"}')
  await tint.press('Escape')
  await page.goto('/studio?library=orbs')
  const orbTint = page.getByRole('textbox', { name: 'Color', exact: true })
  await orbTint.fill('var(--foreground)')
  await orbTint.press('Enter')
  await expect(orbTint).toHaveAttribute('aria-invalid', 'true')
  await expect(code).not.toContainText('color={')
})
