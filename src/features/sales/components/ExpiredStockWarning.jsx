export default function ExpiredStockWarning({ message }) {
  return (
    <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <h3 className="font-bold">Expired stock cannot be dispensed</h3>
      <p className="mt-1">{message}</p>
      <p className="mt-2">Remove this medicine from the sale or choose a product with sellable stock.</p>
    </div>
  )
}