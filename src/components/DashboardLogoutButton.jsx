import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function DashboardLogoutButton() {
  const { logout } = useAuth()

  return (
    <button
      type="button"
      onClick={logout}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
    >
      <LogOut size={18} aria-hidden="true" />
      Logout
    </button>
  )
}
