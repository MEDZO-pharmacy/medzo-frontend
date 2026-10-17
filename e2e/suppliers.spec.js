import { expect, test } from '@playwright/test'
import { json, mockInventoryManagerSession } from './helpers'

test('inventory manager deactivates an active supplier through the supplier workflow', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let deactivationRequested = false

  await page.route('**/purchasing-supplier-api/api/suppliers**', async (route) => {
    const { method } = route.request()
    if (method === 'GET') {
      return json(route, [{
        id: 'supplier-1', name: 'HealthCare Distributors', contactName: 'Nimal Perera', phone: '0771234567', isActive: true,
      }])
    }
    if (method === 'PATCH') {
      deactivationRequested = true
      return json(route, {})
    }
    return route.fallback()
  })

  await page.goto('/suppliers')
  await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible()
  await expect(page.getByText('HealthCare Distributors')).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Deactivate' }).click()

  await expect.poll(() => deactivationRequested).toBe(true)
  await expect(page.getByText('Inactive')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()
})
