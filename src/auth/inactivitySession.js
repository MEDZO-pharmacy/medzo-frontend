const DEFAULT_TIMEOUT_MINUTES = 15
const configuredMinutes = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES)

export const INACTIVITY_TIMEOUT_MS = (
  Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_TIMEOUT_MINUTES
) * 60_000

export const ACTIVITY_STORAGE_KEY = 'medzo.lastActivityAt'
export const LOGOUT_STORAGE_KEY = 'medzo.sessionLogout'
const LOGOUT_REASON_KEY = 'medzo.logoutReason'

export const getLastActivity = () => {
  const value = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

export const recordActivity = (timestamp = Date.now()) => {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, String(timestamp))
  return timestamp
}

export const clearActivity = () => localStorage.removeItem(ACTIVITY_STORAGE_KEY)

export const broadcastLogout = (reason = '') => {
  clearActivity()
  if (reason) localStorage.setItem(LOGOUT_REASON_KEY, reason)
  else localStorage.removeItem(LOGOUT_REASON_KEY)
  localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()))
}

export const consumeLogoutReason = () => {
  const reason = localStorage.getItem(LOGOUT_REASON_KEY)
  localStorage.removeItem(LOGOUT_REASON_KEY)
  return reason
}
