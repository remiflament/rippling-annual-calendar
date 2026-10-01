import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { balancesFromSummary } from '../src/balances.js';

const fixture = async () => JSON.parse(await readFile(new URL('../fixtures/pto_summary.json', import.meta.url), 'utf8'));

const policy = (over) => ({
  policyDisplayName: 'RTT', isFixedLeavePolicy: true, accrueInDays: true,
  accountingYearStart: '2026-01-01', balanceDays: '2.00', hourlyRate: '10.00',
  accruedInCurrentPeriod: { days: '5.00' },
  takenAndScheduled: { taken: { days: '3.00' }, futureApproved: { days: '1.00' }, pending: { days: '0.50' } },
  ...over,
});

test('fixture: keeps accruing policies in use, in API order', async () => {
  const balances = balancesFromSummary(await fixture());
  assert.deepEqual(balances.map(b => b.policy), ['Congés payés', 'RTT']);
  assert.deepEqual(balances[0], {
    policy: 'Congés payés', accrued: 25.33, taken: 6, planned: 0,
    balance: 19.33, annual: 25, periodStart: '2026-06-01',
    split: {
      previous: { accrued: 22, taken: 11, balance: 11 },
      current: { accrued: 8.3333333200, taken: 0, balance: 8.3333333200 },
    },
  });
  assert.equal(balances[1].balance, -1.51);
  assert.equal(balances[1].split, null);
  assert.equal(balances[1].planned, 1);
  assert.deepEqual(balances.map(b => b.annual), [25, 10]);
});

test('skips policies with nothing taken or planned', () => {
  const none = { taken: { days: '0.00' }, futureApproved: { days: '0.00' }, pending: { days: '0.00' } };
  const pendingOnly = { ...none, pending: { days: '1.00' } };
  const balances = balancesFromSummary({ pto_summary: [
    policy({ policyDisplayName: 'A', takenAndScheduled: none }),
    policy({ policyDisplayName: 'B', takenAndScheduled: pendingOnly }),
  ] });
  assert.deepEqual(balances.map(b => b.policy), ['B']);
});

test('planned sums future approved and pending days', () => {
  const [b] = balancesFromSummary({ pto_summary: [policy()] });
  assert.equal(b.planned, 1.5);
  assert.equal(b.taken, 3);
  assert.equal(b.accrued, 5);
});

test('skips policies without accrual', () => {
  const balances = balancesFromSummary({ pto_summary: [
    policy({ isFixedLeavePolicy: false }),
    policy({ accruedInCurrentPeriod: undefined }),
  ] });
  assert.deepEqual(balances, []);
});

test('annual is null when the policy does not accrue in days', () => {
  const [b] = balancesFromSummary({ pto_summary: [policy({ accrueInDays: false })] });
  assert.equal(b.annual, null);
});

test('tolerates a malformed response', () => {
  assert.deepEqual(balancesFromSummary({ detail: 'x' }), []);
  assert.deepEqual(balancesFromSummary(null), []);
});
