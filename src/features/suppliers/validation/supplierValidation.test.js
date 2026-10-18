import { describe, expect, it } from 'vitest'
import { validateSupplier } from './supplierValidation'

const valid = { name: 'Medzo Supplies', contactName: 'Jane', email: 'jane@example.com', phone: '0771234567', address: 'Colombo' }

describe('supplier business validation', () => {
  it('accepts complete supplier details', () => {
    expect(validateSupplier(valid)).toEqual({})
  })

  it.each(['name', 'contactName', 'email', 'phone'])('rejects whitespace-only %s', (field) => {
    expect(validateSupplier({ ...valid, [field]: '   ' })).toHaveProperty(field)
  })

  it.each([
    ['name', 200], ['contactName', 150], ['address', 500],
  ])('accepts %s at its limit and rejects one extra character', (field, limit) => {
    expect(validateSupplier({ ...valid, [field]: 'a'.repeat(limit) })).not.toHaveProperty(field)
    expect(validateSupplier({ ...valid, [field]: 'a'.repeat(limit + 1) })).toHaveProperty(field)
  })

  it.each(['abc', 'jane@', '@example.com', 'jane smith@example.com'])('rejects malformed email %s', (email) => {
    expect(validateSupplier({ ...valid, email })).toHaveProperty('email')
  })

  it.each(['077123456', '07712345678', '077abc4567'])('rejects invalid phone %s', (phone) => {
    expect(validateSupplier({ ...valid, phone })).toHaveProperty('phone')
  })

  it('accepts formatted phone numbers with exactly ten digits', () => {
    expect(validateSupplier({ ...valid, phone: '(077) 123-4567' })).toEqual({})
  })
})
