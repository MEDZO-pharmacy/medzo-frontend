import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLogoutButton from '../../../components/DashboardLogoutButton'
import { useAuth } from '../../../auth/AuthContext'
import InventoryTable from '../components/InventoryTable'
import StockLevelCard from '../components/StockLevelCard'
import { getInventory } from '../api/inventoryApi'

export default function InventoryDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState({ items: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    getInventory().then(setData).catch((requestError) => setError(requestError.message))
  }, [])

  const canManage = user.roles.some((role) => ['Admin', 'InventoryManager'].includes(role))
  const totalUnits = data.items.reduce((total, item) => total + item.quantityOnHand, 0)
  const lowStockCount = data.items.filter((item) => item.isLowStock).length

  return (
    <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/" className="mb-3 inline-block font-semibold text-medzo-blue">Back to home</Link>
            <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Inventory Manager Dashboard</h1>
            <p className="mt-2 text-[#4a5568]">Live medicine stock, sales and expiry overview.</p>
            <p className="mt-2 text-sm font-semibold text-medzo-blue"><span>Signed in as</span> <span>{user.firstName || user.username} · {user.staffId}</span></p>
          </div>
          <nav className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto xl:grid-cols-3" aria-label="Inventory quick actions">
            <Link to="/catalogue" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Manage medicines</Link>
            <Link to="/inventory/sale-issues" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Sale updates</Link>
            {canManage && <Link to="/inventory/purchase-receipts" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Purchase updates</Link>}
            {canManage && <Link to="/inventory/low-stock" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Low stock</Link>}
            {canManage && <Link to="/inventory/batches/new" className="gradient-btn rounded-lg px-5 py-3 text-center font-semibold text-white">Record batch</Link>}
            <DashboardLogoutButton />
          </nav>
        </div>

        <section className="my-6 grid gap-4 sm:grid-cols-3" aria-label="Inventory summary">
          <StockLevelCard label="Medicines" value={data.items.length} />
          <StockLevelCard label="Units on hand" value={totalUnits} tone="green" />
          <StockLevelCard label="Low-stock items" value={lowStockCount} tone="red" />
        </section>

        {error
          ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
          : <InventoryTable items={data.items} />}
      </div>
    </main>
  )
}
