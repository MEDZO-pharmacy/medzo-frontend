import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SupplierForm from '../components/SupplierForm'
import { deactivateSupplier, getSupplier, updateSupplier } from '../api/suppliersApi'

export default function EditSupplierPage() {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSupplier(supplierId).then(setSupplier).catch((requestError) => setError(requestError.message || 'Supplier details could not be loaded.'))
  }, [supplierId])

  const save = async (values) => {
    setBusy(true); setError('')
    try { setSupplier(await updateSupplier(supplierId, values)); setSaved(true) }
    catch (requestError) { setError(requestError.message || 'Supplier details could not be saved.') }
    finally { setBusy(false) }
  }

  const deactivate = async () => {
    if (!window.confirm(`Deactivate ${supplier.name}? It will no longer be available for new purchase orders.`)) return
    setBusy(true); setError('')
    try { await deactivateSupplier(supplierId); navigate('/suppliers', { state: { deactivatedSupplierName: supplier.name } }) }
    catch (requestError) { setError(requestError.message || 'Supplier could not be deactivated.') }
    finally { setBusy(false) }
  }

  if (error && !supplier) return <main className="min-h-screen bg-medzo-light-bg p-8"><p role="alert" className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p></main>
  if (!supplier) return <main className="min-h-screen bg-medzo-light-bg p-8 text-center text-medzo-text-light">Loading supplier...</main>

  return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl">
    <Link to="/suppliers" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to suppliers</Link>
    <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Edit supplier</h1><p className="mt-2 text-medzo-text-light">Update the supplier details and save your changes.</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{supplier.isActive ? 'Active' : 'Inactive'}</span>{supplier.isActive && <button type="button" onClick={deactivate} disabled={busy} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{busy ? 'Working...' : 'Deactivate'}</button>}</div></div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {saved && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">Supplier details updated successfully.</p>}
    <SupplierForm initial={supplier} onSubmit={save} busy={busy} submitLabel="Save changes" />
  </div></main>
}
