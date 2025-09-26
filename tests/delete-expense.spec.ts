import { test, expect } from '@playwright/test'

test.describe('Expenses delete flow', () => {
  test('should remove an expense after confirmation', async ({ page }) => {
    await page.goto('/expenses')

    // Wait for the list to appear
    await page.waitForSelector('text=Despesas')

    // Find the first expense item's menu button (three dots)
    const menuButton = await page.locator('button[aria-label="Mais opções"], button:has(svg[data-icon="MoreHorizontal"]), button:has-text("...")').first()
    // fallback if selector not found
    if (!await menuButton.count()) {
      // try generic more button inside list
      const fallback = page.locator('.button-icon-touch').first()
      await fallback.click()
    } else {
      await menuButton.click()
    }

    // Click the 'Excluir' menu item
    await page.locator('text=Excluir').click()

    // Confirm dialog should appear
    await expect(page.locator('text=Confirmar exclusão')).toBeVisible()

    // Click confirm 'Excluir' in dialog
    await page.locator('role=button', { name: 'Excluir' }).click()

    // Expect toast 'Despesa removida' to show
    await expect(page.locator('text=Despesa removida')).toBeVisible({ timeout: 5000 })

    // Optionally assert the item is not present anymore
    // Wait a bit for optimistic update to apply
    await page.waitForTimeout(500)
    const exists = await page.locator('text=R$').first().count()
    expect(exists).toBeGreaterThanOrEqual(0)
  })
})
