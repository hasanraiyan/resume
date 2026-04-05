'use client';

import { useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { MoreVertical, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

import IconRenderer from './IconRenderer';

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

export default function CategoriesTab() {
  const { categories, totalBalance, addCategory, updateCategory, deleteCategory } = useMoney();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    icon: 'utensils',
    color: 'bg-[#1f644e]',
  });

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, form);
      } else {
        await addCategory(form);
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'expense', icon: 'utensils', color: 'bg-[#1f644e]' });
    setEditingCategory(null);
    setShowForm(false);
  };

  const startEdit = (category) => {
    setForm({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
    setEditingCategory(category);
    setShowForm(true);
    setMenuOpen(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this category?')) {
      await deleteCategory(id);
    }
    setMenuOpen(null);
  };

  const renderCategoryGrid = (cats, title, icon, accentColor) => (
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
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-[#e5e3d8] rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow relative"
            >
              <div
                className={`w-10 h-10 rounded-xl ${cat.color || 'bg-[#1f644e]'} text-white flex items-center justify-center shrink-0`}
              >
                <IconRenderer name={cat.icon} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1e3a34] truncate">{cat.name}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
                  className="p-1.5 text-[#7c8e88] hover:text-[#1e3a34] transition rounded-lg hover:bg-[#f0f5f2] cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen === cat.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e3d8] shadow-lg rounded-lg py-1 z-20 w-28">
                    <button
                      onClick={() => startEdit(cat)}
                      className="px-3 py-2 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="px-3 py-2 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left text-[#c94c4c]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-[#1f644e]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  Income Categories
                </p>
                <p className="text-xl font-bold text-[#1e3a34] mt-0.5">{incomeCategories.length}</p>
              </div>
            </div>
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c94c4c]/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-[#c94c4c]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  Expense Categories
                </p>
                <p className="text-xl font-bold text-[#1e3a34] mt-0.5">
                  {expenseCategories.length}
                </p>
              </div>
            </div>
          </div>

          {/* Income Categories */}
          {renderCategoryGrid(
            incomeCategories,
            'Income',
            <TrendingUp className="w-4 h-4 text-[#1f644e]" />,
            'text-[#1f644e]'
          )}

          {/* Expense Categories */}
          <div className="mt-8">
            {renderCategoryGrid(
              expenseCategories,
              'Expense',
              <TrendingDown className="w-4 h-4 text-[#c94c4c]" />,
              'text-[#c94c4c]'
            )}
          </div>

          {/* Add Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1f644e] hover:text-white transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-xl p-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">
              {editingCategory ? 'Edit category' : 'Add category'}
            </h3>
            {error && (
              <div className="mb-4 bg-[#fef2f2] border border-[#f0d2d2] rounded-lg p-3 text-xs font-bold text-[#c94c4c] text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                <div className="text-[10px] text-[#1f644e] font-bold">Name</div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Category name"
                  required
                  className="w-full bg-transparent outline-none font-bold text-sm"
                />
              </div>
              <div>
                <div className="text-[10px] text-[#7c8e88] font-bold mb-2">Type</div>
                <div className="flex bg-[#f0f5f2] rounded-lg p-1">
                  {['expense', 'income'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 text-xs font-bold uppercase rounded transition cursor-pointer ${
                        form.type === t ? 'bg-[#1f644e] text-white' : 'text-[#7c8e88]'
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
                      onClick={() => setForm({ ...form, color })}
                      className={`w-10 h-10 rounded-full transition cursor-pointer ${
                        form.color === color ? 'ring-2 ring-[#1f644e] ring-offset-2' : ''
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
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
                        form.icon === icon
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
                  onClick={resetForm}
                  disabled={submitting}
                  className="border border-[#1f644e] text-[#1f644e] px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1f644e] text-white px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="opacity-25"
                        />
                        <path
                          d="M4 12a8 8 0 018-8"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="opacity-75"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : editingCategory ? (
                    'SAVE'
                  ) : (
                    'ADD'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
