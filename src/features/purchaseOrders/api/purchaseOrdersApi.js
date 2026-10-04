import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_PURCHASING_SUPPLIER_API_URL || '/purchasing-supplier-api'

export const createPurchaseOrder = (order) => authenticatedServiceRequest(base, '/api/purchase-orders', {
  method: 'POST', body: JSON.stringify(order),
})
