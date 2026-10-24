# ASE Unified Testing Pipeline

## One common assessment scope

All automated layers use the **Catalogue/Inventory vertical slice** as their common scope. Existing standalone workflows remain available for each contribution; `.github/workflows/ase-unified-testing.yml` connects them into one visible group pipeline and publishes one status matrix.

## Ownership and terminology

| Classification | Owner | Strategy | Owned source branch | Primary evidence |
| --- | --- | --- | --- | --- |
| Official individual role | Member 1 | Unit Testing & Mocking | `feature/se3112-unit-mocking` | xUnit/Moq TRX and Coverlet coverage |
| Official individual role | Member 2 | Mutation Testing | `catalogue-mutation-testing` | Stryker.NET HTML, JSON, and Markdown reports |
| Official individual role | Member 3 | UI / E2E Testing | `feature/se3112-unified-testing-pipeline` | Playwright HTML report, failure trace/video/screenshot |
| Official individual role | Member 4 | Code Quality & Metrics | `feature/se3112-code-quality` | .NET analyzer dashboard, SARIF, and coverage |
| Supplementary group quality check | Team | Load & Performance | `feature/se3112-unified-testing-pipeline` | k6 Markdown/JSON latency and threshold report |

The current Code Quality contribution is not a SonarQube scan. Submission evidence therefore uses **Code Quality & Metrics (.NET analyzers + Coverlet)**. SonarQube must only be named as implemented after an actual SonarQube workflow and dashboard exist.

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
- Read-only monitor artifact source: `ase-monitor/`
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

Use these exact names in README files, GitHub summaries, and artifact explanations:

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
- UI / E2E Testing: seven targeted Catalogue/Inventory browser cases passed in the verified run below. The current quality gate defines thirteen cases covering happy paths, access control, empty states, concurrency conflicts, and outage recovery.
- Code Quality & Metrics: analyzer, test, coverage, and dashboard gate passed.
- Supplementary Load & Performance Check: deterministic k6 smoke gate passed.
- Unified result: success in 56 seconds with five evidence artifacts.
