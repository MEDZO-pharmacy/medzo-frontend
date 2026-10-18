import { expect } from '@playwright/test'
import { json, mockInventoryManagerSession, test } from './helpers'

const supplier = {
  name: 'HealthCare Distributors',
  contactName: 'Nimal Perera',
  email: 'nimal@example.com',
  phone: '0771234567',
  address: 'Colombo',
}

const fillSupplierForm = async (page) => {
  await page.getByLabel('Supplier name').fill(supplier.name)
  await page.getByLabel('Contact person').fill(supplier.contactName)
  await page.getByLabel('Email address').fill(supplier.email)
  await page.getByLabel('Phone number').fill(supplier.phone)
  await page.getByLabel('Business address').fill(supplier.address)
}

test('inventory manager deactivates an active supplier through the supplier workflow', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let deactivationRequested = false

  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=false', async (route) => {
    return json(route, [{
      id: 'supplier-1', name: 'HealthCare Distributors', contactName: 'Nimal Perera', phone: '0771234567', isActive: true,
    }])
  })
  await page.route('**/purchasing-supplier-api/api/suppliers/supplier-1/deactivate', async (route) => {
    deactivationRequested = true
    return json(route, {})
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

test('failed supplier deactivation reports the API error and keeps the supplier active', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let attempts = 0
  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=false', (route) => json(route, [{
    id: 'supplier-1', name: 'HealthCare Distributors', contactName: 'Nimal Perera', phone: '0771234567', isActive: true,
  }]))
  await page.route('**/purchasing-supplier-api/api/suppliers/supplier-1/deactivate', (route) => {
    attempts += 1
    return json(route, { title: 'Supplier has pending orders.' }, 409)
  })

  await page.goto('/suppliers')
  await expect(page.getByText('HealthCare Distributors')).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Deactivate' }).click()

  await expect(page.getByRole('alert')).toContainText('Supplier has pending orders.')
  await expect(page.getByText('Active', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Deactivate' })).toBeVisible()
  expect(attempts).toBe(1)
})

test('manager creates a supplier and sees confirmation in the supplier list', async ({ page }) => {
  await mockInventoryManagerSession(page)
  let submitted
  await page.route('**/purchasing-supplier-api/api/suppliers', (route) => {
    submitted = route.request().postDataJSON()
    return json(route, { id: 'supplier-2', ...supplier }, 201)
  })
  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=false', (route) => json(route, [
    { id: 'supplier-2', ...supplier, isActive: true },
  ]))

  await page.goto('/suppliers/new')
  await fillSupplierForm(page)
  await page.getByRole('button', { name: 'Save supplier' }).click()

  await expect.poll(() => submitted).toEqual({ ...supplier, allowDuplicate: false })
  await expect(page).toHaveURL(/\/suppliers$/)
  await expect(page.getByRole('status')).toContainText('HealthCare Distributors added successfully.')
})

test('potential duplicate supplier requires an explicit second confirmation', async ({ page }) => {
  await mockInventoryManagerSession(page)
  const requests = []
  await page.route('**/purchasing-supplier-api/api/suppliers', (route) => {
    requests.push(route.request().postDataJSON())
    return requests.length === 1
      ? json(route, { title: 'Potential duplicate supplier.' }, 409)
      : json(route, { id: 'supplier-2', ...supplier }, 201)
  })
  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=false', (route) => json(route, [
    { id: 'supplier-2', ...supplier, isActive: true },
  ]))

  await page.goto('/suppliers/new')
  await fillSupplierForm(page)
  await page.getByRole('button', { name: 'Save supplier' }).click()

  await expect(page.getByRole('heading', { name: 'Potential duplicate supplier' })).toBeVisible()
  expect(requests).toEqual([{ ...supplier, allowDuplicate: false }])
  await page.getByRole('button', { name: 'Save duplicate anyway' }).click()

  await expect.poll(() => requests).toEqual([
    { ...supplier, allowDuplicate: false },
    { ...supplier, allowDuplicate: true },
  ])
  await expect(page.getByRole('status')).toContainText('HealthCare Distributors added successfully.')
})
