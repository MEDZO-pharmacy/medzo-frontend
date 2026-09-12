
import { Link } from 'react-router-dom'
import { Boxes, PackageCheck, Search, ShieldCheck } from 'lucide-react'

const features = [
  { icon: Search, title: 'Fast catalogue search', text: 'Find medicines by name, generic name, or manufacturer.' },
  { icon: PackageCheck, title: 'Traceable stock batches', text: 'Track batch numbers, expiry dates, quantities, and source references.' },
  { icon: Boxes, title: 'Current stock levels', text: 'Purchase receipts increase stock and completed sales decrease it automatically.' },
]

export default function Products() {
  return (
    <main className="min-h-[70vh] bg-medzo-light-bg px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl bg-[#0a192f] px-6 py-12 text-white shadow-lg sm:px-10 lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-10 lg:px-14">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-medzo-green">Medzo Catalogue &amp; Inventory</p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">Medicine information and stock visibility in one secure workspace.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Medzo helps authorised pharmacy staff locate medicines, trace batches, and monitor stock changes without manual recalculation.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="gradient-btn rounded-lg px-6 py-3 text-center font-bold text-white">Staff sign in</Link>
              <Link to="/services" className="rounded-lg border border-slate-500 px-6 py-3 text-center font-bold text-white transition hover:bg-white/10">Explore services</Link>
            </div>
          </div>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 lg:mt-0">
            <ShieldCheck className="text-medzo-green" size={38} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Role-protected access</h2>
            <p className="mt-2 leading-7 text-slate-300">Catalogue and inventory data is available only after authentication. Actions are limited to the Pharmacist, Inventory Manager, and Admin roles.</p>
          </div>
        </section>
        <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="Catalogue and inventory capabilities">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="inline-flex rounded-xl bg-blue-50 p-3 text-medzo-blue"><Icon aria-hidden="true" /></span>
              <h2 className="mt-5 text-xl font-bold text-[#0a192f]">{title}</h2>
              <p className="mt-2 leading-7 text-medzo-text-light">{text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
