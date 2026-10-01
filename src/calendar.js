import { isoLocal } from './dates.js';

export const POLICY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

// Statuses shown on the calendar and counted in totals.
export const COUNTED_STATUSES = ['APPROVED', 'PENDING'];

function policyName(r) {
  return r.policyDisplayName || '??';
}

// Weekdays (Mon-Fri) from startDate to endDate, inclusive, as Date objects.
// Rippling's `numDays` excludes weekends, so the calendar does too.
function workingDays(r) {
  const out = [];
  const end = new Date(r.endDate + 'T00:00:00');
  const maxDays = 365;
  let iter = 0;
  for (const d = new Date(r.startDate + 'T00:00:00'); d <= end && iter < maxDays; d.setDate(d.getDate() + 1), iter++) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
  }
  return out;
}

// Maps each working day of every counted request to its absence info.
// Returns { days: { 'YYYY-MM-DD': info }, policies: { name: colorIdx } }.
export function expandToDays(requests) {
  const policies = {};
  const days = {};
  for (const r of requests) {
    const p = policyName(r);
    if (!(p in policies)) policies[p] = Object.keys(policies).length % POLICY_COLORS.length;
  }
  for (const r of requests) {
    if (!COUNTED_STATUSES.includes(r.status)) continue;
    const policy = policyName(r);
    for (const d of workingDays(r)) {
      days[isoLocal(d)] = {
        policy, reason: r.reasonForLeave || '', status: r.status,
        colorIdx: policies[policy], start: r.startDate,
        end: r.endDate, days: parseFloat(r.numDays || 0),
      };
    }
  }
  return { days, policies };
}

// Total days per policy for counted requests, within `year`. A request
// spanning New Year splits its `numDays` by the share of its working days
// that fall in `year`.
export function totalsByPolicy(requests, year) {
  const byPolicy = {};
  for (const r of requests) {
    if (!COUNTED_STATUSES.includes(r.status)) continue;
    const wds = workingDays(r);
    if (!wds.length) continue;
    const inYear = wds.filter(d => d.getFullYear() === year).length;
    const p = policyName(r);
    byPolicy[p] = (byPolicy[p] || 0) + parseFloat(r.numDays || 0) * inYear / wds.length;
  }
  return byPolicy;
}
