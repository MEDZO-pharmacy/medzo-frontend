# Supplementary Load & Performance Check

**Common scope:** Catalogue/Inventory vertical slice

**Tool:** Grafana k6

**Classification:** Supplementary group quality check — not a fifth individual role

The four official individual roles remain Unit Testing & Mocking, Mutation Testing, UI / E2E Testing, and Code Quality & Metrics. This read-only k6 module adds performance evidence to the same Catalogue/Inventory scope without changing that ownership model.

## Measured journey

Each virtual-user iteration checks paged JSON and HTTP 200 for:

| Operation | Endpoint |
| --- | --- |
| Public catalogue | `GET /api/catalogue/medicines/public` |
| Protected catalogue search | `GET /api/catalogue/medicines` |
| Inventory overview | `GET /api/inventory/items` |
| Low-stock list | `GET /api/inventory/items/low-stock` |
| Near-expiry batches | `GET /api/inventory/batches/near-expiry` |

The repeated workload is read-only. Authentication happens once during setup, or a dedicated `ACCESS_TOKEN` can be supplied. The script never creates medicine, stock, purchase, or sale records.

## Quality gates and profiles

- Check pass rate greater than 99%.
- HTTP and operation failure rates below 1%.
- Default p95 below 1000 ms and p99 below 2000 ms.
- Every operation must receive at least one measured request.
- `smoke`: 1 VU, 1 iteration.
- `load`: ramp to 10 VUs, hold 1 minute, ramp down.
- `stress`: ramp through 10, 20, and 30 VUs.

Override concurrency/duration with `TARGET_VUS`, `TEST_DURATION`, and `RAMP_DURATION`. Override documented limits with `MIN_CHECK_RATE`, `MAX_FAILURE_RATE`, `P95_MS`, and `P99_MS`.

## Reliable local evidence without Azure SQL

Terminal 1:

```powershell
npm.cmd run performance:mock
```

Terminal 2:

```powershell
$env:PROFILE = "smoke"
$env:CATALOGUE_INVENTORY_API_URL = "http://127.0.0.1:8787"
$env:ACCESS_TOKEN = "local-demo-token"
$env:THINK_TIME_SECONDS = "0"
npm.cmd run test:performance
```

The run writes `performance/results/summary.md` and `summary.json`. These deterministic fixtures prove the script, checks, thresholds, metrics, reports, and CI wiring while the free-tier database is paused.

## Approved deployed-environment run

Use **Actions > Supplementary Load and Performance Check > Run workflow** only against an authorized non-production target. Configure either `K6_ACCESS_TOKEN`, or `K6_TEST_IDENTIFIER` plus `K6_TEST_PASSWORD`; enter the Catalogue/Inventory URL and type `LOAD_TEST_APPROVED`. Start with `smoke`. Do not load/stress production without explicit owner approval.

The deployed run is optional evidence. A paused database can make it fail with availability errors; it does not invalidate the deterministic CI implementation.
