import { expect, test } from '@playwright/test'
import { json, mockInventoryManagerSession } from './helpers'

test('inventory manager sees a low-stock reorder suggestion and starts a purchase order', async ({ page }) => {
  await mockInventoryManagerSession(page)

  await page.route('**/purchasing-supplier-api/api/purchase-orders', (route) => json(route, [{
    id: 'po-1', orderNumber: 'PO-1001', supplierName: 'HealthCare Distributors',
    items: [{ medicineName: 'Paracetamol 500mg' }], createdAtUtc: '2026-10-17T08:00:00.000Z', status: 'PENDING',
  }]))
  await page.route('**/catalogue-inventory-api/api/inventory/items/low-stock**', (route) => json(route, {
    items: [{ medicineId: 'medicine-1', name: 'Paracetamol 500mg', quantityOnHand: 3, reorderThreshold: 10 }],
    totalCount: 1,
  }))

  await page.goto('/purchase-orders')

  await expect(page.getByRole('heading', { name: 'Purchase order' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reorder suggestions' })).toBeVisible()
  await expect(page.getByText('PO-1001')).toBeVisible()

  await page.getByRole('button', { name: 'Create purchase order' }).last().click()
  await expect(page).toHaveURL(/\/purchase-orders\/new\?medicineId=medicine-1&quantity=7/)
})
