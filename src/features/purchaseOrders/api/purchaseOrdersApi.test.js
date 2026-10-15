import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticatedServiceRequest } from '../../../services/authApi'
import { createPurchaseOrder, getPurchaseOrder, listPurchaseOrders, receivePurchaseOrder } from './purchaseOrdersApi'

vi.mock('../../../services/authApi', () => ({ authenticatedServiceRequest: vi.fn() }))

describe('purchase orders API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends a new purchase order through the authenticated purchasing service', async () => {
    authenticatedServiceRequest.mockResolvedValue({ id: 'order-1' })
    const order = { supplierId: 'supplier-1', items: [{ medicineId: 'medicine-1', quantity: 10 }] }

    await createPurchaseOrder(order)

    expect(authenticatedServiceRequest).toHaveBeenCalledWith(
      '/purchasing-supplier-api',
      '/api/purchase-orders',
      { method: 'POST', body: JSON.stringify(order) },
    )
  })

  it.each([
    ['list', () => listPurchaseOrders(), '/api/purchase-orders'],
    ['get', () => getPurchaseOrder('order-1'), '/api/purchase-orders/order-1'],
  ])('uses the expected route when it %s purchase orders', async (_, request, route) => {
    authenticatedServiceRequest.mockResolvedValue({})

    await request()

    expect(authenticatedServiceRequest).toHaveBeenCalledWith('/purchasing-supplier-api', route)
  })

  it('sends receipt details to the receive endpoint', async () => {
    authenticatedServiceRequest.mockResolvedValue({ id: 'order-1', status: 'RECEIVED' })
    const receipt = { items: [{ purchaseOrderItemId: 'line-1', batchNumber: 'LOT-1' }] }

    await receivePurchaseOrder('order-1', receipt)

    expect(authenticatedServiceRequest).toHaveBeenCalledWith(
      '/purchasing-supplier-api',
      '/api/purchase-orders/order-1/receive',
      { method: 'PATCH', body: JSON.stringify(receipt) },
    )
  })
})
