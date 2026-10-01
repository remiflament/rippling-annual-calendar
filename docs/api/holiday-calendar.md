# `POST /api/pto/api/get_holiday_calendar/`

Public holidays of the employee's holiday calendar. A POST, but read-only. The Time Off page calls it on load.

Source: **capture 2026-10-01** unless marked **code**.

## Request

```json
{ "role": "<role_id>", "allow_time_admin": false, "only_payable": false }
```

Body as sent by the web app and the script. Effect of `allow_time_admin` and `only_payable` not tested.

## Response

JSON array, one entry per year. The capture returned 2023 to 2030, in one call. Sanitized example: [`fixtures/holiday_calendar.json`](../../fixtures/holiday_calendar.json).

```json
[
  {
    "year": 2026,
    "holidays": [
      {
        "name": "Jour de l'An",
        "type": "FULL_DAY",
        "startDate": "2026-01-01",
        "endDate": "2026-01-01",
        "shouldCountTowardHoursWorkedForOvertime": false
      }
    ]
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `year` | number | read by the script |
| `holidays[].name` | string | read by the script |
| `holidays[].startDate` | `YYYY-MM-DD` | read by the script |
| `holidays[].endDate` | `YYYY-MM-DD` | equal to `startDate` for every holiday of the capture |
| `holidays[].type` | enum | `FULL_DAY` only in capture |
| `holidays[].shouldCountTowardHoursWorkedForOvertime` | boolean | |

## Known gaps in script v1.2

- The script fetches the whole calendar once per displayed year; one call covers all years.
- Multi-day holidays would show on `startDate` only.

## Open questions

- Other `type` values (half-day holidays?).
- Which year range is returned, and does it move with the current year?
