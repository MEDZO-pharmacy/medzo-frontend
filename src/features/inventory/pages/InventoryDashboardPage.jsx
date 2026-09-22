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
  const canEditInventory = user.roles.some((role) => ['Admin', 'InventoryManager', 'Pharmacist'].includes(role))
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
    <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/" className="mb-3 inline-block font-semibold text-medzo-blue">Back to home</Link>
            <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">{canManage ? 'Inventory Manager Dashboard' : 'Pharmacist Inventory View'}</h1>
            <p className="mt-2 text-[#4a5568]">Live medicine stock, sales and expiry overview.</p>
            <p className="mt-2 text-sm font-semibold text-medzo-blue"><span>Signed in as</span> <span>{user.firstName || user.username} · {user.staffId}</span></p>
          </div>
          <nav className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto xl:grid-cols-3" aria-label="Inventory quick actions">
            <Link to="/catalogue" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">{canManage ? 'Manage medicines' : 'Medicine catalogue'}</Link>
            <Link to="/inventory/sale-issues" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Sale updates</Link>
            {canManage && <Link to="/inventory/purchase-receipts" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Purchase updates</Link>}
            {canManage && <Link to="/inventory/low-stock" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Low stock</Link>}`n            {canManage && <Link to="/inventory/near-expiry" className="rounded-lg border border-amber-500 bg-white px-5 py-3 text-center font-semibold text-amber-800 hover:bg-amber-50">Near expiry</Link>}
            {canEditInventory && <Link to="/inventory/batches/new" className="gradient-btn rounded-lg px-5 py-3 text-center font-semibold text-white">Record batch</Link>}
            <DashboardLogoutButton />
          </nav>
        </div>

        <section className="my-6 grid gap-4 sm:grid-cols-3" aria-label="Inventory summary">
          <StockLevelCard label="Medicines" value={data.totalCount ?? data.items.length} />
          <StockLevelCard label="Units shown" value={totalUnits} tone="green" />
          <StockLevelCard label="Low-stock items" value={lowStockCount} tone="red" />
        </section>

        {loading && <p role="status" className="rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">Loading inventory…</p>}
        {!loading && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{error}</p><button type="button" onClick={retry} className="mt-3 font-semibold underline">Try again</button></div>}
        {!loading && !error && <InventoryTable items={data.items} canEditInventory={canEditInventory} />}
      </div>
    </main>
  )
}
