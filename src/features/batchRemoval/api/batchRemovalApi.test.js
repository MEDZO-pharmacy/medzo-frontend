import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../services/authApi', () => ({
  authenticatedServiceRequest: vi.fn(),
}))

import { authenticatedServiceRequest } from '../../../services/authApi'
import { getRemovalCandidates, removeBatch } from './batchRemovalApi'

describe('batchRemovalApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps the backend batch ID and medicine name for a removal candidate', async () => {
    authenticatedServiceRequest.mockResolvedValue({
      items: [{ id: 'batch-123', medicineName: 'Amoxicillin 250mg' }],
      page: 1,
      pageSize: 50,
      totalCount: 1,
    })

    const result = await getRemovalCandidates()

    expect(result.items).toEqual([{ id: 'batch-123', medicineName: 'Amoxicillin 250mg' }])
    expect(authenticatedServiceRequest).toHaveBeenCalledWith(
      '/catalogue-inventory-api',
      '/api/batch-removals/candidates?withinDays=30&page=1&pageSize=50',
    )
  })

  it('posts the selected batch ID to the removal endpoint', async () => {
    authenticatedServiceRequest.mockResolvedValue({ removedQuantity: 42 })
    const request = { idempotencyKey: 'request-123', reason: 'Expired', removedBy: 'I1001' }

    await removeBatch('batch-123', request)

    expect(authenticatedServiceRequest).toHaveBeenCalledWith(
      '/catalogue-inventory-api',
      '/api/batch-removals/batch-123',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    )
  })
})
