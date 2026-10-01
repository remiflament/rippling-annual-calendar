import { POLICY_COLORS, expandToDays, totalsByPolicy } from './calendar.js';
import { isoLocal } from './dates.js';
import { t } from './i18n.js';

export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// '2026-03-05' -> '5 mar.'
export function fmtShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.getDate() + ' ' + t.months[d.getMonth()].slice(0, 3).toLowerCase() + '.';
}

// '2026-06-01' -> '1 juin 2026'
export function fmtLong(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.getDate() + ' ' + t.months[d.getMonth()].toLowerCase() + ' ' + d.getFullYear();
}

// 25.333 -> '25.33', 6 -> '6'
export function fmtDays(n) {
  return String(Number(n.toFixed(2)));
}

const NEUTRAL_COLOR = '#9CA3AF';

// Cards "taken vs accrued" per accruing policy. `policies` maps a policy
// name to its calendar color index, so cards match the calendar colors.
export function renderBalances(balances, policies, today) {
  const days = n => esc(t.policyTotal(fmtDays(n)));
  const cards = balances.map(b => {
    const color = b.policy in policies ? POLICY_COLORS[policies[b.policy]] : NEUTRAL_COLOR;
    const over = b.taken > b.accrued;
    const pct = b.accrued > 0 ? Math.min(100, b.taken / b.accrued * 100) : (b.taken > 0 ? 100 : 0);
    const since = b.periodStart ? fmtLong(b.periodStart) : '';
    let meta = `<span class="${b.balance < 0 ? 'rca-neg' : ''}">${esc(t.balance)} ${days(b.balance)}</span>`;
    if (b.planned > 0) meta += `<span>${esc(t.planned)} ${days(b.planned)}</span>`;
    if (b.annual !== null) meta += `<span>${esc(t.annual)} ${days(b.annual)}</span>`;
    return `<div class="rca-bc">`
      + `<div class="rca-bh"><span class="rca-dot" style="background:${color}"></span>${esc(b.policy)}`
      + (since ? `<span class="rca-bp">${esc(t.periodSince(since))}</span>` : '') + `</div>`
      + `<div class="rca-bar"><div class="${over ? 'rca-bar-over' : ''}" style="width:${pct.toFixed(0)}%${over ? '' : ';background:' + color}"></div></div>`
      + `<div class="rca-bn">${esc(t.takenVsAccrued(t.policyTotal(fmtDays(b.taken)), t.policyTotal(fmtDays(b.accrued))))}</div>`
      + `<div class="rca-bm">${meta}</div>`
      + `</div>`;
  }).join('');
  return `<div class="rca-bt">${esc(t.balancesTitle(fmtShort(today)))}</div><div class="rca-bal">${cards}</div>`;
}

export function renderMonth(year, month, absentDays, holidays, todayStr) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let startWd = firstDay.getDay() - 1;
  if (startWd < 0) startWd = 6;

  let html = `<div class="rca-month"><h3>${t.months[month]}</h3><div class="rca-grid">`;
  for (const d of t.weekdays) html += `<div class="rca-dh">${d}</div>`;
  for (let i = 0; i < startWd; i++) html += `<div class="rca-day rca-empty"></div>`;

  for (let dn = 1; dn <= lastDay.getDate(); dn++) {
    const d   = new Date(year, month, dn);
    const key = isoLocal(d);
    const wd  = (d.getDay() + 6) % 7;
    const holiday = holidays[key];
    const absent  = absentDays[key];

    let cls = 'rca-day';
    if (wd >= 5) cls += ' rca-we';
    if (key === todayStr) cls += ' rca-today';
    let style = '';
    let data  = '';

    if (absent) {
      cls += ' rca-absent';
      cls += absent.status !== 'APPROVED' ? ' rca-absent-pending' : '';
      style = `background:${POLICY_COLORS[absent.colorIdx]};color:#fff`;
      const period = absent.start === absent.end
        ? fmtShort(absent.start)
        : fmtShort(absent.start) + ' → ' + fmtShort(absent.end);
      data = `data-policy="${esc(absent.policy)}" data-period="${esc(period)}"`
           + ` data-duration="${esc(t.duration(absent.days))}" data-status="${esc(absent.status)}"`
           + ` data-reason="${esc(absent.reason)}"`;
      if (holiday) data += ` data-holiday="${esc(holiday)}"`;
    } else if (holiday) {
      cls += ' rca-holiday';
      data = `data-holiday="${esc(holiday)}"`;
    }
    html += `<div class="${cls}" style="${style}" ${data}>${dn}</div>`;
  }
  html += '</div></div>';
  return html;
}

export function buildCalendarHTML(year, requests, holidays, today = isoLocal(new Date()), balances = null) {
  const { days: absentDays, policies } = expandToDays(requests);
  const byPolicy = totalsByPolicy(requests);
  const total = Object.values(byPolicy).reduce((a, b) => a + b, 0);

  let legend = Object.entries(policies)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, idx]) =>
      `<span class="rca-li"><span class="rca-dot" style="background:${POLICY_COLORS[idx]}"></span>${esc(p)} — ${t.policyTotal((byPolicy[p] || 0).toFixed(1))}</span>`
    ).join('');
  legend += `<span class="rca-li"><span class="rca-dot" style="background:#FEF3C7;border:1px solid #D97706"></span>${t.holiday}</span>`;
  legend += `<span class="rca-total">${t.total(total.toFixed(1))}</span>`;

  let months = '';
  for (let m = 0; m < 12; m++) months += renderMonth(year, m, absentDays, holidays, today);

  const bal = balances?.length ? renderBalances(balances, policies, today) : '';

  return `
    ${bal}
    <div class="rca-legend">${legend}</div>
    <div class="rca-cal">${months}</div>`;
}
