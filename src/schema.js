// Shape of the Rippling responses the script relies on.
// Reverse-engineered: see docs/api/. Keep in sync with fixtures/.
//
// Field types: 'string', 'number', 'date' (YYYY-MM-DD string),
// 'numeric' (number or numeric string), 'array'.
// A trailing '?' means the field may be missing or null.

export const LEAVE_REQUEST_FIELDS = {
  startDate: 'date',
  endDate: 'date',
  status: 'string',
  policyDisplayName: 'string',
  numMinutes: 'numeric',
  reasonForLeave: 'string?',
};

export const HOLIDAY_YEAR_FIELDS = {
  year: 'number',
  holidays: 'array',
};

export const HOLIDAY_FIELDS = {
  startDate: 'date',
  name: 'string',
};

// One entry of `get_pto_summary_v2` `pto_summary`.
export const PTO_SUMMARY_FIELDS = {
  policyDisplayName: 'string',
  isFixedLeavePolicy: 'boolean',
  accrueInDays: 'boolean',
  accountingYearStart: 'date',
  balanceDays: 'numeric',
  hourlyRate: 'numeric?',
};

// `{ days }` objects read on accruing policies (`isFixedLeavePolicy`).
export const PTO_SUMMARY_DAYS_PATHS = [
  'accruedInCurrentPeriod',
  'takenAndScheduled.taken',
  'takenAndScheduled.futureApproved',
  'takenAndScheduled.pending',
];

// `{ accrued, taken, balance }` of each French paid leave reference period,
// read when `frCopReferencePeriodBalance` is present.
export const PTO_SUMMARY_REF_PERIOD_FIELDS = { accrued: 'numeric', taken: 'numeric', balance: 'numeric' };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function matches(value, type) {
  switch (type) {
    case 'date': return typeof value === 'string' && DATE_RE.test(value);
    case 'numeric': return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)));
    case 'array': return Array.isArray(value);
    default: return typeof value === type;
  }
}

// Returns issues as { path, expected, actual }. Never includes values,
// so issues are safe to log or paste in an issue.
export function checkFields(obj, fields, path) {
  const issues = [];
  for (const [key, spec] of Object.entries(fields)) {
    const optional = spec.endsWith('?');
    const type = optional ? spec.slice(0, -1) : spec;
    const value = obj?.[key];
    if (value === undefined || value === null) {
      if (!optional) issues.push({ path: `${path}.${key}`, expected: type, actual: typeOf(value) });
    } else if (!matches(value, type)) {
      issues.push({ path: `${path}.${key}`, expected: spec, actual: typeOf(value) });
    }
  }
  return issues;
}

export function validateLeaveRequests(data) {
  if (!Array.isArray(data)) return [{ path: 'leave_requests', expected: 'array', actual: typeOf(data) }];
  return data.flatMap((r, i) => checkFields(r, LEAVE_REQUEST_FIELDS, `leave_requests[${i}]`));
}

export function validateHolidayCalendar(data) {
  if (!Array.isArray(data)) return [{ path: 'holiday_calendar', expected: 'array', actual: typeOf(data) }];
  return data.flatMap((y, i) => {
    const path = `holiday_calendar[${i}]`;
    const issues = checkFields(y, HOLIDAY_YEAR_FIELDS, path);
    if (Array.isArray(y?.holidays)) {
      y.holidays.forEach((h, j) => issues.push(...checkFields(h, HOLIDAY_FIELDS, `${path}.holidays[${j}]`)));
    }
    return issues;
  });
}

export function validatePtoSummary(data) {
  const list = data?.pto_summary;
  if (!Array.isArray(list)) return [{ path: 'pto_summary', expected: 'array', actual: typeOf(list) }];
  return list.flatMap((p, i) => {
    const path = `pto_summary[${i}]`;
    const issues = checkFields(p, PTO_SUMMARY_FIELDS, path);
    if (p?.isFixedLeavePolicy) {
      for (const sub of PTO_SUMMARY_DAYS_PATHS) {
        const obj = sub.split('.').reduce((o, k) => o?.[k], p);
        issues.push(...checkFields(obj, { days: 'numeric' }, `${path}.${sub}`));
      }
    }
    const ref = p?.frCopReferencePeriodBalance;
    if (ref) {
      for (const sub of ['previous', 'current']) {
        issues.push(...checkFields(ref[sub], PTO_SUMMARY_REF_PERIOD_FIELDS, `${path}.frCopReferencePeriodBalance.${sub}`));
      }
    }
    return issues;
  });
}
