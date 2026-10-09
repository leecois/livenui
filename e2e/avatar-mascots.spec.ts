import { expect, type Locator, type Page, test } from '@playwright/test'
import {
  defaults,
  libraries,
  parseConfiguration,
  studioHref,
} from '../apps/docs/features/component-library/lib/config'
import { buildForm, PAD, SPAN, tierFor } from '../packages/bot-avatars/src/plastic'
import { botAvatarPresets } from '../packages/bot-avatars/src/presets'
import { SHAPE_PATHS } from '../packages/bot-avatars/src/shapes'
import { chooseOption } from './helpers/choices'
import { openAvatarComponentPreview } from './helpers/component-preview'

const mascots = ['arrowhead', 'chat', 'connector', 'bulb'] as const

async function raster(canvas: Locator) {
  return canvas.evaluate((node: HTMLCanvasElement) => {
    const context = node.getContext('2d')
    if (!context) throw new Error('Missing avatar canvas context')
    const { data } = context.getImageData(0, 0, node.width, node.height)
    let hash = 2166136261
    let painted = 0
    let top = node.height
    let ink = 0
    let inkSumX = 0
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] > 32) {
        painted++
        top = Math.min(top, Math.floor(index / 4 / node.width))
      }
      if (
        data[index + 3] > 200 &&
        data[index] < 60 &&
        data[index + 1] < 60 &&
        data[index + 2] < 80
      ) {
        ink++
        inkSumX += (index / 4) % node.width
      }
      for (let channel = 0; channel < 4; channel++)
        hash = Math.imul(hash ^ data[index + channel], 16777619)
    }
    return { hash: hash >>> 0, painted, top, inkX: ink > 20 ? inkSumX / ink : null }
  })
}

async function settled(canvas: Locator) {
  await expect(canvas).toHaveCSS('opacity', '1')
  let last = -1
  let stable = 0
  await expect
    .poll(async () => {
      const frame = await raster(canvas)
      stable = frame.painted > 50 && frame.hash === last ? stable + 1 : 0
      last = frame.hash
      return stable
    })
    .toBeGreaterThanOrEqual(2)
  return raster(canvas)
}

async function connectorContour(canvas: Locator) {
  return canvas.evaluate((node: HTMLCanvasElement) => {
    const context = node.getContext('2d')
    if (!context) throw new Error('Missing connector canvas')
    const scale = node.width / 150
    const { data } = context.getImageData(0, 0, node.width, node.height)
    const alpha = (x: number, y: number) => data[(y * node.width + x) * 4 + 3]
    let separateArms = false
    for (let x = Math.ceil(75 * scale); x < node.width && !separateArms; x++) {
      const bands: { start: number; end: number }[] = []
      let start = -1
      for (let y = 0; y <= node.height; y++) {
        if (y < node.height && alpha(x, y) > 200) {
          if (start === -1) start = y
        } else if (start !== -1) {
          if (y - start >= 5 * scale) bands.push({ start, end: y })
          start = -1
        }
      }
      separateArms =
        bands.length === 3 &&
        bands[1].start - bands[0].end >= 3 * scale &&
        bands[2].start - bands[1].end >= 3 * scale
    }
    const gaps = [34, 70].map((y) => {
      let maximum = 0
      for (let x = 70; x <= 80; x++)
        maximum = Math.max(
          maximum,
          alpha(Math.floor((25 + x) * scale), Math.floor((35 + y) * scale))
        )
      return maximum
    })
    return { separateArms, gaps }
  })
}

async function connectorArmHeights(page: Page) {
  return page.evaluate((path) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 800
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Missing contour canvas')
    context.scale(8, 8)
    context.fill(new Path2D(path))
    const { data } = context.getImageData(65 * 8, 0, 1, canvas.height)
    const heights: number[] = []
    let height = 0
    for (let y = 0; y <= canvas.height; y++) {
      if (y < canvas.height && data[y * 4 + 3] > 200) height++
      else if (height) {
        heights.push(height)
        height = 0
      }
    }
    return heights
  }, SHAPE_PATHS.connector)
}

async function connectorEyes(canvas: Locator) {
  return canvas.evaluate((node: HTMLCanvasElement) => {
    const context = node.getContext('2d')
    if (!context) throw new Error('Missing connector canvas')
    const { data } = context.getImageData(0, 0, node.width, node.height)
    const ink = (i: number) =>
      data[i * 4 + 3] > 200 &&
      data[i * 4] < 60 &&
      data[i * 4 + 1] < 60 &&
      data[i * 4 + 2] < 80 &&
      data[i * 4 + 2] > data[i * 4 + 1] + 8
    const seen = new Set<number>()
    const eyes: number[] = []
    for (let i = 0; i < node.width * node.height; i++) {
      if (seen.has(i) || !ink(i)) continue
      const pending = [i]
      seen.add(i)
      let area = 0
      while (pending.length) {
        const p = pending.pop()
        if (p === undefined) break
        area++
        const x = p % node.width
        for (const q of [
          x > 0 ? p - 1 : -1,
          x < node.width - 1 ? p + 1 : -1,
          p - node.width,
          p + node.width,
        ])
          if (q >= 0 && q < node.width * node.height && !seen.has(q) && ink(q)) {
            seen.add(q)
            pending.push(q)
          }
      }
      if (area >= 4) eyes.push(area)
    }
    return eyes
  })
}

async function connectorVolumeOverflow(canvas: Locator, yaw: number) {
  const N = tierFor(await canvas.evaluate((node: HTMLCanvasElement) => node.width / 1.5))
  const coverage = await canvas.evaluate(
    (_node, params) => {
      const mask = document.createElement('canvas')
      mask.width = mask.height = params.N
      const context = mask.getContext('2d')
      if (!context) throw new Error('Missing volume mask context')
      const unit = params.span / params.N
      context.setTransform(1 / unit, 0, 0, 1 / unit, params.pad / unit, params.pad / unit)
      context.fill(new Path2D(params.path))
      const { data } = context.getImageData(0, 0, params.N, params.N)
      return Array.from({ length: params.N * params.N }, (_, i) => data[i * 4 + 3])
    },
    { N, span: SPAN, pad: PAD, path: SHAPE_PATHS.connector }
  )
  const form = buildForm(Uint8Array.from(coverage), N, 9.75)
  return canvas.evaluate(
    (node: HTMLCanvasElement, model) => {
      const context = node.getContext('2d')
      if (!context) throw new Error('Missing volume canvas')
      const scale = node.width / 150
      const unit = model.span / model.N
      const cy = Math.cos(model.yaw),
        sy = Math.sin(model.yaw)
      const radius = Math.ceil(2 * unit * scale + 1)
      const envelope = new Uint8Array(node.width * node.height)
      for (let i = 0; i < model.height.length; i++) {
        if (model.distance[i] < 0) continue
        const X = ((i % model.N) + 0.5) * unit - model.pad - 50
        const Y = (Math.floor(i / model.N) + 0.5) * unit - model.pad - 50
        for (let z = -model.height[i]; z <= model.height[i]; z += unit) {
          const x = Math.round((75 + cy * X + sy * z) * scale)
          const y = Math.round((85 + Y) * scale)
          for (let dy = -radius; dy <= radius; dy++)
            for (let dx = -radius; dx <= radius; dx++)
              if (x + dx >= 0 && x + dx < node.width && y + dy >= 0 && y + dy < node.height)
                envelope[(y + dy) * node.width + x + dx] = 1
        }
      }
      const { data } = context.getImageData(0, 0, node.width, node.height)
      let overflow = 0
      for (let i = 0; i < envelope.length; i++)
        if (data[i * 4 + 3] > 200 && !envelope[i]) overflow++
      return overflow
    },
    { N, span: SPAN, pad: PAD, yaw, height: Array.from(form.h), distance: Array.from(form.sd) }
  )
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
})

test('mascots retain clear faces, native materials, states, sizes and portable code', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000)
  await page.goto('/agents/avatars')
  await openAvatarComponentPreview(page)
  const clearance = await page.evaluate(
    (items) => {
      const context = document.createElement('canvas').getContext('2d')
      if (!context) throw new Error('Missing geometry canvas')
      return items.map(({ type, path, preset }) => {
        const body = new Path2D(path)
        let clear = true
        for (let x = -23.3; x <= 23.3; x += 1)
          for (let y = -16; y <= 13; y += 1)
            clear &&= context.isPointInPath(
              body,
              preset.faceX + x * preset.faceScale,
              preset.faceY + y * preset.faceScale
            )
        return { type, clear }
      })
    },
    mascots.map((type) => ({ type, path: SHAPE_PATHS[type], preset: botAvatarPresets[type] }))
  )
  expect(clearance).toEqual(mascots.map((type) => ({ type, clear: true })))
  const canvas = page.locator('.preview-stage canvas[data-bot-avatar]')
  const material = page.getByRole('group', { name: 'Material', exact: true })
  const activity = page.getByRole('group', { name: 'Activity', exact: true })
  const sizes = page.getByRole('group', { name: 'Size', exact: true })
  const bodies = new Set<number>()
  for (const type of mascots) {
    await page
      .getByRole('button', { name: `Try ${botAvatarPresets[type].label} bot`, exact: true })
      .click()
    await expect(canvas).toHaveAttribute('data-bot-avatar', type)
    const materials = new Set<number>()
    for (const shading of ['Fabric', 'Plastic', 'Crisp', 'Smooth', 'Flat']) {
      await material.getByRole('radio', { name: shading, exact: true }).check()
      const frame = await settled(canvas)
      materials.add(frame.hash)
      if (shading === 'Fabric') bodies.add(frame.hash)
      await page
        .locator('.preview-stage')
        .screenshot({ path: testInfo.outputPath(`${type}-${shading.toLowerCase()}.png`) })
    }
    expect(materials.size).toBe(5)
    await material.getByRole('radio', { name: 'Plastic', exact: true }).check()
    const states = new Set<number>()
    for (const [name, state] of [
      ['Idle', 'default'],
      ['Working', 'working'],
      ['Sleeping', 'sleeping'],
    ]) {
      await activity.getByRole('radio', { name, exact: true }).check()
      await expect(canvas).toHaveAttribute('data-state', state)
      states.add((await settled(canvas)).hash)
      await page
        .locator('.preview-stage')
        .screenshot({ path: testInfo.outputPath(`${type}-${state}.png`) })
    }
    expect(states.size).toBe(3)
    await activity.getByRole('radio', { name: 'Idle', exact: true }).check()
    await material.getByRole('radio', { name: 'Fabric', exact: true }).check()
    for (const size of [32, 64, 96]) {
      await sizes.getByRole('radio', { name: `${size}px`, exact: true }).check()
      await settled(canvas)
      await expect(canvas).toHaveCSS('width', `${size * 1.5}px`)
      await page
        .locator('.preview-stage')
        .screenshot({ path: testInfo.outputPath(`${type}-${size}px.png`) })
    }
    const original = await page.locator('.code-panel code').textContent()
    expect(original).toContain(`type={"${type}"}`)
    const link = page.getByRole('link', { name: /Open in Studio/ })
    const href = await link.getAttribute('href')
    if (!href) throw new Error('Missing mascot handoff')
    const library = libraries.find((item) => item.id === 'avatars')
    if (!library) throw new Error('Missing avatar library')
    const shared = parseConfiguration(
      new URLSearchParams(new URL(href, 'http://localhost').hash.slice(1)).get('config') || '',
      library
    )
    expect(shared.props.type).toBe(type)
    await link.click()
    await expect(page).toHaveURL(/studio\?library=avatars#config=/)
    await expect(page.locator('.code-panel code')).toHaveText(original || '')
    await page.reload()
    await expect(page.locator('.code-panel code')).toHaveText(original || '')
    await expect(page.locator('.preview-stage canvas')).toHaveAttribute('data-bot-avatar', type)
    await page.goto('/agents/avatars')
    await openAvatarComponentPreview(page)
  }
  expect(bodies.size).toBe(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('mascot-guide.png'), fullPage: true })
})

test('every mascot follows the pointer, hops on click and freezes when paused', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000)
  await page.goto('/studio?library=avatars')
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const canvas = page.locator('.preview-stage canvas[data-bot-avatar]')
  for (const type of mascots) {
    await chooseOption(page, 'Starting point', `avatars-type-${type}`)
    await page
      .getByRole('group', { name: 'Material', exact: true })
      .getByRole('radio', { name: 'Flat', exact: true })
      .check()
    await settled(canvas)
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    const initial = await raster(canvas)
    const bounds = await canvas.boundingBox()
    if (!bounds) throw new Error('Missing avatar bounds')
    await page.mouse.move(bounds.x + bounds.width / 2 - 70, bounds.y + bounds.height / 2)
    expect(initial.inkX).not.toBeNull()
    await expect
      .poll(async () => (await raster(canvas)).inkX ?? Number.POSITIVE_INFINITY)
      .toBeLessThan((initial.inkX ?? 0) - 2)
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    const left = await settled(canvas)
    await page.mouse.move(bounds.x + bounds.width / 2 + 70, bounds.y + bounds.height / 2)
    expect((await raster(canvas)).hash).toBe(left.hash)
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect
      .poll(async () => (await raster(canvas)).inkX ?? Number.NEGATIVE_INFINITY)
      .toBeGreaterThan((left.inkX ?? 0) + 2)
    const beforeHop = await raster(canvas)
    await canvas.click()
    await expect
      .poll(async () => (await raster(canvas)).top, { intervals: [16, 32, 50] })
      .toBeLessThan(beforeHop.top - 5)
    await page
      .locator('.preview-stage')
      .screenshot({ path: testInfo.outputPath(`${type}-motion.png`) })
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    await settled(canvas)
  }
})

test('connector keeps three even branches and open gaps across materials and turns', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const library = libraries.find((item) => item.id === 'avatars')
  if (!library) throw new Error('Missing avatar library')
  const renderConnector = async (shading: string, size: number, yaw = 0) => {
    await page.goto(
      studioHref(
        library,
        {
          ...defaults.avatars,
          type: 'connector',
          shading,
          size,
          paused: true,
          pose: { yaw, pitch: 0, roll: 0 },
        },
        'ring'
      )
    )
    const canvas = page.locator('.preview-stage canvas[data-bot-avatar="connector"]')
    await canvas.scrollIntoViewIfNeeded()
    await settled(canvas)
    return canvas
  }
  for (const shading of ['fabric', 'plastic', 'crisp', 'smooth', 'flat']) {
    for (const size of [32, 64, 128]) {
      const canvas = await renderConnector(shading, size)
      const { separateArms, gaps } = await connectorContour(canvas)
      expect.soft(gaps, `${shading} at ${size}px`).toEqual([0, 0])
      expect.soft(separateArms, `${shading} at ${size}px`).toBe(true)
      await canvas.screenshot({ path: testInfo.outputPath(`connector-${shading}-${size}px.png`) })
    }
  }
  const heights = await connectorArmHeights(page)
  expect(heights).toHaveLength(3)
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1)
  for (const shading of ['fabric', 'plastic']) {
    for (const yaw of [-1, -0.6, 0.6, 1]) {
      const canvas = await renderConnector(shading, 192, yaw)
      const { separateArms } = await connectorContour(canvas)
      expect.soft(separateArms, `${shading} yaw ${yaw}`).toBe(true)
      if (Math.abs(yaw) <= 0.6) {
        expect.soft(await connectorVolumeOverflow(canvas, yaw)).toBe(0)
        const eyes = await connectorEyes(canvas)
        expect.soft(eyes).toHaveLength(2)
        expect.soft(Math.min(...eyes) / Math.max(...eyes)).toBeGreaterThan(0.4)
        await testInfo.attach(`${shading}-eyes-${yaw}`, {
          body: JSON.stringify(eyes),
          contentType: 'application/json',
        })
      }
      await canvas.screenshot({ path: testInfo.outputPath(`connector-${shading}-yaw-${yaw}.png`) })
    }
  }
})
