import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import MedicineSearch from '../components/MedicineSearch'
import MedicineTable from '../components/MedicineTable'
import { searchMedicines } from '../api/catalogueApi'

export default function CataloguePage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [data, setData] = useState({ items: [], totalCount: 0 })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async (search = '') => {
    const normalizedSearch = search.trim()
    setStatus('loading')
    setError('')
    try {
      const result = await searchMedicines({ search: normalizedSearch })
      setData(result)
      setAppliedQuery(normalizedSearch)
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.message || 'Medicines could not be loaded. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    let active = true
    searchMedicines()
      .then((result) => {
        if (!active) return
        setData(result)
        setStatus('ready')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Medicines could not be loaded. Please try again.')
        setStatus('error')
      })
    return () => { active = false }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    load(query)
  }

  const handleClear = () => {
    setQuery('')
    load('')
  }

  const canManage = user?.roles?.some((role) => ['Admin', 'InventoryManager'].includes(role))

  return (
    <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Medicine Catalogue</h1>
            <p className="mt-2 text-medzo-text-light">Find a medicine quickly by name, generic name, or manufacturer.</p>
          </div>
          {canManage && <Link to="/catalogue/new" className="gradient-btn self-start rounded-lg px-6 py-3 font-bold text-white">Add medicine</Link>}
        </div>

        <MedicineSearch value={query} onChange={setQuery} onSubmit={handleSubmit} onClear={handleClear} busy={status === 'loading'} />

        <section className="mt-6" aria-live="polite" aria-busy={status === 'loading'}>
          {status === 'loading' && <p className="rounded-2xl bg-white p-8 text-center text-medzo-text-light shadow-sm">Loading medicines…</p>}

          {status === 'error' && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p>{error}</p>
              <button type="button" onClick={() => load(appliedQuery)} className="mt-3 font-semibold underline">Try again</button>
            </div>
          )}

          {status === 'ready' && data.items.length > 0 && (
            <>
              <p className="mb-3 text-sm text-medzo-text-light">
                {data.totalCount} {data.totalCount === 1 ? 'medicine' : 'medicines'} found{appliedQuery ? ` for “${appliedQuery}”` : ''}.
              </p>
              <MedicineTable medicines={data.items} canManage={canManage} />
            </>
          )}

          {status === 'ready' && data.items.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm sm:p-10">
              <h2 className="text-lg font-bold text-[#0a192f]">No medicines found</h2>
              <p className="mt-2 text-medzo-text-light">No medicines match “{appliedQuery}”. Check the spelling or clear the search to view all medicines.</p>
              <button type="button" onClick={handleClear} className="mt-5 font-semibold text-medzo-blue hover:underline">Clear search</button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
