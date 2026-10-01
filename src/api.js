import { reportSchema } from './debug.js';
import { validateHolidayCalendar, validateLeaveRequests } from './schema.js';

// Undocumented Rippling API, see docs/api/.

export function apiHeaders() {
  return {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
    'Role':          localStorage.getItem('role_id'),
    'Company':       localStorage.getItem('company_id'),
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'login-agent':   'rippling-web',
    'requestedAccessLevel': 'EE',
  };
}

export async function fetchLeaveRequestsRaw(year) {
  const roleId = localStorage.getItem('role_id');
  // Requests overlapping the year; `start`/`end` are ignored by the API.
  const url = `/api/pto/api/leave_requests/?role=${roleId}&limit=200`
            + `&endDate__gte=${year}-01-01&startDate__lte=${year}-12-31`;
  const r = await fetch(url, { headers: apiHeaders() });
  return r.json();
}

export async function fetchHolidayCalendarRaw() {
  const roleId = localStorage.getItem('role_id');
  const r = await fetch('/api/pto/api/get_holiday_calendar/', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ role: roleId, allow_time_admin: false, only_payable: false }),
  });
  return r.json();
}

// { 'YYYY-MM-DD': holidayName } for the given year.
export function holidaysForYear(calendar, year) {
  const entry = calendar.find(e => e.year === year);
  if (!entry) return {};
  const map = {};
  for (const h of entry.holidays) map[h.startDate] = h.name;
  return map;
}

const cache = {}; // { year: { requests, holidays } }

export function clearCache(year) {
  delete cache[year];
}

export async function loadYear(year) {
  if (cache[year]) return cache[year];
  const [requests, calendar] = await Promise.all([
    fetchLeaveRequestsRaw(year),
    fetchHolidayCalendarRaw(),
  ]);
  reportSchema('leave_requests', validateLeaveRequests(requests));
  reportSchema('get_holiday_calendar', validateHolidayCalendar(calendar));
  cache[year] = { requests, holidays: holidaysForYear(calendar, year) };
  return cache[year];
}
