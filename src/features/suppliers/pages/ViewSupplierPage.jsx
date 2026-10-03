import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSupplier } from '../api/suppliersApi'

export default function ViewSupplierPage() {
  const { supplierId } = useParams()
  const [supplier, setSupplier] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSupplier(supplierId)
      .then(setSupplier)
      .catch((requestError) => setError(requestError.message || 'Supplier details could not be loaded.'))
  }, [supplierId])

  return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-4xl">
      <Link to="/suppliers" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to suppliers</Link>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      {!error && !supplier && <p className="mt-5 text-medzo-text-light">Loading supplier...</p>}
      {supplier && <>
        <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">{supplier.name}</h1>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{supplier.isActive ? 'Active' : 'Inactive'}</span>
            {supplier.isActive && <Link to={`/suppliers/${supplier.id}/edit`} className="rounded-lg border border-medzo-blue px-4 py-2 text-sm font-semibold text-medzo-blue hover:bg-blue-50">Edit supplier</Link>}
          </div>
        </div>
        <dl className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
          {[
            ['Supplier name', supplier.name],
            ['Contact person', supplier.contactName],
            ['Email', supplier.email],
            ['Contact number', supplier.phone],
            ['Address', supplier.address || 'Not provided'],
          ].map(([label, value]) => <div key={label}><dt className="text-sm font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-[#0a192f]">{value}</dd></div>)}
        </dl>
      </>}
    </div>
  </main>
}
