import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchMedicines } from '../../catalogue/api/catalogueApi'
import { createSale } from '../api/salesApi'
import ReceiptCard from '../components/ReceiptCard'

const newKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
export default function SalesPage() {
 const [medicines, setMedicines] = useState([])
 const [cart, setCart] = useState([])
 const [medicineId, setMedicineId] = useState('')
 const [quantity, setQuantity] = useState('1')
 const [loading, setLoading] = useState(true)
 const [submitting, setSubmitting] = useState(false)
 const [error, setError] = useState('')
 const [result, setResult] = useState(null)
 const [receiptNames, setReceiptNames] = useState({})
 const [requestKey, setRequestKey] = useState(newKey)

 useEffect(() => {
  let active = true
  searchMedicines({ pageSize: 100 }).then(data => { if (active) setMedicines(data.items || []) }).catch(e => active && setError(e.message || 'Medicines could not be loaded.')).finally(() => active && setLoading(false))
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
 }

 const submit = async () => {
  if (!cart.length || submitting) return
  setSubmitting(true)
  setError('')
  try {
   const medicineNames = Object.fromEntries(cart.map(item => [item.productId, item.medicineName]))
   const response = await createSale({ idempotencyKey: requestKey, items: cart.map(({ productId, quantity: itemQuantity }) => ({ productId, quantity: itemQuantity })) })
   setResult(response)
   setReceiptNames(medicineNames)
   setCart([])
   setRequestKey(newKey)

  } catch (e) {
   setError(e.message || 'The sale could not be completed. No stock was deducted.')
  } finally {
   setSubmitting(false)
  }
 }

 return <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl"><Link to="/pharmacist" className="font-semibold text-medzo-blue">Back to dashboard</Link><h1 className="mt-4 text-3xl font-bold text-[#0a192f]">Complete sale</h1><p className="mt-2 text-medzo-text-light">Add medicines and quantities. The backend automatically allocates the earliest-expiring eligible batches.</p>{error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}<form onSubmit={addItem} className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_10rem_auto]"><label className="font-semibold">Medicine<select aria-label="Medicine" value={medicineId} onChange={e => setMedicineId(e.target.value)} disabled={loading || submitting} className="mt-1 w-full rounded-lg border p-3"><option value="">Choose medicine</option>{medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="font-semibold">Quantity<input aria-label="Quantity" type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={submitting} className="mt-1 w-full rounded-lg border p-3" /></label><button disabled={loading || submitting} className="gradient-btn self-end rounded-lg px-5 py-3 font-bold text-white disabled:opacity-60">Add item</button></form><section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Sale items</h2>{!cart.length ? <p className="mt-3 text-medzo-text-light">No medicines added yet.</p> : <ul className="mt-3 divide-y">{cart.map(item => <li key={item.productId} className="flex items-center justify-between py-3"><span>{item.medicineName} × {item.quantity}</span><button type="button" onClick={() => setCart(items => items.filter(x => x.productId !== item.productId))} disabled={submitting} className="font-semibold text-red-700">Remove</button></li>)}</ul>}<button type="button" onClick={submit} disabled={!cart.length || submitting} className="gradient-btn mt-5 rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">{submitting ? 'Completing sale…' : 'Complete sale'}</button></section>{result && <section role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900"><h2 className="font-bold">Sale completed</h2>{result.alreadyProcessed && <p>This request was already processed; stock was not deducted again.</p>}</section>}<ReceiptCard receipt={result?.receipt} medicineNames={receiptNames} /></div></main>
}