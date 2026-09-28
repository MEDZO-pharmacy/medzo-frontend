import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLogoutButton from '../../../components/DashboardLogoutButton'
import { useAuth } from '../../../auth/AuthContext'
import InventoryTable from '../components/InventoryTable'
import StockLevelCard from '../components/StockLevelCard'
import { getInventory, getLowStock } from '../api/inventoryApi'

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
  const navLinkClass = 'rounded-lg border border-medzo-blue bg-white px-4 py-3 text-center font-semibold text-medzo-blue transition-colors hover:bg-blue-50'

  return (
    <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className={`mx-auto max-w-7xl ${canManage ? 'grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start' : ''}`}>
        {canManage && (
          <aside className="rounded-2xl bg-white p-4 shadow-sm lg:sticky lg:top-6" aria-label="Inventory navigation">
            <Link to="/" className="mb-5 inline-block font-semibold text-medzo-blue">Back to home</Link>
            <nav className="grid gap-3" aria-label="Inventory quick actions">
              <Link to="/catalogue" className={navLinkClass}>Manage medicines</Link>
              <Link to="/inventory/sale-issues" className={navLinkClass}>Sales history</Link>
              <Link to="/inventory/purchase-receipts" className={navLinkClass}>Purchase updates</Link>
              <Link to="/inventory/low-stock" className={navLinkClass}>Low stock</Link>
              <Link to="/inventory/near-expiry" className="rounded-lg border border-amber-500 bg-white px-4 py-3 text-center font-semibold text-amber-800 transition-colors hover:bg-amber-50">Near expiry</Link>
              <Link to="/inventory/batch-removals" className="rounded-lg border border-red-300 bg-white px-4 py-3 text-center font-semibold text-red-700 transition-colors hover:bg-red-50">Remove stock</Link>
              <Link to="/inventory/batches/new" className={navLinkClass}>Record batch</Link>
              <DashboardLogoutButton />
            </nav>
          </aside>
        )}

        <div className="min-w-0">
          <header>
            {!canManage && <Link to="/pharmacist" className="mb-3 inline-block font-semibold text-medzo-blue">Back to dashboard</Link>}
            <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">{canManage ? 'Inventory Manager Dashboard' : 'Pharmacist Inventory View'}</h1>
            <p className="mt-2 text-sm font-semibold text-medzo-blue"><span>Signed in as</span> <span>{user.firstName || user.username} · {user.staffId}</span></p>
          </header>

          <section className="my-6 grid gap-4 sm:grid-cols-3" aria-label="Inventory summary">
            <StockLevelCard label="Medicines" value={data.totalCount ?? data.items.length} />
            <StockLevelCard label="Units shown" value={totalUnits} tone="green" />
            <StockLevelCard label="Low-stock items" value={lowStockCount} tone="red" />
          </section>

          {loading && <p role="status" className="rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">Loading inventory…</p>}
          {!loading && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{error}</p><button type="button" onClick={retry} className="mt-3 font-semibold underline">Try again</button></div>}
          {!loading && !error && <InventoryTable items={data.items} canEditInventory={canEditInventory} />}
        </div>
      </div>
    </main>
  )
}
