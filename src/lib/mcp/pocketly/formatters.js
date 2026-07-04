/**
 * Format Pocketly data objects into human-readable text.
 */

export function formatAccounts(accounts) {
  return accounts
    .map((a) => {
      const balance = a.currentBalance ?? a.balance ?? a.initialBalance ?? 0;
      const ignored = a.ignored ? ' [ignored]' : '';
      return `${a.name}: ₹${Number(balance).toFixed(2)}${ignored}`;
    })
    .join('\n');
}

export function formatCategories(categories) {
  return categories
    .map((c) => {
      const ignored = c.ignored ? ' [ignored]' : '';
      return `${c.name} (${c.type})${ignored}`;
    })
    .join('\n');
}

export function formatBudgets(budgets) {
  return budgets
    .map((b) => {
      const spent = b.spent ?? 0;
      return `${b.category?.name || 'Unknown'}: ₹${Number(spent).toFixed(2)} / ₹${Number(b.amount).toFixed(2)} (${b.period})`;
    })
    .join('\n');
}

export function formatTransactions(transactions) {
  return transactions
    .map((t) => {
      const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '→';
      const desc = t.description || '(no description)';
      const date = t.date ? new Date(t.date).toISOString().slice(0, 10) : '?';
      const cat = t.category?.name || '';
      const acct = t.account?.name || '';
      const toAcct = t.toAccount?.name ? ` → ${t.toAccount.name}` : '';
      return `${date} ${sign} ₹${Number(t.amount).toFixed(2)} | ${desc}${cat ? ` [${cat}]` : ''} | ${acct}${toAcct}`;
    })
    .join('\n');
}

export function formatAnalysis(analysis) {
  const lines = [
    `Total Income: ₹${Number(analysis.totalIncome ?? 0).toFixed(2)}`,
    `Total Expense: ₹${Number(analysis.totalExpense ?? 0).toFixed(2)}`,
    `Net Flow: ₹${Number(analysis.netFlow ?? 0).toFixed(2)}`,
    `Total Balance: ₹${Number(analysis.totalAccountBalance ?? 0).toFixed(2)}`,
  ];

  if (analysis.categoryBreakdown?.length) {
    lines.push('', 'By Category:');
    analysis.categoryBreakdown.forEach((c) => {
      lines.push(`  ${c.name}: ₹${Number(c.total).toFixed(2)} (${c.count} txns)`);
    });
  }

  if (analysis.accountAnalysis?.length) {
    lines.push('', 'By Account:');
    analysis.accountAnalysis.forEach((a) => {
      lines.push(`  ${a.name}: ₹${Number(a.total).toFixed(2)} (${a.type})`);
    });
  }

  return lines.join('\n');
}
