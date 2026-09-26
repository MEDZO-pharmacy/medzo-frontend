
import { Link } from 'react-router-dom'
import { BadgeCheck, ClipboardCheck, HeartPulse, PackageSearch, Pill, Truck } from 'lucide-react'

const services = [
  { icon: Pill, title: 'Prescription dispensing', text: 'Careful prescription preparation with pharmacist-led checks and clear medicine guidance.' },
  { icon: HeartPulse, title: 'Pharmacist support', text: 'Practical help with medicine use, storage, interactions, and adherence questions.' },
  { icon: PackageSearch, title: 'Medicine availability', text: 'Browse the live public catalogue before visiting or contacting the pharmacy.' },
  { icon: ClipboardCheck, title: 'Batch traceability', text: 'Stock is managed by batch number and expiry date to support responsible dispensing.' },
  { icon: Truck, title: 'Reliable replenishment', text: 'Purchase receipts update inventory and help the team respond to low-stock products.' },
  { icon: BadgeCheck, title: 'Quality-focused service', text: 'Role-based workflows and accurate records help our staff deliver dependable care.' },
]

export default function Services() {
  return <main className="bg-medzo-light-bg"><section className="bg-[#0a192f] px-4 py-16 text-center text-white sm:px-6 sm:py-20"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-medzo-green">How we help</p><h1 className="mt-3 text-3xl font-bold sm:text-5xl">Pharmacy services centred on safe, convenient care.</h1><p className="mt-5 text-lg leading-8 text-slate-300">From finding a medicine to receiving clear guidance, Medzo combines professional pharmacy care with dependable stock information.</p></div></section><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{services.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl bg-white p-7 shadow-sm"><span className="inline-flex rounded-xl bg-blue-50 p-3 text-medzo-blue"><Icon aria-hidden="true" /></span><h2 className="mt-5 text-xl font-bold text-[#0a192f]">{title}</h2><p className="mt-3 leading-7 text-medzo-text-light">{text}</p></article>)}</div><div className="mt-10 rounded-3xl bg-gradient-to-r from-[#00a399] to-[#0066cc] p-8 text-white sm:flex sm:items-center sm:justify-between sm:p-10"><div><h2 className="text-2xl font-bold">Check what is available today</h2><p className="mt-2 text-white/90">Browse active medicines with stock currently on hand.</p></div><Link to="/products" className="mt-5 inline-block rounded-lg bg-white px-6 py-3 font-bold text-medzo-blue sm:mt-0">Browse products</Link></div></section></main>
}
