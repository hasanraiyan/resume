import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import * as service from '@/lib/apps/pocketly/service/service';

// --- Helpers ---

function readAnnotations() {
  return { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
}

function toolMeta() {
  return { ui: { visibility: ['model', 'app'] } };
}

function result(structuredContent, text) {
  return {
    structuredContent,
    content: [{ type: 'text', text }],
    _meta: { data: structuredContent },
  };
}

// --- Formatting Helpers ---

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(amount) {
  return `₹${currencyFormatter.format(amount || 0)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '?';
  return dateStr.split('T')[0];
}

// ==================== Tool Registrations ====================

export function registerPocketlyMcp(server) {
  // ==================== FINANCIAL OVERVIEW ====================

  registerAppTool(
    server,
    'get_financial_overview',
    {
      title: 'Get Financial Overview',
      description:
        'Returns a snapshot of your financial situation: all accounts with their current ' +
        'balances, total net worth, total income and expense across all time (or within an ' +
        'optional date range), and the most recent transactions. This is the go-to tool for ' +
        '"how are my finances looking?" type questions.',
      inputSchema: {
        startDate: z
          .string()
          .optional()
          .describe(
            'Start date in YYYY-MM-DD format. When provided with endDate, limits the income/expense ' +
              'summary to this range. Omit for an all-time view.'
          ),
        endDate: z
          .string()
          .optional()
          .describe(
            'End date in YYYY-MM-DD format. When provided with startDate, limits the income/expense ' +
              'summary to this range. Omit for an all-time view.'
          ),
        transactionLimit: z
          .number()
          .optional()
          .default(10)
          .describe(
            'Maximum number of recent transactions to include in the response. Default 10, max 100.'
          ),
      },
      outputSchema: {
        accounts: z.array(z.any()),
        totalBalance: z.number(),
        totalIncome: z.number(),
        totalExpense: z.number(),
        netIncome: z.number(),
        recentTransactions: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { startDate, endDate, transactionLimit } = args;

      const [accounts, summary, transactions] = await Promise.all([
        service.getAccounts({ includeBalances: true }),
        service.getFinancialSummary({ startDate, endDate }),
        service.getTransactions({
          limit: Math.min(transactionLimit ?? 10, 100),
          startDate,
          endDate,
        }),
      ]);

      const totalBalance = accounts.reduce(
        (sum, acc) => sum + (Number(acc.currentBalance) || 0),
        0
      );

      const accountLines = accounts
        .map((acc) => `  • ${acc.name}: ${formatCurrency(acc.currentBalance)}`)
        .join('\n');

      const recentLines = transactions
        .map(
          (tx) =>
            `  • ${formatDate(tx.date)} | ${tx.description || '(no description)'} | ` +
            `${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}${formatCurrency(tx.amount)} | ${tx.type}`
        )
        .join('\n');

      const periodLabel = startDate && endDate ? `from ${startDate} to ${endDate}` : 'all time';

      let text = `📊 **Financial Overview (${periodLabel})**\n\n`;
      text += `**Accounts:**\n${accountLines}\n\n`;
      text += `**Total Balance:** ${formatCurrency(totalBalance)}\n`;
      text += `**Total Income:** ${formatCurrency(summary.totalIncome)}\n`;
      text += `**Total Expense:** ${formatCurrency(summary.totalExpense)}\n`;
      text += `**Net Income:** ${formatCurrency(summary.netIncome)}\n`;

      if (transactions.length > 0) {
        text += `\n**Recent Transactions:**\n${recentLines}\n`;
      }

      return result(
        {
          accounts,
          totalBalance,
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netIncome: summary.netIncome,
          recentTransactions: transactions,
        },
        text
      );
    }
  );

  // ==================== ACCOUNTS ====================

  registerAppTool(
    server,
    'get_accounts',
    {
      title: 'Get Accounts',
      description:
        'Lists all accounts with their current computed balances. Includes account name, ' +
        'icon, initial balance, and the live balance after all transactions are applied. ' +
        'Use this before creating or updating a transaction to resolve the account ID, ' +
        'or when the user asks about their accounts, wallets, or where their money is stored.',
      inputSchema: {
        includeBalances: z
          .boolean()
          .optional()
          .default(true)
          .describe(
            'Whether to compute live balances by replaying all transactions. Set to false for raw account data only.'
          ),
        includeIgnored: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether to include accounts marked as ignored. Default false.'),
      },
      outputSchema: {
        accounts: z.array(z.any()),
        totalBalance: z.number(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { includeBalances, includeIgnored } = args;

      const accounts = await service.getAccounts({ includeBalances });

      const visibleAccounts = includeIgnored
        ? accounts
        : accounts.filter((a) => !a.ignored);

      const totalBalance = visibleAccounts.reduce(
        (sum, acc) => sum + (Number(acc.currentBalance) || 0),
        0
      );

      const accountLines = visibleAccounts
        .map(
          (acc) =>
            `  • **${acc.name}** (${acc.icon || 'wallet'}): ${formatCurrency(acc.currentBalance)}` +
            `${acc.ignored ? ' _(ignored)_' : ''}` +
            ` | initial: ${formatCurrency(acc.initialBalance)}`
        )
        .join('\n');

      let text = `**Accounts (${visibleAccounts.length})**\n\n${accountLines}\n\n`;
      text += `**Total Balance:** ${formatCurrency(totalBalance)}`;

      return result(
        {
          accounts: visibleAccounts,
          totalBalance,
        },
        text
      );
    }
  );

  // ==================== CATEGORIES ====================

  registerAppTool(
    server,
    'get_categories',
    {
      title: 'Get Categories',
      description:
        'Lists all income and expense categories with their name, type, icon, and color. ' +
        'Use this before creating or updating a transaction to resolve the category ID, ' +
        'or when the user asks about their category setup or what categories they use.',
      inputSchema: {
        type: z
          .enum(['income', 'expense'])
          .optional()
          .describe('Filter by transaction type. Omit to return all categories.'),
      },
      outputSchema: {
        categories: z.array(z.any()),
        incomeCount: z.number(),
        expenseCount: z.number(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { type } = args;

      const categories = await service.getCategories();

      const filtered = type
        ? categories.filter((c) => c.type === type)
        : categories;

      const incomeCategories = categories.filter((c) => c.type === 'income');
      const expenseCategories = categories.filter((c) => c.type === 'expense');

      const displayCategories = type ? filtered : categories;

      const categoryLines = displayCategories
        .map(
          (cat) =>
            `  • **${cat.name}** (${cat.type})` +
            ` | icon: ${cat.icon || 'tag'}` +
            ` | color: ${cat.color || '#000000'}` +
            ` | id: \`${cat.id}\``
        )
        .join('\n');

      let text = `**Categories**\n\n`;
      if (!type) {
        text += `Income: ${incomeCategories.length} | Expense: ${expenseCategories.length} | Total: ${categories.length}\n\n`;
      }
      text += `${categoryLines || '  _(no categories found)_'}`;

      return result(
        {
          categories: displayCategories,
          incomeCount: incomeCategories.length,
          expenseCount: expenseCategories.length,
        },
        text
      );
    }
  );

  // ==================== TRANSACTIONS ====================

  registerAppTool(
    server,
    'get_transactions',
    {
      title: 'Get Transactions',
      description:
        'Search and filter transactions with optional criteria. Use this when the user asks ' +
        'about their spending, recent transactions, what they spent in a category, or ' +
        'transactions from a specific account or date range. Supports date range filtering, ' +
        'account and category filtering, type filtering, and limit control.',
      inputSchema: {
        type: z
          .enum(['income', 'expense', 'transfer'])
          .optional()
          .describe('Filter by transaction type: income, expense, or transfer.'),
        startDate: z
          .string()
          .optional()
          .describe(
            'Start date in YYYY-MM-DD format. Filters transactions from this date onwards (inclusive).'
          ),
        endDate: z
          .string()
          .optional()
          .describe(
            'End date in YYYY-MM-DD format. Filters transactions up to this date (inclusive).'
          ),
        account: z
          .string()
          .optional()
          .describe(
            'Account ID to filter by. Must be resolved from get_accounts first. Use the exact MongoDB ID.'
          ),
        category: z
          .string()
          .optional()
          .describe(
            'Category ID to filter by. Must be resolved from get_categories first. Use the exact MongoDB ID.'
          ),
        limit: z
          .number()
          .optional()
          .default(20)
          .describe('Maximum number of transactions to return. Default 20, max 100.'),
      },
      outputSchema: {
        transactions: z.array(z.any()),
        totalCount: z.number(),
        totalIncome: z.number(),
        totalExpense: z.number(),
        filters: z.any(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { type, startDate, endDate, account, category, limit } = args;

      const transactions = await service.getTransactions({
        type,
        limit: Math.min(limit ?? 20, 100),
        startDate,
        endDate,
        account,
        category,
      });

      let totalIncome = 0;
      let totalExpense = 0;
      for (const tx of transactions) {
        if (tx.type === 'income') totalIncome += tx.amount;
        else if (tx.type === 'expense') totalExpense += tx.amount;
      }

      const txLines = transactions
        .map(
          (tx) =>
            `  • ${formatDate(tx.date)} | **${tx.description || '(no description)'}**` +
            ` | ${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}${formatCurrency(tx.amount)}` +
            ` | ${tx.type}` +
            ` | ${tx.category?.name || '-'}` +
            ` | ${tx.account?.name || '-'}` +
            ` | id: \`${tx.id}\``
        )
        .join('\n');

      const filters = { type: type || 'all', startDate: startDate || 'none', endDate: endDate || 'none' };

      let text = `**Transactions (${transactions.length})**\n\n`;
      if (type || startDate || endDate || account || category) {
        const filterParts = [];
        if (type) filterParts.push(`type: ${type}`);
        if (startDate) filterParts.push(`from: ${startDate}`);
        if (endDate) filterParts.push(`to: ${endDate}`);
        if (account) filterParts.push(`account: \`${account}\``);
        if (category) filterParts.push(`category: \`${category}\``);
        text += `Filters: ${filterParts.join(', ') || 'none'}\n\n`;
      }
      text += `${txLines || '  _(no transactions found)_'}\n\n`;
      text += `**Subtotals:** Income: ${formatCurrency(totalIncome)} | Expense: ${formatCurrency(totalExpense)}`;

      return result(
        {
          transactions,
          totalCount: transactions.length,
          totalIncome,
          totalExpense,
          filters,
        },
        text
      );
    }
  );
}
