import { expect } from '@playwright/test'
import { json, mockInventoryManagerSession, test } from './helpers'

test('inventory manager turns a low-stock suggestion into a purchase order', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let createdOrder

  await page.route('**/purchasing-supplier-api/api/purchase-orders', (route) => {
    if (route.request().method() === 'POST') {
      createdOrder = route.request().postDataJSON()
      return json(route, { id: 'po-2', orderNumber: 'PO-1002', status: 'PENDING' }, 201)
    }
    return json(route, [{
      id: 'po-1', orderNumber: 'PO-1001', supplierName: 'HealthCare Distributors',
      items: [{ medicineName: 'Paracetamol 500mg' }], createdAtUtc: '2026-10-17T08:00:00.000Z', status: 'PENDING',
    }])
  })
  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=true', (route) => json(route, [{
    id: 'supplier-1', name: 'HealthCare Distributors', isActive: true,
  }]))
  await page.route('**/catalogue-inventory-api/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))
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
  await expect(page.getByLabel('Medicine')).toHaveValue('medicine-1')
  await expect(page.getByLabel('Quantity')).toHaveValue('7')
  await page.getByLabel('Supplier').selectOption('supplier-1')
  await page.getByRole('button', { name: 'Create purchase order' }).click()

  await expect.poll(() => createdOrder).toEqual({
    supplierId: 'supplier-1',
    items: [{ medicineId: 'medicine-1', medicineName: 'Paracetamol 500mg', quantity: 7 }],
  })
  await expect(page).toHaveURL(/\/purchase-orders$/)
  await expect(page.getByRole('status')).toContainText('PO-1002 was created successfully')
})

test('purchase-order API failure keeps the entered order available for retry', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let attempts = 0
  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=true', (route) => json(route, [
    { id: 'supplier-1', name: 'HealthCare Distributors', isActive: true },
  ]))
  await page.route('**/catalogue-inventory-api/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))
  await page.route('**/purchasing-supplier-api/api/purchase-orders', (route) => {
    attempts += 1
    return json(route, { title: 'Purchase order service is unavailable.' }, 503)
  })

  await page.goto('/purchase-orders/new')
  await page.getByLabel('Supplier').selectOption('supplier-1')
  await page.getByLabel('Medicine').selectOption('medicine-1')
  await page.getByLabel('Quantity').fill('7')
  await page.getByRole('button', { name: 'Create purchase order' }).click()

  await expect(page.getByRole('alert')).toContainText('Purchase order service is unavailable.')
  await expect(page).toHaveURL(/\/purchase-orders\/new$/)
  await expect(page.getByLabel('Supplier')).toHaveValue('supplier-1')
  await expect(page.getByLabel('Quantity')).toHaveValue('7')
  expect(attempts).toBe(1)
})

test('manager receives a purchase order with batch and expiry details', async ({ page }) => {
  await mockInventoryManagerSession(page)
  const pendingOrder = {
    id: 'po-1', orderNumber: 'PO-1001', supplierName: 'HealthCare Distributors',
    createdAtUtc: '2026-10-17T08:00:00.000Z', status: 'PENDING',
    items: [{ id: 'item-1', medicineName: 'Paracetamol 500mg', quantity: 7 }],
  }
  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let receipt
  await page.route('**/purchasing-supplier-api/api/purchase-orders/po-1', (route) => json(route, pendingOrder))
  await page.route('**/purchasing-supplier-api/api/purchase-orders/po-1/receive', (route) => {
    receipt = route.request().postDataJSON()
    return json(route, { ...pendingOrder, status: 'RECEIVED', receivedAtUtc: new Date().toISOString() })
  })

  await page.goto('/purchase-orders/po-1')
  await expect(page.getByRole('heading', { name: 'Receive purchase order' })).toBeVisible()
  await page.getByLabel('Batch number').fill('LOT-2026')
  await page.getByLabel('Expiry date').fill(expiryDate)
  await page.getByRole('button', { name: 'Mark as received' }).click()

  await expect.poll(() => receipt).toEqual({ items: [
    { purchaseOrderItemId: 'item-1', batchNumber: 'LOT-2026', expiryDate },
  ] })
  await expect(page.getByText(/Stock update has been sent to Inventory/)).toBeVisible()
})
