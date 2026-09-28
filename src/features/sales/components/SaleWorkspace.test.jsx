import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SaleWorkspace from './SaleWorkspace'
import { completeSale } from '../api/salesApi'
import { getInventory } from '../../inventory/api/inventoryApi'

vi.mock('../api/salesApi', () => ({ completeSale: vi.fn() }))
vi.mock('../../inventory/api/inventoryApi', () => ({ getInventory: vi.fn() }))

const medicines = [{ id: 'medicine-1', name: 'Paracetamol', unitPrice: 25 }]
const inventory = [{ medicineId: 'medicine-1', name: 'Paracetamol', quantityOnHand: 5, unitPrice: 25 }]

describe('SaleWorkspace expired stock handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('crypto', { randomUUID: () => 'sale-id' })
    getInventory.mockResolvedValue({ items: inventory })
  })

  it('keeps the sale item and gives a clear warning when the API rejects expired stock', async () => {
    completeSale.mockRejectedValue({
      status: 400,
      message: "No sellable stock for product 'medicine-1' because the remaining batch is expired.",
    })
    const user = userEvent.setup()
    render(<SaleWorkspace medicines={medicines} inventory={inventory} />)

    await user.click(screen.getByRole('combobox', { name: /medicine/i }))
    await user.click(screen.getByRole('option', { name: /Paracetamol/ }))
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    await user.click(screen.getByRole('button', { name: 'Complete sale' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Expired stock cannot be dispensed')
    expect(screen.getByRole('alert')).toHaveTextContent('remaining batch is expired')
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(completeSale).toHaveBeenCalledTimes(1)
  })
})
