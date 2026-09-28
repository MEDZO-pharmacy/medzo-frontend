import PageBackLink from '../../../components/PageBackLink'
import SalesHistoryPanel from '../components/SalesHistoryPanel'

export default function PharmacistSalesHistoryPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <PageBackLink fallback="/pharmacist">Back to dashboard</PageBackLink>
        <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Sales history</h1>
        <p className="mt-2 text-[#4a5568]">Review completed sales and download a receipt when needed.</p>
        <SalesHistoryPanel />
      </div>
    </main>
  )
}

