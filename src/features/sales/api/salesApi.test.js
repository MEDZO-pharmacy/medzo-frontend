import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticatedServiceRequest } from '../../../services/authApi'
import { completeSale, createSale, searchSaleItems } from './salesApi'

vi.mock('../../../services/authApi', () => ({ authenticatedServiceRequest: vi.fn() }))

describe('sales API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('searches medicines in the same Catalogue used to deduct stock', async () => {
    authenticatedServiceRequest.mockResolvedValue({ items: [] })

    await searchSaleItems({ search: 'Para', page: 2, pageSize: 50 })

    expect(authenticatedServiceRequest).toHaveBeenCalledWith(
      expect.any(String),
      '/api/catalogue/medicines?search=Para&page=2&pageSize=50',
    )
  })

  it('completes stock deduction through the Catalogue inventory endpoint', async () => {
    authenticatedServiceRequest.mockResolvedValue({ saleId: 'sale-id', items: [] })

    await completeSale({ saleId: 'sale-id', saleReference: 'SALE-1', items: [] })

    expect(authenticatedServiceRequest).toHaveBeenCalledWith(
      expect.any(String),
      '/api/inventory/sales',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('routes the sales page through the same stock source and adapts its receipt', async () => {
    authenticatedServiceRequest.mockResolvedValue({
      saleId: 'sale-id',
      alreadyProcessed: false,
      items: [{ medicineId: 'medicine-1', medicineName: 'Amoxicillin', quantity: 2, batchAllocations: [] }],
    })

    const result = await createSale({ idempotencyKey: 'sale-id', items: [{ productId: 'medicine-1', quantity: 2 }] })

    const requestBody = JSON.parse(authenticatedServiceRequest.mock.calls[0][2].body)
    expect(authenticatedServiceRequest.mock.calls[0][1]).toBe('/api/inventory/sales')
    expect(requestBody.items).toEqual([{ medicineId: 'medicine-1', quantity: 2 }])
    expect(result.receipt.items[0].productId).toBe('medicine-1')
  })
})
