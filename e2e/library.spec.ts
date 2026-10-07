import { expect, type Locator, type Page, test } from '@playwright/test'
import { openAvatarComponentPreview } from './helpers/component-preview'

const renderers = {
  beam: '[data-beam]',
  orbs: 'canvas',
  metal: '.metal-fx-root',
  gooey: '.gooey-demo',
  voice: '.voice-host',
  image: 'canvas',
  avatars: 'canvas',
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

async function accent(locator: Locator) {
  const style = await locator.evaluate((element) => {
    const computed = getComputedStyle(element)
    return { background: computed.backgroundImage, color: computed.color }
  })
  expect(style.background).toContain('linear-gradient')
  expect(style.color).toBe('rgb(255, 255, 255)')
}

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

for (const [id, renderer] of Object.entries(renderers)) {
  test(`${id}: renderer, layout, controls and design contracts`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
    })
    expect((await page.goto(`/agents/${id}`))?.status()).toBe(200)
    if (id === 'avatars') await openAvatarComponentPreview(page)
    await page.locator('.preview-stage').scrollIntoViewIfNeeded()
    await expect(page.locator('.preview-stage')).toBeInViewport()
    await expect(page.locator(`.preview-stage ${renderer}`).first()).toBeVisible()
    await expect(page.locator('.preview-stage [role="alert"]')).toHaveCount(0)
    await noOverflow(page)
    await accent(page.locator('.code-panel .button-accent'))
    await accent(page.getByRole('tab', { name: 'Preview', exact: true }))
    for (const pill of await page.locator('.field-option input:checked + span').all())
      await accent(pill)
    const boxes = await page
      .locator('.playground-column, .controls-panel, .code-panel')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect()
          return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }
        })
      )
    const workspaceWidth = await page
      .locator('.preview-settings')
      .evaluate((element) => element.clientWidth)
    if (id === 'avatars' && workspaceWidth >= 900) {
      expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(2)
      expect(boxes[1].x - boxes[0].right).toBeCloseTo(24, 0)
    } else {
      expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].bottom)
      expect(Math.abs(boxes[0].x - boxes[1].x)).toBeLessThan(2)
      expect(Math.abs(boxes[0].right - boxes[1].right)).toBeLessThan(2)
    }
    expect(boxes[2].y).toBeGreaterThanOrEqual(Math.max(boxes[0].bottom, boxes[1].bottom))
    const controls = await page
      .locator('.controls-panel input:not([type="checkbox"]), .controls-panel select')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          height: node.getBoundingClientRect().height,
          font: Number.parseFloat(getComputedStyle(node).fontSize),
          radius: Number.parseFloat(getComputedStyle(node).borderRadius),
        }))
      )
    for (const control of controls) {
      expect(control.height).toBeGreaterThanOrEqual(44)
      expect(control.font).toBe(13)
      expect(control.radius).toBeGreaterThanOrEqual(999)
    }
    expect(
      await page.locator('.preview-stage').evaluate((stage) => {
        const box = stage.getBoundingClientRect()
        const host = stage.querySelector('.beam-host,.voice-host,.image-host,.gooey-demo')
        if (!host) return false
        const rect = host.getBoundingClientRect()
        return rect.left < box.left - 1 || rect.right > box.right + 1
      })
    ).toBe(false)
    for (const [index, card] of (await page.locator('.showcase-example').all()).entries()) {
      await card.scrollIntoViewIfNeeded()
      await expect(
        card.locator('[data-beam], canvas, .metal-fx-root, .gooey-demo, .voice-host').first()
      ).toBeVisible()
      if (id === 'beam') {
        const bounds = await card.locator('.beam-host').evaluate((host) => {
          const frame = host.closest('.card-preview')?.getBoundingClientRect()
          if (!frame) throw new Error('Missing example frame')
          const box = host.getBoundingClientRect()
          return {
            top: box.top,
            bottom: box.bottom,
            left: box.left,
            right: box.right,
            frame: { top: frame.top, bottom: frame.bottom, left: frame.left, right: frame.right },
          }
        })
        expect(bounds.top).toBeGreaterThanOrEqual(bounds.frame.top - 1)
        expect(bounds.bottom).toBeLessThanOrEqual(bounds.frame.bottom + 1)
        expect(bounds.left).toBeGreaterThanOrEqual(bounds.frame.left - 1)
        expect(bounds.right).toBeLessThanOrEqual(bounds.frame.right + 1)
      }
      if (id === 'gooey')
        expect(
          await card.locator('.card-preview').evaluate((frame) => {
            const bounds = frame.getBoundingClientRect()
            return [
              ...frame.querySelectorAll(
                '.liquid-menu-button:not([aria-hidden="true"]), .liquid-thumb, .liquid-drag-card'
              ),
            ].every((control) => {
              const box = control.getBoundingClientRect()
              return box.left >= bounds.left - 1 && box.right <= bounds.right + 1
            })
          })
        ).toBe(true)
      await card.screenshot({ path: testInfo.outputPath(`starting-example-${index}.png`) })
    }
    if (id === 'avatars') {
      const context = page.getByRole('region', { name: 'Agent sidebar example' })
      await context.scrollIntoViewIfNeeded()
      await expect(context.locator('canvas')).toHaveCount(2)
      await context.screenshot({ path: testInfo.outputPath('agent-sidebar.png') })
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(
      id === 'avatars'
        ? page.locator('.preview-stage canvas')
        : page.locator('.showcase-example').first().locator(renderer).first()
    ).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('full-page.png'), fullPage: true })
    expect(errors).toEqual([])
  })
}

test('Studio context remains aligned at desktop, tablet and compact widths', async ({
  page,
}, testInfo) => {
  await page.goto('/studio?library=orbs')
  await expect(page.locator('#studio-library')).toBeVisible()
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await noOverflow(page)
    const measure = await page.locator('.studio-context').evaluate((context) => {
      const label = context.querySelector('label')
      const select = context.querySelector('select')
      const hint = context.querySelector('.context-description')
      if (!label || !select || !hint) throw new Error('Incomplete Studio context')
      const root = context.getBoundingClientRect()
      const rect = (node: Element) => {
        const box = node.getBoundingClientRect()
        return {
          y: box.y,
          center: box.y + box.height / 2,
          bottom: box.bottom,
          right: box.right,
          x: box.x,
          height: box.height,
        }
      }
      return {
        label: rect(label),
        select: rect(select),
        hint: rect(hint),
        right: root.right,
        selectFont: getComputedStyle(select).fontSize,
        hintMargin: getComputedStyle(hint).marginTop,
        row: getComputedStyle(context).display === 'flex',
      }
    })
    expect(measure.selectFont).toBe('13px')
    expect(measure.select.height).toBeGreaterThanOrEqual(44)
    expect(measure.hintMargin).toBe('0px')
    expect(measure.select.right).toBeLessThanOrEqual(measure.right)
    if (measure.row) {
      expect(Math.abs(measure.label.center - measure.select.center)).toBeLessThan(1)
      if (Math.abs(measure.hint.center - measure.select.center) < 44)
        expect(Math.abs(measure.hint.center - measure.select.center)).toBeLessThan(1)
    } else expect(measure.hint.y).toBeGreaterThanOrEqual(measure.select.bottom)
    await page.screenshot({ path: testInfo.outputPath(`context-${width}.png`) })
  }
})

test('discovery, shareable filters and Metal variants', async ({ page }) => {
  await page.goto('/agents')
  const cards = page.locator('.library-card')
  await expect(cards).toHaveCount(7)
  await page.getByRole('searchbox', { name: 'Search components' }).fill('audio')
  await expect(cards).toHaveCount(1)
  await expect(page.locator('.card-title')).toContainText('Voice')
  await page.getByRole('searchbox', { name: 'Search components' }).fill('unmatched')
  await expect(cards).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(cards).toHaveCount(7)
  await page.goto('/agents/gallery')
  await expect(cards).toHaveCount(12)
  expect(
    await page
      .locator('.card-purpose')
      .evaluateAll((nodes) => new Set(nodes.map((node) => node.textContent)).size)
  ).toBe(7)
  await page.getByRole('searchbox', { name: 'Search examples' }).fill('MetalText')
  await expect(cards).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('searchbox', { name: 'Search examples' })).toHaveValue('MetalText')
  await page.locator('.card-title a').click()
  await expect(page).toHaveURL(/studio.*example=metal-text/)
  await expect(page.locator('.code-panel code')).toContainText('MetalText')
  await expect(page.locator('#prop-font')).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/gallery.*q=MetalText/)
})

test('JSON, local presets, installation and portable transfer', async ({ page }) => {
  await page.goto('/studio?library=orbs')
  const code = page.locator('.code-panel code')
  await expect(page.locator('#prop-state')).toBeVisible()
  for (const tab of await page
    .getByRole('tablist', { name: 'Configuration view' })
    .getByRole('tab')
    .all()) {
    const target = await tab.getAttribute('aria-controls')
    await expect(page.locator(`[id="${target}"]`)).toHaveCount(1)
  }
  await page.getByRole('tab', { name: 'Controls', exact: true }).focus()
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'JSON', exact: true })).toBeFocused()
  const original = await code.textContent()
  await page.getByLabel('Edit component props').fill('{"unknownProp":true}')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(page.locator('.control-notice')).toContainText('Unknown prop')
  await expect(code).toHaveText(original || '')
  await page.getByLabel('Edit component props').fill('{"state":"listening","size":32}')
  await page.getByRole('button', { name: /Apply configuration/ }).click()
  await expect(code).toContainText('listening')
  await page.getByRole('tab', { name: 'Saved', exact: true }).click()
  await page.getByLabel('Preset name', { exact: true }).fill('Device preset')
  await page.getByRole('button', { name: /Save preset/ }).click()
  await page.reload()
  await page.getByRole('tab', { name: 'Saved', exact: true }).click()
  await page.getByRole('button', { name: /^Device preset/ }).click()
  await expect(code).toContainText('listening')
  await page.getByRole('button', { name: 'Delete Device preset', exact: true }).click()
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
  await page.getByLabel('Package manager', { exact: true }).selectOption('pnpm')
  await expect(page.locator('.install-command code')).toHaveText(
    'pnpm dlx shadcn@latest add http://localhost:3000/r/orbs.json'
  )
  await page.locator('summary').filter({ hasText: 'Import & export' }).click()
  await accent(page.getByRole('button', { name: /Copy agent prompt/ }))
  const file = page.getByLabel('Import configuration file')
  await file.setInputFiles({
    name: 'orbs.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      '{"library":"orbs","variant":"ring","props":{"state":"breathing","size":32}}'
    ),
  })
  await expect(page.locator('.transfer-notice')).toContainText('imported')
  await expect(code).toContainText('breathing')
  await file.setInputFiles({
    name: 'wrong.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"library":"voice","props":{"level":0.8}}'),
  })
  await expect(page.locator('.transfer-notice')).toContainText('matching library')
  await expect(code).toContainText('breathing')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export JSON/ }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('livenui-orbs.json')
  const stream = await download.createReadStream()
  if (!stream) throw new Error('Configuration download has no stream')
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const configuration = JSON.parse(Buffer.concat(chunks).toString())
  expect(configuration.props.state).toBe('breathing')
  expect(configuration.library).toBe('orbs')
  await page.locator('summary').filter({ hasText: 'API reference' }).click()
  expect(await page.locator('.props-reference tbody tr').count()).toBeGreaterThan(5)
})

test('mobile navigation contains keyboard focus and restores it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport?.width === 1440, 'Drawer is a mobile surface')
  await page.goto('/agents')
  const open = page.getByRole('button', { name: 'Open Sidebar', exact: true })
  await open.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Navigation', exact: true })
  await expect(dialog).toBeVisible()
  await expect
    .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true)
  const focusable = dialog.locator(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  await focusable.first().focus()
  await page.keyboard.press('Shift+Tab')
  await expect(focusable.last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(focusable.first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()
  await page.keyboard.press('Enter')
  await dialog.locator('a[href="/agents/gallery"]').click()
  await expect(page).toHaveURL(/agents\/gallery/)
  await expect(dialog).toBeHidden()
  await open.click()
  const active = await dialog
    .locator('a')
    .evaluateAll((links) =>
      links
        .filter((link) => link.classList.contains('bg-fd-primary/10'))
        .map((link) => link.getAttribute('href'))
    )
  expect(active).toEqual(['/agents/gallery'])
})

test('all examples remain reachable and preview variants retain interactions', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/agents/gallery')
  for (let count = 12; count < 87; count += 12) {
    await page.getByRole('button', { name: /Show \d+ more examples/ }).click()
    await expect(page.locator('.example-card')).toHaveCount(Math.min(count + 12, 87))
  }
  await page.goto('/studio?library=metal')
  const components = page.getByRole('group', { name: 'Metal component' })
  for (const variant of ['text', 'badge', 'ring']) {
    await components.getByRole('button', { name: variant, exact: true }).click()
    await expect(page.locator('.preview-stage .metal-fx-root')).toBeVisible()
    await expect(page.locator('.code-panel code')).toContainText(
      variant === 'text' ? 'MetalText' : variant === 'badge' ? 'MetalBadge' : 'MetalFx'
    )
    await page
      .locator('.preview-stage')
      .screenshot({ path: testInfo.outputPath(`metal-${variant}.png`) })
  }
  await page.goto('/studio?library=gooey')
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  const behavior = page.getByLabel('Liquid behavior', { exact: true })
  for (const variant of ['morph', 'move', 'bend', 'melt']) {
    await behavior.selectOption(variant)
    await expect(page.locator('.code-panel code')).toContainText(`"effect":"${variant}"`)
    await page
      .locator('.preview-stage')
      .screenshot({ path: testInfo.outputPath(`liquid-${variant}.png`) })
    if (variant === 'morph') {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toHaveAttribute(
        'aria-expanded',
        'true'
      )
    }
    if (variant === 'move') {
      const slider = page.getByRole('slider', { name: 'Liquid slider' })
      await slider.focus()
      await page.keyboard.press('End')
      await expect(slider).toHaveAttribute('aria-valuenow', '100')
      await page.keyboard.press('Home')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')
    }
  }
  await page.goto('/studio?library=avatars')
  await page
    .getByRole('group', { name: 'Activity', exact: true })
    .getByRole('radio', { name: 'Working', exact: true })
    .check()
  await expect(page.locator('.code-panel code')).toContainText('working')
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await expect(page.locator('.preview-caption .eyebrow')).toHaveText('LIVE PREVIEW')
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
  await expect(page.locator('.preview-caption .eyebrow')).toHaveText('PREVIEW PAUSED')
  expect(errors).toEqual([])
})

test('metadata, agent references and registry routes remain coherent', async ({
  page,
  request,
}) => {
  await page.goto('/studio')
  await expect(page).toHaveTitle('Studio · Liven UI')
  expect(await page.locator('link[type="application/rss+xml"]').count()).toBe(0)
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/\/studio$/)
  expect(
    await page.locator('meta[name="author"], meta[name="creator"], meta[name="publisher"]').count()
  ).toBe(0)
  for (const path of [
    '/agent-skill.md',
    '/llms.txt',
    '/llms-full.txt',
    '/static.json',
    '/agents/orbs.mdx',
    '/r/img-fx.json',
    '/registry/_registry.json',
  ]) {
    expect((await request.get(path)).status()).toBe(200)
  }
  expect((await request.get('/og/agents/orbs/image.webp')).status()).toBe(200)
  const redirect = await request.get('/blog/retired', { maxRedirects: 0 })
  expect(redirect.status()).toBe(308)
  expect(redirect.headers().location).toBe('/agents')
})

test('overview, examples and guide screenshots', async ({ page }, testInfo) => {
  for (const route of ['/agents', '/agents/gallery', '/agents/integration']) {
    await page.goto(route)
    await expect(page.locator('h1')).toBeVisible()
    await noOverflow(page)
    if (route === '/agents') {
      for (const card of await page.locator('.library-card').all()) {
        await card.scrollIntoViewIfNeeded()
        await expect(
          card.locator('[data-beam], canvas, .metal-fx-root, .gooey-demo, .voice-host').first()
        ).toBeVisible()
      }
      await page.evaluate(() => window.scrollTo(0, 0))
    }
    if (route === '/agents/gallery') {
      const card = page.locator('.library-card').last()
      await card.scrollIntoViewIfNeeded()
      await expect(
        card.locator('[data-beam], canvas, .metal-fx-root, .gooey-demo, .voice-host').first()
      ).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('gallery-lower.png') })
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect(
        page
          .locator('.library-card')
          .first()
          .locator('[data-beam], canvas, .metal-fx-root, .gooey-demo, .voice-host')
          .first()
      ).toBeVisible()
    }
    await page.screenshot({
      path: testInfo.outputPath(`${route.split('/').at(-1)}.png`),
      fullPage: true,
    })
  }
})

test('installation commands and copied code use maintained Liven UI source', async ({
  page,
  request,
}) => {
  await page.goto('/studio?library=orbs')
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '1. Add Liven UI source', exact: true })
  ).toBeVisible()
  await expect(page.locator('.code-panel code')).toContainText("from '@/components/livenui/orbs'")
  const manager = page.getByLabel('Package manager', { exact: true })
  for (const [value, runner] of [
    ['npm', 'npx'],
    ['pnpm', 'pnpm dlx'],
    ['bun', 'bunx'],
  ] as const) {
    await manager.selectOption(value)
    await expect(page.locator('.install-command code')).toHaveText(
      `${runner} shadcn@latest add http://localhost:3000/r/orbs.json`
    )
  }
  for (const id of ['beam', 'orbs', 'metal', 'gooey', 'voice', 'image', 'avatars']) {
    const response = await request.get(`/r/${id}.json`)
    expect(response.status()).toBe(200)
    const payload = await response.json()
    expect(payload.name).toBe(id)
    expect(payload.files.length).toBeGreaterThan(3)
    expect(payload.files[0].content).toContain(`export * from './${id}/index'`)
    expect(payload.files.some((file: { target: string }) => file.target.endsWith('/LICENSE'))).toBe(
      true
    )
    for (const dependency of payload.dependencies) {
      expect(dependency).not.toMatch(
        /^(border-beam|thinking-orbs|metal-fx|liquid-gooey|voice-glow|img-fx|bot-avatars)(@|$)/
      )
    }
  }
  const reference = await (await request.get('/agent-skill.md')).text()
  expect(reference).toContain('Install source: npx shadcn@latest add')
  expect(reference).toContain("from '@/components/livenui/orbs'")
  expect(reference).not.toContain('Install: npm install thinking-orbs')
})
