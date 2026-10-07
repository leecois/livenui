import { expect, test } from '@playwright/test'
import { libraries, parseConfiguration } from '../apps/docs/features/component-library/lib/config'
import { content } from '../apps/docs/features/component-library/lib/content'
import { findExample } from '../apps/docs/features/component-library/lib/examples'
import { openAvatarComponentPreview } from './helpers/component-preview'

test.beforeEach(async ({ page }, testInfo) => {
  const theme = testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
})

test('quick settings, installation and Studio preserve one avatar configuration', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  await openAvatarComponentPreview(page)
  await expect(page.getByRole('tab', { name: 'JSON', exact: true })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Saved', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Try Chat bot', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Make it yours', exact: true })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Try Chat bot', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  const activity = page.getByRole('group', { name: 'Activity', exact: true })
  await activity.getByRole('radio', { name: 'Idle', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(activity.getByRole('radio', { name: 'Working', exact: true })).toBeChecked()
  await page.getByRole('group', { name: 'Size', exact: true }).getByLabel('64px').check()
  await page.getByRole('group', { name: 'Material', exact: true }).getByLabel('Plastic').check()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  const code = page.locator('.code-panel code')
  for (const prop of [
    'type={"chat"}',
    'state={"working"}',
    'size={64}',
    'shading={"plastic"}',
    'paused={false}',
  ])
    await expect(code).toContainText(prop)
  const original = await code.textContent()
  await page
    .locator('.playground-column')
    .screenshot({ path: testInfo.outputPath('configured-preview.png') })
  const example = page.locator('.showcase-example').first()
  await example.scrollIntoViewIfNeeded()
  await expect(example.locator('canvas')).toBeVisible()
  await example.screenshot({ path: testInfo.outputPath('guide-example.png') })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await expect(page.locator('.preview-stage canvas')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('guide-preview.png'), fullPage: true })
  await page.getByRole('button', { name: /Get installation steps/ }).click()
  await expect(page.getByRole('tab', { name: 'Install & Usage', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(page.getByRole('tabpanel', { name: 'Install & Usage', exact: true })).toBeFocused()
  await expect(page.locator('.preview-stage')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: '1. Add Liven UI source', exact: true })
  ).toBeVisible()
  await expect(code).toHaveText(original || '')
  await page.getByLabel('Package manager', { exact: true }).selectOption('bun')
  await page.screenshot({ path: testInfo.outputPath('guide-install.png'), fullPage: true })
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).focus()
  await page.keyboard.press('Home')
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toBeFocused()
  await expect(code).toHaveText(original || '')
  await page.getByRole('link', { name: /Open in Studio/ }).click()
  await expect(page).toHaveURL(/studio\?library=avatars#config=/)
  await expect(code).toHaveText(original || '')
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'JSON', exact: true })).toBeVisible()
  await expect(page.getByLabel('Starting point', { exact: true })).toHaveValue('')
  await page.screenshot({ path: testInfo.outputPath('studio-preview.png'), fullPage: true })
  await page.reload()
  await expect(code).toHaveText(original || '')
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
  await expect(code).toHaveText(original || '')
  await page.screenshot({ path: testInfo.outputPath('studio-install.png'), fullPage: true })
  await page.setViewportSize({ width: 320, height: 1000 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('every guide carries a valid public configuration into Studio', async ({ page }) => {
  test.setTimeout(90000)
  for (const library of libraries) {
    await page.goto(`/agents/${library.id}`)
    if (library.id === 'avatars') await openAvatarComponentPreview(page)
    await expect(page.locator('.preview-stage')).toBeVisible()
    const link = page.getByRole('link', { name: /Open in Studio/ })
    const href = await link.getAttribute('href')
    if (!href) throw new Error(`Missing Studio handoff for ${library.id}`)
    const url = new URL(href, 'http://localhost:3000')
    const shared = parseConfiguration(
      new URLSearchParams(url.hash.slice(1)).get('config') || '',
      library
    )
    expect(shared.variant).toBe('ring')
    if (library.id === 'gooey') expect(shared.props).not.toHaveProperty('theme')
    const code = await page.locator('.code-panel code').textContent()
    await link.click()
    await expect(page.locator('.control-notice')).toHaveText('Your preview configuration is ready.')
    await expect(page.locator('.code-panel code')).toHaveText(code || '')
    await expect(page.getByRole('tab', { name: 'Saved', exact: true })).toBeVisible()
  }
})

for (const library of ['beam', 'voice']) {
  test(`${library}: starting examples render their active effect and configured code`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/agents/${library}`)
    await expect(page.getByRole('button', { name: '▶ Play', exact: true })).toBeVisible()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.getByRole('button', { name: '▶ Play', exact: true }).click()
    for (const id of content[library].featured) {
      const example = findExample(library, id)
      if (!example) throw new Error(`Missing starting example: ${id}`)
      await page.getByRole('button', { name: `Try ${example.name}`, exact: true }).click()
      const effect = page.locator(
        library === 'voice'
          ? '.preview-stage [data-voice-beam][data-active]'
          : '.preview-stage [data-beam][data-active]'
      )
      await expect(effect).toBeVisible()
      await expect(page.locator('.code-panel code')).toContainText('active={true}')
      if (library === 'voice') {
        await expect(effect).toHaveAttribute('data-voice-look', String(example.props.look))
        if (example.props.look !== 'glow')
          await expect(effect.locator('[data-voice-beam-surface]')).toBeVisible()
      } else
        await expect(page.locator('.code-panel code')).toContainText(
          `size={${JSON.stringify(example.props.size)}}`
        )
      await page.locator('.preview-stage').screenshot({ path: testInfo.outputPath(`${id}.png`) })
    }
  })
}

test('guide controls and starting examples fit compact widths and keep visible keyboard focus', async ({
  page,
}, testInfo) => {
  await page.goto('/agents/avatars')
  await openAvatarComponentPreview(page)
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(
      await page.locator('.field-options').evaluateAll((groups) =>
        groups.every((group) => {
          const bounds = group.getBoundingClientRect()
          return [...group.querySelectorAll('label')].every((label) => {
            const box = label.getBoundingClientRect()
            return box.left >= bounds.left - 1 && box.right <= bounds.right + 1
          })
        })
      )
    ).toBe(true)
  }
  const idle = page
    .getByRole('group', { name: 'Activity', exact: true })
    .getByRole('radio', { name: 'Idle', exact: true })
  await idle.focus()
  await page.keyboard.press('ArrowRight')
  const working = page.getByRole('radio', { name: 'Working', exact: true })
  await expect(working).toBeFocused()
  await expect(working).toBeChecked()
  await expect
    .poll(() =>
      working.evaluate((input) => {
        const pill = input.nextElementSibling
        if (!pill) throw new Error('Missing radio pill')
        const style = getComputedStyle(pill)
        return {
          outline: style.outlineStyle,
          width: style.outlineWidth,
          gradient: style.backgroundImage,
          color: style.color,
        }
      })
    )
    .toMatchObject({ outline: 'solid', width: '2px', color: 'rgb(255, 255, 255)' })
  await page
    .locator('.controls-panel')
    .screenshot({ path: testInfo.outputPath('compact-controls.png') })
})

test('a Metal starting example preserves its component, props and integration guidance', async ({
  page,
}) => {
  await page.goto('/agents/metal')
  await page.getByRole('button', { name: 'Try Reflective text', exact: true }).click()
  await expect(page.locator('.code-panel code')).toContainText('<MetalText')
  await page.getByRole('link', { name: /Open in Studio/ }).click()
  await expect(page.locator('#prop-font')).toHaveValue('500 24px/1.2 system-ui')
  await page.getByRole('tab', { name: 'JSON', exact: true }).click()
  expect(JSON.parse(await page.getByLabel('Edit component props').inputValue())).toMatchObject({
    font: '500 24px/1.2 system-ui',
    paused: true,
  })
  await page.getByLabel('Starting point', { exact: true }).selectOption('metal-badge')
  await expect(page.locator('.code-panel code')).toContainText('<MetalBadge')
  await expect(page.getByLabel('Starting point', { exact: true })).toHaveValue('metal-badge')
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
  await expect(page.locator('.integration-guidance')).toContainText('useMetalBend')
  await expect(page.locator('.code-panel code')).toContainText('<MetalBadge')
})

test('invalid shared configuration falls back safely and fragment history restores valid state', async ({
  page,
}) => {
  const fragment = (state: string) =>
    new URLSearchParams({
      config: JSON.stringify({ library: 'orbs', variant: 'ring', props: { state, paused: true } }),
    }).toString()
  await page.goto(`/studio?library=orbs#${fragment('invalid')}`)
  await expect(page.locator('.control-notice')).toContainText('state must be one of')
  await expect(page.locator('.code-panel code')).toContainText('state={"working"}')
  await page.evaluate((value) => {
    window.location.hash = value
  }, fragment('listening'))
  await expect(page.locator('.code-panel code')).toContainText('state={"listening"}')
  await page.evaluate((value) => {
    window.location.hash = value
  }, fragment('searching'))
  await expect(page.locator('.code-panel code')).toContainText('state={"searching"}')
  await page.goBack()
  await expect(page.locator('.code-panel code')).toContainText('state={"listening"}')
  await page.goForward()
  await expect(page.locator('.code-panel code')).toContainText('state={"searching"}')
  await page.getByLabel('Component', { exact: true }).selectOption('avatars')
  await expect(page).toHaveURL(/studio\?library=avatars$/)
  await expect(page.locator('.code-panel code')).toContainText('type={"clover"}')
  await expect(page.locator('.control-notice')).toBeEmpty()
})
