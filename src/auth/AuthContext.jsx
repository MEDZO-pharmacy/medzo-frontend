import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  evaluateSession as evaluateSessionRequest,
  forgetSession,
  login as loginRequest,
  refreshSession,
  register as registerRequest,
  revokeSession,
  setSessionListener,
} from '../services/authApi'
import {
  ACTIVITY_STORAGE_KEY,
  broadcastLogout,
  getLastActivity,
  INACTIVITY_TIMEOUT_MS,
  LOGOUT_STORAGE_KEY,
  recordActivity,
} from './inactivitySession'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setSessionListener(setSession)
    const lastActivity = getLastActivity()
    const sessionExpired = lastActivity && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS
    const restore = sessionExpired
      ? revokeSession().finally(() => broadcastLogout('inactivity'))
      : refreshSession().then((restoredSession) => {
          if (restoredSession && !lastActivity) recordActivity()
          return restoredSession
        })

    restore
      .catch((error) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error(error)
      })
      .finally(() => setIsLoading(false))
    return () => setSessionListener(null)
  }, [])

  useEffect(() => {
    if (!session?.expiresAt) return undefined
    const delay = Math.max(new Date(session.expiresAt).getTime() - Date.now() - 30_000, 1_000)
    const timer = window.setTimeout(() => refreshSession().catch(() => setSession(null)), delay)
    return () => window.clearTimeout(timer)
  }, [session?.expiresAt])

  const login = useCallback(async (credentials) => {
    const nextSession = await loginRequest(credentials)
    recordActivity()
    setSession(nextSession)
    return nextSession
  }, [])

  const register = useCallback(async (account) => {
    const nextSession = await registerRequest(account)
    recordActivity()
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(async () => {
    broadcastLogout()
    try {
      await revokeSession()
    } catch {
      // Local logout still succeeds when the API is temporarily unavailable.
      setSession(null)
    }
  }, [])

  useEffect(() => {
    if (!session?.user) return undefined

    let timer
    let lastRecordedAt = getLastActivity() || recordActivity()
    let lastPersistedAt = lastRecordedAt

    const expireSession = () => {
      broadcastLogout('inactivity')
      forgetSession()
      revokeSession().catch(() => {})
    }

    const scheduleExpiration = (activityAt) => {
      window.clearTimeout(timer)
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - activityAt)
      if (remaining <= 0) {
        expireSession()
        return
      }
      timer = window.setTimeout(expireSession, remaining)
    }

    const noteActivity = () => {
      const now = Date.now()
      lastRecordedAt = now
      if (now - lastPersistedAt >= 1_000) {
        recordActivity(now)
        lastPersistedAt = now
      }
      scheduleExpiration(now)
    }

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastRecordedAt >= INACTIVITY_TIMEOUT_MS) expireSession()
      else noteActivity()
    }

    const persistLatestActivity = () => recordActivity(lastRecordedAt)

    const handleStorage = (event) => {
      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        forgetSession()
        return
      }
      if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
        const activityAt = Number(event.newValue)
        if (Number.isFinite(activityAt)) {
          lastRecordedAt = activityAt
          scheduleExpiration(activityAt)
        }
      }
    }

    const activityEvents = ['mousemove', 'pointerdown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, noteActivity, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', persistLatestActivity)
    window.addEventListener('storage', handleStorage)
    scheduleExpiration(lastRecordedAt)

    return () => {
      window.clearTimeout(timer)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, noteActivity))
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', persistLatestActivity)
      window.removeEventListener('storage', handleStorage)
    }
  }, [session?.user])

  const evaluateSession = useCallback(async () => {
    await evaluateSessionRequest()
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.user),
    isLoading,
    login,
    register,
    logout,
    evaluateSession,
  }), [session, isLoading, login, register, logout, evaluateSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally lives beside its provider so they share one private context.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
