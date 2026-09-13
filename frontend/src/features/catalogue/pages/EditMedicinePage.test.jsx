import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EditMedicinePage from './EditMedicinePage'
import { getMedicine, updateMedicine } from '../api/catalogueApi'

vi.mock('../api/catalogueApi', () => ({ getMedicine: vi.fn(), updateMedicine: vi.fn() }))

const medicine = {
  id: 'medicine-1', name: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'Medzo Labs',
  unitPrice: 12.5, dosageForm: 'Tablet', categoryId: null, reorderThreshold: 5, version: 3,
}

const renderPage = () => render(
  <MemoryRouter initialEntries={['/catalogue/medicine-1/edit']}>
    <Routes><Route path="/catalogue/:medicineId/edit" element={<EditMedicinePage />} /></Routes>
  </MemoryRouter>,
)

afterEach(cleanup)

describe('EditMedicinePage', () => {
  beforeEach(() => {
    getMedicine.mockReset().mockResolvedValue(medicine)
    updateMedicine.mockReset()
  })

  it('loads, updates, and immediately shows a success confirmation', async () => {
    const user = userEvent.setup()
    updateMedicine.mockResolvedValue({ ...medicine, name: 'Updated medicine', version: 4 })
    renderPage()
    const name = await screen.findByLabelText('Medicine name')
    await user.clear(name)
    await user.type(name, 'Updated medicine')
    await user.click(screen.getByRole('button', { name: 'Save medicine' }))

    await waitFor(() => expect(updateMedicine).toHaveBeenCalledWith(
      'medicine-1', expect.objectContaining({ name: 'Updated medicine' }), 3,
    ))
    expect(await screen.findByText(/Medicine updated successfully/)).toBeInTheDocument()
  })

  it('blocks an empty required field before calling the API', async () => {
    const user = userEvent.setup()
    renderPage()
    const name = await screen.findByLabelText('Medicine name')
    await user.clear(name)
    await user.click(screen.getByRole('button', { name: 'Save medicine' }))

    expect(screen.getByText('Medicine name is required.')).toBeInTheDocument()
    expect(updateMedicine).not.toHaveBeenCalled()
  })

  it('warns on a stale-version conflict and reloads the latest record', async () => {
    const user = userEvent.setup()
    updateMedicine.mockRejectedValue({ status: 409, message: 'Conflict' })
    getMedicine.mockResolvedValueOnce(medicine).mockResolvedValueOnce({ ...medicine, name: 'Changed elsewhere', version: 4 })
    renderPage()
    await screen.findByDisplayValue('Paracetamol')
    await user.click(screen.getByRole('button', { name: 'Save medicine' }))

    expect(await screen.findByRole('heading', { name: 'This medicine was changed by another user' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reload latest version' }))
    expect(await screen.findByDisplayValue('Changed elsewhere')).toBeInTheDocument()
    expect(getMedicine).toHaveBeenCalledTimes(2)
  })
})
