'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const FinanceContext = createContext(null);

const defaultCategories = [
  { id: 'food', name: 'Food & Dining', budget: 500, color: '#000000' },
  { id: 'transport', name: 'Transportation', budget: 300, color: '#404040' },
  { id: 'shopping', name: 'Shopping', budget: 400, color: '#737373' },
  { id: 'bills', name: 'Bills & Utilities', budget: 600, color: '#A3A3A3' },
  { id: 'entertainment', name: 'Entertainment', budget: 200, color: '#D4D4D4' },
  { id: 'health', name: 'Health', budget: 150, color: '#525252' },
];

const sampleTransactions = [
  {
    id: '1',
    type: 'income',
    amount: 5200,
    category: 'salary',
    description: 'Monthly Salary',
    date: '2026-03-01',
  },
  {
    id: '2',
    type: 'expense',
    amount: 85.5,
    category: 'food',
    description: 'Grocery Shopping',
    date: '2026-03-03',
  },
  {
    id: '3',
    type: 'expense',
    amount: 45.0,
    category: 'transport',
    description: 'Gas Station',
    date: '2026-03-05',
  },
  {
    id: '4',
    type: 'expense',
    amount: 120.0,
    category: 'shopping',
    description: 'New Shoes',
    date: '2026-03-07',
  },
  {
    id: '5',
    type: 'expense',
    amount: 95.0,
    category: 'bills',
    description: 'Internet Bill',
    date: '2026-03-10',
  },
  {
    id: '6',
    type: 'income',
    amount: 350,
    category: 'freelance',
    description: 'Freelance Project',
    date: '2026-03-12',
  },
  {
    id: '7',
    type: 'expense',
    amount: 28.0,
    category: 'entertainment',
    description: 'Movie Tickets',
    date: '2026-03-14',
  },
  {
    id: '8',
    type: 'expense',
    amount: 65.0,
    category: 'food',
    description: 'Restaurant Dinner',
    date: '2026-03-15',
  },
  {
    id: '9',
    type: 'expense',
    amount: 250.0,
    category: 'health',
    description: 'Doctor Visit',
    date: '2026-03-18',
  },
  {
    id: '10',
    type: 'expense',
    amount: 180.0,
    category: 'bills',
    description: 'Electricity Bill',
    date: '2026-03-20',
  },
];

const initialState = {
  transactions: sampleTransactions,
  categories: defaultCategories,
  monthlyBudget: 3000,
  isLoading: false,
};

function financeReducer(state, action) {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        monthlyBudget: action.payload,
      };
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('finance-tracker-state');
      if (saved) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
      }
    } catch {
      // Use default state
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('finance-tracker-state', JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
  }, [state]);

  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const categorySpending = state.categories.map((cat) => {
    const spent = state.transactions
      .filter((t) => t.type === 'expense' && t.category === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, spent, remaining: cat.budget - spent };
  });

  const value = {
    ...state,
    totalIncome,
    totalExpenses,
    balance,
    categorySpending,
    addTransaction: (transaction) =>
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: { ...transaction, id: Date.now().toString() },
      }),
    deleteTransaction: (id) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }),
    updateBudget: (budget) => dispatch({ type: 'UPDATE_BUDGET', payload: budget }),
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
