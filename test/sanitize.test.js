import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSanitizer, shiftDate } from '../scripts/sanitize-har.mjs';

test('keeps shapes, dates, enums and numbers; redacts personal strings', () => {
  const sanitize = createSanitizer();
  const out = sanitize([{
    id: '64a1f0c2e4b0a1b2c3d4e5f6',
    role: '64a1f0c2e4b0a1b2c3d4e5f6',
    roleName: 'Jane Doe',
    email: 'jane@example.com',
    reasonForLeave: 'Wedding',
    policyDisplayName: 'Congés payés',
    status: 'APPROVED',
    startDate: '2026-03-02',
    createdAt: '2026-02-01T10:11:12.123Z',
    numMinutes: '468.0',
    taken: '0E-10',
    partial: false,
    days: [{ date: '2026-03-02', minutes: 468 }],
    hoursByType: { '64a1f0c2e4b0a1b2c3d4e5f7': 7.8 },
  }]);
  assert.deepEqual(out, [{
    id: '000000000000000000000001',
    role: '000000000000000000000001',
    roleName: '<redacted:roleName>',
    email: '<redacted:email>',
    reasonForLeave: '<redacted:reasonForLeave>',
    policyDisplayName: 'Congés payés',
    status: 'APPROVED',
    startDate: '2026-03-02',
    createdAt: '2026-02-01T10:11:12.123Z',
    numMinutes: '468.0',
    taken: '0E-10',
    partial: false,
    days: [{ date: '2026-03-02', minutes: 468 }],
    hoursByType: { '000000000000000000000002': 7.8 },
  }]);
});

test('keeps holiday names only under holidays', () => {
  const sanitize = createSanitizer();
  const out = sanitize({ name: 'Jane Doe', holidays: [{ name: 'Noël', startDate: '2026-12-25' }] });
  assert.equal(out.name, '<redacted:name>');
  assert.equal(out.holidays[0].name, 'Noël');
});

test('shifts dates and datetimes by whole weeks, keeping weekdays', () => {
  const sanitize = createSanitizer();
  const out = sanitize({ startDate: '2026-03-02', createdAt: '2026-02-01T10:11:12.123Z', year: 2026 }, { shiftDays: 14 });
  assert.deepEqual(out, { startDate: '2026-03-16', createdAt: '2026-02-15T10:11:12.123Z', year: 2026 });
  assert.equal(new Date(shiftDate('2026-03-02', 7 * 30) + 'T00:00:00Z').getUTCDay(), 1);
});
