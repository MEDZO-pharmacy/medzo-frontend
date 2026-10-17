# React + Vite

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

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
