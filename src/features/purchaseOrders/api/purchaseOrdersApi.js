import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_PURCHASING_SUPPLIER_API_URL || '/purchasing-supplier-api'

export const createPurchaseOrder = (order) => authenticatedServiceRequest(base, '/api/purchase-orders', {
  method: 'POST', body: JSON.stringify(order),
})
export const listPurchaseOrders = () => authenticatedServiceRequest(base, '/api/purchase-orders')
export const getPurchaseOrder = (id) => authenticatedServiceRequest(base, `/api/purchase-orders/${id}`)
export const receivePurchaseOrder = (id, receipt) => authenticatedServiceRequest(base, `/api/purchase-orders/${id}/receive`, {
  method: 'PATCH', body: JSON.stringify(receipt),
})
