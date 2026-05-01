import {
  getAccounts,
  getTransactions,
  getFinancialSummary,
  getBudgets,
} from '@/lib/apps/pocketly/service/service';
import {
  normalizeAccount,
  normalizeTransaction,
  getTransactionStats,
  normalizeBudget,
  makePeriod,
  getCategoryBreakdown,
} from './utils.js';

export async function buildAccountsPayload() {
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

export async function buildTransactionsPayload({
  type,
  limit = 20,
  startDate,
  endDate,
  categoryId,
} = {}) {
  const period = makePeriod(startDate, endDate);
  const transactions = (
    await getTransactions({
      type,
      limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
      startDate: period.startDate,
      endDate: period.endDate,
      category: categoryId,
    })
  ).map(normalizeTransaction);

  return {
    kind: 'transactions',
    period,
    stats: getTransactionStats(transactions),
    transactions,
  };
}

export async function buildBudgetsPayload() {
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

export async function buildSummaryPayload({ startDate, endDate } = {}) {
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
