'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useMoney } from '@/context/MoneyContext';
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Search,
  MoreVertical,
  Trash2,
  Pencil,
} from 'lucide-react';
import { PurseSVG } from '@/components/pocketly-tracker/IconRenderer';

import IconRenderer from './IconRenderer';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function RecordsTab() {
  const {
    transactions,
    totalExpense,
    totalIncome,
    periodStart,
    periodEnd,
    setPeriod,
    deleteTransaction,
    openEditTransaction,
    isTabLoading,
    isBootstrapLoading,
  } = useMoney();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateWeek = (direction) => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    start.setDate(start.getDate() + direction * 7);
    end.setDate(end.getDate() + direction * 7);
    setPeriod(start.toISOString(), end.toISOString());
  };

  const periodRangeLabel = useMemo(() => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  }, [periodEnd, periodStart]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;

    const normalizedQuery = searchQuery.toLowerCase();
    return transactions.filter(
      (transaction) =>
        transaction.description?.toLowerCase().includes(normalizedQuery) ||
        transaction.category?.name?.toLowerCase().includes(normalizedQuery) ||
        transaction.account?.name?.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery, transactions]);

  const groupedEntries = useMemo(() => {
    const groups = filteredTransactions.reduce((accumulator, transaction) => {
      const dateKey = new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'long',
      });
      if (!accumulator[dateKey]) accumulator[dateKey] = [];
      accumulator[dateKey].push(transaction);
      return accumulator;
    }, {});

    return Object.entries(groups);
  }, [filteredTransactions]);

  const formatAmount = (amount, type) => {
    const formatted = currencyFormatter.format(Math.abs(amount));
    if (type === 'transfer') return `₹${formatted}`;
    return `${type === 'expense' ? '-' : '+'}₹${formatted}`;
  };

  const getAmountClass = (type) => {
    if (type === 'expense') return 'text-[#c94c4c]';
    if (type === 'income') return 'text-[#1f644e]';
    return 'text-[#1e3a34]';
  };

  const netFlow = totalIncome - totalExpense;

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const hasTransactions = transactions.length > 0;
  const isRefreshingRecords = isTabLoading && hasTransactions;
  const showEmptyState = !isBootstrapLoading && groupedEntries.length === 0;

  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c94c4c]/10">
                <TrendingDown className="h-6 w-6 text-[#c94c4c]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Expense</p>
                <p className="mt-0.5 text-xl font-bold text-[#c94c4c]">
                  ₹{currencyFormatter.format(totalExpense)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1f644e]/10">
                <TrendingUp className="h-6 w-6 text-[#1f644e]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Income</p>
                <p className="mt-0.5 text-xl font-bold text-[#1f644e]">
                  ₹{currencyFormatter.format(totalIncome)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${netFlow >= 0 ? 'bg-[#1f644e]/10' : 'bg-[#c94c4c]/10'}`}
              >
                <PurseSVG
                  className={`h-6 w-6 ${netFlow >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                  Net Flow
                </p>
                <p
                  className={`mt-0.5 text-xl font-bold ${netFlow >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                >
                  {netFlow < 0 ? '-' : ''}₹{currencyFormatter.format(Math.abs(netFlow))}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                disabled={isTabLoading}
                className="cursor-pointer rounded-lg border border-[#e5e3d8] bg-white p-2 transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4 text-[#1e3a34]" />
              </button>
              <span className="text-sm font-bold text-[#1e3a34]">{periodRangeLabel}</span>
              <button
                onClick={() => navigateWeek(1)}
                disabled={isTabLoading}
                className="cursor-pointer rounded-lg border border-[#e5e3d8] bg-white p-2 transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4 text-[#1e3a34]" />
              </button>
            </div>

            {isRefreshingRecords && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e6df] bg-[#f0f5f2] px-3 py-1 text-xs font-semibold text-[#1f644e]">
                <div className="h-2 w-2 rounded-full bg-[#1f644e] animate-pulse" />
                Refreshing records
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8e88]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search transactions..."
                className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
              />
            </div>
          </div>

          {showEmptyState ? (
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f5f2]">
                <ArrowLeftRight className="h-8 w-8 text-[#7c8e88]" />
              </div>
              <p className="mb-1 text-sm font-bold text-[#1e3a34]">
                {searchQuery ? 'No matching transactions' : 'No transactions'}
              </p>
              <p className="text-xs text-[#7c8e88]">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Transactions for this period will appear here'}
              </p>
            </div>
          ) : (
            <div
              className={`space-y-6 transition-opacity ${isRefreshingRecords ? 'opacity-75' : 'opacity-100'}`}
            >
              {groupedEntries.map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                      {dateLabel}
                    </h3>
                    <div className="h-px flex-1 bg-[#e5e3d8]" />
                    <span className="text-[10px] font-bold text-[#7c8e88]">
                      {items.length} transaction{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#e5e3d8] bg-white divide-y divide-[#e5e3d8]">
                    {items.map((transaction) => {
                      const isExpense = transaction.type === 'expense';
                      const isTransfer = transaction.type === 'transfer';
                      const catIcon = transaction.category?.icon || 'tag';
                      const catName = transaction.category?.name || 'Uncategorized';
                      const isMenuOpen = openMenuId === transaction.id;

                      return (
                        <div
                          key={transaction.id}
                          className={`relative flex items-center justify-between p-4 transition hover:bg-[#f8f9f4] first:rounded-t-xl last:rounded-b-xl ${isMenuOpen ? 'z-10' : ''}`}
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                                isTransfer
                                  ? 'bg-[#4a86e8]'
                                  : isExpense
                                    ? 'bg-[#c94c4c]'
                                    : 'bg-[#1f644e]'
                              }`}
                            >
                              <IconRenderer
                                name={isTransfer ? 'arrow-left-right' : catIcon}
                                className="h-5 w-5"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-[#1e3a34]">
                                {isTransfer ? 'Transfer' : catName}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#7c8e88]">
                                {isTransfer ? (
                                  <>
                                    {transaction.account?.name || 'Account'}
                                    <ArrowLeftRight className="h-3 w-3" />
                                    {transaction.toAccount?.name || 'Account'}
                                  </>
                                ) : (
                                  transaction.account?.name || 'Account'
                                )}
                              </div>
                              {transaction.description &&
                                transaction.description !== 'Transaction' &&
                                transaction.description !== 'Transfer' && (
                                  <div className="mt-0.5 text-xs text-[#7c8e88]">
                                    {transaction.description}
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`text-sm font-bold tabular-nums ${getAmountClass(transaction.type)}`}
                            >
                              {formatAmount(transaction.amount, transaction.type)}
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(isMenuOpen ? null : transaction.id)}
                                className="cursor-pointer rounded-lg p-1.5 text-[#7c8e88] transition hover:bg-[#f8f9f4] hover:text-[#1e3a34]"
                                aria-label="Transaction options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  ref={menuRef}
                                  className="absolute right-0 top-full z-10 mt-1 w-32 rounded-xl border border-[#e5e3d8] bg-white py-1 shadow-lg"
                                >
                                  <button
                                    onClick={() => {
                                      openEditTransaction(transaction);
                                      setOpenMenuId(null);
                                    }}
                                    className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#1e3a34] transition hover:bg-[#f0f5f2]"
                                    aria-label={`Edit transaction: ${transaction.description || 'Transaction'}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <div className="my-1 border-t border-[#e5e3d8]" />
                                  <button
                                    onClick={() => handleDelete(transaction.id)}
                                    className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#c94c4c] transition hover:bg-[#fdf2f2]"
                                    aria-label={`Delete transaction: ${transaction.description || 'Transaction'}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
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
