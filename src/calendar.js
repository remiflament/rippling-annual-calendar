import { isoLocal } from './dates.js';

export const POLICY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

// Statuses shown on the calendar and counted in totals.
export const COUNTED_STATUSES = ['APPROVED', 'PENDING'];

// Assumed length of a working day in `numMinutes` (7.8 h).
export const MINUTES_PER_DAY = 468;

function policyName(r) {
  return r.policyDisplayName || '??';
}

// Maps each day of every counted request to its absence info.
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
    const start = new Date(r.startDate + 'T00:00:00');
    const end   = new Date(r.endDate   + 'T00:00:00');
    const policy = policyName(r);
    const daysCount = Math.round(parseFloat(r.numMinutes || 0) / MINUTES_PER_DAY);
    const maxDays = 365;
    let iter = 0;
    for (const d = new Date(start); d <= end && iter < maxDays; d.setDate(d.getDate() + 1), iter++) {
      days[isoLocal(d)] = {
        policy, reason: r.reasonForLeave || '', status: r.status,
        colorIdx: policies[policy], start: r.startDate,
        end: r.endDate, days: daysCount,
      };
    }
  }
  return { days, policies };
}

// Total days per policy for counted requests.
export function totalsByPolicy(requests) {
  const byPolicy = {};
  for (const r of requests) {
    if (!COUNTED_STATUSES.includes(r.status)) continue;
    const p = policyName(r);
    byPolicy[p] = (byPolicy[p] || 0) + parseFloat(r.numMinutes || 0) / MINUTES_PER_DAY;
  }
  return byPolicy;
}
