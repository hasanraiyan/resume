function toDateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function computeAnalysis({
  transactions = [],
  categories = [],
  accounts = [],
  startDate,
  endDate,
}) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const filtered = transactions.filter((transaction) => {
    const txDate = new Date(transaction.date);
    if (start && txDate < start) return false;
    if (end && txDate > end) return false;
    return true;
  });

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const categoryBreakdownMap = new Map();
  const dailyFlowMap = new Map();
  const accountAnalysisMap = new Map();

  let totalExpense = 0;
  let totalIncome = 0;

  filtered.forEach((transaction) => {
    if (!['expense', 'income'].includes(transaction.type)) return;

    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'expense') totalExpense += amount;
    else totalIncome += amount;

    const categoryId = transaction.category?.id || transaction.category || null;
    const category = categoryMap.get(categoryId);
    const categoryKey = `${transaction.type}:${categoryId || 'uncategorized'}`;
    const currentCategory = categoryBreakdownMap.get(categoryKey) || {
      categoryId,
      type: transaction.type,
      total: 0,
      count: 0,
      name: category?.name || 'Uncategorized',
      icon: category?.icon || 'dollar-sign',
      color: category?.color || '#000000',
    };
    currentCategory.total += amount;
    currentCategory.count += 1;
    categoryBreakdownMap.set(categoryKey, currentCategory);

    const day = toDateOnly(transaction.date);
    const dailyKey = `${day}:${transaction.type}`;
    const dailyValue = dailyFlowMap.get(dailyKey) || {
      date: day,
      type: transaction.type,
      total: 0,
    };
    dailyValue.total += amount;
    dailyFlowMap.set(dailyKey, dailyValue);

    const accountId = transaction.account?.id || transaction.account || null;
    const account = accountMap.get(accountId);
    const accountKey = `${accountId || 'unknown'}:${transaction.type}`;
    const accountValue = accountAnalysisMap.get(accountKey) || {
      accountId,
      type: transaction.type,
      total: 0,
      name: account?.name || 'Unknown',
      icon: account?.icon || 'wallet',
    };
    accountValue.total += amount;
    accountAnalysisMap.set(accountKey, accountValue);
  });

  return {
    categoryBreakdown: Array.from(categoryBreakdownMap.values()).sort((a, b) => b.total - a.total),
    dailyFlow: Array.from(dailyFlowMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    accountAnalysis: Array.from(accountAnalysisMap.values()),
    totalExpense,
    totalIncome,
    netBalance: totalIncome - totalExpense,
  };
}
