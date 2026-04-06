'use client';

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui';
import { Trash2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

const categoryNames = {
  food: 'Food & Dining',
  transport: 'Transportation',
  shopping: 'Shopping',
  bills: 'Bills & Utilities',
  entertainment: 'Entertainment',
  health: 'Health',
  salary: 'Salary',
  freelance: 'Freelance',
};

export default function TransactionList() {
  const { transactions, deleteTransaction, categories } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredTransactions = transactions
    .filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          t.description.toLowerCase().includes(term) ||
          (categoryNames[t.category] || t.category).toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card variant="bordered" className="rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold font-['Playfair_Display'] text-black">
            Recent Transactions
          </h2>

          <div className="flex items-center gap-3">
            {/* Filter tabs */}
            <div className="flex bg-neutral-100 rounded-lg p-1">
              {['all', 'income', 'expense'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-200 ${
                    filterType === type
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors duration-200"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-neutral-100">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-400 text-sm">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-4 sm:p-5 hover:bg-neutral-50 transition-colors duration-200 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  transaction.type === 'income'
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {transaction.type === 'income' ? (
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <ArrowDownRight className="w-4 h-4" strokeWidth={2} />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-black truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {categoryNames[transaction.category] || transaction.category} &middot;{' '}
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p
                  className={`font-bold text-sm ${
                    transaction.type === 'income' ? 'text-black' : 'text-neutral-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}$
                  {transaction.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={() => deleteTransaction(transaction.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 transition-all duration-200"
                title="Delete transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
