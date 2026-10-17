export const mockInventoryManagerSession = async (page) => {
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'e2e-test-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: { id: 'e2e-manager', username: 'e2e.manager', roles: ['InventoryManager'] },
      }),
    })
  })
}

export const mockPharmacistSession = async (page) => {
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'e2e-test-token',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: { id: 'e2e-pharmacist', username: 'e2e.pharmacist', roles: ['Pharmacist'] },
      }),
    })
  })
}

export const json = (route, body, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})
