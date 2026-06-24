import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  createAccount,
  createCategory,
  createPocketlyBudget,
  createPocketlyTransaction,
  deleteAccount,
  deleteBudget,
  deleteCategory,
  deleteTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  getDefaultPeriod,
  getPocketlyAnalysis,
  getPocketlyBootstrap,
  listPocketlyTransactions,
  searchPocketlyTransactions,
  updateAccount,
  updateCategory,
  updatePocketlyBudget,
  updatePocketlyTransaction,
} from './data';

export const POCKETLY_WIDGET_URI = 'ui://pocketly/dashboard-v4.html';
const WIDGET_UI_META = {
  ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } },
};

// Plain `.optional()` only permits omitting the field - it doesn't permit "".
// LLMs frequently send "" instead of omitting an optional argument, so drop
// the min-length requirement here; every caller already treats an empty/falsy
// value as "not provided" (e.g. `args.startDate || getDefaultPeriod()...`,
// `assertCategoryId`'s `if (!id) return`).
const optionalString = z.string().optional();
const optionalNullableString = z.string().nullable().optional();
const transactionType = z.enum(['income', 'expense', 'transfer']);
const categoryType = z.enum(['income', 'expense']);
const budgetPeriod = z.enum(['monthly', 'weekly', 'yearly']);

const listTransactionSchema = {
  startDate: optionalString.describe('Inclusive ISO date/time lower bound.'),
  endDate: optionalString.describe('Inclusive ISO date/time upper bound.'),
  account: optionalString.describe('Account id returned by Pocketly list/bootstrap tools.'),
  category: optionalString.describe('Category id returned by Pocketly list/bootstrap tools.'),
  type: transactionType.optional(),
  limit: z.number().int().positive().max(200).optional(),
};

const accountCreateSchema = {
  name: z.string().min(1),
  icon: z.string().min(1).default('wallet'),
  initialBalance: z.number().default(0),
  currency: z.string().min(1).default('INR'),
  ignored: z.boolean().optional(),
};

const accountUpdateSchema = {
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  initialBalance: z.number().optional(),
  currency: z.string().min(1).optional(),
  ignored: z.boolean().optional(),
};

const categoryCreateSchema = {
  name: z.string().min(1),
  type: categoryType,
  icon: z.string().min(1).default('tag'),
  color: z.string().min(1).default('#1f644e'),
  ignored: z.boolean().optional(),
};

const categoryUpdateSchema = {
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  type: categoryType.optional(),
  icon: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  ignored: z.boolean().optional(),
};

const transactionCreateSchema = {
  type: transactionType,
  amount: z.number().positive(),
  description: z.string().optional(),
  category: optionalNullableString,
  account: z.string().min(1),
  toAccount: optionalNullableString,
  date: optionalString,
  note: z.string().optional(),
};

const transactionUpdateSchema = {
  id: z.string().min(1),
  type: transactionType.optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  category: optionalNullableString,
  account: optionalString,
  toAccount: optionalNullableString,
  date: optionalString,
  note: z.string().optional(),
};

const budgetCreateSchema = {
  category: z.string().min(1),
  amount: z.number().positive(),
  period: budgetPeriod.default('monthly'),
};

const budgetUpdateSchema = {
  id: z.string().min(1),
  category: optionalString,
  amount: z.number().positive().optional(),
  period: budgetPeriod.optional(),
};

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

function toolMeta({ resourceUri } = {}) {
  return { ui: { visibility: ['model', 'app'], ...(resourceUri ? { resourceUri } : {}) } };
}

function result(structuredContent, text, meta = {}) {
  return {
    structuredContent,
    content: [{ type: 'text', text }],
    _meta: { data: structuredContent, ...meta },
  };
}

function idPayload(args) {
  return { id: args.id };
}

function stripId(args) {
  const { id, ...patch } = args;
  return patch;
}

async function getWidgetHtml() {
  const widgetPath = path.join(process.cwd(), 'public', 'mcp-widgets', 'pocketly', 'index.html');

  try {
    return await readFile(widgetPath, 'utf8');
  } catch {
    return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Pocketly</title></head>
  <body style="font-family: system-ui, sans-serif; margin: 24px;">
    <h1>Pocketly widget is not built</h1>
    <p>Run <code>pnpm build:mcp-widgets</code> and refresh the MCP app.</p>
  </body>
</html>`;
  }
}

export function registerPocketlyMcp(server) {
  registerAppResource(
    server,
    'pocketly-dashboard',
    POCKETLY_WIDGET_URI,
    {
      title: 'Dashboard',
      description: 'Interactive Pocketly finance dashboard widget.',
      _meta: WIDGET_UI_META,
    },
    async () => ({
      contents: [
        {
          uri: POCKETLY_WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await getWidgetHtml(),
          _meta: WIDGET_UI_META,
        },
      ],
    })
  );

  registerAppTool(
    server,
    'open_dashboard',
    {
      title: 'Open Dashboard',
      description:
        'Use this when the user wants to view or manage Pocketly finance data in an interactive dashboard.',
      inputSchema: {
        startDate: optionalString,
        endDate: optionalString,
        activeTab: z.enum(['accounts', 'records', 'analysis', 'planning']).default('accounts'),
      },
      outputSchema: {
        startDate: z.string(),
        endDate: z.string(),
        activeTab: z.string(),
        accounts: z.array(z.any()),
        categories: z.array(z.any()),
        budgets: z.array(z.any()),
        transactions: z.array(z.any()),
        stats: z.any(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta({ resourceUri: POCKETLY_WIDGET_URI }),
    },
    async (args = {}) => {
      const period = {
        startDate: args.startDate || getDefaultPeriod().startDate,
        endDate: args.endDate || getDefaultPeriod().endDate,
      };
      const bootstrap = await getPocketlyBootstrap(period);
      return result(
        { ...bootstrap, activeTab: args.activeTab || 'accounts' },
        `Opened Pocketly with ${bootstrap.transactions.length} transactions for the selected period.`
      );
    }
  );

  registerAppTool(
    server,
    'bootstrap',
    {
      title: 'Load Data',
      description:
        'Use this when the user or widget needs the Pocketly dashboard data in one call.',
      inputSchema: {
        startDate: optionalString,
        endDate: optionalString,
      },
      outputSchema: {
        startDate: z.string(),
        endDate: z.string(),
        accounts: z.array(z.any()),
        categories: z.array(z.any()),
        budgets: z.array(z.any()),
        transactions: z.array(z.any()),
        stats: z.any(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args = {}) => {
      const bootstrap = await getPocketlyBootstrap(args);
      return result(
        bootstrap,
        `Loaded ${bootstrap.accounts.length} accounts, ${bootstrap.categories.length} categories, and ${bootstrap.transactions.length} transactions.`
      );
    }
  );

  registerAppTool(
    server,
    'list_accounts',
    {
      title: 'List Accounts',
      description: 'Use this when the user needs Pocketly accounts and computed balances.',
      inputSchema: {},
      outputSchema: {
        accounts: z.array(z.any()),
        totalAccountBalance: z.number(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async () => {
      const accounts = await getAccounts({ includeBalances: true });
      const totalAccountBalance = accounts.reduce(
        (sum, account) =>
          account.ignored ? sum : sum + (account.currentBalance ?? account.balance ?? 0),
        0
      );
      return result({ accounts, totalAccountBalance }, `Loaded ${accounts.length} accounts.`);
    }
  );

  registerAppTool(
    server,
    'list_categories',
    {
      title: 'List Categories',
      description: 'Use this when the user needs Pocketly income or expense categories.',
      inputSchema: {
        type: categoryType.optional(),
      },
      outputSchema: {
        categories: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args = {}) => {
      const categories = await getCategories();
      const filtered = args.type
        ? categories.filter((category) => category.type === args.type)
        : categories;
      return result({ categories: filtered }, `Loaded ${filtered.length} categories.`);
    }
  );

  registerAppTool(
    server,
    'list_budgets',
    {
      title: 'List Budgets',
      description: 'Use this when the user needs active Pocketly budgets.',
      inputSchema: {},
      outputSchema: {
        budgets: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async () => {
      const budgets = await getBudgets();
      return result({ budgets }, `Loaded ${budgets.length} budgets.`);
    }
  );

  registerAppTool(
    server,
    'list_transactions',
    {
      title: 'List Transactions',
      description: 'Use this when the user needs recent or filtered Pocketly transactions.',
      inputSchema: listTransactionSchema,
      outputSchema: {
        transactions: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args = {}) => {
      const transactions = await listPocketlyTransactions(args);
      return result({ transactions }, `Loaded ${transactions.length} transactions.`);
    }
  );

  registerAppTool(
    server,
    'search_transactions',
    {
      title: 'Search Transactions',
      description:
        'Use this when the user wants to find transactions by description, note, category, account, or type.',
      inputSchema: {
        ...listTransactionSchema,
        query: z.string().optional(),
      },
      outputSchema: {
        transactions: z.array(z.any()),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args = {}) => {
      const transactions = await searchPocketlyTransactions(args);
      return result({ transactions }, `Found ${transactions.length} matching transactions.`);
    }
  );

  registerAppTool(
    server,
    'get_analysis',
    {
      title: 'Get Analysis',
      description:
        'Use this when the user needs Pocketly income, expense, flow, or account analysis.',
      inputSchema: {
        startDate: optionalString,
        endDate: optionalString,
      },
      outputSchema: {
        analysis: z.any(),
      },
      annotations: readAnnotations(),
      _meta: toolMeta(),
    },
    async (args = {}) => {
      const analysis = await getPocketlyAnalysis(args);
      return result(
        { analysis },
        `Loaded analysis with net flow ${analysis.netFlow} and total balance ${analysis.totalAccountBalance}.`
      );
    }
  );

  registerAppTool(
    server,
    'create_account',
    {
      title: 'Create Account',
      description: 'Use this when the user wants to create a new Pocketly account.',
      inputSchema: accountCreateSchema,
      outputSchema: { account: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const account = await createAccount(args);
      return result({ account }, `Created account ${account.name}.`);
    }
  );

  registerAppTool(
    server,
    'update_account',
    {
      title: 'Update Account',
      description:
        'Use this when the user wants to update a Pocketly account by an id returned from list/bootstrap tools.',
      inputSchema: accountUpdateSchema,
      outputSchema: { account: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const account = await updateAccount(args.id, stripId(args));
      return result({ account }, `Updated account ${account.name}.`);
    }
  );

  registerAppTool(
    server,
    'delete_account',
    {
      title: 'Delete Account',
      description:
        'Use this when the user explicitly wants to soft-delete a Pocketly account by id.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { id: z.string(), success: z.boolean() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const success = await deleteAccount(args.id);
      if (!success) throw new Error('Account not found');
      return result({ ...idPayload(args), success }, `Deleted account ${args.id}.`);
    }
  );

  registerAppTool(
    server,
    'create_category',
    {
      title: 'Create Category',
      description: 'Use this when the user wants to create a Pocketly income or expense category.',
      inputSchema: categoryCreateSchema,
      outputSchema: { category: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const category = await createCategory(args);
      return result({ category }, `Created category ${category.name}.`);
    }
  );

  registerAppTool(
    server,
    'update_category',
    {
      title: 'Update Category',
      description:
        'Use this when the user wants to update a Pocketly category by an id returned from list/bootstrap tools.',
      inputSchema: categoryUpdateSchema,
      outputSchema: { category: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const category = await updateCategory(args.id, stripId(args));
      return result({ category }, `Updated category ${category.name}.`);
    }
  );

  registerAppTool(
    server,
    'delete_category',
    {
      title: 'Delete Category',
      description:
        'Use this when the user explicitly wants to soft-delete a Pocketly category by id.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { id: z.string(), success: z.boolean() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const success = await deleteCategory(args.id);
      if (!success) throw new Error('Category not found');
      return result({ ...idPayload(args), success }, `Deleted category ${args.id}.`);
    }
  );

  registerAppTool(
    server,
    'create_budget',
    {
      title: 'Create Budget',
      description:
        'Use this when the user wants to create a Pocketly budget for an expense category.',
      inputSchema: budgetCreateSchema,
      outputSchema: { budget: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const budget = await createPocketlyBudget(args);
      return result({ budget }, 'Created budget.');
    }
  );

  registerAppTool(
    server,
    'update_budget',
    {
      title: 'Update Budget',
      description:
        'Use this when the user wants to update a Pocketly budget by an id returned from list/bootstrap tools.',
      inputSchema: budgetUpdateSchema,
      outputSchema: { budget: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const budget = await updatePocketlyBudget(args.id, stripId(args));
      return result({ budget }, 'Updated budget.');
    }
  );

  registerAppTool(
    server,
    'delete_budget',
    {
      title: 'Delete Budget',
      description:
        'Use this when the user explicitly wants to soft-delete a Pocketly budget by id.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { id: z.string(), success: z.boolean() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const success = await deleteBudget(args.id);
      if (!success) throw new Error('Budget not found');
      return result({ ...idPayload(args), success }, `Deleted budget ${args.id}.`);
    }
  );

  registerAppTool(
    server,
    'create_transaction',
    {
      title: 'Create Transaction',
      description:
        'Use this when the user wants to create a Pocketly income, expense, or transfer transaction.',
      inputSchema: transactionCreateSchema,
      outputSchema: { transaction: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const transaction = await createPocketlyTransaction(args);
      return result({ transaction }, `Created ${transaction.type} transaction.`);
    }
  );

  registerAppTool(
    server,
    'update_transaction',
    {
      title: 'Update Transaction',
      description:
        'Use this when the user wants to update a Pocketly transaction by an id returned from list/bootstrap tools.',
      inputSchema: transactionUpdateSchema,
      outputSchema: { transaction: z.any() },
      annotations: writeAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const transaction = await updatePocketlyTransaction(args.id, stripId(args));
      return result({ transaction }, `Updated transaction ${transaction.id}.`);
    }
  );

  registerAppTool(
    server,
    'delete_transaction',
    {
      title: 'Delete Transaction',
      description:
        'Use this when the user explicitly wants to soft-delete a Pocketly transaction by id.',
      inputSchema: { id: z.string().min(1) },
      outputSchema: { id: z.string(), success: z.boolean() },
      annotations: deleteAnnotations(),
      _meta: toolMeta(),
    },
    async (args) => {
      const success = await deleteTransaction(args.id);
      if (!success) throw new Error('Transaction not found');
      return result({ ...idPayload(args), success }, `Deleted transaction ${args.id}.`);
    }
  );
}
