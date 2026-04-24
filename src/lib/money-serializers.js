export function serializeAccount(account) {
  return {
    ...account,
    _id: account._id.toString(),
    id: account._id.toString(),
    deletedAt: account.deletedAt ? new Date(account.deletedAt).toISOString() : null,
    updatedAt: account.updatedAt ? new Date(account.updatedAt).toISOString() : null,
    createdAt: account.createdAt ? new Date(account.createdAt).toISOString() : null,
  };
}

export function serializeCategory(category) {
  return {
    ...category,
    _id: category._id.toString(),
    id: category._id.toString(),
    deletedAt: category.deletedAt ? new Date(category.deletedAt).toISOString() : null,
    updatedAt: category.updatedAt ? new Date(category.updatedAt).toISOString() : null,
    createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : null,
  };
}

export function serializeTransaction(transaction) {
  return {
    ...transaction,
    _id: transaction._id.toString(),
    id: transaction._id.toString(),
    category: transaction.category
      ? {
          ...transaction.category,
          _id: transaction.category._id.toString(),
          id: transaction.category._id.toString(),
        }
      : null,
    account: transaction.account
      ? {
          ...transaction.account,
          _id: transaction.account._id.toString(),
          id: transaction.account._id.toString(),
        }
      : transaction.account,
    toAccount: transaction.toAccount
      ? {
          ...transaction.toAccount,
          _id: transaction.toAccount._id.toString(),
          id: transaction.toAccount._id.toString(),
        }
      : null,
    date: transaction.date ? new Date(transaction.date).toISOString() : null,
    deletedAt: transaction.deletedAt ? new Date(transaction.deletedAt).toISOString() : null,
    updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : null,
    createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : null,
  };
}

export function serializeBudget(budget) {
  return {
    ...budget,
    _id: budget._id.toString(),
    id: budget._id.toString(),
    category: budget.category
      ? {
          ...budget.category,
          _id: budget.category._id ? budget.category._id.toString() : budget.category,
          id: budget.category._id ? budget.category._id.toString() : budget.category,
        }
      : null,
    deletedAt: budget.deletedAt ? new Date(budget.deletedAt).toISOString() : null,
    updatedAt: budget.updatedAt ? new Date(budget.updatedAt).toISOString() : null,
    createdAt: budget.createdAt ? new Date(budget.createdAt).toISOString() : null,
  };
}
