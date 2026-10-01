import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MINUTES_PER_DAY, POLICY_COLORS, expandToDays, totalsByPolicy } from '../src/calendar.js';

const req = (over) => ({
  startDate: '2026-03-02', endDate: '2026-03-02', status: 'APPROVED',
  policyDisplayName: 'Congés payés', numMinutes: String(MINUTES_PER_DAY), reasonForLeave: '',
  ...over,
});

test('single day request maps to one day', () => {
  const { days } = expandToDays([req()]);
  assert.deepEqual(Object.keys(days), ['2026-03-02']);
  assert.equal(days['2026-03-02'].days, 1);
});

test('multi-day request covers every calendar day, weekends included', () => {
  const { days } = expandToDays([req({ startDate: '2026-03-06', endDate: '2026-03-09', numMinutes: 2 * MINUTES_PER_DAY })]);
  assert.deepEqual(Object.keys(days), ['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09']);
  assert.equal(days['2026-03-07'].days, 2);
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
  const { days } = expandToDays([req({ startDate: '2025-12-30', endDate: '2026-01-02' })]);
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
    req({ numMinutes: MINUTES_PER_DAY }),
    req({ numMinutes: MINUTES_PER_DAY / 2 }),
    req({ numMinutes: MINUTES_PER_DAY, policyDisplayName: 'RTT' }),
    req({ numMinutes: MINUTES_PER_DAY, status: 'REJECTED' }),
  ]);
  assert.deepEqual(totals, { 'Congés payés': 1.5, RTT: 1 });
});
