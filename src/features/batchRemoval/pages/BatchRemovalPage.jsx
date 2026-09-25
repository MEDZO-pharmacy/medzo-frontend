import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, PackageX, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import PageBackLink from '../../../components/PageBackLink'
import { useAuth } from '../../../auth/AuthContext'
import { getRemovalCandidates, removeBatch } from '../api/batchRemovalApi'

const empty = { items: [], page: 1, pageSize: 50, totalCount: 0 }
const reasons = ['Expired', 'Damaged', 'Returned to supplier', 'Other']

export default function BatchRemovalPage() {
  const { user } = useAuth()
  const [data, setData] = useState(empty)
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getRemovalCandidates())
    } catch (requestError) {
      setError(requestError.message || 'Batches available for removal could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const removalReason = useMemo(() => reason === 'Other' ? otherReason.trim() : reason, [reason, otherReason])
  const selectBatch = (batch) => {
    setSelected(batch)
    setConfirmed(false)
    setError('')
    setNotice('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!selected || !removalReason || !confirmed) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await removeBatch(selected.batchId, {
        idempotencyKey: crypto.randomUUID(),
        reason: removalReason,
        removedBy: user?.staffId || user?.username || 'Inventory Manager',
      })
      setNotice(result.alreadyRemoved
        ? `${result.batchNumber} was already removed. No stock was deducted again.`
        : `${result.batchNumber} was removed from active inventory. ${result.removedQuantity} units were recorded in the disposal audit.`)
      setSelected(null)
      setConfirmed(false)
      setReason('')
      setOtherReason('')
      await load()
    } catch (requestError) {
      setError(requestError.message || 'The batch could not be removed. No inventory changes were saved.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10"><div className="mx-auto max-w-7xl">
    <PageBackLink fallback="/inventory">Back to inventory</PageBackLink>
    <header className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-medzo-green">Inventory safety</p><h1 className="mt-2 text-2xl font-bold text-[#0a192f] sm:text-3xl">Remove expired stock</h1><p className="mt-2 max-w-2xl text-[#4a5568]">Dispose of expired or near-expiry batches safely. Every removal creates an audit record and keeps past receipts intact.</p></div><div className="rounded-2xl bg-amber-50 px-5 py-3 text-amber-900"><span className="text-2xl font-bold">{data.totalCount}</span> <span className="font-semibold">eligible batches</span></div></header>

    {notice && <div role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900"><ShieldCheck className="mr-2 inline" size={18} />{notice}</div>}
    {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{error}</p><button type="button" onClick={load} className="mt-2 font-semibold underline">Try again</button></div>}

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
      <section className="overflow-x-auto rounded-2xl bg-white shadow-sm" aria-label="Batches eligible for removal">
        <div className="flex items-center justify-between border-b p-5"><div><h2 className="font-bold text-[#0a192f]">Eligible batches</h2><p className="mt-1 text-sm text-slate-600">Expired batches and batches expiring within 30 days.</p></div><button type="button" onClick={load} className="rounded-lg border p-2 text-medzo-blue" aria-label="Refresh batches"><RefreshCw size={18} /></button></div>
        {loading && <p role="status" className="p-10 text-center text-slate-600">Loading batches…</p>}
        {!loading && data.items.length === 0 && <div className="p-10 text-center"><PackageX className="mx-auto text-medzo-blue" /><p className="mt-3 font-semibold text-[#0a192f]">No active batches need disposal.</p></div>}
        {!loading && data.items.length > 0 && <table className="min-w-[720px] w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Product</th><th className="p-4">Batch</th><th className="p-4">Expiry</th><th className="p-4">Units</th><th className="p-4">Status</th><th className="p-4"><span className="sr-only">Action</span></th></tr></thead><tbody>{data.items.map((batch) => <tr key={batch.batchId} className="border-t border-slate-100"><td className="p-4 font-semibold text-[#0a192f]">{batch.productId}</td><td className="p-4">{batch.batchNumber}</td><td className="p-4">{batch.expiryDate}</td><td className="p-4">{batch.remainingQuantity}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${batch.isExpired ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{batch.isExpired ? 'Expired' : `${batch.daysUntilExpiry} days left`}</span></td><td className="p-4"><button type="button" onClick={() => selectBatch(batch)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 hover:bg-red-50"><Trash2 className="mr-1 inline" size={15} />Remove</button></td></tr>)}</tbody></table>}
      </section>

      <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm"><div className="flex gap-3"><span className="rounded-xl bg-red-50 p-2 text-red-700"><AlertTriangle /></span><div><h2 className="font-bold text-[#0a192f]">Confirm disposal</h2><p className="mt-1 text-sm text-slate-600">The batch is hidden from active stock and sales. Historical receipts remain available.</p></div></div>
        {!selected && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Choose an eligible batch to start a recorded disposal.</p>}
        {selected && <form onSubmit={submit} className="mt-6 space-y-4"><div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-bold text-[#0a192f]">{selected.batchNumber}</p><p>{selected.productId} · {selected.remainingQuantity} units · expires {selected.expiryDate}</p></div><label className="block text-sm font-semibold text-[#0a192f]">Reason for removal<select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal"><option value="">Select a reason</option>{reasons.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>{reason === 'Other' && <label className="block text-sm font-semibold text-[#0a192f]">Describe the reason<textarea value={otherReason} onChange={(event) => setOtherReason(event.target.value)} maxLength="500" className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal" /></label>}<label className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm that this stock has been physically removed and should never be sold.</span></label><button disabled={!removalReason || !confirmed || saving} className="w-full rounded-lg bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Removing batch…' : 'Confirm removal'}</button></form>}
      </aside>
    </div>
  </div></main>
}