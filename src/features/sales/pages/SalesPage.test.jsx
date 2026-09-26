import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SalesPage from './SalesPage'
import { createSale, searchSaleItems } from '../api/salesApi'

vi.mock('../api/salesApi', () => ({ createSale: vi.fn(), searchSaleItems: vi.fn() }))

const allMedicines = [{ id: 'medicine-1', name: 'Paracetamol 500mg' }, { id: 'medicine-2', name: 'Paracetamol Syrup' }, { id: 'medicine-3', name: 'Amoxicillin' }]
const renderPage = () => render(<MemoryRouter><SalesPage /></MemoryRouter>)

describe('SalesPage', () => {
 afterEach(() => cleanup())
 beforeEach(() => {
  vi.clearAllMocks()
  searchSaleItems.mockImplementation(({ search = '' } = {}) => Promise.resolve({ items: allMedicines.filter(medicine => medicine.name.toLowerCase().includes(search.toLowerCase())) }))
  createSale.mockResolvedValue({ saleId: 'sale-1', alreadyProcessed: false, items: [{ productId: 'medicine-1', quantity: 2, batchAllocations: [{ batchId: 'batch-1', batchNumber: 'LOT-1', quantity: 2 }] }] })
 })
 it('searches partial medicine names and lets the pharmacist add a result to the sale', async () => { const user = userEvent.setup(); renderPage(); await screen.findByRole('option', { name: 'Amoxicillin' }); await user.type(screen.getByRole('searchbox', { name: 'Search medicine catalogue' }), 'Para'); await user.click(screen.getByRole('button', { name: 'Search' })); expect(searchSaleItems).toHaveBeenLastCalledWith({ search: 'Para', pageSize: 100 }); await screen.findByRole('option', { name: 'Paracetamol 500mg' }); expect(screen.queryByRole('option', { name: 'Amoxicillin' })).not.toBeInTheDocument(); await user.selectOptions(screen.getByLabelText('Medicine'), 'medicine-1'); await user.click(screen.getByRole('button', { name: 'Add item' })); expect(screen.getByText('Paracetamol 500mg × 1')).toBeInTheDocument() })
 it('shows a clear no-results state', async () => { const user = userEvent.setup(); renderPage(); await screen.findByRole('option', { name: 'Amoxicillin' }); await user.type(screen.getByRole('searchbox', { name: 'Search medicine catalogue' }), 'XYZ123'); await user.click(screen.getByRole('button', { name: 'Search' })); expect(await screen.findByText('No items found')).toBeInTheDocument(); expect(screen.getByText(/No medicines match “XYZ123”/)).toBeInTheDocument() })
 it('clears the search and restores all medicines', async () => { const user = userEvent.setup(); renderPage(); await screen.findByRole('option', { name: 'Amoxicillin' }); await user.type(screen.getByRole('searchbox', { name: 'Search medicine catalogue' }), 'Para'); await user.click(screen.getByRole('button', { name: 'Search' })); await screen.findByRole('option', { name: 'Paracetamol Syrup' }); await user.click(screen.getByRole('button', { name: 'Clear' })); expect(searchSaleItems).toHaveBeenLastCalledWith({ search: '', pageSize: 100 }); expect(await screen.findByRole('option', { name: 'Amoxicillin' })).toBeInTheDocument() })
 it('uses the sales search API for case-insensitive catalogue matching', async () => { const user = userEvent.setup(); renderPage(); await screen.findByRole('option', { name: 'Amoxicillin' }); await user.type(screen.getByRole('searchbox', { name: 'Search medicine catalogue' }), 'PARACETAMOL'); await user.click(screen.getByRole('button', { name: 'Search' })); expect(searchSaleItems).toHaveBeenLastCalledWith({ search: 'PARACETAMOL', pageSize: 100 }); expect(await screen.findByRole('option', { name: 'Paracetamol 500mg' })).toBeInTheDocument() })
 it('submits product and quantity without choosing a batch', async () => { const user = userEvent.setup(); renderPage(); await user.selectOptions(await screen.findByLabelText('Medicine'), 'medicine-1'); await user.clear(screen.getByLabelText('Quantity')); await user.type(screen.getByLabelText('Quantity'), '2'); await user.click(screen.getByRole('button', { name: 'Add item' })); await user.click(screen.getByRole('button', { name: 'Complete sale' })); expect(createSale).toHaveBeenCalledWith(expect.objectContaining({ items: [{ productId: 'medicine-1', quantity: 2 }] })); expect(await screen.findByText('Sale completed')).toBeInTheDocument(); expect(screen.getByText(/Batch LOT-1/)).toBeInTheDocument() })
})
