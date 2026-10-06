import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPurchaseOrder } from '../api/purchaseOrdersApi'

export default function ViewPurchaseOrderPage() {
  const { purchaseOrderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPurchaseOrder(purchaseOrderId).then(setOrder).catch((requestError) => setError(requestError.message || 'Purchase order details could not be loaded.'))
  }, [purchaseOrderId])

  if (error) return <main className="min-h-screen bg-medzo-light-bg p-8"><p role="alert" className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p></main>
  if (!order) return <main className="min-h-screen bg-medzo-light-bg p-8 text-center text-medzo-text-light">Loading purchase order...</main>

  return <main className="min-h-screen bg-medzo-light-bg px-5 py-7 sm:px-8 lg:px-10"><div className="max-w-none">
    <Link to="/purchase-orders" className="text-sm font-semibold text-medzo-blue hover:underline">← Back to purchase order</Link>
    <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">{order.orderNumber}</h1><p className="mt-2 text-medzo-text-light">Created {new Date(order.createdAtUtc).toLocaleString()}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{order.status}</span></div>
    <section className="mx-auto max-w-[80rem] rounded-2xl bg-white p-6 shadow-sm"><dl className="mb-6"><dt className="text-sm font-medium text-slate-500">Supplier</dt><dd className="mt-1 text-lg font-bold text-[#0a192f]">{order.supplierName}</dd></dl><h2 className="mb-3 text-lg font-bold text-[#0a192f]">Order items</h2><div className="overflow-hidden rounded-xl border border-slate-200"><table className="min-w-full"><thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="px-4 py-3">Medicine</th><th className="px-4 py-3 text-right">Quantity</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-[#0a192f]">{item.medicineName}</td><td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td></tr>)}</tbody></table></div></section>
  </div></main>
}
