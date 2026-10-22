import { expect, test } from '@playwright/test'

test('discovery cards stay compact and navigate from preview or keyboard', async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem('theme', theme),
    testInfo.project.name.endsWith('dark') ? 'dark' : 'light'
  )
  await page.goto('/agents')
  const cards = page.locator('.library-card')
  await expect(cards).toHaveCount(7)
  await expect(page.locator('[data-library-discovery] + .grid')).toBeHidden()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Interactive React/
  )
  await expect(page.getByRole('status')).toContainText('7 components')
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const layout = await page.locator('.library-grid').evaluate((grid) => ({
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      width: grid.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }))
    expect(layout.columns).toBe(layout.width >= 900 ? 3 : layout.width >= 550 ? 2 : 1)
    expect(layout.overflow).toBe(false)
    for (const card of await cards.all()) {
      await expect(card.locator('a')).toHaveCount(1)
      const sizes = await card.evaluate((element) => {
        const card = element.getBoundingClientRect()
        const link = element.querySelector('a')
        const previewElement = element.querySelector('.card-preview')
        const footerElement = element.querySelector('.card-info')
        if (!link || !previewElement || !footerElement) throw new Error('Incomplete discovery card')
        const target = getComputedStyle(link, '::after')
        const preview = previewElement.getBoundingClientRect()
        const footer = footerElement.getBoundingClientRect()
        return {
          card: card.height,
          link: Number.parseFloat(target.height),
          preview: preview.height,
          footer: footer.height,
        }
      })
      expect(Math.abs(sizes.card - sizes.link)).toBeLessThanOrEqual(2)
      expect(sizes.preview).toBe(254)
      expect(sizes.footer).toBeGreaterThanOrEqual(60)
      expect(sizes.footer).toBeLessThanOrEqual(80)
    }
  }
  const first = cards.first().locator('a')
  const href = await first.getAttribute('href')
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await page.goto('/agents')
  await cards.first().click({ position: { x: 24, y: 24 } })
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await page.goto('/agents/gallery?library=metal&q=MetalText')
  const example = page.locator('.catalog-card-link')
  await expect(example).toHaveCount(1)
  await expect(example).toHaveAccessibleName(/Metal/)
  await page.locator('.library-card').click({ position: { x: 24, y: 24 } })
  await expect(page).toHaveURL(/studio.*example=metal-text/)
  await expect(page.locator('.code-panel code')).toContainText('MetalText')
})
