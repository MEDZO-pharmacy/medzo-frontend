import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CataloguePage from './CataloguePage'
import { deleteMedicine, searchMedicines } from '../api/catalogueApi'

const authState = vi.hoisted(() => ({ roles: ['Pharmacist'] }))
vi.mock('../api/catalogueApi', () => ({ searchMedicines: vi.fn(), deleteMedicine: vi.fn() }))
vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { roles: authState.roles } }),
}))

const fullCatalogue = {
  items: [{
    id: '1', name: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'Medzo Labs',
    dosageForm: 'Tablet', unitPrice: 12.5, quantityOnHand: 25, isLowStock: false, version: 3,
  }],
  totalCount: 1,
}

const renderPage = () => render(<MemoryRouter><CataloguePage /></MemoryRouter>)

afterEach(cleanup)

describe('CataloguePage search', () => {
  beforeEach(() => {
    authState.roles = ['Pharmacist']
    searchMedicines.mockReset()
    searchMedicines.mockResolvedValue(fullCatalogue)
    deleteMedicine.mockReset()
    deleteMedicine.mockResolvedValue(null)
  })

  it('searches for medicines by the submitted term', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Paracetamol')
    await user.type(screen.getByRole('searchbox'), 'para')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => expect(searchMedicines).toHaveBeenLastCalledWith({ search: 'para' }))
    expect(await screen.findByText(/1 medicine found for/)).toBeInTheDocument()
  })

  it('shows a clear no-results state instead of an error', async () => {
    const user = userEvent.setup()
    searchMedicines.mockResolvedValueOnce(fullCatalogue).mockResolvedValueOnce({ items: [], totalCount: 0 })
    renderPage()
    await screen.findByText('Paracetamol')
    await user.type(screen.getByRole('searchbox'), 'unknown')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('heading', { name: 'No medicines found' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears the term and restores the full catalogue', async () => {
    const user = userEvent.setup()
    searchMedicines
      .mockResolvedValueOnce(fullCatalogue)
      .mockResolvedValueOnce({ items: [], totalCount: 0 })
      .mockResolvedValueOnce(fullCatalogue)
    renderPage()
    await screen.findByText('Paracetamol')
    await user.type(screen.getByRole('searchbox'), 'unknown')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await screen.findByRole('heading', { name: 'No medicines found' })
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    await waitFor(() => expect(searchMedicines).toHaveBeenLastCalledWith({ search: '' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(await screen.findByText('Paracetamol')).toBeInTheDocument()
  })

  it('lets an Inventory Manager confirm and delete a medicine', async () => {
    authState.roles = ['InventoryManager']
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    searchMedicines.mockResolvedValueOnce(fullCatalogue).mockResolvedValueOnce({ items: [], totalCount: 0 })
    renderPage()

    await screen.findByText('Paracetamol')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(deleteMedicine).toHaveBeenCalledWith('1', 3))
    expect(await screen.findByText('Paracetamol was removed from the active catalogue.')).toBeInTheDocument()
  })
})
