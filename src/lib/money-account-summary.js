function toId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toString === 'function') return value.toString();
  return null;
}

export function computeAccountSummaries(accounts = [], transactions = []) {
  const balanceMap = new Map();

  for (const account of accounts) {
    balanceMap.set(toId(account._id || account.id), Number(account.initialBalance) || 0);
  }

  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    const accountId = toId(transaction.account);
    const toAccountId = toId(transaction.toAccount);

    if (transaction.type === 'expense' && accountId && balanceMap.has(accountId)) {
      balanceMap.set(accountId, balanceMap.get(accountId) - amount);
      continue;
    }

    if (transaction.type === 'income' && accountId && balanceMap.has(accountId)) {
      balanceMap.set(accountId, balanceMap.get(accountId) + amount);
      continue;
    }

    if (transaction.type === 'transfer') {
      if (accountId && balanceMap.has(accountId)) {
        balanceMap.set(accountId, balanceMap.get(accountId) - amount);
      }
      if (toAccountId && balanceMap.has(toAccountId)) {
        balanceMap.set(toAccountId, balanceMap.get(toAccountId) + amount);
      }
    }
  }

  const summaries = accounts.map((account) => ({
    ...account,
    currentBalance: balanceMap.get(toId(account._id || account.id)) ?? 0,
  }));

  return {
    accounts: summaries,
    totalAccountBalance: summaries.reduce(
      (sum, account) => sum + (Number(account.currentBalance) || 0),
      0
    ),
  };
}
