import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listPurchaseOrders } from '../api/purchaseOrdersApi'

const dateTime = (value) => new Date(value).toLocaleString()

export default function PurchaseOrderHistoryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listPurchaseOrders().then(setOrders).catch((requestError) => setError(requestError.message || 'Purchase order history could not be loaded.')).finally(() => setLoading(false))
  }, [])

  return <main className="min-h-screen bg-medzo-light-bg px-5 py-7 sm:px-8 lg:px-10"><div className="max-w-none">
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Purchase order</h1><Link to="/purchase-orders/new" className="gradient-btn rounded-lg px-5 py-3 font-semibold text-white">Create purchase order</Link></div>
    {location.state?.createdOrderNumber && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"><strong>{location.state.createdOrderNumber}</strong> was created successfully with PENDING status.</p>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p className="text-medzo-text-light">Loading purchase orders...</p> : orders.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><h2 className="font-bold text-[#0a192f]">No purchase orders available</h2><p className="mt-2 text-medzo-text-light">Create a purchase order to begin tracking supplier requests.</p></div> : <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><table className="min-w-full"><thead className="bg-slate-50 text-left text-sm text-slate-600"><tr><th className="px-5 py-4">PO number</th><th className="px-5 py-4">Supplier</th><th className="px-5 py-4">Medicine name</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} onClick={() => navigate(`/purchase-orders/${order.id}`)} title="Click to view purchase order details" className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-[#0a192f]">{order.orderNumber}</td><td className="px-5 py-4 text-slate-700">{order.supplierName}</td><td className="px-5 py-4 text-slate-700">{order.items.map((item) => item.medicineName).join(', ')}</td><td className="px-5 py-4 text-sm text-slate-700">{dateTime(order.createdAtUtc)}</td><td className="px-5 py-4"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{order.status}</span></td></tr>)}</tbody></table></div>}
  </div></main>
}
