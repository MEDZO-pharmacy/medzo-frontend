import { expect, test as base } from '@playwright/test'

// A green UI test must never depend on an accidentally running local API.
// Test-specific routes registered later take precedence over this guard.
export const test = base.extend({
  page: async ({ page }, runFixture) => {
    const unmocked = []
    await page.route(/^https?:\/\/[^/]+\/(?:api|catalogue-inventory-api\/api|purchasing-supplier-api\/api|sales-api\/api)\//, async (route) => {
      const request = route.request()
      unmocked.push(`${request.method()} ${new URL(request.url()).pathname}`)
      await json(route, { title: 'Unexpected API request in UI test' }, 503)
    })
    await runFixture(page)
    expect(unmocked, 'Every service request must have an explicit test mock').toEqual([])
  },
})

export const mockSession = async (page, role) => {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'e2e-test-token',
        expiresAt,
        user: { id: `e2e-${role}`, username: `e2e.${role}`, roles: [role] },
      }),
    })
  })
}

export const mockUnauthenticatedSession = async (page) => {
  await page.route('**/api/auth/refresh', async (route) => {
    await json(route, { message: 'No active session.' }, 401)
  })
}

export const mockInventoryManagerSession = (page) => mockSession(page, 'InventoryManager')
export const mockPharmacistSession = (page) => mockSession(page, 'Pharmacist')

export const json = (route, body, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})
