export default function ReceiptCard({ receipt, medicineNames = {} }) {
 if (!receipt) return null
 const completedAt = new Date(receipt.completedAtUtc)
 const dateTime = Number.isNaN(completedAt.getTime()) ? 'Unavailable' : completedAt.toLocaleString()
 return <section aria-label="Receipt" className="mt-6 rounded-2xl bg-white p-5 shadow-sm print:mt-0 print:shadow-none">
  <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
   <div><p className="text-lg font-bold text-medzo-blue">Medzo</p><h2 className="text-xl font-bold text-[#0a192f]">Sale receipt</h2></div>
   <button type="button" onClick={() => globalThis.print?.()} className="rounded-lg border border-medzo-blue px-4 py-2 font-semibold text-medzo-blue print:hidden">Print receipt</button>
  </div>
  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Transaction ID</dt><dd className="break-all text-medzo-text-light">{receipt.saleId}</dd></div><div><dt className="font-semibold">Completed</dt><dd className="text-medzo-text-light">{dateTime}</dd></div></dl>
  <div className="mt-5 overflow-x-auto"><table className="w-full text-left"><thead className="border-b text-sm text-medzo-text-light"><tr><th className="pb-2">Medicine</th><th className="pb-2">Quantity</th><th className="pb-2">Issued batches</th></tr></thead><tbody>{receipt.items?.map(item => <tr key={item.productId} className="border-b last:border-0"><td className="py-3 font-semibold">{medicineNames[item.productId] || item.productId}</td><td className="py-3">{item.quantity}</td><td className="py-3">{item.batchAllocations?.map(allocation => `${allocation.batchNumber} (${allocation.quantity})`).join(', ') || 'Unavailable'}</td></tr>)}</tbody></table></div>
 </section>
}