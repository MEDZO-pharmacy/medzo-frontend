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

The browser tests mock service responses at the network boundary. An automatic
guard fails a test if it calls a service without an explicit mock. This keeps
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

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Then run `npm.cmd run test:e2e -- --reporter=line` in a second terminal.
Playwright reuses the running server. Stop the first terminal after the demo.
In CI, Playwright starts the server automatically. On this Windows setup,
letting Playwright start Vite itself can hang while shutting Vite down after
the tests; the two-terminal sequence exits reliably.

If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands; no
execution-policy change is needed.

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
Chromium, runs the eighteen Playwright UI tests, and uploads the Playwright HTML
report as a GitHub Actions artifact on every run.

### UI test coverage and limits

| Workflow | What the browser test verifies |
| --- | --- |
| Authentication and routing | Protected-route redirect; invalid form; successful and rejected login; role restriction |
| Public catalogue | Search/no-results/reset; outage message and retry |
| Suppliers | Create; duplicate confirmation; successful and failed deactivation |
| Purchase orders | Low-stock to submitted order; failed submit preserves form; receive with batch/expiry |
| Sales | Receipt; failed sale retry state; invalid quantity; duplicate medicine |

See [the individual test-case matrix](e2e/TEST_CASES.md) for the action and
expected result of every browser test.

These tests verify frontend behavior with mocked API responses, not a live
microservice-to-database integration. They cannot prove that the deployed APIs,
database, or event-driven service integration work. The CI suite needs no Azure
database and does not change shared records.

### Two-minute individual demo

1. Start Vite in one terminal using the command above. In a second terminal,
   run `npm.cmd run test:e2e -- --reporter=line` and point out `18 passed`.
2. Explain that Playwright drives the real React UI in Chromium, while each
   service response is controlled at the browser network boundary. The request
   guard catches any missing mock, so a running or stopped backend cannot
   silently change the outcome.
3. Show the purchase-order case: low stock pre-fills 7 units; the test verifies
   the POST body and confirmation. Mention duplicate-supplier confirmation,
   sale failure handling, and the protected-route login regression as edge cases.
4. If asked about the Azure outage, state that this is the deterministic UI
   layer, not a live cross-service/database test. The HTML report and CI run
   are evidence; a live-backend smoke test needs a healthy test environment.

For the SE3112 group submission, this workflow is the UI testing layer. The
other three individual testing/quality layers and any unified group pipeline
must be integrated and documented by the team separately.
