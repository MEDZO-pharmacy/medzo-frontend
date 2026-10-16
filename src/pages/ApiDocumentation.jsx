const trimTrailingSlash = (url) => url.replace(/\/$/, '')
const authSwaggerUrl = (url) => `${trimTrailingSlash(url).replace(/\/api$/, '')}/swagger`

const apiServices = [
  {
    name: 'Authentication',
    description: 'Registration, sign-in, user management, dashboard data, reviews, and contact requests.',
    swaggerUrl: authSwaggerUrl(import.meta.env.VITE_AUTH_API_URL || '/api'),
  },
  {
    name: 'Catalogue & Inventory',
    description: 'Medicines, stock batches, stock movements, purchase receipts, and inventory alerts.',
    swaggerUrl: `${trimTrailingSlash(import.meta.env.VITE_CATALOGUE_INVENTORY_API_URL || '/catalogue-inventory-api')}/swagger`,
  },
  {
    name: 'Purchasing & Suppliers',
    description: 'Supplier management and purchase-order workflows.',
    swaggerUrl: `${trimTrailingSlash(import.meta.env.VITE_PURCHASING_SUPPLIER_API_URL || '/purchasing-supplier-api')}/swagger`,
  },
  {
    name: 'Sales & Reporting',
    description: 'Sales, sale-item lookup, expiry alerts, and batch removals.',
    swaggerUrl: `${trimTrailingSlash(import.meta.env.VITE_SALES_API_URL || '/sales-api')}/swagger`,
  },
]

export default function ApiDocumentation() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <section className="rounded-2xl bg-slate-50 p-8 shadow-sm sm:p-12">
        <p className="mb-3 font-semibold uppercase tracking-widest text-medzo-blue">Developer documentation</p>
        <h1 className="text-4xl font-bold text-slate-900">Medzo API Swagger UI</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Medzo is built as four API services. Each Swagger UI below is public and shows its complete OpenAPI contract.
          For protected endpoints, use the Authorize button and paste a JWT obtained from the Authentication API sign-in endpoint.
        </p>
        <a
          className="mt-6 inline-flex rounded-md bg-medzo-blue px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          href="/swagger/"
        >
          Open unified Swagger UI
        </a>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2" aria-label="API documentation links">
        {apiServices.map((service) => (
          <article key={service.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">{service.name} API</h2>
            <p className="mt-3 flex-1 leading-7 text-slate-600">{service.description}</p>
            <a
              className="mt-6 inline-flex w-fit rounded-md bg-medzo-blue px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              href={service.swaggerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Swagger UI
            </a>
          </article>
        ))}
      </section>
    </main>
  )
}
