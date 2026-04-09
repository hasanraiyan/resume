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
import BottomSheet from './BottomSheet';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Compact formatter for large amounts, e.g. 45K, 1.2Cr
const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
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
  const [mobileActionTransaction, setMobileActionTransaction] = useState(null);
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

  const formatCurrencyWithCompact = (amount) => {
    const abs = Math.abs(amount);
    const useCompact = abs >= 100000; // Use compact notation from 1L upwards
    const formatted = useCompact
      ? compactNumberFormatter.format(abs)
      : currencyFormatter.format(abs);
    return `₹${formatted}`;
  };

  const formatAmount = (amount, type) => {
    const sign = type === 'transfer' ? '' : type === 'expense' ? '-' : '+';
    const formatted = formatCurrencyWithCompact(amount);
    return `${sign}${formatted}`;
  };

  const getAmountClass = (type) => {
    if (type === 'expense') return 'text-[#c94c4c]';
    if (type === 'income') return 'text-[#1f644e]';
    return 'text-[#1e3a34]';
  };

  const netFlow = totalIncome - totalExpense;

  const formatNetFlow = (value) => {
    const sign = value < 0 ? '-' : '+';
    // Reuse compact formatting for consistency across UI
    const formatted = formatCurrencyWithCompact(value);
    return `${sign}${formatted}`;
  };

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
    <div className="mb-6 bg-[#fcfbf5] pt-4 pb-24 sm:pt-6 sm:pb-8">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Summary */}
          <div className="mb-4">
            {/* Mobile: 3-column minimal summary, no icons */}
            <div className="sm:hidden">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#e5e3d8] bg-white px-2.5 py-2 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Expense
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#c94c4c]">
                    {formatCurrencyWithCompact(totalExpense)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e5e3d8] bg-white px-2.5 py-2 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Income
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#1f644e]">
                    {formatCurrencyWithCompact(totalIncome)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e5e3d8] bg-white px-2.5 py-2 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Net Flow
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-bold ${netFlow >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                  >
                    {formatNetFlow(netFlow)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tablet & desktop: existing grid */}
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4">
              <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c94c4c]/10">
                  <TrendingDown className="h-6 w-6 text-[#c94c4c]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Expense
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#c94c4c]">
                    {formatCurrencyWithCompact(totalExpense)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1f644e]/10">
                  <TrendingUp className="h-6 w-6 text-[#1f644e]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Income
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#1f644e]">
                    {formatCurrencyWithCompact(totalIncome)}
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
                    {formatNetFlow(netFlow)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex w-full items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                disabled={isTabLoading}
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e5e3d8] bg-white transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-5 w-5 text-[#1e3a34]" />
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-center rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-center">
                <span className="truncate text-lg font-bold text-[#1e3a34]">
                  {periodRangeLabel}
                </span>
              </div>
              <button
                onClick={() => navigateWeek(1)}
                disabled={isTabLoading}
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e5e3d8] bg-white transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                aria-label="Next week"
              >
                <ChevronRight className="h-5 w-5 text-[#1e3a34]" />
              </button>
            </div>

            {isRefreshingRecords && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e6df] bg-[#f0f5f2] px-3 py-1 text-xs font-semibold text-[#1f644e]">
                <div className="h-2 w-2 rounded-full bg-[#1f644e] animate-pulse" />
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
                          className={`relative flex items-center justify-between p-3 sm:p-4 transition hover:bg-[#f8f9f4] first:rounded-t-xl last:rounded-b-xl ${isMenuOpen ? 'z-10' : ''}`}
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
                              <div className="text-[13px] sm:text-sm font-bold text-[#1e3a34]">
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
                                  <div className="mt-0.5 hidden text-xs text-[#7c8e88] sm:block">
                                    {transaction.description}
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`max-w-[40vw] truncate text-right text-xs sm:text-sm font-bold tabular-nums ${getAmountClass(transaction.type)}`}
                            >
                              {formatAmount(transaction.amount, transaction.type)}
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => {
                                  // On mobile, open a bottom sheet; on larger screens, use popover menu.
                                  if (window.innerWidth < 640) {
                                    setMobileActionTransaction(transaction);
                                  } else {
                                    setOpenMenuId(isMenuOpen ? null : transaction.id);
                                  }
                                }}
                                className="cursor-pointer rounded-lg p-1.5 text-[#7c8e88] transition hover:bg-[#f8f9f4] hover:text-[#1e3a34]"
                                aria-label="Transaction options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  ref={menuRef}
                                  className="absolute right-0 top-full z-10 mt-1 hidden w-32 rounded-xl border border-[#e5e3d8] bg-white py-1 shadow-lg sm:block"
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

          {/* Mobile bottom sheet for transaction actions */}
          <BottomSheet
            open={Boolean(mobileActionTransaction)}
            onClose={() => setMobileActionTransaction(null)}
            className="max-h-[70vh] overflow-y-auto"
          >
            {mobileActionTransaction && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7c8e88]">
                    Transaction options
                  </p>
                  <div className="w-8" />
                </div>
                <p className="mb-3 text-sm font-bold text-[#1e3a34] line-clamp-1">
                  {mobileActionTransaction.description ||
                    mobileActionTransaction.category?.name ||
                    'Transaction'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    openEditTransaction(mobileActionTransaction);
                    setMobileActionTransaction(null);
                  }}
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-[#d9e6df] bg-[#f7faf9] px-3 py-3 text-sm font-semibold text-[#1f644e]"
                >
                  <span>Edit transaction</span>
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDelete(mobileActionTransaction.id);
                    setMobileActionTransaction(null);
                  }}
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-[#f5c6c6] bg-[#fdf5f5] px-3 py-3 text-sm font-semibold text-[#c94c4c]"
                >
                  <span>Delete transaction</span>
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </BottomSheet>
        </div>
      </div>
    </div>
  );
}
