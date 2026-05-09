'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { X, TrendingDown, TrendingUp, Minus, ArrowRight, BarChart3, PieChart } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function MonthlyReview({ isOpen, onClose }) {
  const { transactions } = useMoney();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = now.getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentData = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastData = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const currentExpense = currentData
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const lastExpense = lastData
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const currentIncome = currentData
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const lastIncome = lastData
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const expenseChange =
      lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;

    // Top categories for current month
    const categoryTotals = {};
    currentData
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name = t.category?.name || 'Uncategorized';
        categoryTotals[name] = (categoryTotals[name] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      currentExpense,
      lastExpense,
      expenseChange,
      currentIncome,
      lastIncome,
      incomeChange,
      topCategories,
    };
  }, [transactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fcfbf5] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#e5e3d8] animate-in zoom-in-95 duration-200">
        <div className="relative p-6 bg-gradient-to-br from-[#1f644e] to-[#144334] text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8d5c8]">
            Monthly Insights
          </p>
          <h2 className="text-2xl font-black mt-1">Reviewing your month</h2>
          <p className="text-xs text-[#a8d5c8] mt-1">
            Here's how your spending changed compared to last month.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#e5e3d8] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-[#7c8e88] uppercase">Spending</p>
                <div
                  className={`flex items-center gap-1 text-[10px] font-bold ${stats.expenseChange > 0 ? 'text-[#c94c4c]' : 'text-[#1f644e]'}`}
                >
                  {stats.expenseChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stats.expenseChange).toFixed(1)}%
                </div>
              </div>
              <p className="text-xl font-black text-[#1e3a34]">
                {currencyFormatter.format(stats.currentExpense)}
              </p>
              <p className="text-[10px] text-[#7c8e88] mt-1">
                Last month: {currencyFormatter.format(stats.lastExpense)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#e5e3d8] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-[#7c8e88] uppercase">Income</p>
                <div
                  className={`flex items-center gap-1 text-[10px] font-bold ${stats.incomeChange >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'}`}
                >
                  {stats.incomeChange >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stats.incomeChange).toFixed(1)}%
                </div>
              </div>
              <p className="text-xl font-black text-[#1e3a34]">
                {currencyFormatter.format(stats.currentIncome)}
              </p>
              <p className="text-[10px] text-[#7c8e88] mt-1">
                Last month: {currencyFormatter.format(stats.lastIncome)}
              </p>
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <h3 className="text-sm font-bold text-[#1e3a34] mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#1f644e]" />
              Where your money went
            </h3>
            <div className="space-y-3">
              {stats.topCategories.length === 0 ? (
                <p className="text-xs text-[#7c8e88] text-center py-4 italic">
                  No expenses recorded this month yet.
                </p>
              ) : (
                stats.topCategories.map(([name, amount], i) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f0f5f2] flex items-center justify-center text-[10px] font-bold text-[#1f644e]">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-[#1e3a34]">{name}</p>
                        <p className="text-xs font-bold text-[#1e3a34]">
                          {currencyFormatter.format(amount)}
                        </p>
                      </div>
                      <div className="h-1.5 w-full bg-[#f0f5f2] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1f644e] rounded-full"
                          style={{ width: `${(amount / stats.currentExpense) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-[#1f644e] text-white rounded-2xl font-black text-sm hover:bg-[#17503e] transition-colors shadow-lg shadow-[#1f644e]/20"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
