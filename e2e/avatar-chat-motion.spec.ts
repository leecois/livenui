import { type ElementHandle, expect, type Locator, test } from '@playwright/test'

const appearance = (canvas: Locator) =>
  canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())

async function settle(page: ReturnType<Locator['page']>) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
}

async function paints(canvas: ElementHandle<HTMLCanvasElement>) {
  return canvas.evaluate(
    (element) =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = []
        const read = () => {
          samples.push(Number((element as HTMLElement).dataset.motionPaints))
          if (samples.length === 10) resolve(samples)
          else requestAnimationFrame(read)
        }
        requestAnimationFrame(read)
      })
  )
}

test('sidebar motion follows hover, keyboard focus and selection and pauses outside view', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/agents/avatars')
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  const examples = chat.locator('.avatar-chat-examples')
  const openExamples = async () => {
    if (!(await examples.isVisible()))
      await chat.getByRole('button', { name: 'Chats and examples', exact: true }).click()
    await expect(examples).toBeVisible()
  }
  await openExamples()
  const choices = examples.getByRole('navigation', {
    name: 'Chat examples',
    exact: true,
  })
  const planner = choices.getByRole('button', {
    name: 'Plan a feature',
    exact: true,
  })
  const tutor = choices.getByRole('button', {
    name: 'Explain a concept',
    exact: true,
  })
  const canvas = planner.locator('canvas')
  const other = tutor.locator('canvas')
  await expect(canvas).toBeVisible()
  const probe = (await canvas.elementHandle()) as ElementHandle<HTMLCanvasElement> | null
  if (!probe) throw new Error('Missing sidebar avatar')
  await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Missing sidebar avatar context')
    const clear = context.clearRect.bind(context)
    canvas.dataset.motionProbe = 'retained'
    canvas.dataset.motionPaints = '0'
    context.clearRect = (...args) => {
      canvas.dataset.motionPaints = String(Number(canvas.dataset.motionPaints) + 1)
      clear(...args)
    }
  })
  await settle(page)
  const original = await appearance(canvas)
  const originalOther = await appearance(other)
  expect(new Set(await paints(probe)).size).toBe(1)
  const bounds = await planner.boundingBox()
  await planner.hover()
  await expect.poll(() => appearance(canvas)).not.toBe(original)
  expect(await appearance(other)).toBe(originalOther)
  expect(await planner.boundingBox()).toEqual(bounds)
  await page.screenshot({ path: testInfo.outputPath('chat-hover-full-page.png'), fullPage: true })
  await page.mouse.move(0, 0)
  await expect.poll(() => appearance(canvas)).toBe(original)
  expect(new Set(await paints(probe)).size).toBe(1)
  await planner.focus()
  await page.keyboard.press('Tab')
  await expect(tutor).toBeFocused()
  await expect.poll(() => appearance(other)).not.toBe(originalOther)
  await expect.poll(() => appearance(canvas)).toBe(original)
  await planner.click()
  await chat.getByRole('button', { name: 'Stop reply', exact: true }).click()
  await openExamples()
  await examples.getByRole('button', { name: 'New chat', exact: true }).focus()
  await page.mouse.move(0, 0)
  await expect(planner).toHaveAttribute('aria-current', 'true')
  await expect(planner).toHaveCSS('color', 'rgb(255, 255, 255)')
  await expect(planner).toHaveCSS('background-image', /linear-gradient/)
  await expect(canvas).toHaveAttribute('data-motion-probe', 'retained')
  await expect.poll(() => appearance(canvas)).not.toBe(original)
  expect(await appearance(other)).toBe(originalOther)
  await page.screenshot({
    path: testInfo.outputPath('chat-selected-full-page.png'),
    fullPage: true,
  })
  const content = examples.locator('.avatar-chat-panel-content')
  await content.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect
    .poll(async () => (await planner.boundingBox())?.y ?? Number.POSITIVE_INFINITY)
    .toBeLessThan((await content.boundingBox())?.y ?? 0)
  await settle(page)
  expect(new Set(await paints(probe)).size).toBe(1)
  await content.evaluate((element) => {
    element.scrollTop = 0
  })
  await expect.poll(async () => new Set(await paints(probe)).size).toBeGreaterThan(1)
  await page.setViewportSize({ width: 320, height: 600 })
  await expect(chat.getByRole('button', { name: 'Chats and examples', exact: true })).toBeVisible()
  await openExamples()
  await examples.getByRole('button', { name: 'Close Liven UI', exact: true }).click()
  await expect(examples).toBeHidden()
  await settle(page)
  expect(new Set(await paints(probe)).size).toBe(1)
  await openExamples()
  await expect.poll(async () => new Set(await paints(probe)).size).toBeGreaterThan(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => appearance(canvas)).toBe(original)
  expect(new Set(await paints(probe)).size).toBe(1)
  await tutor.hover()
  expect(await appearance(other)).toBe(originalOther)
  await settle(page)
  expect(new Set(await paints(probe)).size).toBe(1)
  await page.screenshot({
    path: testInfo.outputPath('chat-reduced-320-full-page.png'),
    fullPage: true,
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(() => appearance(canvas)).not.toBe(original)
  await expect(canvas).toHaveAttribute('data-motion-probe', 'retained')
  await examples.getByRole('link', { name: 'Liven UI — All components', exact: true }).click()
  await expect(page).toHaveURL(/\/agents$/)
  await expect(page.locator('.avatar-chat-thumbnail canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})
