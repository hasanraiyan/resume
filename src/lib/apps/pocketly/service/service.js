import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';
import RecurringTransaction from '@/models/RecurringTransaction';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Budget from '@/models/Budget';
import SavingsGoal from '@/models/SavingsGoal';
import {
  serializeTransaction,
  serializeAccount,
  serializeCategory,
  serializeBudget,
} from '@/lib/money-serializers';
import {
  isValidObjectId,
  DraftTransactionSchema,
  TransactionCreateSchema,
  TransactionUpdateSchema,
  BudgetCreateSchema,
  BudgetUpdateSchema,
  RecurringTransactionCreateSchema,
  RecurringTransactionUpdateSchema,
  SavingsGoalCreateSchema,
  SavingsGoalUpdateSchema,
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

export function serializeSavingsGoal(goal) {
  return {
    ...goal,
    _id: goal._id.toString(),
    id: goal._id.toString(),
    targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString() : null,
    deletedAt: goal.deletedAt ? new Date(goal.deletedAt).toISOString() : null,
    updatedAt: goal.updatedAt ? new Date(goal.updatedAt).toISOString() : null,
    createdAt: goal.createdAt ? new Date(goal.createdAt).toISOString() : null,
  };
}

export async function getSavingsGoals() {
  await ensureDb();
  const goals = await SavingsGoal.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
  return goals.map(serializeSavingsGoal);
}

export async function createSavingsGoal(payload) {
  await ensureDb();
  const validated = SavingsGoalCreateSchema.parse(payload);
  const goal = new SavingsGoal(validated);
  await goal.save();
  return serializeSavingsGoal(goal.toObject());
}

export async function updateSavingsGoal(id, patch) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid goal ID');
  const validated = SavingsGoalUpdateSchema.parse(patch);
  const goal = await SavingsGoal.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: validated }, { new: true }).lean();
  if (!goal) throw new Error('Savings goal not found');
  return serializeSavingsGoal(goal);
}

export async function deleteSavingsGoal(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid goal ID');
  const deleted = await SavingsGoal.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
  return !!deleted;
}

export async function processDueRecurringTransactions() {
  await ensureDb();
  const now = new Date();
  const dueTransactions = await RecurringTransaction.find({
    isActive: true,
    deletedAt: null,
    nextDueDate: { $lte: now },
  });

  const created = [];

  for (const recurring of dueTransactions) {
    // Create transaction
    const txData = {
      type: recurring.type,
      amount: recurring.amount,
      description: recurring.description || 'Recurring Transaction',
      category: recurring.category,
      account: recurring.account,
      toAccount: recurring.toAccount,
      note: recurring.note,
      date: recurring.nextDueDate,
    };

    const transaction = new Transaction({
      ...txData,
      recurringId: recurring._id,
    });
    await transaction.save();

    // Advance nextDueDate
    let nextDate = new Date(recurring.nextDueDate);
    if (recurring.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (recurring.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (recurring.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (recurring.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

    recurring.nextDueDate = nextDate;

    // Check if ended
    if (recurring.endDate && nextDate > recurring.endDate) {
      recurring.isActive = false;
    }

    await recurring.save();
    created.push(transaction);
  }

  return created;
}

export function serializeRecurringTransaction(recurring) {
  return {
    ...recurring,
    _id: recurring._id.toString(),
    id: recurring._id.toString(),
    category: recurring.category
      ? {
          ...recurring.category,
          _id: recurring.category._id ? recurring.category._id.toString() : recurring.category,
          id: recurring.category._id ? recurring.category._id.toString() : recurring.category,
        }
      : null,
    account: recurring.account
      ? {
          ...recurring.account,
          _id: recurring.account._id ? recurring.account._id.toString() : recurring.account,
          id: recurring.account._id ? recurring.account._id.toString() : recurring.account,
        }
      : recurring.account,
    nextDueDate: recurring.nextDueDate ? new Date(recurring.nextDueDate).toISOString() : null,
    endDate: recurring.endDate ? new Date(recurring.endDate).toISOString() : null,
    deletedAt: recurring.deletedAt ? new Date(recurring.deletedAt).toISOString() : null,
    updatedAt: recurring.updatedAt ? new Date(recurring.updatedAt).toISOString() : null,
    createdAt: recurring.createdAt ? new Date(recurring.createdAt).toISOString() : null,
  };
}

export async function getRecurringTransactions() {
  await ensureDb();
  const recurrings = await RecurringTransaction.find({ deletedAt: null })
    .populate('category', 'name icon type color')
    .populate('account', 'name icon currency')
    .lean();
  return recurrings.map(serializeRecurringTransaction);
}

export async function createRecurringTransaction(payload) {
  await ensureDb();
  const validated = RecurringTransactionCreateSchema.parse(payload);
  const recurring = new RecurringTransaction(validated);
  await recurring.save();

  const populated = await RecurringTransaction.findById(recurring._id)
    .populate('category', 'name icon type color')
    .populate('account', 'name icon currency')
    .lean();
  return serializeRecurringTransaction(populated);
}

export async function updateRecurringTransaction(id, patch) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid recurring transaction ID');
  const validated = RecurringTransactionUpdateSchema.parse(patch);
  const recurring = await RecurringTransaction.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: validated },
    { new: true }
  )
    .populate('category', 'name icon type color')
    .populate('account', 'name icon currency')
    .lean();
  if (!recurring) throw new Error('Recurring transaction not found');
  return serializeRecurringTransaction(recurring);
}

export async function deleteRecurringTransaction(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid recurring transaction ID');
  const deleted = await RecurringTransaction.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } }
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

export async function getBudgets() {
  await ensureDb();
  const budgets = await Budget.find({ deletedAt: null })
    .populate('category', 'name icon type color')
    .lean();
  return budgets.map(serializeBudget);
}

export async function createBudget(payload) {
  await ensureDb();
  const validated = BudgetCreateSchema.parse(payload);
  const budget = new Budget(validated);
  await budget.save();

  const populated = await Budget.findById(budget._id)
    .populate('category', 'name icon type color')
    .lean();
  return serializeBudget(populated);
}

export async function updateBudget(id, patch) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid budget ID');
  const validated = BudgetUpdateSchema.parse(patch);
  const budget = await Budget.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: validated, $inc: { syncVersion: 1 } },
    { new: true }
  )
    .populate('category', 'name icon type color')
    .lean();
  if (!budget) throw new Error('Budget not found');
  return serializeBudget(budget);
}

export async function deleteBudget(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid budget ID');
  const deleted = await Budget.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  );
  return !!deleted;
}
