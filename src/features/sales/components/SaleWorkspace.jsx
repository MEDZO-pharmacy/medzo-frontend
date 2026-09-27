import { useMemo, useState } from 'react'
import { Download, Minus, Plus, ReceiptText, ShoppingCart, Trash2 } from 'lucide-react'
import { completeSale } from '../api/salesApi'
import ExpiredStockWarning from './ExpiredStockWarning'

const createSaleReference = () => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `SALE-${stamp}`
}

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`

const buildReceiptText = (receipt, lineDetails) => {
  const lines = [
    'MEDZO PHARMACY',
    'Sale Receipt',
    '',
    `Receipt: ${receipt.saleReference}`,
    `Sale ID: ${receipt.saleId}`,
    `Completed: ${new Date(receipt.completedAtUtc).toLocaleString()}`,
    '',
    'Items',
  ]

  receipt.items.forEach((item) => {
    const detail = lineDetails.get(item.medicineId)
    lines.push(`${item.medicineName} x ${item.quantity} - ${money((detail?.unitPrice || 0) * item.quantity)}`)
    item.batchAllocations.forEach((batch) => {
      lines.push(`  Batch ${batch.batchNumber}, exp ${batch.expiryDate}, qty ${batch.quantity}`)
    })
  })

  const total = receipt.items.reduce((sum, item) => {
    const detail = lineDetails.get(item.medicineId)
    return sum + Number(detail?.unitPrice || 0) * item.quantity
  }, 0)

  lines.push('', `Total: ${money(total)}`)
  return lines.join('\n')
}

export default function SaleWorkspace({ medicines = [], inventory = [], onCompleted }) {
  const [selectedMedicineId, setSelectedMedicineId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [saleReference, setSaleReference] = useState(createSaleReference())
  const [lines, setLines] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const medicineDetails = useMemo(() => {
    const map = new Map()
    inventory.forEach((item) => map.set(item.medicineId, item))
    medicines.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item, medicineId: item.id }))
    return map
  }, [inventory, medicines])

  const sellableItems = useMemo(() => inventory.filter((item) => item.quantityOnHand > 0), [inventory])
  const selectedLine = lines.find((line) => line.medicineId === selectedMedicineId)
  const saleTotal = lines.reduce((sum, line) => {
    const detail = medicineDetails.get(line.medicineId)
    return sum + Number(detail?.unitPrice || 0) * line.quantity
  }, 0)

  const resetMessage = () => {
    setMessage('')
    setReceipt(null)
  }

  const addOrUpdateLine = (event) => {
    event.preventDefault()
    resetMessage()
    const amount = Number(quantity)
    const selected = medicineDetails.get(selectedMedicineId)
    if (!selectedMedicineId || !selected) {
      setMessage('Choose a medicine for the sale.')
      return
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setMessage('Quantity must be a whole number greater than zero.')
      return
    }
    if (amount > selected.quantityOnHand) {
      setMessage(`Only ${selected.quantityOnHand} units are currently available.`)
      return
    }

    setLines((current) => {
      const nextLine = { medicineId: selectedMedicineId, quantity: amount }
      return current.some((line) => line.medicineId === selectedMedicineId)
        ? current.map((line) => line.medicineId === selectedMedicineId ? nextLine : line)
        : [...current, nextLine]
    })
    setSelectedMedicineId('')
    setQuantity(1)
  }

  const changeLineQuantity = (medicineId, nextQuantity) => {
    resetMessage()
    const amount = Number(nextQuantity)
    const selected = medicineDetails.get(medicineId)
    if (!Number.isInteger(amount) || amount <= 0 || amount > selected.quantityOnHand) return
    setLines((current) => current.map((line) => line.medicineId === medicineId ? { ...line, quantity: amount } : line))
  }

  const removeLine = (medicineId) => {
    resetMessage()
    setLines((current) => current.filter((line) => line.medicineId !== medicineId))
  }

  const submitSale = async () => {
    resetMessage()
    if (lines.length === 0) {
      setMessage('Add at least one medicine before completing the sale.')
      return
    }

    setStatus('saving')
    try {
      const result = await completeSale({
        saleId: crypto.randomUUID(),
        saleReference,
        items: lines,
      })
      setReceipt(result)
      setLines([])
      setSaleReference(createSaleReference())
      setMessage('Sale completed and stock updated.')
      await onCompleted?.()
    } catch (error) {
      const text = error.message || ''
      if (error.status === 404) {
        setMessage('Sale endpoint unavailable. Restart the Catalogue API.')
      } else if (text.toLowerCase().includes('expired')) {
        setMessage(text)
      } else {
        setMessage(error.status === 409 || text.toLowerCase().includes('insufficient') ? 'Insufficient sellable stock.' : text || 'Sale could not be completed.')
      }
    } finally {
      setStatus('idle')
    }
  }

  const downloadReceipt = () => {
    if (!receipt) return
    const content = buildReceiptText(receipt, medicineDetails)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${receipt.saleReference || receipt.saleId}-receipt.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-green-50 p-2 text-medzo-green"><ShoppingCart aria-hidden="true" /></span>
            <div>
              <h2 className="text-xl font-bold text-[#0a192f]">Update a Sale</h2>
              <p className="text-sm text-medzo-text-light">Build the sale, update quantities, then complete it to deduct stock.</p>
            </div>
          </div>
        </div>
        <label className="text-sm font-semibold text-[#0a192f]">Sale reference <span className="text-red-600" aria-hidden="true">*</span>
          <input value={saleReference} onChange={(event) => setSaleReference(event.target.value)} className="mt-1 w-full min-w-64 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20" />
        </label>
      </div>

      <form onSubmit={addOrUpdateLine} className="mt-5 grid gap-3 lg:grid-cols-[1fr_8rem_auto]">
        <label className="text-sm font-semibold text-[#0a192f]">Medicine <span className="text-red-600" aria-hidden="true">*</span>
          <select value={selectedMedicineId} onChange={(event) => {
            const nextId = event.target.value
            setSelectedMedicineId(nextId)
            setQuantity(lines.find((line) => line.medicineId === nextId)?.quantity || 1)
            resetMessage()
          }} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20">
            <option value="">Select medicine</option>
            {sellableItems.map((item) => <option key={item.medicineId} value={item.medicineId}>{item.name} ({item.quantityOnHand} available)</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#0a192f]">Quantity <span className="text-red-600" aria-hidden="true">*</span>
          <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none focus:border-medzo-blue focus:ring-2 focus:ring-medzo-blue/20" />
        </label>
        <button type="submit" className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-medzo-blue px-5 py-3 font-bold text-medzo-blue hover:bg-blue-50">
          <Plus size={18} aria-hidden="true" /> {selectedLine ? 'Update item' : 'Add item'}
        </button>
      </form>

      {message && (message.toLowerCase().includes('expired')
        ? <ExpiredStockWarning message={message} />
        : <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${message === 'Sale completed and stock updated.' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{message}</p>)}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-3">Medicine</th><th className="p-3">Available</th><th className="p-3">Qty</th><th className="p-3">Line total</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const detail = medicineDetails.get(line.medicineId)
              return (
                <tr key={line.medicineId} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-[#0a192f]">{detail?.name || line.medicineId}</td>
                  <td className="p-3">{detail?.quantityOnHand ?? 0}</td>
                  <td className="p-3">
                    <div className="flex w-32 items-center gap-2">
                      <button type="button" aria-label="Decrease quantity" onClick={() => changeLineQuantity(line.medicineId, line.quantity - 1)} className="rounded-md border p-1"><Minus size={14} /></button>
                      <input aria-label={`Quantity for ${detail?.name || line.medicineId}`} type="number" min="1" max={detail?.quantityOnHand || 1} value={line.quantity} onChange={(event) => changeLineQuantity(line.medicineId, event.target.value)} className="w-14 rounded-md border border-slate-200 px-2 py-1 text-center" />
                      <button type="button" aria-label="Increase quantity" onClick={() => changeLineQuantity(line.medicineId, line.quantity + 1)} className="rounded-md border p-1"><Plus size={14} /></button>
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{money(Number(detail?.unitPrice || 0) * line.quantity)}</td>
                  <td className="p-3"><button type="button" onClick={() => removeLine(line.medicineId)} aria-label={`Remove ${detail?.name || 'item'}`} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 size={16} /></button></td>
                </tr>
              )
            })}
            {lines.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-medzo-text-light">No sale items added yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-bold text-[#0a192f]">Total {money(saleTotal)}</p>
        <button type="button" disabled={status === 'saving' || lines.length === 0} onClick={submitSale} className="gradient-btn inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
          <ReceiptText size={18} aria-hidden="true" /> {status === 'saving' ? 'Completing...' : 'Complete sale'}
        </button>
      </div>

      {receipt && <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold">Receipt {receipt.saleReference}</p><p>{new Date(receipt.completedAtUtc).toLocaleString()}</p></div>
          <button type="button" onClick={downloadReceipt} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-bold text-green-800 shadow-sm hover:bg-green-100"><Download size={16} /> Download receipt</button>
        </div>
        <div className="mt-3 space-y-2">
          {receipt.items.map((item) => <div key={item.medicineId}><p className="font-semibold">{item.medicineName} x {item.quantity}</p><p className="text-green-800">{item.batchAllocations.map((batch) => `${batch.batchNumber}: ${batch.quantity}`).join(', ')}</p></div>)}
        </div>
      </div>}
    </section>
  )
}
