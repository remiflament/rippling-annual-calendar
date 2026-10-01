# AGENTS.md

Userscript (Violentmonkey) that adds a yearly leave calendar to `app.rippling.com`. Sources in `src/` are bundled by esbuild into one IIFE at `dist/rippling-annual-calendar.user.js`; the header comes from `src/meta.js`.

## Architecture

- **Pure core**: `calendar.js` (requests to days, totals), `render.js` (HTML strings), `schema.js` (response shapes), `i18n.js`. These modules take data and return data, so `node --test` covers them without a DOM or network.
- **Browser shell**: `api.js` (fetch + cache), `modal.js` (DOM, events), `main.js` (button injection, SPA navigation hooks), `debug.js`.
- **Offline demo**: `demo/` renders the calendar from `fixtures/` with a stubbed `fetch`. Check visual changes there; it is also the only source for `docs/screenshot.png`.
- Put new logic in the pure core and keep the shell thin.
- The bundle ships with zero runtime dependencies.

## Rippling API

The API is undocumented and reverse-engineered. Its source of truth is three artifacts that move together: `docs/api/` (prose), `fixtures/` (sanitized real responses), `src/schema.js` (fields the script reads). A change to how the script reads a response updates all three in the same commit.

Before touching `api.js`, `calendar.js` or `schema.js`, read `docs/api/README.md`. To capture new responses, refresh fixtures or check the live API, follow `docs/reverse-engineering.md`.

Exploration is read-only: call only endpoints that read data (GET, plus the POSTs marked read-only in `docs/api/`). Leave requests, approvals and settings untouched.

## Privacy

Committed data is anonymized data. Raw captures live in `captures/` and `*.har`, both gitignored. Fixtures come only from `scripts/sanitize-har.mjs` and get a manual review for names, emails, ids and leave reasons before commit. Logs from `debug.js` and `probe/` print field paths, types and enum values, never field values: Rippling forwards page `console` output to its own Datadog.

## Conventions

- Code, comments and docs in English.
- Every UI string lives in `src/i18n.js`; other modules read `t.<key>`. A new key goes in every locale (`test/i18n.test.js` enforces it). Default locale is set by `LOCALE`.
- Compare API status codes (`APPROVED`), never translated labels.
- Keep `@name` and `@namespace` in `src/meta.js` stable: script managers identify installs by them.
- Release: bump `version` in `package.json`, tag `v<version>`; `.github/workflows/release.yml` publishes the asset that `@updateURL` points to.
