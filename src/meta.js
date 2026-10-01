// Userscript header, prepended to the bundle by build.mjs.
// Keep @name and @namespace stable: script managers use them to identify
// the installed script, changing them creates a duplicate install.
// The dev build relies on that: its own @name installs next to the release.

const REPO = 'https://github.com/remiflament/rippling-annual-calendar';
const DIST_URL = `${REPO}/releases/latest/download/rippling-annual-calendar.user.js`;

const NAME = 'Rippling — Calendrier annuel absences';

// `dev`: local build to install next to the release. No update URLs, so the
// script manager never replaces it with the release.
export function userscriptHeader(version, { dev = false } = {}) {
  return [
    '// ==UserScript==',
    `// @name         ${dev ? NAME + ' (dev)' : NAME}`,
    '// @namespace    https://app.rippling.com',
    `// @version      ${dev ? version + '-dev' : version}`,
    '// @description  Yearly leave calendar for Rippling',
    '// @match        https://app.rippling.com/*',
    '// @grant        none',
    `// @homepageURL  ${REPO}`,
    `// @supportURL   ${REPO}/issues`,
    ...(dev ? [] : [
      `// @updateURL    ${DIST_URL}`,
      `// @downloadURL  ${DIST_URL}`,
    ]),
    '// ==/UserScript==',
  ].join('\n');
}
