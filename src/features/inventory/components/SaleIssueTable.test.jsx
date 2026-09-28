import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SaleIssueTable from './SaleIssueTable'
import { downloadReceiptPdf } from '../../sales/utils/receiptPdf'

vi.mock('../../sales/utils/receiptPdf', () => ({ downloadReceiptPdf: vi.fn() }))

describe('SaleIssueTable', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows an automatically applied sale update', () => {
    render(<SaleIssueTable items={[{
      movementId: 'movement-1', saleReference: 'SALE-100', medicineName: 'Paracetamol',
      batchNumber: 'LOT-100', expiryDate: '2027-01-01', quantitySold: 4,
      quantityAfter: 16, processedAtUtc: '2026-09-10T08:00:00Z',
    }]} />)

    expect(screen.getByText('SALE-100')).toBeInTheDocument()
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
  })

  it('downloads a receipt for the sale reference', async () => {
    const user = userEvent.setup()
    render(<SaleIssueTable items={[{
      movementId: 'movement-1', saleReference: 'SALE-100', medicineName: 'Paracetamol',
      batchNumber: 'LOT-100', expiryDate: '2027-01-01', quantitySold: 4,
      quantityAfter: 16, processedAtUtc: '2026-09-10T08:00:00Z',
    }]} />)

    await user.click(screen.getByRole('button', { name: /receipt/i }))

    expect(downloadReceiptPdf).toHaveBeenCalledWith(expect.objectContaining({
      saleReference: 'SALE-100',
      items: [expect.objectContaining({ medicineName: 'Paracetamol', quantity: 4 })],
    }))
  })

  it('shows an empty state before a sale event is processed', () => {
    render(<SaleIssueTable />)
    expect(screen.getByText(/No sale stock updates/i)).toBeInTheDocument()
  })
})
