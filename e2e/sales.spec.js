import { expect, test } from '@playwright/test'
import { json, mockPharmacistSession } from './helpers'

test('pharmacist sale journey adds a medicine, sends a sale request, and displays the receipt', async ({ page }) => {
  await mockPharmacistSession(page)
  let salePayload

  await page.route('**/catalogue-inventory-api/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))
  await page.route('**/catalogue-inventory-api/api/inventory/sales', async (route) => {
    salePayload = route.request().postDataJSON()
    await json(route, {
      saleId: 'sale-1', alreadyProcessed: false, completedAtUtc: '2026-10-17T08:00:00.000Z',
      items: [{ medicineId: 'medicine-1', quantity: 2, batchAllocations: [{ batchId: 'batch-1', batchNumber: 'LOT-2026', quantity: 2 }] }],
    })
  })

  await page.goto('/sales')
  await expect(page.getByRole('heading', { name: 'Complete sale' })).toBeVisible()

  await page.getByLabel('Medicine').selectOption('medicine-1')
  await page.getByLabel('Quantity').fill('2')
  await page.getByRole('button', { name: 'Add item' }).click()
  await expect(page.getByText('Paracetamol 500mg × 2')).toBeVisible()

  await page.getByRole('button', { name: 'Complete sale' }).click()
  await expect.poll(() => salePayload?.items).toEqual([{ medicineId: 'medicine-1', quantity: 2 }])
  await expect(page.getByRole('heading', { name: 'Sale completed' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Receipt' })).toContainText('LOT-2026 (2)')
})
