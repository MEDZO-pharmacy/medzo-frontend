import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchMedicines } from '../../catalogue/api/catalogueApi'
import { listSuppliers } from '../../suppliers/api/suppliersApi'
import { createPurchaseOrder } from '../api/purchaseOrdersApi'

const emptyItem = () => ({ medicineId: '', quantity: 1 })

export default function CreatePurchaseOrderPage() {
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  useEffect(() => {
    Promise.all([listSuppliers({ activeOnly: true }), searchMedicines({ pageSize: 100 })])
      .then(([supplierRows, medicineResult]) => { setSuppliers(supplierRows); setMedicines(medicineResult.items || []) })
      .catch((requestError) => setError(requestError.message || 'Purchase order options could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const updateItem = (index, key, value) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  const removeItem = (index) => setItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))

  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    const orderItems = items.map((item) => {
      const medicine = medicines.find((row) => row.id === item.medicineId)
      return { medicineId: item.medicineId, medicineName: medicine?.name || '', quantity: Number(item.quantity) }
    })
    try { setCreated(await createPurchaseOrder({ supplierId, items: orderItems })) }
    catch (requestError) { setError(requestError.message || 'Purchase order could not be created.') }
    finally { setBusy(false) }
  }

  if (created) return <main className="min-h-screen bg-medzo-light-bg px-4 py-10"><div role="status" className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-[#0a192f]">Purchase order created</h1><p className="mt-3 text-medzo-text-light"><strong>{created.orderNumber}</strong> was created with PENDING status.</p><Link to="/purchase-orders/new" onClick={() => { setCreated(null); setSupplierId(''); setItems([emptyItem()]) }} className="mt-6 inline-block rounded-lg border border-medzo-blue px-6 py-3 font-semibold text-medzo-blue">Create another order</Link></div></main>

  return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl">
    <Link to="/suppliers" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to suppliers</Link>
    <h1 className="mt-4 text-2xl font-bold text-[#0a192f] sm:text-3xl">Create purchase order</h1>
    <p className="mb-6 mt-2 text-medzo-text-light">Choose an active supplier and the medicines to order.</p>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p className="text-medzo-text-light">Loading suppliers and medicines...</p> : <form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold text-slate-700">Supplier<select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-3"><option value="">Select an active supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
      {suppliers.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No active suppliers are available. Add or reactivate a supplier before creating an order.</p>}
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-[#0a192f]">Medicine items</h2><button type="button" onClick={() => setItems((current) => [...current, emptyItem()])} className="text-sm font-semibold text-medzo-blue hover:underline">+ Add medicine</button></div><div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"><label className="text-sm font-semibold text-slate-700">Medicine<select required value={item.medicineId} onChange={(event) => updateItem(index, 'medicineId', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-3"><option value="">Select medicine</option>{medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} {medicine.genericName ? `(${medicine.genericName})` : ''}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Quantity<input required min="1" type="number" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-3" /></label><button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="self-end rounded-lg px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Remove</button></div>)}</div></section>
      <button type="submit" disabled={busy || suppliers.length === 0 || medicines.length === 0} className="gradient-btn rounded-lg px-6 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Creating order...' : 'Create purchase order'}</button>
    </form>}
  </div></main>
}
