'use client';

import { useState, useMemo } from 'react';
import { useMoney } from '@/context/MoneyContext';
import {
  MoreVertical,
  Plus,
  TrendingDown,
  TrendingUp,
  Target,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Tag,
} from 'lucide-react';

import IconRenderer from './IconRenderer';
import BottomSheet from './BottomSheet';
import TopTabs from '@/components/custom-ui/TopTabs';

const categoryIcons = [
  'utensils',
  'car',
  'shopping-bag',
  'receipt',
  'film',
  'heart-pulse',
  'users',
  'book-open',
  'briefcase',
  'laptop',
  'trophy',
  'tag',
  'trending-up',
  'coffee',
  'home',
  'plane',
  'music',
  'gift',
  'baby',
  'dog',
  'shirt',
  'wrench',
  'wifi',
  'zap',
  'dumbbell',
  'pill',
  'graduation-cap',
  'paintbrush',
  'camera',
  'map-pin',
];

const categoryColors = [
  'bg-[#1f644e]',
  'bg-[#2d8a6e]',
  'bg-[#3ba88a]',
  'bg-[#5cbfa6]',
  'bg-[#4a86e8]',
  'bg-[#9333ea]',
  'bg-[#ef4444]',
  'bg-[#f59e0b]',
  'bg-[#6366f1]',
  'bg-[#ec4899]',
  'bg-[#14b8a6]',
  'bg-[#8b5cf6]',
];

const TYPE_OPTIONS = ['expense', 'income'];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const getCategoryColorPresentation = (color) => {
  if (!color) return { className: 'bg-[#1f644e]', style: undefined };
  if (color.startsWith('#')) return { className: '', style: { backgroundColor: color } };
  if (color.startsWith('bg-')) return { className: color, style: undefined };
  return { className: '', style: { backgroundColor: color || '#1f644e' } };
};

export default function PlanningTab() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    budgets,
    transactions,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useMoney();

  const [activeSubTab, setActiveSubTab] = useState('categories');

  // Categories Tab State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    icon: 'utensils',
    color: 'bg-[#1f644e]',
  });

  // Budgets Tab State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showBudgetCategorySelector, setShowBudgetCategorySelector] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Categories Logic
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
      } else {
        await addCategory(categoryForm);
      }
      resetCategoryForm();
    } catch (err) {
      setCategoryError(err.message || 'Failed to save category');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', type: 'expense', icon: 'utensils', color: 'bg-[#1f644e]' });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const startCategoryEdit = (category) => {
    setCategoryForm({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
    setCategoryMenuOpen(null);
  };

  const handleCategoryDelete = async (id) => {
    if (confirm('Delete this category?')) {
      await deleteCategory(id);
    }
    setCategoryMenuOpen(null);
  };

  // Budgets Logic
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

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category: budgetFormData.category,
        amount: Number(budgetFormData.amount),
        period: budgetFormData.period,
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id || editingBudget._id, payload);
      } else {
        await addBudget(payload);
      }
      closeBudgetModal();
    } catch (error) {
      console.error('Failed to save budget', error);
    }
  };

  const openBudgetModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetFormData({
        category: budget.category?._id || budget.category?.id || budget.category,
        amount: budget.amount.toString(),
        period: budget.period || 'monthly',
      });
    } else {
      setEditingBudget(null);
      setBudgetFormData({
        category: expenseCategories[0]?._id || expenseCategories[0]?.id || '',
        amount: '',
        period: 'monthly',
      });
    }
    setIsBudgetModalOpen(true);
  };

  const closeBudgetModal = () => {
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleBudgetDelete = async (id) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const renderCategoryGrid = (cats, title, icon) => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-[#1e3a34]">{title}</h3>
          <span className="text-xs text-[#7c8e88] bg-[#f0f5f2] px-2 py-0.5 rounded-full">
            {cats.length}
          </span>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="bg-white border border-[#e5e3d8] rounded-xl p-8 text-center">
          <p className="text-xs text-[#7c8e88]">No {title.toLowerCase()} yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((cat) => {
            const colorPresentation = getCategoryColorPresentation(cat.color);
            return (
              <div
                key={cat.id}
                className="bg-white border border-[#e5e3d8] rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow relative"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${colorPresentation.className} text-white flex items-center justify-center shrink-0`}
                  style={colorPresentation.style}
                >
                  <IconRenderer name={cat.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1e3a34] truncate">{cat.name}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setCategoryMenuOpen(categoryMenuOpen === cat.id ? null : cat.id)}
                    className="p-1.5 text-[#7c8e88] hover:text-[#1e3a34] transition rounded-lg hover:bg-[#f0f5f2] cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {categoryMenuOpen === cat.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e3d8] shadow-lg rounded-lg py-1 z-20 w-28">
                      <button
                        onClick={() => startCategoryEdit(cat)}
                        className="px-3 py-2 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCategoryDelete(cat.id)}
                        className="px-3 py-2 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left text-[#c94c4c]"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-6 pb-24 sm:pb-8 pt-4">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Compact Card-based Switcher */}
          <div className="grid grid-cols-2 gap-3 mb-10 max-w-sm mx-auto sm:max-w-none sm:gap-4">
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`relative overflow-hidden p-3 sm:p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer flex items-center gap-3 ${
                activeSubTab === 'categories'
                  ? 'bg-white border-[#1f644e] shadow-md ring-1 ring-[#1f644e]'
                  : 'bg-[#fcfbf5] border-[#e5e3d8] hover:border-[#1f644e]/50'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  activeSubTab === 'categories'
                    ? 'bg-[#1f644e] text-white'
                    : 'bg-[#1f644e]/10 text-[#1f644e]'
                }`}
              >
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors truncate ${
                    activeSubTab === 'categories' ? 'text-[#1f644e]' : 'text-[#7c8e88]'
                  }`}
                >
                  Categories
                </p>
                <p className="text-lg sm:text-xl font-black text-[#1e3a34] leading-tight">
                  {categories.length}
                </p>
              </div>
              {activeSubTab === 'categories' && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1f644e] animate-pulse" />
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('budgets')}
              className={`relative overflow-hidden p-3 sm:p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer flex items-center gap-3 ${
                activeSubTab === 'budgets'
                  ? 'bg-white border-[#1f644e] shadow-md ring-1 ring-[#1f644e]'
                  : 'bg-[#fcfbf5] border-[#e5e3d8] hover:border-[#1f644e]/50'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  activeSubTab === 'budgets'
                    ? 'bg-[#1f644e] text-white'
                    : 'bg-[#1f644e]/10 text-[#1f644e]'
                }`}
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors truncate ${
                    activeSubTab === 'budgets' ? 'text-[#1f644e]' : 'text-[#7c8e88]'
                  }`}
                >
                  Budgets
                </p>
                <p className="text-lg sm:text-xl font-black text-[#1e3a34] leading-tight">
                  {budgets.length}
                </p>
              </div>
              {activeSubTab === 'budgets' && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1f644e] animate-pulse" />
                </div>
              )}
            </button>
          </div>

          {activeSubTab === 'categories' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Categories Content */}
              {renderCategoryGrid(
                incomeCategories,
                'Income',
                <TrendingUp className="w-4 h-4 text-[#1f644e]" />
              )}
              <div className="mt-8">
                {renderCategoryGrid(
                  expenseCategories,
                  'Expense',
                  <TrendingDown className="w-4 h-4 text-[#c94c4c]" />
                )}
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="flex items-center gap-1.5 border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1f644e] hover:text-white transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Budgets Content */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1e3a34] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#1f644e]" />
                  Active Budgets
                </h2>
                <button
                  onClick={() => openBudgetModal()}
                  className="flex items-center gap-2 bg-[#1f644e] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors cursor-pointer"
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
                              onClick={() => openBudgetModal(budget)}
                              className="p-1.5 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleBudgetDelete(budget.id || budget._id)}
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
          )}
        </div>
      </div>

      {/* Categories Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-xl p-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">
              {editingCategory ? 'Edit category' : 'Add category'}
            </h3>
            {categoryError && (
              <div className="mb-4 bg-[#fef2f2] border border-[#f0d2d2] rounded-lg p-3 text-xs font-bold text-[#c94c4c] text-center">
                {categoryError}
              </div>
            )}
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                <div className="text-[10px] text-[#1f644e] font-bold">Name</div>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Category name"
                  required
                  className="w-full bg-transparent outline-none font-bold text-sm"
                />
              </div>
              <div>
                <div className="text-[10px] text-[#7c8e88] font-bold mb-2">Type</div>
                <div className="relative flex bg-[#f0f5f2] rounded-lg p-1 overflow-hidden">
                  <div
                    className="absolute inset-y-1 left-1 w-1/2 rounded-md bg-white shadow-sm transition-transform duration-150"
                    style={{
                      transform: `translateX(${Math.max(0, TYPE_OPTIONS.indexOf(categoryForm.type)) * 100}%)`,
                    }}
                    aria-hidden="true"
                  />
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, type: t })}
                      className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer ${
                        categoryForm.type === t
                          ? 'text-[#1f644e]'
                          : 'text-[#7c8e88] hover:text-[#1e3a34]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#7c8e88] font-bold mb-2">Color</div>
                <div className="grid grid-cols-6 gap-3">
                  {categoryColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`w-10 h-10 rounded-full transition cursor-pointer ${
                        categoryForm.color === color ? 'ring-2 ring-[#1f644e] ring-offset-2' : ''
                      } ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#7c8e88] font-bold mb-2">Icon</div>
                <div className="grid grid-cols-6 gap-2">
                  {categoryIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, icon })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
                        categoryForm.icon === icon
                          ? 'bg-[#1f644e] text-white'
                          : 'bg-[#f0f5f2] text-[#7c8e88] hover:bg-[#d6dfd9]'
                      }`}
                    >
                      <IconRenderer name={icon} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  disabled={categorySubmitting}
                  className="border border-[#1f644e] text-[#1f644e] px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="bg-[#1f644e] text-white px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {categorySubmitting ? 'Saving...' : editingCategory ? 'SAVE' : 'ADD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e3a34]">
                {editingBudget ? 'Edit Budget' : 'New Budget'}
              </h3>
              <button
                onClick={closeBudgetModal}
                className="text-[#7c8e88] hover:bg-[#f0f5f2] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                  Category
                </label>
                <select
                  required
                  value={budgetFormData.category}
                  onChange={(e) => setBudgetFormData((p) => ({ ...p, category: e.target.value }))}
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
                  value={budgetFormData.amount}
                  onChange={(e) => setBudgetFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-4 py-3 text-sm font-medium text-[#1e3a34] outline-none focus:border-[#1f644e]"
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
                  Period
                </label>
                <select
                  value={budgetFormData.period}
                  onChange={(e) => setBudgetFormData((p) => ({ ...p, period: e.target.value }))}
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

      {/* Category Selector Bottom Sheet for Budgets */}
      <BottomSheet
        open={showBudgetCategorySelector}
        onClose={() => setShowBudgetCategorySelector(false)}
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
                  setBudgetFormData((p) => ({ ...p, category: cat.id || cat._id }));
                  setShowBudgetCategorySelector(false);
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
