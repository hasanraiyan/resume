'use client';

import { useState, useMemo } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { Target, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import IconRenderer from './IconRenderer';
import BottomSheet from './BottomSheet';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const getCategoryColorPresentation = (color) => {
  if (color && color.startsWith('bg-')) {
    return { className: color, style: {} };
  }
  return { className: '', style: { backgroundColor: color || '#1f644e' } };
};

export default function BudgetsTab() {
  const { budgets, categories, transactions, addBudget, updateBudget, deleteBudget } = useMoney();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute current spending for budgets
  const budgetProgress = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return budgets.map((budget) => {
      const categoryId = budget.category?._id || budget.category?.id || budget.category;

      const spent = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          const tCatId = t.category?._id || t.category?.id || t.category;
          return (
            t.type === 'expense' &&
            tCatId === categoryId &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        progress: Math.min(progress, 100),
        isExceeded: spent > budget.amount,
      };
    });
  }, [budgets, transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category: formData.category,
        amount: Number(formData.amount),
        period: formData.period,
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id || editingBudget._id, payload);
      } else {
        await addBudget(payload);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save budget', error);
    }
  };

  const openModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category?._id || budget.category?.id || budget.category,
        amount: budget.amount.toString(),
        period: budget.period || 'monthly',
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: expenseCategories[0]?._id || expenseCategories[0]?.id || '',
        amount: '',
        period: 'monthly',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1e3a34] flex items-center gap-2">
              <Target className="w-6 h-6 text-[#1f644e]" />
              Budgets
            </h2>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-[#1f644e] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Budget
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f5f2]">
                <Target className="h-8 w-8 text-[#7c8e88]" />
              </div>
              <p className="mb-1 text-sm font-bold text-[#1e3a34]">No budgets set</p>
              <p className="text-xs text-[#7c8e88]">
                Create a budget to track your spending limits.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {budgetProgress.map((budget) => {
                const catName = budget.category?.name || 'Unknown Category';
                const catIcon = budget.category?.icon || 'tag';
                const catColor = budget.category?.color || '#1f644e';

                return (
                  <div
                    key={budget.id || budget._id}
                    className="rounded-xl border border-[#e5e3d8] bg-white p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                          style={{ backgroundColor: catColor }}
                        >
                          <IconRenderer name={catIcon} className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1e3a34]">{catName}</p>
                          <p className="text-xs text-[#7c8e88] capitalize">{budget.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(budget)}
                          className="p-1.5 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id || budget._id)}
                          className="p-1.5 text-[#c94c4c] hover:bg-[#fef2f2] rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2 flex items-end justify-between">
                      <div>
                        <p
                          className={`text-2xl font-bold ${budget.isExceeded ? 'text-[#c94c4c]' : 'text-[#1e3a34]'}`}
                        >
                          {currencyFormatter.format(budget.spent)}
                        </p>
                        <p className="text-xs font-semibold text-[#7c8e88]">
                          of {currencyFormatter.format(budget.amount)} limit
                        </p>
                      </div>
                      {budget.isExceeded && (
                        <div className="flex items-center gap-1 text-xs font-bold text-[#c94c4c] bg-[#fef2f2] px-2 py-1 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          Exceeded
                        </div>
                      )}
                    </div>

                    <div className="h-2 w-full bg-[#f0f5f2] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${budget.isExceeded ? 'bg-[#c94c4c]' : 'bg-[#1f644e]'}`}
                        style={{ width: `${budget.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-right text-[10px] font-bold text-[#7c8e88]">
                      {budget.progress.toFixed(0)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e3a34]">
                {editingBudget ? 'Edit Budget' : 'New Budget'}
              </h3>
              <button
                onClick={closeModal}
                className="text-[#7c8e88] hover:bg-[#f0f5f2] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                  Category
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-4 py-3 text-sm font-medium text-[#1e3a34] outline-none focus:border-[#1f644e]"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                  Amount Limit
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-4 py-3 text-sm font-medium text-[#1e3a34] outline-none focus:border-[#1f644e]"
                  placeholder="e.g. 5000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData((p) => ({ ...p, period: e.target.value }))}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-4 py-3 text-sm font-medium text-[#1e3a34] outline-none focus:border-[#1f644e]"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full bg-[#1f644e] text-white py-3 rounded-xl font-bold hover:bg-[#17503e] transition-colors"
                >
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Selector Bottom Sheet */}
      <BottomSheet
        open={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        className="max-h-80 overflow-y-auto"
        mobileOnly={false}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#7c8e88]">
          Select category
        </p>
        <div className="grid grid-cols-4 gap-4">
          {expenseCategories.map((cat) => {
            const colorPresentation = getCategoryColorPresentation(cat.color);
            return (
              <button
                type="button"
                key={cat.id || cat._id}
                onClick={() => {
                  setFormData((p) => ({ ...p, category: cat.id || cat._id }));
                  setShowCategorySelector(false);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${colorPresentation.className} text-white flex items-center justify-center shadow-md active:scale-95 transition`}
                  style={colorPresentation.style}
                >
                  <IconRenderer name={cat.icon} className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-[#7c8e88] text-center leading-tight">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
