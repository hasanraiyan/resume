import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  getAccounts,
  getCategories,
  getTransactions,
  deleteTransaction,
  updateTransaction,
} from '@/lib/apps/pocketly/service/service';
import { computeAnalysis } from '@/lib/finance-analysis';

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function validateDraftTransactionParams(params) {
  const errors = [];
  const sanitized = {
    type: params.type,
    amount: params.amount,
    description: params.description || '',
    accountId: params.accountId,
    accountName: params.accountName,
    categoryId: params.categoryId ?? null,
    categoryName: params.categoryName ?? null,
    toAccountId: params.toAccountId ?? null,
    toAccountName: params.toAccountName ?? null,
    date: params.date || new Date().toISOString().split('T')[0],
  };

  if (!['income', 'expense', 'transfer'].includes(sanitized.type)) {
    errors.push('type must be income, expense, or transfer');
  }

  if (
    typeof sanitized.amount !== 'number' ||
    !Number.isFinite(sanitized.amount) ||
    sanitized.amount <= 0
  ) {
    errors.push('amount must be a positive number');
  }

  if (!isValidObjectId(sanitized.accountId)) {
    errors.push('accountId must be a valid ObjectId resolved via get_accounts');
  }

  if (!params.accountResolvedViaTool) {
    errors.push('accountId must be resolved via get_accounts before drafting');
  }

  if (sanitized.type === 'transfer') {
    if (!isValidObjectId(sanitized.toAccountId)) {
      errors.push('toAccountId must be a valid ObjectId for transfers');
    }

    if (!params.toAccountResolvedViaTool) {
      errors.push('toAccountId must be resolved via get_accounts before drafting transfers');
    }

    if (sanitized.accountId === sanitized.toAccountId) {
      errors.push('source and destination accounts must be different for transfers');
    }

    sanitized.categoryId = null;
    sanitized.categoryName = null;
  } else {
    if (!isValidObjectId(sanitized.categoryId)) {
      errors.push('categoryId must be a valid ObjectId for income and expense');
    }

    if (!params.categoryResolvedViaTool) {
      errors.push('categoryId must be resolved via get_categories before drafting');
    }

    sanitized.toAccountId = null;
    sanitized.toAccountName = null;
  }

  if (sanitized.date && Number.isNaN(new Date(sanitized.date).getTime())) {
    errors.push('date must be a valid date string');
  }

  return {
    ok: errors.length === 0,
    errors,
    sanitized,
  };
}

function createPresentationSchema(description) {
  return z.enum(['text', 'card']).optional().describe(description);
}

export function createGetAccountsTool() {
  return tool(
    async () => {
      const accounts = await getAccounts({ includeBalances: true });
      return JSON.stringify(
        accounts.map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          balance: a.currentBalance || 0,
          initialBalance: a.initialBalance || 0,
          currency: a.currency || 'INR',
        }))
      );
    },
    {
      name: 'get_accounts',
      description:
        'Get all user accounts with their names, types, and balances. Use this when the user asks about their accounts, wallets, or where their money is stored. Prefer presentation="card" when the user says things like "show my balances", "display my accounts", "list my wallets", or asks for a visual snapshot. Prefer presentation="text" for normal conversational answers.',
      schema: z.object({
        presentation: createPresentationSchema(
          'Choose "card" for a visual account snapshot, or "text" for a normal text answer.'
        ),
        isGui: z
          .boolean()
          .optional()
          .describe(
            'Legacy fallback. Set true only when the user explicitly wants a visual account card.'
          ),
      }),
    }
  );
}

export function createGetCategoriesTool() {
  return tool(
    async () => {
      const categories = await getCategories();
      return JSON.stringify(
        categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
        }))
      );
    },
    {
      name: 'get_categories',
      description:
        'Get all income and expense categories. Use this when the user asks about their category setup or what categories they use. Prefer presentation="card" when the user asks to show, display, browse, or visually inspect categories. Prefer presentation="text" for normal conversational answers.',
      schema: z.object({
        presentation: createPresentationSchema(
          'Choose "card" for a visual category block, or "text" for a normal text answer.'
        ),
        isGui: z
          .boolean()
          .optional()
          .describe(
            'Legacy fallback. Set true only when the user explicitly wants a visual category card.'
          ),
      }),
    }
  );
}

export function createGetTransactionsTool() {
  return tool(
    async ({ type, limit, startDate, endDate, account, category }) => {
      const transactions = await getTransactions({
        type,
        limit: limit || 20,
        startDate,
        endDate,
        account,
        category,
      });
      return JSON.stringify(
        transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          category: t.category?.name || 'Uncategorized',
          account: t.account?.name || 'Unknown',
          toAccount: t.toAccount?.name,
          date: t.date,
        }))
      );
    },
    {
      name: 'get_transactions',
      description:
        'Get transactions with optional filtering. Filter by type (income, expense, transfer), date range, account, category, and limit. Use this when the user asks about spending in a category, transactions from a specific account, recent spending, or specific transactions. Prefer presentation="card" when the user says "show my last transactions", "list the last 5", "display recent expenses", "show transactions from [date]", "show Food expenses", or clearly wants a visual transaction list. Prefer presentation="text" for normal conversational answers.',
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
          .describe('Filter transactions from this date onwards (YYYY-MM-DD format)'),
        endDate: z
          .string()
          .optional()
          .describe('Filter transactions up to this date (YYYY-MM-DD format)'),
        account: z
          .string()
          .optional()
          .describe('Filter by account ID (must be resolved via get_accounts)'),
        category: z
          .string()
          .optional()
          .describe('Filter by category ID (must be resolved via get_categories)'),
        presentation: createPresentationSchema(
          'Choose "card" for a visual transaction list, or "text" for a normal text answer.'
        ),
        isGui: z
          .boolean()
          .optional()
          .describe(
            'Legacy fallback. Set true only when the user explicitly wants a visual transaction list.'
          ),
      }),
    }
  );
}

export function createGetAnalysisTool() {
  return tool(
    async () => {
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

      const result = {
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

      return JSON.stringify(result);
    },
    {
      name: 'get_analysis',
      description:
        'Get comprehensive financial analysis including total income, total expenses, net balance, top spending categories, and account activity. Use this when the user asks for a summary, overview, or analysis of their finances. Prefer presentation="card" when the user asks to show, display, visualize, or break down their finances. Prefer presentation="text" for normal conversational answers.',
      schema: z.object({
        presentation: createPresentationSchema(
          'Choose "card" for a visual finance summary, or "text" for a normal text answer.'
        ),
        isGui: z
          .boolean()
          .optional()
          .describe(
            'Legacy fallback. Set true only when the user explicitly wants a visual analysis card.'
          ),
      }),
    }
  );
}

export function createDraftTransactionTool() {
  return tool(
    async (params) => {
      const validation = validateDraftTransactionParams(params);

      if (!validation.ok) {
        throw new Error(
          `Cannot draft transaction until all required details are collected and resolved. ${validation.errors.join(
            '; '
          )}`
        );
      }

      // Return only the confirmed transaction payload for the UI confirmation card.
      return JSON.stringify(validation.sanitized);
    },
    {
      name: 'draft_transaction',
      description:
        'Draft a new transaction (income, expense, or transfer). Only use this after you have collected all required fields from the user. You must resolve accountId and toAccountId with get_accounts, and resolve categoryId with get_categories for income/expense. Never invent IDs, never guess ambiguous matches, and never pass placeholder or user-typed IDs directly. This will show a confirmation UI only for a complete draft.',
      schema: z.object({
        type: z.enum(['income', 'expense', 'transfer']).describe('The type of transaction'),
        amount: z
          .number()
          .describe(
            'The absolute amount of the transaction (must be a positive number greater than 0)'
          ),
        description: z.string().describe('A short description of the transaction'),
        accountId: z.string().describe('The exact MongoDB ID of the source account'),
        accountName: z
          .string()
          .describe('The display name of the source account (for UI purposes)'),
        categoryId: z
          .string()
          .nullish()
          .describe(
            'The exact MongoDB ID of the category (Required for income/expense, null for transfers)'
          ),
        categoryName: z
          .string()
          .nullish()
          .describe('The display name of the category (for UI purposes, null for transfers)'),
        toAccountId: z
          .string()
          .nullish()
          .describe(
            'The exact MongoDB ID of the destination account (Required ONLY for transfers, null for income/expense)'
          ),
        toAccountName: z
          .string()
          .nullish()
          .describe(
            'The display name of the destination account (for UI purposes, null for income/expense)'
          ),
        date: z
          .string()
          .nullish()
          .describe('The date of the transaction in YYYY-MM-DD format. Default is today.'),
        accountResolvedViaTool: z
          .boolean()
          .describe('Must be true only when accountId was resolved using get_accounts'),
        categoryResolvedViaTool: z
          .boolean()
          .nullish()
          .describe(
            'Must be true when categoryId was resolved using get_categories for income or expense'
          ),
        toAccountResolvedViaTool: z
          .boolean()
          .nullish()
          .describe('Must be true when toAccountId was resolved using get_accounts for transfers'),
      }),
    }
  );
}

export function createAskClarificationQuestionTool() {
  const mcqOptionSchema = z.object({
    id: z.string().describe('Stable machine-readable option id (e.g. "yes", "no", "weekly").'),
    label: z.string().describe('Human-readable label for the option.'),
    description: z.string().optional().describe('Optional short helper text for the option.'),
  });

  const groupQuestionSchema = z.object({
    id: z
      .string()
      .describe(
        'Stable identifier for this question within the group. Used in the answer payload.'
      ),
    question: z
      .string()
      .describe('The question to show the user, phrased in simple, direct language.'),
    options: z
      .array(mcqOptionSchema)
      .min(2)
      .max(8)
      .describe('2-8 clear options that cover the most likely answers.'),
    selectionMode: z
      .enum(['single', 'multiple'])
      .optional()
      .describe(
        'Use "single" for one choice, "multiple" when several choices make sense. Defaults to "single".'
      ),
    allowFreeText: z
      .boolean()
      .optional()
      .describe(
        'Whether the "Other" option should allow a free-text explanation. Defaults to true.'
      ),
  });

  const combinedSchema = z.object({
    question: z
      .string()
      .optional()
      .describe('The question to show the user. Required if not using a group of questions.'),
    options: z
      .array(mcqOptionSchema)
      .min(2)
      .max(8)
      .optional()
      .describe(
        '2-8 clear options that cover the most likely answers. Required if not using a group of questions.'
      ),
    selectionMode: z
      .enum(['single', 'multiple'])
      .optional()
      .describe(
        'Use "single" for one choice, "multiple" when several choices make sense. Defaults to "single".'
      ),
    questionId: z
      .string()
      .optional()
      .describe('Stable identifier for this question so you can recognize the answer later.'),
    allowFreeText: z
      .boolean()
      .optional()
      .describe(
        'Whether the "Other" option should allow a free-text explanation. Defaults to true.'
      ),
    groupId: z
      .string()
      .optional()
      .describe(
        'Stable identifier for this group of questions so you can recognize the grouped answer later.'
      ),
    questions: z
      .array(groupQuestionSchema)
      .min(1)
      .max(6)
      .optional()
      .describe('An ordered list of 1-6 short questions to ask as a mini-flow.'),
  });

  function normalizeOptions(rawOptions, allowFreeText) {
    const options = (rawOptions || []).map((opt) => ({
      id: String(opt.id),
      label: String(opt.label),
      description: opt.description ?? undefined,
    }));

    const hasOther = options.some((opt) => {
      if (opt.id === 'other') return true;
      const label = (opt.label || '').trim().toLowerCase();
      return label === 'other';
    });

    if (!hasOther) {
      options.push({
        id: 'other',
        label: 'Other',
        description:
          allowFreeText === false ? undefined : 'Share your own preference in a short sentence.',
      });
    }

    return options;
  }

  function normalizeSelectionMode(mode) {
    return mode === 'multiple' ? 'multiple' : 'single';
  }

  return tool(
    async (input) => {
      // The schema ensures we either have a single-question payload
      // or a group payload with a questions array.

      if (Array.isArray(input.questions) && input.questions.length > 0) {
        const allowGroupFreeTextDefault = true;

        const groupId = input.groupId || `mcq-group-${Date.now()}`;
        const questions = input.questions.map((q) => {
          const allowFreeText = q.allowFreeText !== false && allowGroupFreeTextDefault;
          return {
            id: q.id,
            question: q.question,
            selectionMode: normalizeSelectionMode(q.selectionMode),
            allowFreeText,
            options: normalizeOptions(q.options, allowFreeText),
          };
        });

        return {
          id: groupId,
          questions,
        };
      }

      const allowFreeText = input.allowFreeText !== false;

      return {
        id: input.questionId || `mcq-${Date.now()}`,
        question: input.question,
        selectionMode: normalizeSelectionMode(input.selectionMode),
        allowFreeText,
        options: normalizeOptions(input.options, allowFreeText),
      };
    },
    {
      name: 'ask_clarification_question',
      description:
        'MANDATORY for disambiguation: when you have a list of accounts or categories and need the user to pick one, you MUST call this tool instead of listing them in text. This renders a proper clickable MCQ card in the chat UI. Pass a question string and an options array (2-8 items). Each option needs id, label, and optionally description. An "Other" option is added automatically. NEVER list options in plain text when the user needs to choose — always use this tool. For account disambiguation: after get_accounts, pass matching accounts as options. For category disambiguation: after get_categories, pass matching categories as options. One question at a time for account+category flows.',
      schema: combinedSchema,
    }
  );
}

export function createDeleteTransactionTool() {
  return tool(
    async ({ transactionId }) => {
      const success = await deleteTransaction(transactionId);

      if (!success) {
        throw new Error(`Transaction with ID ${transactionId} not found or already deleted`);
      }

      return JSON.stringify({
        success: true,
        message: 'Transaction deleted successfully',
        transactionId,
      });
    },
    {
      name: 'delete_transaction',
      description:
        'Delete a transaction by its ID. Use this when the user explicitly asks to delete a specific transaction. Always confirm with the user before deleting. After deletion, inform the user that the transaction has been removed.',
      schema: z.object({
        transactionId: z.string().describe('The exact MongoDB ID of the transaction to delete'),
      }),
    }
  );
}

export function createUpdateTransactionTool() {
  return tool(
    async ({ transactionId, description, amount, date, categoryId, accountId }) => {
      const patch = {};
      if (description !== undefined) patch.description = description;
      if (amount !== undefined) patch.amount = amount;
      if (date !== undefined) patch.date = new Date(date);
      if (categoryId !== undefined) patch.category = categoryId;
      if (accountId !== undefined) patch.account = accountId;

      if (Object.keys(patch).length === 0) {
        throw new Error('No fields to update provided');
      }

      const updated = await updateTransaction(transactionId, patch);

      return JSON.stringify({
        success: true,
        message: 'Transaction updated successfully',
        transactionId,
        updated: {
          description: updated.description,
          amount: updated.amount,
          date: updated.date,
          category: updated.category?.name || 'Uncategorized',
          account: updated.account?.name || 'Unknown',
        },
      });
    },
    {
      name: 'update_transaction',
      description:
        'Update an existing transaction. You can modify description, amount, date, category, or account. Use this when the user wants to correct or change details of an existing transaction. Always confirm the changes with the user before updating.',
      schema: z.object({
        transactionId: z.string().describe('The exact MongoDB ID of the transaction to update'),
        description: z.string().optional().describe('New description for the transaction'),
        amount: z.number().optional().describe('New amount (must be positive)'),
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
    }
  );
}

export function createFinanceTools() {
  return [
    createGetAccountsTool(),
    createGetCategoriesTool(),
    createGetTransactionsTool(),
    createGetAnalysisTool(),
    createDraftTransactionTool(),
    createDeleteTransactionTool(),
    createUpdateTransactionTool(),
    createAskClarificationQuestionTool(),
  ];
}
