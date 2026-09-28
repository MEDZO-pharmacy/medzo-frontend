import { Link, useLocation } from 'react-router-dom'
import DashboardLogoutButton from './DashboardLogoutButton'

export default function MinimalDashboardSidebar({ user, roleLabel, items }) {
  const location = useLocation()

  return (
    <aside className="flex min-h-full flex-col border-r border-slate-200 bg-white px-4 py-6 sm:px-5" aria-label={`${roleLabel} navigation`}>
      <Link to="/" className="flex items-center gap-3 px-2 text-medzo-blue">
        <img src="/hospital-icon1.svg" alt="Medzo" className="h-10 w-10" />
        <span><span className="block text-2xl font-bold leading-none">Medzo</span><span className="mt-1 block text-xs font-medium text-slate-500">{roleLabel}</span></span>
      </Link>
      <nav className="mt-10 grid gap-2" aria-label="Dashboard actions">
        {items.map(({ to, label, icon: Icon, badge, tone = 'default' }) => {
          const active = location.pathname === to
          const color = tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-slate-700'
          return <Link key={to} to={to} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-blue-50 text-medzo-blue ring-1 ring-blue-100' : `${color} hover:bg-slate-50`}`}><Icon size={20} aria-hidden="true" /><span className="flex-1">{label}</span>{badge != null && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-bold ${tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{badge}</span>}</Link>
        })}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-5">
        <div className="mb-4 flex items-center gap-3 px-2"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 font-bold text-medzo-blue">{(user?.firstName || user?.username || 'M').slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-bold text-[#0a192f]">{user?.firstName || user?.username} · {user?.staffId}</span><span className="block text-xs text-slate-500">{roleLabel}</span></span></div>
        <DashboardLogoutButton fullWidth />
      </div>
    </aside>
  )
}