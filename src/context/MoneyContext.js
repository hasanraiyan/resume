'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

const MoneyContext = createContext(null);

const initialState = {
  accounts: [],
  categories: [],
  transactions: [],
  stats: {
    totalAccountBalance: 0,
    totalTransactionCount: 0,
    accountCount: 0,
    categoryCount: 0,
  },
  analysis: null,
  isAnalysisLoading: false,
  analysisError: null,
  isLoading: false,
  isBootstrapLoading: true,
  isTabLoading: false,
  isSyncing: true,
  error: null,
  activeTab: 'records',
  periodStart: getWeekStart(),
  periodEnd: getWeekEnd(),
  periodType: 'week', // 'day' | 'week' | 'month' | 'custom'
  editTransactionData: null,
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

function getCacheKey(start, end) {
  return `${start}|${end}`;
}

const MAX_CACHE_SIZE = 10;

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
    case 'SET_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_ANALYSIS_LOADING':
      return { ...state, isAnalysisLoading: action.payload };
    case 'SET_ANALYSIS_ERROR':
      return { ...state, analysisError: action.payload };
    case 'SET_PERIOD':
      return { ...state, periodStart: action.payload.start, periodEnd: action.payload.end };
    case 'SET_PERIOD_TYPE':
      return { ...state, periodType: action.payload };
    case 'SET_BOOTSTRAP_LOADING':
      return { ...state, isBootstrapLoading: action.payload };
    case 'SET_TAB_LOADING':
      return { ...state, isTabLoading: action.payload };
    case 'SET_EDIT_TRANSACTION_DATA':
      return { ...state, editTransactionData: action.payload };
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
  const hasBootstrappedRef = useRef(false);
  const transactionCacheRef = useRef(new Map());
  const analysisCacheRef = useRef(new Map());
  const currentPeriodRef = useRef({
    start: initialState.periodStart,
    end: initialState.periodEnd,
  });

  const fetchTransactionsRaw = useCallback(async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const data = await fetch(`/api/money/transactions?${params}`).then(readJson);
    return data.transactions || [];
  }, []);

  const cacheTransactions = useCallback((key, transactions) => {
    transactionCacheRef.current.set(key, transactions);
    if (transactionCacheRef.current.size > MAX_CACHE_SIZE) {
      const firstKey = transactionCacheRef.current.keys().next().value;
      transactionCacheRef.current.delete(firstKey);
    }
  }, []);

  const prefetchAdjacentPeriods = useCallback(
    (start, end) => {
      const startMs = new Date(start).getTime();
      const endMs = new Date(end).getTime();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const periods = [
        {
          start: new Date(startMs - weekMs).toISOString(),
          end: new Date(endMs - weekMs).toISOString(),
        },
        {
          start: new Date(startMs + weekMs).toISOString(),
          end: new Date(endMs + weekMs).toISOString(),
        },
      ];
      for (const period of periods) {
        const key = getCacheKey(period.start, period.end);
        if (!transactionCacheRef.current.has(key)) {
          fetchTransactionsRaw(period.start, period.end)
            .then((txns) => cacheTransactions(key, txns))
            .catch(() => {});
        }
      }
    },
    [fetchTransactionsRaw, cacheTransactions]
  );

  const fetchAccountsSummary = useCallback(async () => {
    try {
      const data = await fetch('/api/money/accounts').then(readJson);
      dispatch({ type: 'SET_ACCOUNTS', payload: data.accounts || [] });
      dispatch({
        type: 'SET_STATS',
        payload: {
          totalAccountBalance: data.totalAccountBalance || 0,
          accountCount: data.accounts?.length || 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch account summary:', error);
      throw error;
    }
  }, []);

  const fetchTransactionsForPeriod = useCallback(
    async (startDate, endDate) => {
      const key = getCacheKey(startDate, endDate);
      const cached = transactionCacheRef.current.get(key);

      if (cached) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: cached });
        fetchTransactionsRaw(startDate, endDate)
          .then((txns) => {
            cacheTransactions(key, txns);
            if (
              currentPeriodRef.current.start === startDate &&
              currentPeriodRef.current.end === endDate
            ) {
              dispatch({ type: 'SET_TRANSACTIONS', payload: txns });
            }
          })
          .catch(() => {});
        prefetchAdjacentPeriods(startDate, endDate);
        return cached;
      }

      try {
        dispatch({ type: 'SET_TAB_LOADING', payload: true });
        const transactions = await fetchTransactionsRaw(startDate, endDate);
        cacheTransactions(key, transactions);
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        prefetchAdjacentPeriods(startDate, endDate);
        return transactions;
      } catch (error) {
        console.error('Failed to fetch period transactions:', error);
        throw error;
      } finally {
        dispatch({ type: 'SET_TAB_LOADING', payload: false });
      }
    },
    [fetchTransactionsRaw, cacheTransactions, prefetchAdjacentPeriods]
  );

  const fetchBootstrap = useCallback(async () => {
    try {
      dispatch({ type: 'SET_BOOTSTRAP_LOADING', payload: true });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_SYNCING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const params = new URLSearchParams({
        startDate: state.periodStart,
        endDate: state.periodEnd,
      });
      const data = await fetch(`/api/money/bootstrap?${params}`).then(readJson);

      dispatch({ type: 'SET_ACCOUNTS', payload: data.accounts || [] });
      dispatch({ type: 'SET_CATEGORIES', payload: data.categories || [] });
      dispatch({ type: 'SET_TRANSACTIONS', payload: data.transactions || [] });
      dispatch({ type: 'SET_STATS', payload: data.stats || {} });

      const bootstrapKey = getCacheKey(state.periodStart, state.periodEnd);
      cacheTransactions(bootstrapKey, data.transactions || []);
      prefetchAdjacentPeriods(state.periodStart, state.periodEnd);
    } catch (error) {
      console.error('Failed to fetch finance bootstrap:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to load finance data. Please try again.',
      });
    } finally {
      hasBootstrappedRef.current = true;
      dispatch({ type: 'SET_BOOTSTRAP_LOADING', payload: false });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [state.periodEnd, state.periodStart, cacheTransactions, prefetchAdjacentPeriods]);

  const fetchAnalysis = useCallback(async (startDate, endDate) => {
    const key = getCacheKey(startDate, endDate);
    const cached = analysisCacheRef.current.get(key);

    if (cached) {
      dispatch({ type: 'SET_ANALYSIS', payload: cached });
      dispatch({ type: 'SET_ANALYSIS_LOADING', payload: true });
      fetch(`/api/money/analysis?${new URLSearchParams({ startDate, endDate })}`)
        .then(readJson)
        .then((data) => {
          analysisCacheRef.current.set(key, data.analysis);
          if (
            currentPeriodRef.current.start === startDate &&
            currentPeriodRef.current.end === endDate
          ) {
            dispatch({ type: 'SET_ANALYSIS', payload: data.analysis });
          }
        })
        .catch(() => {})
        .finally(() => dispatch({ type: 'SET_ANALYSIS_LOADING', payload: false }));
      return;
    }

    try {
      dispatch({ type: 'SET_ANALYSIS_LOADING', payload: true });
      dispatch({ type: 'SET_ANALYSIS_ERROR', payload: null });
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const data = await fetch(`/api/money/analysis?${params}`).then(readJson);
      analysisCacheRef.current.set(key, data.analysis);
      dispatch({ type: 'SET_ANALYSIS', payload: data.analysis });
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      dispatch({
        type: 'SET_ANALYSIS_ERROR',
        payload: 'Failed to load analysis. Please try again.',
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_ANALYSIS_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, []);

  useEffect(() => {
    if (!hasBootstrappedRef.current) return;
    fetchTransactionsForPeriod(state.periodStart, state.periodEnd).catch((error) => {
      console.error('Failed to refresh period transactions:', error);
    });
  }, [fetchTransactionsForPeriod, state.periodEnd, state.periodStart]);

  const navigatePeriod = (direction) => {
    const prevStart = new Date(state.periodStart);
    const prevEnd = new Date(state.periodEnd);
    const rangeMs = prevEnd - prevStart;

    let newStart, newEnd;
    if (state.periodType === 'day') {
      newStart = new Date(prevStart);
      newEnd = new Date(prevEnd);
      newStart.setDate(newStart.getDate() + direction);
      newEnd.setDate(newEnd.getDate() + direction);
    } else if (state.periodType === 'month') {
      newStart = new Date(prevStart);
      newEnd = new Date(prevEnd);
      newStart.setMonth(newStart.getMonth() + direction);
      newEnd.setMonth(newEnd.getMonth() + direction);
    } else {
      newStart = new Date(prevStart);
      newEnd = new Date(prevEnd);
      newStart.setDate(newStart.getDate() + direction * 7);
      newEnd.setDate(newEnd.getDate() + direction * 7);
    }

    setPeriod(newStart.toISOString(), newEnd.toISOString());
  };

  const addTransaction = async (transaction, options = {}) => {
    const { switchTab = true } = options;

    try {
      const data = await fetch('/api/money/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      }).then(readJson);

      transactionCacheRef.current.clear();
      analysisCacheRef.current.clear();

      // Navigate to current period if the new transaction is added today (which it always is by default in AddTransactionModal)
      // This ensures the Records tab is showing the period that includes the new transaction.
      const now = new Date();
      const currentPeriodStart = getWeekStart(now);
      const currentPeriodEnd = getWeekEnd(now);

      if (state.periodStart !== currentPeriodStart || state.periodEnd !== currentPeriodEnd) {
        setPeriod(currentPeriodStart, currentPeriodEnd);
        // fetchTransactionsForPeriod will be called automatically by the useEffect watching state.periodStart
      } else {
        await fetchTransactionsForPeriod(state.periodStart, state.periodEnd);
      }

      await Promise.all([
        fetchAccountsSummary(),
        state.analysis ? fetchAnalysis(state.periodStart, state.periodEnd) : Promise.resolve(),
      ]);

      // Auto-switch to records tab to see the latest transaction (only if switchTab is true)
      if (switchTab) {
        setActiveTab('records');
      }

      return data.transaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await fetch(`/api/money/transactions/${id}`, { method: 'DELETE' }).then(readJson);
      transactionCacheRef.current.clear();
      analysisCacheRef.current.clear();
      await Promise.all([
        fetchTransactionsForPeriod(state.periodStart, state.periodEnd),
        fetchAccountsSummary(),
        state.analysis ? fetchAnalysis(state.periodStart, state.periodEnd) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id, transaction) => {
    try {
      const data = await fetch(`/api/money/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      }).then(readJson);
      transactionCacheRef.current.clear();
      analysisCacheRef.current.clear();
      await Promise.all([
        fetchTransactionsForPeriod(state.periodStart, state.periodEnd),
        fetchAccountsSummary(),
        state.analysis ? fetchAnalysis(state.periodStart, state.periodEnd) : Promise.resolve(),
      ]);
      return data.transaction;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const addAccount = async (account) => {
    try {
      const data = await fetch('/api/money/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then(readJson);
      await fetchAccountsSummary();
      return data.account;
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  };

  const updateAccount = async (id, account) => {
    try {
      const data = await fetch(`/api/money/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      }).then(readJson);
      await fetchAccountsSummary();
      return data.account;
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  };

  const deleteAccount = async (id) => {
    try {
      await fetch(`/api/money/accounts/${id}`, { method: 'DELETE' }).then(readJson);
      await fetchAccountsSummary();
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  const addCategory = async (category) => {
    try {
      const data = await fetch('/api/money/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      }).then(readJson);
      const categoriesData = await fetch('/api/money/categories').then(readJson);
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesData.categories || [] });
      dispatch({
        type: 'SET_STATS',
        payload: { categoryCount: categoriesData.categories?.length || 0 },
      });
      return data.category;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  };

  const updateCategory = async (id, category) => {
    try {
      const data = await fetch(`/api/money/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      }).then(readJson);
      const categoriesData = await fetch('/api/money/categories').then(readJson);
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesData.categories || [] });
      dispatch({
        type: 'SET_STATS',
        payload: { categoryCount: categoriesData.categories?.length || 0 },
      });
      return data.category;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await fetch(`/api/money/categories/${id}`, { method: 'DELETE' }).then(readJson);
      const categoriesData = await fetch('/api/money/categories').then(readJson);
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesData.categories || [] });
      dispatch({
        type: 'SET_STATS',
        payload: { categoryCount: categoriesData.categories?.length || 0 },
      });
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  const clearFinanceData = async () => {
    try {
      await fetch('/api/money/reset', { method: 'POST' }).then(readJson);
      await fetchBootstrap();
    } catch (error) {
      console.error('Failed to clear finance data:', error);
      throw error;
    }
  };

  const setPeriod = (start, end, type = state.periodType) => {
    currentPeriodRef.current = { start, end };
    dispatch({ type: 'SET_PERIOD', payload: { start, end } });
    dispatch({ type: 'SET_PERIOD_TYPE', payload: type });
  };

  const setActiveTab = (tab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const openEditTransaction = (data) => {
    dispatch({ type: 'SET_EDIT_TRANSACTION_DATA', payload: data });
  };

  const cancelEditTransaction = () => {
    dispatch({ type: 'SET_EDIT_TRANSACTION_DATA', payload: null });
  };

  const totalExpense = state.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalIncome = state.transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const accountsWithBalance = state.accounts;
  const totalBalance = state.stats.totalAccountBalance || 0;

  const value = {
    ...state,
    totalExpense,
    totalIncome,
    totalBalance,
    accountsWithBalance,
    fetchData: fetchBootstrap,
    fetchBootstrap,
    fetchTransactionsForPeriod,
    fetchAccountsSummary,
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
    navigatePeriod,
    periodType: state.periodType,
    setActiveTab,
    openEditTransaction,
    cancelEditTransaction,
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
