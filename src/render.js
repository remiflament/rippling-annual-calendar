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

export function buildCalendarHTML(year, requests, holidays, today = isoLocal(new Date())) {
  const { days: absentDays, policies } = expandToDays(requests);
  const byPolicy = totalsByPolicy(requests, year);
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

  return `
    <div class="rca-legend">${legend}</div>
    <div class="rca-cal">${months}</div>`;
}
