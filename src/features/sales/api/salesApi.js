import { authenticatedServiceRequest } from '../../../services/authApi'

const inventoryBase = import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL || '/catalogue-inventory-api'

export const completeSale = (sale) => authenticatedServiceRequest(inventoryBase, '/api/inventory/sales', {
  method: 'POST',
  body: JSON.stringify(sale),
})

export const searchSaleItems = ({ search = '', page = 1, pageSize = 100 } = {}) => authenticatedServiceRequest(
  inventoryBase,
  `/api/catalogue/medicines?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`,
)

export const createSale = async ({ idempotencyKey, items }) => {
  const receipt = await completeSale({
    saleId: idempotencyKey,
    saleReference: `SALE-${idempotencyKey.slice(0, 8)}`,
    items: items.map(({ productId, quantity }) => ({ medicineId: productId, quantity })),
  })
  const mappedItems = receipt.items.map(item => ({
    ...item,
    productId: item.medicineId,
  }))
  return {
    saleId: receipt.saleId,
    alreadyProcessed: receipt.alreadyProcessed,
    items: mappedItems,
    receipt: { ...receipt, items: mappedItems },
  }
}
