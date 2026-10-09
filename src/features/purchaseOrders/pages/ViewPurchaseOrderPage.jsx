import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPurchaseOrder, receivePurchaseOrder } from '../api/purchaseOrdersApi'

export default function ViewPurchaseOrderPage() {
  const { purchaseOrderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [receiptItems, setReceiptItems] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPurchaseOrder(purchaseOrderId).then((result) => { setOrder(result); setReceiptItems(result.items.map((item) => ({ purchaseOrderItemId: item.id, batchNumber: '', expiryDate: '' }))) }).catch((requestError) => setError(requestError.message || 'Purchase order details could not be loaded.'))
  }, [purchaseOrderId])

  const receive = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try { setOrder(await receivePurchaseOrder(purchaseOrderId, { items: receiptItems })) }
    catch (requestError) {
      // A gateway may time out after the server has already persisted the
      // receipt. Re-read the order once so the user is not shown a false error.
      if (requestError.status === 502) {
        try {
          const latestOrder = await getPurchaseOrder(purchaseOrderId)
          if (latestOrder.status === 'RECEIVED') {
            setOrder(latestOrder)
            return
          }
        } catch { /* Preserve the original request error below. */ }
      }
      setError(requestError.message || 'Purchase order could not be marked as received.')
    }
    finally { setBusy(false) }
  }

  const updateReceiptItem = (index, field, value) => setReceiptItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))

  if (error) return <main className="min-h-screen bg-medzo-light-bg p-8"><p role="alert" className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p></main>
  if (!order) return <main className="min-h-screen bg-medzo-light-bg p-8 text-center text-medzo-text-light">Loading purchase order...</main>

  return <main className="min-h-screen bg-medzo-light-bg px-5 py-7 sm:px-8 lg:px-10"><div className="max-w-none">
    <Link to="/purchase-orders" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to purchase order</Link>
    <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">{order.orderNumber}</h1><p className="mt-2 text-medzo-text-light">Created {new Date(order.createdAtUtc).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-sm font-semibold ${order.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{order.status}</span></div>
    <section className="mx-auto max-w-[80rem] rounded-2xl bg-white p-6 shadow-sm"><dl className="mb-6"><dt className="text-sm font-medium text-slate-500">Supplier</dt><dd className="mt-1 text-lg font-bold text-[#0a192f]">{order.supplierName}</dd></dl><h2 className="mb-3 text-lg font-bold text-[#0a192f]">Order items</h2><div className="overflow-hidden rounded-xl border border-slate-200"><table className="min-w-full"><thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="px-4 py-3">Medicine</th><th className="px-4 py-3 text-right">Quantity</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-[#0a192f]">{item.medicineName}</td><td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td></tr>)}</tbody></table></div>{order.status === 'PENDING' ? <form onSubmit={receive} className="mt-8 border-t border-slate-100 pt-6"><h2 className="text-lg font-bold text-[#0a192f]">Receive purchase order</h2><p className="mt-1 text-sm text-medzo-text-light">Add the batch and expiry details to update stock automatically.</p><div className="mt-4 space-y-3">{order.items.map((item, index) => <div key={item.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]"><p className="self-end pb-3 font-semibold text-[#0a192f]">{item.medicineName} <span className="text-sm font-normal text-slate-500">× {item.quantity}</span></p><label className="text-sm font-semibold">Batch number <span className="text-red-600">*</span><input required value={receiptItems[index]?.batchNumber || ''} onChange={(event) => updateReceiptItem(index, 'batchNumber', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-[#f8fafc] p-3 font-normal outline-none focus:border-medzo-blue" /></label><label className="text-sm font-semibold">Expiry date <span className="text-red-600">*</span><input required type="date" min={new Date().toISOString().slice(0, 10)} value={receiptItems[index]?.expiryDate || ''} onChange={(event) => updateReceiptItem(index, 'expiryDate', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-[#f8fafc] p-3 font-normal outline-none focus:border-medzo-blue" /></label></div>)}</div><button disabled={busy} className="gradient-btn mt-6 rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Updating...' : 'Mark as received'}</button></form> : <p className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">Received on {new Date(order.receivedAtUtc).toLocaleString()}. Stock update has been sent to Inventory.</p>}</section>
  </div></main>
}
