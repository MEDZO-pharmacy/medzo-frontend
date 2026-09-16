import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageBackLink from '../../../components/PageBackLink'
import MedicineForm from '../components/MedicineForm'
import { createMedicine } from '../api/catalogueApi'

export default function AddMedicinePage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [duplicate, setDuplicate] = useState(null)
  const [created, setCreated] = useState(null)
  const nameInputRef = useRef(null)

  const save = async (values, allowDuplicate = false) => {
    setBusy(true)
    setError('')
    try {
      const result = await createMedicine({ ...values, allowDuplicate })
      setCreated(result)
      setDuplicate(null)
    } catch (requestError) {
      if (requestError.status === 409 && !allowDuplicate) setDuplicate(values)
      else setError(requestError.message || 'The medicine could not be saved. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const reviewForm = () => {
    setDuplicate(null)
    requestAnimationFrame(() => {
      nameInputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      nameInputRef.current?.focus({ preventScroll: true })
    })
  }

  if (created) return (
    <main className="min-h-screen bg-medzo-light-bg px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm" role="status">
        <h1 className="text-2xl font-bold text-[#0a192f]">Medicine added successfully</h1>
        <p className="mt-3 text-medzo-text-light">{created.name} is now available in the catalogue with an initial stock quantity of 0.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => setCreated(null)} className="rounded-lg border border-medzo-blue px-6 py-3 font-semibold text-medzo-blue">Add another medicine</button>
          <Link to="/catalogue" className="gradient-btn rounded-lg px-6 py-3 font-semibold text-white">View catalogue</Link>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <PageBackLink fallback="/catalogue">Back to catalogue</PageBackLink>
        <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Add medicine</h1>
        <p className="mb-6 mt-2 text-medzo-text-light">Enter the catalogue details. Stock can be received after the medicine is created.</p>

        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        {duplicate && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <h2 className="font-bold">Potential duplicate medicine</h2>
            <p className="mt-1">A medicine with the same name and manufacturer already exists. Review the details before saving another record.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => save(duplicate, true)} disabled={busy} className="rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save duplicate anyway'}</button>
              <button type="button" onClick={reviewForm} disabled={busy} className="rounded-lg border border-amber-400 px-5 py-2.5 font-semibold">Review form</button>
            </div>
          </div>
        )}

        <MedicineForm onSubmit={save} onChange={() => setDuplicate(null)} busy={busy} nameInputRef={nameInputRef} />
      </div>
    </main>
  )
}
