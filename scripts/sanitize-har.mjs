#!/usr/bin/env node
// Turns captured Rippling responses into anonymized fixtures.
//
//   node scripts/sanitize-har.mjs captures/rippling.har
//   node scripts/sanitize-har.mjs captures/leave_requests.json
//
// HAR input: every response of a known endpoint is extracted.
// JSON input: the file name must be an endpoint name (see ENDPOINTS).
// Output goes to fixtures/<endpoint>.json. Review the diff before committing.
//
// Rules: keys, numbers, booleans, null, dates, datetimes and UPPER_SNAKE
// enum values are kept. Hex/UUID ids, as values or keys, become stable fake
// ids. Any other string is redacted, except for keys in KEEP_KEYS (non
// personal data).
//
// Leave request dates are personal too (when someone is away): they are all
// shifted by the same random number of weeks, so weekdays and durations stay
// true but the real dates are gone. Holiday dates are public and kept.

import { randomInt } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENDPOINTS = {
  leave_requests: '/api/pto/api/leave_requests/',
  holiday_calendar: '/api/pto/api/get_holiday_calendar/',
  pto_summary: '/api/pto/api/data/get_pto_summary_v2/',
};

const SHIFTED_ENDPOINTS = new Set(['leave_requests']);

// Company-level config, not personal: needed to keep fixtures meaningful.
const KEEP_KEYS = new Set(['policyDisplayName', 'name']);
// `name` is only kept inside holiday entries.
const KEEP_KEYS_ONLY_UNDER = { name: 'holidays' };

const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
const ENUM_RE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;
const NUMERIC_RE = /^-?\d+(\.\d+)?$/;
const ID_RE = /^([0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// Shifts the YYYY-MM-DD part of a date or datetime string, keeps the rest.
export function shiftDate(value, days) {
  const d = new Date(value.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10) + value.slice(10);
}

// Returns sanitize(value, { shiftDays }). Fake ids are stable across calls.
export function createSanitizer() {
  const ids = new Map();
  const fakeId = (id) => {
    if (!ids.has(id)) ids.set(id, String(ids.size + 1).padStart(24, '0'));
    return ids.get(id);
  };

  let shiftDays = 0;

  function sanitizeString(value, key, parentKey) {
    if (DATE_RE.test(value)) return shiftDays ? shiftDate(value, shiftDays) : value;
    if (ENUM_RE.test(value) || NUMERIC_RE.test(value) || value === '') return value;
    if (ID_RE.test(value)) return fakeId(value);
    if (KEEP_KEYS.has(key) && (!KEEP_KEYS_ONLY_UNDER[key] || KEEP_KEYS_ONLY_UNDER[key] === parentKey)) return value;
    return `<redacted:${key}>`;
  }

  function walk(value, key = '', parentKey = '') {
    if (Array.isArray(value)) return value.map(v => walk(v, key, parentKey));
    if (value && typeof value === 'object') {
      // Keys can be ids too, e.g. { "<leaveTypeId>": 7.8 }.
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [ID_RE.test(k) ? fakeId(k) : k, walk(v, k, key)]));
    }
    if (typeof value === 'string') return sanitizeString(value, key, parentKey);
    return value;
  }

  return (value, options = {}) => {
    shiftDays = options.shiftDays ?? 0;
    return walk(value);
  };
}

function endpointOf(url) {
  const path = new URL(url, 'https://app.rippling.com').pathname;
  return Object.keys(ENDPOINTS).find(name => path === ENDPOINTS[name]);
}

function responseBody(entry) {
  const { text, encoding } = entry.response.content ?? {};
  if (!text) return null;
  return JSON.parse(encoding === 'base64' ? Buffer.from(text, 'base64').toString('utf8') : text);
}

async function main(file) {
  const raw = JSON.parse(await readFile(file, 'utf8'));
  const bodies = {};
  if (extname(file) === '.har') {
    for (const entry of raw.log.entries) {
      const name = endpointOf(entry.request.url);
      const body = name && responseBody(entry);
      if (body) bodies[name] = body; // last response wins
    }
  } else {
    const name = basename(file, '.json');
    if (!ENDPOINTS[name]) throw new Error(`unknown endpoint "${name}", expected one of ${Object.keys(ENDPOINTS)}`);
    bodies[name] = raw;
  }
  if (!Object.keys(bodies).length) throw new Error('no known endpoint response found');

  const sanitize = createSanitizer(); // shared: same real id -> same fake id across files
  const shiftDays = 7 * randomInt(5, 105); // not printed on purpose
  await mkdir('fixtures', { recursive: true });
  for (const [name, body] of Object.entries(bodies)) {
    const out = `fixtures/${name}.json`;
    const options = { shiftDays: SHIFTED_ENDPOINTS.has(name) ? shiftDays : 0 };
    await writeFile(out, JSON.stringify(sanitize(body, options), null, 2) + '\n');
    console.log(`wrote ${out}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    console.error('usage: node scripts/sanitize-har.mjs <capture.har|endpoint.json>');
    process.exit(1);
  }
  main(process.argv[2]).catch(e => { console.error(e.message); process.exit(1); });
}
