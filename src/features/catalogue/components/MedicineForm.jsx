import { useState } from 'react'
import { validateMedicine } from '../validation/medicineValidation'

const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Other']
const fields = [
  { name: 'name', label: 'Medicine name', autoComplete: 'off' },
  { name: 'genericName', label: 'Generic name', autoComplete: 'off' },
  { name: 'manufacturer', label: 'Manufacturer', autoComplete: 'organization' },
  { name: 'unitPrice', label: 'Unit price', type: 'number', min: 0, step: '0.01', inputMode: 'decimal' },
  { name: 'reorderThreshold', label: 'Reorder threshold', type: 'number', min: 0, step: '1', inputMode: 'numeric' },
]

export default function MedicineForm({ initial = {}, onSubmit, onChange, busy = false, nameInputRef }) {
  const [values, setValues] = useState({
    name: '', genericName: '', manufacturer: '', unitPrice: '', dosageForm: 'Tablet', reorderThreshold: 0, ...initial,
  })
  const [errors, setErrors] = useState({})

  const change = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    onChange?.()
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validateMedicine(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit({
      ...values,
      unitPrice: Number(values.unitPrice),
      reorderThreshold: Number(values.reorderThreshold),
      categoryId: values.categoryId || null,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
      {Object.keys(errors).length > 0 && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Please correct the highlighted fields before saving.</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const errorId = `${field.name}-error`
          const { label, ...inputProps } = field
          return (
            <label key={field.name} className="text-sm font-semibold text-[#0a192f]">
              {label} <span className="text-red-600" aria-hidden="true">*</span>
              <input
                {...inputProps}
                ref={field.name === 'name' ? nameInputRef : undefined}
                value={values[field.name]}
                onChange={change}
                disabled={busy}
                required
                aria-label={label}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={errors[field.name] ? errorId : undefined}
                className={`mt-1 w-full rounded-lg border bg-[#f8fafc] p-3 font-normal outline-none transition focus:ring-2 focus:ring-medzo-blue/20 disabled:cursor-not-allowed disabled:opacity-60 ${errors[field.name] ? 'border-red-400' : 'border-slate-200 focus:border-medzo-blue'}`}
              />
              {errors[field.name] && <span id={errorId} className="mt-1 block text-sm font-normal text-red-600">{errors[field.name]}</span>}
            </label>
          )
        })}
        <label className="text-sm font-semibold text-[#0a192f]">
          Dosage form <span className="text-red-600" aria-hidden="true">*</span>
          <select name="dosageForm" value={values.dosageForm} onChange={change} disabled={busy} required className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20 disabled:opacity-60">
            {dosageForms.map((form) => <option key={form} value={form}>{form}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-5 text-sm text-medzo-text-light"><span className="text-red-600">*</span> Required fields</p>
      <button type="submit" disabled={busy} className="gradient-btn mt-5 w-full rounded-lg px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{busy ? 'Saving...' : 'Save medicine'}</button>
    </form>
  )
}
