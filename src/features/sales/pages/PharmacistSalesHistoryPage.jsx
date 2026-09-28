import SalesHistoryPanel from '../components/SalesHistoryPanel'

export default function PharmacistSalesHistoryPage() {
  return (
    <main className="min-w-0 bg-transparent px-5 py-7 sm:px-8 lg:px-10">
      <div className="w-full max-w-none">
        <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Sales history</h1>
        <p className="mt-2 text-[#4a5568]">Review completed sales and download a receipt when needed.</p>
        <SalesHistoryPanel />
      </div>
    </main>
  )
}

