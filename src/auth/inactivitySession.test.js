import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACTIVITY_STORAGE_KEY, LOGOUT_STORAGE_KEY, broadcastLogout, clearActivity, consumeLogoutReason, getLastActivity, recordActivity } from './inactivitySession'

describe('session inactivity rules', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it.each(['garbage', '0', '-5', 'Infinity'])('treats invalid activity value %s as missing', (value) => {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, value)
    expect(getLastActivity()).toBeNull()
  })

  it('records activity using the mocked clock', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    expect(recordActivity()).toBe(1700000000000)
    expect(getLastActivity()).toBe(1700000000000)
    clearActivity()
    expect(getLastActivity()).toBeNull()
  })

  it('broadcasts logout, clears activity and consumes the reason once', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    recordActivity(1600000000000)

    broadcastLogout('Session expired')

    expect(getLastActivity()).toBeNull()
    expect(setItem).toHaveBeenCalledWith(LOGOUT_STORAGE_KEY, '1700000000000')
    expect(consumeLogoutReason()).toBe('Session expired')
    expect(consumeLogoutReason()).toBeNull()
  })

  it('removes a stale reason when logout has no reason', () => {
    broadcastLogout('old reason')
    broadcastLogout()
    expect(consumeLogoutReason()).toBeNull()
  })
})
