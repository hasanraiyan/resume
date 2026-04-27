import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { requireAdminAuth } from '@/lib/money-auth';

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();

    // Check if data already exists
    const existingAccounts = await Account.countDocuments({ deletedAt: null });
    if (existingAccounts > 0) {
      return NextResponse.json({ success: true, message: 'Data already seeded' });
    }

    // Seed Accounts
    const accounts = await Account.insertMany([
      { name: 'CARD', icon: 'credit-card', initialBalance: 0 },
      { name: 'CASH', icon: 'wallet', initialBalance: 0 },
      { name: 'SAVING', icon: 'piggy-bank', initialBalance: 0 },
    ]);

    // Seed Categories
    const expenseCategories = await Category.insertMany([
      {
        name: 'Food & Dining',
        type: 'expense',
        icon: 'utensils',
        color: '#EF4444',
        bgColor: '#E6F4EA',
      },
      {
        name: 'Transportation',
        type: 'expense',
        icon: 'car',
        color: '#F59E0B',
        bgColor: '#E6F4EA',
      },
      {
        name: 'Shopping',
        type: 'expense',
        icon: 'shopping-bag',
        color: '#8B5CF6',
        bgColor: '#E6F4EA',
      },
      {
        name: 'Bills & Utilities',
        type: 'expense',
        icon: 'receipt',
        color: '#3B82F6',
        bgColor: '#E6F4EA',
      },
      {
        name: 'Entertainment',
        type: 'expense',
        icon: 'film',
        color: '#EC4899',
        bgColor: '#E6F4EA',
      },
      {
        name: 'Health',
        type: 'expense',
        icon: 'heart-pulse',
        color: '#10B981',
        bgColor: '#E6F4EA',
      },
      { name: 'Social', type: 'expense', icon: 'users', color: '#6366F1', bgColor: '#E6F4EA' },
      {
        name: 'Education',
        type: 'expense',
        icon: 'book-open',
        color: '#14B8A6',
        bgColor: '#E6F4EA',
      },
    ]);

    const incomeCategories = await Category.insertMany([
      { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22C55E', bgColor: '#E6F4EA' },
      { name: 'Freelance', type: 'income', icon: 'laptop', color: '#06B6D4', bgColor: '#E6F4EA' },
      { name: 'Awards', type: 'income', icon: 'trophy', color: '#F59E0B', bgColor: '#E6F4EA' },
      { name: 'Sale', type: 'income', icon: 'tag', color: '#A855F7', bgColor: '#E6F4EA' },
      {
        name: 'Interest',
        type: 'income',
        icon: 'trending-up',
        color: '#0EA5E9',
        bgColor: '#E6F4EA',
      },
    ]);

    // Seed Transactions
    const now = new Date();
    const transactions = [];
    const descriptions = {
      expense: {
        [expenseCategories[0]._id]: [
          'Lunch at restaurant',
          'Grocery shopping',
          'Coffee',
          'Dinner with friends',
        ],
        [expenseCategories[1]._id]: ['Uber ride', 'Petrol', 'Bus fare', 'Auto fare'],
        [expenseCategories[2]._id]: ['New shoes', 'Clothes', 'Electronics', 'Accessories'],
        [expenseCategories[3]._id]: [
          'Electricity bill',
          'Internet bill',
          'Phone bill',
          'Water bill',
        ],
        [expenseCategories[4]._id]: ['Movie tickets', 'Netflix subscription', 'Concert', 'Gaming'],
        [expenseCategories[5]._id]: ['Doctor visit', 'Medicines', 'Gym membership', 'Vitamins'],
        [expenseCategories[6]._id]: ['Birthday gift', 'Party expenses', 'Dinner treat', 'Charity'],
        [expenseCategories[7]._id]: ['Online course', 'Books', 'Certification', 'Workshop'],
      },
      income: {
        [incomeCategories[0]._id]: ['Monthly salary', 'Bonus', 'Overtime pay'],
        [incomeCategories[1]._id]: ['Web design project', 'Consulting', 'Tutoring'],
        [incomeCategories[2]._id]: ['Performance award', 'Hackathon prize', 'Contest win'],
        [incomeCategories[3]._id]: ['Sold old phone', 'Sold furniture', 'Sold books'],
        [incomeCategories[4]._id]: ['Bank interest', 'Fixed deposit', 'Dividends'],
      },
    };

    // Generate transactions for the past 3 months
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(12, 0, 0, 0);

      // Random number of transactions per day (0-3)
      const numTransactions = Math.floor(Math.random() * 4);

      for (let i = 0; i < numTransactions; i++) {
        const isExpense = Math.random() > 0.3;
        const type = isExpense ? 'expense' : 'income';
        const categories = isExpense ? expenseCategories : incomeCategories;
        const category = categories[Math.floor(Math.random() * categories.length)];
        const account = accounts[Math.floor(Math.random() * accounts.length)];
        const descList = descriptions[type][category._id] || ['Transaction'];
        const description = descList[Math.floor(Math.random() * descList.length)];

        const amount = isExpense
          ? Math.round((Math.random() * 2000 + 50) * 100) / 100
          : Math.round((Math.random() * 5000 + 1000) * 100) / 100;

        transactions.push({
          type,
          amount,
          description,
          category: category._id,
          account: account._id,
          date,
        });
      }
    }

    // Add some transfers
    transactions.push(
      {
        type: 'transfer',
        amount: 5000,
        description: 'Cash to Card',
        account: accounts[1]._id,
        toAccount: accounts[0]._id,
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'transfer',
        amount: 2000,
        description: 'Cash to Saving',
        account: accounts[1]._id,
        toAccount: accounts[2]._id,
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      }
    );

    await Transaction.insertMany(transactions);

    return NextResponse.json({
      success: true,
      message: `Seeded ${accounts.length} accounts, ${expenseCategories.length + incomeCategories.length} categories, ${transactions.length} transactions`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: 'Failed to seed data' }, { status: 500 });
  }
}
