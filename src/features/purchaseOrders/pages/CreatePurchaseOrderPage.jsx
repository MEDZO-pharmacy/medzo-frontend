import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { searchMedicines } from '../../catalogue/api/catalogueApi'
import { listSuppliers } from '../../suppliers/api/suppliersApi'
import { createPurchaseOrder } from '../api/purchaseOrdersApi'

const emptyItem = () => ({ medicineId: '', quantity: 1 })

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listSuppliers({ activeOnly: true }), searchMedicines({ pageSize: 100 })])
      .then(([supplierRows, medicineResult]) => { setSuppliers(supplierRows); setMedicines(medicineResult.items || []); const medicineId = searchParams.get('medicineId'); if (medicineId && medicineResult.items?.some((medicine) => medicine.id === medicineId)) setItems([{ medicineId, quantity: Math.max(Number(searchParams.get('quantity')) || 1, 1) }]) })
      .catch((requestError) => setError(requestError.message || 'Purchase order options could not be loaded.'))
      .finally(() => setLoading(false))
  }, [searchParams])

  const updateItem = (index, key, value) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  const removeItem = (index) => setItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))

  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    const orderItems = items.map((item) => {
      const medicine = medicines.find((row) => row.id === item.medicineId)
      return { medicineId: item.medicineId, medicineName: medicine?.name || '', quantity: Number(item.quantity) }
    })
    try { const created = await createPurchaseOrder({ supplierId, items: orderItems }); navigate('/purchase-orders', { state: { createdOrderNumber: created.orderNumber } }) }
    catch (requestError) { setError(requestError.message || 'Purchase order could not be created.') }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-medzo-light-bg px-5 py-7 sm:px-8 lg:px-10"><div className="max-w-none">
    <Link to="/purchase-orders" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to purchase order</Link>
    <h1 className="mb-8 mt-4 text-2xl font-bold text-[#0a192f] sm:text-3xl">Create purchase order</h1>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p className="text-medzo-text-light">Loading suppliers and medicines...</p> : <form onSubmit={submit} className="mx-auto max-w-[80rem] space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
      <label className="block text-sm font-semibold text-[#0a192f]">Supplier <span className="text-red-600">*</span><select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-[#f8fafc] p-3 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20"><option value="">Select an active supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
      {suppliers.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No active suppliers are available. Add or reactivate a supplier before creating an order.</p>}
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-[#0a192f]">Medicine items</h2><button type="button" onClick={() => setItems((current) => [...current, emptyItem()])} className="text-sm font-semibold text-medzo-blue hover:underline">+ Add medicine</button></div><div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"><label className="text-sm font-semibold text-[#0a192f]">Medicine <span className="text-red-600">*</span><select required value={item.medicineId} onChange={(event) => updateItem(index, 'medicineId', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-[#f8fafc] p-3 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20"><option value="">Select medicine</option>{medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} {medicine.genericName ? `(${medicine.genericName})` : ''}</option>)}</select></label><label className="text-sm font-semibold text-[#0a192f]">Quantity <span className="text-red-600">*</span><input required min="1" type="number" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-[#f8fafc] p-3 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20" /></label><button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="self-end rounded-lg px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Remove</button></div>)}</div></section>
      <p className="text-sm text-medzo-text-light"><span className="text-red-600">*</span> Required fields</p><button type="submit" disabled={busy || suppliers.length === 0 || medicines.length === 0} className="gradient-btn rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Creating order...' : 'Create purchase order'}</button>
    </form>}
  </div></main>
}
