// Offline demo: renders the calendar from sanitized fixtures, no Rippling
// session needed. Build with `npm run build`, open demo/index.html.
import leaveRequests from '../fixtures/leave_requests.json';
import holidayCalendar from '../fixtures/holiday_calendar.json';
import ptoSummary from '../fixtures/pto_summary.json';
import { showYear } from '../src/modal.js';

const ROUTES = {
  '/api/pto/api/leave_requests/': leaveRequests,
  '/api/pto/api/get_holiday_calendar/': holidayCalendar,
  '/api/pto/api/data/get_pto_summary_v2/': ptoSummary,
};

window.fetch = async (url) => {
  const body = ROUTES[new URL(url, 'https://app.rippling.com').pathname];
  return new Response(JSON.stringify(body ?? { detail: 'not found' }), { status: body ? 200 : 404 });
};

// Default year: the one holding most fixture requests. Balances only show
// on the current year: open with ?year=<current year> to see them.
function busiestYear() {
  const counts = {};
  for (const r of leaveRequests) counts[r.startDate.slice(0, 4)] = (counts[r.startDate.slice(0, 4)] || 0) + 1;
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

const year = Number(new URLSearchParams(location.search).get('year')) || busiestYear();
showYear(year);
