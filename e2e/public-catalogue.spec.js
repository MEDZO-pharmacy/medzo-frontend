import { expect } from '@playwright/test'
import { json, mockUnauthenticatedSession, test } from './helpers'

const medicines = [
  {
    id: 'medicine-1',
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    manufacturer: 'Medzo Labs',
    dosageForm: 'Tablet',
    categoryName: 'Pain relief',
    unitPrice: 25,
    lowStock: false,
  },
  {
    id: 'medicine-2',
    name: 'Ibuprofen 200mg',
    genericName: 'Ibuprofen',
    manufacturer: 'Medzo Labs',
    dosageForm: 'Tablet',
    categoryName: 'Pain relief',
    unitPrice: 30,
    lowStock: true,
  },
]

const mockPublicCatalogue = async (page) => {
  await page.route('**/api/catalogue/medicines/public**', async (route) => {
    const search = new URL(route.request().url()).searchParams.get('search')?.toLowerCase() || ''
    const items = medicines.filter((medicine) => medicine.name.toLowerCase().includes(search))

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items, page: 1, pageSize: 12, totalCount: items.length }),
    })
  })
}

test('visitor searches the public catalogue and clears a no-results search', async ({ page }) => {
  await mockUnauthenticatedSession(page)
  await mockPublicCatalogue(page)
  await page.goto('/products')

  await expect(page.getByRole('heading', { name: 'Available medicines' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Paracetamol 500mg' })).toBeVisible()

  const search = page.getByLabel('Search available medicines')
  await search.fill('ibuprofen')
  await page.getByRole('button', { name: 'Search catalogue' }).click()

  await expect(page.getByRole('heading', { name: 'Ibuprofen 200mg' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Paracetamol 500mg' })).toBeHidden()

  await search.fill('not-a-real-medicine')
  await page.getByRole('button', { name: 'Search catalogue' }).click()
  await expect(page.getByRole('heading', { name: 'No available medicines found' })).toBeVisible()

  await page.getByRole('button', { name: 'Show all available medicines' }).click()
  await expect(page.getByRole('heading', { name: 'Paracetamol 500mg' })).toBeVisible()
})

test('public catalogue reports a service outage and recovers on retry', async ({ page }) => {
  await mockUnauthenticatedSession(page)
  let requests = 0
  let recovered = false
  await page.route('**/api/catalogue/medicines/public**', (route) => {
    requests += 1
    return recovered
      ? json(route, { items: medicines, page: 1, pageSize: 12, totalCount: medicines.length })
      : json(route, { title: 'Catalogue is temporarily unavailable.' }, 503)
  })

  await page.goto('/products')
  await expect(page.getByRole('alert')).toContainText('Catalogue is temporarily unavailable.')
  recovered = true
  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByRole('heading', { name: 'Paracetamol 500mg' })).toBeVisible()
  expect(requests).toBeGreaterThanOrEqual(2)
})
