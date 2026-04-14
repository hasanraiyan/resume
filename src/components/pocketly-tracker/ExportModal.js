'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportModal({ isOpen, onClose }) {
  const { fetchTransactionsForPeriod, categories } = useMoney();
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
      end = new Date(now); // clone now
    } else if (dateRange === 'all-time') {
      start = new Date(2000, 0, 1);
      end = new Date(2100, 0, 1);
    } else if (dateRange === 'custom') {
      start = fromDate ? new Date(fromDate) : new Date(2000, 0, 1);
      end = toDate ? new Date(toDate) : new Date(2100, 0, 1);
    }

      // Include the entire end day for all ranges to ensure no partial days missed
      end.setHours(23, 59, 59, 999);

      // 1. Fetch exact data from backend for this date range using context
      // fetchTransactionsForPeriod updates the backend exactly and returns the filtered array.
      // We use the existing categories array from context as it rarely changes and is loaded on bootstrap.
      const fetchedTransactions = await fetchTransactionsForPeriod(
        start.toISOString(),
        end.toISOString()
      );

      // 2. Calculate Summaries
      let totalIncome = 0;
      let totalExpense = 0;
      fetchedTransactions.forEach((t) => {
        if (t.type === 'income') totalIncome += t.amount;
        else if (t.type === 'expense') totalExpense += t.amount;
      });
      const net = totalIncome - totalExpense;

      // 3. Generate PDF
      const doc = new jsPDF();

    // -- Header
    doc.setFontSize(20);
    doc.setTextColor('#1f644e');
    doc.text('Pocketly - Transaction Report', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor('#7c8e88');
    const dateStr =
      dateRange === 'all-time'
        ? 'All Time'
        : `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
    doc.text(`Period: ${dateStr}`, 14, 30);

    // -- Summary Section
    doc.setFontSize(12);
    doc.setTextColor('#1e3a34');
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, 42);
    doc.text(`Total Expense: $${totalExpense.toFixed(2)}`, 80, 42);
    doc.text(`Net Balance: $${net.toFixed(2)}`, 150, 42);

      // -- Table
      const tableData = fetchedTransactions.map((t) => {
        const date = new Date(t.date).toLocaleDateString();
        const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
        const cat = categories.find((c) => c._id === t.categoryId)?.name || 'Uncategorized';
        const amount = `$${t.amount.toFixed(2)}`;
        const notes = t.notes || '';
        return [date, type, cat, amount, notes];
      });

    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Type', 'Category', 'Amount', 'Notes']],
      body: tableData,
      headStyles: { fillColor: '#1f644e', textColor: '#ffffff' },
      alternateRowStyles: { fillColor: '#f0f5f2' },
      margin: { top: 50 },
        didDrawPage: (data) => {
          // Footer advertisement
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.setTextColor('#7c8e88');
          const footerText = 'Generated securely by Pocketly — Take control of your finances.';
          const xOffset = doc.internal.pageSize.width / 2;
          doc.text(footerText, xOffset, doc.internal.pageSize.height - 10, { align: 'center' });
        },
      });

      // 4. Download
      const filename = `pocketly-export-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#e5e3d8]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5e3d8] bg-[#fcfbf5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1f644e]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#1f644e]" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a34]">Export Data</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#1e3a34]">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl px-4 py-3 text-[#1e3a34] font-medium focus:outline-none focus:ring-2 focus:ring-[#1f644e]/20 focus:border-[#1f644e] transition-all"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="all-time">All Time</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  From Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-[#7c8e88]" />
                  </div>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl pl-10 pr-4 py-2.5 text-[#1e3a34] font-medium focus:outline-none focus:ring-2 focus:ring-[#1f644e]/20 focus:border-[#1f644e] transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  To Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-[#7c8e88]" />
                  </div>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl pl-10 pr-4 py-2.5 text-[#1e3a34] font-medium focus:outline-none focus:ring-2 focus:ring-[#1f644e]/20 focus:border-[#1f644e] transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#f0f5f2] rounded-xl p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#1f644e] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#1e3a34]">PDF Report</p>
              <p className="text-xs text-[#7c8e88] mt-1">
                Generates a clean, tabular report containing your transaction history, categories, and totals for the selected period.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e5e3d8] bg-[#fcfbf5] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 text-sm font-bold text-[#7c8e88] hover:text-[#1e3a34] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-[#1f644e] text-white text-sm font-bold rounded-xl hover:bg-[#17503e] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
