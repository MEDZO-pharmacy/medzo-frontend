# Frontend: unit testing and mocking

## Additional business-rule tests

`supplierValidation.test.js` adds 16 cases for required fields, field-length boundaries, email validation, and phone rules. `inactivitySession.test.js` adds 7 cases for invalid activity timestamps, recording/clearing activity, logout broadcasts, and one-time logout reasons. Vitest spies replace the clock and observe browser storage without a live API.

## Run locally

Run from this repository:

```powershell
npm ci
npm run test
```

Latest local validation: **83 passing cases**, including the pre-existing tests. Each parameterized input counts as one case.

## Live demonstration

Push to `feature/se3112-unit-mocking`, open this repository's **Actions** tab, and open the newest unit-test workflow run. Expand the test step for console output, then show the **Summary** table for total/passed/failed/skipped counts.

The frontend uses Vitest and its mocking APIs. Its workflow uploads JUnit test results. It does not currently generate a coverage percentage.

