import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, ClipboardList, History, PackageSearch, Search, ShoppingCart } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { searchMedicines } from '../features/catalogue/api/catalogueApi'
import MedicineTable from '../features/catalogue/components/MedicineTable'
import { getInventory } from '../features/inventory/api/inventoryApi'
import StockLevelCard from '../features/inventory/components/StockLevelCard'
import SaleWorkspace from '../features/sales/components/SaleWorkspace'
import Header from '../components/Header'

const actionClass = 'flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-[#0a192f] shadow-sm transition hover:-translate-y-0.5 hover:border-medzo-blue hover:shadow-md'

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
  const submitSearch = (event) => { event.preventDefault(); load(query) }
  const clearSearch = () => { setQuery(''); load('') }
  const handleSaleCompleted = async () => { await load(query) }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f4f8ff]">
        <section className="overflow-hidden bg-[#0a192f] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.35fr_.65fr] lg:px-10 lg:py-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300"><ShoppingCart size={16} /> Pharmacy workspace</p>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Make every sale clear, safe, and ready for the customer.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">Find available medicine, complete a sale, and keep an accurate record of every item dispensed.</p>
              <p className="mt-6 text-sm font-semibold text-cyan-300">Signed in as {user?.firstName || user?.username} · {user?.staffId}</p>
            </div>
            <div className="self-center rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm"><p className="text-sm font-semibold text-cyan-300">Today’s inventory</p><p className="mt-3 text-3xl font-bold">{totalUnits} units available</p><p className="mt-3 text-sm leading-6 text-slate-200">Search the catalogue and confirm availability before completing a sale.</p></div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-6" aria-label="Pharmacist quick actions">
              <div className="mb-5"><p className="text-sm font-bold text-medzo-blue">Quick actions</p><p className="mt-1 text-sm text-slate-500">Start where you need to.</p></div>
              <nav className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Link to="/catalogue" className={actionClass}><PackageSearch size={18} className="text-medzo-blue" />Medicine catalogue</Link>
                <Link to="/inventory" className={actionClass}><Boxes size={18} className="text-medzo-green" />View inventory</Link>
                <Link to="/pharmacist/sales-history" className={actionClass}><History size={18} className="text-medzo-blue" />Sales history</Link>
              </nav>
            </aside>

            <div className="min-w-0">
              <section className="grid gap-4 sm:grid-cols-3" aria-label="Stock summary">
                <StockLevelCard label="Medicines available" value={inventory.items.length} />
                <StockLevelCard label="Units available" value={totalUnits} tone="green" />
                <StockLevelCard label="Low-stock medicines" value={lowStock} tone="red" />
              </section>

              <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
                <div className="mb-5"><p className="text-sm font-bold text-medzo-blue">Complete a sale</p><h2 className="mt-1 text-2xl font-bold text-[#0a192f]">Prepare a customer purchase</h2><p className="mt-2 text-sm text-slate-500">Add available medicines and complete the sale to generate a receipt.</p></div>
                <SaleWorkspace medicines={medicines.items} inventory={inventory.items} onCompleted={handleSaleCompleted} pharmacistUsername={user?.username || user?.firstName} />
              </section>

              <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
                <div className="mb-5 flex items-center gap-3"><span className="rounded-2xl bg-blue-50 p-3 text-medzo-blue"><Search aria-hidden="true" /></span><div><p className="text-sm font-bold text-medzo-blue">Medicine catalogue</p><h2 className="mt-1 text-2xl font-bold text-[#0a192f]">Find an available medicine</h2><p className="mt-1 text-sm text-slate-500">Search by medicine, generic name, or manufacturer.</p></div></div>
                <form onSubmit={submitSearch} role="search" className="flex flex-col gap-3 sm:flex-row">
                  <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Paracetamol" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20" />
                  {query && <button type="button" onClick={clearSearch} disabled={status === 'loading'} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">Clear</button>}
                  <button type="submit" disabled={status === 'loading'} className="rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-3 font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60">{status === 'loading' ? 'Searching...' : 'Search catalogue'}</button>
                </form>
                <div className="mt-6 border-t border-slate-100 pt-6" aria-live="polite" aria-busy={status === 'loading'}>
                  {status === 'loading' && <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Loading pharmacy data...</p>}
                  {status === 'error' && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error}</p><button type="button" onClick={() => load(query)} className="mt-3 font-semibold underline">Try again</button></div>}
                  {status === 'ready' && medicines.items.length > 0 && <><div className="mb-3 flex items-center gap-2 text-sm text-slate-500"><ClipboardList size={18} aria-hidden="true" /><span>{medicines.totalCount} {medicines.totalCount === 1 ? 'medicine' : 'medicines'} found</span></div><MedicineTable medicines={medicines.items} canManage={false} /></>}
                  {status === 'ready' && medicines.items.length === 0 && <div className="rounded-2xl bg-slate-50 p-8 text-center"><Boxes className="mx-auto text-medzo-blue" aria-hidden="true" /><h3 className="mt-3 text-lg font-bold text-[#0a192f]">No medicines found</h3><p className="mt-2 text-slate-500">Check the spelling or clear the search to restore the catalogue.</p><button type="button" onClick={clearSearch} className="mt-4 font-semibold text-medzo-blue hover:underline">Clear search</button></div>}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}