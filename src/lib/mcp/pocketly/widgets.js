import { POCKETLY_WIDGET_DOMAIN, POCKETLY_WIDGET_MIME_TYPE } from './constants.js';

export function getWidgetMetadata(description) {
  return {
    ui: {
      prefersBorder: true,
      domain: POCKETLY_WIDGET_DOMAIN,
      csp: {
        connectDomains: [POCKETLY_WIDGET_DOMAIN],
        resourceDomains: [POCKETLY_WIDGET_DOMAIN],
      },
    },
    'openai/widgetDescription': description,
    'openai/widgetPrefersBorder': true,
    'openai/widgetCSP': {
      connect_domains: [POCKETLY_WIDGET_DOMAIN],
      resource_domains: [POCKETLY_WIDGET_DOMAIN],
    },
    'openai/widgetDomain': POCKETLY_WIDGET_DOMAIN,
  };
}

export function registerPocketlyWidget(server, widget, kind) {
  server.registerResource(
    widget.name,
    widget.uri,
    {
      title: widget.title,
      description: widget.description,
    },
    async () => ({
      contents: [
        {
          uri: widget.uri,
          mimeType: POCKETLY_WIDGET_MIME_TYPE,
          text: getPocketlyWidgetHtml(kind),
          _meta: getWidgetMetadata(widget.description),
        },
      ],
    })
  );
}

export function getPocketlyWidgetHtml(kind) {
  return `
<div id="pocketly-root" data-kind="${kind}"></div>
<style>
  :root {
    color-scheme: light;
    --bg: #fcfbf5;
    --card: #ffffff;
    --primary: #1f644e;
    --primary-soft: #f0f5f2;
    --primary-hover: #17503e;
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
  .followups { display: flex; flex-wrap: wrap; gap: 8px; }
  .pill { border: 1px solid #d9e6df; background: var(--primary); color: white; border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 900; cursor: pointer; }
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
</style>
<script>
  (function () {
    const root = document.getElementById('pocketly-root');
    const preferredKind = root.dataset.kind;
    let heightFrame = null;

    function getHostMaxHeight() {
      const value = Number(window.openai?.maxHeight);
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
    }

    function syncHostMaxHeight() {
      const maxHeight = getHostMaxHeight();
      if (maxHeight) {
        document.documentElement.style.setProperty('--pocketly-host-max-height', maxHeight + 'px');
      } else {
        document.documentElement.style.removeProperty('--pocketly-host-max-height');
      }
    }

    function notifyIntrinsicHeight() {
      if (heightFrame) window.cancelAnimationFrame(heightFrame);
      heightFrame = window.requestAnimationFrame(function () {
        heightFrame = null;
        syncHostMaxHeight();
        const shell = root.querySelector('.shell');
        const height = Math.ceil(Math.max(
          root.scrollHeight,
          shell?.scrollHeight || 0,
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          280
        ));
        if (window.openai?.notifyIntrinsicHeight) {
          window.openai.notifyIntrinsicHeight(height);
        }
      });
    }

    function formatCurrency(value) {
      const amount = Number(value || 0);
      const abs = Math.abs(amount);
      const compact = abs >= 100000;
      const formatted = new Intl.NumberFormat('en-IN', {
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: compact ? 0 : 2
      }).format(abs);
      return 'INR ' + formatted;
    }

    function formatSigned(value) {
      const amount = Number(value || 0);
      return (amount < 0 ? '-' : '+') + formatCurrency(amount);
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }

    function followUp(text) {
      if (window.openai?.sendFollowUpMessage) {
        window.openai.sendFollowUpMessage({ prompt: text });
        return;
      }
      window.parent.postMessage({
        jsonrpc: '2.0',
        method: 'ui/message',
        params: { role: 'user', content: [{ type: 'text', text }] }
      }, '*');
    }

    function svgIcon(name) {
      if (name === 'wallet') return '<svg viewBox="0 0 24 24"><path d="M19 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7"/><path d="M16 14h.01"/></svg>';
      if (name === 'trending-down') return '<svg viewBox="0 0 24 24"><path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></svg>';
      if (name === 'trending-up') return '<svg viewBox="0 0 24 24"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>';
      if (name === 'credit-card') return '<svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>';
      if (name === 'building') return '<svg viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8"/><path d="M18 9h2a2 2 0 0 1 2 2v11"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
      if (name === 'coins') return '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/></svg>';
      if (name === 'phone') return '<svg viewBox="0 0 24 24"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>';
      if (name === 'refresh') return '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
      return '<svg viewBox="0 0 24 24"><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
    }

    function ippbIconMarkup() {
      return '<svg class="icon-img bank-logo" viewBox="0 0 24 24" preserveAspectRatio="none">' +
        '<rect width="24" height="24" rx="3" fill="#3a0f1a"/>' +
        '<circle cx="9.5" cy="10.5" r="3.2" fill="#d92b2b"/>' +
        '<path d="M4 8c2 0 4 2 7 2" stroke="#ffd036" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M4 10c2 0 4 2 7 2" stroke="#ffd036" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M4 12c2 0 4 2 7 2" stroke="#ffd036" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    }

    function rupayIconMarkup() {
      return '<svg class="icon-img" viewBox="0 0 24 24">' +
        '<rect width="24" height="24" rx="4" fill="#0052CC"/>' +
        '<path d="M7 16V8h3a3 3 0 0 1 0 6H7" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M12 16h3a3 3 0 0 0 0-6h-3" stroke="#ffb400" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    }

    function accountIconMarkup(name) {
      const normalized = String(name || '').toLowerCase();
      if (normalized === 'wallet' || normalized === 'purse') {
        return '<img class="icon-img" src="${POCKETLY_WIDGET_DOMAIN}/images/purse.svg" alt="">';
      }
      if (normalized === 'pnb') {
        return '<img class="icon-img bank-logo" src="${POCKETLY_WIDGET_DOMAIN}/images/pnb.png" alt="">';
      }
      if (normalized === 'ippb' || normalized === 'ip-pb' || normalized === 'ip_pb') return ippbIconMarkup();
      if (normalized === 'rupay' || normalized === 'ru-pay' || normalized === 'ru_pay') return rupayIconMarkup();
      if (normalized.includes('card')) return svgIcon('credit-card');
      if (normalized.includes('bank') || normalized.includes('landmark') || normalized.includes('building')) return svgIcon('building');
      if (normalized.includes('piggy') || normalized.includes('coin')) return svgIcon('coins');
      if (normalized.includes('phone')) return svgIcon('phone');
      return svgIcon('wallet');
    }

    function accountIconClass(index) {
      return ['orange', 'blue-soft', 'green', 'purple', 'red-soft'][index % 5];
    }

    function stat(label, value, tone, iconName, iconTone) {
      return '<div class="stat">' +
        (iconName ? '<div class="stat-icon ' + (iconTone || '') + '">' + svgIcon(iconName) + '</div>' : '') +
        '<div><p class="stat-label">' + escapeHtml(label) + '</p><p class="stat-value ' + (tone || '') + '">' + escapeHtml(value) + '</p></div></div>';
    }

    function headerMarkup(eyebrow, title, note) {
      return '<div class="header"><div class="brand"><p class="eyebrow">' + escapeHtml(eyebrow) + '</p><h1 class="title">' + escapeHtml(title) + '</h1></div>' +
        '<div class="header-actions"><span class="note">' + escapeHtml(note || '') + '</span><button type="button" class="icon-button refresh-view" aria-label="Refresh Pocketly view" title="Refresh">' + svgIcon('refresh') + '</button></div></div>';
    }

    function renderAccounts(data) {
      const accounts = data.accounts || [];
      const stats = data.stats || {};
      const cards = accounts.length
        ? '<div class="grid accounts">' + accounts.map(function (account, index) {
            const balance = Number(account.balance || 0);
            return '<div class="card account-card">' +
              '<div class="account-card-top">' +
                '<div class="icon account-icon ' + accountIconClass(index) + '">' + accountIconMarkup(account.icon) + '</div>' +
              '</div>' +
              '<div style="margin-top:16px">' +
                '<p class="card-title">' + escapeHtml(account.name) + '</p>' +
                '<p class="account-balance ' + (balance < 0 ? 'negative' : 'positive') + '">' + formatCurrency(balance) + '</p>' +
              '</div>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="empty">No accounts yet.</div>';

      return '<main class="shell">' +
        headerMarkup('Pocketly', 'Accounts', accounts.length + ' accounts') +
        '<div class="content">' +
        '<div class="summary account-summary">' +
          stat('Balance', formatCurrency(stats.totalAccountBalance), '', 'wallet') +
          stat('Expense', formatCurrency(stats.totalExpense), 'negative', 'trending-down', 'red') +
          stat('Income', formatCurrency(stats.totalIncome), 'positive', 'trending-up') +
        '</div>' +
        '<div class="section-head"><h2 class="section-title">Your Accounts</h2></div>' +
        cards +
        '<div class="followups"><button id="accounts-summary" class="pill">Explain balances</button></div>' +
        '</div>' +
      '</main>';
    }

    function groupTransactions(transactions) {
      return transactions.reduce(function (groups, transaction) {
        const label = new Date(transaction.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          weekday: 'long'
        });
        groups[label] = groups[label] || [];
        groups[label].push(transaction);
        return groups;
      }, {});
    }

    function transactionTitle(transaction) {
      if (transaction.type === 'transfer') return 'Transfer';
      return transaction.category?.name || transaction.description || 'Transaction';
    }

    function transactionMeta(transaction) {
      if (transaction.type === 'transfer') {
        return (transaction.account?.name || 'Account') + ' to ' + (transaction.toAccount?.name || 'Account');
      }
      return transaction.account?.name || 'Account';
    }

    function renderTransactions(data) {
      const transactions = data.transactions || [];
      const stats = data.stats || {};
      const groups = groupTransactions(transactions);
      const rows = transactions.length
        ? Object.entries(groups).map(function ([dateLabel, items]) {
            return '<div class="date-group"><p class="date-label">' + escapeHtml(dateLabel) + '</p><div class="card records">' +
              items.map(function (transaction) {
                const isExpense = transaction.type === 'expense';
                const isIncome = transaction.type === 'income';
                const iconClass = transaction.type === 'transfer' ? 'blue' : isExpense ? 'red' : '';
                const amount = transaction.type === 'transfer'
                  ? formatCurrency(transaction.amount)
                  : (isExpense ? '-' : '+') + formatCurrency(transaction.amount);
                return '<div class="record">' +
                  '<div class="record-left"><div class="icon ' + iconClass + '">' + svgIcon(transaction.type === 'transfer' ? 'credit-card' : 'wallet') + '</div>' +
                  '<div class="card-main"><p class="card-title">' + escapeHtml(transactionTitle(transaction)) + '</p><p class="card-meta">' + escapeHtml(transactionMeta(transaction)) + '</p></div></div>' +
                  '<div class="amount ' + (isExpense ? 'negative' : isIncome ? 'positive' : '') + '">' + amount + '</div>' +
                '</div>';
              }).join('') + '</div></div>';
          }).join('')
        : '<div class="empty">No transactions for this period.</div>';

      return '<main class="shell">' +
        headerMarkup('Pocketly Records', data.period?.label || 'Recent Records', transactions.length + ' shown') +
        '<div class="content">' +
        '<div class="summary">' +
          stat('Expense', formatCurrency(stats.totalExpense), 'negative') +
          stat('Income', formatCurrency(stats.totalIncome), 'positive') +
          stat('Net Flow', formatSigned(stats.netFlow), stats.netFlow >= 0 ? 'positive' : 'negative') +
        '</div>' +
        rows +
        '<div class="followups"><button id="records-summary" class="pill">Summarize records</button></div>' +
        '</div>' +
      '</main>';
    }

    function renderBudgets(data) {
      const budgets = data.budgets || [];
      const stats = data.stats || {};
      const rows = budgets.length
        ? '<div class="card progress-wrap">' + budgets.map(function (budget) {
            const progress = Math.max(0, Math.min(Number(budget.progress || 0), 100));
            return '<div>' +
              '<div class="progress-top"><p class="progress-name">' + escapeHtml(budget.category?.name || 'Budget') + '</p><span class="progress-value ' + (budget.isExceeded ? 'negative' : 'positive') + '">' + Math.round(progress) + '%</span></div>' +
              '<div class="bar"><div class="bar-fill ' + (budget.isExceeded ? 'over' : '') + '" style="width:' + progress + '%"></div></div>' +
              '<p class="card-meta">' + formatCurrency(budget.spent) + ' spent of ' + formatCurrency(budget.amount) + ' - ' + escapeHtml(budget.period) + '</p>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="empty">No budgets yet.</div>';

      return '<main class="shell">' +
        headerMarkup('Pocketly Planning', 'Budgets', budgets.length + ' budgets') +
        '<div class="content">' +
        '<div class="summary">' +
          stat('Budget', formatCurrency(stats.totalBudget), '') +
          stat('Spent', formatCurrency(stats.totalSpent), stats.exceededCount ? 'negative' : 'positive') +
          stat('Exceeded', String(stats.exceededCount || 0), stats.exceededCount ? 'negative' : '') +
        '</div>' +
        rows +
        '<div class="followups"><button id="budget-help" class="pill">Review budgets</button></div>' +
        '</div>' +
      '</main>';
    }

    function renderSummary(data) {
      const stats = data.stats || {};
      const expenses = data.topExpenseCategories || [];
      const expenseRows = expenses.length
        ? '<div class="card category-list">' + expenses.map(function (category) {
            return '<div class="category-row"><span class="dot" style="background:' + escapeHtml(category.color || '#1f644e') + '"></span><span class="card-title">' + escapeHtml(category.name) + '</span><span class="negative">' + formatCurrency(category.total) + '</span></div>';
          }).join('') + '</div>'
        : '<div class="empty">No category activity in this period.</div>';

      return '<main class="shell">' +
        headerMarkup('Pocketly Analysis', data.period?.label || 'Summary', '') +
        '<div class="content">' +
        '<div class="summary four">' +
          stat('Balance', formatCurrency(stats.totalAccountBalance), '') +
          stat('Expense', formatCurrency(stats.totalExpense), 'negative') +
          stat('Income', formatCurrency(stats.totalIncome), 'positive') +
          stat('Net Flow', formatSigned(stats.netFlow), stats.netFlow >= 0 ? 'positive' : 'negative') +
        '</div>' +
        '<div class="section-head"><h2 class="section-title">Top Expense Categories</h2></div>' +
        expenseRows +
        '<div class="followups"><button id="summary-help" class="pill">Find savings</button></div>' +
        '</div>' +
      '</main>';
    }

    async function refreshCurrentView(button) {
      const kind = root.dataset.renderedKind || preferredKind;
      const toolByKind = {
        accounts: 'get_accounts',
        transactions: 'get_transactions',
        budgets: 'get_budgets',
        summary: 'get_financial_summary'
      };
      const toolName = toolByKind[kind] || toolByKind.summary;
      button?.setAttribute('disabled', '');
      try {
        if (window.openai?.callTool) {
          const result = await window.openai.callTool(toolName, {});
          render(result?.structuredContent || result);
          return;
        }
        window.parent.postMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: {} }
        }, '*');
      } finally {
        button?.removeAttribute('disabled');
      }
    }

    function render(data) {
      const kind = data?.kind || preferredKind;
      if (!data) {
        root.innerHTML = '<main class="shell"><div class="empty">Ask ChatGPT to load this Pocketly view.</div></main>';
        return;
      }
      if (kind === 'accounts') root.innerHTML = renderAccounts(data);
      else if (kind === 'transactions') root.innerHTML = renderTransactions(data);
      else if (kind === 'budgets') root.innerHTML = renderBudgets(data);
      else root.innerHTML = renderSummary(data);
      root.dataset.renderedKind = kind;
      notifyIntrinsicHeight();

      document.querySelector('.refresh-view')?.addEventListener('click', function (event) {
        refreshCurrentView(event.currentTarget);
      });
      document.getElementById('accounts-summary')?.addEventListener('click', function () {
        followUp('Explain my Pocketly account balances and what stands out.');
      });
      document.getElementById('records-summary')?.addEventListener('click', function () {
        followUp('Summarize these Pocketly records and point out notable spending patterns.');
      });
      document.getElementById('budget-help')?.addEventListener('click', function () {
        followUp('Review my Pocketly budgets and tell me which ones need attention.');
      });
      document.getElementById('summary-help')?.addEventListener('click', function () {
        followUp('Find savings opportunities from this Pocketly summary.');
      });
    }

    render(window.openai?.toolOutput);
    window.addEventListener('resize', notifyIntrinsicHeight, { passive: true });
    root.addEventListener('load', notifyIntrinsicHeight, true);
    window.addEventListener('openai:set_globals', function (event) {
      syncHostMaxHeight();
      render(event.detail?.globals?.toolOutput || window.openai?.toolOutput);
    }, { passive: true });
    window.addEventListener('message', function (event) {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== '2.0') return;
      if (message.method === 'ui/notifications/tool-result') {
        render(message.params?.structuredContent);
      }
    }, { passive: true });
  })();
</script>
  `.trim();
}
