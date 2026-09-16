export default function LowStockTable({ items }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
      <div className="grid gap-3 p-4 sm:hidden">
        {items.map((item) => (
          <article key={item.medicineId} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-[#0a192f]">{item.name}</h2>
                <p className="text-sm text-slate-500">{item.genericName}</p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Low stock</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">On hand</dt><dd className="text-lg font-bold text-red-700">{item.quantityOnHand}</dd></div>
              <div><dt className="text-slate-500">Reorder at</dt><dd className="text-lg font-bold">{item.reorderThreshold}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Next expiry</dt><dd className="font-semibold">{item.nextExpiry || 'No active batch'}</dd></div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left">
          <thead className="bg-red-50 text-sm text-red-800"><tr>{['Medicine', 'Generic name', 'On hand', 'Reorder threshold', 'Shortfall', 'Next expiry', 'Status'].map((heading) => <th className="p-4" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{items.map((item) => <tr className="border-t border-slate-100" key={item.medicineId}><td className="p-4 font-bold text-[#0a192f]">{item.name}</td><td className="p-4">{item.genericName}</td><td className="p-4 font-bold text-red-700">{item.quantityOnHand}</td><td className="p-4">{item.reorderThreshold}</td><td className="p-4">{Math.max(item.reorderThreshold - item.quantityOnHand, 0)}</td><td className="p-4">{item.nextExpiry || '—'}</td><td className="p-4"><span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">Low stock</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
