import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ExpiredStockWarning from './ExpiredStockWarning'

describe('ExpiredStockWarning', () => {
  it('explains that expired stock cannot be sold and preserves the pharmacist next step', () => {
    render(<ExpiredStockWarning message="No sellable stock for product 'p1' because the remaining batch is expired." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Expired stock cannot be dispensed')
    expect(screen.getByRole('alert')).toHaveTextContent('remaining batch is expired')
    expect(screen.getByRole('alert')).toHaveTextContent('Remove this medicine from the sale')
  })
})