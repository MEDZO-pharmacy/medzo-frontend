import { describe, expect, it } from 'vitest'
import { createReceiptPdfBlob } from './receiptPdf'

describe('receiptPdf', () => {
  it('creates a PDF blob containing the receipt details', async () => {
    const blob = createReceiptPdfBlob({
      saleId: 'sale-1',
      saleReference: 'SALE-20260927073333',
      completedAtUtc: '2026-09-27T07:37:52Z',
      items: [{
        medicineId: 'medicine-1',
        medicineName: 'Amoxicillin 250mg',
        quantity: 1,
        batchAllocations: [{ batchNumber: 'DEMO-AMOX-001', quantity: 1 }],
      }],
    })

    expect(blob.type).toBe('application/pdf')
    const content = await blob.text()
    expect(content.startsWith('%PDF-1.4')).toBe(true)
    expect(content).toContain('SALE-20260927073333')
    expect(content).toContain('Amoxicillin 250mg')
    expect(content).toContain('DEMO-AMOX-001: 1')
  })
})
