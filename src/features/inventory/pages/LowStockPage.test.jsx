import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LowStockPage from './LowStockPage'
import { getLowStock } from '../api/inventoryApi'

vi.mock('../api/inventoryApi', () => ({ getLowStock: vi.fn() }))

const lowMedicine = {
  medicineId: 'medicine-1', name: 'Amoxicillin', genericName: 'Amoxicillin',
  quantityOnHand: 3, reorderThreshold: 10, isLowStock: true, nextExpiry: '2027-06-01', version: 2,
}

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('LowStockPage', () => {
  it('shows automatically flagged medicines and their shortfall', async () => {
    getLowStock.mockResolvedValue({ items: [lowMedicine], page: 1, pageSize: 20, totalCount: 1 })
    render(<MemoryRouter><LowStockPage /></MemoryRouter>)

    expect(await screen.findAllByText('Amoxicillin')).not.toHaveLength(0)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getAllByText('Low stock')).not.toHaveLength(0)
    expect(getLowStock).toHaveBeenCalledWith({ search: '', page: 1, pageSize: 20 })
  })

  it('searches and restores the unfiltered low-stock list when cleared', async () => {
    getLowStock
      .mockResolvedValueOnce({ items: [lowMedicine], page: 1, pageSize: 20, totalCount: 1 })
      .mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, totalCount: 0 })
      .mockResolvedValueOnce({ items: [lowMedicine], page: 1, pageSize: 20, totalCount: 1 })
    render(<MemoryRouter><LowStockPage /></MemoryRouter>)

    await screen.findAllByText('Amoxicillin')
    await userEvent.type(screen.getByLabelText('Search low-stock medicines'), 'missing')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByText(/No low-stock medicines match/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => expect(getLowStock).toHaveBeenLastCalledWith({ search: '', page: 1, pageSize: 20 }))
    expect(await screen.findAllByText('Amoxicillin')).not.toHaveLength(0)
  })

  it('shows a retry action when loading fails', async () => {
    getLowStock.mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, totalCount: 0 })
    render(<MemoryRouter><LowStockPage /></MemoryRouter>)

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(/All medicines are at or above/)).toBeInTheDocument()
  })
})
