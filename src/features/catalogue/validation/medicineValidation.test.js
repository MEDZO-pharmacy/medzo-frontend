import { describe, expect, it } from 'vitest'
import { validateMedicine } from './medicineValidation'

const validMedicine = {
  name: 'Paracetamol',
  genericName: 'Acetaminophen',
  manufacturer: 'Medzo Labs',
  unitPrice: '12.50',
  reorderThreshold: '5',
}

const requiredTextCases = [
  ['name', 'Medicine name is required.'],
  ['genericName', 'Generic name is required.'],
  ['manufacturer', 'Manufacturer is required.'],
]

const maximumTextCases = [
  ['name', 'Medicine name cannot exceed 200 characters.'],
  ['genericName', 'Generic name cannot exceed 200 characters.'],
  ['manufacturer', 'Manufacturer cannot exceed 200 characters.'],
]

describe('validateMedicine', () => {
  it('accepts a valid medicine, including zero-valued numeric boundaries', () => {
    expect(validateMedicine({ ...validMedicine, unitPrice: 0, reorderThreshold: 0 })).toEqual({})
  })

  it.each(requiredTextCases)('requires %s when it is blank', (field, message) => {
    expect(validateMedicine({ ...validMedicine, [field]: '   ' })).toEqual({ [field]: message })
  })

  it.each(requiredTextCases)('requires %s when it is omitted', (field, message) => {
    const values = { ...validMedicine }
    delete values[field]
    expect(validateMedicine(values)).toEqual({ [field]: message })
  })

  it.each(maximumTextCases)('accepts %s at exactly 200 trimmed characters', (field) => {
    expect(validateMedicine({ ...validMedicine, [field]: ` ${'x'.repeat(200)} ` })).toEqual({})
  })

  it.each(maximumTextCases)('rejects %s beyond 200 trimmed characters', (field, message) => {
    expect(validateMedicine({ ...validMedicine, [field]: 'x'.repeat(201) })).toEqual({ [field]: message })
  })

  it.each(['', null, undefined])('requires unit price when its value is %s', (unitPrice) => {
    expect(validateMedicine({ ...validMedicine, unitPrice })).toEqual({
      unitPrice: 'Unit price is required.',
    })
  })

  it.each(['not-a-number', -0.01])('rejects invalid unit price %s', (unitPrice) => {
    expect(validateMedicine({ ...validMedicine, unitPrice })).toEqual({
      unitPrice: 'Unit price must be zero or greater.',
    })
  })

  it.each(['', null, undefined])('requires reorder threshold when its value is %s', (reorderThreshold) => {
    expect(validateMedicine({ ...validMedicine, reorderThreshold })).toEqual({
      reorderThreshold: 'Reorder threshold is required.',
    })
  })

  it.each([1.5, -1])('rejects invalid reorder threshold %s', (reorderThreshold) => {
    expect(validateMedicine({ ...validMedicine, reorderThreshold })).toEqual({
      reorderThreshold: 'Reorder threshold must be a whole number of zero or greater.',
    })
  })
})
