import { clearCache, loadYear } from './api.js';
import { buildCalendarHTML, esc } from './render.js';
import { CSS } from './styles.js';
import { t } from './i18n.js';

let currentYear = new Date().getFullYear();

function getModal() { return document.getElementById('rca-modal'); }

function tooltipHTML(el) {
  const holiday = el.dataset.holiday || '';
  if (!el.classList.contains('rca-absent')) {
    return `<div class="rca-tp" style="color:#FCD34D">${esc(t.holiday)}</div><div class="rca-tr"><span>${esc(holiday)}</span></div>`;
  }
  const approved = el.dataset.status === 'APPROVED';
  const sc = approved ? 'rca-ok' : 'rca-pend';
  const si = approved ? '✓' : '⏳';
  const sl = approved ? t.approved : t.pending;
  let h = `<div class="rca-tp">${esc(el.dataset.policy)}</div>`
    + `<div class="rca-tr"><span>${esc(t.periodLabel)}</span><span>${esc(el.dataset.period)}</span></div>`
    + `<div class="rca-tr"><span>${esc(t.durationLabel)}</span><span>${esc(el.dataset.duration)}</span></div>`
    + (el.dataset.reason ? `<div class="rca-tr"><span>${esc(t.reasonLabel)}</span><span>${esc(el.dataset.reason)}</span></div>` : '')
    + `<div class="rca-tr"><span>${esc(t.statusLabel)}</span><span class="${sc}">${si} ${esc(sl)}</span></div>`;
  if (holiday) h += `<div class="rca-tr" style="margin-top:4px;border-top:1px solid #444;padding-top:4px"><span>${esc(t.holidayShort)}</span><span style="color:#FCD34D">${esc(holiday)}</span></div>`;
  return h;
}

function createModal() {
  const overlay = document.createElement('div');
  overlay.id = 'rca-modal';
  overlay.innerHTML = `
    <div id="rca-backdrop"></div>
    <div id="rca-panel">
      <div id="rca-header">
        <button id="rca-prev" title="${esc(t.prevYear)}">&#8592;</button>
        <h2 id="rca-title">${esc(t.button)}</h2>
        <button id="rca-next" title="${esc(t.nextYear)}">&#8594;</button>
        <button id="rca-refresh" title="${esc(t.refresh)}">&#8635;</button>
        <button id="rca-close" title="${esc(t.close)}">&#10005;</button>
      </div>
      <div id="rca-body"><div id="rca-loading">${esc(t.loading)}</div></div>
    </div>
    <div id="rca-tip"></div>`;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Close on backdrop or X
  document.getElementById('rca-backdrop').addEventListener('click', closeModal);
  document.getElementById('rca-close').addEventListener('click', closeModal);

  // Year navigation
  document.getElementById('rca-prev').addEventListener('click', () => showYear(currentYear - 1));
  document.getElementById('rca-next').addEventListener('click', () => showYear(currentYear + 1));
  document.getElementById('rca-refresh').addEventListener('click', () => {
    clearCache(currentYear);
    showYear(currentYear);
  });

  // Keyboard
  document.addEventListener('keydown', onKey);

  // Tooltip
  const tip = document.getElementById('rca-tip');
  let lastEl = null;
  document.addEventListener('mousemove', e => {
    if (!lastEl) return;
    const x = e.clientX, y = e.clientY, m = 14;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = (x + m + tw > window.innerWidth  ? x - tw - m : x + m) + 'px';
    tip.style.top  = (y + m + th > window.innerHeight ? y - th - m : y + m) + 'px';
  });
  document.getElementById('rca-body').addEventListener('mouseover', e => {
    const el = e.target.closest('.rca-absent,.rca-holiday');
    if (!el) { tip.style.display = 'none'; lastEl = null; return; }
    lastEl = el;
    tip.innerHTML = tooltipHTML(el);
    tip.style.display = 'block';
  });
  document.getElementById('rca-body').addEventListener('mouseleave', () => {
    tip.style.display = 'none'; lastEl = null;
  });
}

function closeModal() {
  const m = getModal();
  if (m) m.remove();
  document.removeEventListener('keydown', onKey);
}

function onKey(e) {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft')  showYear(currentYear - 1);
  if (e.key === 'ArrowRight') showYear(currentYear + 1);
}

export async function showYear(year) {
  currentYear = year;
  if (!getModal()) createModal();
  const modal = getModal();

  modal.querySelector('#rca-title').textContent = t.title(year);
  const body = modal.querySelector('#rca-body');
  body.innerHTML = `<div id="rca-loading">${esc(t.loading)}</div>`;

  try {
    const { requests, holidays } = await loadYear(year);
    body.innerHTML = buildCalendarHTML(year, requests, holidays);
  } catch (e) {
    body.innerHTML = `<div id="rca-loading" style="color:#ef4444">${esc(t.error(e.message))}</div>`;
  }
}
