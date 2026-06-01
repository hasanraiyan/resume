import { z } from 'zod';
import mongoose from 'mongoose';
import {
  getAccounts,
  getCategories,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  createTransaction,
  getBudgets,
  createBudget,
  deleteBudget,
  createCategory,
  deleteCategory,
} from '@/lib/apps/pocketly/service/service';
import { computeAnalysis } from '@/lib/finance-analysis';

// ── Helpers ──────────────────────────────────────────────────────────

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

// ── Read tools ───────────────────────────────────────────────────────

export function createGetAccountsMcpTool() {
  return {
    name: 'get_accounts',
    title: 'Get Accounts',
    description:
      'Get all user financial accounts with names, types, and current balances. Use when the user asks about their accounts, wallets, or where their money is stored. Always call this to resolve account IDs before drafting transactions.',
    schema: z.object({}),
    annotations: {
      title: 'Get Accounts',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke() {
      const accounts = await getAccounts({ includeBalances: true });
      return accounts.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        balance: a.currentBalance || 0,
        initialBalance: a.initialBalance || 0,
        currency: a.currency || 'INR',
      }));
    },
  };
}

export function createGetCategoriesMcpTool() {
  return {
    name: 'get_categories',
    title: 'Get Categories',
    description:
      'Get all income and expense categories. Use when the user asks about their category setup. Always call this to resolve category IDs before drafting income/expense transactions.',
    schema: z.object({}),
    annotations: {
      title: 'Get Categories',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke() {
      const categories = await getCategories();
      return categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
      }));
    },
  };
}

export function createGetTransactionsMcpTool() {
  return {
    name: 'get_transactions',
    title: 'Get Transactions',
    description:
      'Get transactions with optional filtering. Filter by type (income, expense, transfer), date range (YYYY-MM-DD), account ID, category ID, and limit. Use when the user asks about spending, recent transactions, or specific transactions. Account and category IDs must be resolved via get_accounts/get_categories first.',
    schema: z.object({
      type: z
        .enum(['income', 'expense', 'transfer'])
        .optional()
        .describe('Filter by transaction type'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of transactions to return (default 20)'),
      startDate: z
        .string()
        .optional()
        .describe('Filter transactions from this date onwards (YYYY-MM-DD)'),
      endDate: z.string().optional().describe('Filter transactions up to this date (YYYY-MM-DD)'),
      account: z
        .string()
        .optional()
        .describe('Filter by account ID (must be resolved via get_accounts)'),
      category: z
        .string()
        .optional()
        .describe('Filter by category ID (must be resolved via get_categories)'),
    }),
    annotations: {
      title: 'Get Transactions',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ type, limit, startDate, endDate, account, category }) {
      const transactions = await getTransactions({
        type,
        limit: limit || 20,
        startDate,
        endDate,
        account,
        category,
      });
      return transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category?.name || 'Uncategorized',
        categoryId: t.category?.id || null,
        account: t.account?.name || 'Unknown',
        accountId: t.account?.id || null,
        toAccount: t.toAccount?.name || null,
        toAccountId: t.toAccount?.id || null,
        date: t.date,
      }));
    },
  };
}

export function createGetAnalysisMcpTool() {
  return {
    name: 'get_analysis',
    title: 'Get Financial Analysis',
    description:
      'Get comprehensive financial analysis: total income/expenses, net balance, top spending categories, account activity, and daily expense flow. Use when the user asks for a summary, overview, or analysis of their finances.',
    schema: z.object({}),
    annotations: {
      title: 'Get Financial Analysis',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke() {
      const [transactions, categories, accounts] = await Promise.all([
        getTransactions(),
        getCategories(),
        getAccounts({ includeBalances: true }),
      ]);
      const analysis = computeAnalysis({ transactions, categories, accounts });

      const totalAccountBalance = accounts.reduce(
        (sum, account) => (!account.ignored ? sum + (account.currentBalance || 0) : sum),
        0
      );
      const accountActivityById = new Map();

      for (const item of analysis.accountAnalysis) {
        const existing = accountActivityById.get(item.accountId) || {
          name: item.name,
          expense: 0,
          income: 0,
          balance: accounts.find((account) => account.id === item.accountId)?.currentBalance || 0,
        };

        existing[item.type] = item.total;
        accountActivityById.set(item.accountId, existing);
      }

      return {
        totalExpense: analysis.totalExpense,
        totalIncome: analysis.totalIncome,
        netFlow: analysis.netBalance,
        totalAccountBalance,
        topExpenseCategories: analysis.categoryBreakdown
          .filter((c) => c.type === 'expense')
          .slice(0, 10)
          .map((c) => ({ name: c.name, total: c.total, count: c.count })),
        topIncomeCategories: analysis.categoryBreakdown
          .filter((c) => c.type === 'income')
          .slice(0, 5)
          .map((c) => ({ name: c.name, total: c.total, count: c.count })),
        accountActivity: Array.from(accountActivityById.values()),
        dailyExpenseFlow: analysis.dailyFlow
          .filter((d) => d.type === 'expense')
          .slice(-14)
          .map((d) => ({ date: d.date, total: d.total })),
        accounts: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          balance: account.currentBalance || 0,
          initialBalance: account.initialBalance || 0,
          currency: account.currency || 'INR',
        })),
      };
    },
  };
}

// ── Write tools ──────────────────────────────────────────────────────

export function createDraftTransactionMcpTool() {
  return {
    name: 'create_transaction',
    title: 'Create Transaction',
    description:
      'Create a new transaction (income, expense, or transfer). You MUST resolve accountId via get_accounts and categoryId via get_categories BEFORE calling this tool. Never invent IDs. For transfers, provide toAccountId instead of categoryId. All amounts are in INR and must be positive.',
    schema: z.object({
      type: z.enum(['income', 'expense', 'transfer']).describe('The type of transaction'),
      amount: z.number().describe('The amount in INR (must be a positive number greater than 0)'),
      description: z.string().describe('A short description of the transaction'),
      accountId: z
        .string()
        .describe('The exact MongoDB ID of the source account (resolved via get_accounts)'),
      categoryId: z
        .string()
        .nullish()
        .describe(
          'The exact MongoDB ID of the category (resolved via get_categories). Required for income/expense, null for transfers.'
        ),
      toAccountId: z
        .string()
        .nullish()
        .describe(
          'The exact MongoDB ID of the destination account (resolved via get_accounts). Required for transfers, null for income/expense.'
        ),
      date: z
        .string()
        .nullish()
        .describe('The date of the transaction in YYYY-MM-DD format. Default is today.'),
    }),
    annotations: {
      title: 'Create Transaction',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async invoke({ type, amount, description, accountId, categoryId, toAccountId, date }) {
      // Validate required fields
      const errors = [];

      if (!['income', 'expense', 'transfer'].includes(type)) {
        errors.push('type must be income, expense, or transfer');
      }

      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        errors.push('amount must be a positive number');
      }

      if (!isValidObjectId(accountId)) {
        errors.push('accountId must be a valid ObjectId resolved via get_accounts');
      }

      if (type === 'transfer') {
        if (!isValidObjectId(toAccountId)) {
          errors.push(
            'toAccountId must be a valid ObjectId for transfers (resolve via get_accounts)'
          );
        }
        if (accountId === toAccountId) {
          errors.push('source and destination accounts must be different for transfers');
        }
      } else {
        if (!isValidObjectId(categoryId)) {
          errors.push(
            'categoryId must be a valid ObjectId for income/expense (resolve via get_categories)'
          );
        }
      }

      if (date && Number.isNaN(new Date(date).getTime())) {
        errors.push('date must be a valid date string (YYYY-MM-DD)');
      }

      if (errors.length > 0) {
        throw new Error(`Invalid transaction: ${errors.join('; ')}`);
      }

      // Build the payload
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

      const result = await createTransaction(payload);

      return {
        success: true,
        message: 'Transaction created successfully',
        transaction: {
          id: result.id,
          type: result.type,
          amount: result.amount,
          description: result.description,
          category: result.category?.name || null,
          account: result.account?.name || 'Unknown',
          toAccount: result.toAccount?.name || null,
          date: result.date,
        },
      };
    },
  };
}

export function createDeleteTransactionMcpTool() {
  return {
    name: 'delete_transaction',
    title: 'Delete Transaction',
    description:
      'Delete a transaction by its MongoDB ID. The transaction is soft-deleted (can be recovered). Use get_transactions first to find the transaction ID.',
    schema: z.object({
      transactionId: z.string().describe('The exact MongoDB ID of the transaction to delete'),
    }),
    annotations: {
      title: 'Delete Transaction',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ transactionId }) {
      if (!isValidObjectId(transactionId)) {
        throw new Error('transactionId must be a valid MongoDB ObjectId');
      }

      const success = await deleteTransaction(transactionId);

      if (!success) {
        throw new Error(`Transaction ${transactionId} not found or already deleted`);
      }

      return {
        success: true,
        message: 'Transaction deleted successfully',
        transactionId,
      };
    },
  };
}

export function createUpdateTransactionMcpTool() {
  return {
    name: 'update_transaction',
    title: 'Update Transaction',
    description:
      'Update an existing transaction. Provide the transaction ID and only the fields you want to change. At least one field must be provided. Use get_transactions to find the transaction ID, and get_accounts/get_categories to resolve new account/category IDs.',
    schema: z.object({
      transactionId: z.string().describe('The exact MongoDB ID of the transaction to update'),
      description: z.string().optional().describe('New description for the transaction'),
      amount: z.number().optional().describe('New amount in INR (must be positive)'),
      date: z.string().optional().describe('New date in YYYY-MM-DD format'),
      categoryId: z
        .string()
        .optional()
        .describe('New category ID (must be resolved via get_categories)'),
      accountId: z
        .string()
        .optional()
        .describe('New account ID (must be resolved via get_accounts)'),
    }),
    annotations: {
      title: 'Update Transaction',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ transactionId, description, amount, date, categoryId, accountId }) {
      if (!isValidObjectId(transactionId)) {
        throw new Error('transactionId must be a valid MongoDB ObjectId');
      }

      const patch = {};
      if (description !== undefined) patch.description = description;
      if (amount !== undefined) patch.amount = amount;
      if (date !== undefined) patch.date = new Date(date);
      if (categoryId !== undefined) patch.category = categoryId;
      if (accountId !== undefined) patch.account = accountId;

      if (Object.keys(patch).length === 0) {
        throw new Error('No fields to update provided. Supply at least one field to change.');
      }

      const updated = await updateTransaction(transactionId, patch);

      return {
        success: true,
        message: 'Transaction updated successfully',
        transaction: {
          id: updated.id,
          type: updated.type,
          amount: updated.amount,
          description: updated.description,
          category: updated.category?.name || 'Uncategorized',
          account: updated.account?.name || 'Unknown',
          date: updated.date,
        },
      };
    },
  };
}

export function createGetBudgetsMcpTool() {
  return {
    name: 'get_budgets',
    title: 'Get Budgets',
    description: 'Get all user budgets with their category details, periods, and target amounts.',
    schema: z.object({}),
    annotations: {
      title: 'Get Budgets',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke() {
      const budgets = await getBudgets();
      return budgets.map((b) => ({
        id: b.id,
        categoryId: b.category?.id || null,
        categoryName: b.category?.name || 'Uncategorized',
        amount: b.amount,
        period: b.period,
      }));
    },
  };
}

export function createCreateBudgetMcpTool() {
  return {
    name: 'create_budget',
    title: 'Create Budget',
    description:
      'Create a new financial budget for an expense category. You MUST resolve categoryId via get_categories first.',
    schema: z.object({
      categoryId: z
        .string()
        .describe('The exact MongoDB ID of the category (resolved via get_categories)'),
      amount: z.number().describe('The budget amount in INR (must be positive)'),
      period: z
        .enum(['monthly', 'weekly', 'yearly'])
        .optional()
        .default('monthly')
        .describe('The period of the budget (monthly, weekly, or yearly)'),
    }),
    annotations: {
      title: 'Create Budget',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
      invokingMessage: 'Creating budget...',
      successMessage: 'Budget created successfully!',
    },
    async invoke({ categoryId, amount, period = 'monthly' }) {
      if (!isValidObjectId(categoryId)) {
        throw new Error('categoryId must be a valid MongoDB ObjectId');
      }
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('amount must be a positive number');
      }

      const result = await createBudget({
        category: categoryId,
        amount,
        period,
      });

      return {
        success: true,
        message: 'Budget created successfully',
        budget: {
          id: result.id,
          category: result.category?.name || 'Unknown',
          amount: result.amount,
          period: result.period,
        },
      };
    },
  };
}

export function createDeleteBudgetMcpTool() {
  return {
    name: 'delete_budget',
    title: 'Delete Budget',
    description: 'Delete a budget by its ID. The budget is soft-deleted.',
    schema: z.object({
      budgetId: z.string().describe('The exact MongoDB ID of the budget to delete'),
    }),
    annotations: {
      title: 'Delete Budget',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ budgetId }) {
      if (!isValidObjectId(budgetId)) {
        throw new Error('budgetId must be a valid MongoDB ObjectId');
      }

      const success = await deleteBudget(budgetId);
      if (!success) {
        throw new Error(`Budget ${budgetId} not found or already deleted`);
      }

      return {
        success: true,
        message: 'Budget deleted successfully',
        budgetId,
      };
    },
  };
}

export function createCreateCategoryMcpTool() {
  return {
    name: 'create_category',
    title: 'Create Category',
    description: 'Create a new budget category for expenses or incomes.',
    schema: z.object({
      name: z.string().describe('Name of the category (e.g. "Travel")'),
      type: z.enum(['income', 'expense']).describe('Category type (income or expense)'),
      icon: z.string().optional().describe('Icon name from Lucide/FontAwesome'),
      color: z.string().optional().describe('Hex color code (e.g. #FF5733)'),
    }),
    annotations: {
      title: 'Create Category',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async invoke({ name, type, icon, color }) {
      if (!name?.trim()) {
        throw new Error('Category name is required');
      }

      const result = await createCategory({
        name,
        type,
        icon: icon || 'dollar-sign',
        color: color || '#000000',
      });

      return {
        success: true,
        message: 'Category created successfully',
        category: {
          id: result.id,
          name: result.name,
          type: result.type,
          icon: result.icon,
          color: result.color,
        },
      };
    },
  };
}

export function createDeleteCategoryMcpTool() {
  return {
    name: 'delete_category',
    title: 'Delete Category',
    description: 'Delete a category by its ID. The category is soft-deleted.',
    schema: z.object({
      categoryId: z.string().describe('The exact MongoDB ID of the category to delete'),
    }),
    annotations: {
      title: 'Delete Category',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ categoryId }) {
      if (!isValidObjectId(categoryId)) {
        throw new Error('categoryId must be a valid MongoDB ObjectId');
      }

      const success = await deleteCategory(categoryId);
      if (!success) {
        throw new Error(`Category ${categoryId} not found or already deleted`);
      }

      return {
        success: true,
        message: 'Category deleted successfully',
        categoryId,
      };
    },
  };
}

// ── Export all tools ──────────────────────────────────────────────────

export function createPocketlyReadTools() {
  return [
    createGetAccountsMcpTool(),
    createGetCategoriesMcpTool(),
    createGetTransactionsMcpTool(),
    createGetAnalysisMcpTool(),
    createGetBudgetsMcpTool(),
  ];
}

export function createPocketlyWriteTools() {
  return [
    createDraftTransactionMcpTool(),
    createDeleteTransactionMcpTool(),
    createUpdateTransactionMcpTool(),
    createCreateBudgetMcpTool(),
    createDeleteBudgetMcpTool(),
    createCreateCategoryMcpTool(),
    createDeleteCategoryMcpTool(),
  ];
}

export function createAllPocketlyMcpTools({ scopes = [] } = {}) {
  const tools = [];
  const scopeSet = new Set(scopes);

  if (scopeSet.has('pocketly:read') || scopeSet.has('pocketly:write')) {
    tools.push(...createPocketlyReadTools());
  }

  if (scopeSet.has('pocketly:write')) {
    tools.push(...createPocketlyWriteTools());
  }

  return tools;
}
