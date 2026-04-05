'use client';

import { useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import dynamic from 'next/dynamic';

import IconRenderer from './IconRenderer';

export default function BudgetsTab() {
  const { categories, transactions, budgets, saveBudget } = useMoney();
  const [budgetForm, setBudgetForm] = useState(null);
  const [amount, setAmount] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const categorySpending = expenseCategories.map((cat) => {
    const spent = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category?.id === cat.id &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const budget = budgets.find((b) => b.category?.id === cat.id);
    return { ...cat, spent, budget: budget?.amount || 0, hasBudget: !!budget };
  });

  const handleSaveBudget = async (cat) => {
    try {
      const saved = await saveBudget({
        _id: cat.budget?._id,
        id: cat.budget?.id,
        category: cat.id,
        amount: parseFloat(amount),
        month: currentMonth,
        year: currentYear,
      });
      if (saved) {
        setBudgetForm(null);
        setAmount('');
      }
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  return (
    <div className="pb-4">
      {/* Header - Full width, left-aligned */}
      <div className="px-4 py-2.5">
        <p className="text-[10px] font-bold text-[#7c8e88] dark:text-[#a0a0a0] uppercase tracking-wider">
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Content - Centered horizontally */}
      <div className="w-full px-4 flex justify-center">
        <div className="w-full max-w-5xl">
          <div className="space-y-3">
            {categorySpending.map((cat) => {
              const percentage = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
              const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;
              const remaining = cat.budget - cat.spent;

              return (
                <div
                  key={cat.id}
                  className="border border-[#e5e3d8] dark:border-[#333333] bg-[#faf9ed] dark:bg-[#1e1e1e] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full ${cat.color || 'bg-[#1f644e]'} text-white flex items-center justify-center`}
                      >
                        <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold">{cat.name}</span>
                    </div>
                    {cat.hasBudget ? (
                      <span className="text-xs text-[#7c8e88] dark:text-[#a0a0a0]">
                        ₹{cat.spent.toFixed(0)} / ₹{cat.budget}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setBudgetForm(cat.id);
                          setAmount('');
                        }}
                        className="text-xs text-[#1f644e] font-bold hover:underline"
                      >
                        Set budget
                      </button>
                    )}
                  </div>

                  {budgetForm === cat.id && (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="flex-1 px-3 py-2 border border-[#e5e3d8] dark:border-[#333333] rounded text-sm focus:outline-none focus:border-[#1f644e]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveBudget(cat)}
                        className="px-3 py-2 bg-[#1f644e] text-white text-xs font-bold rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setBudgetForm(null)}
                        className="px-3 py-2 text-xs text-[#7c8e88] dark:text-[#a0a0a0]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {cat.hasBudget && (
                    <>
                      <div className="h-1.5 bg-[#e5e3d8] rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isOverBudget ? 'bg-[#7c8e88]' : 'bg-[#1f644e]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#7c8e88] dark:text-[#a0a0a0]">
                        <span>{percentage.toFixed(0)}% used</span>
                        <span className={remaining < 0 ? 'text-[#7c8e88] dark:text-[#a0a0a0]' : ''}>
                          {remaining < 0 ? '-' : ''}₹{Math.abs(remaining).toFixed(0)}{' '}
                          {remaining < 0 ? 'over' : 'left'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
