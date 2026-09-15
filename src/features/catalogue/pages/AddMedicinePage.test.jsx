import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AddMedicinePage from './AddMedicinePage'
import { createMedicine } from '../api/catalogueApi'

vi.mock('../api/catalogueApi', () => ({ createMedicine: vi.fn() }))

const completeForm = async (user) => {
  await user.type(screen.getByLabelText('Medicine name'), 'Paracetamol')
  await user.type(screen.getByLabelText('Generic name'), 'Acetaminophen')
  await user.type(screen.getByLabelText('Manufacturer'), 'Medzo Labs')
  await user.type(screen.getByLabelText('Unit price'), '12.50')
}

afterEach(cleanup)

describe('AddMedicinePage', () => {
  beforeEach(() => createMedicine.mockReset())

  it('shows validation messages and does not submit an incomplete record', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AddMedicinePage /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Save medicine' }))

    expect(screen.getByText('Medicine name is required.')).toBeInTheDocument()
    expect(screen.getByText('Generic name is required.')).toBeInTheDocument()
    expect(screen.getByText('Manufacturer is required.')).toBeInTheDocument()
    expect(screen.getByText('Unit price is required.')).toBeInTheDocument()
    expect(createMedicine).not.toHaveBeenCalled()
  })

  it('requires confirmation before saving a potential duplicate', async () => {
    const user = userEvent.setup()
    createMedicine
      .mockRejectedValueOnce({ status: 409, message: 'Potential duplicate' })
      .mockResolvedValueOnce({ id: '1', name: 'Paracetamol' })
    render(<MemoryRouter><AddMedicinePage /></MemoryRouter>)
    await completeForm(user)

    await user.click(screen.getByRole('button', { name: 'Save medicine' }))
    expect(await screen.findByRole('heading', { name: 'Potential duplicate medicine' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save duplicate anyway' }))

    await waitFor(() => expect(createMedicine).toHaveBeenLastCalledWith(expect.objectContaining({ allowDuplicate: true })))
    expect(await screen.findByRole('heading', { name: 'Medicine added successfully' })).toBeInTheDocument()
  })

  it('confirms a successful complete save', async () => {
    const user = userEvent.setup()
    createMedicine.mockResolvedValue({ id: '1', name: 'Paracetamol' })
    render(<MemoryRouter><AddMedicinePage /></MemoryRouter>)
    await completeForm(user)

    await user.click(screen.getByRole('button', { name: 'Save medicine' }))

    expect(await screen.findByRole('heading', { name: 'Medicine added successfully' })).toBeInTheDocument()
    expect(createMedicine).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'Medzo Labs', unitPrice: 12.5,
    }))
  })
})
