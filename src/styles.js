export const CSS = `
  #rca-modal { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; }
  #rca-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(2px); cursor:pointer; }
  #rca-panel {
    position:relative; background:#f5f5f5; border-radius:14px;
    width:min(1200px,95vw); max-height:92vh; display:flex; flex-direction:column;
    box-shadow:0 24px 60px rgba(0,0,0,.35); overflow:hidden;
  }
  #rca-header {
    display:flex; align-items:center; gap:.5rem;
    background:#fff; padding:.85rem 1.25rem; border-bottom:1px solid #e5e5e5; flex-shrink:0;
  }
  #rca-title { flex:1; text-align:center; font-size:1.15rem; font-weight:700; color:#222; }
  #rca-prev, #rca-next, #rca-close {
    border:none; background:none; cursor:pointer; font-size:1.1rem; color:#555;
    width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center;
  }
  #rca-prev:hover, #rca-next:hover { background:#f0f0f0; color:#222; }
  #rca-refresh:hover { background:#e0f2fe; color:#0369a1; }
  #rca-close { margin-left:auto; font-size:.95rem; }
  #rca-close:hover { background:#fee2e2; color:#dc2626; }
  #rca-body { overflow-y:auto; padding:1.5rem; flex:1; }
  #rca-loading { text-align:center; padding:3rem; color:#888; font-size:1rem; }
  .rca-meta { color:#666; margin-bottom:1rem; font-size:.9rem; }
  .rca-bt { font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#999; margin-bottom:.6rem; }
  .rca-bal { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1rem; margin-bottom:1.5rem; }
  .rca-bc { background:#fff; border-radius:10px; padding:.75rem .85rem; box-shadow:0 1px 4px rgba(0,0,0,.07); }
  .rca-bh { display:flex; align-items:center; gap:.4rem; font-size:.85rem; font-weight:600; color:#333; }
  .rca-bp { margin-left:auto; font-size:.7rem; font-weight:400; color:#999; white-space:nowrap; }
  .rca-bar { height:6px; background:#eee; border-radius:3px; overflow:hidden; margin:.55rem 0 .45rem; }
  .rca-bar > div { height:100%; border-radius:3px; }
  .rca-bar-over { background:#EF4444; }
  .rca-bn { font-size:.85rem; color:#222; }
  .rca-bm { display:flex; flex-wrap:wrap; gap:.25rem .75rem; font-size:.75rem; color:#777; margin-top:.2rem; }
  .rca-neg { color:#DC2626; font-weight:600; }
  .rca-legend { display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; align-items:center; }
  .rca-li { display:flex; align-items:center; gap:.4rem; font-size:.85rem; }
  .rca-dot { width:11px; height:11px; border-radius:3px; flex-shrink:0; }
  .rca-total { font-weight:700; margin-left:auto; font-size:.88rem; color:#444; }
  .rca-cal { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; }
  @media(max-width:800px) { .rca-cal { grid-template-columns:repeat(2,1fr); } }
  .rca-month { background:#fff; border-radius:10px; padding:.85rem; box-shadow:0 1px 4px rgba(0,0,0,.07); }
  .rca-month h3 { font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#999; margin-bottom:.6rem; }
  .rca-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
  .rca-dh { font-size:.6rem; font-weight:600; color:#bbb; text-align:center; padding:2px 0; }
  .rca-day { font-size:.75rem; text-align:center; padding:4px 2px; border-radius:4px; cursor:default; line-height:1.4; user-select:none; }
  .rca-empty { }
  .rca-we { color:#ccc; }
  .rca-today { box-shadow:inset 0 0 0 2px #3B82F6; font-weight:700; }
  .rca-absent { cursor:pointer; }
  .rca-absent-pending { opacity: 0.6; }
  .rca-holiday { background:#FEF3C7; color:#92400E; cursor:help; font-weight:600; }
  #rca-tip {
    position:fixed; display:none; z-index:100000;
    background:#1e1e1e; color:#f0f0f0; border-radius:8px;
    padding:.6rem .8rem; font-size:.8rem; line-height:1.65;
    box-shadow:0 4px 20px rgba(0,0,0,.4); max-width:230px; pointer-events:none;
  }
  .rca-tp { font-weight:700; font-size:.85rem; margin-bottom:.25rem; }
  .rca-tr { display:flex; gap:.5rem; color:#ccc; }
  .rca-tr span:first-child { color:#777; min-width:55px; }
  .rca-ok { color:#4ade80; } .rca-pend { color:#fbbf24; }
`;
