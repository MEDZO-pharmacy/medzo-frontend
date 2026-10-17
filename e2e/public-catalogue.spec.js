import { expect, test } from '@playwright/test'

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
