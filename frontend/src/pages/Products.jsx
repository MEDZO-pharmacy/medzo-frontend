
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, PackageCheck, Pill, Search } from 'lucide-react'
import { browseAvailableMedicines } from '../features/catalogue/api/catalogueApi'

const emptyResult = { items: [], page: 1, pageSize: 12, totalCount: 0 }

export default function Products() {
  const [result, setResult] = useState(emptyResult)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    browseAvailableMedicines({ search, page, pageSize: 12 })
      .then((data) => { if (!cancelled) setResult(data) })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, reload, search])

  const prepareLoad = () => { setLoading(true); setError('') }
  const submit = (event) => { event.preventDefault(); prepareLoad(); setPage(1); setSearch(input.trim()); setReload((value) => value + 1) }
  const clear = () => { setInput(''); prepareLoad(); setPage(1); setSearch(''); setReload((value) => value + 1) }
  const changePage = (next) => { prepareLoad(); setPage(next) }
  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize))
  return <main className="min-h-[70vh] bg-medzo-light-bg">
    <section className="bg-[#0a192f] px-4 py-14 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-medzo-green">Medzo medicine catalogue</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">Find medicines currently available at Medzo.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Search our live public catalogue by medicine name, generic name, or manufacturer. Availability can change during the day.</p>
        <form onSubmit={submit} role="search" className="mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl bg-white p-3 sm:flex-row">
          <label htmlFor="public-medicine-search" className="sr-only">Search available medicines</label>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 px-4 text-slate-500"><Search size={20} aria-hidden="true" /><input id="public-medicine-search" value={input} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 py-3 text-[#0a192f] outline-none" placeholder="Medicine, generic name, or manufacturer" /></div>
          <button className="gradient-btn rounded-lg px-6 py-3 font-bold text-white" type="submit">Search catalogue</button>
          {(input || search) && <button className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700" type="button" onClick={clear}>Clear</button>}
        </form>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="available-heading">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="available-heading" className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Available medicines</h2><p className="mt-1 text-medzo-text-light">{search ? `Results for “${search}”` : 'Products with stock currently on hand'}</p></div>{!loading && !error && <p className="font-semibold text-medzo-blue">{result.totalCount} product{result.totalCount === 1 ? '' : 's'}</p>}</div>
      {loading && <div role="status" className="rounded-2xl bg-white p-12 text-center text-slate-600 shadow-sm">Loading available medicines…</div>}
      {!loading && error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><div className="flex items-center gap-3"><AlertCircle aria-hidden="true" /><p>{error}</p></div><button type="button" onClick={() => { prepareLoad(); setReload((value) => value + 1) }} className="mt-4 rounded-lg border border-red-300 px-4 py-2 font-semibold">Try again</button></div>}
      {!loading && !error && result.items.length === 0 && <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><PackageCheck className="mx-auto text-medzo-green" size={38} aria-hidden="true" /><h3 className="mt-4 text-xl font-bold text-[#0a192f]">No available medicines found</h3><p className="mt-2 text-medzo-text-light">Try another spelling or contact our pharmacy team for assistance.</p>{search && <button type="button" onClick={clear} className="mt-4 font-semibold text-medzo-blue hover:underline">Show all available medicines</button>}</div>}
      {!loading && !error && result.items.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{result.items.map((medicine) => <article key={medicine.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-blue-50 p-3 text-medzo-blue"><Pill aria-hidden="true" /></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${medicine.lowStock ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'}`}>{medicine.lowStock ? 'Limited stock' : 'Available'}</span></div><h3 className="mt-5 text-xl font-bold text-[#0a192f]">{medicine.name}</h3><p className="mt-1 text-sm text-medzo-text-light">Generic: {medicine.genericName}</p><dl className="mt-5 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Manufacturer</dt><dd className="text-right font-semibold">{medicine.manufacturer}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Dosage form</dt><dd className="font-semibold">{medicine.dosageForm}</dd></div>{medicine.categoryName && <div className="flex justify-between gap-3"><dt className="text-slate-500">Category</dt><dd className="font-semibold">{medicine.categoryName}</dd></div>}</dl><div className="mt-auto pt-6"><p className="text-2xl font-bold text-medzo-blue">Rs. {Number(medicine.unitPrice).toFixed(2)}</p><p className="mt-2 text-xs leading-5 text-slate-500">Price and availability are indicative. A pharmacist will confirm before dispensing.</p></div></article>)}</div>}
      {!loading && !error && result.totalCount > result.pageSize && <nav aria-label="Product pagination" className="mt-8 flex items-center justify-center gap-4"><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} className="rounded-lg border border-medzo-blue px-4 py-2 font-semibold text-medzo-blue disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-lg border border-medzo-blue px-4 py-2 font-semibold text-medzo-blue disabled:opacity-40">Next</button></nav>}
      <div className="mt-10 rounded-2xl bg-[#0a192f] p-6 text-white sm:flex sm:items-center sm:justify-between sm:p-8"><div><h2 className="text-xl font-bold">Need help choosing a product?</h2><p className="mt-2 text-slate-300">Speak with a qualified pharmacist before starting or changing medication.</p></div><Link to="/contact" className="mt-5 inline-block rounded-lg bg-white px-6 py-3 font-bold text-[#0a192f] sm:mt-0">Contact Medzo</Link></div>
    </section>
  </main>
}
