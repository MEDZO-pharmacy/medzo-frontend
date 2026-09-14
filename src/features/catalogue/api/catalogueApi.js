import { authenticatedServiceRequest, publicServiceRequest } from '../../../services/authApi'
const base = import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL || '/catalogue-inventory-api'
export const searchMedicines = ({ search = '', page = 1, pageSize = 20 } = {}) => authenticatedServiceRequest(base, `/api/catalogue/medicines?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`)
export const browseAvailableMedicines = ({ search = '', page = 1, pageSize = 12 } = {}) => publicServiceRequest(base, `/api/catalogue/medicines/public?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`)
export const getMedicine = (id) => authenticatedServiceRequest(base, `/api/catalogue/medicines/${id}`)
export const createMedicine = (data) => authenticatedServiceRequest(base, '/api/catalogue/medicines', { method: 'POST', body: JSON.stringify(data) })
export const updateMedicine = (id, data, version) => authenticatedServiceRequest(base, `/api/catalogue/medicines/${id}`, { method: 'PUT', headers: { 'If-Match': String(version) }, body: JSON.stringify(data) })
export const deleteMedicine = (id, version) => authenticatedServiceRequest(base, `/api/catalogue/medicines/${id}`, { method: 'DELETE', headers: { 'If-Match': String(version) } })
