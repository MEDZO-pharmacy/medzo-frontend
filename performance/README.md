# MEDZO Load and Performance Testing

**Student:** IT24101643 - J.A.D.S.L. Ranasingha

**Tool:** Grafana k6

**ASE role:** Load & Performance Testing (JMeter / k6)

This module measures the MEDZO frontend and the four application services as one read-only system journey. It is intentionally stored in `medzo-frontend`; `medzo-infrastructure` is not used.

## Coverage

| System area | Operation under load | Expected result |
| --- | --- | --- |
| Frontend | `GET /` | `200` and HTML |
| Authentication | One setup login, then `GET /api/auth/session` per iteration | Login returns a token; session returns `204` |
| Catalogue | Public and authenticated medicine searches | `200` and paged JSON |
| Inventory | Inventory item search | `200` and paged JSON |
| Suppliers | Active supplier list | `200` and array/paged JSON |
| Purchase orders | Purchase-order history | `200` and array/paged JSON |
| Sales reporting | Sale-item search and expiry alerts | `200` and paged JSON |

The repeated journey uses only reads. It does not create sales, purchase orders, suppliers, or stock movements, so a performance run cannot corrupt normal application data. Use a dedicated `InventoryManager` test account because that role can access all protected endpoints in this journey.

## Quality gates

Every request has status and response-shape checks. The run fails if any default threshold is broken:

- check pass rate must be greater than 99%;
- HTTP and service failure rates must remain below 1%;
- p95 response time must remain below 1000 ms;
- p99 response time must remain below 2000 ms.

The same latency and failure limits are also evaluated separately for frontend, auth, catalogue/inventory, purchasing/supplier, and sales/reporting. A slow service therefore cannot be hidden by a fast overall average, and every service must receive at least one measured request.

The limits can be overridden with `MIN_CHECK_RATE`, `MAX_FAILURE_RATE`, `P95_MS`, and `P99_MS` when an assessment requires a documented alternative service-level objective.

## Test profiles

| Profile | Purpose | Default workload |
| --- | --- | --- |
| `smoke` | Fast script and deployment verification | 1 VU, 1 complete iteration |
| `load` | Expected concurrent usage | Ramp to 10 VUs, hold for 1 minute, ramp down |
| `stress` | Find degradation or capacity limits | Ramp through 10, 20, and 30 VUs |

Set `TARGET_VUS` to change the base concurrency, `TEST_DURATION` to change the load-profile hold time, and `RAMP_DURATION` to tune its ramp-up and ramp-down periods. Stress reaches three times `TARGET_VUS`.

## Reliable local demonstration

Install k6, open two PowerShell terminals in the repository, and run:

```powershell
# Terminal 1: deterministic substitutes for all five targets
npm run performance:mock
```

```powershell
# Terminal 2: configure the deterministic target and execute the quality gate
$env:PROFILE = "smoke"
$env:FRONTEND_URL = "http://127.0.0.1:8787"
$env:AUTH_API_URL = "http://127.0.0.1:8787"
$env:CATALOGUE_INVENTORY_API_URL = "http://127.0.0.1:8787"
$env:PURCHASING_SUPPLIER_API_URL = "http://127.0.0.1:8787"
$env:SALES_REPORTING_API_URL = "http://127.0.0.1:8787"
$env:TEST_IDENTIFIER = "demo@medzo.test"
$env:TEST_PASSWORD = "demo-only-password"
$env:THINK_TIME_SECONDS = "0"
npm run test:performance
```

The command prints requests, iterations, check rate, failure rate, average, p95, and p99. It also writes `performance/results/summary.md` and `summary.json`.

For a short live concurrency demonstration, change the second terminal to `PROFILE=load`, `TARGET_VUS=5`, and `TEST_DURATION=15s`. The run ramps up for 15 seconds, holds five concurrent virtual users for 15 seconds, and ramps down for 15 seconds.

### Two-minute walkthrough

1. Show the `feature/load-performance-k6-testing` branch and the endpoint table above.
2. Start the deterministic fixtures, then run the short load profile.
3. Explain that a VU is a concurrent virtual user and an iteration is one complete cross-service journey.
4. Point to request count/throughput, check pass rate, failure rate, and the per-service p95/p99 table.
5. Explain that p95 means 95% of responses completed at or below that latency, while the non-zero exit code enforces the limits in CI.

## Test a deployed non-production environment

1. Make sure the deployed frontend and all four APIs are healthy. If the Azure SQL free allowance is paused, keep using the deterministic smoke demo and wait before running a real-environment profile.
2. In GitHub, add either `K6_ACCESS_TOKEN`, or both `K6_TEST_IDENTIFIER` and `K6_TEST_PASSWORD`, as repository Actions secrets. Use a dedicated test account, never personal credentials.
3. Open **Actions > Load and Performance Tests > Run workflow**.
4. Select this feature branch, choose `smoke`, `load`, or `stress`, enter all five deployed base URLs, and type `LOAD_TEST_APPROVED`.
5. Download the `k6-<profile>-evidence-<run>` artifact and explain the threshold result, p95/p99 latency, throughput, and failure rate.

Do not aim load or stress profiles at production without explicit owner approval. Start with `smoke`, confirm health and authorization, then increase concurrency gradually.

## CI behaviour

Pushes to `feature/load-performance-k6-testing` and pull requests to `Dev` run the same full-system script against deterministic fixtures. This proves the script, routes, checks, metrics, thresholds, report generation, and workflow without depending on the paused database. Real deployed-environment testing is deliberately manual so CI cannot unexpectedly generate cost or traffic.
