# MEDZO Frontend

React/Vite frontend for the MEDZO pharmacy microservice project.

## API documentation

After deployment, evaluators can use the public documentation hub at
`/api-docs`. It links to the Swagger UI for every Medzo backend service. Each
backend also exposes its OpenAPI document at `/swagger/v1/swagger.json`.

Protected operations can be tried from Swagger UI by using **Authorize** and
supplying a JWT returned from the Authentication API sign-in endpoint.

## UI / E2E Testing — IT24101643-J.A.D.S.L.Ranasingha

This project uses Playwright to run automated browser-based UI workflow tests.
The suite opens the real React application in Chromium and verifies user-facing
flows for authentication, access control, public catalogue search, supplier
management, purchase-order reordering, and pharmacist sales/receipt handling.

### Test design

The browser tests mock service responses at the network boundary. This keeps
the CI pipeline deterministic and safe: it does not create, edit, or delete
records in the shared Medzo database. It also allows the UI test suite to run
while the free-tier database is temporarily unavailable.

When the service environment is available, the same UI journeys can be used as
a basis for a separate live integration smoke test against test-only accounts
and data. The committed CI suite is intentionally the reliable UI layer.

### Run locally

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

For a reliable live demo on Windows, start Vite in one terminal:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Then run `npm run test:e2e` in a second terminal. Playwright reuses the running
server. Stop the first terminal after the demo. In CI, Playwright starts the
server automatically.

For an interactive Playwright runner, use:

```bash
npm run test:e2e:ui
```

To open the most recent HTML report:

```bash
npm run test:e2e:report
```

### CI pipeline

`.github/workflows/ui-e2e.yml` runs on pushes to `Dev` and
`feature/ui-e2e-playwright-testing`, and on relevant pull requests. It installs
Chromium, runs the six Playwright UI tests, and uploads the Playwright HTML
report as a GitHub Actions artifact on every run.

### UI test coverage and limits

| Workflow | What the browser test verifies |
| --- | --- |
| Authentication and routing | Protected-route redirect and blank-login validation |
| Public catalogue | Search, no-results message, and reset |
| Suppliers | Deactivation request and updated status |
| Purchase orders | Low-stock suggestion opens a prefilled new-order route |
| Sales | Sale request payload and receipt display |

These tests verify frontend behavior with mocked API responses, not a live
microservice-to-database integration. In particular, the purchase-order test
checks navigation to the new-order form; it does not submit an order.

For the SE3112 group submission, this workflow is the UI testing layer. The
other three individual testing/quality layers and any unified group pipeline
must be integrated and documented by the team separately.
