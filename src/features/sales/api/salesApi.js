import { authenticatedServiceRequest } from '../../../services/authApi'

const inventoryBase = import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL || '/catalogue-inventory-api'
const salesBase = import.meta.env.VITE_SALES_API_URL || '/sales-api'

export const completeSale = (sale) => authenticatedServiceRequest(inventoryBase, '/api/inventory/sales', {
  method: 'POST',
  body: JSON.stringify(sale),
})

export const createSale = ({ idempotencyKey, items }) => authenticatedServiceRequest(salesBase, '/api/sales', {
  method: 'POST',
  body: JSON.stringify({ idempotencyKey, items }),
})

export const getSaleReceipt = (saleId) => authenticatedServiceRequest(salesBase, `/api/sales/${encodeURIComponent(saleId)}/receipt`)