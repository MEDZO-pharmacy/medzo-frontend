const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`

const pdfEscape = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[\r\n]+/g, ' ')

const drawText = (text, x, y, { size = 10, font = 'F1', color = '0.06 0.09 0.16' } = {}) =>
  `${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`
const drawFilledRect = (x, y, width, height, color) =>
  `${color} rg ${x} ${y} ${width} ${height} re f`

const drawStrokedRect = (x, y, width, height, color = '0.82 0.86 0.91') =>
  `${color} RG ${x} ${y} ${width} ${height} re S`

const line = (x1, y1, x2, y2, color = '0.82 0.86 0.91') =>
  `${color} RG ${x1} ${y1} m ${x2} ${y2} l S`

const buildRows = (receipt, lineDetails = new Map()) => {
  const detailFor = (item) => lineDetails.get(item.medicineId) || lineDetails.get(item.productId) || {}
  return (receipt.items || []).map((item) => {
    const detail = detailFor(item)
    const unitPrice = Number(item.unitPrice ?? detail.unitPrice ?? 0)
    const discount = Number(item.discount ?? item.discountAmount ?? 0)
    const lineTotal = Number(item.lineTotal ?? (unitPrice * Number(item.quantity || 0)) - discount)
    return {
      medicineName: item.medicineName || detail.name || item.productId || item.medicineId || 'Medicine',
      quantity: Number(item.quantity || 0),
      batchText: (item.batchAllocations || [])
        .map((batch) => `${batch.batchNumber}: ${batch.quantity}`)
        .join(', ') || 'Unavailable',
      lineTotal,
    }
  })
}

const createPdf = (content) => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

export const createReceiptPdfBlob = (receipt, { lineDetails = new Map() } = {}) => {
  const rows = buildRows(receipt, lineDetails)
  const completedAt = receipt.completedAtUtc ? new Date(receipt.completedAtUtc) : null
  const completedText = completedAt && !Number.isNaN(completedAt.getTime())
    ? completedAt.toLocaleString()
    : 'Unavailable'
  const receiptNumber = receipt.saleReference || receipt.receiptNumber || receipt.saleId || 'Sale receipt'
  const pharmacistUsername = receipt.pharmacistUsername || receipt.pharmacist || receipt.completedByUsername || 'Not recorded'
  const subtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0)
  const discount = Number(receipt.discount || 0)
  const tax = Number(receipt.tax || 0)
  const total = Number(receipt.grandTotal ?? subtotal - discount + tax)

  const commands = [
    '0.06 0.09 0.16 rg',
    drawText('Medzo Pharmacy', 72, 786, { size: 22, font: 'F2' }),
    '0.29 0.36 0.47 rg',
    drawText('Sales Receipt', 72, 764, { size: 10 }),
    drawFilledRect(72, 676, 451, 74, '0.93 0.99 0.96'),
    drawStrokedRect(72, 676, 451, 74, '0.52 0.93 0.67'),
    drawText('Receipt', 88, 730, { size: 10, font: 'F2' }),
    drawText(receiptNumber, 174, 730, { size: 10 }),
    drawText('Completed', 88, 710, { size: 10, font: 'F2' }),
    drawText(completedText, 174, 710, { size: 10 }),
    drawText('Pharmacist', 88, 690, { size: 10, font: 'F2' }),
    drawText(pharmacistUsername, 174, 690, { size: 10 }),
    drawText('Items', 72, 642, { size: 13, font: 'F2' }),
    drawFilledRect(72, 604, 451, 26, '0.95 0.97 0.99'),
    drawStrokedRect(72, 604, 451, 26),
    drawText('Medicine', 84, 614, { size: 9, font: 'F2' }),
    drawText('Qty', 285, 614, { size: 9, font: 'F2' }),
    drawText('Batch', 334, 614, { size: 9, font: 'F2' }),
    drawText('Line Total', 458, 614, { size: 9, font: 'F2' }),
  ]

  let y = 580
  rows.slice(0, 12).forEach((row) => {
    commands.push(drawStrokedRect(72, y - 8, 451, 24))
    commands.push(drawText(row.medicineName.slice(0, 34), 84, y, { size: 9 }))
    commands.push(drawText(row.quantity, 292, y, { size: 9 }))
    commands.push(drawText(row.batchText.slice(0, 24), 334, y, { size: 9 }))
    commands.push(drawText(money(row.lineTotal), 465, y, { size: 9 }))
    y -= 24
  })

  if (!rows.length) {
    commands.push(drawText('No items recorded.', 84, y, { size: 9 }))
    y -= 24
  }

  const totalsY = Math.max(260, y - 42)
  commands.push(drawText('Subtotal', 346, totalsY, { size: 10, font: 'F2' }))
  commands.push(drawText(money(subtotal), 465, totalsY, { size: 10 }))
  commands.push(drawText('Discount', 346, totalsY - 22, { size: 10, font: 'F2' }))
  commands.push(drawText(money(discount), 465, totalsY - 22, { size: 10 }))
  commands.push(drawText('Tax', 346, totalsY - 44, { size: 10, font: 'F2' }))
  commands.push(drawText(money(tax), 465, totalsY - 44, { size: 10 }))
  commands.push(line(340, totalsY - 54, 523, totalsY - 54, '0.06 0.09 0.16'))
  commands.push(drawText('Total', 346, totalsY - 76, { size: 12, font: 'F2' }))
  commands.push(drawText(money(total), 455, totalsY - 76, { size: 12, font: 'F2' }))
  commands.push(drawText('Thank you for shopping with Medzo Pharmacy.', 72, 112, { size: 9 }))

  return new Blob([createPdf(commands.join('\n'))], { type: 'application/pdf' })
}

export const downloadReceiptPdf = (receipt, options = {}) => {
  const blob = createReceiptPdfBlob(receipt, options)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const name = receipt.saleReference || receipt.receiptNumber || receipt.saleId || 'sale'
  link.href = url
  link.download = `${name}-receipt.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
