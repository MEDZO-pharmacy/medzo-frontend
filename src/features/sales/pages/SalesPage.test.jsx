import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SalesPage from './SalesPage'
import { searchMedicines } from '../../catalogue/api/catalogueApi'
import { createSale } from '../api/salesApi'

vi.mock('../../catalogue/api/catalogueApi', () => ({ searchMedicines: vi.fn() }))
vi.mock('../api/salesApi', () => ({ createSale: vi.fn() }))

describe('SalesPage', () => {
 beforeEach(() => { searchMedicines.mockResolvedValue({ items: [{ id: 'medicine-1', name: 'Paracetamol' }] }); createSale.mockResolvedValue({ saleId: 'sale-1', alreadyProcessed: false, items: [{ productId: 'medicine-1', quantity: 2, batchAllocations: [{ batchId: 'batch-1', batchNumber: 'LOT-1', quantity: 2 }] }] }) })
 it('submits product and quantity without choosing a batch', async () => {
  const user = userEvent.setup(); render(<MemoryRouter><SalesPage /></MemoryRouter>);
  await user.selectOptions(await screen.findByLabelText('Medicine'), 'medicine-1'); await user.clear(screen.getByLabelText('Quantity')); await user.type(screen.getByLabelText('Quantity'), '2'); await user.click(screen.getByRole('button', { name: 'Add item' })); await user.click(screen.getByRole('button', { name: 'Complete sale' }));
  expect(createSale).toHaveBeenCalledWith(expect.objectContaining({ items: [{ productId: 'medicine-1', quantity: 2 }] })); expect(await screen.findByText('Sale completed')).toBeInTheDocument(); expect(screen.getByText(/Batch LOT-1/)).toBeInTheDocument();
 })
})
