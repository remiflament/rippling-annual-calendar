import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendarHTML, esc, fmtShort } from '../src/render.js';

const req = (over) => ({
  startDate: '2026-03-02', endDate: '2026-03-02', status: 'APPROVED',
  policyDisplayName: 'Congés payés', numDays: '1.00', reasonForLeave: '',
  ...over,
});

function dayCell(html, n, month = 'Mars') {
  const monthHtml = html.split('<div class="rca-month">').find(m => m.startsWith(`<h3>${month}</h3>`));
  return monthHtml.match(new RegExp(`<div class="[^"]*"[^>]*>${n}</div>`, 'g')).find(c => !c.includes('rca-dh'));
}

test('renders 12 months', () => {
  const html = buildCalendarHTML(2026, [], {}, '2026-01-01');
  assert.equal(html.split('<div class="rca-month">').length - 1, 12);
});

test('marks weekend, today, holiday and absence', () => {
  const html = buildCalendarHTML(2026, [req()], { '2026-03-03': 'Fête' }, '2026-03-04');
  assert.match(dayCell(html, 1), /rca-we/);           // 2026-03-01 is a Sunday
  assert.match(dayCell(html, 2), /rca-absent/);
  assert.match(dayCell(html, 2), /data-status="APPROVED"/);
  assert.match(dayCell(html, 3), /rca-holiday/);
  assert.match(dayCell(html, 4), /rca-today/);
});

test('pending absence is dimmed', () => {
  const html = buildCalendarHTML(2026, [req({ status: 'PENDING' })], {}, '2026-01-01');
  assert.match(dayCell(html, 2), /rca-absent-pending/);
});

test('escapes user content', () => {
  const html = buildCalendarHTML(2026, [req({ reasonForLeave: '<img onerror=x>' , policyDisplayName: 'A"B' })], {}, '2026-01-01');
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('A&quot;B'));
});

test('legend shows per policy and total days', () => {
  const html = buildCalendarHTML(2026, [req(), req({ policyDisplayName: 'RTT', numDays: '0.50' })], {}, '2026-01-01');
  assert.ok(html.includes('Congés payés — 1.0 j'));
  assert.ok(html.includes('RTT — 0.5 j'));
  assert.ok(html.includes('Total : 1.5 j'));
});

test('helpers', () => {
  assert.equal(esc(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  assert.equal(fmtShort('2026-03-05'), '5 mar.');
});
