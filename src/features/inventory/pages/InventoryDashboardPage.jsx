import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, PackagePlus, Pill, ShieldAlert, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import MinimalDashboardSidebar from '../../../components/MinimalDashboardSidebar'
import InventoryTable from '../components/InventoryTable'
import StockLevelCard from '../components/StockLevelCard'
import { getInventory, getLowStock } from '../api/inventoryApi'

export default function InventoryDashboardPage() {
  const { user } = useAuth()
  const canManage = user.roles.some((role) => ['Admin', 'InventoryManager'].includes(role))
  const [data, setData] = useState({ items: [] })
  const [lowStockCount, setLowStockCount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const lowStockRequest = canManage ? getLowStock({ pageSize: 1 }) : Promise.resolve(null)
    Promise.all([getInventory(), lowStockRequest]).then(([inventory, lowStock]) => { setData(inventory); setLowStockCount(lowStock?.totalCount ?? inventory.items.filter((item) => item.isLowStock).length) }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [canManage, reload])

  const totalUnits = data.items.reduce((total, item) => total + item.quantityOnHand, 0)
  const retry = () => { setError(''); setLoading(true); setReload((value) => value + 1) }
  const navItems = [
    { to: '/inventory', label: 'Inventory overview', icon: ShoppingBag },
    { to: '/catalogue', label: 'Medicines', icon: Pill },
    { to: '/inventory/purchase-receipts', label: 'Purchase updates', icon: ClipboardList },
    { to: '/inventory/low-stock', label: 'Low stock', icon: AlertTriangle, badge: lowStockCount, tone: 'danger' },
    { to: '/inventory/near-expiry', label: 'Near expiry', icon: ShieldAlert, tone: 'warning' },
    { to: '/inventory/batch-removals', label: 'Remove stock', icon: AlertTriangle, tone: 'danger' },
    { to: '/inventory/batches/new', label: 'Record batch', icon: PackagePlus },
  ]

  return <main className="min-h-screen bg-[#f7faff]"><div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[17.5rem_minmax(0,1fr)]"><MinimalDashboardSidebar user={user} roleLabel="Inventory Manager" items={navItems} /><section className="min-w-0 px-5 py-7 sm:px-8 lg:px-10"><header className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-[#0a192f]">Inventory overview</h1><p className="mt-2 text-slate-500">A quick snapshot of your medicine stock.</p></div><div className="flex items-center gap-4"><span className="text-sm text-slate-500">Signed in as <strong className="text-slate-700">{user.firstName || user.username}</strong></span><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 md:flex">Search medicines…</div></div></header><section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Inventory summary"><StockLevelCard label="Medicines" value={data.totalCount ?? data.items.length} /><StockLevelCard label="Units available" value={totalUnits} tone="green" /><StockLevelCard label="Low stock" value={lowStockCount} tone="red" /></section><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-bold text-[#0a192f]">Medicine stock</h2>{canManage && <Link to="/inventory/batches/new" className="inline-flex items-center gap-2 rounded-xl bg-medzo-blue px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"><PackagePlus size={18} />Record batch</Link>}</div>{loading && <p role="status" className="rounded-xl bg-slate-50 p-10 text-center text-slate-500">Loading inventory…</p>}{!loading && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{error}</p><button type="button" onClick={retry} className="mt-3 font-semibold underline">Try again</button></div>}{!loading && !error && <InventoryTable items={data.items} canEditInventory={canManage} />}</section></section></div></main>
}