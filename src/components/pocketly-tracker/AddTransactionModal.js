'use client';

import { useState, useEffect } from 'react';
import { useMoney } from '@/context/MoneyContext';
import {
  Plus,
  X,
  Check,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  AlertTriangle,
  FileText,
  Repeat,
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
    setActiveTab,
  } = useMoney();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('expense');
  const [currentInput, setCurrentInput] = useState('0');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isEditMode = !!editTransactionData;
  const modalOpen = open || isEditMode;
  const editingTransactionId = isEditMode ? (editTransactionData?.id ?? null) : null;
  const editingDbTransaction = editingTransactionId
    ? transactions.find((t) => t.id === editingTransactionId) || editTransactionData
    : null;

  const filteredCategories = categories.filter((c) => c.type === type);

  // Pre-fill form when modal opens with data
  useEffect(() => {
    if (isEditMode && editTransactionData) {
      setType(editTransactionData.type || 'expense');
      setCurrentInput(String(editTransactionData.amount || '0'));
      setDescription(editTransactionData.description || '');
      setNote(editTransactionData.note || '');
      setShowNoteField(!!editTransactionData.note);
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

  const resetForm = () => {
    setCurrentInput('0');
    setDescription('');
    setNote('');
    setShowNoteField(false);
    setIsRecurring(false);
    setFrequency('monthly');
    setCategoryId('');
    setToAccountId('');
    setType('expense');
    setValidationError('');
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  };

  const handleClose = () => {
    resetForm();
    if (isEditMode) {
      cancelEditTransaction();
    }
    setOpen(false);
  };

  const handleKeypad = (val) => {
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
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Clear previous validation error
    setValidationError('');

    // Validate amount
    const amount = parseFloat(currentInput);
    if (!amount || amount <= 0) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }

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
      note: note || '',
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
        if (isRecurring) {
          // Logic for creating recurring transaction via API
          await fetch('/api/money/recurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              frequency,
              nextDueDate: payload.date,
            }),
          }).then((r) => r.json());
        }
        // Preserve current tab when editing draft transactions from chat
        const options = isEditMode && !editTransactionData?.id ? { switchTab: false } : undefined;
        await addTransaction(payload, options);

        // Broadcast to chat confirmation cards that this draft was saved externally
        if (isEditMode && !editTransactionData?.id) {
          try {
            window.localStorage.setItem(
              'pocketly-last-saved-tx',
              JSON.stringify({
                amount,
                type,
                accountId,
                savedAt: Date.now(),
              })
            );
          } catch {
            // ignore
          }
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

  if (accounts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
        <div className="bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4">
            <PurseSVG className="w-8 h-8 text-[#1f644e]" />
          </div>
          <h3 className="text-lg font-bold text-[#1e3a34] mb-2">Add an account first</h3>
          <p className="text-sm text-[#7c8e88] mb-6">
            You need at least one account to record transactions.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setActiveTab('accounts');
                handleClose();
              }}
              className="w-full py-3 bg-[#1f644e] text-white rounded-xl font-bold hover:bg-[#17503e] transition-colors cursor-pointer"
            >
              Go to Accounts
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-white text-[#7c8e88] border border-[#e5e3d8] rounded-xl font-bold hover:bg-[#f8f9f4] transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#fcfbf5] z-50 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-[#e5e3d8]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-sm font-bold text-[#7c8e88] hover:text-[#1e3a34] transition cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
          <span className="text-sm font-bold text-[#1e3a34]">
            {editingDbTransaction
              ? 'Edit Transaction'
              : type === 'expense'
                ? 'Expense'
                : type === 'income'
                  ? 'Income'
                  : 'Transfer'}
          </span>
          <div className="w-10" />
        </div>

        {/* Type Selector */}
        <div className="bg-white border-b border-[#e5e3d8] px-4 py-3">
          <div className="relative flex bg-[#f0f5f2] rounded-xl p-1 gap-1 overflow-hidden">
            {/* Sliding background pill */}
            <div
              className="absolute inset-y-1 left-1 w-1/3 rounded-lg bg-white shadow-sm transition-transform duration-150"
              style={{ transform: `translateX(${activeTypeIndex * 100}%)` }}
              aria-hidden="true"
            />

            {typeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setCategoryId('');
                  setToAccountId('');
                }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  type === t.id ? 'text-[#1f644e]' : 'text-[#7c8e88] hover:text-[#1e3a34]'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="px-4 py-2 bg-[#fef2f2] border-b border-[#fecaca]">
            <div className="flex items-center gap-2 text-sm text-[#c94c4c]">
              <AlertTriangle className="w-4 h-4" />
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Account / Category Selectors */}
          <div className="px-4 py-3 bg-[#fcfbf5]">
            {type === 'transfer' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5">
                    From
                  </div>
                  <button
                    onClick={() => setShowAccountSelector('from')}
                    className="w-full border border-[#e5e3d8] bg-white py-2.5 px-3 rounded-xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                  >
                    {selectedAccount?.icon ? (
                      <IconRenderer
                        name={selectedAccount.icon}
                        className="w-4 h-4 text-[#7c8e88]"
                      />
                    ) : (
                      <PurseSVG className="w-4 h-4 text-[#7c8e88]" />
                    )}
                    {selectedAccount?.name || 'Select account'}
                  </button>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5">
                    To
                  </div>
                  <button
                    onClick={() => setShowAccountSelector('to')}
                    className="w-full border border-[#e5e3d8] bg-white py-2.5 px-3 rounded-xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                  >
                    {selectedToAccount?.icon ? (
                      <IconRenderer
                        name={selectedToAccount.icon}
                        className="w-4 h-4 text-[#7c8e88]"
                      />
                    ) : (
                      <PurseSVG className="w-4 h-4 text-[#7c8e88]" />
                    )}
                    {selectedToAccount?.name || 'Select account'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5">
                    Account
                  </div>
                  <button
                    onClick={() => setShowAccountSelector('main')}
                    className="w-full border border-[#e5e3d8] bg-white py-2.5 px-3 rounded-xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                  >
                    {selectedAccount?.icon ? (
                      <IconRenderer
                        name={selectedAccount.icon}
                        className="w-4 h-4 text-[#7c8e88]"
                      />
                    ) : (
                      <PurseSVG className="w-4 h-4 text-[#7c8e88]" />
                    )}
                    {selectedAccount?.name || 'Select'}
                  </button>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5">
                    Category
                  </div>
                  <button
                    onClick={() => setShowCategorySelector(true)}
                    className="w-full border border-[#e5e3d8] bg-white py-2.5 px-3 rounded-xl text-sm font-bold text-[#1e3a34] flex items-center gap-2 hover:bg-[#f8f9f4] transition cursor-pointer"
                  >
                    {selectedCategory ? (
                      <>
                        <div
                          className={`w-5 h-5 rounded-full ${selectedCategoryColor.className} flex items-center justify-center`}
                          style={selectedCategoryColor.style}
                        >
                          <IconRenderer
                            name={selectedCategory.icon}
                            className="w-3 h-3 text-white"
                          />
                        </div>
                        {selectedCategory.name}
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-[#f0f5f2] flex items-center justify-center">
                          <IconRenderer name="tag" className="w-3 h-3 text-[#7c8e88]" />
                        </div>
                        Select category
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="px-4 pb-2">
            <div className="border border-[#e5e3d8] rounded-xl bg-white px-3 py-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-[#7c8e88] placeholder:font-medium"
                placeholder="Description..."
                rows={1}
              />
            </div>
          </div>

          {/* Recurring Option */}
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between bg-white border border-[#e5e3d8] rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isRecurring ? 'bg-[#1f644e]/10 text-[#1f644e]' : 'bg-neutral-100 text-[#7c8e88]'}`}>
                  <Repeat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#1e3a34]">Repeat Transaction</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isRecurring ? 'bg-[#1f644e]' : 'bg-[#e5e3d8]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {isRecurring && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${frequency === f ? 'bg-[#1f644e] text-white' : 'bg-[#f0f5f2] text-[#7c8e88] hover:text-[#1f644e]'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note Field (Collapsible) */}
          <div className="px-4 pb-2">
            {!showNoteField ? (
              <button
                type="button"
                onClick={() => setShowNoteField(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#1f644e] hover:text-[#17503e] transition cursor-pointer"
              >
                <FileText className="w-3 h-3" />
                Add Note
              </button>
            ) : (
              <div className="border border-[#e5e3d8] rounded-xl bg-white px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7c8e88] uppercase">
                    <FileText className="w-3 h-3" />
                    Note
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!note) setShowNoteField(false);
                    }}
                    className="text-[#7c8e88] hover:text-[#1e3a34]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-[#7c8e88] placeholder:font-medium"
                  placeholder="Extra details..."
                  rows={2}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="px-4 py-4">
            <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#7c8e88]">{displayCurrency}</span>
                <span
                  className={`text-4xl font-bold tracking-wide tabular-nums ${currentInput === '0' ? 'text-[#7c8e88]' : 'text-[#1e3a34]'}`}
                >
                  {displayAmount}
                </span>
              </div>
              <button
                onClick={() => handleKeypad('backspace')}
                className="text-[#7c8e88] hover:text-[#1e3a34] active:scale-90 transition p-2 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calculator Keypad */}
          <div className="px-4 pb-4 mt-auto">
            <div className="grid grid-cols-4 gap-2">
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
          </div>

          {/* Date/Time + Bottom Save */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#e5e3d8] bg-white">
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
              disabled={parseFloat(currentInput) <= 0 || isSubmitting}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#1f644e] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#17503e] disabled:cursor-not-allowed disabled:opacity-40"
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
