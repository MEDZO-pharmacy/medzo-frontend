import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MedicineSearch from '../../catalogue/components/MedicineSearch'
import { createSale, getSaleReceipt, searchSaleItems } from '../api/salesApi'
import ReceiptCard from '../components/ReceiptCard'

const newKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`

export default function SalesPage() {
 const [medicines, setMedicines] = useState([])
 const [query, setQuery] = useState('')
 const [appliedQuery, setAppliedQuery] = useState('')
 const [cart, setCart] = useState([])
 const [medicineId, setMedicineId] = useState('')
 const [quantity, setQuantity] = useState('1')
 const [status, setStatus] = useState('loading')
 const [submitting, setSubmitting] = useState(false)
 const [error, setError] = useState('')
 const [result, setResult] = useState(null)
 const [receipt, setReceipt] = useState(null)
 const [receiptError, setReceiptError] = useState('')
 const [receiptNames, setReceiptNames] = useState({})
 const [requestKey, setRequestKey] = useState(newKey)

 const loadMedicines = useCallback(async (search = '') => {
  const normalizedSearch = search.trim()
  setStatus('loading')
  setError('')
  try {
   const data = await searchSaleItems({ search: normalizedSearch, pageSize: 100 })
   setMedicines(data.items || [])
   setAppliedQuery(normalizedSearch)
   setMedicineId('')
   setStatus('ready')
  } catch (requestError) {
   setError(requestError.message || 'Medicines could not be loaded. Please try again.')
   setStatus('error')
  }
 }, [])

 useEffect(() => {
  let active = true
  searchSaleItems({ pageSize: 100 })
   .then(data => { if (active) { setMedicines(data.items || []); setStatus('ready') } })
   .catch(requestError => { if (active) { setError(requestError.message || 'Medicines could not be loaded. Please try again.'); setStatus('error') } })
  return () => { active = false }
 }, [])

 const selected = useMemo(() => medicines.find(x => x.id === medicineId), [medicines, medicineId])
 const addItem = event => {
  event.preventDefault()
  const amount = Number(quantity)
  if (!selected) return setError('Choose a medicine.')
  if (!Number.isInteger(amount) || amount <= 0) return setError('Enter a positive whole quantity.')
  if (cart.some(x => x.productId === selected.id)) return setError('This medicine is already in the sale.')
  setCart(items => [...items, { productId: selected.id, medicineName: selected.name, quantity: amount }])
  setMedicineId('')
  setQuantity('1')
  setError('')
  setResult(null)
  setReceipt(null)
  setReceiptError('')
 }
 const clearSearch = () => { setQuery(''); loadMedicines('') }
 const submit = async () => {
  if (!cart.length || submitting) return
  setSubmitting(true)
  setError('')
  setReceiptError('')
  try {
   const medicineNames = Object.fromEntries(cart.map(item => [item.productId, item.medicineName]))
   const response = await createSale({ idempotencyKey: requestKey, items: cart.map(({ productId, quantity: itemQuantity }) => ({ productId, quantity: itemQuantity })) })
   setResult(response)
   setReceiptNames(medicineNames)
   setCart([])
   setRequestKey(newKey)
   try {
    setReceipt(await getSaleReceipt(response.saleId))
   } catch {
    setReceipt(response.receipt || null)
    setReceiptError(response.receipt
     ? 'Sale completed. The saved receipt could not be refreshed, so the receipt shown is from the completed sale.'
     : 'Sale completed, but the receipt could not be loaded. Please try again from the sale record.')
   }
  } catch (requestError) {
   setError(requestError.message || 'The sale could not be completed. No stock was deducted.')
  } finally { setSubmitting(false) }
 }

 return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl">
  <Link to="/pharmacist" className="font-semibold text-medzo-blue">Back to dashboard</Link>
  <h1 className="mt-4 text-3xl font-bold text-[#0a192f]">Complete sale</h1>
  <p className="mt-2 text-medzo-text-light">Search for medicines, add them to the sale, and let the backend allocate the earliest-expiring eligible batches.</p>
  {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
  <div className="mt-6"><MedicineSearch value={query} onChange={setQuery} onSubmit={event => { event.preventDefault(); loadMedicines(query) }} onClear={clearSearch} busy={status === 'loading' || submitting} /></div>
  <section className="mt-4" aria-live="polite" aria-busy={status === 'loading'}>
   {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-center text-medzo-text-light shadow-sm">Loading medicines…</p>}
   {status === 'error' && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{error}</p><button type="button" onClick={() => loadMedicines(appliedQuery)} className="mt-3 font-semibold underline">Try again</button></div>}
   {status === 'ready' && medicines.length === 0 && <div className="rounded-2xl bg-white p-6 text-center shadow-sm"><h2 className="text-lg font-bold text-[#0a192f]">No items found</h2><p className="mt-2 text-medzo-text-light">{appliedQuery ? `No medicines match “${appliedQuery}”.` : 'There are no medicines available to add to this sale.'}</p>{appliedQuery && <button type="button" onClick={clearSearch} className="mt-4 font-semibold text-medzo-blue hover:underline">Clear search</button>}</div>}
   {status === 'ready' && medicines.length > 0 && <p className="text-sm text-medzo-text-light">{medicines.length} {medicines.length === 1 ? 'item' : 'items'} found{appliedQuery ? ` for “${appliedQuery}”` : ''}. Select an item to add it to the sale.</p>}
  </section>
  <form onSubmit={addItem} className="mt-4 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_10rem_auto]"><label className="font-semibold">Medicine<select aria-label="Medicine" value={medicineId} onChange={e => setMedicineId(e.target.value)} disabled={status !== 'ready' || submitting || medicines.length === 0} className="mt-1 w-full rounded-lg border p-3"><option value="">Choose medicine</option>{medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="font-semibold">Quantity<input aria-label="Quantity" type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={submitting} className="mt-1 w-full rounded-lg border p-3" /></label><button disabled={status !== 'ready' || submitting || medicines.length === 0} className="gradient-btn self-end rounded-lg px-5 py-3 font-bold text-white disabled:opacity-60">Add item</button></form>
  <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Sale items</h2>{!cart.length ? <p className="mt-3 text-medzo-text-light">No medicines added yet.</p> : <ul className="mt-3 divide-y">{cart.map(item => <li key={item.productId} className="flex items-center justify-between py-3"><span>{item.medicineName} × {item.quantity}</span><button type="button" onClick={() => setCart(items => items.filter(x => x.productId !== item.productId))} disabled={submitting} className="font-semibold text-red-700">Remove</button></li>)}</ul>}<button type="button" onClick={submit} disabled={!cart.length || submitting} className="gradient-btn mt-5 rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">{submitting ? 'Completing sale…' : 'Complete sale'}</button></section>
  {result && <section role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900"><h2 className="font-bold">Sale completed</h2>{result.alreadyProcessed && <p>This request was already processed; stock was not deducted again.</p>}{result.items?.map(item => <div key={item.productId} className="mt-3"><p className="font-semibold">{item.productId} — {item.quantity} units</p><ul className="list-disc pl-5">{item.batchAllocations?.map(allocation => <li key={allocation.batchId}>Batch {allocation.batchNumber}: {allocation.quantity} units</li>)}</ul></div>)}</section>}
  {receiptError && <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">{receiptError}</p>}
  <ReceiptCard receipt={receipt} medicineNames={receiptNames} />
 </div></main>
}