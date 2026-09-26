import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Products from './Products'
import Services from './Services'
import AboutUs from './AboutUs'
import { browseAvailableMedicines } from '../features/catalogue/api/catalogueApi'

vi.mock('../features/catalogue/api/catalogueApi', () => ({ browseAvailableMedicines: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('public website pages', () => {
  it('shows available medicines and supports public search', async () => {
    browseAvailableMedicines.mockResolvedValue({ items: [{ id: '1', name: 'Panadol', genericName: 'Paracetamol', manufacturer: 'GSK', unitPrice: 12.5, dosageForm: 'Tablet', categoryName: 'Pain relief', lowStock: false }], page: 1, pageSize: 12, totalCount: 1 })
    render(<MemoryRouter><Products /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Panadol' })).toBeInTheDocument()
    expect(screen.getByText('Rs. 12.50')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search available medicines'), 'pana')
    await userEvent.click(screen.getByRole('button', { name: 'Search catalogue' }))
    expect(browseAvailableMedicines).toHaveBeenLastCalledWith({ search: 'pana', page: 1, pageSize: 12 })
  })

  it('renders meaningful Services and About content', () => {
    const { unmount } = render(<MemoryRouter><Services /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Pharmacy services centred/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prescription dispensing' })).toBeInTheDocument()
    unmount()
    render(<MemoryRouter><AboutUs /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Better pharmacy care starts/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Safety first' })).toBeInTheDocument()
  })
})
