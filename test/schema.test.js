import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateHolidayCalendar, validateLeaveRequests, validatePtoSummary } from '../src/schema.js';

const fixture = async name => JSON.parse(await readFile(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));

test('leave_requests fixture matches schema', async () => {
  assert.deepEqual(validateLeaveRequests(await fixture('leave_requests')), []);
});

test('holiday_calendar fixture matches schema', async () => {
  assert.deepEqual(validateHolidayCalendar(await fixture('holiday_calendar')), []);
});

test('pto_summary fixture matches schema', async () => {
  assert.deepEqual(validatePtoSummary(await fixture('pto_summary')), []);
});

test('reports pto_summary drift on nested paths', async () => {
  const { pto_summary: [first, ...rest] } = await fixture('pto_summary');
  const drifted = { pto_summary: [{ ...first, takenAndScheduled: { ...first.takenAndScheduled, taken: {} } }, ...rest] };
  assert.deepEqual(validatePtoSummary(drifted), [
    { path: 'pto_summary[0].takenAndScheduled.taken.days', expected: 'numeric', actual: 'undefined' },
  ]);
  assert.deepEqual(validatePtoSummary([]), [{ path: 'pto_summary', expected: 'array', actual: 'undefined' }]);
});

test('reports drift with path and types only', async () => {
  const [first, ...rest] = await fixture('leave_requests');
  const drifted = [{ ...first, startDate: 20260302, status: undefined }, ...rest];
  assert.deepEqual(validateLeaveRequests(drifted), [
    { path: 'leave_requests[0].startDate', expected: 'date', actual: 'number' },
    { path: 'leave_requests[0].status', expected: 'string', actual: 'undefined' },
  ]);
});

test('reports a non-array response', () => {
  assert.deepEqual(validateHolidayCalendar({ detail: 'x' }), [{ path: 'holiday_calendar', expected: 'array', actual: 'object' }]);
});
