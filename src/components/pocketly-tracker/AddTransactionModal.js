'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { broadcastSavedTransaction } from '@/lib/finance-chat/draftEvents';
import {
  Plus,
  X,
  Check,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { PurseSVG } from '@/components/pocketly-tracker/IconRenderer';
import dynamic from 'next/dynamic';
import { evaluateMath } from '@/utils/math';
import BottomSheet from './BottomSheet';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

const getCategoryColorPresentation = (color) => {
  if (!color) return { className: 'bg-[#1f644e]', style: undefined };
  if (color.startsWith('#')) return { className: '', style: { backgroundColor: color } };
  return { className: color, style: undefined };
};

export default function AddTransactionModal() {
  const {
    accounts,
    accountsWithBalance,
    categories,
    addTransaction,
    editTransactionData,
    cancelEditTransaction,
    updateTransaction,
    deleteTransaction,
    transactions,
  } = useMoney();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('expense');
  const [currentInput, setCurrentInput] = useState('0');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const amountDisplayRef = useRef(null);

  const isEditMode = !!editTransactionData;
  const modalOpen = open || isEditMode;
  const editingTransactionId = isEditMode ? (editTransactionData?.id ?? null) : null;
  const editingDbTransaction = editingTransactionId
    ? transactions.find((t) => t.id === editingTransactionId) || editTransactionData
    : null;

  const filteredCategories = categories.filter((c) => c.type === type);
  const parsedAmount = useMemo(() => {
    if (!currentInput || currentInput === 'Error') return null;

    try {
      const result = evaluateMath(currentInput.replace(/x/g, '*'));
      const rounded = Math.round(result * 100) / 100;
      return Number.isFinite(rounded) && rounded > 0 ? rounded : null;
    } catch {
      return null;
    }
  }, [currentInput]);

  // Auto-scroll to the end of the amount display when input changes
  useEffect(() => {
    if (amountDisplayRef.current) {
      amountDisplayRef.current.scrollLeft = amountDisplayRef.current.scrollWidth;
    }
  }, [currentInput]);

  const resetForm = useCallback(() => {
    setCurrentInput('0');
    setDescription('');
    setCategoryId('');
    setToAccountId('');
    setType('expense');
    setValidationError('');
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  const handleClose = useCallback(() => {
    resetForm();
    if (isEditMode) {
      cancelEditTransaction();
    }
    setOpen(false);
  }, [resetForm, isEditMode, cancelEditTransaction]);

  const handleKeypad = useCallback(
    (val) => {
      if (val === 'backspace') {
        setCurrentInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      } else if (['+', '-', 'x', '/'].includes(val)) {
        setCurrentInput((prev) => prev + val);
      } else if (val === '=') {
        try {
          const expr = currentInput.replace(/x/g, '*');
          const result = evaluateMath(expr);
          setCurrentInput(String(Math.round(result * 100) / 100));
        } catch {
          setCurrentInput('Error');
        }
      } else {
        setCurrentInput((prev) => (prev === '0' ? val : prev + val));
      }
    },
    [currentInput]
  );

  // Keyboard support for calculator
  useEffect(() => {
    if (!modalOpen) return undefined;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in a text field
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleKeypad(key);
      } else if (['+', '-', '/', '.'].includes(key)) {
        e.preventDefault();
        handleKeypad(key);
      } else if (key === '*') {
        e.preventDefault();
        handleKeypad('x');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleKeypad('=');
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleKeypad('backspace');
      } else if (key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, handleKeypad, handleClose]);

  // Pre-fill form when modal opens with data
  useEffect(() => {
    if (isEditMode && editTransactionData) {
      setType(editTransactionData.type || 'expense');
      setCurrentInput(String(editTransactionData.amount || '0'));
      setDescription(editTransactionData.description || '');
      setCategoryId(editTransactionData.categoryId || editTransactionData.category?.id || '');
      setAccountId(editTransactionData.accountId || editTransactionData.account?.id || '');
      setToAccountId(editTransactionData.toAccountId || editTransactionData.toAccount?.id || '');
    }
  }, [isEditMode, editTransactionData]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Clear previous validation error
    setValidationError('');

    // Validate amount
    const amount = parsedAmount;
    if (!amount) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }
    setCurrentInput(String(amount));

    // Validate account
    if (!accountId) {
      setValidationError('Please select an account');
      return;
    }

    // Validate transfer-specific fields
    if (type === 'transfer' && !toAccountId) {
      setValidationError('Please select a destination account for transfer');
      return;
    }

    const payload = {
      type,
      amount,
      description: description || (type === 'transfer' ? 'Transfer' : 'Transaction'),
      date: editTransactionData?.date || new Date().toISOString(),
    };

    if (type === 'transfer') {
      if (!toAccountId) return;
      payload.account = accountId;
      payload.toAccount = toAccountId;
      // Explicitly unset category when switching to transfer
      payload.category = null;
    } else {
      payload.category = categoryId || null;
      payload.account = accountId;
      // Explicitly unset toAccount when switching to expense/income
      payload.toAccount = null;
    }

    setIsSubmitting(true);
    try {
      if (editingDbTransaction) {
        await updateTransaction(editingDbTransaction.id, payload);
      } else {
        // Preserve current tab when editing draft transactions from chat
        const options = isEditMode && !editTransactionData?.id ? { switchTab: false } : undefined;
        await addTransaction(payload, options);

        // Broadcast to chat confirmation cards that this draft was saved externally
        if (isEditMode && !editTransactionData?.id) {
          broadcastSavedTransaction({
            amount,
            type,
            accountId,
            categoryId,
            toAccountId,
            savedAt: Date.now(),
          });
        }
      }
      handleClose();
    } catch (error) {
      console.error('Failed to submit transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectableAccounts = accountsWithBalance?.length ? accountsWithBalance : accounts;
  const selectedAccount = selectableAccounts.find((a) => a.id === accountId);
  const handleDelete = async () => {
    if (!editingDbTransaction) return;
    try {
      await deleteTransaction(editingDbTransaction.id);
      handleClose();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const selectedToAccount = selectableAccounts.find((a) => a.id === toAccountId);
  const selectedCategoryColor = getCategoryColorPresentation(selectedCategory?.color);

  const displayAmount = currentInput === '0' ? '0' : currentInput;
  const displayCurrency = '₹';
  const effectiveDate = editTransactionData?.date ? new Date(editTransactionData.date) : new Date();

  const typeOptions = [
    { id: 'expense', label: 'Expense', icon: ArrowDownLeft },
    { id: 'income', label: 'Income', icon: ArrowUpRight },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  ];
  const activeTypeIndex = Math.max(
    0,
    typeOptions.findIndex((t) => t.id === type)
  );

  const KeyBtn = ({ value, label, operator, primary }) => (
    <button
      onClick={() => handleKeypad(value)}
      className={`flex items-center justify-center text-xl font-semibold select-none rounded-xl transition-all active:scale-95 h-14 ${
        primary
          ? 'bg-[#1f644e] text-white hover:bg-[#17503e] shadow-md'
          : operator
            ? 'bg-[#f0f5f2] text-[#1f644e] hover:bg-[#e0e8e4]'
            : 'bg-white text-[#1e3a34] border border-[#e5e3d8] hover:bg-[#f8f9f4]'
      }`}
    >
      {label || value}
    </button>
  );

  if (!modalOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 w-12 h-12 bg-[#1f644e] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#17503e] hover:shadow-xl transition-all active:scale-95 z-30"
        style={{ right: 'calc(1rem + env(safe-area-inset-right))' }}
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#fcfbf5] lg:bg-black/40 lg:backdrop-blur-sm lg:items-center lg:justify-center lg:p-4">
        <div className="flex flex-col w-full h-full lg:h-auto lg:max-w-4xl lg:bg-[#fcfbf5] lg:rounded-[32px] lg:shadow-2xl overflow-hidden">
          {/* Top Bar */}
          <div className="flex justify-between items-center px-4 py-3 lg:px-8 lg:py-5 bg-white border-b border-[#e5e3d8]">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 text-sm font-bold text-[#7c8e88] hover:text-[#1e3a34] transition cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
            <span className="text-sm font-bold text-[#1e3a34] lg:text-base">
              {editingDbTransaction
                ? 'Edit Transaction'
                : type === 'expense'
                  ? 'Expense'
                  : type === 'income'
                    ? 'Income'
                    : 'Transfer'}
            </span>
            <div className="flex items-center gap-2">
              {editingDbTransaction && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-[#c94c4c] hover:bg-red-50 rounded-full transition cursor-pointer"
                  title="Delete transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="lg:w-10" />
            </div>
          </div>

          {/* Type Selector */}
          <div className="bg-white border-b border-[#e5e3d8] px-4 py-3 lg:px-8 lg:py-4">
            <div className="relative flex bg-[#1f644e] rounded-xl overflow-hidden lg:max-w-md lg:mx-auto">
              {/* Sliding background pill container */}
              <div
                className="absolute inset-y-0 transition-all duration-200 ease-out p-1"
                style={{
                  left: `${(activeTypeIndex * 100) / 3}%`,
                  width: '33.3333%',
                }}
              >
                <div className="w-full h-full bg-white rounded-lg shadow-md" />
              </div>

              {typeOptions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id);
                    setCategoryId('');
                    setToAccountId('');
                  }}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-[11px] lg:text-xs font-bold transition-colors cursor-pointer ${
                    type === t.id ? 'text-[#1f644e]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <t.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="px-4 py-2 bg-[#fef2f2] border-b border-[#fecaca] lg:px-8">
              <div className="flex items-center gap-2 text-sm text-[#c94c4c]">
                <AlertTriangle className="w-4 h-4" />
                <span>{validationError}</span>
              </div>
            </div>
          )}

          {/* Main Content Body */}
          <div className="flex-1 flex flex-col overflow-hidden lg:flex-row">
            {/* Left Panel: Transaction Details */}
            <div className="flex-1 flex flex-col overflow-y-auto border-b lg:border-b-0 lg:border-r border-[#e5e3d8]">
              <div className="p-4 lg:p-8 space-y-6">
                {/* Account / Category Selectors */}
                <div className="space-y-4">
                  {type === 'transfer' ? (
                    <div className="grid grid-cols-2 gap-3 lg:gap-6">
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                          From
                        </div>
                        <button
                          onClick={() => setShowAccountSelector('from')}
                          className="w-full border border-[#e5e3d8] bg-white py-3 px-4 rounded-2xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                        >
                          {selectedAccount?.icon ? (
                            <IconRenderer
                              name={selectedAccount.icon}
                              className="w-4 h-4 text-[#7c8e88]"
                            />
                          ) : (
                            <PurseSVG className="w-4 h-4 text-[#7c8e88]" />
                          )}
                          <span className="truncate">{selectedAccount?.name || 'Select'}</span>
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                          To
                        </div>
                        <button
                          onClick={() => setShowAccountSelector('to')}
                          className="w-full border border-[#e5e3d8] bg-white py-3 px-4 rounded-2xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                        >
                          {selectedToAccount?.icon ? (
                            <IconRenderer
                              name={selectedToAccount.icon}
                              className="w-4 h-4 text-[#7c8e88]"
                            />
                          ) : (
                            <PurseSVG className="w-4 h-4 text-[#7c8e88]" />
                          )}
                          <span className="truncate">{selectedToAccount?.name || 'Select'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 lg:gap-6">
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                          Account
                        </div>
                        <button
                          onClick={() => setShowAccountSelector('main')}
                          className="w-full border border-[#e5e3d8] bg-white py-3 px-4 rounded-2xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                        >
                          {selectedAccount?.icon ? (
                            <IconRenderer
                              name={selectedAccount.icon}
                              className="w-4 h-4 text-[#7c8e88]"
                            />
                          ) : (
                            <PurseSVG className="w-4 h-4 text-[#7c8e88]" />
                          )}
                          <span className="truncate">{selectedAccount?.name || 'Select'}</span>
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                          Category
                        </div>
                        <button
                          onClick={() => setShowCategorySelector(true)}
                          className="w-full border border-[#e5e3d8] bg-white py-3 px-4 rounded-2xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                        >
                          {selectedCategory ? (
                            <>
                              <div
                                className={`w-5 h-5 rounded-full ${selectedCategoryColor.className} flex items-center justify-center flex-shrink-0`}
                                style={selectedCategoryColor.style}
                              >
                                <IconRenderer
                                  name={selectedCategory.icon}
                                  className="w-3 h-3 text-white"
                                />
                              </div>
                              <span className="truncate">{selectedCategory.name}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 rounded-full bg-[#f0f5f2] flex items-center justify-center flex-shrink-0">
                                <IconRenderer name="tag" className="w-3 h-3 text-[#7c8e88]" />
                              </div>
                              <span className="truncate text-[#7c8e88]">Select</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                    Notes
                  </div>
                  <div className="border border-[#e5e3d8] rounded-2xl bg-white px-4 py-3 focus-within:border-[#1f644e] transition-colors">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-transparent outline-none resize-none text-sm lg:text-base placeholder:text-[#7c8e88] placeholder:font-medium min-h-[80px]"
                      placeholder="What was this for?"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Transaction Date (Desktop only) */}
                <div className="hidden lg:block pt-6 border-t border-[#e5e3d8]">
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-2.5">
                    Transaction Date
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-[#1e3a34]">
                    <div className="bg-[#f0f5f2] px-4 py-2 rounded-xl flex items-center gap-2">
                      <span className="text-[#7c8e88]">
                        {effectiveDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="bg-[#f0f5f2] px-4 py-2 rounded-xl flex items-center gap-2">
                      <span className="text-[#7c8e88]">
                        {effectiveDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Amount & Keypad */}
            <div className="flex flex-col bg-white lg:bg-[#fcfbf5] lg:w-[420px] overflow-y-auto">
              <div className="p-4 lg:p-8 flex flex-col h-full">
                {/* Amount Display */}
                <div className="mb-6 lg:mb-8">
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-2 lg:hidden">
                    Amount
                  </div>
                  <div className="bg-white border border-[#e5e3d8] rounded-[24px] p-5 lg:p-8 flex justify-between items-center shadow-sm overflow-hidden">
                    <div
                      ref={amountDisplayRef}
                      className="flex items-baseline gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar scroll-smooth"
                    >
                      <span className="text-2xl font-bold text-[#7c8e88] shrink-0">
                        {displayCurrency}
                      </span>
                      <span
                        className={`text-4xl lg:text-5xl font-bold tracking-wide tabular-nums whitespace-nowrap ${currentInput === '0' ? 'text-[#7c8e88]' : 'text-[#1e3a34]'}`}
                      >
                        {displayAmount}
                      </span>
                    </div>
                    <button
                      onClick={() => handleKeypad('backspace')}
                      className="text-[#7c8e88] hover:text-[#1e3a34] active:scale-90 transition p-2 cursor-pointer shrink-0 ml-2"
                    >
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" />
                        <line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Calculator Keypad */}
                <div className="grid grid-cols-4 gap-2 lg:gap-3">
                  <KeyBtn value="7" />
                  <KeyBtn value="8" />
                  <KeyBtn value="9" />
                  <KeyBtn value="/" label="÷" operator />

                  <KeyBtn value="4" />
                  <KeyBtn value="5" />
                  <KeyBtn value="6" />
                  <KeyBtn value="x" label="×" operator />

                  <KeyBtn value="1" />
                  <KeyBtn value="2" />
                  <KeyBtn value="3" />
                  <KeyBtn value="-" operator />

                  <KeyBtn value="." />
                  <KeyBtn value="0" />
                  <KeyBtn value="+" operator />
                  <KeyBtn value="=" primary />
                </div>

                {/* Save Button (Desktop only) */}
                <div className="hidden lg:block mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={!parsedAmount || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-[20px] bg-[#1f644e] py-4 text-base font-bold text-white shadow-lg transition hover:bg-[#17503e] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    {isSubmitting
                      ? editingDbTransaction
                        ? 'Updating...'
                        : 'Saving...'
                      : editingDbTransaction
                        ? 'Update Transaction'
                        : 'Save Transaction'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 border-t border-[#e5e3d8] bg-white">
            <div className="text-xs font-bold text-[#7c8e88]">
              <div>
                {effectiveDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="mt-0.5">
                {effectiveDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!parsedAmount || isSubmitting}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#1f644e] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#17503e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {isSubmitting
                ? editingDbTransaction
                  ? 'Updating...'
                  : 'Saving...'
                : editingDbTransaction
                  ? 'Update'
                  : 'Save'}
            </button>
          </div>
        </div>

        {/* Account Selector Bottom Sheet */}
        <BottomSheet
          open={Boolean(showAccountSelector)}
          onClose={() => setShowAccountSelector(null)}
          className="max-h-80 overflow-y-auto"
          mobileOnly={false}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#7c8e88]">
            Select account
          </p>
          <div className="space-y-2">
            {selectableAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  if (showAccountSelector === 'from') setAccountId(acc.id);
                  else if (showAccountSelector === 'to') setToAccountId(acc.id);
                  else setAccountId(acc.id);
                  setShowAccountSelector(null);
                }}
                className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#f0f5f2] transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f0f5f2] flex items-center justify-center">
                    <IconRenderer name={acc.icon} className="w-5 h-5 text-[#7c8e88]" />
                  </div>
                  <span className="font-bold text-sm text-[#1e3a34]">{acc.name}</span>
                </div>
                <span className="text-xs font-bold text-[#7c8e88]">
                  ₹
                  {(acc.currentBalance ?? acc.initialBalance ?? 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* Category Selector Bottom Sheet */}
        <BottomSheet
          open={showCategorySelector}
          onClose={() => setShowCategorySelector(false)}
          className="max-h-80 overflow-y-auto"
          mobileOnly={false}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#7c8e88]">
            Select category
          </p>
          <div className="grid grid-cols-4 gap-4">
            {filteredCategories.map((cat) => {
              const colorPresentation = getCategoryColorPresentation(cat.color);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryId(cat.id);
                    setShowCategorySelector(false);
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${colorPresentation.className} text-white flex items-center justify-center shadow-md active:scale-95 transition`}
                    style={colorPresentation.style}
                  >
                    <IconRenderer name={cat.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-[#7c8e88] text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      </div>
    </>
  );
}
