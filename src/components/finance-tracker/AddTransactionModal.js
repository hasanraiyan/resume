'use client';

import { useState, useEffect } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { Plus, X, Check, ArrowLeftRight } from 'lucide-react';
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

  const getDateDisplay = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimeDisplay = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

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

  // Keypad button component
  const KeyBtn = ({ value, label, operator, primary }) => (
    <button
      onClick={() => handleKeypad(value)}
      className={`flex items-center justify-center text-xl font-bold select-none transition active:scale-95 ${
        primary
          ? 'bg-[#5c8a74] text-white'
          : operator
            ? 'bg-[#7c998e] text-white'
            : 'bg-[#f4f5ee] text-[#1e3a34] border border-[#e5e3d8]'
      } ${operator || primary ? '' : 'hover:bg-[#e5e8df]'}`}
    >
      {label || value}
    </button>
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 lg:bottom-8 lg:left-[17.5rem] w-12 h-12 bg-white border border-[#e5e3d8] rounded-full shadow-lg flex items-center justify-center text-[#1f644e] hover:shadow-xl transition active:scale-95 z-30"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <>
      {/* FAB (hidden when modal open) */}
      <div className="fixed inset-0 bg-[#fcfbf5] z-50 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 py-3 text-[#1f644e] font-bold text-sm bg-white border-b border-[#e5e3d8]">
          <button
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            className="flex items-center gap-1 active:opacity-70"
          >
            <X className="w-4 h-4" /> CANCEL
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-1 active:opacity-70">
            <Check className="w-4 h-4" /> SAVE
          </button>
        </div>

        {/* Type Selector */}
        <div className="flex justify-center text-xs font-bold text-[#7c8e88] bg-white pb-3 gap-3">
          {['income', 'expense', 'transfer'].map((t, i) => (
            <div key={t} className="flex items-center">
              {i > 0 && <span className="text-[#e5e3d8] mx-1">|</span>}
              <button
                onClick={() => {
                  setType(t);
                  setCategoryId('');
                  setToAccountId('');
                }}
                className={`flex items-center gap-1 ${type === t ? 'text-[#1e3a34]' : ''}`}
              >
                {type === t && <Check className="w-4 h-4 text-[#1f644e]" />}
                {t.toUpperCase()}
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto">
          {/* Account / Category Selectors */}
          <div className="border border-[#1f644e] rounded rounded-b-none p-2">
            {type === 'transfer' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-[10px] text-[#7c8e88] mb-1">From</div>
                  <button
                    onClick={() => setShowAccountSelector('from')}
                    className="w-full border border-[#e5e3d8] bg-[#f8f9f4] py-1.5 rounded text-sm font-bold text-[#1f644e]"
                  >
                    {selectedAccount?.name || 'Select'}
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#7c8e88] mb-1">To</div>
                  <button
                    onClick={() => setShowAccountSelector('to')}
                    className="w-full border border-[#e5e3d8] bg-[#f8f9f4] py-1.5 rounded text-sm font-bold text-[#1f644e]"
                  >
                    {selectedToAccount?.name || 'Select'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-[10px] text-[#7c8e88] mb-1">Account</div>
                  <button
                    onClick={() => setShowAccountSelector('main')}
                    className="w-full border border-[#e5e3d8] bg-[#f8f9f4] py-1.5 rounded flex items-center justify-center gap-1 text-sm font-bold text-[#1f644e]"
                  >
                    {selectedAccount?.name || 'Select'}
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#7c8e88] mb-1">Category</div>
                  <button
                    onClick={() => setShowCategorySelector(true)}
                    className="w-full border border-[#e5e3d8] bg-[#f8f9f4] py-1.5 rounded flex items-center justify-center gap-1 text-sm font-bold text-[#1f644e]"
                  >
                    {selectedCategory ? (
                      <>
                        <IconRenderer name={selectedCategory.icon} className="w-4 h-4" />
                        {selectedCategory.name}
                      </>
                    ) : (
                      'Category'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="border border-[#1f644e] border-b-0 p-2 h-16 bg-[#fffdf0]">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-full bg-transparent outline-none resize-none text-sm placeholder:text-[#7c8e88] placeholder:font-bold"
              placeholder="Add notes"
            />
          </div>

          {/* Amount Display */}
          <div className="border border-[#1f644e] rounded rounded-t-none p-3 flex justify-between items-center bg-[#fffdf0] h-14">
            <div className="text-3xl font-bold tracking-wider tabular-nums">{currentInput}</div>
            <button
              onClick={() => handleKeypad('backspace')}
              className="text-[#1f644e] active:scale-90 transition"
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

          {/* Calculator Keypad */}
          <div className="grid grid-cols-4 gap-[3px] mt-4">
            <KeyBtn value="+" operator />
            <KeyBtn value="7" />
            <KeyBtn value="8" />
            <KeyBtn value="9" />

            <KeyBtn value="-" operator />
            <KeyBtn value="4" />
            <KeyBtn value="5" />
            <KeyBtn value="6" />

            <KeyBtn value="x" operator />
            <KeyBtn value="1" />
            <KeyBtn value="2" />
            <KeyBtn value="3" />

            <KeyBtn value="/" label="÷" operator />
            <KeyBtn value="0" />
            <KeyBtn value="." />
            <KeyBtn value="=" operator primary />
          </div>

          {/* Date/Time Bar */}
          <div className="flex justify-between items-center text-sm font-bold text-[#1f644e] mt-auto pt-3 border-t border-[#e5e3d8] pb-6">
            <div>{getDateDisplay()}</div>
            <div className="h-4 w-px bg-[#e5e3d8]" />
            <div>{getTimeDisplay()}</div>
          </div>
        </div>

        {/* Account Selector Bottom Sheet */}
        {showAccountSelector && (
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end">
            <div className="flex-1" onClick={() => setShowAccountSelector(null)} />
            <div className="bg-[#fcfbf5] rounded-t-xl p-4 pb-8 animate-in slide-in-from-bottom duration-300">
              <h3 className="text-center font-bold text-[#1f644e] mb-4">Select an account</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      if (showAccountSelector === 'from') setAccountId(acc.id);
                      else if (showAccountSelector === 'to') setToAccountId(acc.id);
                      else setAccountId(acc.id);
                      setShowAccountSelector(null);
                    }}
                    className="w-full flex items-center justify-between py-2 px-2 rounded hover:bg-[#f0f5f2] transition"
                  >
                    <div className="flex items-center gap-3">
                      <IconRenderer name={acc.icon} className="w-5 h-5 text-[#7c8e88]" />
                      <span className="font-bold text-sm">{acc.name}</span>
                    </div>
                    <span className="text-xs text-[#7c8e88]">
                      ₹{acc.initialBalance.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center mt-4 pt-4 border-t border-[#e5e3d8]">
                <button className="border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded text-sm font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> ADD NEW ACCOUNT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Selector Bottom Sheet */}
        {showCategorySelector && (
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end">
            <div className="flex-1" onClick={() => setShowCategorySelector(false)} />
            <div className="bg-[#fcfbf5] rounded-t-xl p-4 pb-8 animate-in slide-in-from-bottom duration-300">
              <h3 className="text-center font-bold text-[#1f644e] mb-4">Select a category</h3>
              <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setShowCategorySelector(false);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${cat.color || 'bg-[#1f644e]'} text-white flex items-center justify-center shadow-md active:scale-95 transition`}
                    >
                      <IconRenderer name={cat.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-[#7c8e88]">{cat.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center mt-4 pt-4 border-t border-[#e5e3d8]">
                <button className="border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded text-sm font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> ADD NEW CATEGORY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
