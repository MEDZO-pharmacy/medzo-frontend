# Playwright UI test cases — IT24101643-J.A.D.S.L.Ranasingha

The browser loads the real React frontend. Each service response is explicitly
mocked at the network boundary; an unmocked API request fails the test. These
are UI workflow tests, **not** proof that Azure APIs, SQL, or Kafka are online.

## Unified Catalogue/Inventory quality gate

The unified ASE pipeline runs thirteen targeted cases: `CAT-01`, `CAT-02`, and
`SLICE-01` through `SLICE-11`. The full standalone UI workflow runs all 29
cases as extended frontend regression evidence.

| ID | File | Scenario and expected browser result |
| --- | --- | --- |
| AUTH-01 | `auth-and-routing.spec.js` | Unauthenticated `/catalogue` visit redirects to login. |
| AUTH-02 | `auth-and-routing.spec.js` | Empty login shows field errors and makes no Auth login call. |
| AUTH-03 | `auth-and-routing.spec.js` | Successful login sends the expected credentials and returns to the originally requested supplier page. |
| AUTH-04 | `auth-and-routing.spec.js` | Rejected credentials show the API error and remain on login. |
| AUTH-05 | `auth-and-routing.spec.js` | Pharmacist is redirected away from inventory-manager supplier management. |
| CAT-01 | `public-catalogue.spec.js` | Search filters medicines; no-results and clear actions behave correctly. |
| CAT-02 | `public-catalogue.spec.js` | Catalogue outage shows an error and retry recovers. |
| SLICE-01 | `catalogue-inventory.spec.js` | Unauthenticated access to the protected Catalogue workspace redirects to login. |
| SLICE-02 | `catalogue-inventory.spec.js` | Inventory manager searches, sees no results, clears, and restores the protected catalogue. |
| SLICE-03 | `catalogue-inventory.spec.js` | Inventory overview combines medicine count, available units, and low-stock signal. |
| SLICE-04 | `catalogue-inventory.spec.js` | Near-expiry window change reloads and renders the expected batch evidence. |
| SLICE-05 | `catalogue-inventory.spec.js` | Inventory outage is visible and retry restores stock records. |
| SLICE-06 | `catalogue-inventory.spec.js` | Low-stock search shows no match and clear restores the reorder candidate. |
| SLICE-07 | `catalogue-inventory.spec.js` | Low-stock service error remains visible until retry succeeds. |
| SLICE-08 | `catalogue-inventory.spec.js` | A stale catalogue delete receives HTTP 409 and preserves the medicine. |
| SLICE-09 | `catalogue-inventory.spec.js` | Near-expiry outage retry recovers without changing the alert window. |
| SLICE-10 | `catalogue-inventory.spec.js` | Empty inventory shows zero summaries and a clear empty state. |
| SLICE-11 | `catalogue-inventory.spec.js` | Pharmacist is redirected away from manager-only low-stock administration. |
| SUP-01 | `suppliers.spec.js` | Successful deactivation changes visible supplier status. |
| SUP-02 | `suppliers.spec.js` | Failed deactivation shows the server error and keeps the supplier active. |
| SUP-03 | `suppliers.spec.js` | Supplier form sends the expected create payload and displays confirmation. |
| SUP-04 | `suppliers.spec.js` | Duplicate response requires explicit confirmation before a second create request. |
| PO-01 | `purchase-orders.spec.js` | Low-stock suggestion pre-fills seven units; creation sends the expected payload and confirms success. |
| PO-02 | `purchase-orders.spec.js` | Failed creation shows the API error and retains form values for retry. |
| PO-03 | `purchase-orders.spec.js` | Receiving an order sends batch/expiry details and displays received status. |
| SALE-01 | `sales.spec.js` | Pharmacist submits a sale and sees allocated batches on the receipt. |
| SALE-02 | `sales.spec.js` | Failed sale shows the error and retains cart contents for retry. |
| SALE-03 | `sales.spec.js` | Invalid quantity cannot create a sale line or submit a sale. |
| SALE-04 | `sales.spec.js` | Duplicate medicine shows an error and does not add a second line. |

Run locally with Vite already listening on `127.0.0.1:5173`:

```powershell
npm.cmd run test:e2e -- --reporter=line
```

Run only the common assessment scope with:

```powershell
npm.cmd run test:e2e:catalogue-inventory -- --reporter=line
```

The HTML report, screenshots, video, and traces are retained for failures.
The GitHub Actions workflow uploads the HTML report. A separate test-data-only
live integration smoke test is needed to assess deployed service/database behavior.
