import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POLICY_COLORS, expandToDays, totalsByPolicy } from '../src/calendar.js';

const req = (over) => ({
  startDate: '2026-03-02', endDate: '2026-03-02', status: 'APPROVED',
  policyDisplayName: 'Congés payés', numDays: '1.00', reasonForLeave: '',
  ...over,
});

test('single day request maps to one day', () => {
  const { days } = expandToDays([req()]);
  assert.deepEqual(Object.keys(days), ['2026-03-02']);
  assert.equal(days['2026-03-02'].days, 1);
});

test('multi-day request covers working days only, weekends excluded', () => {
  const { days } = expandToDays([req({ startDate: '2026-03-06', endDate: '2026-03-09', numDays: '2.00' })]);
  assert.deepEqual(Object.keys(days), ['2026-03-06', '2026-03-09']);
  assert.equal(days['2026-03-09'].days, 2);
});

test('duration comes from numDays', () => {
  // Saturday to next Sunday: 9 calendar days, 5 working days.
  const { days } = expandToDays([req({ startDate: '2026-03-07', endDate: '2026-03-15', numDays: '5.00' })]);
  assert.equal(Object.keys(days).length, 5);
  assert.equal(days['2026-03-10'].days, 5);
});

test('only APPROVED and PENDING are shown', () => {
  const { days } = expandToDays([
    req({ startDate: '2026-01-05', endDate: '2026-01-05', status: 'PENDING' }),
    req({ startDate: '2026-01-06', endDate: '2026-01-06', status: 'REJECTED' }),
    req({ startDate: '2026-01-07', endDate: '2026-01-07', status: 'CANCELED' }),
  ]);
  assert.deepEqual(Object.keys(days), ['2026-01-05']);
});

test('request spanning new year keeps all days', () => {
  const { days } = expandToDays([req({ startDate: '2025-12-30', endDate: '2026-01-02', numDays: '4.00' })]);
  assert.deepEqual(Object.keys(days), ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
});

test('policies get colors in first-seen order, wrapping around', () => {
  const names = Array.from({ length: POLICY_COLORS.length + 1 }, (_, i) => `P${i}`);
  const { policies } = expandToDays(names.map(n => req({ policyDisplayName: n })));
  assert.equal(policies.P0, 0);
  assert.equal(policies.P1, 1);
  assert.equal(policies[`P${POLICY_COLORS.length}`], 0);
});

test('missing policy name falls back to ??', () => {
  const { policies } = expandToDays([req({ policyDisplayName: null })]);
  assert.deepEqual(Object.keys(policies), ['??']);
});

test('totals sum counted requests per policy in days', () => {
  const totals = totalsByPolicy([
    req({ numDays: '1.00' }),
    req({ numDays: '0.50' }),
    req({ numDays: '1.00', policyDisplayName: 'RTT' }),
    req({ numDays: '1.00', status: 'REJECTED' }),
  ], 2026);
  assert.deepEqual(totals, { 'Congés payés': 1.5, RTT: 1 });
});

test('totals only count days inside the year', () => {
  const totals = (year) => totalsByPolicy([
    req({ startDate: '2025-06-01', endDate: '2025-06-01' }),
    req({ startDate: '2027-06-01', endDate: '2027-06-01' }),
    req({ startDate: '2026-06-01', endDate: '2026-06-01' }),
  ], year);
  assert.deepEqual(totals(2026), { 'Congés payés': 1 });
});

test('request spanning new year splits its days between both years', () => {
  // Tue 2025-12-30 to Mon 2026-01-05: 2 working days in 2025, 3 in 2026.
  const r = req({ startDate: '2025-12-30', endDate: '2026-01-05', numDays: '5.00' });
  assert.deepEqual(totalsByPolicy([r], 2025), { 'Congés payés': 2 });
  assert.deepEqual(totalsByPolicy([r], 2026), { 'Congés payés': 3 });
});
