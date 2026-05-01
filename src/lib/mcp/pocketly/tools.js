import { z } from 'zod';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/lib/apps/pocketly/service/service';
import {
  WIDGETS,
  READ_ONLY_ANNOTATIONS,
  MUTATION_ANNOTATIONS,
  DESTRUCTIVE_ANNOTATIONS,
} from './constants.js';
import {
  textResult,
  errorResult,
  toolMeta,
  widgetToolMeta,
  normalizeCategory,
  normalizeTransaction,
  normalizeBudget,
} from './utils.js';
import {
  buildAccountsPayload,
  buildTransactionsPayload,
  buildBudgetsPayload,
  buildSummaryPayload,
} from './payloads.js';

export function registerPocketlyTools(server) {
  server.registerTool(
    'get_accounts',
    {
      title: 'Get Accounts',
      description:
        "Retrieve a list of all Pocketly financial accounts along with their current balances. Essential for getting an overview of the user's available funds.",
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
      description:
        'Fetch all available income and expense categories from Pocketly. Use this to understand how transactions are classified before creating or updating them.',
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
      description:
        'Add a new income or expense category to Pocketly. Useful for organizing transactions into custom groups with specific icons and colors.',
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
      description:
        'Update the details (name, type, icon, or color) of an existing Pocketly category.',
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
      description:
        'Permanently remove a category from Pocketly. Note that this may affect how existing transactions are classified.',
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
        'Retrieve a list of recent financial transactions (income, expense, or transfer), with support for filtering by type and date range. Best for reviewing recent activity.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        type: z.enum(['income', 'expense', 'transfer']).optional().describe('Filter by type'),
        limit: z.number().int().min(1).max(100).optional().describe('Max results, default 20'),
        startDate: z
          .string()
          .optional()
          .describe('Optional period start date as an ISO date string'),
        endDate: z.string().optional().describe('Optional period end date as an ISO date string'),
        categoryId: z.string().optional().describe('MongoDB _id of the category to filter by'),
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
        'Generate a high-level financial overview for a specific period, including total income, total expenses, net cash flow, and top spending categories.',
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
        'Record a new financial transaction. Ensure you have the correct account and category IDs (use `get_accounts` and `get_categories` first) before calling this.',
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
      description: "Permanently delete a specific transaction record from Pocketly's history.",
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
        'Modify the details of an existing transaction, such as the amount, description, category, or date.',
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
      description:
        'Retrieve current budget definitions and track progress against spending limits for different categories.',
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
        'Set up a new spending limit (budget) for a specific category over a defined period (weekly, monthly, or yearly).',
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
      description: 'Adjust the amount or period of an existing budget.',
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
      description: 'Remove a budget definition from Pocketly.',
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
}
