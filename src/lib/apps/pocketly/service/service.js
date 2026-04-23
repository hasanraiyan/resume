import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';
import Account from '@/models/Account';
import Category from '@/models/Category';
import { serializeTransaction, serializeAccount, serializeCategory } from '@/lib/money-serializers';
import {
  isValidObjectId,
  DraftTransactionSchema,
  TransactionCreateSchema,
  TransactionUpdateSchema,
} from './validators';

export async function ensureDb() {
  await dbConnect();
}

export async function getAccounts({ includeBalances = true } = {}) {
  await ensureDb();
  const accounts = await Account.find({ deletedAt: null }).lean();

  if (includeBalances) {
    const transactions = await Transaction.find({ deletedAt: null }).lean();

    accounts.forEach((acc) => {
      let balance = acc.initialBalance || 0;
      transactions.forEach((tx) => {
        if (tx.type === 'income' && tx.account?.toString() === acc._id.toString()) {
          balance += tx.amount;
        } else if (tx.type === 'expense' && tx.account?.toString() === acc._id.toString()) {
          balance -= tx.amount;
        } else if (tx.type === 'transfer') {
          if (tx.account?.toString() === acc._id.toString()) {
            balance -= tx.amount;
          }
          if (tx.toAccount?.toString() === acc._id.toString()) {
            balance += tx.amount;
          }
        }
      });
      acc.balance = balance;
      acc.currentBalance = balance;
    });
  }

  return accounts.map(serializeAccount);
}

export async function getCategories() {
  await ensureDb();
  const categories = await Category.find({ deletedAt: null }).lean();
  return categories.map(serializeCategory);
}

export async function getTransactions({ type, limit, startDate, endDate, account, category } = {}) {
  await ensureDb();

  const query = { deletedAt: null };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  if (account) query.account = account;
  if (category) query.category = category;
  if (type) query.type = type;

  let dbQuery = Transaction.find(query)
    .populate('category', 'name icon type color')
    .populate('account', 'name icon currency')
    .populate('toAccount', 'name icon currency')
    .sort({ date: -1, createdAt: -1 });

  dbQuery = dbQuery.limit(limit || 20);

  const transactions = await dbQuery.lean();
  return transactions.map(serializeTransaction);
}

export async function getFinancialSummary({ startDate, endDate } = {}) {
  await ensureDb();
  const transactions = await getTransactions({ startDate, endDate });

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') totalIncome += tx.amount;
    if (tx.type === 'expense') totalExpense += tx.amount;
  }

  const accounts = await getAccounts({ includeBalances: true });

  return {
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    accounts,
  };
}

export async function createTransaction(payload) {
  await ensureDb();

  const validated = TransactionCreateSchema.parse(payload);

  const transaction = new Transaction(validated);
  await transaction.save();

  const populated = await Transaction.findById(transaction._id)
    .populate('category', 'name icon type color')
    .populate('account', 'name icon currency')
    .populate('toAccount', 'name icon currency')
    .lean();

  return serializeTransaction(populated);
}

export async function updateTransaction(id, patch) {
  await ensureDb();

  if (!isValidObjectId(id)) {
    throw new Error('Invalid transaction ID');
  }

  const validated = TransactionUpdateSchema.parse(patch);

  const updated = await Transaction.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: validated, $inc: { syncVersion: 1 } },
    { new: true }
  )
    .populate('category', 'name icon type color')
    .populate('account', 'name icon currency')
    .populate('toAccount', 'name icon currency')
    .lean();

  if (!updated) {
    throw new Error('Transaction not found');
  }

  return serializeTransaction(updated);
}

export async function deleteTransaction(id) {
  await ensureDb();

  if (!isValidObjectId(id)) {
    throw new Error('Invalid transaction ID');
  }

  const deleted = await Transaction.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  );

  return !!deleted;
}

export function validateDraftTransaction(params) {
  try {
    const validated = DraftTransactionSchema.parse(params);
    return { ok: true, errors: null, sanitized: validated };
  } catch (err) {
    return { ok: false, errors: err.errors, sanitized: null };
  }
}

export async function createAccount(payload) {
  await ensureDb();
  const account = new Account(payload);
  await account.save();
  return serializeAccount(account.toObject());
}

export async function updateAccount(id, patch) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid account ID');
  const account = await Account.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: patch, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!account) throw new Error('Account not found');
  return serializeAccount(account);
}

export async function deleteAccount(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid account ID');
  const deleted = await Account.findOneAndUpdate(
    { _id: id, deletedAt: null },
    {
      $set: { deletedAt: new Date() },
      $inc: { syncVersion: 1 },
    }
  );
  return !!deleted;
}

export async function createCategory(payload) {
  await ensureDb();
  const category = new Category(payload);
  await category.save();
  return serializeCategory(category.toObject());
}

export async function updateCategory(id, patch) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid category ID');
  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: patch, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!category) throw new Error('Category not found');
  return serializeCategory(category);
}

export async function deleteCategory(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid category ID');
  const deleted = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    {
      $set: { deletedAt: new Date() },
      $inc: { syncVersion: 1 },
    }
  );
  return !!deleted;
}
