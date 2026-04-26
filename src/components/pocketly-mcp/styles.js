export const POCKETLY_WIDGET_STYLES = `
  :root {
    color-scheme: light;
    --bg: #fcfbf5;
    --card: #ffffff;
    --primary: #1f644e;
    --primary-soft: #f0f5f2;
    --text: #1e3a34;
    --muted: #7c8e88;
    --border: #e5e3d8;
    --expense: #c94c4c;
    --danger-soft: #fef2f2;
    --blue: #4a86e8;
    --purple: #9333ea;
  }
  * { box-sizing: border-box; }
  html { min-width: 0; height: 100%; background: var(--bg); }
  body {
    margin: 0;
    min-width: 0;
    min-height: 100%;
    overflow: visible;
    background: var(--bg);
    color: var(--text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  #pocketly-root { min-width: 0; min-height: 280px; background: var(--bg); }
  .shell {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    min-height: 280px;
    max-height: min(var(--pocketly-host-max-height, 760px), 760px);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior: contain;
    padding: 14px;
    background: var(--bg);
    scrollbar-color: #cfd8d3 transparent;
    scrollbar-width: thin;
  }
  .shell::-webkit-scrollbar { width: 9px; }
  .shell::-webkit-scrollbar-track { background: transparent; }
  .shell::-webkit-scrollbar-thumb { background: #cfd8d3; border: 3px solid var(--bg); border-radius: 999px; }
  .header {
    position: sticky;
    top: -14px;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: -14px -14px 0;
    padding: 14px 14px 10px;
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(229, 227, 216, .72);
  }
  .brand { min-width: 0; }
  .eyebrow { margin: 0 0 4px; color: var(--muted); font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
  .title { margin: 0; color: var(--primary); font-size: 16px; line-height: 1.2; font-weight: 900; }
  .header-actions { display: flex; align-items: center; gap: 8px; flex: none; }
  .note { color: var(--muted); font-size: 11px; font-weight: 800; white-space: nowrap; }
  .icon-button {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #fff;
    color: var(--primary);
    cursor: pointer;
    box-shadow: 0 1px 0 rgba(30,58,52,.03);
  }
  .icon-button svg { width: 17px; height: 17px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .icon-button[disabled] { cursor: wait; opacity: .55; }
  .content { display: grid; gap: 14px; min-width: 0; }
  .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .summary.four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat { min-width: 0; border: 1px solid var(--border); background: var(--card); border-radius: 12px; padding: 10px; text-align: center; }
  .account-summary .stat-icon { display: none; }
  .account-summary .stat-value { margin-top: 4px; }
  .stat-label { margin: 0; color: var(--muted); font-size: 10px; line-height: 1.2; letter-spacing: .04em; text-transform: uppercase; font-weight: 900; }
  .stat-value { margin: 5px 0 0; color: var(--text); font-size: 14px; line-height: 1.15; font-weight: 900; overflow-wrap: anywhere; }
  .positive { color: var(--primary); }
  .negative { color: var(--expense); }
  .section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .section-title { margin: 0; color: var(--primary); font-size: 13px; font-weight: 900; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .grid.accounts { gap: 14px; }
  .card { border: 1px solid var(--border); background: var(--card); border-radius: 12px; padding: 12px; }
  .account-card { min-height: 132px; padding: 18px; transition: box-shadow .18s ease, transform .18s ease; }
  .account-card:hover { box-shadow: 0 8px 24px rgba(30, 58, 52, .08); transform: translateY(-1px); }
  .account-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .account-balance { margin: 7px 0 0; font-size: 20px; line-height: 1.18; font-weight: 900; overflow-wrap: anywhere; }
  .icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex: none; background: var(--primary-soft); color: var(--primary); border: 1px solid #d9e6df; font-size: 16px; font-weight: 900; overflow: hidden; }
  .account-icon { width: 48px; height: 48px; }
  .icon-img { width: 40px; height: 40px; object-fit: contain; }
  .icon-img.bank-logo { width: 40px; height: 32px; }
  .icon svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .icon.orange { background: #ffedd5; color: #f97316; border-color: #fed7aa; }
  .icon.green { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
  .icon.blue-soft { background: #dbeafe; color: #2563eb; border-color: #bfdbfe; }
  .icon.purple { background: #f3e8ff; color: #9333ea; border-color: #e9d5ff; }
  .icon.red-soft { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
  .icon.red { background: var(--danger-soft); color: var(--expense); border-color: #f0d2d2; }
  .icon.blue { background: #eff6ff; color: var(--blue); border-color: #d6e6ff; }
  .card-main { min-width: 0; flex: 1; }
  .card-title { margin: 0; color: var(--text); font-size: 13px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-meta { margin: 3px 0 0; color: var(--muted); font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-value { margin: 0; color: var(--primary); font-size: 15px; font-weight: 900; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .records { overflow: hidden; padding: 0; }
  .record { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px; border-top: 1px solid var(--border); }
  .record:first-child { border-top: 0; }
  .record-left { display: flex; gap: 10px; align-items: center; min-width: 0; }
  .amount { flex: none; max-width: 34vw; font-size: 13px; font-weight: 900; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-group { display: grid; gap: 8px; }
  .date-label { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; color: var(--muted); font-size: 11px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
  .date-label:after { content: ""; height: 1px; flex: 1; background: var(--border); }
  .progress-wrap { display: grid; gap: 12px; }
  .progress-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 7px; }
  .progress-name { margin: 0; color: var(--text); font-size: 13px; font-weight: 900; }
  .progress-value { color: var(--muted); font-size: 11px; font-weight: 900; }
  .bar { height: 9px; border-radius: 999px; background: var(--primary-soft); overflow: hidden; }
  .bar-fill { height: 100%; border-radius: inherit; background: var(--primary); }
  .bar-fill.over { background: var(--expense); }
  .category-list { display: grid; gap: 8px; }
  .category-row { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 8px; color: var(--text); font-size: 12px; font-weight: 900; }
  .dot { width: 10px; height: 10px; border-radius: 999px; background: var(--primary); }
  .empty { border: 1px dashed var(--border); background: rgba(255,255,255,.58); border-radius: 12px; padding: 28px 14px; color: var(--muted); text-align: center; font-size: 13px; font-weight: 800; }
  @media (max-width: 380px) {
    .shell { padding: 12px; gap: 12px; }
    .header { top: -12px; margin: -12px -12px 0; padding: 12px 12px 9px; }
    .summary { gap: 7px; }
    .stat { padding: 8px 6px; }
    .stat-label { font-size: 9px; }
    .stat-value { font-size: 12px; }
    .account-card { min-height: 118px; padding: 14px; }
    .account-balance { font-size: 17px; }
    .amount { max-width: 30vw; font-size: 12px; }
  }
  @media (max-width: 559px) {
    .shell {
      max-height: none;
      overflow-y: visible;
      overscroll-behavior: auto;
    }
  }
  @media (min-width: 560px) {
    .shell { padding: 16px; }
    .header { top: -16px; margin: -16px -16px 0; padding: 16px 16px 11px; }
    .summary.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .account-summary { gap: 14px; }
    .account-summary .stat { display: flex; align-items: center; gap: 14px; padding: 18px; text-align: left; }
    .account-summary .stat-icon { display: grid; width: 46px; height: 46px; border-radius: 12px; place-items: center; flex: none; background: var(--primary-soft); color: var(--primary); }
    .account-summary .stat-icon.red { background: var(--danger-soft); color: var(--expense); }
    .account-summary .stat-icon svg { width: 23px; height: 23px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .account-summary .stat-label { font-size: 11px; }
    .account-summary .stat-value { font-size: 19px; }
    .grid.accounts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: 820px) {
    .shell { max-height: min(var(--pocketly-host-max-height, 680px), 680px); }
  }
`;
