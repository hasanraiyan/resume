'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const MoneyContext = createContext(null);

const initialState = {
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  analysis: null,
  isLoading: true,
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
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.payload.id ? action.payload : a)),
      };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.payload) };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.payload) };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) };
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_PERIOD':
      return { ...state, periodStart: action.payload.start, periodEnd: action.payload.end };
    default:
      return state;
  }
}

export function MoneyProvider({ children }) {
  const [state, dispatch] = useReducer(moneyReducer, initialState);

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [accRes, catRes, transRes] = await Promise.all([
        fetch('/api/money/accounts'),
        fetch('/api/money/categories'),
        fetch(`/api/money/transactions?startDate=${state.periodStart}&endDate=${state.periodEnd}`),
      ]);

      const accData = await accRes.json();
      const catData = await catRes.json();
      const transData = await transRes.json();

      if (accData.success) dispatch({ type: 'SET_ACCOUNTS', payload: accData.accounts });
      if (catData.success) dispatch({ type: 'SET_CATEGORIES', payload: catData.categories });
      if (transData.success)
        dispatch({ type: 'SET_TRANSACTIONS', payload: transData.transactions });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.periodStart, state.periodEnd]);

  const fetchAnalysis = useCallback(async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/money/analysis?${params}`);
      const data = await res.json();
      if (data.success) dispatch({ type: 'SET_ANALYSIS', payload: data.analysis });
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  }, []);

  const seedData = useCallback(async () => {
    try {
      const res = await fetch('/api/money/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) await fetchData();
      return data;
    } catch (error) {
      console.error('Failed to seed data:', error);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = async (transaction) => {
    try {
      const res = await fetch('/api/money/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'ADD_TRANSACTION', payload: data.transaction });
        return data.transaction;
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`/api/money/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const addAccount = async (account) => {
    try {
      const res = await fetch('/api/money/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'ADD_ACCOUNT', payload: data.account });
        return data.account;
      }
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const updateAccount = async (id, account) => {
    try {
      const res = await fetch(`/api/money/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'UPDATE_ACCOUNT', payload: data.account });
        return data.account;
      }
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const deleteAccount = async (id) => {
    try {
      const res = await fetch(`/api/money/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) dispatch({ type: 'DELETE_ACCOUNT', payload: id });
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const addCategory = async (category) => {
    try {
      const res = await fetch('/api/money/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'ADD_CATEGORY', payload: data.category });
        return data.category;
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const updateCategory = async (id, category) => {
    try {
      const res = await fetch(`/api/money/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'UPDATE_CATEGORY', payload: data.category });
        return data.category;
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`/api/money/categories/${id}`, { method: 'DELETE' });
      if (res.ok) dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const setPeriod = (start, end) => {
    dispatch({ type: 'SET_PERIOD', payload: { start, end } });
  };

  const setActiveTab = (tab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const totalExpense = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = state.accounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0);

  const value = {
    ...state,
    totalExpense,
    totalIncome,
    totalBalance,
    fetchData,
    fetchAnalysis,
    seedData,
    addTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
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
