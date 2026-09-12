import { describe, expect, it } from 'vitest'
import { validateMedicine } from './medicineValidation'

const validMedicine = {
  name: 'Paracetamol',
  genericName: 'Acetaminophen',
  manufacturer: 'Medzo Labs',
  unitPrice: '12.50',
  reorderThreshold: '5',
}

describe('validateMedicine', () => {
  it('accepts a valid medicine', () => {
    expect(validateMedicine(validMedicine)).toEqual({})
  })

  it('requires all text and numeric fields', () => {
    const errors = validateMedicine({ name: ' ', genericName: '', manufacturer: '', unitPrice: '', reorderThreshold: '' })
    expect(errors).toMatchObject({
      name: expect.any(String), genericName: expect.any(String), manufacturer: expect.any(String),
      unitPrice: expect.any(String), reorderThreshold: expect.any(String),
    })
  })

  it('rejects invalid prices, fractional thresholds, and overlong database values', () => {
    const errors = validateMedicine({
      ...validMedicine,
      name: 'x'.repeat(201),
      unitPrice: '-1',
      reorderThreshold: '1.5',
    })
    expect(errors.name).toContain('200')
    expect(errors.unitPrice).toBeTruthy()
    expect(errors.reorderThreshold).toBeTruthy()
  })
})
