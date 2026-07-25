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

// --- Tool Registration ---

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
        .map(
          (acc) =>
            `  • ${acc.name}: ₹${(Number(acc.currentBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        )
        .join('\n');

      const recentLines = transactions
        .map(
          (tx) =>
            `  • ${tx.date?.split('T')[0] || '?'} | ${tx.description || '(no description)'} | ${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}₹${(Number(tx.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | ${tx.type}`
        )
        .join('\n');

      const periodLabel = startDate && endDate ? `from ${startDate} to ${endDate}` : 'all time';

      let text = `📊 **Financial Overview (${periodLabel})**\n\n`;
      text += `**Accounts:**\n${accountLines}\n\n`;
      text += `**Total Balance:** ₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      text += `**Total Income:** ₹${(summary.totalIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      text += `**Total Expense:** ₹${(summary.totalExpense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
      text += `**Net Income:** ₹${(summary.netIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;

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
}
