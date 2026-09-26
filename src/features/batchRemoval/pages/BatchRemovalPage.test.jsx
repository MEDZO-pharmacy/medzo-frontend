import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BatchRemovalPage from './BatchRemovalPage'
import { getRemovalCandidates, removeBatch } from '../api/batchRemovalApi'

vi.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { staffId: 'I1001', username: 'manager' } }) }))
vi.mock('../api/batchRemovalApi', () => ({ getRemovalCandidates: vi.fn(), removeBatch: vi.fn() }))

const candidate = { batchId: 'batch-1', productId: 'p1', batchNumber: 'LOT-EXPIRED', expiryDate: '2026-09-21', daysUntilExpiry: -1, remainingQuantity: 7, isExpired: true }

describe('BatchRemovalPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('crypto', { randomUUID: () => 'request-1' })
    getRemovalCandidates.mockResolvedValue({ items: [candidate], page: 1, pageSize: 50, totalCount: 1 })
  })

  it('requires a reason and confirmation, then removes the selected batch', async () => {
    removeBatch.mockResolvedValue({ ...candidate, removedQuantity: 7, reason: 'Expired', removedBy: 'I1001', removedAtUtc: '2026-09-22T10:00:00Z', alreadyRemoved: false })
    const user = userEvent.setup()
    render(<MemoryRouter><BatchRemovalPage /></MemoryRouter>)

    await screen.findByText('LOT-EXPIRED')
    await user.click(screen.getByRole('button', { name: /remove/i }))
    const confirmButton = screen.getByRole('button', { name: 'Confirm removal' })
    expect(confirmButton).toBeDisabled()
    await user.selectOptions(screen.getByRole('combobox', { name: /reason for removal/i }), 'Expired')
    await user.click(screen.getByRole('checkbox'))
    await user.click(confirmButton)

    expect(await screen.findByRole('status')).toHaveTextContent('LOT-EXPIRED was removed')
    expect(removeBatch).toHaveBeenCalledWith('batch-1', expect.objectContaining({ reason: 'Expired', removedBy: 'I1001' }))
  })

  it('reports an already-removed batch without implying another deduction', async () => {
    removeBatch.mockResolvedValue({ ...candidate, removedQuantity: 7, reason: 'Expired', removedBy: 'I1001', removedAtUtc: '2026-09-22T10:00:00Z', alreadyRemoved: true })
    const user = userEvent.setup()
    render(<MemoryRouter><BatchRemovalPage /></MemoryRouter>)

    await screen.findByText('LOT-EXPIRED')
    await user.click(screen.getByRole('button', { name: /remove/i }))
    await user.selectOptions(screen.getByRole('combobox', { name: /reason for removal/i }), 'Expired')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Confirm removal' }))

    expect(await screen.findByRole('status')).toHaveTextContent('already removed')
    expect(screen.getByRole('status')).toHaveTextContent('No stock was deducted again')
  })
})