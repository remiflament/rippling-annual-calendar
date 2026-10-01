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
