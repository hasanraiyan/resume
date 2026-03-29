'use client';

import React, { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  Search,
  Menu,
  Calculator,
  Home,
  Tags,
  PieChart,
  FileText,
  Circle,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import CategoryModal from './CategoryModal';
import { saveCategory } from '@/app/(admin)/admin/finance-tracker/actions';

export default function FinanceTrackerClient({
  initialCategories = [],
  summary = { total: 0, income: 0, expense: 0 },
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleAddNew = (type) => {
    setEditingCategory({
      type,
      name: '',
      icon: 'Banknote',
      color: type === 'expense' ? '#e63946' : '#2a9d8f',
    });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (data) => {
    const result = await saveCategory(data);
    if (result.success) {
      if (data._id) {
        setCategories((prev) => prev.map((c) => (c._id === data._id ? result.category : c)));
      } else {
        setCategories((prev) => [...prev, result.category]);
      }
    } else {
      console.error('Failed to save category:', result.error);
    }
    setIsModalOpen(false);
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] md:h-[800px] w-full max-w-md mx-auto bg-[#ECECE5] overflow-hidden md:rounded-3xl shadow-2xl relative md:border-8 border-[#ECECE5]">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-4 bg-[#ECECE5]">
        <button className="p-2 text-gray-800 hover:bg-black/5 rounded-full transition-colors">
          <Menu size={24} strokeWidth={2} />
        </button>
        <h1
          className="text-xl font-medium tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
        >
          MyMoney
        </h1>
        <button className="p-2 text-gray-800 hover:bg-black/5 rounded-full transition-colors">
          <Search size={22} strokeWidth={2} />
        </button>
      </header>

      {/* Summary */}
      <div className="px-6 py-2 pb-6 flex flex-col items-center">
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-gray-700 tracking-widest">
            [ All Accounts ₹{summary.total.toFixed(2)} ]
          </p>
        </div>
        <div className="flex justify-between w-full px-4 gap-4">
          <div className="text-center flex-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Expense So Far
            </p>
            <p className="text-base font-bold text-red-800/80">₹{summary.expense.toFixed(2)}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Income So Far
            </p>
            <p className="text-base font-bold text-gray-800">₹{summary.income.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto bg-[#ECECE5] pb-24 border-t border-[#A8BDB5]">
        <div className="px-5 py-3">
          <h2 className="text-[13px] font-bold text-[#2A5246]">Income categories</h2>
        </div>
        <div className="border-t border-[#A8BDB5]/50">
          <CategoryList items={incomeCategories} onEdit={handleEdit} defaultColor="#2a9d8f" />
        </div>

        <div className="px-5 py-3 mt-4 border-t border-[#A8BDB5]">
          <h2 className="text-[13px] font-bold text-[#2A5246]">Expense categories</h2>
        </div>
        <div className="border-t border-[#A8BDB5]/50">
          <CategoryList items={expenseCategories} onEdit={handleEdit} defaultColor="#e63946" />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => handleAddNew('expense')}
        className="absolute bottom-20 right-6 w-14 h-14 bg-[#D3E0DC] hover:bg-[#c2d4ce] text-[#2A5246] rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 active:scale-95 z-30"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 w-full bg-[#E5E5DE] flex justify-around items-center h-[68px] z-40">
        <NavItem icon={FileText} label="Records" />
        <NavItem icon={PieChart} label="Analysis" />
        <NavItem icon={Calculator} label="Budgets" />
        <NavItem icon={Home} label="Accounts" />
        <NavItem icon={Tags} label="Categories" active={true} />
      </nav>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

function CategoryList({ items, onEdit, defaultColor }) {
  if (items.length === 0) {
    return <div className="px-5 py-4 text-sm text-gray-500 italic">No categories added yet.</div>;
  }
  return (
    <ul>
      {items.map((item) => {
        const IconComponent = Icons[item.icon] || Circle;
        return (
          <li
            key={item._id}
            className="flex items-center justify-between px-5 py-3 hover:bg-[#D3E0DC]/30 transition-colors border-b border-[#A8BDB5]/30"
          >
            <div className="flex items-center space-x-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: item.color || defaultColor }}
              >
                <IconComponent size={20} strokeWidth={2} />
              </div>
              <span className="text-[15px] font-medium text-gray-800">{item.name}</span>
            </div>
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NavItem({ icon: Icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-[#2A5246]' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon size={22} className={active ? 'fill-current' : ''} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
    </button>
  );
}
