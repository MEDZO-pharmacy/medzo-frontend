import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, History, RefreshCw } from 'lucide-react'
import { getSaleIssues, getSaleReceipt } from '../../inventory/api/inventoryApi'
import { downloadReceiptPdf } from '../utils/receiptPdf'

const groupSaleIssues = (items) => {
  const groups = new Map()
  items.forEach((item) => {
    const reference = item.saleReference || 'Unknown sale'
    const group = groups.get(reference) || {
      saleId: reference,
      saleReference: reference,
      completedAtUtc: item.processedAtUtc,
      items: new Map(),
      totalUnits: 0,
    }
    const currentTime = new Date(group.completedAtUtc).getTime()
    const itemTime = new Date(item.processedAtUtc).getTime()
    if (!Number.isNaN(itemTime) && (Number.isNaN(currentTime) || itemTime > currentTime)) {
      group.completedAtUtc = item.processedAtUtc
    }
    const medicineKey = item.medicineId || item.medicineName
    const medicine = group.items.get(medicineKey) || {
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      quantity: 0,
      batchAllocations: [],
    }
    medicine.quantity += Number(item.quantitySold || 0)
    medicine.batchAllocations.push({
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      quantity: item.quantitySold,
    })
    group.totalUnits += Number(item.quantitySold || 0)
    group.items.set(medicineKey, medicine)
    groups.set(reference, group)
  })

  return [...groups.values()]
    .map((group) => ({ ...group, items: [...group.items.values()] }))
    .sort((left, right) => new Date(right.completedAtUtc) - new Date(left.completedAtUtc))
}

export default function SalesHistoryPanel({ refreshKey = 0 }) {
  const [data, setData] = useState({ items: [] })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [receiptError, setReceiptError] = useState('')
  const [downloadingReference, setDownloadingReference] = useState('')

  const applyResult = useCallback((request) => {
    request
      .then((result) => {
        setData(result)
        setStatus('ready')
      })
      .catch((requestError) => {
        setError(requestError.message || 'Sales history could not be loaded.')
        setStatus('error')
      })
  }, [])

  const load = useCallback(() => {
    setStatus('loading')
    setError('')
    applyResult(getSaleIssues({ pageSize: 50 }))
  }, [applyResult])

  useEffect(() => {
    applyResult(getSaleIssues({ pageSize: 50 }))
  }, [applyResult, refreshKey])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load()
    }

    const interval = window.setInterval(load, 15_000)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', load)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [load])

  const sales = useMemo(() => groupSaleIssues(data.items || []), [data.items])

  const downloadSaleReceipt = async (sale) => {
    setReceiptError('')
    setDownloadingReference(sale.saleReference)
    try {
      const receipt = await getSaleReceipt(sale.saleReference)
      downloadReceiptPdf(receipt)
    } catch (requestError) {
      setReceiptError(requestError.message || 'The saved receipt could not be loaded from the database. Please try again.')
    } finally {
      setDownloadingReference('')
    }
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-labelledby="sales-history-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-2 text-medzo-blue"><History aria-hidden="true" /></span>
          <div>
            <h2 id="sales-history-title" className="text-xl font-bold text-[#0a192f]">Sales history</h2>
            <p className="text-sm text-medzo-text-light">Recently completed sale stock deductions.</p>
          </div>
        </div>
        <button type="button" onClick={load} disabled={status === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-lg border border-medzo-blue px-4 py-2 font-semibold text-medzo-blue hover:bg-blue-50 disabled:opacity-60">
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </button>
      </div>

      {status === 'loading' && <p role="status" className="mt-5 rounded-lg bg-slate-50 p-5 text-center text-medzo-text-light">Loading sales history...</p>}
      {status === 'error' && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"><p>{error}</p><button type="button" onClick={load} className="mt-3 font-semibold underline">Try again</button></div>}
      {receiptError && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{receiptError}</div>}
      {status === 'ready' && sales.length === 0 && <p className="mt-5 rounded-lg bg-slate-50 p-5 text-center text-medzo-text-light">No completed sales have been recorded yet.</p>}

      {status === 'ready' && sales.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Completed</th>
                <th className="p-3">Sale reference</th>
                <th className="p-3">Items</th>
                <th className="p-3">Units</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 8).map((sale) => (
                <tr key={sale.saleReference} className="border-t border-slate-100 align-top">
                  <td className="p-3">{new Date(sale.completedAtUtc).toLocaleString()}</td>
                  <td className="p-3 font-semibold text-medzo-blue">{sale.saleReference}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {sale.items.map((item) => (
                        <p key={item.medicineId || item.medicineName} className="text-[#0a192f]">
                          <span className="font-semibold">{item.medicineName}</span> x {item.quantity}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{sale.totalUnits}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => downloadSaleReceipt(sale)} disabled={downloadingReference === sale.saleReference} className="inline-flex items-center justify-center gap-2 rounded-lg border border-medzo-blue px-3 py-2 font-semibold text-medzo-blue hover:bg-blue-50">
                      <Download size={16} aria-hidden="true" /> {downloadingReference === sale.saleReference ? 'Loading...' : 'PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
