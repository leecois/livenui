import { expect, type Page, test } from '@playwright/test'
import { changeLibrary } from './helpers/choices'

declare global {
  interface Window {
    __captureRequests: { resolve: () => void; reject: () => void; stops: number }[]
  }
}

async function controlledMicrophone(page: Page, path = '/studio?library=voice') {
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
  await page.goto(path)
  await expect(page.locator('.preview-stage .voice-host')).toBeVisible()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page
    .locator('.preview-stage')
    .getByRole('button', { name: 'Use microphone', exact: true })
    .click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests.length)).toBe(1)
}

for (const action of ['pause', 'replay', 'navigate', 'install']) {
  test(`microphone releases permission completed after ${action}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await controlledMicrophone(page, action === 'install' ? '/agents/voice' : undefined)
    if (action === 'pause') await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
    else if (action === 'replay')
      await page.getByRole('button', { name: '↻ Replay', exact: true }).click()
    else if (action === 'install') {
      await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
      await expect(page.locator('.preview-stage .voice-host')).toHaveCount(0)
    } else {
      await changeLibrary(page, 'orbs')
      await expect(page.locator('.stage-orbs')).toBeVisible()
    }
    await page.evaluate(() => window.__captureRequests[0].resolve())
    await expect.poll(() => page.evaluate(() => window.__captureRequests[0].stops)).toBe(1)
    await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('leaving Preview stops live capture and returning requires a new explicit request', async ({
  page,
}) => {
  await controlledMicrophone(page, '/agents/voice')
  await page.evaluate(() => window.__captureRequests[0].resolve())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Install & Usage', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests[0].stops)).toBe(1)
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await expect(
    page.locator('.preview-stage').getByRole('button', { name: 'Use microphone', exact: true })
  ).toBeVisible()
  expect(await page.evaluate(() => window.__captureRequests.length)).toBe(1)
  await page
    .locator('.preview-stage')
    .getByRole('button', { name: 'Use microphone', exact: true })
    .click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests.length)).toBe(2)
  await page.evaluate(() => window.__captureRequests[1].resolve())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Stop microphone', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests[1].stops)).toBe(1)
})

test('late microphone denial cannot replace a newer live request', async ({ page }) => {
  await controlledMicrophone(page)
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
  await page.getByRole('button', { name: '▶ Play', exact: true }).click()
  await page
    .locator('.preview-stage')
    .getByRole('button', { name: 'Use microphone', exact: true })
    .click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests.length)).toBe(2)
  await page.evaluate(() => window.__captureRequests[1].resolve())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  await page.evaluate(() => window.__captureRequests[0].reject())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  await expect(page.locator('.voice-demo')).not.toContainText('permission was denied')
  await page.getByRole('button', { name: 'Stop microphone', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests[1].stops)).toBe(1)
})

test('Studio inspector tabs preserve capture until an explicit pause', async ({ page }) => {
  await controlledMicrophone(page)
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  await page.getByRole('tab', { name: 'Presets', exact: true }).click()
  await page.evaluate(() => window.__captureRequests[0].resolve())
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__captureRequests[0].stops)).toBe(0)
  await page.getByRole('tab', { name: 'Code', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop microphone', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__captureRequests[0].stops)).toBe(0)
  await page.getByRole('tab', { name: 'Customize', exact: true }).click()
  expect(await page.evaluate(() => window.__captureRequests.length)).toBe(1)
  await page.getByRole('button', { name: 'Ⅱ Pause', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__captureRequests[0].stops)).toBe(1)
})
