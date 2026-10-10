import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listPurchaseOrders } from '../api/purchaseOrdersApi'
import { getLowStock } from '../../inventory/api/inventoryApi'

const dateTime = (value) => new Intl.DateTimeFormat('en-LK', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Colombo',
}).format(new Date(value))

export default function PurchaseOrderHistoryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [reorderItems, setReorderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listPurchaseOrders(), getLowStock({ pageSize: 100 })])
      .then(([purchaseOrders, lowStock]) => { setOrders(purchaseOrders); setReorderItems(lowStock.items || []) })
      .catch((requestError) => setError(requestError.message || 'Purchase order history could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  return <main className="min-h-screen bg-medzo-light-bg px-5 py-7 sm:px-8 lg:px-10"><div className="max-w-none">
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Purchase order</h1><Link to="/purchase-orders/new" className="gradient-btn rounded-lg px-5 py-3 font-semibold text-white">Create purchase order</Link></div>
    {location.state?.createdOrderNumber && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"><strong>{location.state.createdOrderNumber}</strong> was created successfully with PENDING status.</p>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {!loading && reorderItems.length > 0 && <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="text-lg font-bold text-[#0a192f]">Reorder suggestions</h2><p className="mt-1 text-sm text-amber-900">These medicines are below their configured reorder level.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{reorderItems.length} item{reorderItems.length === 1 ? '' : 's'}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{reorderItems.map((item) => { const suggestedQuantity = Math.max(item.reorderThreshold - item.quantityOnHand, 1); return <article key={item.medicineId} className="rounded-xl bg-white p-4 shadow-sm"><h3 className="font-bold text-[#0a192f]">{item.name}</h3><p className="mt-1 text-sm text-slate-600">On hand: <strong>{item.quantityOnHand}</strong> · Reorder level: <strong>{item.reorderThreshold}</strong></p><button type="button" onClick={() => navigate(`/purchase-orders/new?medicineId=${item.medicineId}&quantity=${suggestedQuantity}`)} className="mt-4 rounded-lg border border-medzo-blue px-4 py-2 text-sm font-semibold text-medzo-blue hover:bg-blue-50">Create purchase order</button></article> })}</div></section>}
    {loading ? <p className="text-medzo-text-light">Loading purchase orders...</p> : orders.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><h2 className="font-bold text-[#0a192f]">No purchase orders available</h2><p className="mt-2 text-medzo-text-light">Create a purchase order to begin tracking supplier requests.</p></div> : <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><table className="min-w-full"><thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="px-5 py-4">PO number</th><th className="px-5 py-4">Supplier</th><th className="px-5 py-4">Medicine name</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} onClick={() => navigate(`/purchase-orders/${order.id}`)} title="Click to view purchase order details" className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-[#0a192f]">{order.orderNumber}</td><td className="px-5 py-4 text-slate-700">{order.supplierName}</td><td className="px-5 py-4 text-slate-700">{order.items.map((item) => item.medicineName).join(', ')}</td><td className="px-5 py-4 text-sm text-slate-700">{dateTime(order.createdAtUtc)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{order.status}</span></td></tr>)}</tbody></table></div>}
  </div></main>
}
