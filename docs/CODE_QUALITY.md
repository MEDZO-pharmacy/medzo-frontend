# Code Quality & Metrics — Frontend

Owner: Dayan-02. Branch: `feature/se3112-code-quality`.

## Contribution

ESLint checks source and test code using the repository's configured JavaScript,
React Hooks and React Refresh rules. Vitest's V8 provider measures coverage while
executing the existing tests. This contribution adds coverage collection, report
generation and a quality gate; test ownership remains with the unit-testing role.

## Run locally

Install Node.js 22 and run from this repository:

```powershell
npm ci
npm run quality
```

Open `.quality-output/dashboard.html` in a browser. Follow its coverage link to
the source-level report, where covered and uncovered lines are highlighted.
The output also contains ESLint JSON, Vitest JSON, LCOV and coverage summary JSON.
Each run uses fresh result filenames to prevent stale metrics passing a broken run.
Coverage includes all `src` JavaScript/JSX files except test files and test setup.
The instrumented quality run uses two workers and a 15-second per-test timeout
to allow for coverage overhead; the normal test command keeps its existing defaults.

## GitHub demonstration

Push this branch, open **Actions → Code Quality and Metrics**, then the newest
run. Show the console output and the **Summary** table. Download
**quality-evidence**, extract it, open `dashboard.html`, then open the coverage
link. An existing run can be repeated with **Re-run all jobs**. The manual
workflow button is available once the workflow exists on the default branch.

## Explain the results

- ESLint errors are violations of configured error-level rules.
- Warnings are advisory findings and still need review.
- Line coverage measures executed source lines; branch coverage measures
  executed decisions. Open the HTML report to inspect what is missing.
- The gate requires no ESLint errors, successful tests with at least one test
  case, and generated coverage. Warnings do not block it. No minimum coverage
  percentage is currently required; passing is not a claim of complete coverage.
- A unit-test pass percentage and a code-coverage percentage answer different questions.

This setup needs no Infrastructure or SonarQube credentials. It does not calculate
SonarQube debt estimates or ratings. Static checks do not execute the application;
the coverage stage runs the existing tests. Review actual rules and uncovered
code, rather than only presenting a green status.

References: https://eslint.org/docs/latest/use/command-line-interface and
https://vitest.dev/guide/coverage.html
