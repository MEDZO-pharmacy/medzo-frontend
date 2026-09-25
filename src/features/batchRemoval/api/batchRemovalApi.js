import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_SALES_API_URL || '/sales-api'

export const getRemovalCandidates = ({ withinDays = 30, page = 1, pageSize = 50 } = {}) =>
  authenticatedServiceRequest(base, `/api/batch-removals/candidates?withinDays=${withinDays}&page=${page}&pageSize=${pageSize}`)

export const removeBatch = (batchId, data) =>
  authenticatedServiceRequest(base, `/api/batch-removals/${batchId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })