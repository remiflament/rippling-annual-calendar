// Live API check. Paste dist/probe.js in the console of a logged-in
// app.rippling.com tab. Prints field names, types and enum values only.
import { fetchHolidayCalendarRaw, fetchLeaveRequestsRaw } from '../src/api.js';
import { validateHolidayCalendar, validateLeaveRequests } from '../src/schema.js';

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

// { field: 'type1|type2' } across all records, to spot new or changed fields.
function fieldTypes(records) {
  const seen = {};
  for (const r of records) {
    for (const [k, v] of Object.entries(r ?? {})) (seen[k] ??= new Set()).add(typeOf(v));
  }
  return Object.fromEntries(Object.entries(seen).sort().map(([k, s]) => [k, [...s].join('|')]));
}

function countBy(records, key) {
  const counts = {};
  for (const r of records) counts[r?.[key]] = (counts[r?.[key]] || 0) + 1;
  return counts;
}

(async () => {
  const year = new Date().getFullYear();
  const [requests, calendar] = await Promise.all([fetchLeaveRequestsRaw(year), fetchHolidayCalendarRaw()]);
  const requestIssues = validateLeaveRequests(requests);
  const calendarIssues = validateHolidayCalendar(calendar);

  console.group(`[rca probe] ${year}`);
  console.log('leave_requests: %s records, %s schema issue(s)',
    Array.isArray(requests) ? requests.length : '?', requestIssues.length);
  if (requestIssues.length) console.table(requestIssues);
  if (Array.isArray(requests)) {
    console.log('status values:', countBy(requests, 'status'));
    console.log('leave_requests fields:');
    console.table(fieldTypes(requests));
  }
  console.log('get_holiday_calendar: years %o, %s schema issue(s)',
    Array.isArray(calendar) ? calendar.map(e => e?.year) : '?', calendarIssues.length);
  if (calendarIssues.length) console.table(calendarIssues);
  if (Array.isArray(calendar)) {
    console.log('holiday fields:');
    console.table(fieldTypes(calendar.flatMap(e => e?.holidays ?? [])));
  }
  console.log(requestIssues.length + calendarIssues.length === 0 ? 'RESULT: OK' : 'RESULT: SCHEMA DRIFT');
  console.groupEnd();
})().catch(e => console.error('[rca probe] failed:', e));
