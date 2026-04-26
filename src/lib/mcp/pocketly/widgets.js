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
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .shell { min-height: 100vh; padding: 16px; background: var(--bg); }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .brand { min-width: 0; }
  .eyebrow { margin: 0 0 4px; color: var(--muted); font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
  .title { margin: 0; color: var(--primary); font-size: 16px; line-height: 1.2; font-weight: 900; }
  .note { color: var(--muted); font-size: 11px; font-weight: 800; }
  .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
  .summary.four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat { min-width: 0; border: 1px solid var(--border); background: var(--card); border-radius: 12px; padding: 10px; text-align: center; }
  .stat-label { margin: 0; color: var(--muted); font-size: 10px; line-height: 1.2; letter-spacing: .04em; text-transform: uppercase; font-weight: 900; }
  .stat-value { margin: 5px 0 0; color: var(--text); font-size: 14px; line-height: 1.15; font-weight: 900; overflow-wrap: anywhere; }
  .positive { color: var(--primary); }
  .negative { color: var(--expense); }
  .section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0 8px; }
  .section-title { margin: 0; color: var(--primary); font-size: 13px; font-weight: 900; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .card { border: 1px solid var(--border); background: var(--card); border-radius: 12px; padding: 12px; }
  .account-card { display: flex; gap: 12px; align-items: center; }
  .icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex: none; background: var(--primary-soft); color: var(--primary); border: 1px solid #d9e6df; font-size: 16px; font-weight: 900; }
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
  .date-group { margin-top: 12px; }
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
  .followups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .pill { border: 1px solid #d9e6df; background: var(--primary); color: white; border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 900; cursor: pointer; }
  @media (min-width: 560px) {
    .shell { padding: 18px; }
    .summary.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .grid.accounts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
<script>
  (function () {
    const root = document.getElementById('pocketly-root');
    const preferredKind = root.dataset.kind;

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

    function iconFor(name, fallback) {
      const normalized = String(name || fallback || '').toLowerCase();
      if (normalized.includes('bank') || normalized.includes('landmark')) return 'B';
      if (normalized.includes('card')) return 'C';
      if (normalized.includes('piggy') || normalized.includes('coins')) return 'S';
      if (normalized.includes('phone')) return 'P';
      if (normalized.includes('car')) return 'C';
      if (normalized.includes('food') || normalized.includes('utensils')) return 'F';
      if (normalized.includes('home')) return 'H';
      return fallback || 'W';
    }

    function stat(label, value, tone) {
      return '<div class="stat"><p class="stat-label">' + escapeHtml(label) + '</p><p class="stat-value ' + (tone || '') + '">' + escapeHtml(value) + '</p></div>';
    }

    function renderAccounts(data) {
      const accounts = data.accounts || [];
      const stats = data.stats || {};
      const cards = accounts.length
        ? '<div class="grid accounts">' + accounts.map(function (account, index) {
            const balance = Number(account.balance || 0);
            return '<div class="card account-card">' +
              '<div class="icon">' + escapeHtml(iconFor(account.icon, String(index + 1))) + '</div>' +
              '<div class="card-main"><p class="card-title">' + escapeHtml(account.name) + '</p><p class="card-meta">' + escapeHtml(account.currency || 'INR') + ' account</p></div>' +
              '<p class="card-value ' + (balance < 0 ? 'negative' : 'positive') + '">' + formatCurrency(balance) + '</p>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="empty">No accounts yet.</div>';

      return '<main class="shell">' +
        '<div class="header"><div class="brand"><p class="eyebrow">Pocketly</p><h1 class="title">Accounts</h1></div><span class="note">' + accounts.length + ' accounts</span></div>' +
        '<div class="summary">' +
          stat('Balance', formatCurrency(stats.totalAccountBalance), '') +
          stat('Expense', formatCurrency(stats.totalExpense), 'negative') +
          stat('Income', formatCurrency(stats.totalIncome), 'positive') +
        '</div>' +
        '<div class="section-head"><h2 class="section-title">Your Accounts</h2></div>' +
        cards +
        '<div class="followups"><button id="accounts-summary" class="pill">Explain balances</button></div>' +
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
                  '<div class="record-left"><div class="icon ' + iconClass + '">' + escapeHtml(transaction.type === 'transfer' ? 'T' : iconFor(transaction.category?.icon, isIncome ? '+' : '-')) + '</div>' +
                  '<div class="card-main"><p class="card-title">' + escapeHtml(transactionTitle(transaction)) + '</p><p class="card-meta">' + escapeHtml(transactionMeta(transaction)) + '</p></div></div>' +
                  '<div class="amount ' + (isExpense ? 'negative' : isIncome ? 'positive' : '') + '">' + amount + '</div>' +
                '</div>';
              }).join('') + '</div></div>';
          }).join('')
        : '<div class="empty">No transactions for this period.</div>';

      return '<main class="shell">' +
        '<div class="header"><div class="brand"><p class="eyebrow">Pocketly Records</p><h1 class="title">' + escapeHtml(data.period?.label || 'Recent Records') + '</h1></div><span class="note">' + transactions.length + ' shown</span></div>' +
        '<div class="summary">' +
          stat('Expense', formatCurrency(stats.totalExpense), 'negative') +
          stat('Income', formatCurrency(stats.totalIncome), 'positive') +
          stat('Net Flow', formatSigned(stats.netFlow), stats.netFlow >= 0 ? 'positive' : 'negative') +
        '</div>' +
        rows +
        '<div class="followups"><button id="records-summary" class="pill">Summarize records</button></div>' +
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
        '<div class="header"><div class="brand"><p class="eyebrow">Pocketly Planning</p><h1 class="title">Budgets</h1></div><span class="note">' + budgets.length + ' budgets</span></div>' +
        '<div class="summary">' +
          stat('Budget', formatCurrency(stats.totalBudget), '') +
          stat('Spent', formatCurrency(stats.totalSpent), stats.exceededCount ? 'negative' : 'positive') +
          stat('Exceeded', String(stats.exceededCount || 0), stats.exceededCount ? 'negative' : '') +
        '</div>' +
        rows +
        '<div class="followups"><button id="budget-help" class="pill">Review budgets</button></div>' +
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
        '<div class="header"><div class="brand"><p class="eyebrow">Pocketly Analysis</p><h1 class="title">' + escapeHtml(data.period?.label || 'Summary') + '</h1></div></div>' +
        '<div class="summary four">' +
          stat('Balance', formatCurrency(stats.totalAccountBalance), '') +
          stat('Expense', formatCurrency(stats.totalExpense), 'negative') +
          stat('Income', formatCurrency(stats.totalIncome), 'positive') +
          stat('Net Flow', formatSigned(stats.netFlow), stats.netFlow >= 0 ? 'positive' : 'negative') +
        }</div>' +
        '<div class="section-head"><h2 class="section-title">Top Expense Categories</h2></div>' +
        expenseRows +
        '<div class="followups"><button id="summary-help" class="pill">Find savings</button></div>' +
      '</main>';
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
    window.addEventListener('openai:set_globals', function (event) {
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
