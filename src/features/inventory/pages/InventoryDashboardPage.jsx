import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, PackagePlus, PackageSearch, ShieldAlert } from 'lucide-react'
import Header from '../../../components/Header'
import { useAuth } from '../../../auth/AuthContext'
import InventoryTable from '../components/InventoryTable'
import StockLevelCard from '../components/StockLevelCard'
import { getInventory, getLowStock } from '../api/inventoryApi'

const actionClass = 'flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-[#0a192f] shadow-sm transition hover:-translate-y-0.5 hover:border-medzo-blue hover:shadow-md'

export default function InventoryDashboardPage() {
  const { user } = useAuth()
  const canManage = user.roles.some((role) => ['Admin', 'InventoryManager'].includes(role))
  const canEditInventory = canManage
  const [data, setData] = useState({ items: [] })
  const [lowStockCount, setLowStockCount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const lowStockRequest = canManage ? getLowStock({ pageSize: 1 }) : Promise.resolve(null)
    Promise.all([getInventory(), lowStockRequest])
      .then(([inventory, lowStock]) => {
        setData(inventory)
        setLowStockCount(lowStock?.totalCount ?? inventory.items.filter((item) => item.isLowStock).length)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [canManage, reload])

  const retry = () => { setError(''); setLoading(true); setReload((value) => value + 1) }
  const totalUnits = data.items.reduce((total, item) => total + item.quantityOnHand, 0)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f4f8ff]">
        <section className="overflow-hidden bg-[#0a192f] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_.65fr] lg:px-10 lg:py-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300"><PackageSearch size={16} /> Inventory workspace</p>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Keep every medicine ready when patients need it.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">Review stock, prioritise expiring batches, and record inventory updates from one clear workspace.</p>
              <p className="mt-6 text-sm font-semibold text-cyan-300">Signed in as {user.firstName || user.username} · {user.staffId}</p>
            </div>
            <div className="self-center rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold text-cyan-300">Inventory focus</p>
              <p className="mt-3 text-3xl font-bold">{lowStockCount} item{lowStockCount === 1 ? '' : 's'} need attention</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">Use low-stock and near-expiry alerts to decide what to order, sell first, or remove safely.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className={`grid gap-6 ${canManage ? 'lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start' : ''}`}>
            {canManage && (
              <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-6" aria-label="Inventory navigation">
                <div className="mb-5"><p className="text-sm font-bold text-medzo-blue">Quick actions</p><p className="mt-1 text-sm text-slate-500">Choose an inventory task.</p></div>
                <nav className="grid gap-3" aria-label="Inventory quick actions">
                  <Link to="/catalogue" className={actionClass}><PackageSearch size={18} className="text-medzo-blue" />Manage medicines</Link>
                  <Link to="/inventory/purchase-receipts" className={actionClass}><PackagePlus size={18} className="text-medzo-green" />Purchase updates</Link>
                  <Link to="/inventory/sale-issues" className={actionClass}><ClipboardList size={18} className="text-medzo-blue" />Sales history</Link>
                  <Link to="/inventory/low-stock" className={actionClass}><AlertTriangle size={18} className="text-amber-600" />Low stock</Link>
                  <Link to="/inventory/near-expiry" className={actionClass}><ShieldAlert size={18} className="text-amber-600" />Near expiry</Link>
                  <Link to="/inventory/batch-removals" className={actionClass}><AlertTriangle size={18} className="text-red-600" />Remove stock</Link>
                  <Link to="/inventory/batches/new" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"><PackagePlus size={18} />Record batch</Link>
                </nav>
              </aside>
            )}

            <div className="min-w-0">
              {!canManage && <Link to="/pharmacist" className="mb-5 inline-flex font-semibold text-medzo-blue hover:underline">Back to dashboard</Link>}
              <section className="grid gap-4 sm:grid-cols-3" aria-label="Inventory summary">
                <StockLevelCard label="Medicines" value={data.totalCount ?? data.items.length} />
                <StockLevelCard label="Units available" value={totalUnits} tone="green" />
                <StockLevelCard label="Low-stock items" value={lowStockCount} tone="red" />
              </section>

              <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-medzo-blue">Live inventory</p><h2 className="mt-1 text-2xl font-bold text-[#0a192f]">Medicine stock overview</h2><p className="mt-2 text-sm text-slate-500">Current quantities, reorder thresholds, and the next expiry date.</p></div></div>
                {loading && <p role="status" className="rounded-2xl bg-slate-50 p-10 text-center text-slate-600">Loading inventory…</p>}
                {!loading && error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{error}</p><button type="button" onClick={retry} className="mt-3 font-semibold underline">Try again</button></div>}
                {!loading && !error && <InventoryTable items={data.items} canEditInventory={canEditInventory} />}
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}