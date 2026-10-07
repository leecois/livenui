import { expect, type Page } from '@playwright/test'

export async function openAvatarComponentPreview(page: Page) {
  const chat = page.getByRole('dialog', { name: 'Bot avatar chat playground', exact: true })
  await expect(chat).toBeVisible()
  await chat.getByRole('button', { name: 'Component preview', exact: true }).click()
  await expect(chat).toHaveCount(0)
}
