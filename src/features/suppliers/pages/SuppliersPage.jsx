import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSuppliers } from '../api/suppliersApi'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { listSuppliers().then(setSuppliers).catch((requestError) => setError(requestError.message || 'Suppliers could not be loaded.')).finally(() => setLoading(false)) }, [])

  return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-6xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Suppliers</h1><p className="mt-2 text-medzo-text-light">View supplier details and keep active records up to date.</p></div><Link to="/suppliers/new" className="gradient-btn rounded-lg px-5 py-3 font-semibold text-white">Add supplier</Link></div>{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}{loading ? <p className="text-medzo-text-light">Loading suppliers…</p> : suppliers.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-medzo-text-light">No suppliers have been added yet.</p></div> : <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><table className="min-w-full"><thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="px-5 py-4">Supplier</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Status</th><th className="px-5 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id} className="border-t border-slate-100"><td className="px-5 py-4"><p className="font-semibold text-[#0a192f]">{supplier.name}</p><p className="text-sm text-medzo-text-light">{supplier.email}</p></td><td className="px-5 py-4 text-sm text-slate-700">{supplier.contactName}<br />{supplier.phone}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{supplier.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-5 py-4 text-right"><Link to={`/suppliers/${supplier.id}/edit`} className="font-semibold text-medzo-blue hover:underline">View / edit</Link></td></tr>)}</tbody></table></div>}</div></main>
}
