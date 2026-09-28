import { useCallback, useEffect, useState } from 'react'
import PageBackLink from '../../../components/PageBackLink'
import { getNearExpiryAlerts } from '../api/expiryAlertsApi'

const empty = { items: [], page: 1, pageSize: 20, totalCount: 0 }

export default function NearExpiryAlertsPage() {
  const [withinDays, setWithinDays] = useState(30)
  const [data, setData] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const applyResult = useCallback((request) => {
    request
      .then(setData)
      .catch((requestError) => setError(requestError.message || 'Near-expiry batches could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    applyResult(getNearExpiryAlerts({ withinDays }))
  }, [applyResult, withinDays])

  useEffect(() => {
    applyResult(getNearExpiryAlerts({ withinDays }))
  }, [applyResult, withinDays])

  return <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-7xl">
    <PageBackLink fallback="/inventory">Back to inventory</PageBackLink>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Near-expiry batches</h1><p className="mt-2 text-[#4a5568]">Prioritise these batches for sale or safe removal.</p></div><div className="rounded-xl bg-amber-50 px-5 py-3 text-amber-900"><span className="text-2xl font-bold">{data.totalCount}</span> <span className="font-semibold">need attention</span></div></div>
    <label className="my-6 flex max-w-sm flex-col gap-2 rounded-2xl bg-white p-4 font-semibold shadow-sm">Alert window<select aria-label="Alert window" value={withinDays} onChange={(event) => { setLoading(true); setError(''); setWithinDays(Number(event.target.value)) }} className="rounded-lg border p-3"><option value={7}>Next 7 days</option><option value={30}>Next 30 days</option><option value={60}>Next 60 days</option><option value={90}>Next 90 days</option></select></label>
    {loading && <p role="status" className="rounded-2xl bg-white p-10 text-center text-slate-600">Checking expiry dates…</p>}
    {!loading && error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><p>{error}</p><button type="button" onClick={load} className="mt-3 font-semibold underline">Try again</button></div>}
    {!loading && !error && data.items.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-sm"><p className="text-lg font-semibold text-[#0a192f]">No active batches expire within {withinDays} days.</p></div>}
    {!loading && !error && data.items.length > 0 && <div className="overflow-x-auto rounded-2xl bg-white shadow-sm" role="region" aria-label="Near-expiry batches"><table className="min-w-[680px] w-full text-left"><thead className="bg-amber-50 text-sm text-amber-900"><tr><th className="p-4">Medicine</th><th className="p-4">Batch</th><th className="p-4">Expiry</th><th className="p-4">Days left</th><th className="p-4">Units left</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-4 font-bold">{item.medicineName}</td><td className="p-4">{item.batchNumber}</td><td className="p-4">{item.expiryDate}</td><td className="p-4 font-bold text-amber-800">{item.daysUntilExpiry}</td><td className="p-4">{item.remainingQuantity}</td></tr>)}</tbody></table></div>}
  </div></main>
}
