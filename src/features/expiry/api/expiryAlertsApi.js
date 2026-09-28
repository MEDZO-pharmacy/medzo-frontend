import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL || '/catalogue-inventory-api'

export const getNearExpiryAlerts = ({ withinDays = 30, page = 1, pageSize = 20 } = {}) =>
  authenticatedServiceRequest(base, `/api/inventory/batches/near-expiry?withinDays=${withinDays}&page=${page}&pageSize=${pageSize}`)