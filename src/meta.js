// Userscript header, prepended to the bundle by build.mjs.
// Keep @name and @namespace stable: script managers use them to identify
// the installed script, changing them creates a duplicate install.

const REPO = 'https://github.com/remiflament/rippling-annual-calendar';
const DIST_URL = `${REPO}/releases/latest/download/rippling-annual-calendar.user.js`;

export function userscriptHeader(version) {
  return [
    '// ==UserScript==',
    '// @name         Rippling — Calendrier annuel absences',
    '// @namespace    https://app.rippling.com',
    `// @version      ${version}`,
    '// @description  Yearly leave calendar for Rippling',
    '// @match        https://app.rippling.com/*',
    '// @grant        none',
    `// @homepageURL  ${REPO}`,
    `// @supportURL   ${REPO}/issues`,
    `// @updateURL    ${DIST_URL}`,
    `// @downloadURL  ${DIST_URL}`,
    '// ==/UserScript==',
  ].join('\n');
}
