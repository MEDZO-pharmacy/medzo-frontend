# ASE Unified Testing Pipeline

## One common assessment scope

All automated layers use the **Catalogue/Inventory vertical slice** as their common scope. Existing standalone workflows remain available for each contribution; `.github/workflows/ase-unified-testing.yml` connects them into one visible group pipeline and publishes one status matrix.

## Ownership and terminology

| Classification | Owner | Strategy | Tools | Primary evidence |
| --- | --- | --- | --- | --- |
| Official individual role | Member 1 | Unit Testing & Mocking | xUnit, Moq, Coverlet | TRX and coverage |
| Official individual role | Member 2 | Mutation Testing | Stryker.NET | HTML, JSON, Markdown mutation reports |
| Official individual role | Member 3 | UI / E2E Testing | Playwright | HTML browser report, failure trace/video/screenshot |
| Official individual role | Member 4 | Code Quality & Metrics | .NET analyzers, Coverlet | HTML dashboard, SARIF, coverage |
| Supplementary group quality check | Team | Load & Performance | Grafana k6 | Markdown/JSON latency and threshold report |

The current Code Quality contribution is not a SonarQube scan. Reports and slides therefore use **Code Quality & Metrics (.NET analyzers + Coverlet)**. SonarQube must only be named as implemented after an actual SonarQube workflow and dashboard exist.

## Unified execution

```text
push / pull request / manual run
                 |
                 v
       ASE Unified Testing Pipeline
       |        |        |        |        |
     xUnit   Stryker  Playwright  Quality   k6
      role 1   role 2    role 3    role 4  supplementary
       |        |        |        |        |
       +--------+--------+--------+--------+
                         |
              unified result + artifacts
```

The official jobs check out the contributors' Catalogue/Inventory branches. The UI and k6 jobs call the existing reusable frontend workflows. Jobs run in parallel, and the final job reports every result. Any failed or cancelled testing layer fails the unified gate.

## Branch and files

- Unified branch: `feature/se3112-unified-testing-pipeline`
- Unified workflow: `.github/workflows/ase-unified-testing.yml`
- Existing UI workflow: `.github/workflows/ui-e2e.yml`
- Existing supplementary performance workflow: `.github/workflows/load-performance.yml`
- Targeted UI command: `npm run test:e2e:catalogue-inventory`
- Supplementary k6 command: `npm run test:performance`

## Database outage and live demonstration

The required assessment implementation can still be demonstrated while Azure SQL is paused:

1. Member 1 runs deterministic unit/mocking tests.
2. Member 2 runs Stryker against the local unit-test project.
3. Member 3 runs the real React UI in Chromium with explicit API boundary mocks.
4. Member 4 runs local .NET analyzer and coverage gates.
5. The team shows the supplementary k6 deterministic fixture result.

These results prove test logic and automation, not deployed database availability. After the allowance resets, run a separate read-only deployed smoke check and retain it as additional environment evidence. Do not replace deterministic CI with a dependency on the free-tier database.

## Consistent report labels

Use these exact names in README files, GitHub summaries, artifact explanations, and slides:

1. `Unit Testing & Mocking`
2. `Mutation Testing`
3. `UI / E2E Testing`
4. `Code Quality & Metrics`
5. `Supplementary Load & Performance Check`

Always add `Common scope: Catalogue/Inventory vertical slice`. Never present item 5 as a fifth individual role.

## Verified GitHub evidence

Unified run [#1](https://github.com/MEDZO-pharmacy/medzo-frontend/actions/runs/40106315604) completed successfully on commit `6de0bbc`:

- Unit Testing & Mocking: 26 passed, 0 failed, 0 skipped.
- Mutation Testing: 98.89% mutation score; configured break threshold 80%.
- UI / E2E Testing: seven targeted Catalogue/Inventory browser cases passed.
- Code Quality & Metrics: analyzer, test, coverage, and dashboard gate passed.
- Supplementary Load & Performance Check: deterministic k6 smoke gate passed.
- Unified result: success in 56 seconds with five evidence artifacts.
