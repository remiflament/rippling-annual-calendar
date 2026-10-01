# `GET /api/pto/api/leave_requests/`

Leave requests of the current employee. Django REST style list endpoint: plain array, field filters with `__gte`/`__lte` lookups.

Source of every fact below: **capture 2026-10-01** (one employee account, 24 requests, all in 2026), unless marked **code**.

## Request

| Param | Effect | Example |
|---|---|---|
| `role` | role whose requests are listed. Omitting it returns the same list in `EE` access level. | `role=<role_id>` |
| `limit` | max items returned | `limit=200` |
| `skip` | items to skip, for pagination with `limit` | `limit=50&skip=50` |
| `<field>__gte`, `<field>__lte` | range filter on a date field | `startDate__gte=2026-06-01` |
| `<field>=<value>` | exact match | `status=APPROVED` |
| `<field>__in` | repeat the param per value; a comma list matches nothing | `status__in=APPROVED&status__in=PENDING` |

Ignored params, silently (full list returned): `start`, `end`, `offset`, `ordering`, `cursor`. `page=1` returns everything, `page=2` returns `[]`.

Script v1.2 sent `start`/`end`, so it got every request of every year, capped at 200. The script now asks for the requests that overlap year `Y` (**code**):

```
?role=<role_id>&limit=200&endDate__gte=Y-01-01&startDate__lte=Y-12-31
```

Checked: with `D` the middle day of a 3-day request, `endDate__gte=D&startDate__lte=D` returns that request.

Checked on the whole account (capture 2026-10-01, 24 requests): for years 2025 to 2027, the overlap filter returns exactly the requests overlapping the year; `start`/`end` return all 24 for every year.

No pagination headers: `count`, `Link`, `X-Next-Cursor` are listed in `Access-Control-Expose-Headers` but absent from responses.

Default order is neither by `startDate` nor by `createdAt`.

## Response

JSON array of request objects, about 65 fields each. Sanitized example: [`fixtures/leave_requests.json`](../../fixtures/leave_requests.json).

Fields the script reads (declared in `src/schema.js`):

| Field | Type | Notes |
|---|---|---|
| `startDate` | `YYYY-MM-DD` | first day |
| `endDate` | `YYYY-MM-DD` | last day, inclusive |
| `status` | enum | seen: `APPROVED`, `PENDING`, `CANCELED`. Script shows `APPROVED` and `PENDING`. |
| `policyDisplayName` | string | e.g. `Congés payés`, `RTT` |
| `numDays` | numeric string | working days of the request: weekends excluded (a Saturday-to-next-Sunday request, 9 calendar days → `"5.00"`). Equal to the weekday count on all 24 requests of the capture; none contains a weekday holiday. Shown as the duration; totals of a request spanning New Year are split by the share of its weekdays in each year. |
| `reasonForLeave` | string or null | free text |

Other fields worth knowing:

| Field | Type | Notes |
|---|---|---|
| `numMinutes` | numeric string | `"468.00"` per full day. Equal to `numDays × 468` on every capture. |
| `numHours` | numeric string | `numDays × 7.80` |
| `startDateHalfDay`, `endDateHalfDay` | boolean | half day on first/last day. Always `false` in capture. |
| `startDateMinutes`, `endDateMinutes`, `startDateCustomHours`, `endDateCustomHours` | numeric string | `0.00` or a full day (`468.00` / `7.80`); meaning unclear |
| `partialDays` | array | always `[]` in capture |
| `activityStatus` | enum | `PENDING`, `COMPLETED`, `CANCELED`. An `APPROVED` request can still be `PENDING` here (future leave?). |
| `accountingBasis` | enum | `DAY` |
| `policyAccrueInDays` | boolean | `true` |
| `leaveTypeName`, `leaveTypeUniqueId`, `leavePolicy`, `companyLeaveType` | string / id | policy identifiers |
| `isPaid` | boolean | |
| `requestedByName`, `processedByName` | string | personal data |
| `hours_by_company_leave_type_id` | object | `{ <companyLeaveTypeId>: hours }` |

A canceled request and its replacement share the same dates: duplicates by date are expected.

## Day length: `get_avg_hours_in_day`

`POST /api/pto/api/get_avg_hours_in_day/` (read-only) returns a JSON string, `"7.80"` here. Script v1.2 hardcoded `468` (`7.80 × 60`) to turn `numMinutes` into days; the script now reads `numDays` and does not call this endpoint. The Time Off page calls it on load. Body sent by the script tests: `{ "role": "<role_id>" }`.

## Known gaps

- More than 200 requests overlapping one year would be truncated: the script does not paginate.
- Public holidays inside a request are colored as leave. Whether `numDays` excludes them is an open question.
- Half days are colored as full days.

## Open questions

- Half-day and hourly requests: values of `startDateHalfDay`, `partialDays`, `startDateMinutes`. Needs a capture with such a request.
- Are public holidays inside a request excluded from `numDays`?
- Other `status` values (`REJECTED`?).
- `skip` semantics with a stable order: is the order deterministic between calls?
- Manager view (`requestedAccessLevel` other than `EE`): does `role` select another employee?
