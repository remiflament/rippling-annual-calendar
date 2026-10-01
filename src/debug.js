// Debug mode: run `localStorage.setItem('rca_debug', '1')` in the Rippling
// console, then reload. Logs schema issues (field paths and types only).

function isDebug() {
  try {
    return localStorage.getItem('rca_debug') === '1';
  } catch {
    return false;
  }
}

export function reportSchema(label, issues) {
  if (!isDebug()) return;
  if (issues.length === 0) {
    console.info(`[rca] ${label}: schema OK`);
    return;
  }
  console.warn(`[rca] ${label}: ${issues.length} schema issue(s)`);
  console.table(issues);
}
