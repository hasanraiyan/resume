'use client';

import { useState, useEffect } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { Plus, X, Check, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import { evaluateMath } from '@/utils/math';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

export default function AddTransactionModal() {
  const { accounts, categories, addTransaction } = useMoney();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('expense');
  const [currentInput, setCurrentInput] = useState('0');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const resetForm = () => {
    setCurrentInput('0');
    setDescription('');
    setCategoryId('');
    setToAccountId('');
    setType('expense');
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
    const amount = parseFloat(currentInput);
    if (!amount || amount <= 0) return;
    if (!accountId) return;

    const payload = {
      type,
      amount,
      description: description || (type === 'transfer' ? 'Transfer' : 'Transaction'),
      date: new Date().toISOString(),
    };

    if (type === 'transfer') {
      if (!toAccountId) return;
      payload.account = accountId;
      payload.toAccount = toAccountId;
    } else {
      payload.category = categoryId || null;
      payload.account = accountId;
    }

    await addTransaction(payload);
    resetForm();
    setOpen(false);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const displayAmount = currentInput === '0' ? '0' : currentInput;
  const displayCurrency = type === 'expense' ? '₹' : type === 'income' ? '₹' : '₹';

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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 lg:bottom-8 lg:left-[17.5rem] w-12 h-12 bg-[#1f644e] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#17503e] hover:shadow-xl transition-all active:scale-95 z-30"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#fcfbf5] z-50 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-[#e5e3d8]">
          <button
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            className="flex items-center gap-1.5 text-sm font-bold text-[#7c8e88] hover:text-[#1e3a34] transition cursor-pointer"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <span className="text-sm font-bold text-[#1e3a34]">
            {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={parseFloat(currentInput) <= 0}
            className="flex items-center gap-1.5 text-sm font-bold text-[#1f644e] hover:text-[#17503e] transition disabled:opacity-30 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save
          </button>
        </div>

        {/* Type Selector */}
        <div className="bg-white border-b border-[#e5e3d8] px-4 py-3">
          <div className="flex bg-[#f0f5f2] rounded-xl p-1 gap-1">
            {[
              { id: 'expense', label: 'Expense', icon: ArrowDownLeft },
              { id: 'income', label: 'Income', icon: ArrowUpRight },
              { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setCategoryId('');
                  setToAccountId('');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === t.id
                    ? 'bg-white text-[#1f644e] shadow-sm'
                    : 'text-[#7c8e88] hover:text-[#1e3a34]'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

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
                    <Wallet className="w-4 h-4 text-[#7c8e88]" />
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
                    <Wallet className="w-4 h-4 text-[#7c8e88]" />
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
                    <Wallet className="w-4 h-4 text-[#7c8e88]" />
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
                          className={`w-5 h-5 rounded-full ${selectedCategory.color || 'bg-[#1f644e]'} flex items-center justify-center`}
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
                        <div className="w-5 h-5 rounded-full bg-[#f0f5f2]" />
                        Select category
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="px-4 pb-2">
            <div className="border border-[#e5e3d8] rounded-xl bg-white px-3 py-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-[#7c8e88] placeholder:font-medium"
                placeholder="Add a note..."
                rows={1}
              />
            </div>
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
          <div className="px-4 pb-4 flex-1">
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

          {/* Date/Time Bar */}
          <div className="flex justify-between items-center text-xs font-bold text-[#7c8e88] px-4 py-3 border-t border-[#e5e3d8] bg-white">
            <div>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Account Selector Bottom Sheet */}
        {showAccountSelector && (
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
            <div className="flex-1" onClick={() => setShowAccountSelector(null)} />
            <div className="bg-white rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300">
              <h3 className="text-center font-bold text-[#1e3a34] mb-4">Select an account</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {accounts.map((acc) => (
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
                      ₹{acc.initialBalance.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Selector Bottom Sheet */}
        {showCategorySelector && (
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end z-50">
            <div className="flex-1" onClick={() => setShowCategorySelector(false)} />
            <div className="bg-white rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300">
              <h3 className="text-center font-bold text-[#1e3a34] mb-4">Select a category</h3>
              <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setShowCategorySelector(false);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl ${cat.color || 'bg-[#1f644e]'} text-white flex items-center justify-center shadow-md active:scale-95 transition`}
                    >
                      <IconRenderer name={cat.icon} className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-[#7c8e88] text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
