# Reverse engineering the Rippling API

Rippling publishes no documentation for the endpoints its web app uses. This page is the procedure to observe them, record what we learn, and check that the script still matches the live API.

What we know so far lives in [api/](api/README.md). Each finding there says how it was verified.

## Rules

- Read-only. Observe and replay requests that read data. Never create, edit, cancel or approve anything.
- Use your own account and data.
- Raw captures contain your token and personal data. Keep them in `captures/` or as `*.har` (both gitignored). Commit only sanitized fixtures.

## 1. Capture

### Option A: DevTools HAR

1. Open <https://app.rippling.com/time-products> and DevTools → **Network**, filter `api/pto`.
2. Check **Preserve log**. Reload, then browse: time off overview, requests history, other years, holiday calendar.
3. Right click in the request list → **Save all as HAR (sanitized)**. Save to `captures/rippling.har`.

"Sanitized" HAR export in Chrome strips cookies and auth headers, but response bodies still hold personal data.

### Option B: agent-driven browser

An agent (Claude in Chrome) can drive your logged-in tab: navigate Time Off pages, list `/api/pto/` requests, and replay GET requests from the page context with `fetch`. Ask it to save raw bodies under `captures/<endpoint>.json` and to follow the rules above.

### Replaying a request

From the console of a logged-in Rippling tab, reuse the script headers:

```js
const h = {
  Authorization: 'Bearer ' + localStorage.getItem('access_token'),
  Role: localStorage.getItem('role_id'),
  Company: localStorage.getItem('company_id'),
  Accept: 'application/json',
  'login-agent': 'rippling-web',
  requestedAccessLevel: 'EE',
};
const role = localStorage.getItem('role_id');
await (await fetch(`/api/pto/api/leave_requests/?role=${role}&limit=200&start=2026-01-01&end=2026-12-31`, { headers: h })).json();
```

Vary one parameter at a time (dates, `limit`, `offset`, a removed header) to learn its effect.

## 2. Sanitize into fixtures

```bash
node scripts/sanitize-har.mjs captures/rippling.har
```

Also accepts one raw body: `captures/leave_requests.json` or `captures/holiday_calendar.json`.

It writes `fixtures/<endpoint>.json`: same shape, numbers and enum values; ids replaced by stable fake ids; other strings redacted except policy and holiday names; leave request dates shifted by a random number of whole weeks (weekdays and durations stay true). Each run picks a new shift, so a refresh rewrites every date. Then:

1. Read the diff of `fixtures/`. Search it for your name, email and any known id. Real leave dates also belong out of docs and commit messages. The rules are heuristics: an all-caps name would pass as an enum.
2. Run `npm test`: `test/schema.test.js` validates fixtures against `src/schema.js`.

## 3. Record findings

Update the endpoint page in `docs/api/`. For each fact, say how it was observed (capture date, which request). Move answered items out of **Open questions**. When the script must read a new field, update `src/schema.js` and the fixture in the same change.

## Live check

Two tools reuse `src/schema.js` against the live API. Both print field paths, types and enum values, never values.

Rippling wraps `console` with Datadog browser logs: what the page logs is forwarded to Rippling's Datadog (seen 2026-10-01). Keep personal values out of any `console` call made from a Rippling tab.

### Probe

1. `npm run build` (or download `probe.js` from the latest release).
2. In a logged-in Rippling tab console, paste `dist/probe.js`.
3. Read the report: record counts, status values, every field with its observed types, then `RESULT: OK` or `RESULT: SCHEMA DRIFT` with the failing paths.

New fields in the field table hint at data the script could use.

### Debug mode

```js
localStorage.setItem('rca_debug', '1')
```

Reload, open the calendar. Each load logs `schema OK` or a table of issues. Disable with `localStorage.removeItem('rca_debug')`.
