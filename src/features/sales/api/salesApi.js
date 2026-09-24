import { authenticatedServiceRequest } from '../../../services/authApi'
const base = import.meta.env.VITE_SALES_API_URL || '/sales-api'
export const createSale = ({ idempotencyKey, items }) => authenticatedServiceRequest(base, '/api/sales', { method: 'POST', body: JSON.stringify({ idempotencyKey, items }) })
export const getSaleReceipt = (saleId) => authenticatedServiceRequest(base, `/api/sales/${encodeURIComponent(saleId)}/receipt`)