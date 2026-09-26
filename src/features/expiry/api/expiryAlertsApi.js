import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_SALES_API_URL || '/sales-api'
export const getNearExpiryAlerts = ({ withinDays = 30, page = 1, pageSize = 20 } = {}) => authenticatedServiceRequest(base, `/api/expiry-alerts?withinDays=${withinDays}&page=${page}&pageSize=${pageSize}`)