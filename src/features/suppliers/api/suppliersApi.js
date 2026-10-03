import { authenticatedServiceRequest } from '../../../services/authApi'

const base = import.meta.env.VITE_PURCHASING_SUPPLIER_API_URL || '/purchasing-supplier-api'

export const createSupplier = (supplier) => authenticatedServiceRequest(base, '/api/suppliers', {
  method: 'POST', body: JSON.stringify(supplier),
})
export const listSuppliers = ({ activeOnly = false } = {}) => authenticatedServiceRequest(base, `/api/suppliers?activeOnly=${activeOnly}`)
export const getSupplier = (id) => authenticatedServiceRequest(base, `/api/suppliers/${id}`)
export const updateSupplier = (id, supplier) => authenticatedServiceRequest(base, `/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(supplier) })
export const deactivateSupplier = (id) => authenticatedServiceRequest(base, `/api/suppliers/${id}/deactivate`, { method: 'PATCH' })
