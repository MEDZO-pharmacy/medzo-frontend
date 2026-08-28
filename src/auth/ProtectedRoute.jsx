import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getPrimaryRole, getRoleHome } from './roleRouting'

const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) return <main className="min-h-[60vh] grid place-items-center">Checking your session…</main>
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(getPrimaryRole(user))) return <Navigate to={getRoleHome(user)} replace />
  return <Outlet />
}

export default ProtectedRoute

