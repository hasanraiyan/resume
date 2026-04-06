'use client';

import { useEffect, useRef, useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { MoreVertical, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { PurseSVG } from '@/components/pocketly-tracker/IconRenderer';
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
  'rupay',
  'ippb',
  'pnb',
];

const iconColors = [
  { bg: 'bg-orange-100', text: 'text-orange-500', border: 'border-orange-200' },
  { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-red-100', text: 'text-red-500', border: 'border-red-200' },
];

const getAccountIconClass = (icon, context = 'card') => {
  if (context === 'picker') {
    if (icon === 'wallet' || icon === 'purse') return 'w-7 h-7 object-contain';
    if (icon === 'ippb' || icon === 'pnb') return 'w-7 h-5 object-contain';
    if (icon === 'rupay') return 'w-5 h-5 object-contain';
    return 'w-4 h-4 scale-125';
  }

  if (icon === 'wallet' || icon === 'purse') return 'w-10 h-10 object-contain';
  if (icon === 'ippb' || icon === 'pnb') return 'w-10 h-8 object-contain';
  if (icon === 'rupay') return 'w-7 h-7 object-contain';
  return 'w-6 h-6 scale-125';
};

export default function AccountsTab({ openAddModal = false, onAddModalClose }) {
  const {
    accounts,
    accountsWithBalance,
    totalBalance,
    totalExpense,
    totalIncome,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useMoney();

  // Use accountsWithBalance if available, otherwise fall back to accounts
  const displayAccounts = accountsWithBalance || accounts;
  const [editingAccount, setEditingAccount] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', icon: 'wallet', initialBalance: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (openAddModal) {
      setShowForm(true);
      onAddModalClose?.();
    }
  }, [openAddModal, onAddModalClose]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, form);
      } else {
        await addAccount(form);
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
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
    if (!confirm('Delete this account?')) {
      setMenuOpen(null);
      return;
    }

    setDeletingAccountId(id);
    try {
      await deleteAccount(id);
      setMenuOpen(null);
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setDeletingAccountId(null);
    }
  };

  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <PurseSVG className="w-6 h-6 text-[#1f644e]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  Total Balance
                </p>
                <p className="text-xl font-bold text-[#1e3a34] mt-0.5">
                  ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c94c4c]/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-[#c94c4c]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">Expense</p>
                <p className="text-xl font-bold text-[#c94c4c] mt-0.5">
                  ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-[#1f644e]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">Income</p>
                <p className="text-xl font-bold text-[#1e3a34] mt-0.5">
                  ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#1f644e]">Your Accounts</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 border border-[#1f644e] text-[#1f644e] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1f644e] hover:text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Account
            </button>
          </div>

          {displayAccounts.length === 0 ? (
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4">
                <PurseSVG className="w-8 h-8 text-[#7c8e88]" />
              </div>
              <p className="text-sm font-bold text-[#1e3a34] mb-1">No accounts yet</p>
              <p className="text-xs text-[#7c8e88] mb-4">
                Create your first account to start tracking money
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#1f644e] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer"
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayAccounts.map((account, index) => {
                const colorSet = iconColors[index % iconColors.length];
                return (
                  <div
                    key={account.id}
                    className="bg-white border border-[#e5e3d8] rounded-xl p-5 relative hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 ${colorSet.bg} ${colorSet.text} rounded-xl ${colorSet.border} border flex items-center justify-center overflow-hidden shrink-0`}
                      >
                        <IconRenderer
                          name={account.icon}
                          className={getAccountIconClass(account.icon)}
                        />
                      </div>
                      <div className="relative" ref={menuOpen === account.id ? menuRef : null}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === account.id ? null : account.id)}
                          aria-haspopup="menu"
                          aria-expanded={menuOpen === account.id}
                          disabled={deletingAccountId === account.id}
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[#7c8e88] transition hover:bg-[#f0f5f2] hover:text-[#1e3a34] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === account.id && (
                          <div className="absolute right-0 top-full z-20 mt-2 w-36 overflow-hidden rounded-xl border border-[#e5e3d8] bg-white py-1 shadow-lg">
                            <button
                              onClick={() => startEdit(account)}
                              className="flex min-h-10 w-full cursor-pointer items-center px-3 py-2 text-left text-xs font-bold text-[#1e3a34] transition hover:bg-[#f0f5f2]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              disabled={deletingAccountId === account.id}
                              className="flex min-h-10 w-full cursor-pointer items-center px-3 py-2 text-left text-xs font-bold text-[#c94c4c] transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingAccountId === account.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="font-bold text-sm text-[#1e3a34]">{account.name}</p>
                      <div className="mt-1">
                        <p
                          className={`text-xl font-bold ${(account.currentBalance ?? account.initialBalance) >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                        >
                          ₹
                          {(account.currentBalance ?? account.initialBalance).toLocaleString(
                            'en-IN',
                            { minimumFractionDigits: 2 }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-xl p-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">
              {editingAccount ? 'Edit account' : 'Add account'}
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
                  placeholder="Account name"
                  required
                  className="w-full bg-transparent outline-none font-bold text-sm"
                />
              </div>
              <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
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
                      <IconRenderer name={icon} className={getAccountIconClass(icon, 'picker')} />
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
                  ) : editingAccount ? (
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
