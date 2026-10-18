import { expect } from '@playwright/test'
import { json, mockPharmacistSession, test } from './helpers'

test('pharmacist sale journey adds a medicine, sends a sale request, and displays the receipt', async ({ page }) => {
  await mockPharmacistSession(page)
  let salePayload

  await page.route('**/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))
  await page.route('**/api/inventory/sales', async (route) => {
    salePayload = route.request().postDataJSON()
    await json(route, {
      saleId: 'sale-1', alreadyProcessed: false, completedAtUtc: '2026-10-17T08:00:00.000Z',
      items: [{ medicineId: 'medicine-1', quantity: 2, batchAllocations: [{ batchId: 'batch-1', batchNumber: 'LOT-2026', quantity: 2 }] }],
    })
  })

  await page.goto('/sales')
  await expect(page.getByRole('heading', { name: 'Complete sale' })).toBeVisible()

  await page.getByLabel('Medicine', { exact: true }).selectOption('medicine-1')
  await page.getByLabel('Quantity').fill('2')
  await page.getByRole('button', { name: 'Add item' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: /Paracetamol 500mg.*2/ })).toBeVisible()

  await page.getByRole('button', { name: 'Complete sale' }).click()
  await expect.poll(() => salePayload?.items).toEqual([{ medicineId: 'medicine-1', quantity: 2 }])
  await expect(page.getByRole('heading', { name: 'Sale completed' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Receipt' })).toContainText('LOT-2026 (2)')
})

test('failed sale leaves the cart intact for a safe retry', async ({ page }) => {
  await mockPharmacistSession(page)
  let saleAttempts = 0
  await page.route('**/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))
  await page.route('**/api/inventory/sales', (route) => {
    saleAttempts += 1
    return json(route, { title: 'Insufficient sellable stock.' }, 409)
  })

  await page.goto('/sales')
  await page.getByLabel('Medicine', { exact: true }).selectOption('medicine-1')
  await page.getByLabel('Quantity').fill('2')
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByRole('button', { name: 'Complete sale' }).click()

  await expect(page.getByRole('alert')).toContainText('Insufficient sellable stock.')
  await expect(page.getByRole('listitem').filter({ hasText: /Paracetamol 500mg.*2/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Complete sale' })).toBeEnabled()
  expect(saleAttempts).toBe(1)
})

test('invalid sale quantity cannot be added or submitted', async ({ page }) => {
  await mockPharmacistSession(page)
  let saleAttempts = 0
  await page.route('**/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))
  await page.route('**/api/inventory/sales', (route) => {
    saleAttempts += 1
    return json(route, { title: 'Unexpected sale request.' }, 500)
  })

  await page.goto('/sales')
  await page.getByLabel('Medicine', { exact: true }).selectOption('medicine-1')
  await page.getByLabel('Quantity').fill('0')
  await page.getByRole('button', { name: 'Add item' }).click()

  await expect(page.getByText('No medicines added yet.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Complete sale' })).toBeDisabled()
  expect(saleAttempts).toBe(0)
})

test('duplicate medicine is rejected without adding a second sale line', async ({ page }) => {
  await mockPharmacistSession(page)
  await page.route('**/api/catalogue/medicines**', (route) => json(route, {
    items: [{ id: 'medicine-1', name: 'Paracetamol 500mg' }], totalCount: 1,
  }))

  await page.goto('/sales')
  await page.getByLabel('Medicine', { exact: true }).selectOption('medicine-1')
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByLabel('Medicine', { exact: true }).selectOption('medicine-1')
  await page.getByRole('button', { name: 'Add item' }).click()

  await expect(page.getByRole('alert')).toContainText('This medicine is already in the sale.')
  await expect(page.getByRole('listitem').filter({ hasText: 'Paracetamol 500mg' })).toHaveCount(1)
})
