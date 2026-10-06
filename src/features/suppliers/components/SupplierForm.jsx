import { useState } from 'react'
import { validateSupplier } from '../validation/supplierValidation'

const fields = [
  ['name', 'Supplier name', 'text', true], ['contactName', 'Contact person', 'text', true],
  ['email', 'Email address', 'email', true], ['phone', 'Phone number', 'tel', true],
]

export default function SupplierForm({ initial = {}, onSubmit, onChange, busy, submitLabel = 'Save supplier' }) {
  const [values, setValues] = useState({ name: '', contactName: '', email: '', phone: '', address: '', ...initial })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const change = ({ target: { name, value } }) => { setValues(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: undefined })); onChange?.() }
  const submit = (event) => { event.preventDefault(); const next = validateSupplier(values); setSubmitted(true); setErrors(next); if (!Object.keys(next).length) onSubmit(values) }
  return <form onSubmit={submit} noValidate className="mx-auto max-w-[80rem] rounded-2xl bg-white p-5 shadow-sm sm:p-7">
    {submitted && Object.keys(errors).length > 0 && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Please correct the highlighted fields before saving.</p>}
    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">{fields.map(([name, label, type, required]) => <label key={name} className="text-sm font-semibold text-[#0a192f]">{label} {required && <span className="text-red-600">*</span>}<input name={name} type={type} value={values[name]} onChange={change} disabled={busy} required={required} aria-invalid={Boolean(errors[name])} className={`mt-1 w-full rounded-lg border bg-[#f8fafc] p-3 font-normal outline-none focus:ring-2 focus:ring-medzo-blue/20 disabled:opacity-60 ${errors[name] ? 'border-red-400' : 'border-slate-200 focus:border-medzo-blue'}`} />{errors[name] && <span className="mt-1 block text-sm font-normal text-red-600">{errors[name]}</span>}</label>)}</div>
    <label className="mt-5 block text-sm font-semibold text-[#0a192f]">Business address<textarea name="address" value={values.address} onChange={change} disabled={busy} rows="3" className={`mt-1 w-full rounded-lg border bg-[#f8fafc] p-3 font-normal outline-none ${errors.address ? 'border-red-400' : 'border-slate-200 focus:border-medzo-blue'}`} />{errors.address && <span className="mt-1 block text-sm font-normal text-red-600">{errors.address}</span>}</label>
    <p className="mt-5 text-sm text-medzo-text-light"><span className="text-red-600">*</span> Required fields</p><button disabled={busy} className="gradient-btn mt-5 rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Saving...' : submitLabel}</button>
  </form>
}
