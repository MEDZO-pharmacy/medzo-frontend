import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SupplierForm from '../components/SupplierForm'
import { createSupplier } from '../api/suppliersApi'

export default function AddSupplierPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [duplicate, setDuplicate] = useState(null)
  const save = async (values, allowDuplicate = false) => { setBusy(true); setError(''); try { const created = await createSupplier({ ...values, allowDuplicate }); navigate('/suppliers', { state: { createdSupplierName: created.name } }) } catch (requestError) { if (requestError.status === 409 && !allowDuplicate) setDuplicate(values); else setError(requestError.message || 'The supplier could not be saved. Please try again.') } finally { setBusy(false) } }
  return <main className="min-h-screen bg-medzo-light-bg px-5 py-7 sm:px-8 lg:px-10"><div className="max-w-none"><Link to="/suppliers" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to suppliers</Link><h1 className="mb-8 mt-4 text-2xl font-bold text-[#0a192f] sm:text-3xl">Add supplier</h1>{error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}{duplicate && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900"><h2 className="font-bold">Potential duplicate supplier</h2><p className="mt-1">A supplier with the same name or email already exists. Review the details before saving another record.</p><div className="mt-4 flex gap-3"><button onClick={() => save(duplicate, true)} disabled={busy} className="rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save duplicate anyway'}</button><button onClick={() => setDuplicate(null)} className="rounded-lg border border-amber-400 px-5 py-2.5 font-semibold">Review form</button></div></div>}<SupplierForm onSubmit={save} onChange={() => setDuplicate(null)} busy={busy} /></div></main>
}
