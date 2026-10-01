# Rippling API (reverse-engineered)

Endpoints used by the Rippling web app, as observed. Not an official contract: any of it can change.

Each fact carries a source:

- **code**: what script v1.2 relies on and works in practice, not checked against a capture.
- **capture YYYY-MM-DD**: observed in a real response on that date.

| Endpoint | Used for | Page |
|---|---|---|
| `GET /api/pto/api/leave_requests/` | leave requests of a year | [leave-requests.md](leave-requests.md) |
| `POST /api/pto/api/get_holiday_calendar/` | public holidays | [holiday-calendar.md](holiday-calendar.md) |
| `GET /api/pto/api/data/get_pto_summary_v2/` | leave balances (taken vs accrued, annual amount) | [pto-summary.md](pto-summary.md) |
| `POST /api/pto/api/get_avg_hours_in_day/` | length of a day (not used yet) | [leave-requests.md](leave-requests.md#day-length-get_avg_hours_in_day) |

Seen on the Time Off page load but not studied (capture 2026-10-01): `POST /api/pto/api/leave_policies/get_eligible_policies/`, `POST /api/pto/api/time_off_settings/`, `GET /api/pto/api/get_fixed_company_leave_types/`. The Time Off page itself does not call `leave_requests`.

## Base URL

Same origin as the app: `https://app.rippling.com`. Relative URLs work from a userscript on that origin. (code)

## Authentication

The web app stores its session in `localStorage` (code):

| Key | Meaning |
|---|---|
| `access_token` | bearer token |
| `role_id` | current user's role (employee) id |
| `company_id` | current company id |
| `DVTokenExpiration` | probably the token expiry (capture 2026-10-01, not checked) |

Headers sent by the script (code):

| Header | Value |
|---|---|
| `Authorization` | `Bearer <access_token>` |
| `Role` | `<role_id>` |
| `Company` | `<company_id>` |
| `login-agent` | `rippling-web` |
| `requestedAccessLevel` | `EE` (employee view) |
| `Accept`, `Content-Type` | `application/json` |

Required headers, tested on `leave_requests` (capture 2026-10-01):

| Removed header | Result |
|---|---|
| `Authorization` | `401`, body `{ "detail": … }` |
| `Company` | `403`, body `{ "detail": … }` |
| `Role`, `login-agent`, `requestedAccessLevel` | `200`, same data |

The web app also sends `device-fingerprint`, `activity-session-id` and tracing headers; none are needed.

## Open questions

- Token lifetime and the error on expiry.
