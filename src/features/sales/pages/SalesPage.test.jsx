import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SalesPage from './SalesPage'
import { searchMedicines } from '../../catalogue/api/catalogueApi'
import { createSale } from '../api/salesApi'

vi.mock('../../catalogue/api/catalogueApi', () => ({ searchMedicines: vi.fn() }))
vi.mock('../api/salesApi', () => ({ createSale: vi.fn() }))

const completedSale = {
 saleId: 'sale-1',
 alreadyProcessed: false,
 items: [{ productId: 'medicine-1', quantity: 2, batchAllocations: [{ batchId: 'batch-1', batchNumber: 'LOT-1', quantity: 2 }] }],
 receipt: { saleId: 'sale-1', completedAtUtc: '2026-09-22T10:30:00Z', items: [{ productId: 'medicine-1', quantity: 2, batchAllocations: [{ batchId: 'batch-1', batchNumber: 'LOT-1', quantity: 2 }] }] },
}

describe('SalesPage', () => {
 afterEach(() => cleanup())
 beforeEach(() => {
  searchMedicines.mockResolvedValue({ items: [{ id: 'medicine-1', name: 'Paracetamol' }] })
  createSale.mockResolvedValue(completedSale)
 })
 it('submits product and quantity without choosing a batch', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><SalesPage /></MemoryRouter>)
  await user.selectOptions(await screen.findByLabelText('Medicine'), 'medicine-1')
  await user.clear(screen.getByLabelText('Quantity'))
  await user.type(screen.getByLabelText('Quantity'), '2')
  await user.click(screen.getByRole('button', { name: 'Add item' }))
  await user.click(screen.getByRole('button', { name: 'Complete sale' }))
  expect(createSale).toHaveBeenCalledWith(expect.objectContaining({ items: [{ productId: 'medicine-1', quantity: 2 }] }))
  expect(await screen.findByText('Sale completed')).toBeInTheDocument()
 })
 it('shows and prints the generated receipt using the selected medicine name', async () => {
  const print = vi.fn()
  Object.defineProperty(globalThis, 'print', { configurable: true, value: print })
  const user = userEvent.setup()
  render(<MemoryRouter><SalesPage /></MemoryRouter>)
  await user.selectOptions(await screen.findByLabelText('Medicine'), 'medicine-1')
  await user.click(screen.getByRole('button', { name: 'Add item' }))
  await user.click(screen.getByRole('button', { name: 'Complete sale' }))
  expect(await screen.findByRole('heading', { name: 'Sale receipt' })).toBeInTheDocument()
  const receipt = screen.getByRole('region', { name: 'Receipt' })
  expect(within(receipt).getByText('Paracetamol')).toBeInTheDocument()
  expect(within(receipt).getByText('sale-1')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Print receipt' }))
  expect(print).toHaveBeenCalledOnce()
 })
})