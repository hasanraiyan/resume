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

const POCKETLY_WIDGET_URI = 'ui://widget/pocketly-dashboard-v1.html';
const POCKETLY_WIDGET_MIME_TYPE = 'text/html;profile=mcp-app';

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

function normalizeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    icon: account.icon || 'wallet',
    balance: account.balance || 0,
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
    amount: transaction.amount,
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
      const transactionDate = new Date(transaction.date);
      const transactionCategoryId =
        transaction.category?.id ||
        transaction.category?._id?.toString?.() ||
        transaction.category ||
        null;

      return (
        transaction.type === 'expense' &&
        transactionCategoryId === categoryId &&
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
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

function buildAnalysis(transactions, accounts) {
  const categoryMap = new Map();
  const dailyMap = new Map();
  const accountMap = new Map();

  for (const transaction of transactions) {
    if (!['income', 'expense'].includes(transaction.type)) continue;

    const categoryId = transaction.category?.id || 'uncategorized';
    const categoryKey = `${categoryId}:${transaction.type}`;
    const existingCategory = categoryMap.get(categoryKey) || {
      categoryId,
      name: transaction.category?.name || 'Uncategorized',
      icon: transaction.category?.icon || 'tag',
      color: transaction.category?.color || '#7c8e88',
      type: transaction.type,
      total: 0,
      count: 0,
    };
    existingCategory.total += transaction.amount;
    existingCategory.count += 1;
    categoryMap.set(categoryKey, existingCategory);

    const date = new Date(transaction.date).toISOString().slice(0, 10);
    const dailyKey = `${date}:${transaction.type}`;
    const existingDaily = dailyMap.get(dailyKey) || { date, type: transaction.type, total: 0 };
    existingDaily.total += transaction.amount;
    dailyMap.set(dailyKey, existingDaily);

    const accountId = transaction.account?.id || 'unknown';
    const accountKey = `${accountId}:${transaction.type}`;
    const existingAccount = accountMap.get(accountKey) || {
      accountId,
      name: transaction.account?.name || 'Unknown',
      icon: transaction.account?.icon || 'wallet',
      type: transaction.type,
      total: 0,
      currentBalance: accounts.find((account) => account.id === accountId)?.balance || 0,
    };
    existingAccount.total += transaction.amount;
    accountMap.set(accountKey, existingAccount);
  }

  return {
    categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    dailyFlow: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    accountAnalysis: Array.from(accountMap.values()).sort((a, b) => b.total - a.total),
  };
}

async function buildDashboardPayload({ startDate, endDate, limit = 20 } = {}) {
  const period = makePeriod(startDate, endDate);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [accountsRaw, categoriesRaw, budgetsRaw, transactionsRaw, summaryRaw] = await Promise.all([
    getAccounts({ includeBalances: true }),
    getCategories(),
    getBudgets(),
    getTransactions({
      startDate: period.startDate,
      endDate: period.endDate,
      limit: 100,
    }),
    getFinancialSummary({
      startDate: period.startDate,
      endDate: period.endDate,
    }),
  ]);

  const accounts = accountsRaw.map(normalizeAccount);
  const categories = categoriesRaw.map(normalizeCategory);
  const allPeriodTransactions = transactionsRaw.map(normalizeTransaction);
  const transactions = allPeriodTransactions.slice(0, safeLimit);
  const budgets = budgetsRaw.map((budget) => normalizeBudget(budget, transactionsRaw));
  const totalExpense = allPeriodTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = allPeriodTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const analysis = buildAnalysis(allPeriodTransactions, accounts);

  return {
    app: {
      name: 'Pocketly',
      currency: 'INR',
      generatedAt: new Date().toISOString(),
    },
    period,
    stats: {
      totalAccountBalance,
      totalExpense,
      totalIncome,
      netFlow: totalIncome - totalExpense,
      totalTransactionCount: summaryRaw.totalTransactionCount || transactions.length,
      accountCount: accounts.length,
      categoryCount: categories.length,
      budgetCount: budgets.length,
    },
    accounts,
    transactions,
    categories,
    budgets,
    analysis: {
      ...analysis,
      totalExpense,
      totalIncome,
      netFlow: totalIncome - totalExpense,
      totalAccountBalance,
    },
  };
}

function getPocketlyWidgetHtml() {
  return `
<div id="pocketly-root"></div>
<style>
  :root {
    color-scheme: light;
    --bg: #fcfbf5;
    --card: #ffffff;
    --primary: #1f644e;
    --primary-weak: #f0f5f2;
    --text: #1e3a34;
    --muted: #7c8e88;
    --border: #e5e3d8;
    --expense: #c94c4c;
    --blue: #4a86e8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  button { font: inherit; }
  .shell { min-height: 100vh; padding: 14px; background: var(--bg); }
  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .logo { width: 36px; height: 36px; border-radius: 12px; background: var(--primary); color: white; display: grid; place-items: center; font-weight: 900; box-shadow: 0 8px 20px rgba(31, 100, 78, 0.18); }
  .title { margin: 0; font-size: 18px; line-height: 1.1; font-weight: 900; }
  .subtitle { margin: 3px 0 0; color: var(--muted); font-size: 12px; font-weight: 700; }
  .actions { display: flex; gap: 8px; }
  .icon-btn { border: 1px solid var(--border); background: white; color: var(--text); border-radius: 10px; width: 36px; height: 36px; display: grid; place-items: center; cursor: pointer; }
  .pill-btn { border: 1px solid #d9e6df; background: var(--primary); color: white; border-radius: 999px; padding: 9px 12px; font-size: 12px; font-weight: 900; cursor: pointer; }
  .grid { display: grid; gap: 10px; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
  .stat-label { margin: 0; color: var(--muted); font-size: 10px; letter-spacing: .04em; text-transform: uppercase; font-weight: 900; }
  .stat-value { margin: 5px 0 0; font-size: 17px; line-height: 1.15; font-weight: 900; color: var(--text); overflow-wrap: anywhere; }
  .positive { color: var(--primary); }
  .negative { color: var(--expense); }
  .section { margin-top: 14px; }
  .section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
  .section-title { margin: 0; font-size: 13px; font-weight: 900; color: var(--primary); }
  .section-note { color: var(--muted); font-size: 11px; font-weight: 800; }
  .records { overflow: hidden; padding: 0; }
  .record { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 12px; border-top: 1px solid var(--border); }
  .record:first-child { border-top: 0; }
  .record-main { min-width: 0; display: flex; gap: 10px; align-items: center; }
  .bubble { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; background: var(--primary-weak); color: var(--primary); font-size: 14px; font-weight: 900; flex: none; }
  .bubble.expense { background: #fdf2f2; color: var(--expense); }
  .record-title { margin: 0; font-size: 13px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .record-meta { margin: 2px 0 0; color: var(--muted); font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .amount { flex: none; font-size: 13px; font-weight: 900; font-variant-numeric: tabular-nums; }
  .accounts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .account-name { margin: 0; font-size: 12px; color: var(--muted); font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .account-balance { margin: 6px 0 0; font-size: 15px; font-weight: 900; overflow-wrap: anywhere; }
  .progress-row { display: grid; gap: 9px; }
  .progress-line { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; font-weight: 900; }
  .bar { height: 8px; background: var(--primary-weak); border-radius: 999px; overflow: hidden; }
  .bar-fill { height: 100%; background: var(--primary); border-radius: inherit; }
  .bar-fill.over { background: var(--expense); }
  .category-list { display: grid; gap: 8px; }
  .category { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 8px; font-size: 12px; font-weight: 900; }
  .dot { width: 10px; height: 10px; border-radius: 999px; background: var(--primary); }
  .daily { display: grid; grid-template-columns: repeat(auto-fit, minmax(18px, 1fr)); gap: 5px; align-items: end; min-height: 80px; padding-top: 8px; }
  .day { display: grid; gap: 2px; align-items: end; height: 78px; }
  .day-income, .day-expense { min-height: 2px; border-radius: 999px 999px 0 0; }
  .day-income { background: var(--primary); }
  .day-expense { background: var(--expense); opacity: .82; }
  .empty { text-align: center; color: var(--muted); padding: 28px 14px; font-size: 13px; font-weight: 800; }
  .followups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  @media (min-width: 640px) {
    .shell { padding: 18px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .accounts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
</style>
<script>
  (function () {
    const root = document.getElementById('pocketly-root');

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

    function signedCurrency(value) {
      const amount = Number(value || 0);
      return (amount < 0 ? '-' : '+') + formatCurrency(amount);
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }

    function transactionIcon(type) {
      if (type === 'income') return '+';
      if (type === 'transfer') return '=';
      return '-';
    }

    function renderRecords(transactions) {
      if (!transactions || transactions.length === 0) {
        return '<div class="card empty">No transactions in this period yet.</div>';
      }
      return '<div class="card records">' + transactions.slice(0, 8).map(function (transaction) {
        const isExpense = transaction.type === 'expense';
        const accountName = transaction.type === 'transfer'
          ? (transaction.account?.name || 'Account') + ' to ' + (transaction.toAccount?.name || 'Account')
          : transaction.account?.name || 'Account';
        const label = transaction.description || transaction.category?.name || 'Transaction';
        const amount = transaction.type === 'transfer'
          ? formatCurrency(transaction.amount)
          : (transaction.type === 'expense' ? '-' : '+') + formatCurrency(transaction.amount);
        return '<div class="record">' +
          '<div class="record-main">' +
            '<div class="bubble ' + (isExpense ? 'expense' : '') + '">' + transactionIcon(transaction.type) + '</div>' +
            '<div style="min-width:0">' +
              '<p class="record-title">' + escapeHtml(label) + '</p>' +
              '<p class="record-meta">' + escapeHtml(accountName) + ' - ' + escapeHtml(transaction.category?.name || transaction.type) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="amount ' + (isExpense ? 'negative' : transaction.type === 'income' ? 'positive' : '') + '">' + amount + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    function renderAccounts(accounts) {
      if (!accounts || accounts.length === 0) return '<div class="card empty">No accounts yet.</div>';
      return '<div class="grid accounts">' + accounts.slice(0, 6).map(function (account) {
        return '<div class="card">' +
          '<p class="account-name">' + escapeHtml(account.name) + '</p>' +
          '<p class="account-balance">' + formatCurrency(account.balance) + '</p>' +
        '</div>';
      }).join('') + '</div>';
    }

    function renderBudgets(budgets) {
      if (!budgets || budgets.length === 0) return '<div class="card empty">No budgets set.</div>';
      return '<div class="card progress-row">' + budgets.slice(0, 5).map(function (budget) {
        const progress = Math.max(0, Math.min(Number(budget.progress || 0), 100));
        return '<div>' +
          '<div class="progress-line">' +
            '<span>' + escapeHtml(budget.category?.name || 'Budget') + '</span>' +
            '<span class="' + (budget.isExceeded ? 'negative' : 'positive') + '">' + Math.round(progress) + '%</span>' +
          '</div>' +
          '<div class="bar"><div class="bar-fill ' + (budget.isExceeded ? 'over' : '') + '" style="width:' + progress + '%"></div></div>' +
          '<p class="record-meta">' + formatCurrency(budget.spent) + ' of ' + formatCurrency(budget.amount) + '</p>' +
        '</div>';
      }).join('') + '</div>';
    }

    function renderCategories(analysis) {
      const categories = (analysis?.categoryBreakdown || []).filter(function (item) {
        return item.type === 'expense';
      }).slice(0, 6);
      if (categories.length === 0) return '<div class="card empty">No category activity yet.</div>';
      return '<div class="card category-list">' + categories.map(function (item) {
        return '<div class="category">' +
          '<span class="dot" style="background:' + escapeHtml(item.color || '#1f644e') + '"></span>' +
          '<span>' + escapeHtml(item.name) + '</span>' +
          '<span class="negative">' + formatCurrency(item.total) + '</span>' +
        '</div>';
      }).join('') + '</div>';
    }

    function renderDailyFlow(analysis) {
      const daily = analysis?.dailyFlow || [];
      if (daily.length === 0) return '<div class="card empty">No daily flow data yet.</div>';
      const byDate = {};
      daily.forEach(function (entry) {
        byDate[entry.date] = byDate[entry.date] || { income: 0, expense: 0 };
        byDate[entry.date][entry.type] = Number(entry.total || 0);
      });
      const entries = Object.entries(byDate).slice(-14);
      const max = Math.max.apply(null, entries.flatMap(function (entry) {
        return [entry[1].income, entry[1].expense];
      }).concat([1]));
      return '<div class="card daily">' + entries.map(function (entry) {
        const incomeHeight = Math.max(2, Math.round((entry[1].income / max) * 72));
        const expenseHeight = Math.max(2, Math.round((entry[1].expense / max) * 72));
        return '<div class="day" title="' + escapeHtml(entry[0]) + '">' +
          '<div class="day-income" style="height:' + incomeHeight + 'px"></div>' +
          '<div class="day-expense" style="height:' + expenseHeight + 'px"></div>' +
        '</div>';
      }).join('') + '</div>';
    }

    function followUp(text) {
      if (window.openai?.sendFollowUpMessage) {
        window.openai.sendFollowUpMessage({ prompt: text });
      } else {
        window.parent.postMessage({
          jsonrpc: '2.0',
          method: 'ui/message',
          params: { role: 'user', content: [{ type: 'text', text }] }
        }, '*');
      }
    }

    async function refresh(data) {
      const input = {
        startDate: data?.period?.startDate,
        endDate: data?.period?.endDate,
        limit: 20
      };
      if (window.openai?.callTool) {
        const next = await window.openai.callTool('show_pocketly_dashboard', input);
        if (next?.structuredContent) render(next.structuredContent);
      }
    }

    function render(data) {
      if (!data || !data.stats) {
        root.innerHTML = '<div class="shell"><div class="card empty">Ask ChatGPT to show your Pocketly dashboard.</div></div>';
        return;
      }
      const stats = data.stats;
      root.innerHTML =
        '<main class="shell">' +
          '<div class="topbar">' +
            '<div class="brand"><div class="logo">P</div><div><h1 class="title">Pocketly</h1><p class="subtitle">' + escapeHtml(data.period?.label || 'Finance dashboard') + '</p></div></div>' +
            '<div class="actions"><button id="refresh" class="icon-btn" title="Refresh">R</button></div>' +
          '</div>' +
          '<div class="grid stats">' +
            '<div class="card"><p class="stat-label">Balance</p><p class="stat-value">' + formatCurrency(stats.totalAccountBalance) + '</p></div>' +
            '<div class="card"><p class="stat-label">Expense</p><p class="stat-value negative">' + formatCurrency(stats.totalExpense) + '</p></div>' +
            '<div class="card"><p class="stat-label">Income</p><p class="stat-value positive">' + formatCurrency(stats.totalIncome) + '</p></div>' +
            '<div class="card"><p class="stat-label">Net Flow</p><p class="stat-value ' + (stats.netFlow >= 0 ? 'positive' : 'negative') + '">' + signedCurrency(stats.netFlow) + '</p></div>' +
          '</div>' +
          '<section class="section"><div class="section-head"><h2 class="section-title">Recent Records</h2><span class="section-note">' + Number(data.transactions?.length || 0) + ' shown</span></div>' + renderRecords(data.transactions) + '</section>' +
          '<section class="section"><div class="section-head"><h2 class="section-title">Accounts</h2><span class="section-note">' + Number(data.accounts?.length || 0) + ' accounts</span></div>' + renderAccounts(data.accounts) + '</section>' +
          '<section class="section"><div class="section-head"><h2 class="section-title">Planning</h2><span class="section-note">Budgets</span></div>' + renderBudgets(data.budgets) + '</section>' +
          '<section class="section"><div class="section-head"><h2 class="section-title">Top Expense Categories</h2></div>' + renderCategories(data.analysis) + '</section>' +
          '<section class="section"><div class="section-head"><h2 class="section-title">Daily Flow</h2></div>' + renderDailyFlow(data.analysis) + '</section>' +
          '<div class="followups">' +
            '<button id="summarize" class="pill-btn">Summarize spending</button>' +
            '<button id="savings" class="pill-btn">Find savings</button>' +
          '</div>' +
        '</main>';
      document.getElementById('refresh')?.addEventListener('click', function () { refresh(data); });
      document.getElementById('summarize')?.addEventListener('click', function () { followUp('Summarize my Pocketly spending for this period.'); });
      document.getElementById('savings')?.addEventListener('click', function () { followUp('Find practical savings opportunities from my Pocketly dashboard.'); });
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

  server.registerResource(
    'pocketly-dashboard',
    POCKETLY_WIDGET_URI,
    {
      title: 'Pocketly Dashboard',
      description: 'Compact read-only Pocketly finance dashboard for ChatGPT.',
    },
    async () => ({
      contents: [
        {
          uri: POCKETLY_WIDGET_URI,
          mimeType: POCKETLY_WIDGET_MIME_TYPE,
          text: getPocketlyWidgetHtml(),
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
            'openai/widgetDescription':
              'A compact Pocketly dashboard showing balances, recent records, budgets, and spending analysis.',
            'openai/widgetPrefersBorder': true,
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [],
            },
          },
        },
      ],
    })
  );

  server.registerTool(
    'show_pocketly_dashboard',
    {
      title: 'Show Pocketly Dashboard',
      description:
        'Use this when the user wants a visual Pocketly dashboard with balances, records, budgets, accounts, and spending analysis.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        startDate: z
          .string()
          .optional()
          .describe('Optional period start date as an ISO date string'),
        endDate: z.string().optional().describe('Optional period end date as an ISO date string'),
        limit: z.number().int().min(1).max(100).optional().describe('Max recent records to show'),
      },
      _meta: toolMeta('Loading Pocketly...', 'Pocketly dashboard ready.', {
        ui: { resourceUri: POCKETLY_WIDGET_URI },
        'openai/outputTemplate': POCKETLY_WIDGET_URI,
      }),
    },
    async ({ startDate, endDate, limit }) => {
      const dashboard = await buildDashboardPayload({ startDate, endDate, limit });
      return textResult(
        `Showing Pocketly dashboard for ${dashboard.period.label}: ${dashboard.transactions.length} recent records, ${dashboard.accounts.length} accounts, and ${dashboard.budgets.length} budgets.`,
        dashboard
      );
    }
  );

  server.registerTool(
    'get_accounts',
    {
      title: 'Get Accounts',
      description: 'Use this when the user needs Pocketly account names and current balances.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: toolMeta('Loading accounts...', 'Accounts ready.'),
    },
    async () => {
      const accounts = (await getAccounts({ includeBalances: true })).map(normalizeAccount);
      return textResult(`Found ${accounts.length} active Pocketly accounts.`, { accounts });
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
      return textResult(`Found ${categories.length} active Pocketly categories.`, { categories });
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
      _meta: toolMeta('Loading records...', 'Records ready.'),
    },
    async ({ type, limit, startDate, endDate }) => {
      const transactions = (await getTransactions({ type, limit, startDate, endDate })).map(
        normalizeTransaction
      );
      return textResult(`Found ${transactions.length} matching Pocketly transactions.`, {
        transactions,
      });
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
      _meta: toolMeta('Calculating summary...', 'Summary ready.'),
    },
    async ({ startDate, endDate }) => {
      const period = makePeriod(startDate, endDate);
      const dashboard = await buildDashboardPayload({
        startDate: period.startDate,
        endDate: period.endDate,
        limit: 100,
      });
      const summary = {
        period: dashboard.period,
        stats: dashboard.stats,
        topExpenseCategories: dashboard.analysis.categoryBreakdown
          .filter((category) => category.type === 'expense')
          .slice(0, 10),
        topIncomeCategories: dashboard.analysis.categoryBreakdown
          .filter((category) => category.type === 'income')
          .slice(0, 5),
        accounts: dashboard.accounts,
      };
      return textResult(
        `Pocketly summary for ${dashboard.period.label}: net flow ${summary.stats.netFlow}.`,
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
      _meta: toolMeta('Loading budgets...', 'Budgets ready.'),
    },
    async () => {
      const [budgetsRaw, transactionsRaw] = await Promise.all([
        getBudgets(),
        getTransactions({ limit: 100 }),
      ]);
      const budgets = budgetsRaw.map((budget) => normalizeBudget(budget, transactionsRaw));
      return textResult(`Found ${budgets.length} active Pocketly budgets.`, { budgets });
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
