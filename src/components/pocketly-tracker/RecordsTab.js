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
  Repeat,
  Filter,
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

export default function RecordsTab() {
  const {
    transactions,
    accounts,
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
  } = useMoney();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    types: [],
    accounts: [],
  });
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

  const navigatePeriodHandler = (direction) => {
    navigatePeriod(direction);
  };

  const handlePeriodTypeChange = (type) => {
    const now = new Date();
    let start, end;

    if (type === 'day') {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to week
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      start = d;

      const e = new Date(start);
      e.setDate(start.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      end = e;
    }

    setPeriod(start.toISOString(), end.toISOString(), type);
  };

  const periodRangeLabel = useMemo(() => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (periodType === 'day') {
      return start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (periodType === 'month') {
      return start.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }

    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  }, [periodEnd, periodStart, periodType]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category?.name?.toLowerCase().includes(q) ||
          t.account?.name?.toLowerCase().includes(q)
      );
    }

    if (filters.startDate) {
      result = result.filter((t) => new Date(t.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.date) <= end);
    }
    if (filters.minAmount) {
      result = result.filter((t) => t.amount >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter((t) => t.amount <= Number(filters.maxAmount));
    }
    if (filters.types.length > 0) {
      result = result.filter((t) => filters.types.includes(t.type));
    }
    if (filters.accounts.length > 0) {
      result = result.filter(
        (t) => filters.accounts.includes(t.account?.id) || filters.accounts.includes(t.toAccount?.id)
      );
    }

    return result;
  }, [searchQuery, transactions, filters]);

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

          <div className="mb-3 flex flex-col gap-3">
            {/* Period Type Toggle */}
            <div className="flex bg-white border border-[#e5e3d8] rounded-xl p-1">
              {['day', 'week', 'month'].map((type) => (
                <button
                  key={type}
                  onClick={() => handlePeriodTypeChange(type)}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    periodType === type
                      ? 'bg-[#1f644e] text-white shadow-sm'
                      : 'text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex w-full items-center gap-2">
              <button
                onClick={() => navigatePeriodHandler(-1)}
                disabled={isTabLoading}
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e5e3d8] bg-white transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                aria-label="Previous period"
              >
                <ChevronLeft className="h-5 w-5 text-[#1e3a34]" />
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-center rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-center">
                <span className="truncate text-lg font-bold text-[#1e3a34]">
                  {periodRangeLabel}
                </span>
              </div>
              <button
                onClick={() => navigatePeriodHandler(1)}
                disabled={isTabLoading}
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e5e3d8] bg-white transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
                aria-label="Next period"
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

          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8e88]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 rounded-xl border transition-all text-sm font-bold ${showFilters ? 'bg-[#1f644e] border-[#1f644e] text-white shadow-md' : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:text-[#1e3a34]'}`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>

            {showFilters && (
              <div className="bg-white border border-[#e5e3d8] rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#7c8e88] mb-2">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#1f644e]"
                      />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#1f644e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#7c8e88] mb-2">
                      Amount Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minAmount}
                        onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                        className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#1f644e]"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                        className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#1f644e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#7c8e88] mb-2">
                      Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['income', 'expense', 'transfer'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            const types = filters.types.includes(type)
                              ? filters.types.filter((t) => t !== type)
                              : [...filters.types, type];
                            setFilters({ ...filters, types });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${filters.types.includes(type) ? 'bg-[#1f644e] border-[#1f644e] text-white shadow-sm' : 'bg-white border-[#e5e3d8] text-[#7c8e88]'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#7c8e88] mb-2">
                      Account
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto no-scrollbar">
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            const accs = filters.accounts.includes(acc.id)
                              ? filters.accounts.filter((id) => id !== acc.id)
                              : [...filters.accounts, acc.id];
                            setFilters({ ...filters, accounts: accs });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${filters.accounts.includes(acc.id) ? 'bg-[#1f644e] border-[#1f644e] text-white shadow-sm' : 'bg-white border-[#e5e3d8] text-[#7c8e88]'}`}
                        >
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e5e3d8] flex justify-end">
                  <button
                    onClick={() =>
                      setFilters({
                        startDate: '',
                        endDate: '',
                        minAmount: '',
                        maxAmount: '',
                        types: [],
                        accounts: [],
                      })
                    }
                    className="text-xs font-bold text-[#c94c4c] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

            {/* Filter Chips */}
            {(filters.startDate ||
              filters.endDate ||
              filters.minAmount ||
              filters.maxAmount ||
              filters.types.length > 0 ||
              filters.accounts.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.startDate && (
                  <div className="inline-flex items-center gap-1.5 bg-[#1f644e]/10 text-[#1f644e] px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-[#1f644e]/20">
                    From: {filters.startDate}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, startDate: '' })}
                    />
                  </div>
                )}
                {filters.endDate && (
                  <div className="inline-flex items-center gap-1.5 bg-[#1f644e]/10 text-[#1f644e] px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-[#1f644e]/20">
                    To: {filters.endDate}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, endDate: '' })}
                    />
                  </div>
                )}
                {filters.types.map((t) => (
                  <div
                    key={t}
                    className="inline-flex items-center gap-1.5 bg-[#1f644e]/10 text-[#1f644e] px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-[#1f644e]/20"
                  >
                    {t}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, types: filters.types.filter((x) => x !== t) })
                      }
                    />
                  </div>
                ))}
                {filters.accounts.map((id) => (
                  <div
                    key={id}
                    className="inline-flex items-center gap-1.5 bg-[#1f644e]/10 text-[#1f644e] px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-[#1f644e]/20"
                  >
                    {accounts.find((a) => a.id === id)?.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, accounts: filters.accounts.filter((x) => x !== id) })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {showEmptyState ? (
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-12 text-center flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f0f5f2] text-[#1f644e]">
                <Receipt className="h-10 w-10" />
              </div>
              <h3 className="mb-1 text-lg font-black text-[#1e3a34]">
                {searchQuery ? 'No results found' : 'No transactions yet'}
              </h3>
              <p className="mb-8 text-sm text-[#7c8e88] max-w-[240px] mx-auto leading-relaxed">
                {searchQuery
                  ? "We couldn't find any transactions matching your search term."
                  : 'Start tracking your spending by adding your first transaction today.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => openEditTransaction({})} // Open empty modal
                  className="px-6 py-2.5 bg-[#1f644e] text-white text-sm font-bold rounded-xl hover:bg-[#17503e] transition-all active:scale-95 shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              )}
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
                            <div className="relative">
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
                              {transaction.recurringId && (
                                <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm border border-[#e5e3d8]">
                                  <Repeat className="w-2.5 h-2.5 text-[#4a86e8]" />
                                </div>
                              )}
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
                              {transaction.note && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#7c8e88] italic">
                                  <div className="h-1 w-1 rounded-full bg-[#e5e3d8]" />
                                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                                    {transaction.note}
                                  </span>
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
                                  {transaction.recurringId && (
                                    <button
                                      onClick={async () => {
                                        if (confirm('Stop this recurring series?')) {
                                          await fetch(`/api/money/recurring/${transaction.recurringId}`, { method: 'DELETE' });
                                          setOpenMenuId(null);
                                        }
                                      }}
                                      className="cursor-pointer flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-bold text-[#7c8e88] transition hover:bg-neutral-50"
                                    >
                                      <X className="h-3 w-3" />
                                      Stop Series
                                    </button>
                                  )}
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
                    {mobileActionTransaction.note && (
                      <p className="mt-1 text-xs text-[#7c8e88] italic">
                        &quot;{mobileActionTransaction.note}&quot;
                      </p>
                    )}
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
