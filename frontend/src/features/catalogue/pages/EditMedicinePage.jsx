import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MedicineForm from '../components/MedicineForm'
import { getMedicine, updateMedicine } from '../api/catalogueApi'

export default function EditMedicinePage() {
  const { medicineId } = useParams()
  const [item, setItem] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [saved, setSaved] = useState(false)

  const reload = useCallback(async () => {
    setStatus('loading')
    setError('')
    setConflict(false)
    try {
      setItem(await getMedicine(medicineId))
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.message || 'The medicine could not be loaded. Please try again.')
      setStatus('error')
    }
  }, [medicineId])

  useEffect(() => {
    let active = true
    getMedicine(medicineId)
      .then((result) => { if (active) { setItem(result); setStatus('ready') } })
      .catch((requestError) => { if (active) { setError(requestError.message || 'The medicine could not be loaded. Please try again.'); setStatus('error') } })
    return () => { active = false }
  }, [medicineId])

  const save = async (values) => {
    setStatus('saving')
    setError('')
    setConflict(false)
    try {
      const updated = await updateMedicine(medicineId, values, item.version)
      setItem(updated)
      setSaved(true)
      setStatus('ready')
    } catch (requestError) {
      if (requestError.status === 409) {
        setConflict(true)
        setStatus('ready')
      } else {
        setError(requestError.message || 'The medicine could not be updated. Please try again.')
        setStatus('ready')
      }
    }
  }

  return (
    <main className="min-h-screen bg-medzo-light-bg px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/catalogue" className="mb-4 inline-block font-semibold text-medzo-blue">Back to catalogue</Link>
        <h1 className="text-2xl font-bold text-[#0a192f] sm:text-3xl">Edit medicine</h1>
        <p className="mb-6 mt-2 text-medzo-text-light">Update the catalogue details. Existing stock batches and movement history will not be changed.</p>

        {saved && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">Medicine updated successfully. The latest details are now shown throughout the catalogue.</div>}
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"><p>{error}</p><button type="button" onClick={reload} className="mt-2 font-semibold underline">Try again</button></div>}
        {conflict && <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-900"><h2 className="font-bold">This medicine was changed by another user</h2><p className="mt-1">Your changes were not saved. Reload the latest record, review it, and then apply your changes again.</p><button type="button" onClick={reload} className="mt-3 rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-white">Reload latest version</button></div>}

        {status === 'loading' && <p className="rounded-2xl bg-white p-8 text-center text-medzo-text-light shadow-sm">Loading medicine...</p>}
        {item && status !== 'loading' && <MedicineForm key={item.version} initial={item} onSubmit={save} busy={status === 'saving'} />}
      </div>
    </main>
  )
}

