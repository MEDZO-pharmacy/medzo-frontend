import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL || '/catalogue-inventory-api'

export const completeSale = (sale) => authenticatedServiceRequest(base, '/api/inventory/sales', {
  method: 'POST',
  body: JSON.stringify(sale),
})
