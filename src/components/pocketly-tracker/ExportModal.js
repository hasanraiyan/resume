'use client';

import { useState } from 'react';
import { X, FileText, TrendingUp, LayoutGrid, ArrowDownToLine, Calendar } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import { generatePocketlyPdf } from '@/utils/pdfGenerator';

const RANGES = [
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const PREVIEW_SECTIONS = [
  { icon: TrendingUp, label: 'Daily Financial Trends', desc: 'Line chart of income vs spending' },
  { icon: LayoutGrid, label: 'Category Breakdown', desc: 'Top spending & income groups' },
  { icon: FileText, label: 'Transaction Table', desc: 'Full ledger with notes & amounts' },
];

export default function ExportModal({ isOpen, onClose }) {
  const { fetchTransactionsForPeriod, totalBalance, accountsWithBalance, accounts } = useMoney();
  const [dateRange, setDateRange] = useState('this-month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      let start, end;

      if (dateRange === 'this-month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (dateRange === 'last-month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (dateRange === 'last-7-days') {
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        end = new Date(now);
      } else if (dateRange === 'all-time') {
        start = new Date(2000, 0, 1);
        end = new Date(2100, 0, 1);
      } else if (dateRange === 'custom') {
        start = fromDate ? new Date(fromDate) : new Date(2000, 0, 1);
        end = toDate ? new Date(toDate) : new Date(2100, 0, 1);
      }

      end.setHours(23, 59, 59, 999);

      const fetchedTransactions = await fetchTransactionsForPeriod(
        start.toISOString(),
        end.toISOString()
      );

      const doc = await generatePocketlyPdf({
        start,
        end,
        dateRange,
        transactions: fetchedTransactions,
        totalBalance,
        accountsWithBalance,
        accounts,
      });

      doc.save(`pocketly-export-${new Date().toISOString().split('T')[0]}.pdf`);
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .export-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          background: rgba(10, 26, 20, 0.6);
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .export-modal {
          font-family: 'DM Sans', sans-serif;
          background: #fafdf9;
          width: 100%; max-width: 480px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(31, 100, 78, 0.15);
          box-shadow:
            0 0 0 1px rgba(31,100,78,0.08),
            0 4px 6px -1px rgba(15,40,30,0.08),
            0 20px 60px -10px rgba(15,40,30,0.25);
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }

        /* ── Header ── */
        .modal-header {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #1a5740 0%, #1f644e 60%, #24745a 100%);
          padding: 24px 24px 20px;
        }
        .modal-header::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .header-eyebrow {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 12px;
        }
        .eyebrow-dot {
          width: 6px; height: 6px;
          background: rgba(255,255,255,0.5);
          border-radius: 50%;
        }
        .eyebrow-text {
          font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.6);
        }
        .header-title {
          font-family: 'DM Serif Display', serif;
          font-size: 26px; line-height: 1.1;
          color: #ffffff; font-style: italic;
          margin: 0;
        }
        .header-sub {
          margin-top: 6px; font-size: 12.5px;
          color: rgba(255,255,255,0.55); font-weight: 400;
        }
        .header-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.12);
          border: none; cursor: pointer;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.8);
          transition: background 0.15s, transform 0.15s;
        }
        .header-close:hover { background: rgba(255,255,255,0.22); transform: scale(1.05); }

        /* ── Body ── */
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

        /* Range Selector */
        .range-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #5a7a6e; margin-bottom: 8px;
        }
        .range-grid {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;
        }
        .range-btn {
          padding: 8px 4px; text-align: center; cursor: pointer;
          border-radius: 10px; border: 1.5px solid #dce8e4;
          background: #ffffff; color: #5a7a6e;
          font-size: 11px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease; white-space: nowrap; line-height: 1.3;
        }
        .range-btn:hover { border-color: #1f644e; color: #1f644e; background: #f0f8f4; }
        .range-btn.active {
          background: #1f644e; color: #ffffff;
          border-color: #1f644e;
          box-shadow: 0 2px 8px rgba(31, 100, 78, 0.3);
        }

        /* Custom date inputs */
        .custom-dates {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          animation: dateIn 0.2s ease;
        }
        @keyframes dateIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        .date-field label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #5a7a6e; margin-bottom: 5px;
        }
        .date-input-wrap { position: relative; }
        .date-input-wrap svg {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: #5a7a6e; pointer-events: none;
        }
        .date-field input {
          width: 100%; padding: 9px 10px 9px 32px;
          border: 1.5px solid #dce8e4; border-radius: 10px;
          background: #ffffff; color: #1e3a34; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .date-field input:focus { border-color: #1f644e; box-shadow: 0 0 0 3px rgba(31,100,78,0.1); }

        /* Divider */
        .divider { height: 1px; background: linear-gradient(to right, transparent, #dce8e4 20%, #dce8e4 80%, transparent); }

        /* Preview strips */
        .preview-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #5a7a6e; margin-bottom: 8px;
        }
        .preview-list { display: flex; flex-direction: column; gap: 6px; }
        .preview-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 12px;
          background: #ffffff; border: 1px solid #e8f0ed;
          transition: border-color 0.15s;
        }
        .preview-item:hover { border-color: rgba(31,100,78,0.3); }
        .preview-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #e8f5ef 0%, #d4ede3 100%);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .preview-icon svg { color: #1f644e; }
        .preview-text { flex: 1; min-width: 0; }
        .preview-text strong { display: block; font-size: 12.5px; font-weight: 600; color: #1e3a34; }
        .preview-text span { font-size: 11px; color: #7c9e92; }
        .preview-check {
          width: 18px; height: 18px; border-radius: 50%;
          background: #e8f5ef; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .preview-check svg { color: #1f644e; }

        /* Footer */
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e8f0ed;
          background: #f4faf7;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .footer-hint { font-size: 11px; color: #8aa89e; }
        .footer-hint strong { color: #5a7a6e; font-weight: 600; }
        .btn-cancel {
          padding: 10px 18px; border: none; background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; color: #7c9e92;
          cursor: pointer; border-radius: 10px;
          transition: color 0.15s, background 0.15s;
        }
        .btn-cancel:hover:not(:disabled) { color: #1e3a34; background: #dce8e4; }
        .btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-generate {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 20px;
          background: linear-gradient(135deg, #1f644e 0%, #256f57 100%);
          color: #ffffff; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(31,100,78,0.35), 0 1px 2px rgba(31,100,78,0.2);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .btn-generate:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(31,100,78,0.4), 0 2px 4px rgba(31,100,78,0.2);
          background: linear-gradient(135deg, #1a5740 0%, #1f644e 100%);
        }
        .btn-generate:active:not(:disabled) { transform: translateY(0); }
        .btn-generate:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <div
        className="export-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="export-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div className="header-eyebrow">
              <span className="eyebrow-dot" />
              <span className="eyebrow-text">Pocketly Reports</span>
            </div>
            <h2 className="header-title">Export your data</h2>
            <p className="header-sub">Generate a PDF report for any time period</p>
            <button className="header-close" onClick={onClose} aria-label="Close">
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Date Range */}
            <div>
              <div className="range-label">Select period</div>
              <div className="range-grid">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    className={`range-btn${dateRange === r.value ? ' active' : ''}`}
                    onClick={() => setDateRange(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom dates */}
            {dateRange === 'custom' && (
              <div className="custom-dates">
                <div className="date-field">
                  <label>From</label>
                  <div className="date-input-wrap">
                    <Calendar size={13} />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="date-field">
                  <label>To</label>
                  <div className="date-input-wrap">
                    <Calendar size={13} />
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="divider" />

            {/* Report preview */}
            <div>
              <div className="preview-label">Report includes</div>
              <div className="preview-list">
                {PREVIEW_SECTIONS.map((s) => (
                  <div key={s.label} className="preview-item">
                    <div className="preview-icon">
                      <s.icon size={15} />
                    </div>
                    <div className="preview-text">
                      <strong>{s.label}</strong>
                      <span>{s.desc}</span>
                    </div>
                    <div className="preview-check">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5L5 9L9.5 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <span className="footer-hint">
              Format: <strong>PDF</strong>
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn-cancel" onClick={onClose} disabled={isGenerating}>
                Cancel
              </button>
              <button className="btn-generate" onClick={handleGeneratePdf} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="spinner" />
                    Generating…
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={14} />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
