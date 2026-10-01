import { showYear } from './modal.js';
import { t } from './i18n.js';

function isTimeProductsPage() {
  return window.location.pathname.startsWith('/time-products');
}

function updateButtonVisibility() {
  const btn = document.getElementById('rca-btn');
  if (!btn) return;
  btn.style.display = isTimeProductsPage() ? 'block' : 'none';
}

function injectButton() {
  if (!document.body) return;
  if (!document.getElementById('rca-btn')) {
    const btn = document.createElement('button');
    btn.id = 'rca-btn';
    btn.textContent = t.button;
    btn.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:10000;
      background:#4A0039; color:#fff; border:none; border-radius:8px;
      padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer;
      box-shadow:0 4px 12px rgba(0,0,0,.25); transition:opacity .15s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.opacity = '.85');
    btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
    btn.addEventListener('click', () => showYear(new Date().getFullYear()));
    document.body.appendChild(btn);
  }
  updateButtonVisibility();
}

// Intercept SPA navigation (pushState / replaceState)
const _push    = history.pushState.bind(history);
const _replace = history.replaceState.bind(history);
history.pushState = function (...args) {
  _push(...args);
  updateButtonVisibility();
};
history.replaceState = function (...args) {
  _replace(...args);
  updateButtonVisibility();
};
window.addEventListener('popstate', updateButtonVisibility);

const observer = new MutationObserver(() => injectButton());
observer.observe(document.documentElement, { childList: true, subtree: true });
injectButton();
