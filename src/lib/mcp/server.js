import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getAccounts,
  getCategories,
  getTransactions,
  getFinancialSummary,
  createCategory,
  updateCategory,
  deleteCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/lib/apps/pocketly/service/service';

const POCKETLY_WIDGET_DOMAIN = 'https://hasanraiyan.me';
const POCKETLY_WIDGET_MIME_TYPE = 'text/html;profile=mcp-app';

const WIDGETS = {
  accounts: {
    name: 'pocketly-accounts',
    uri: 'ui://widget/pocketly-accounts-v1.html',
    title: 'Pocketly Accounts',
    description: 'Account balance cards styled like the Pocketly Accounts tab.',
  },
  transactions: {
    name: 'pocketly-records',
    uri: 'ui://widget/pocketly-records-v1.html',
    title: 'Pocketly Records',
    description: 'Recent transaction rows styled like the Pocketly Records tab.',
  },
  budgets: {
    name: 'pocketly-budgets',
    uri: 'ui://widget/pocketly-budgets-v1.html',
    title: 'Pocketly Budgets',
    description: 'Budget progress cards styled like Pocketly planning.',
  },
  summary: {
    name: 'pocketly-summary',
    uri: 'ui://widget/pocketly-summary-v1.html',
    title: 'Pocketly Summary',
    description: 'Financial summary cards and top categories styled like Pocketly analysis.',
  },
};

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

const MUTATION_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
};

const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: true,
};

function textResult(text, structuredContent = undefined, extra = {}) {
  return {
    content: [{ type: 'text', text }],
    ...(structuredContent ? { structuredContent } : {}),
    ...extra,
  };
}

function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

function toolMeta(invoking, invoked, extra = {}) {
  return {
    'openai/toolInvocation/invoking': invoking,
    'openai/toolInvocation/invoked': invoked,
    ...extra,
  };
}

function widgetToolMeta(widget, invoking, invoked) {
  return toolMeta(invoking, invoked, {
    ui: { resourceUri: widget.uri },
    'openai/outputTemplate': widget.uri,
  });
}

function normalizeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    icon: account.icon || 'wallet',
    balance: account.balance ?? account.currentBalance ?? 0,
    initialBalance: account.initialBalance || 0,
    currency: account.currency || 'INR',
  };
}

function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon || 'tag',
    color: category.color || '#1f644e',
  };
}

function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount) || 0,
    description: transaction.description || '',
    category: transaction.category
      ? {
          id: transaction.category.id || transaction.category._id?.toString?.() || null,
          name: transaction.category.name,
          icon: transaction.category.icon || 'tag',
          color: transaction.category.color || '#1f644e',
        }
      : null,
    account: transaction.account
      ? {
          id: transaction.account.id || transaction.account._id?.toString?.() || null,
          name: transaction.account.name,
          icon: transaction.account.icon || 'wallet',
        }
      : null,
    toAccount: transaction.toAccount
      ? {
          id: transaction.toAccount.id || transaction.toAccount._id?.toString?.() || null,
          name: transaction.toAccount.name,
          icon: transaction.toAccount.icon || 'wallet',
        }
      : null,
    date: transaction.date,
  };
}

function normalizeBudget(budget, transactions = []) {
  const categoryId =
    budget.category?.id || budget.category?._id?.toString?.() || budget.category || null;
  const now = new Date();
  const spent = transactions
    .filter((transaction) => {
      const date = new Date(transaction.date);
      const transactionCategoryId =
        transaction.category?.id ||
        transaction.category?._id?.toString?.() ||
        transaction.category ||
        null;

      return (
        transaction.type === 'expense' &&
        transactionCategoryId === categoryId &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const amount = Number(budget.amount) || 0;
  const progress = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;

  return {
    id: budget.id,
    category: budget.category
      ? {
          id: categoryId,
          name: budget.category.name,
          icon: budget.category.icon || 'tag',
          color: budget.category.color || '#1f644e',
          type: budget.category.type || 'expense',
        }
      : null,
    categoryId,
    amount,
    period: budget.period || 'monthly',
    spent,
    progress,
    isExceeded: spent > amount,
  };
}

function makePeriod(startDate, endDate) {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end);

  if (!startDate) {
    start.setDate(end.getDate() - 6);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const labelOptions = { month: 'short', day: 'numeric' };
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    label: `${start.toLocaleDateString('en-US', labelOptions)} - ${end.toLocaleDateString(
      'en-US',
      labelOptions
    )}`,
  };
}

function getTransactionStats(transactions) {
  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalExpense,
    totalIncome,
    netFlow: totalIncome - totalExpense,
  };
}

function getCategoryBreakdown(transactions) {
  const map = new Map();

  for (const transaction of transactions) {
    if (!['income', 'expense'].includes(transaction.type)) continue;
    const categoryId = transaction.category?.id || 'uncategorized';
    const key = `${categoryId}:${transaction.type}`;
    const row = map.get(key) || {
      categoryId,
      name: transaction.category?.name || 'Uncategorized',
      icon: transaction.category?.icon || 'tag',
      color: transaction.category?.color || '#7c8e88',
      type: transaction.type,
      total: 0,
      count: 0,
    };
    row.total += transaction.amount;
    row.count += 1;
    map.set(key, row);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

async function buildAccountsPayload() {
  const [accountsRaw, transactionsRaw] = await Promise.all([
    getAccounts({ includeBalances: true }),
    getTransactions({ limit: 100 }),
  ]);
  const accounts = accountsRaw.map(normalizeAccount);
  const transactions = transactionsRaw.map(normalizeTransaction);
  const stats = getTransactionStats(transactions);

  return {
    kind: 'accounts',
    stats: {
      totalAccountBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
      ...stats,
      accountCount: accounts.length,
    },
    accounts,
  };
}

async function buildTransactionsPayload({ type, limit = 20, startDate, endDate } = {}) {
  const period = makePeriod(startDate, endDate);
  const transactions = (
    await getTransactions({
      type,
      limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
      startDate: period.startDate,
      endDate: period.endDate,
    })
  ).map(normalizeTransaction);

  return {
    kind: 'transactions',
    period,
    stats: getTransactionStats(transactions),
    transactions,
  };
}

async function buildBudgetsPayload() {
  const [budgetsRaw, transactionsRaw] = await Promise.all([
    getBudgets(),
    getTransactions({ limit: 100 }),
  ]);
  const transactions = transactionsRaw.map(normalizeTransaction);
  const budgets = budgetsRaw.map((budget) => normalizeBudget(budget, transactionsRaw));

  return {
    kind: 'budgets',
    stats: {
      budgetCount: budgets.length,
      exceededCount: budgets.filter((budget) => budget.isExceeded).length,
      totalBudget: budgets.reduce((sum, budget) => sum + budget.amount, 0),
      totalSpent: budgets.reduce((sum, budget) => sum + budget.spent, 0),
    },
    budgets,
    transactions,
  };
}

async function buildSummaryPayload({ startDate, endDate } = {}) {
  const period = makePeriod(startDate, endDate);
  const [summaryRaw, accountsRaw, transactionsRaw] = await Promise.all([
    getFinancialSummary({ startDate: period.startDate, endDate: period.endDate }),
    getAccounts({ includeBalances: true }),
    getTransactions({ startDate: period.startDate, endDate: period.endDate, limit: 100 }),
  ]);
  const accounts = accountsRaw.map(normalizeAccount);
  const transactions = transactionsRaw.map(normalizeTransaction);
  const stats = {
    totalExpense: summaryRaw.totalExpense ?? getTransactionStats(transactions).totalExpense,
    totalIncome: summaryRaw.totalIncome ?? getTransactionStats(transactions).totalIncome,
    netFlow: summaryRaw.netIncome ?? getTransactionStats(transactions).netFlow,
    totalAccountBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    accountCount: accounts.length,
    transactionCount: transactions.length,
  };
  const categoryBreakdown = getCategoryBreakdown(transactions);

  return {
    kind: 'summary',
    period,
    stats,
    accounts,
    topExpenseCategories: categoryBreakdown
      .filter((category) => category.type === 'expense')
      .slice(0, 8),
    topIncomeCategories: categoryBreakdown
      .filter((category) => category.type === 'income')
      .slice(0, 5),
  };
}

function getWidgetMetadata(description) {
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

function registerPocketlyWidget(server, widget, kind) {
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

function getPocketlyWidgetHtml(kind) {
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
        '</div>' +
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

export function createMcpServer() {
  const server = new McpServer({
    name: 'pocketly',
    version: '1.0.0',
  });

  registerPocketlyWidget(server, WIDGETS.accounts, 'accounts');
  registerPocketlyWidget(server, WIDGETS.transactions, 'transactions');
  registerPocketlyWidget(server, WIDGETS.budgets, 'budgets');
  registerPocketlyWidget(server, WIDGETS.summary, 'summary');

  server.registerTool(
    'get_accounts',
    {
      title: 'Get Accounts',
      description: 'Use this when the user needs Pocketly account names and current balances.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: widgetToolMeta(WIDGETS.accounts, 'Loading accounts...', 'Accounts ready.'),
    },
    async () => {
      const payload = await buildAccountsPayload();
      return textResult(`Found ${payload.accounts.length} active Pocketly accounts.`, payload);
    }
  );

  server.registerTool(
    'get_categories',
    {
      title: 'Get Categories',
      description: 'Use this when the user needs Pocketly income or expense categories.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: toolMeta('Loading categories...', 'Categories ready.'),
    },
    async () => {
      const categories = (await getCategories()).map(normalizeCategory);
      return textResult(`Found ${categories.length} active Pocketly categories.`, {
        kind: 'categories',
        categories,
      });
    }
  );

  server.registerTool(
    'create_category',
    {
      title: 'Create Category',
      description: 'Use this when the user wants to add a new Pocketly income or expense category.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        name: z.string().describe('Display name of the category'),
        type: z.enum(['income', 'expense']).describe('Category type'),
        icon: z.string().optional().describe('Icon identifier, such as utensils, car, or tag'),
        color: z.string().optional().describe('Hex color or Tailwind background class'),
      },
      _meta: toolMeta('Creating category...', 'Category created.'),
    },
    async (payload) => {
      try {
        const category = normalizeCategory(await createCategory(payload));
        return textResult(`Created ${category.type} category "${category.name}".`, {
          success: true,
          category,
        });
      } catch (err) {
        return errorResult(`Error creating category: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_category',
    {
      title: 'Update Category',
      description: 'Use this when the user wants to update an existing Pocketly category.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the category to update'),
        name: z.string().optional(),
        type: z.enum(['income', 'expense']).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      },
      _meta: toolMeta('Updating category...', 'Category updated.'),
    },
    async ({ id, ...patch }) => {
      try {
        const category = normalizeCategory(await updateCategory(id, patch));
        return textResult(`Updated category "${category.name}".`, { success: true, category });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'delete_category',
    {
      title: 'Delete Category',
      description: 'Use this when the user wants to remove an existing Pocketly category.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the category to delete'),
      },
      _meta: toolMeta('Deleting category...', 'Category deleted.'),
    },
    async ({ id }) => {
      try {
        const deleted = await deleteCategory(id);
        if (!deleted) return errorResult('Category not found or already deleted.');
        return textResult('Category deleted from active Pocketly records.', {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'get_transactions',
    {
      title: 'Get Transactions',
      description:
        'Use this when the user needs recent Pocketly transactions, optionally filtered by transaction type.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        type: z.enum(['income', 'expense', 'transfer']).optional().describe('Filter by type'),
        limit: z.number().int().min(1).max(100).optional().describe('Max results, default 20'),
        startDate: z
          .string()
          .optional()
          .describe('Optional period start date as an ISO date string'),
        endDate: z.string().optional().describe('Optional period end date as an ISO date string'),
      },
      _meta: widgetToolMeta(WIDGETS.transactions, 'Loading records...', 'Records ready.'),
    },
    async (payload) => {
      const data = await buildTransactionsPayload(payload);
      return textResult(`Found ${data.transactions.length} matching Pocketly transactions.`, data);
    }
  );

  server.registerTool(
    'get_financial_summary',
    {
      title: 'Get Financial Summary',
      description:
        'Use this when the user asks for totals, net flow, balances, or top Pocketly categories.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        startDate: z
          .string()
          .optional()
          .describe('Optional period start date as an ISO date string'),
        endDate: z.string().optional().describe('Optional period end date as an ISO date string'),
      },
      _meta: widgetToolMeta(WIDGETS.summary, 'Calculating summary...', 'Summary ready.'),
    },
    async (payload) => {
      const summary = await buildSummaryPayload(payload);
      return textResult(
        `Pocketly summary for ${summary.period.label}: net flow ${summary.stats.netFlow}.`,
        summary
      );
    }
  );

  server.registerTool(
    'create_transaction',
    {
      title: 'Create Transaction',
      description:
        'Use this when the user wants to save a Pocketly transaction after resolving account and category IDs with the read tools.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        type: z.enum(['income', 'expense', 'transfer']).describe('Transaction type'),
        amount: z.number().positive().describe('Positive amount'),
        description: z.string().optional().describe('Short description'),
        accountId: z.string().describe('MongoDB _id of the source account'),
        categoryId: z
          .string()
          .optional()
          .describe('MongoDB _id of the category, required for income or expense'),
        toAccountId: z
          .string()
          .optional()
          .describe('MongoDB _id of the destination account, required for transfers'),
        date: z.string().optional().describe('Date in YYYY-MM-DD, defaults to today'),
      },
      _meta: toolMeta('Saving transaction...', 'Transaction saved.'),
    },
    async ({ type, amount, description, accountId, categoryId, toAccountId, date }) => {
      const payload = {
        type,
        amount,
        description: description || '',
        account: accountId,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      };

      if (type === 'transfer') {
        payload.toAccount = toAccountId;
      } else {
        payload.category = categoryId;
      }

      try {
        const transaction = normalizeTransaction(await createTransaction(payload));
        return textResult(`Saved ${transaction.type} transaction for ${transaction.amount}.`, {
          success: true,
          transaction,
        });
      } catch (err) {
        return errorResult(`Validation errors: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_transaction',
    {
      title: 'Delete Transaction',
      description:
        'Use this when the user wants to remove a Pocketly transaction from active records.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the transaction to delete'),
      },
      _meta: toolMeta('Deleting transaction...', 'Transaction deleted.'),
    },
    async ({ id }) => {
      try {
        const deleted = await deleteTransaction(id);
        if (!deleted) return errorResult('Transaction not found or already deleted.');
        return textResult('Transaction deleted from active Pocketly records.', {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'update_transaction',
    {
      title: 'Update Transaction',
      description:
        'Use this when the user wants to update fields of an existing Pocketly transaction.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the transaction'),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        categoryId: z.string().optional().describe('New category _id'),
        accountId: z.string().optional().describe('New source account _id'),
        toAccountId: z.string().optional().describe('New destination account _id for transfers'),
        date: z.string().optional().describe('New date YYYY-MM-DD'),
      },
      _meta: toolMeta('Updating transaction...', 'Transaction updated.'),
    },
    async ({ id, amount, description, categoryId, accountId, toAccountId, date }) => {
      const patch = {};
      if (amount !== undefined) patch.amount = amount;
      if (description !== undefined) patch.description = description;
      if (categoryId) patch.category = categoryId;
      if (accountId) patch.account = accountId;
      if (toAccountId) patch.toAccount = toAccountId;
      if (date) patch.date = new Date(date).toISOString();

      try {
        const transaction = normalizeTransaction(await updateTransaction(id, patch));
        return textResult(`Updated ${transaction.type} transaction "${transaction.description}".`, {
          success: true,
          transaction,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'get_budgets',
    {
      title: 'Get Budgets',
      description: 'Use this when the user needs Pocketly budgets and budget progress.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: widgetToolMeta(WIDGETS.budgets, 'Loading budgets...', 'Budgets ready.'),
    },
    async () => {
      const payload = await buildBudgetsPayload();
      return textResult(`Found ${payload.budgets.length} active Pocketly budgets.`, payload);
    }
  );

  server.registerTool(
    'create_budget',
    {
      title: 'Create Budget',
      description:
        'Use this when the user wants to create a Pocketly budget after resolving categoryId with get_categories.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        categoryId: z.string().describe('MongoDB _id of the category'),
        amount: z.number().positive().describe('Positive amount for the budget'),
        period: z
          .enum(['monthly', 'weekly', 'yearly'])
          .optional()
          .describe('Budget period, defaults to monthly'),
      },
      _meta: toolMeta('Creating budget...', 'Budget created.'),
    },
    async ({ categoryId, amount, period }) => {
      try {
        const budget = normalizeBudget(
          await createBudget({ category: categoryId, amount, period: period || 'monthly' }),
          []
        );
        return textResult(`Created ${budget.period} budget for ${budget.amount}.`, {
          success: true,
          budget,
        });
      } catch (err) {
        return errorResult(`Validation errors: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_budget',
    {
      title: 'Update Budget',
      description: 'Use this when the user wants to update fields of an existing Pocketly budget.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the budget'),
        categoryId: z.string().optional().describe('New category _id'),
        amount: z.number().positive().optional(),
        period: z.enum(['monthly', 'weekly', 'yearly']).optional(),
      },
      _meta: toolMeta('Updating budget...', 'Budget updated.'),
    },
    async ({ id, categoryId, amount, period }) => {
      const patch = {};
      if (categoryId) patch.category = categoryId;
      if (amount !== undefined) patch.amount = amount;
      if (period !== undefined) patch.period = period;

      try {
        const budget = normalizeBudget(await updateBudget(id, patch), []);
        return textResult(`Updated ${budget.period} budget for ${budget.amount}.`, {
          success: true,
          budget,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  server.registerTool(
    'delete_budget',
    {
      title: 'Delete Budget',
      description: 'Use this when the user wants to remove a Pocketly budget from active records.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('MongoDB _id of the budget to delete'),
      },
      _meta: toolMeta('Deleting budget...', 'Budget deleted.'),
    },
    async ({ id }) => {
      try {
        const deleted = await deleteBudget(id);
        if (!deleted) return errorResult('Budget not found or already deleted.');
        return textResult('Budget deleted from active Pocketly records.', {
          success: true,
          deletedId: id,
        });
      } catch (err) {
        return errorResult(err.message);
      }
    }
  );

  return server;
}
