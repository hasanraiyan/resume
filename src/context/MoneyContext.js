'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  createAccount,
  createCategory,
  createTransaction,
  deleteAccountRecord,
  deleteCategoryRecord,
  deleteTransactionRecord,
  flushSyncQueue,
  getFinanceSnapshot,
  hydrateFinanceData,
  refreshFinanceData,
  subscribeToFinanceChanges,
  updateAccountRecord,
  updateCategoryRecord,
  upsertBudget,
} from '@/lib/finance-repository';

const MoneyContext = createContext(null);

const initialState = {
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  analysis: null,
  isLoading: true,
  error: null,
  pendingSyncCount: 0,
  lastRemoteSyncAt: null,
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
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FINANCE_SNAPSHOT':
      return { ...state, ...action.payload };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_PERIOD':
      return { ...state, periodStart: action.payload.start, periodEnd: action.payload.end };
    default:
      return state;
  }
}

export function MoneyProvider({ children }) {
  const [state, dispatch] = useReducer(moneyReducer, initialState);

  const refreshSnapshot = useCallback(async () => {
    const snapshot = await getFinanceSnapshot({
      periodStart: state.periodStart,
      periodEnd: state.periodEnd,
    });
    dispatch({ type: 'SET_FINANCE_SNAPSHOT', payload: snapshot });
    return snapshot;
  }, [state.periodEnd, state.periodStart]);

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const localSnapshot = await hydrateFinanceData({
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
      });
      dispatch({ type: 'SET_FINANCE_SNAPSHOT', payload: localSnapshot });

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const remoteSnapshot = await refreshFinanceData({
          periodStart: state.periodStart,
          periodEnd: state.periodEnd,
        });
        dispatch({ type: 'SET_FINANCE_SNAPSHOT', payload: remoteSnapshot });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to connect to finance storage. Please check your connection.',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.periodEnd, state.periodStart]);

  const fetchAnalysis = useCallback(
    async (startDate, endDate) => {
      try {
        const snapshot = await getFinanceSnapshot({
          periodStart: startDate || state.periodStart,
          periodEnd: endDate || state.periodEnd,
        });
        dispatch({ type: 'SET_ANALYSIS', payload: snapshot.analysis });
        dispatch({
          type: 'SET_FINANCE_SNAPSHOT',
          payload: {
            pendingSyncCount: snapshot.pendingSyncCount,
            lastRemoteSyncAt: snapshot.lastRemoteSyncAt,
          },
        });
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
      }
    },
    [state.periodEnd, state.periodStart]
  );

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

  useEffect(() => {
    const unsubscribe = subscribeToFinanceChanges(() => {
      refreshSnapshot();
    });

    const handleServiceWorkerMessage = async (event) => {
      if (event.data?.type === 'finance-sync-request') {
        await flushSyncQueue();
        fetchData();
      }
    };

    const handleReconnect = async () => {
      await flushSyncQueue();
      fetchData();
    };

    window.addEventListener('online', handleReconnect);
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleReconnect);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [fetchData, refreshSnapshot]);

  const addTransaction = async (transaction) => {
    try {
      const nextTransaction = await createTransaction(transaction);
      await refreshSnapshot();
      return nextTransaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await deleteTransactionRecord(id);
      await refreshSnapshot();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const addAccount = async (account) => {
    try {
      const nextAccount = await createAccount(account);
      await refreshSnapshot();
      return nextAccount;
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const updateAccount = async (id, account) => {
    try {
      const nextAccount = await updateAccountRecord(id, account);
      await refreshSnapshot();
      return nextAccount;
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const deleteAccount = async (id) => {
    try {
      await deleteAccountRecord(id);
      await refreshSnapshot();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const addCategory = async (category) => {
    try {
      const nextCategory = await createCategory(category);
      await refreshSnapshot();
      return nextCategory;
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const updateCategory = async (id, category) => {
    try {
      const nextCategory = await updateCategoryRecord(id, category);
      await refreshSnapshot();
      return nextCategory;
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await deleteCategoryRecord(id);
      await refreshSnapshot();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const saveBudget = async (budget) => {
    try {
      const nextBudget = await upsertBudget(budget);
      await refreshSnapshot();
      return nextBudget;
    } catch (error) {
      console.error('Failed to save budget:', error);
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

  const totalBalance = state.accounts.reduce(
    (sum, account) => sum + (account.initialBalance || 0),
    0
  );

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
    saveBudget,
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
