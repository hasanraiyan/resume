import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import * as service from '@/lib/apps/pocketly/service/service';
import { computeAnalysis } from '@/lib/finance-analysis';

// --- Helpers ---

function readAnnotations() {
  return { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
}

function writeAnnotations() {
  return {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  };
}

function deleteAnnotations() {
  return {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  };
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

  // ==================== ANALYSIS ====================

  registerAppTool(
    server,
    'get_analysis',
    {
      title: 'Get Analysis',
      description:
        'Comprehensive financial analysis for a given period. Returns total income, total ' +
        'expense, net balance, a breakdown of spending/income by category (with counts), ' +
        'daily cash flow data for trend visualization, and per-account activity summaries. ' +
        'Use this when the user asks for a deep-dive into their finances, spending patterns, ' +
        'or wants to understand where their money is going.',
      inputSchema: {
        startDate: z
          .string()
          .optional()
          .describe(
            'Start date in YYYY-MM-DD format. Filters the analysis to transactions from this ' +
              'date onwards. Omit for an all-time analysis.'
          ),
        endDate: z
          .string()
          .optional()
          .describe(
            'End date in YYYY-MM-DD format. Filters the analysis to transactions up to this ' +
              'date. Omit for an all-time analysis.'
          ),
      },
      outputSchema: {
        totalIncome: z.number(),
        totalExpense: z.number(),
        netBalance: z.number(),
        categoryBreakdown: z.array(z.any()),
        dailyFlow: z.array(z.any()),
        accountAnalysis: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { startDate, endDate } = args;

      const [transactions, categories, accounts] = await Promise.all([
        service.getTransactions(),
        service.getCategories(),
        service.getAccounts({ includeBalances: true }),
      ]);

      const analysis = computeAnalysis({ transactions, categories, accounts, startDate, endDate });

      // Build text output
      const periodLabel =
        startDate && endDate
          ? `from ${startDate} to ${endDate}`
          : 'all time';

      let text = `📈 **Financial Analysis (${periodLabel})**\n\n`;
      text += `**Summary**\n`;
      text += `  • Income: ${formatCurrency(analysis.totalIncome)}\n`;
      text += `  • Expense: ${formatCurrency(analysis.totalExpense)}\n`;
      text += `  • Net: ${formatCurrency(analysis.netBalance)}\n\n`;

      // Top categories
      const topExpense = analysis.categoryBreakdown
        .filter((c) => c.type === 'expense')
        .slice(0, 8);
      const topIncome = analysis.categoryBreakdown
        .filter((c) => c.type === 'income')
        .slice(0, 5);

      if (topExpense.length > 0) {
        text += `**Top Expense Categories**\n`;
        topExpense.forEach(
          (c) =>
            (text += `  • ${c.name}: ${formatCurrency(c.total)} (${c.count} txns)\n`)
        );
        text += '\n';
      }

      if (topIncome.length > 0) {
        text += `**Top Income Categories**\n`;
        topIncome.forEach(
          (c) =>
            (text += `  • ${c.name}: ${formatCurrency(c.total)} (${c.count} txns)\n`)
        );
        text += '\n';
      }

      // Daily flow summary
      const flowEntries = analysis.dailyFlow || [];
      const totalExpenseDays = flowEntries.filter((d) => d.type === 'expense').length;
      const totalIncomeDays = flowEntries.filter((d) => d.type === 'income').length;

      if (flowEntries.length > 0) {
        text += `**Daily Flow** — ${totalExpenseDays} expense day(s), ${totalIncomeDays} income day(s)\n`;
        // Show last 7 days as a mini summary
        const recent = flowEntries.slice(-7);
        recent.forEach(
          (d) =>
            (text += `  • ${d.date}: ${d.type === 'expense' ? '-' : '+'}${formatCurrency(d.total)}\n`)
        );
        text += '\n';
      }

      // Account activity
      const accountSummary = analysis.accountAnalysis || [];
      if (accountSummary.length > 0) {
        text += `**Account Activity**\n`;
        const byAccount = new Map();
        accountSummary.forEach((a) => {
          const existing = byAccount.get(a.accountId) || { name: a.name, expense: 0, income: 0 };
          if (a.type === 'expense') existing.expense += a.total;
          if (a.type === 'income') existing.income += a.total;
          byAccount.set(a.accountId, existing);
        });
        byAccount.forEach((acc) => {
          text += `  • ${acc.name}: expense ${formatCurrency(acc.expense)}, income ${formatCurrency(acc.income)}\n`;
        });
      }

      return result(
        {
          totalIncome: analysis.totalIncome,
          totalExpense: analysis.totalExpense,
          netBalance: analysis.netBalance,
          categoryBreakdown: analysis.categoryBreakdown,
          dailyFlow: analysis.dailyFlow,
          accountAnalysis: analysis.accountAnalysis,
        },
        text
      );
    }
  );

  // ==================== BUDGETS ====================

  registerAppTool(
    server,
    'get_budgets',
    {
      title: 'Get Budgets',
      description:
        'Lists all budget limits with their category, amount, and period type (weekly, monthly, ' +
        'yearly). This tool reports the budget TARGET amounts, not the actual spent amounts. ' +
        'To check actual spending against a budget, call get_transactions with the category ID ' +
        'and the date range from the budget\'s periodStart field. Use this tool when the user ' +
        'asks about their budget setup or spending limits.',
      inputSchema: {
        period: z
          .enum(['monthly', 'weekly', 'yearly'])
          .optional()
          .describe(
            'Filter budgets by their period type. Omit to return all budgets regardless of period.'
          ),
      },
      outputSchema: {
        budgets: z.array(z.any()),
        totalBudgeted: z.number(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const { period } = args;

      const budgets = await service.getBudgets();

      const now = new Date();
      const enrichedBudgets = budgets
        .filter((b) => !period || b.period === period)
        .map((budget) => {
          const periodStart = new Date(now);
          if (budget.period === 'monthly') {
            periodStart.setDate(1);
            periodStart.setHours(0, 0, 0, 0);
          } else if (budget.period === 'weekly') {
            const day = periodStart.getDay();
            const diff = periodStart.getDate() - day + (day === 0 ? -6 : 1);
            periodStart.setDate(diff);
            periodStart.setHours(0, 0, 0, 0);
          } else {
            periodStart.setMonth(0, 1);
            periodStart.setHours(0, 0, 0, 0);
          }

          return {
            ...budget,
            categoryName: budget.category?.name || 'Unknown Category',
            categoryIcon: budget.category?.icon || 'tag',
            categoryColor: budget.category?.color || '#1f644e',
            periodStart: periodStart.toISOString().split('T')[0],
            periodEnd: budget.period === 'monthly'
              ? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
              : budget.period === 'weekly'
                ? new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : `${now.getFullYear()}-12-31`,
          };
        });

      enrichedBudgets.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

      const totalBudgeted = enrichedBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);

      const budgetLines = enrichedBudgets
        .map((b) => {
          const periodLabel =
            b.period === 'monthly'
              ? `monthly (${b.periodStart} to ${b.periodEnd})`
              : b.period === 'weekly'
                ? `weekly (${b.periodStart} to ${b.periodEnd})`
                : `yearly (${b.periodStart} to ${b.periodEnd})`;
          return (
            `  • **${b.categoryName}**: ${formatCurrency(b.amount)} ${periodLabel}` +
            ` | category: \`${b.category?._id || b.category?.id || b.category}\`` +
            ` | id: \`${b.id}\``
          );
        })
        .join('\n');

      let text = `**Budgets (${enrichedBudgets.length})**\n\n`;
      text += `${budgetLines || '  _(no budgets set)_'}\n\n`;
      text += `**Total Budgeted:** ${formatCurrency(totalBudgeted)}\n\n`;
      text += `_To check actual spending against a budget, call get_transactions with the budget's `;
      text += `category ID and its startDate/endDate range._`;

      return result(
        {
          budgets: enrichedBudgets,
          totalBudgeted,
        },
        text
      );
    }
  );

  // ==================== MANAGE TRANSACTIONS ====================

  registerAppTool(
    server,
    'manage_transactions',
    {
      title: 'Manage Transactions',
      description:
        'All-in-one tool to create, update, or delete transactions. Use `action` to pick ' +
        'the operation.\n' +
        '\n' +
        'action="create": creates a new transaction. Requires type, amount, accountId, ' +
        'and categoryId (for income/expense) or toAccountId (for transfers). ' +
        'Use get_accounts and get_categories to resolve IDs first.\n' +
        '\n' +
        'action="update": updates an existing transaction. Requires transactionId. ' +
        'Pass only the fields you want to change. Use confirmed=true to execute; ' +
        'start with confirmed=false to review changes.\n' +
        '\n' +
        'action="delete": soft-deletes a transaction. Requires transactionId and confirmed=true. ' +
        'Start with confirmed=false to confirm with the user ex&#39;plicitly before deleting. ' +
        'This cannot be undone.',
      inputSchema: {
        action: z
          .enum(['create', 'update', 'delete'])
          .describe(
            'Which operation to perform. "create" for new transactions, "update" to change ' +
              'an existing one, "delete" to remove one.'
          ),

        // Create fields
        type: z
          .enum(['income', 'expense', 'transfer'])
          .optional()
          .describe('Transaction type. Required for create.'),
        amount: z
          .number()
          .positive()
          .optional()
          .describe('Transaction amount in INR. Must be a positive number. Required for create.'),
        description: z
          .string()
          .optional()
          .describe('Short description or payee name for the transaction.'),
        accountId: z
          .string()
          .optional()
          .describe(
            'Source account MongoDB ID. Must be resolved from get_accounts first. Required for create.'
          ),
        categoryId: z
          .string()
          .nullable()
          .optional()
          .describe(
            'Category MongoDB ID. Required for income/expense (non-transfer). ' +
              'Must be resolved from get_categories first. Set to null for transfers.'
          ),
        toAccountId: z
          .string()
          .nullable()
          .optional()
          .describe(
            'Destination account MongoDB ID. Required only for transfers. ' +
              'Must be resolved from get_accounts first. Set to null for income/expense.'
          ),
        date: z
          .string()
          .optional()
          .describe(
            'Transaction date in YYYY-MM-DD format. Defaults to today if not provided on create.'
          ),
        note: z
          .string()
          .optional()
          .describe('Optional private note for the transaction.'),

        // Update / Delete fields
        transactionId: z
          .string()
          .optional()
          .describe(
            'MongoDB ID of the transaction to update or delete. Required for update and delete actions.'
          ),
        confirmed: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'Must be set to true to execute update or delete operations. ' +
              'Start with false (or omit) to get a preview of what will change. ' +
              'Always confirm with the user ex&#39;plicitly before setting to true.'
          ),
      },
      outputSchema: {
        success: z.boolean().optional(),
        transaction: z.any().optional(),
        requiresConfirmation: z.boolean().optional(),
        preview: z.any().optional(),
        error: z.string().optional(),
      },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const {
        action,
        type,
        amount,
        description,
        accountId,
        categoryId,
        toAccountId,
        date,
        note,
        transactionId,
        confirmed,
      } = args;

      if (action === 'create') {
        // Validate required fields
        if (!type) throw new Error('type is required for create');
        if (!amount) throw new Error('amount is required for create');
        if (!accountId) throw new Error('accountId is required for create');

        if (type === 'transfer') {
          if (!toAccountId) throw new Error('toAccountId is required for transfers');
        } else {
          if (!categoryId) throw new Error('categoryId is required for income/expense');
        }

        const payload = {
          type,
          amount,
          description: description || '',
          account: accountId,
          category: type === 'transfer' ? null : categoryId,
          toAccount: type === 'transfer' ? toAccountId : null,
          date: date || new Date().toISOString().split('T')[0],
          note: note || '',
        };

        const transaction = await service.createTransaction(payload);

        return result(
          { success: true, transaction },
          `✅ Created ${transaction.type}: ${formatCurrency(transaction.amount)} ` +
            `— ${transaction.description || '(no description)'} ` +
            `(id: \`${transaction.id}\`)`
        );
      }

      if (action === 'update') {
        if (!transactionId) throw new Error('transactionId is required for update');

        // Build patch from provided fields
        const patch = {};
        if (description !== undefined) patch.description = description;
        if (amount !== undefined) patch.amount = amount;
        if (date !== undefined) patch.date = new Date(date);
        if (categoryId !== undefined) patch.category = categoryId;
        if (accountId !== undefined) patch.account = accountId;
        if (note !== undefined) patch.note = note;

        if (Object.keys(patch).length === 0) {
          throw new Error('No fields to update provided');
        }

        if (!confirmed) {
          return result(
            {
              requiresConfirmation: true,
              preview: {
                action: 'update_transaction',
                transactionId,
                changes: patch,
              },
            },
            `**Update Preview** — transaction \`${transactionId}\`\n\n` +
              `Proposed changes:\n` +
              Object.entries(patch)
                .map(
                  ([key, val]) =>
                    `  • **${key}**: ${val instanceof Date ? val.toISOString().split('T')[0] : typeof val === 'number' ? formatCurrency(val) : val}`
                )
                .join('\n') +
              `\n\n_Call again with confirmed=true to apply these changes._`
          );
        }

        const updated = await service.updateTransaction(transactionId, patch);

        return result(
          { success: true, transaction: updated },
          `✅ Updated transaction \`${transactionId}\`: ` +
            `${updated.description || '(no description)'} — ${formatCurrency(updated.amount)}`
        );
      }

      if (action === 'delete') {
        if (!transactionId) throw new Error('transactionId is required for delete');

        if (!confirmed) {
          return result(
            {
              requiresConfirmation: true,
              preview: {
                action: 'delete_transaction',
                transactionId,
              },
            },
            `⚠️ **Confirm deletion** of transaction \`${transactionId}\`\n\n` +
              `This action cannot be undone. Call again with confirmed=true to proceed.`
          );
        }

        const success = await service.deleteTransaction(transactionId);

        return result(
          { success },
          success
            ? `✅ Deleted transaction \`${transactionId}\``
            : `❌ Transaction \`${transactionId}\` not found or already deleted`
        );
      }

      throw new Error(`Unknown action: ${action}`);
    }
  );
}
