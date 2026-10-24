import { expect } from '@playwright/test'
import { json, mockInventoryManagerSession, mockUnauthenticatedSession, test } from './helpers'

const medicine = {
  id: 'medicine-1',
  name: 'Paracetamol 500mg',
  genericName: 'Paracetamol',
  manufacturer: 'Medzo Labs',
  dosageForm: 'Tablet',
  unitPrice: 25,
  quantityOnHand: 8,
  isLowStock: true,
  version: 1,
}

const inventoryItem = {
  medicineId: medicine.id,
  name: medicine.name,
  genericName: medicine.genericName,
  quantityOnHand: 8,
  reorderThreshold: 10,
  nextExpiry: '2026-11-15',
  isLowStock: true,
}

const paged = (items) => ({ items, page: 1, pageSize: 20, totalCount: items.length })

test('unauthenticated visitor cannot open the protected catalogue workspace', async ({ page }) => {
  await mockUnauthenticatedSession(page)
  await page.goto('/catalogue')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome', exact: true })).toBeVisible()
})

test('inventory manager searches the protected medicine catalogue', async ({ page }) => {
  await mockInventoryManagerSession(page)
  await page.route('**/catalogue-inventory-api/api/catalogue/medicines?**', (route) => {
    const search = new URL(route.request().url()).searchParams.get('search')?.toLowerCase() || ''
    const items = medicine.name.toLowerCase().includes(search) ? [medicine] : []
    return json(route, paged(items))
  })

  await page.goto('/catalogue')
  await expect(page.getByRole('heading', { name: 'Medicine Catalogue' })).toBeVisible()
  await expect(page.getByRole('heading', { name: medicine.name })).toBeVisible()

  await page.getByLabel('Search medicine catalogue').fill('missing')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'No medicines found' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.getByRole('heading', { name: medicine.name })).toBeVisible()
})

test('inventory overview combines stock totals with the low-stock quality signal', async ({ page }) => {
  await mockInventoryManagerSession(page)
  await page.route('**/catalogue-inventory-api/api/inventory/items/low-stock?**', (route) => json(route, paged([inventoryItem])))
  await page.route('**/catalogue-inventory-api/api/inventory/items?**', (route) => json(route, paged([inventoryItem])))

  await page.goto('/inventory')

  await expect(page.getByRole('heading', { name: 'Inventory overview' })).toBeVisible()
  await expect(page.getByLabel('Inventory summary')).toContainText('Medicines1')
  await expect(page.getByLabel('Inventory summary')).toContainText('Units available8')
  await expect(page.getByLabel('Inventory summary')).toContainText('Low stock1')
  await expect(page.getByRole('region', { name: 'Inventory records' })).toContainText(medicine.name)
  await expect(page.getByRole('region', { name: 'Inventory records' })).toContainText('Low stock')
})

test('near-expiry view changes its alert window and renders returned batch evidence', async ({ page }) => {
  await mockInventoryManagerSession(page)
  const requestedWindows = []
  await page.route('**/catalogue-inventory-api/api/inventory/batches/near-expiry?**', (route) => {
    const withinDays = new URL(route.request().url()).searchParams.get('withinDays')
    requestedWindows.push(withinDays)
    const items = withinDays === '60'
      ? [{ id: 'batch-1', medicineId: medicine.id, medicineName: medicine.name, batchNumber: 'B-2026-10', expiryDate: '2026-12-01', daysUntilExpiry: 38, remainingQuantity: 6 }]
      : []
    return json(route, paged(items))
  })

  await page.goto('/inventory/near-expiry')
  await expect(page.getByRole('heading', { name: 'Near-expiry batches' })).toBeVisible()
  await expect(page.getByText('No active batches expire within 30 days.')).toBeVisible()

  await page.getByLabel('Alert window').selectOption('60')
  await expect(page.getByRole('region', { name: 'Near-expiry batches' })).toContainText('B-2026-10')
  await expect(page.getByRole('region', { name: 'Near-expiry batches' })).toContainText(medicine.name)
  expect(requestedWindows).toContain('30')
  expect(requestedWindows).toContain('60')
})

test('inventory service outage is visible and the retry restores the stock view', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let recovered = false
  await page.route('**/catalogue-inventory-api/api/inventory/items/low-stock?**', (route) => json(route, paged([inventoryItem])))
  await page.route('**/catalogue-inventory-api/api/inventory/items?**', (route) => recovered
    ? json(route, paged([inventoryItem]))
    : json(route, { title: 'Inventory is temporarily unavailable.' }, 503))

  await page.goto('/inventory')
  await expect(page.getByRole('alert')).toContainText('Inventory is temporarily unavailable.')

  recovered = true
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('region', { name: 'Inventory records' })).toContainText(medicine.name)
})
