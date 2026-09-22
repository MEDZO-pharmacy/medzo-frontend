import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NearExpiryAlertsPage from './NearExpiryAlertsPage'
import { getNearExpiryAlerts } from '../api/expiryAlertsApi'

vi.mock('../api/expiryAlertsApi', () => ({ getNearExpiryAlerts: vi.fn() }))

describe('NearExpiryAlertsPage', () => {
  beforeEach(() => getNearExpiryAlerts.mockResolvedValue({ items: [{ batchId: 'b1', productId: 'p1', batchNumber: 'LOT-01', expiryDate: '2026-10-01', daysUntilExpiry: 7, remainingQuantity: 4 }], page: 1, pageSize: 20, totalCount: 1 }))
  it('shows batches that need expiry attention', async () => {
    render(<MemoryRouter><NearExpiryAlertsPage /></MemoryRouter>)
    expect(await screen.findByText('LOT-01')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(getNearExpiryAlerts).toHaveBeenCalledWith({ withinDays: 30 })
  })
})