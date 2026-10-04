import { expect, type Page, test } from '@playwright/test'

declare global {
  interface Window {
    __captureRequests: { resolve: () => void; reject: () => void; stops: number }[]
  }
}

async function controlledMicrophone(page: Page) {
  await page.addInitScript(() => {
    window.__captureRequests = []
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise<MediaStream>((resolve, reject) => {
            const request = {
              stops: 0,
              resolve: () =>
                resolve({
                  getAudioTracks: () => [],
                  getTracks: () => [{ stop: () => request.stops++ }],
                } as unknown as MediaStream),
              reject: () => reject(new DOMException('Permission denied', 'NotAllowedError')),
            }
            window.__captureRequests.push(request)
          }),
      },
    })
  })
  await page.goto('/studio?library=voice')
  await expect(page.locator('.voice-host')).toBeVisible()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.getByRole('button', { name: 'Use microphone', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests.length)).toBe(1)
}

for (const action of ['pause', 'replay', 'navigate']) {
  test(`microphone releases permission completed after ${action}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await controlledMicrophone(page)
    if (action === 'pause') await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
    else if (action === 'replay')
      await page.getByRole('button', { name: '↻ Replay', exact: true }).click()
    else {
      await page.getByLabel('Component', { exact: true }).selectOption('orbs')
      await expect(page.locator('.stage-orbs')).toBeVisible()
    }
    await page.evaluate(() => window.__captureRequests[0].resolve())
    await expect.poll(() => page.evaluate(() => window.__captureRequests[0].stops)).toBe(1)
    await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('late microphone denial cannot replace a newer live request', async ({ page }) => {
  await controlledMicrophone(page)
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page.getByRole('button', { name: 'Use microphone', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests.length)).toBe(2)
  await page.evaluate(() => window.__captureRequests[1].resolve())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  await page.evaluate(() => window.__captureRequests[0].reject())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  await expect(page.locator('.voice-demo')).not.toContainText('permission was denied')
  await page.getByRole('button', { name: 'Stop microphone', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests[1].stops)).toBe(1)
})
