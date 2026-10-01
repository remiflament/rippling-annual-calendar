# Development

Requires Node.js 22+.

```bash
npm install
npm test        # unit tests (node:test)
npm run build   # dist/: userscript (release and dev), probe.js, demo.js
```

## Layout

```
src/            userscript sources (entry: main.js, header: meta.js)
probe/          live API check, built to dist/probe.js
demo/           offline demo on fixtures, built to dist/demo.js
scripts/        sanitize-har.mjs: captures -> anonymized fixtures
fixtures/       sanitized API responses used by tests
test/           unit tests
docs/api/       reverse-engineered API reference
```

`AGENTS.md` describes the architecture and conventions.

## Offline demo

`npm run build`, then open `demo/index.html` in a browser. It renders the calendar from `fixtures/` with a stubbed `fetch`: no Rippling session needed. `?year=2026` picks the year; the default is the year with most fixture requests. The demo sets "today" in that year (same day as the `pto_summary` capture) so the balances block shows there.

`docs/screenshot.png` comes from this page (panel only, 1280×1000 viewport). Regenerate it after a visual change, never from a real Rippling session.

## Try a local build in the browser

`dist/rippling-annual-calendar.dev.user.js` is the same bundle with `(dev)` appended to `@name` and no update URLs: it installs next to the released script instead of replacing it. Keep only one of the two enabled: both inject the same button and modal.

Violentmonkey can track a local file:

1. `npm run build`.
2. Open `dist/rippling-annual-calendar.dev.user.js` in the browser (`file://…`). On Chrome, allow file access for the extension first.
3. On the install page, check **Track local file** and keep the tab open. Each rebuild reloads the script.

Otherwise, paste the built file in a new script in the dashboard.

To avoid a conflict with the released version, disable it while testing.

## Change the language

Set `LOCALE` in `src/i18n.js` (`'fr'` or `'en'`). To add a language, copy the `fr` block, translate it, and run `npm test`: it fails when a key is missing.

## Release

1. Bump `version` in `package.json` (semver).
2. Commit, then tag and push:

```bash
git tag v1.3.0
```

```bash
git push origin main --tags
```

The `Release` workflow checks the tag matches `package.json`, builds, and publishes `rippling-annual-calendar.user.js` and `probe.js` as release assets. Installed scripts pick up the new version through `@updateURL`.
