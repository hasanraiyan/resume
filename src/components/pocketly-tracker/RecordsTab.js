'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
  RefreshCw,
  Undo2,
  X,
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

export default function RecordsTab({
  selectedType: propSelectedType,
  setSelectedType: propSetSelectedType,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
}) {
  const {
    transactions,
    totalExpense,
    totalIncome,
    periodStart,
    periodEnd,
    periodType,
    setPeriod,
    navigatePeriod,
    deleteTransaction,
    openEditTransaction,
    isTabLoading,
    isBootstrapLoading,
    fetchTransactionsForPeriod,
    fetchAccountsSummary,
  } = useMoney();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [mobileActionTransaction, setMobileActionTransaction] = useState(null);
  const [swipedTxId, setSwipedTxId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localSelectedType, setLocalSelectedType] = useState('all');
  const [deletedTransaction, setDeletedTransaction] = useState(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState(null);
  const menuRef = useRef(null);
  const swipeTouchRef = useRef(null);
  const scrollRef = useRef(null);
  const pullRefreshTouchRef = useRef(null);

  const selectedType = propSelectedType !== undefined ? propSelectedType : localSelectedType;
  const setSelectedType =
    propSetSelectedType !== undefined ? propSetSelectedType : setLocalSelectedType;
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery =
    propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    function handleTouchOutside(event) {
      if (swipedTxId && !event.target.closest('[data-delete-btn]')) {
        setSwipedTxId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [swipedTxId]);

  useEffect(() => {
    return () => {
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
    };
  }, [undoTimeoutId]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.description?.toLowerCase().includes(normalizedQuery) ||
          transaction.category?.name?.toLowerCase().includes(normalizedQuery) ||
          transaction.account?.name?.toLowerCase().includes(normalizedQuery)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((transaction) => transaction.type === selectedType);
    }

    return filtered;
  }, [searchQuery, transactions, selectedType]);

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

  const formatExactAmount = (amount, type) => {
    const sign = type === 'transfer' ? '' : type === 'expense' ? '-' : '+';
    const formatted = currencyFormatter.format(Math.abs(amount));
    return `${sign}₹${formatted}`;
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
      const txToDelete = transactions.find((tx) => tx.id === id);
      if (txToDelete) {
        setDeletedTransaction(txToDelete);
        if (undoTimeoutId) clearTimeout(undoTimeoutId);

        const timeoutId = setTimeout(async () => {
          await deleteTransaction(id);
          setDeletedTransaction(null);
        }, 5000);

        setUndoTimeoutId(timeoutId);
      }
      setOpenMenuId(null);
      setSwipedTxId(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleUndo = () => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
    setDeletedTransaction(null);
  };

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchTransactionsForPeriod(periodStart, periodEnd),
        fetchAccountsSummary(),
      ]);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchTransactionsForPeriod, fetchAccountsSummary, periodStart, periodEnd]);

  const hasTransactions = transactions.length > 0;
  const isRefreshingRecords = isTabLoading && hasTransactions;
  const showEmptyState = !isBootstrapLoading && groupedEntries.length === 0;

  return (
    <div
      className="mb-6 bg-[#fcfbf5] pt-4 pb-24 sm:pt-6 sm:pb-8"
      onTouchStart={(e) => {
        if (window.scrollY > 5) return;
        pullRefreshTouchRef.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (pullRefreshTouchRef.current === null) return;
        const dy = e.touches[0].clientY - pullRefreshTouchRef.current;
        if (dy > 10) {
          e.preventDefault();
        }
      }}
      onTouchEnd={(e) => {
        if (pullRefreshTouchRef.current === null) return;
        const dy = e.changedTouches[0].clientY - pullRefreshTouchRef.current;
        pullRefreshTouchRef.current = null;
        if (dy > 60 && !isRefreshing) {
          handleRefresh();
        }
      }}
    >
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

          <div className="lg:hidden sticky top-14 z-10 mb-3 flex flex-col gap-3 bg-[#fcfbf5] pb-3">
            <div className="flex gap-2 overflow-x-auto px-4">
              {[
                { id: 'all', label: 'All' },
                { id: 'income', label: 'Income' },
                { id: 'expense', label: 'Expense' },
                { id: 'transfer', label: 'Transfer' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition border cursor-pointer shrink-0 ${
                    selectedType === tab.id
                      ? 'bg-[#1f644e] text-white border-[#1f644e]'
                      : 'border-[#e5e3d8] text-[#7c8e88] bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
                      const isDeleted = deletedTransaction?.id === transaction.id;

                      return (
                        <div
                          key={transaction.id}
                          className={`relative overflow-hidden first:rounded-t-xl last:rounded-b-xl sm:overflow-visible transition-opacity ${
                            isDeleted ? 'opacity-50' : 'opacity-100'
                          }`}
                        >
                          <div
                            className={`absolute inset-y-0 right-0 z-0 flex items-center pr-1 transition-opacity duration-200 sm:hidden ${
                              swipedTxId === transaction.id
                                ? 'opacity-100'
                                : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            <button
                              data-delete-btn
                              onClick={() => handleDelete(transaction.id)}
                              className="flex h-3/4 items-center gap-1.5 rounded-xl bg-[#c94c4c] px-5 text-xs font-bold text-white shadow-md active:scale-95 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                          <div
                            className={`relative flex items-center justify-between p-3 sm:p-4 transition hover:bg-[#f8f9f4] bg-white ${isMenuOpen ? 'z-10' : ''}`}
                            style={{
                              transform:
                                swipedTxId === transaction.id
                                  ? 'translateX(-100px)'
                                  : 'translateX(0)',
                              transition: 'transform 0.2s ease',
                            }}
                            onTouchStart={(e) => {
                              if (window.innerWidth >= 640) return;
                              swipeTouchRef.current = {
                                startX: e.touches[0].clientX,
                                startY: e.touches[0].clientY,
                                txId: transaction.id,
                                moved: false,
                              };
                            }}
                            onTouchMove={(e) => {
                              if (
                                !swipeTouchRef.current ||
                                swipeTouchRef.current.txId !== transaction.id
                              )
                                return;
                              const dx = e.touches[0].clientX - swipeTouchRef.current.startX;
                              const dy = e.touches[0].clientY - swipeTouchRef.current.startY;
                              if (
                                !swipeTouchRef.current.moved &&
                                Math.abs(dx) > 10 &&
                                Math.abs(dx) > Math.abs(dy)
                              ) {
                                swipeTouchRef.current.moved = true;
                              }
                              if (swipeTouchRef.current.moved) {
                                e.preventDefault();
                                const translateX = Math.max(
                                  -100,
                                  Math.min(swipedTxId === transaction.id ? -100 : 0, dx)
                                );
                                e.currentTarget.style.transform = `translateX(${translateX}px)`;
                                e.currentTarget.style.transition = 'none';
                              }
                            }}
                            onTouchEnd={(e) => {
                              if (
                                !swipeTouchRef.current ||
                                swipeTouchRef.current.txId !== transaction.id
                              )
                                return;
                              const moved = swipeTouchRef.current.moved;
                              const dx = e.changedTouches[0].clientX - swipeTouchRef.current.startX;
                              swipeTouchRef.current = null;
                              if (!moved) return;
                              if (dx < -40) {
                                if (swipedTxId === transaction.id) return;
                                setSwipedTxId(transaction.id);
                                e.currentTarget.style.transform = 'translateX(-100px)';
                                e.currentTarget.style.transition = 'transform 0.2s ease';
                              } else {
                                setSwipedTxId(null);
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.transition = 'transform 0.2s ease';
                              }
                            }}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {deletedTransaction && (
            <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between rounded-xl bg-[#1e3a34] px-4 py-3 text-white shadow-lg sm:left-auto sm:right-6 sm:w-auto sm:max-w-sm">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-semibold">Transaction deleted</span>
              </div>
              <button
                onClick={handleUndo}
                className="ml-4 flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                <Undo2 className="h-3 w-3" />
                Undo
              </button>
              <button
                onClick={() => setDeletedTransaction(null)}
                className="ml-2 rounded-lg p-1 text-white/60 transition hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
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
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                      mobileActionTransaction.type === 'transfer'
                        ? 'bg-[#4a86e8]'
                        : mobileActionTransaction.type === 'expense'
                          ? 'bg-[#c94c4c]'
                          : 'bg-[#1f644e]'
                    }`}
                  >
                    <IconRenderer
                      name={
                        mobileActionTransaction.type === 'transfer'
                          ? 'arrow-left-right'
                          : mobileActionTransaction.category?.icon || 'tag'
                      }
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#7c8e88]">
                      {mobileActionTransaction.type === 'transfer'
                        ? 'Transfer'
                        : mobileActionTransaction.category?.name || 'Uncategorized'}
                    </p>
                    <p className="text-sm font-bold text-[#1e3a34] line-clamp-2">
                      {mobileActionTransaction.description &&
                      mobileActionTransaction.description !== 'Transaction' &&
                      mobileActionTransaction.description !== 'Transfer'
                        ? mobileActionTransaction.description
                        : mobileActionTransaction.account?.name || 'Account'}
                    </p>
                    <p className="mt-1 text-[11px] text-[#7c8e88]">
                      {mobileActionTransaction.type === 'transfer' ? (
                        <>
                          {mobileActionTransaction.account?.name || 'Account'}
                          <span className="mx-1">→</span>
                          {mobileActionTransaction.toAccount?.name || 'Account'}
                        </>
                      ) : (
                        mobileActionTransaction.account?.name || 'Account'
                      )}
                    </p>
                  </div>
                  <div className="ml-2 text-right text-sm font-bold tabular-nums">
                    {formatExactAmount(
                      mobileActionTransaction.amount,
                      mobileActionTransaction.type
                    )}
                  </div>
                </div>

                <div className="mb-3 h-px w-full bg-[#e5e3d8]" />

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7c8e88]">
                    Transaction options
                  </p>
                  <div className="w-8" />
                </div>

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
