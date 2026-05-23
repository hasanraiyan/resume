import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';

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

export async function computeAccountSummariesFromDb(accounts) {
  await dbConnect();

  const [directEffects, transferEffects] = await Promise.all([
    Transaction.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$account',
          netEffect: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$type', 'income'] }, then: '$amount' },
                  { case: { $eq: ['$type', 'expense'] }, then: { $multiply: ['$amount', -1] } },
                  { case: { $eq: ['$type', 'transfer'] }, then: { $multiply: ['$amount', -1] } },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { deletedAt: null, type: 'transfer', toAccount: { $ne: null, $exists: true } } },
      {
        $group: {
          _id: '$toAccount',
          netEffect: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const balanceMap = new Map(
    accounts.map((a) => [a._id.toString(), Number(a.initialBalance) || 0])
  );

  for (const entry of directEffects) {
    const id = entry._id?.toString();
    if (id && balanceMap.has(id)) {
      balanceMap.set(id, balanceMap.get(id) + (entry.netEffect || 0));
    }
  }

  for (const entry of transferEffects) {
    const id = entry._id?.toString();
    if (id && balanceMap.has(id)) {
      balanceMap.set(id, balanceMap.get(id) + (entry.netEffect || 0));
    }
  }

  const summaries = accounts.map((account) => ({
    ...account,
    currentBalance: balanceMap.get(account._id.toString()) ?? 0,
  }));

  return {
    accounts: summaries,
    totalAccountBalance: summaries.reduce((sum, acc) => sum + (Number(acc.currentBalance) || 0), 0),
  };
}
