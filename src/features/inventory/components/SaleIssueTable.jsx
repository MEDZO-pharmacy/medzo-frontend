import { Download } from 'lucide-react'
import { downloadReceiptPdf } from '../../sales/utils/receiptPdf'

const soldUnits = (item) => Math.abs(Number(item.quantitySold || 0))

const buildReceipt = (saleReference, items) => {
  const saleItems = items.filter((item) => item.saleReference === saleReference)
  const itemGroups = new Map()

  saleItems.forEach((item) => {
    const key = item.medicineId || item.medicineName
    const current = itemGroups.get(key) || {
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      quantity: 0,
      batchAllocations: [],
    }
    const quantity = soldUnits(item)
    current.quantity += quantity
    current.batchAllocations.push({
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      quantity,
    })
    itemGroups.set(key, current)
  })

  return {
    saleReference,
    completedAtUtc: saleItems[0]?.processedAtUtc,
    items: [...itemGroups.values()],
  }
}

export default function SaleIssueTable({ items = [] }) {
  if (!items.length) return <p className="rounded-2xl bg-white p-10 text-center text-[#6b7280]">No sale stock updates have been processed yet.</p>

  return <div className="overflow-x-auto rounded-2xl bg-white shadow-sm" role="region" aria-label="Automatically processed sales" tabIndex="0">
    <table className="min-w-[860px] w-full text-left">
      <thead className="bg-slate-50 text-sm text-slate-500">
        <tr>{['Processed', 'Sale reference', 'Medicine', 'Batch', 'Expiry', 'Sold', 'New balance', 'Actions'].map(label => <th scope="col" className="p-4" key={label}>{label}</th>)}</tr>
      </thead>
      <tbody>{items.map(item => <tr className="border-t border-slate-100" key={item.movementId}>
        <td className="p-4">{new Date(item.processedAtUtc).toLocaleString()}</td>
        <td className="p-4 font-semibold text-medzo-blue">{item.saleReference}</td>
        <td className="p-4 font-bold text-[#0a192f]">{item.medicineName}</td>
        <td className="p-4">{item.batchNumber}</td>
        <td className="p-4">{item.expiryDate}</td>
        <td className="p-4 font-semibold">{soldUnits(item)}</td>
        <td className="p-4">{item.quantityAfter}</td>
        <td className="p-4">
          <button type="button" onClick={() => downloadReceiptPdf(buildReceipt(item.saleReference, items))} className="inline-flex items-center justify-center gap-2 rounded-lg border border-medzo-blue px-3 py-2 font-semibold text-medzo-blue hover:bg-blue-50">
            <Download size={16} aria-hidden="true" /> Receipt
          </button>
        </td>
      </tr>)}</tbody>
    </table>
  </div>
}
