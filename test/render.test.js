import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendarHTML, esc, fmtShort } from '../src/render.js';

const req = (over) => ({
  startDate: '2026-03-02', endDate: '2026-03-02', status: 'APPROVED',
  policyDisplayName: 'Congés payés', numMinutes: '468', reasonForLeave: '',
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
  const html = buildCalendarHTML(2026, [req(), req({ policyDisplayName: 'RTT', numMinutes: '234' })], {}, '2026-01-01');
  assert.ok(html.includes('Congés payés — 1.0 j'));
  assert.ok(html.includes('RTT — 0.5 j'));
  assert.ok(html.includes('Total : 1.5 j'));
});

test('helpers', () => {
  assert.equal(esc(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  assert.equal(fmtShort('2026-03-05'), '5 mar.');
});

const balance = (over) => ({
  policy: 'Congés payés', accrued: 25.33, taken: 6, planned: 0,
  balance: 19.33, annual: 25, periodStart: '2026-06-01', ...over,
});

test('no balances block without balances', () => {
  assert.ok(!buildCalendarHTML(2026, [req()], {}, '2026-10-01').includes('rca-bal'));
  assert.ok(!buildCalendarHTML(2026, [req()], {}, '2026-10-01', []).includes('rca-bal'));
});

test('balances block shows taken vs accrued, balance and annual amount', () => {
  const html = buildCalendarHTML(2026, [req()], {}, '2026-10-01', [balance()]);
  assert.ok(html.includes('Soldes au 1 oct.'));
  assert.ok(html.includes('6 j pris / 25.33 j acquis'));
  assert.ok(html.includes('Solde 19.33 j'));
  assert.ok(html.includes('Annuel 25 j'));
  assert.ok(html.includes('depuis le 1 juin 2026'));
  assert.ok(!html.includes('Prévu'));
  assert.ok(html.indexOf('rca-bal') < html.indexOf('rca-legend'));
});

test('negative balance and overdraft are flagged; planned shown when set', () => {
  const html = buildCalendarHTML(2026, [], {}, '2026-10-01', [balance({ policy: 'RTT', accrued: 7.49, taken: 9, balance: -1.51, planned: 1 })]);
  assert.match(html, /<span class="rca-neg">Solde -1.51 j<\/span>/);
  assert.ok(html.includes('rca-bar-over'));
  assert.ok(html.includes('Prévu 1 j'));
});

test('balances escape policy names', () => {
  const html = buildCalendarHTML(2026, [], {}, '2026-10-01', [balance({ policy: '<b>x</b>' })]);
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
});
