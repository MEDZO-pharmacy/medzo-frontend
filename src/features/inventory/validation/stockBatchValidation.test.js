import { describe, expect, it } from 'vitest'
import { validateStockBatch } from './stockBatchValidation'

const validBatch = {
  medicineId: 'medicine-1',
  batchNumber: 'LOT-001',
  description: 'Supplier invoice 10',
  sourceReference: 'INV-10',
  expiryDate: '2099-01-01',
  quantity: '10',
}

const isoDateWithOffset = (days) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

describe('validateStockBatch', () => {
  it('accepts a valid traceable batch', () => {
    expect(validateStockBatch(validBatch)).toEqual({})
  })

  it('accepts omitted optional description and source reference fields', () => {
    const values = { ...validBatch }
    delete values.description
    delete values.sourceReference
    expect(validateStockBatch(values)).toEqual({})
  })

  it('requires a medicine selection', () => {
    expect(validateStockBatch({ ...validBatch, medicineId: '' })).toEqual({
      medicineId: 'Select a medicine.',
    })
  })

  it.each(['', '   ', undefined])('requires a meaningful batch number for %s', (batchNumber) => {
    expect(validateStockBatch({ ...validBatch, batchNumber })).toEqual({
      batchNumber: 'Batch number is required.',
    })
  })

  it('accepts a batch number at exactly 100 trimmed characters', () => {
    expect(validateStockBatch({ ...validBatch, batchNumber: ` ${'x'.repeat(100)} ` })).toEqual({})
  })

  it('rejects a batch number beyond 100 trimmed characters', () => {
    expect(validateStockBatch({ ...validBatch, batchNumber: 'x'.repeat(101) })).toEqual({
      batchNumber: 'Batch number cannot exceed 100 characters.',
    })
  })

  it('enforces the trimmed 500-character description boundary', () => {
    expect(validateStockBatch({ ...validBatch, description: ` ${'x'.repeat(500)} ` })).toEqual({})
    expect(validateStockBatch({ ...validBatch, description: 'x'.repeat(501) })).toEqual({
      description: 'Description cannot exceed 500 characters.',
    })
  })

  it('enforces the trimmed 150-character source-reference boundary', () => {
    expect(validateStockBatch({ ...validBatch, sourceReference: ` ${'x'.repeat(150)} ` })).toEqual({})
    expect(validateStockBatch({ ...validBatch, sourceReference: 'x'.repeat(151) })).toEqual({
      sourceReference: 'Source reference cannot exceed 150 characters.',
    })
  })

  it.each([0, -1, 1.5, 'not-a-number'])('rejects invalid quantity %s', (quantity) => {
    expect(validateStockBatch({ ...validBatch, quantity })).toEqual({
      quantity: 'Enter a positive whole-number quantity.',
    })
  })

  it('accepts the smallest positive whole-number quantity', () => {
    expect(validateStockBatch({ ...validBatch, quantity: 1 })).toEqual({})
  })

  it.each([
    ['missing', ''],
    ['past', isoDateWithOffset(-1)],
    ['today', isoDateWithOffset(0)],
  ])('rejects a %s expiry date', (_label, expiryDate) => {
    expect(validateStockBatch({ ...validBatch, expiryDate })).toEqual({
      expiryDate: 'Expiry date must be in the future.',
    })
  })

  it('accepts an expiry date from tomorrow onward', () => {
    expect(validateStockBatch({ ...validBatch, expiryDate: isoDateWithOffset(1) })).toEqual({})
  })
})
