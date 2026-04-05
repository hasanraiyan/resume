'use client';

import { useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Search,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { PurseSVG } from '@/components/finance-tracker/IconRenderer';
import dynamic from 'next/dynamic';

import IconRenderer from './IconRenderer';

export default function RecordsTab() {
  const {
    transactions,
    totalExpense,
    totalIncome,
    periodStart,
    periodEnd,
    setPeriod,
    deleteTransaction,
  } = useMoney();
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const navigateWeek = (direction) => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    start.setDate(start.getDate() + direction * 7);
    end.setDate(end.getDate() + direction * 7);
    setPeriod(start.toISOString(), end.toISOString());
  };

  const formatPeriodRange = () => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  };

  const filteredTransactions = searchQuery
    ? transactions.filter(
        (t) =>
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.account?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions;

  const grouped = filteredTransactions.reduce((groups, t) => {
    const dateKey = new Date(t.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
    return groups;
  }, {});

  const formatAmount = (amount, type) => {
    const formatted = Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (type === 'transfer') return `₹${formatted}`;
    return `${type === 'expense' ? '-' : '+'}₹${formatted}`;
  };

  const getAmountClass = (type) => {
    if (type === 'expense') return 'text-[#c94c4c]';
    if (type === 'income') return 'text-[#1f644e]';
    return 'text-[#1e3a34]';
  };

  const netFlow = totalIncome - totalExpense;

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async (id) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                <p className="text-xl font-bold text-[#1f644e] mt-0.5">
                  ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${netFlow >= 0 ? 'bg-[#1f644e]/10' : 'bg-[#c94c4c]/10'}`}
              >
                <PurseSVG
                  className={`w-6 h-6 ${netFlow >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  Net Flow
                </p>
                <p
                  className={`text-xl font-bold mt-0.5 ${netFlow >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                >
                  {netFlow < 0 ? '-' : ''}₹
                  {Math.abs(netFlow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Period Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 rounded-lg bg-white border border-[#e5e3d8] hover:bg-[#f8f9f4] transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-[#1e3a34]" />
              </button>
              <span className="text-sm font-bold text-[#1e3a34]">{formatPeriodRange()}</span>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 rounded-lg bg-white border border-[#e5e3d8] hover:bg-[#f8f9f4] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-[#1e3a34]" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-white border border-[#e5e3d8] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#1f644e] transition placeholder:text-[#7c8e88]"
              />
            </div>
          </div>

          {/* Transaction Groups */}
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-[#7c8e88]" />
              </div>
              <p className="text-sm font-bold text-[#1e3a34] mb-1">
                {searchQuery ? 'No matching transactions' : 'No transactions'}
              </p>
              <p className="text-xs text-[#7c8e88]">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Transactions for this period will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                      {dateLabel}
                    </h3>
                    <div className="flex-1 h-px bg-[#e5e3d8]" />
                    <span className="text-[10px] font-bold text-[#7c8e88]">
                      {items.length} transaction{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="bg-white border border-[#e5e3d8] rounded-xl overflow-hidden divide-y divide-[#e5e3d8]">
                    {items.map((t) => {
                      const isExpense = t.type === 'expense';
                      const isTransfer = t.type === 'transfer';
                      const catIcon = t.category?.icon || 'tag';
                      const catName = t.category?.name || 'Uncategorized';

                      // Check if this transaction is being deleted
                      const isDeleteConfirm = deleteConfirmId === t.id;

                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-4 hover:bg-[#f8f9f4] transition"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                                isTransfer
                                  ? 'bg-[#4a86e8]'
                                  : isExpense
                                    ? 'bg-[#c94c4c]'
                                    : 'bg-[#1f644e]'
                              }`}
                            >
                              <IconRenderer
                                name={isTransfer ? 'arrow-left-right' : catIcon}
                                className="w-5 h-5"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-[#1e3a34]">
                                {isTransfer ? 'Transfer' : catName}
                              </div>
                              <div className="text-[11px] text-[#7c8e88] mt-0.5 flex items-center gap-1">
                                {isTransfer ? (
                                  <>
                                    {t.account?.name || 'Account'}
                                    <ArrowLeftRight className="w-3 h-3" />
                                    {t.toAccount?.name || 'Account'}
                                  </>
                                ) : (
                                  t.account?.name || 'Account'
                                )}
                              </div>
                              {t.description &&
                                t.description !== 'Transaction' &&
                                t.description !== 'Transfer' && (
                                  <div className="text-xs text-[#7c8e88] mt-0.5">
                                    {t.description}
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isDeleteConfirm ? (
                              <>
                                <button
                                  onClick={() => handleDeleteConfirm(t.id)}
                                  className="px-2 py-1 text-xs bg-[#c94c4c] text-white rounded-lg hover:bg-[#b03c3c] transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={handleDeleteCancel}
                                  className="px-2 py-1 text-xs bg-[#7c8e88] text-white rounded-lg hover:bg-[#6a7c76] transition"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <div
                                  className={`text-sm font-bold tabular-nums ${getAmountClass(t.type)}`}
                                >
                                  {formatAmount(t.amount, t.type)}
                                </div>
                                <button
                                  onClick={() => handleDeleteClick(t.id)}
                                  className="p-1.5 rounded-lg text-[#7c8e88] hover:text-[#c94c4c] hover:bg-[#fdf2f2] transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
