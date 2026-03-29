'use server';

import dbConnect from '@/lib/dbConnect';
import FinanceCategory from '@/models/FinanceCategory';
import FinanceTransaction from '@/models/FinanceTransaction';
import { verifyAdminAction } from '@/lib/auth/admin';

export async function getCategories() {
  await verifyAdminAction();
  await dbConnect();
  try {
    const categories = await FinanceCategory.find({}).sort({ displayOrder: 1, name: 1 }).lean();
    return {
      success: true,
      categories: categories.map((cat) => ({ ...cat, _id: cat._id.toString() })),
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function saveCategory(data) {
  await verifyAdminAction();
  await dbConnect();
  try {
    const { _id, name, icon, type, color } = data;
    if (_id) {
      const updated = await FinanceCategory.findByIdAndUpdate(
        _id,
        { name, icon, type, color },
        { new: true }
      ).lean();
      return { success: true, category: { ...updated, _id: updated._id.toString() } };
    } else {
      const newCategory = new FinanceCategory({ name, icon, type, color });
      await newCategory.save();
      const leanCat = newCategory.toObject();
      return { success: true, category: { ...leanCat, _id: leanCat._id.toString() } };
    }
  } catch (error) {
    console.error('Error saving category:', error);
    return { success: false, error: 'Failed to save category' };
  }
}

export async function getFinanceSummary() {
  await verifyAdminAction();
  await dbConnect();
  try {
    const transactions = await FinanceTransaction.find({}).lean();
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return {
      success: true,
      summary: {
        total: income - expense,
        income,
        expense,
      },
    };
  } catch (error) {
    console.error('Error calculating summary:', error);
    return { success: false, error: 'Failed to fetch summary' };
  }
}
