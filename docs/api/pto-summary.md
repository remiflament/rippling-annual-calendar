# `GET /api/pto/api/data/get_pto_summary_v2/`

Leave balances of the current employee, one entry per leave policy. The Time Off page calls it on load. The script reads it for the "taken vs accrued" block, shown on the current year only.

Source of every fact below: **capture 2026-10-01** (one employee account, 31 policies, 4 of them accruing), unless marked **code**.

## Request

```
?includeLongTerm=true&includeUnfulfilledPaidOut=false&role=<role_id>
```

Params as sent by the web app and the script. Effect of each param not tested. No date param known: the response is a snapshot at today's date.

## Response

```json
{ "pto_summary": [ { "policyDisplayName": "Congés payés", … } ] }
```

About 70 fields per entry, balances per policy only: no per-day breakdown, so `leave_requests` stays the source for calendar days. Sanitized example: [`fixtures/pto_summary.json`](../../fixtures/pto_summary.json).

Each policy has its own accounting period, starting at `accountingYearStart`: `2026-06-01` for `Congés payés` (French June-to-May period), `2026-01-01` for the others. Every amount below is for the current period.

Fields the script reads (declared in `src/schema.js`):

| Field | Type | Notes |
|---|---|---|
| `policyDisplayName` | string | same names as `leave_requests` |
| `isFixedLeavePolicy` | boolean | `true` only on accruing policies. Other entries have no `accruedInCurrentPeriod`. |
| `accrueInDays` | boolean | `true` on every accruing policy seen |
| `accountingYearStart` | `YYYY-MM-DD` | start of the current period |
| `accruedInCurrentPeriod.days` | numeric string | accrued in the period, balance carried over at period start included |
| `takenAndScheduled.taken.days` | numeric string | taken in the period |
| `takenAndScheduled.futureApproved.days` | numeric string | approved, not taken yet |
| `takenAndScheduled.pending.days` | numeric string | waiting for approval |
| `balanceDays` | numeric string | `accrued − taken − futureApproved`. Can be negative. |
| `hourlyRate` | numeric string | despite its name: annual entitlement, in days when `accrueInDays` |

Checks on the capture:

| Policy | accrued | taken | pending | `balanceDays` | `availableBalanceDays` | `hourlyRate` | `accrualPerPeriodDays` × periods (`payFrequency`) |
|---|---|---|---|---|---|---|---|
| Congés payés | 25.33 | 6 | 0 | 19.33 | 19.33 | 25 | 2.08 × 12 (`MONTHLY`) |
| RTT | 7.49 | 9 | 1 | −1.51 | −2.51 | 10 | 0.83 × 12 (`MONTHLY`) |
| Congé enfant malade | 5 | 0 | 0 | 5 | 5 | 5 | 5 × 1 (`ANNUALLY`) |
| Short Stay | 5 | 0 | 0 | 5 | 5 | 20 | 5 × 4 (`QUARTERLY`) |

Other fields worth knowing:

| Field | Type | Notes |
|---|---|---|
| `availableBalanceDays` | numeric string | `balanceDays − pending` |
| `payFrequency` | enum | accrual frequency: `MONTHLY`, `QUARTERLY`, `ANNUALLY` |
| `accrualPerPeriodDays` | numeric string | accrued per period, rounded to 2 decimals |
| `projectedBalanceAtYearEnd.days` | numeric string | balance at the end of the period. Congés payés: 19.33 + 8 months × 2.08 = 36. |
| `daysUsed`, `daysPending`, `daysScheduled` | numeric string | do not match `takenAndScheduled` (Congés payés `daysUsed` 11 vs taken 6): scope unclear |
| `balanceCapDays`, `carryoverCapDays` | numeric string or null | caps |
| `frCopReferencePeriodBalance` | object | Congés payés only: `{ current, previous }`, each `{ accrued, taken, balance }`. `previous.balance + current.accrued = balanceDays` (11 + 8.33 = 19.33). |
| `expiringDatesAndBalances`, `nextExpirationTotal` | array, object | RTT: unused days expiring at a date |
| `occurrenceBased`, `isUnpaid` | boolean | event-based leaves (sick, family events) and unpaid ones |
| `limitPeriods` | array | per-policy limit periods, names are company config |
| `hours…`, `…Hours`, `.hours` | numeric string | hour twins of the day fields |

## Open questions

- A date param giving the balances at another date (would allow other years).
- Unit of `hourlyRate` when `accrueInDays` is `false` (probably hours).
- Scope of `daysUsed` versus `takenAndScheduled.taken`.
