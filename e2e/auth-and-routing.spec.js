import { expect, test } from '@playwright/test'

const mockUnauthenticatedSession = async (page) => {
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'No active session.' }),
    })
  })
}

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
