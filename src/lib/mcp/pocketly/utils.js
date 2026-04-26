export function textResult(text, structuredContent = undefined, extra = {}) {
  return {
    content: [{ type: 'text', text }],
    ...(structuredContent ? { structuredContent } : {}),
    ...extra,
  };
}

export function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function toolMeta(invoking, invoked, extra = {}) {
  return {
    'openai/toolInvocation/invoking': invoking,
    'openai/toolInvocation/invoked': invoked,
    ...extra,
  };
}

export function widgetToolMeta(widget, invoking, invoked) {
  return toolMeta(invoking, invoked, {
    ui: { resourceUri: widget.uri },
    'openai/outputTemplate': widget.uri,
  });
}

export function normalizeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    icon: account.icon || 'wallet',
    balance: account.balance ?? account.currentBalance ?? 0,
    initialBalance: account.initialBalance || 0,
    currency: account.currency || 'INR',
  };
}

export function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon || 'tag',
    color: category.color || '#1f644e',
  };
}

export function normalizeTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount) || 0,
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

export function normalizeBudget(budget, transactions = []) {
  const categoryId =
    budget.category?.id || budget.category?._id?.toString?.() || budget.category || null;
  const now = new Date();
  const spent = transactions
    .filter((transaction) => {
      const date = new Date(transaction.date);
      const transactionCategoryId =
        transaction.category?.id ||
        transaction.category?._id?.toString?.() ||
        transaction.category ||
        null;

      return (
        transaction.type === 'expense' &&
        transactionCategoryId === categoryId &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
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

export function makePeriod(startDate, endDate) {
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

export function getTransactionStats(transactions) {
  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalExpense,
    totalIncome,
    netFlow: totalIncome - totalExpense,
  };
}

export function getCategoryBreakdown(transactions) {
  const map = new Map();

  for (const transaction of transactions) {
    if (!['income', 'expense'].includes(transaction.type)) continue;
    const categoryId = transaction.category?.id || 'uncategorized';
    const key = `${categoryId}:${transaction.type}`;
    const row = map.get(key) || {
      categoryId,
      name: transaction.category?.name || 'Uncategorized',
      icon: transaction.category?.icon || 'tag',
      color: transaction.category?.color || '#7c8e88',
      type: transaction.type,
      total: 0,
      count: 0,
    };
    row.total += transaction.amount;
    row.count += 1;
    map.set(key, row);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
