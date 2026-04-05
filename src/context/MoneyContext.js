'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const MoneyContext = createContext(null);

const initialState = {
  accounts: [],
  categories: [],
  transactions: [],
  analysis: null,
  isLoading: false,
  isSyncing: true,
  error: null,
  activeTab: 'records',
  periodStart: getWeekStart(),
  periodEnd: getWeekEnd(),
};

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getWeekEnd(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function moneyReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_PERIOD':
      return { ...state, periodStart: action.payload.start, periodEnd: action.payload.end };
    default:
      return state;
  }
}

async function readJson(response) {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export function MoneyProvider({ children }) {
  const [state, dispatch] = useReducer(moneyReducer, initialState);

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [accData, catData, transData] = await Promise.all([
        fetch('/api/money/accounts').then(readJson),
        fetch('/api/money/categories').then(readJson),
        fetch(
          `/api/money/transactions?startDate=${encodeURIComponent(state.periodStart)}&endDate=${encodeURIComponent(state.periodEnd)}`
        ).then(readJson),
      ]);

      dispatch({ type: 'SET_ACCOUNTS', payload: accData.accounts || [] });
      dispatch({ type: 'SET_CATEGORIES', payload: catData.categories || [] });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transData.transactions || [] });
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to load finance data. Please try again.',
      });
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [state.periodEnd, state.periodStart]);

  const fetchAnalysis = useCallback(async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const data = await fetch(`/api/money/analysis?${params}`).then(readJson);
      dispatch({ type: 'SET_ANALYSIS', payload: data.analysis });
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = async (transaction) => {
    try {
      const data = await fetch('/api/money/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      }).then(readJson);
      await fetchData();
      return data.transaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await fetch(`/api/money/transactions/${id}`, { method: 'DELETE' }).then(readJson);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const updateTransaction = async (id, transaction) => {
    try {
      const data = await fetch(`/api/money/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      }).then(readJson);
      await fetchData();
      return data.transaction;
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  const addAccount = async (account) => {
    try {
      const data = await fetch('/api/money/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then(readJson);
      await fetchData();
      return data.account;
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const updateAccount = async (id, account) => {
    try {
      const data = await fetch(`/api/money/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then(readJson);
      await fetchData();
      return data.account;
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const deleteAccount = async (id) => {
    try {
      await fetch(`/api/money/accounts/${id}`, { method: 'DELETE' }).then(readJson);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const addCategory = async (category) => {
    try {
      const data = await fetch('/api/money/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      }).then(readJson);
      await fetchData();
      return data.category;
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const updateCategory = async (id, category) => {
    try {
      const data = await fetch(`/api/money/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      }).then(readJson);
      await fetchData();
      return data.category;
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await fetch(`/api/money/categories/${id}`, { method: 'DELETE' }).then(readJson);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const clearFinanceData = async () => {
    try {
      await fetch('/api/money/reset', { method: 'POST' }).then(readJson);
      await fetchData();
    } catch (error) {
      console.error('Failed to clear finance data:', error);
      throw error;
    }
  };

  const setPeriod = (start, end) => {
    dispatch({ type: 'SET_PERIOD', payload: { start, end } });
  };

  const setActiveTab = (tab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const totalExpense = state.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalIncome = state.transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Calculate current balance for each account based on transactions
  const accountsWithBalance = state.accounts.map((account) => {
    let balance = account.initialBalance || 0;

    // Process all transactions
    state.transactions.forEach((transaction) => {
      if (transaction.type === 'expense' && transaction.account?.id === account.id) {
        balance -= transaction.amount;
      } else if (transaction.type === 'income' && transaction.account?.id === account.id) {
        balance += transaction.amount;
      } else if (transaction.type === 'transfer') {
        if (transaction.account?.id === account.id) {
          balance -= transaction.amount;
        }
        if (transaction.toAccount?.id === account.id) {
          balance += transaction.amount;
        }
      }
    });

    return {
      ...account,
      currentBalance: balance,
    };
  });

  // Calculate total balance from current balances, not just initial balances
  const totalBalance = accountsWithBalance.reduce(
    (sum, account) => sum + (account.currentBalance || 0),
    0
  );

  const value = {
    ...state,
    totalExpense,
    totalIncome,
    totalBalance,
    accountsWithBalance,
    fetchData,
    fetchAnalysis,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    clearFinanceData,
    setPeriod,
    setActiveTab,
  };

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

export function useMoney() {
  const context = useContext(MoneyContext);
  if (!context) {
    throw new Error('useMoney must be used within a MoneyProvider');
  }
  return context;
}
