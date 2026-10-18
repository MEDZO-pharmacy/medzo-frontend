# MEDZO Frontend

React/Vite frontend for the MEDZO pharmacy microservice system. The repository includes automated unit, component, UI, and mutation tests for the SE3112 Microservice Testing Pipeline assignment.

## Prerequisites

- Node.js 22
- npm 10 or later

Install the exact locked dependency versions:

```bash
npm ci
```

## Test automation commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run the complete Vitest unit/component suite once. |
| `npm run test:mutation:dry` | Verify Stryker instrumentation and Vitest integration without executing mutants. |
| `npm run test:mutation` | Run the complete frontend mutation campaign and enforce the quality gate. |
| `npm run lint` | Run ESLint checks. |
| `npm run build` | Create the production Vite build. |

## Mutation testing

**Owner:** IT24101508

**Tool:** StrykerJS 9 with the official Vitest runner

Stryker makes small changes (mutants) to production logic, then reruns the relevant tests. A killed mutant means at least one test detected the fault. A surviving mutant exposes either a weak assertion, missing boundary case, or behaviorally equivalent change.

The configuration in `stryker.config.json` targets two deterministic business-rule modules:

- `src/features/catalogue/validation/medicineValidation.js`
- `src/features/inventory/validation/stockBatchValidation.js`

The mutation quality gate fails below 80%, reports scores below 90% as needing attention, and generates both console and browsable reports:

- `reports/mutation/mutation.html`
- `reports/mutation/mutation.json`

Latest verified local result:

| Metric | Result |
| --- | ---: |
| Mutants generated | 133 |
| Killed | 132 |
| Survived | 1 |
| No coverage | 0 |
| Timed out | 0 |
| Mutation score | **99.25%** |

The remaining survivor removes `.slice(0, 10)` from the current-date expression. It is equivalent for the supported `YYYY-MM-DD` date-input domain: today remains invalid and every later calendar date remains valid.

## GitHub Actions integration

`.github/workflows/frontend-mutation-testing.yml` runs on relevant pushes, pull requests into `Dev`, and manual dispatch. It:

1. installs the locked dependencies;
2. runs the targeted Vitest validation suite;
3. runs Stryker and enforces the 80% break threshold;
4. uploads the HTML and JSON mutation reports as a 14-day workflow artifact, even when the quality gate fails.

## Two-minute live demo

1. Run `npm test -- src/features/catalogue/validation/medicineValidation.test.js src/features/inventory/validation/stockBatchValidation.test.js` to show the fast parameterized unit suite.
2. Run `npm run test:mutation` to show Stryker instrumenting the validation files and executing mutants.
3. Explain the final table: killed versus survived mutants, no-coverage count, and the 80% quality gate.
4. Open `reports/mutation/mutation.html` and select the one survivor to explain equivalent mutants and why mutation score is stronger evidence than line coverage alone.

## Mutation-testing design choices

- Pure validation functions keep the live run deterministic and independent of backend services, browsers, or test data.
- Boundary-value cases check exactly 200/201, 100/101, 500/501, 150/151, zero/negative quantities, and today/tomorrow expiry dates.
- Parameterized tests reduce duplication while testing null, undefined, empty, whitespace-only, invalid numeric, and valid boundary inputs.
- Exact error assertions kill string-literal mutants that broad truthy assertions would miss.
- Per-test coverage lets Stryker run only tests related to each mutant, reducing execution time.
