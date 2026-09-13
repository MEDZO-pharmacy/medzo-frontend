import { useEffect, useState } from 'react'
import PageBackLink from '../../../components/PageBackLink'
import LowStockTable from '../components/LowStockTable'
import { getLowStock } from '../api/inventoryApi'

const emptyResult = { items: [], page: 1, pageSize: 20, totalCount: 0 }

export default function LowStockPage() {
  const [data, setData] = useState(emptyResult)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getLowStock({ search, page, pageSize: 20 })
      .then((result) => { if (!cancelled) setData(result) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message || 'Low-stock medicines could not be loaded.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, reloadKey, search])

  const prepareLoad = () => { setLoading(true); setError('') }

  const submitSearch = (event) => {
    event.preventDefault()
    prepareLoad()
    setPage(1)
    setSearch(searchInput.trim())
    setReloadKey((value) => value + 1)
  }
  const clearSearch = () => {
    setSearchInput('')
    prepareLoad()
    setSearch('')
    setPage(1)
    setReloadKey((value) => value + 1)
  }
  const retry = () => { prepareLoad(); setReloadKey((value) => value + 1) }
  const changePage = (nextPage) => { prepareLoad(); setPage(nextPage) }
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize))

  return (
    <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <PageBackLink fallback="/inventory">Back to inventory</PageBackLink>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Low-stock medicines</h1>
            <p className="mt-2 text-[#4a5568]">Automatically flagged when quantity on hand is below the reorder threshold.</p>
          </div>
          <div className="rounded-xl bg-red-50 px-5 py-3 text-red-800"><span className="text-2xl font-bold">{data.totalCount}</span> <span className="font-semibold">need attention</span></div>
        </div>

        <form onSubmit={submitSearch} className="my-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row" role="search">
          <label htmlFor="low-stock-search" className="sr-only">Search low-stock medicines</label>
          <input id="low-stock-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by medicine or generic name" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:border-medzo-blue focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <button type="submit" className="gradient-btn rounded-lg px-6 py-3 font-semibold text-white">Search</button>
          {(search || searchInput) && <button type="button" onClick={clearSearch} className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">Clear</button>}
        </form>

        {loading && <p role="status" className="rounded-2xl bg-white p-10 text-center text-slate-600">Loading low-stock medicines…</p>}
        {!loading && error && <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={retry} className="rounded-lg border border-red-300 px-4 py-2 font-semibold hover:bg-red-100">Try again</button></div>}
        {!loading && !error && data.items.length > 0 && <LowStockTable items={data.items} />}
        {!loading && !error && data.items.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-sm"><p className="text-lg font-semibold text-[#0a192f]">{search ? `No low-stock medicines match “${search}”.` : 'All medicines are at or above their reorder thresholds.'}</p><p className="mt-2 text-slate-500">No manual stock check is required right now.</p></div>}

        {!loading && !error && data.totalCount > data.pageSize && <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Low-stock pagination"><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} className="rounded-lg border border-medzo-blue px-4 py-2 font-semibold text-medzo-blue disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-lg border border-medzo-blue px-4 py-2 font-semibold text-medzo-blue disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>}
      </div>
    </main>
  )
}
