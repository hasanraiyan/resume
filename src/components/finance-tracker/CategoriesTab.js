'use client';

import { useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { MoreVertical, Edit3, Trash2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

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
    if (editingCategory) {
      await updateCategory(editingCategory.id, form);
    } else {
      await addCategory(form);
    }
    resetForm();
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

  const renderCategoryList = (cats, title) => (
    <div className="mb-6">
      <div className="border-b-2 border-[#1f644e] text-xs font-bold text-[#1f644e] pb-1 mb-2 px-4">
        {title}
      </div>
      {cats.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between py-2 px-4 relative hover:bg-[#f8f9f4] transition"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-full ${cat.color || 'bg-[#1f644e]'} text-white flex items-center justify-center`}
            >
              <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm">{cat.name}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
              className="p-1 text-[#7c8e88] hover:text-[#1e3a34] transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen === cat.id && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e3d8] shadow-md rounded py-1 z-20 w-24">
                <button
                  onClick={() => startEdit(cat)}
                  className="px-3 py-1.5 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="px-3 py-1.5 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left text-[#c94c4c]"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="pb-4">
      {/* Content - Centered horizontally */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          {/* Net Worth Header */}
          <div className="font-bold text-sm my-4 px-4">
            [ All Accounts ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ]
          </div>

          {renderCategoryList(incomeCategories, 'Income categories')}
          {renderCategoryList(expenseCategories, 'Expense categories')}

          {/* Add Button */}
          <div className="flex mt-6 px-4">
            <button
              onClick={() => setShowForm(true)}
              className="border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded text-sm font-bold flex items-center gap-1 hover:bg-[#1f644e] hover:text-white transition"
            >
              <Plus className="w-4 h-4" /> ADD NEW CATEGORY
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-sm rounded-lg border border-[#e5e3d8] shadow-xl p-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">
              {editingCategory ? 'Edit category' : 'Add category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border border-[#1f644e] rounded px-3 py-2 bg-[#f0f5f2]">
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
                      className={`flex-1 py-2 text-xs font-bold uppercase rounded transition ${
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
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categoryColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full flex-shrink-0 transition ${
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
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
                  className="border border-[#1f644e] text-[#1f644e] px-6 py-1.5 rounded text-sm font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#1f644e] text-white px-6 py-1.5 rounded text-sm font-bold"
                >
                  {editingCategory ? 'SAVE' : 'ADD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
