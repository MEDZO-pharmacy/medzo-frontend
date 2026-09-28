import { authenticatedServiceRequest } from '../../../services/authApi'

const base =
  import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL ||
  '/catalogue-inventory-api'

export const getRemovalCandidates = ({ withinDays = 30, page = 1, pageSize = 50 } = {}) =>
  authenticatedServiceRequest(base, `/api/batch-removals/candidates?withinDays=${withinDays}&page=${page}&pageSize=${pageSize}`)
    .then((data) => ({
      ...data,
      items: (data.items || []).map((item) => ({ ...item, id: item.batchId, medicineName: item.productId })),
    }))

export const removeBatch = (batchId, data) =>
  authenticatedServiceRequest(base, `/api/batch-removals/${batchId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })