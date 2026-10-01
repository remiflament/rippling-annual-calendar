# Installation

## 1. Userscript manager

| Browser | Extension | Notes |
|---|---|---|
| Firefox | [Violentmonkey](https://violentmonkey.github.io/) | Works out of the box. |
| Chrome | [Orangemonkey](https://chromewebstore.google.com/detail/orangemonkey/ekmeppjgajofkpiofbebgcbohbmfldaf) | Violentmonkey fork compatible with Manifest V3. Enable **Developer mode** in `chrome://extensions` and allow userscripts for the extension. |

## 2. Script

Open the latest release asset:

<https://github.com/remiflament/rippling-annual-calendar/releases/latest/download/rippling-annual-calendar.user.js>

The extension detects the `.user.js` file and shows an install page. Confirm.

The script declares `@updateURL`, so the extension checks this URL and updates the script on its own.

### Manual install

1. Download `rippling-annual-calendar.user.js` from the [latest release](https://github.com/remiflament/rippling-annual-calendar/releases/latest).
2. Open the extension dashboard (extension icon → **Dashboard**).
3. Click **+** (new script), delete the default content, paste the file content.
4. Save with **Ctrl+S** / **Cmd+S**.

### Migrating from the gist

The gist version (v1.2) has no update URL. Install from the link above: the script name and namespace are unchanged, so the extension replaces the old version instead of adding a second one.

## 3. Check

1. Open <https://app.rippling.com/time-products>.
2. A **Calendrier annuel** button appears at the bottom right. It shows only on Time Off pages.
3. Click it: the calendar of the current year opens.

## Troubleshooting

| Symptom | Check |
|---|---|
| No button | Script enabled in the extension? URL starts with `https://app.rippling.com/time-products`? On Chrome, developer mode on? |
| `Erreur : …` in the calendar | Session expired: reload Rippling. If it persists, the API may have changed: run the probe ([reverse-engineering.md](reverse-engineering.md#live-check)) and open an issue with its output. |
| Missing or wrong leaves | See known gaps in [api/leave-requests.md](api/leave-requests.md). |
