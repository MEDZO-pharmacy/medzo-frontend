import { Search, X } from 'lucide-react'

export default function MedicineSearch({ value, onChange, onSubmit, onClear, busy = false }) {
  return (
    <form onSubmit={onSubmit} role="search" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search medicine catalogue</span>
          <Search className="absolute left-4 top-3.5 text-[#a0aec0]" size={20} aria-hidden="true" />
          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search by medicine, generic name, or manufacturer"
            className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] py-3 pl-12 pr-4 text-medzo-text outline-none transition focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20"
          />
        </label>
        <div className="flex gap-3">
          {value && (
            <button type="button" onClick={onClear} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 font-semibold text-medzo-text-light transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
              <X size={18} aria-hidden="true" /> Clear
            </button>
          )}
          <button type="submit" disabled={busy} className="gradient-btn flex-1 rounded-lg px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
            {busy ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  )
}
