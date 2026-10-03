import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { deactivateSupplier, deleteInactiveSupplier, listSuppliers } from '../api/suppliersApi'

export default function SuppliersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listSuppliers().then(setSuppliers).catch((requestError) => setError(requestError.message || 'Suppliers could not be loaded.')).finally(() => setLoading(false))
  }, [])

  const deactivate = async (supplier) => {
    if (!window.confirm(`Deactivate ${supplier.name}? It will no longer be available for new purchase orders.`)) return
    setBusyId(supplier.id); setError('')
    try { await deactivateSupplier(supplier.id); setSuppliers((current) => current.map((item) => item.id === supplier.id ? { ...item, isActive: false } : item)) }
    catch (requestError) { setError(requestError.message || 'Supplier could not be deactivated.') }
    finally { setBusyId(null) }
  }

  const remove = async (supplier) => {
    if (!window.confirm(`Delete ${supplier.name}? This cannot be undone.`)) return
    setBusyId(supplier.id); setError('')
    try { await deleteInactiveSupplier(supplier.id); setSuppliers((current) => current.filter((item) => item.id !== supplier.id)) }
    catch (requestError) { setError(requestError.message || 'Supplier could not be deleted.') }
    finally { setBusyId(null) }
  }

  return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Suppliers</h1><Link to="/suppliers/new" className="gradient-btn rounded-lg px-5 py-3 font-semibold text-white">Add supplier</Link></div>
    {location.state?.createdSupplierName && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{location.state.createdSupplierName} added successfully.</p>}
    {location.state?.deactivatedSupplierName && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{location.state.deactivatedSupplierName} deactivated successfully.</p>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p className="text-medzo-text-light">Loading suppliers...</p> : suppliers.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-medzo-text-light">No suppliers have been added yet.</p></div> : <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><table className="min-w-full"><thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="px-5 py-4">Supplier</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{suppliers.map((supplier) => { const busy = busyId === supplier.id; return <tr key={supplier.id} onClick={() => navigate(`/suppliers/${supplier.id}`)} title="Click to view supplier details" className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-[#0a192f]">{supplier.name}</p></td><td className="px-5 py-4 text-sm text-slate-700">{supplier.contactName}<br />{supplier.phone}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{supplier.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-2">{supplier.isActive && <Link to={`/suppliers/${supplier.id}/edit`} onClick={(event) => event.stopPropagation()} className="rounded-lg border border-medzo-blue px-3 py-2 text-sm font-semibold text-medzo-blue hover:bg-blue-50">Edit</Link>}{supplier.isActive ? <button type="button" onClick={(event) => { event.stopPropagation(); deactivate(supplier) }} disabled={busy} className="rounded-lg border border-amber-500 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60">{busy ? 'Working...' : 'Deactivate'}</button> : <button type="button" onClick={(event) => { event.stopPropagation(); remove(supplier) }} disabled={busy} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">{busy ? 'Deleting...' : 'Delete'}</button>}</div></td></tr> })}</tbody></table></div>}
  </div></main>
}
