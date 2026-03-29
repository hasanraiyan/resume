'use client';

import { useEffect, useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { MoreVertical, Edit3, Trash2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

const accountIcons = [
  'wallet',
  'building-2',
  'piggy-bank',
  'credit-card',
  'banknote',
  'landmark',
  'coins',
  'hand-coins',
  'vault',
  'smartphone',
];

const iconColors = [
  { bg: 'bg-orange-100', text: 'text-orange-500', border: 'border-orange-200' },
  { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-red-100', text: 'text-red-500', border: 'border-red-200' },
];

export default function AccountsTab({ openAddModal = false, onAddModalClose }) {
  const {
    accounts,
    totalBalance,
    totalExpense,
    totalIncome,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useMoney();
  const [editingAccount, setEditingAccount] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'wallet', initialBalance: 0 });

  useEffect(() => {
    if (openAddModal) {
      setShowForm(true);
      onAddModalClose?.();
    }
  }, [openAddModal, onAddModalClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAccount) {
      await updateAccount(editingAccount.id, form);
    } else {
      await addAccount(form);
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: '', icon: 'wallet', initialBalance: 0 });
    setEditingAccount(null);
    setShowForm(false);
  };

  const startEdit = (account) => {
    setForm({ name: account.name, icon: account.icon, initialBalance: account.initialBalance });
    setEditingAccount(account);
    setShowForm(true);
    setMenuOpen(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this account?')) {
      await deleteAccount(id);
    }
    setMenuOpen(null);
  };

  return (
    <div className="pb-4">
      {/* Content */}
      <div className="w-full px-4">
        <div className="w-full max-w-5xl">
          {/* Net Worth Header */}
          <div className="font-bold text-sm my-4 px-4 text-center">
            [ All Accounts ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ]
          </div>

          {/* Summary */}
          <div className="flex text-center border-b border-[#e5e3d8] pb-2 mb-4 px-4">
            <div className="flex-1">
              <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
                Expense so far
              </div>
              <div className="text-sm font-bold text-[#c94c4c]">
                ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
                Income so far
              </div>
              <div className="text-sm font-bold text-[#1e3a34]">
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Section Label */}
          <div className="text-xs font-bold text-[#1f644e] mb-2 px-4">Accounts</div>

          {/* Account List */}
          <div className="px-4 space-y-3">
            {accounts.map((account, index) => {
              const colorSet = iconColors[index % iconColors.length];
              return (
                <div
                  key={account.id}
                  className="border border-[#e5e3d8] bg-[#faf9ed] rounded-lg p-3 flex justify-between items-center relative"
                >
                  <div className="flex gap-3 items-center">
                    <div
                      className={`w-10 h-8 ${colorSet.bg} ${colorSet.text} rounded ${colorSet.border} border flex items-center justify-center`}
                    >
                      <IconRenderer name={account.icon} className="w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{account.name}</div>
                      <div className="text-xs text-[#7c8e88]">
                        Balance: ₹
                        {account.initialBalance.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === account.id ? null : account.id)}
                      className="p-1 text-[#7c8e88] hover:text-[#1e3a34] transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === account.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e3d8] shadow-md rounded py-1 z-20 w-24">
                        <button
                          onClick={() => startEdit(account)}
                          className="px-3 py-1.5 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="px-3 py-1.5 text-xs font-bold hover:bg-[#f0f5f2] w-full text-left text-[#c94c4c]"
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

          {/* Add Button */}
          <div className="flex justify-center mt-6 px-4">
            <button
              onClick={() => setShowForm(true)}
              className="border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded text-sm font-bold flex items-center gap-1 hover:bg-[#1f644e] hover:text-white transition"
            >
              <Plus className="w-4 h-4" /> ADD NEW ACCOUNT
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-sm rounded-lg border border-[#e5e3d8] shadow-xl p-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">
              {editingAccount ? 'Edit account' : 'Add account'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border border-[#1f644e] rounded px-3 py-2 bg-[#f0f5f2]">
                <div className="text-[10px] text-[#1f644e] font-bold">Name</div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Account name"
                  required
                  className="w-full bg-transparent outline-none font-bold text-sm"
                />
              </div>
              <div className="border border-[#1f644e] rounded px-3 py-2 bg-[#f0f5f2]">
                <div className="text-[10px] text-[#1f644e] font-bold">Initial Amount</div>
                <input
                  type="number"
                  step="0.01"
                  value={form.initialBalance}
                  onChange={(e) =>
                    setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-transparent outline-none font-bold text-sm"
                />
              </div>
              <div>
                <div className="text-[10px] text-[#7c8e88] font-bold mb-2">Icon</div>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {accountIcons.map((icon) => (
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
                  className="border border-[#1f644e] text-[#1f644e] px-6 py-1.5 rounded text-sm font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#1f644e] text-white px-6 py-1.5 rounded text-sm font-bold"
                >
                  {editingAccount ? 'SAVE' : 'ADD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
