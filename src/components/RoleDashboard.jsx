import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ApiError, getDashboard } from '../services/authApi'

const RoleDashboard = ({ endpoint, title, description }) => {
  const { user, logout } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDashboard(endpoint)
      .then((result) => { if (active) setDashboard(result) })
      .catch((requestError) => {
        if (active) setError(requestError instanceof ApiError ? requestError.message : 'Dashboard data could not be loaded.')
      })
    return () => { active = false }
  }, [endpoint])

  return (
    <main className="min-h-screen bg-[#f4f8ff] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-[#0a192f] p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-medzo-green"><ShieldCheck /> Secure staff workspace</div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-300">{description}</p>
          </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-5 py-3 font-semibold hover:bg-white/20"><LogOut size={18} /> Logout</button>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-medzo-blue">Signed in as</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0a192f]">{user.firstName} {user.lastName}</h2>
            <p className="mt-2 text-[#4a5568]">Staff ID: {user.staffId}</p>
            <p className="text-[#4a5568]">Role: {user.roles.join(', ')}</p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-xl font-bold text-[#0a192f]">Available modules</h2>
            {error && <p role="alert" className="mt-4 flex gap-2 text-red-700"><AlertCircle /> {error}</p>}
            {!dashboard && !error && <p className="mt-4 text-[#4a5568]">Loading dashboard…</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {dashboard?.modules?.map((module) => (
                <div key={module} className="flex items-center gap-3 rounded-xl bg-[#f4f8ff] p-4 font-semibold text-[#0a192f]"><CheckCircle2 className="text-medzo-green" size={20} /> {module}</div>
              ))}
            </div>
          </article>
        </section>

        {dashboard?.users && (
          <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between p-6"><h2 className="text-xl font-bold">Staff accounts</h2><span className="rounded-full bg-blue-50 px-4 py-2 font-bold text-medzo-blue">{dashboard.totalUsers} users</span></div>
            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-sm text-slate-500"><tr><th className="p-4">Staff ID</th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th></tr></thead><tbody>{dashboard.users.map((staff) => <tr key={staff.id} className="border-t border-slate-100"><td className="p-4 font-semibold">{staff.staffId || 'Legacy user'}</td><td className="p-4">{staff.firstName} {staff.lastName}</td><td className="p-4">{staff.email}</td><td className="p-4">{staff.roles.join(', ')}</td></tr>)}</tbody></table></div>
          </section>
        )}
      </div>
    </main>
  )
}

export default RoleDashboard

