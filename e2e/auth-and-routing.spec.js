import { expect } from '@playwright/test'
import { json, mockPharmacistSession, mockUnauthenticatedSession, test } from './helpers'

test('unauthenticated visitor is redirected from a protected catalogue route', async ({ page }) => {
  await mockUnauthenticatedSession(page)

  await page.goto('/catalogue')

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
})

test('login form stops invalid credentials before calling the Auth service', async ({ page }) => {
  await mockUnauthenticatedSession(page)
  let loginRequests = 0
  await page.route('**/api/auth/login', async (route) => {
    loginRequests += 1
    await route.fulfill({ status: 500, body: 'Unexpected login request' })
  })
  await page.goto('/login')

  await page.getByRole('button', { name: 'Login to Account' }).click()

  await expect(page.getByText('Enter your Staff ID, username, or email.')).toBeVisible()
  await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible()
  expect(loginRequests).toBe(0)
})

test('successful login returns the manager to the originally requested page', async ({ page }) => {
  await mockUnauthenticatedSession(page)
  let submittedCredentials
  await page.route('**/api/auth/login', (route) => {
    submittedCredentials = route.request().postDataJSON()
    return json(route, {
      token: 'e2e-login-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user: { id: 'manager-1', username: 'inventory.manager', roles: ['InventoryManager'] },
    })
  })
  await page.route('**/purchasing-supplier-api/api/suppliers?activeOnly=false', (route) => json(route, []))

  await page.goto('/suppliers')
  await expect(page).toHaveURL(/\/login$/)
  await expect.poll(() => page.evaluate(() => history.state?.usr?.from?.pathname)).toBe('/suppliers')
  await page.getByRole('textbox', { name: 'Staff ID, Username, or Email' }).fill('inventory.manager')
  await page.getByLabel('Password', { exact: true }).fill('valid-password')
  await page.getByRole('button', { name: 'Login to Account' }).click()

  await expect.poll(() => submittedCredentials).toEqual({ identifier: 'inventory.manager', password: 'valid-password' })
  await expect(page).toHaveURL(/\/suppliers$/)
  await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible()
})

test('rejected login displays the Auth error and keeps the visitor signed out', async ({ page }) => {
  await mockUnauthenticatedSession(page)
  let attempts = 0
  await page.route('**/api/auth/login', (route) => {
    attempts += 1
    return json(route, { message: 'Invalid credentials.' }, 401)
  })

  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Staff ID, Username, or Email' }).fill('inventory.manager')
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Login to Account' }).click()

  await expect(page.getByRole('alert')).toContainText('Invalid credentials.')
  await expect(page).toHaveURL(/\/login$/)
  expect(attempts).toBe(1)
})

test('pharmacist cannot open inventory-manager supplier management', async ({ page }) => {
  await mockPharmacistSession(page)
  await page.route('**/catalogue-inventory-api/api/catalogue/medicines**', (route) => json(route, { items: [], totalCount: 0 }))
  await page.route('**/catalogue-inventory-api/api/inventory/items?**', (route) => json(route, { items: [], totalCount: 0 }))

  await page.goto('/suppliers')

  await expect(page).toHaveURL(/\/pharmacist$/)
  await expect(page.getByRole('heading', { name: 'Pharmacist overview' })).toBeVisible()
})
