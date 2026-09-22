import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, ClipboardList, Search } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { searchMedicines } from '../features/catalogue/api/catalogueApi'
import MedicineTable from '../features/catalogue/components/MedicineTable'
import { getInventory } from '../features/inventory/api/inventoryApi'
import StockLevelCard from '../features/inventory/components/StockLevelCard'
import SaleWorkspace from '../features/sales/components/SaleWorkspace'
import DashboardLogoutButton from '../components/DashboardLogoutButton'

export default function PharmacistDashboard() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [medicines, setMedicines] = useState({ items: [], totalCount: 0 })
  const [inventory, setInventory] = useState({ items: [] })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async (search = '') => {
    setStatus('loading')
    setError('')
    try {
      const [catalogueResult, inventoryResult] = await Promise.all([
        searchMedicines({ search: search.trim(), pageSize: 8 }),
        getInventory({ pageSize: 100 }),
      ])
      setMedicines(catalogueResult)
      setInventory(inventoryResult)
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.message || 'Dashboard data could not be loaded. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([searchMedicines({ pageSize: 8 }), getInventory({ pageSize: 100 })])
      .then(([catalogueResult, inventoryResult]) => {
        if (!active) return
        setMedicines(catalogueResult)
        setInventory(inventoryResult)
        setStatus('ready')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Dashboard data could not be loaded. Please try again.')
        setStatus('error')
      })
    return () => { active = false }
  }, [])

  const totalUnits = inventory.items.reduce((sum, item) => sum + item.quantityOnHand, 0)
  const lowStock = inventory.items.filter((item) => item.isLowStock).length

  const submitSearch = (event) => {
    event.preventDefault()
    load(query)
  }

  const clearSearch = () => {
    setQuery('')
    load('')
  }

  return (
    <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to="/" aria-label="Back to home" className="mb-3 inline-block font-semibold text-medzo-blue">Back to home</Link>
            <p className="text-sm font-bold uppercase tracking-wider text-medzo-green">Pharmacy workspace</p>
            <h1 className="mt-2 text-2xl font-bold text-[#0a192f] sm:text-3xl">Pharmacist Dashboard</h1>
            <p className="mt-2 text-medzo-text-light">Search medicines and check current availability during a sale.</p>
            <p className="mt-2 text-sm font-semibold text-medzo-blue"><span>Signed in as</span> <span>{user?.firstName || user?.username} · {user?.staffId}</span></p>
          </div>
          <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Pharmacist quick actions">
            <Link to="/catalogue" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Full catalogue</Link>
            <Link to="/inventory" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">View inventory</Link>
            <Link to="/sales" className="gradient-btn rounded-lg px-5 py-3 text-center font-semibold text-white">Complete sale</Link>
            <Link to="/inventory/sale-issues" className="rounded-lg border border-medzo-blue bg-white px-5 py-3 text-center font-semibold text-medzo-blue hover:bg-blue-50">Sale updates</Link>
            <DashboardLogoutButton />
          </nav>
        </div>

        <section className="my-6 grid gap-4 sm:grid-cols-3" aria-label="Stock summary">
          <StockLevelCard label="Inventory medicines" value={inventory.items.length} />
          <StockLevelCard label="Units available" value={totalUnits} tone="green" />
          <StockLevelCard label="Low-stock medicines" value={lowStock} tone="red" />
        </section>

        <SaleWorkspace medicines={medicines.items} inventory={inventory.items} onCompleted={() => load(query)} />

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-2 text-medzo-blue"><Search aria-hidden="true" /></span>
            <div><h2 className="text-xl font-bold text-[#0a192f]">Find a medicine</h2><p className="text-sm text-medzo-text-light">Search by medicine, generic name, or manufacturer.</p></div>
          </div>
          <form onSubmit={submitSearch} role="search" className="flex flex-col gap-3 sm:flex-row">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Paracetamol" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20" />
            {query && <button type="button" onClick={clearSearch} disabled={status === 'loading'} className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-medzo-text-light hover:bg-slate-50 disabled:opacity-60">Clear</button>}
            <button type="submit" disabled={status === 'loading'} className="gradient-btn rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">{status === 'loading' ? 'Searching...' : 'Search'}</button>
          </form>
        </section>

        <section className="mt-6" aria-live="polite" aria-busy={status === 'loading'}>
          {status === 'loading' && <p className="rounded-2xl bg-white p-8 text-center text-medzo-text-light shadow-sm">Loading pharmacy data...</p>}
          {status === 'error' && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error}</p><button type="button" onClick={() => load(query)} className="mt-3 font-semibold underline">Try again</button></div>}
          {status === 'ready' && medicines.items.length > 0 && <><div className="mb-3 flex items-center gap-2 text-sm text-medzo-text-light"><ClipboardList size={18} aria-hidden="true" /><span>{medicines.totalCount} {medicines.totalCount === 1 ? 'medicine' : 'medicines'} found</span></div><MedicineTable medicines={medicines.items} canManage={false} /></>}
          {status === 'ready' && medicines.items.length === 0 && <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><Boxes className="mx-auto text-medzo-blue" aria-hidden="true" /><h2 className="mt-3 text-lg font-bold text-[#0a192f]">No medicines found</h2><p className="mt-2 text-medzo-text-light">Check the spelling or clear the search to restore the catalogue.</p><button type="button" onClick={clearSearch} className="mt-4 font-semibold text-medzo-blue hover:underline">Clear search</button></div>}
        </section>
      </div>
    </main>
  )
}
