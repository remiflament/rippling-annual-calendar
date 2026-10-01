// Offline demo: renders the calendar from sanitized fixtures, no Rippling
// session needed. Build with `npm run build`, open demo/index.html.
import leaveRequests from '../fixtures/leave_requests.json';
import holidayCalendar from '../fixtures/holiday_calendar.json';
import ptoSummary from '../fixtures/pto_summary.json';
import { showYear } from '../src/modal.js';

// Default year: the one holding most fixture requests.
function busiestYear() {
  const counts = {};
  for (const r of leaveRequests) counts[r.startDate.slice(0, 4)] = (counts[r.startDate.slice(0, 4)] || 0) + 1;
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

// Balances only show on the current year, and the pto_summary fixture is a
// snapshot taken on CAPTURE_DATE. Leave request dates are shifted by the
// sanitizer, so the demo moves "today" and the balance periods to the
// busiest year: balances and a filled calendar on the same screen.
const CAPTURE_DATE = '2026-10-01';
const demoYear = busiestYear();
const yearShift = demoYear - Number(CAPTURE_DATE.slice(0, 4));
const shiftYear = iso => (Number(iso.slice(0, 4)) + yearShift) + iso.slice(4);

const NOW = new Date(shiftYear(CAPTURE_DATE) + 'T12:00:00').getTime();
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return NOW; }
};

const demoSummary = {
  ...ptoSummary,
  pto_summary: ptoSummary.pto_summary.map(p => ({ ...p, accountingYearStart: shiftYear(p.accountingYearStart) })),
};

const ROUTES = {
  '/api/pto/api/leave_requests/': leaveRequests,
  '/api/pto/api/get_holiday_calendar/': holidayCalendar,
  '/api/pto/api/data/get_pto_summary_v2/': demoSummary,
};

window.fetch = async (url) => {
  const body = ROUTES[new URL(url, 'https://app.rippling.com').pathname];
  return new Response(JSON.stringify(body ?? { detail: 'not found' }), { status: body ? 200 : 404 });
};

const year = Number(new URLSearchParams(location.search).get('year')) || demoYear;
showYear(year);
