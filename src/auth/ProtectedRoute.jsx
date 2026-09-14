import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getPrimaryRole, getRoleHome } from './roleRouting'

const ProtectedRoute = ({ roles }) => {
  const { evaluateSession, isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const [evaluatedPath, setEvaluatedPath] = useState(null)

  useEffect(() => {
    if (isLoading || !isAuthenticated) return

    let isCurrent = true
    evaluateSession()
      .catch(() => {})
      .finally(() => {
        if (isCurrent) setEvaluatedPath(location.pathname)
      })

    return () => { isCurrent = false }
  }, [evaluateSession, isAuthenticated, isLoading, location.pathname])

  if (isLoading || (isAuthenticated && evaluatedPath !== location.pathname)) {
    return <main className="min-h-[60vh] grid place-items-center">Checking your session...</main>
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(getPrimaryRole(user))) return <Navigate to={getRoleHome(user)} replace />
  return <Outlet />
}

export default ProtectedRoute
