'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportModal({ isOpen, onClose }) {
  const { fetchTransactionsForPeriod, totalBalance, accountsWithBalance, accounts, categories } =
    useMoney();
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
      const periodSavings = totalIncome - totalExpense;

      // 3. Generate PDF
      const doc = new jsPDF();

      // -- Header
      doc.setFillColor('#1f644e');
      doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

      doc.setFontSize(24);
      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'bold');
      doc.text('Pocketly', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'normal');
      const dateStr =
        dateRange === 'all-time'
          ? 'Full Transaction History'
          : `Report Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
      doc.text(dateStr, 14, 28);

      // -- Top Right App Icon with white background
      const iconSize = 24;
      const iconX = doc.internal.pageSize.width - 14 - iconSize;
      const iconY = 8;
      doc.setFillColor('#ffffff');
      doc.roundedRect(iconX - 2, iconY - 2, iconSize + 4, iconSize + 4, 4, 4, 'F');
      try {
        doc.addImage('/images/apps/pocketly.png', 'PNG', iconX, iconY, iconSize, iconSize);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }

      // -- Summary Cards (Backgrounds)
      doc.setDrawColor('#e5e3d8');
      doc.setLineWidth(0.1);

      // Income Card
      doc.setFillColor('#f0f9f6');
      doc.roundedRect(14, 45, 58, 25, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor('#7c8e88');
      doc.text('PERIOD INCOME', 20, 52);
      doc.setFontSize(14);
      doc.setTextColor('#1f644e');
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${totalIncome.toFixed(2)}`, 20, 62);

      // Expense Card
      doc.setFillColor('#fef2f2');
      doc.roundedRect(76, 45, 58, 25, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor('#7c8e88');
      doc.setFont('helvetica', 'normal');
      doc.text('PERIOD EXPENSE', 82, 52);
      doc.setFontSize(14);
      doc.setTextColor('#c94c4c');
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${totalExpense.toFixed(2)}`, 82, 62);

      // Actual Net Worth Card (This shows the real balance from accounts)
      doc.setFillColor('#f0f5f2');
      doc.roundedRect(138, 45, 58, 25, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor('#7c8e88');
      doc.setFont('helvetica', 'normal');
      doc.text('CURRENT NET WORTH', 144, 52);
      doc.setFontSize(14);
      doc.setTextColor('#1e3a34');
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${totalBalance.toFixed(2)}`, 144, 62);

      // -- Visual Analytics: Cashflow Distribution
      const chartY = 78;
      const chartWidth = doc.internal.pageSize.width - 28;
      const chartHeight = 8;

      doc.setFontSize(10);
      doc.setTextColor('#1e3a34');
      doc.setFont('helvetica', 'bold');
      doc.text('Cashflow Distribution (Period)', 14, chartY);

      // Bar Background (Gray)
      doc.setFillColor('#f3f4f6');
      doc.roundedRect(14, chartY + 4, chartWidth, chartHeight, 4, 4, 'F');

      const totalTurnover = totalIncome + totalExpense;
      if (totalTurnover > 0) {
        const incomeRatio = totalIncome / totalTurnover;
        const incomeWidth = chartWidth * incomeRatio;

        // Income Portion (Green)
        if (incomeWidth > 0) {
          doc.setFillColor('#1f644e');
          doc.roundedRect(14, chartY + 4, incomeWidth, chartHeight, 4, 4, 'F');
          if (incomeWidth < chartWidth - 2) {
            doc.rect(14 + incomeWidth - 4, chartY + 4, 4, chartHeight, 'F');
          }
        }

        // Expense Portion (Red)
        const expenseWidth = chartWidth - incomeWidth;
        if (expenseWidth > 0) {
          doc.setFillColor('#c94c4c');
          doc.roundedRect(14 + incomeWidth, chartY + 4, expenseWidth, chartHeight, 4, 4, 'F');
          if (incomeWidth > 2) {
            doc.rect(14 + incomeWidth, chartY + 4, 4, chartHeight, 'F');
          }
        }
      }

      // Legend for the bar
      doc.setFontSize(8);
      doc.setTextColor('#1f644e');
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Income: ${totalTurnover > 0 ? Math.round((totalIncome / totalTurnover) * 100) : 0}%`,
        14,
        chartY + 16
      );

      // Add Period Savings note in the middle
      doc.setTextColor('#1e3a34');
      doc.text(
        `Period Savings: Rs. ${periodSavings.toFixed(2)}`,
        doc.internal.pageSize.width / 2,
        chartY + 16,
        { align: 'center' }
      );

      doc.setTextColor('#c94c4c');
      doc.text(
        `Expense: ${totalTurnover > 0 ? Math.round((totalExpense / totalTurnover) * 100) : 0}%`,
        doc.internal.pageSize.width - 14,
        chartY + 16,
        { align: 'right' }
      );

      // -- Top Accounts Section
      const accountsY = 105;
      doc.setFontSize(10);
      doc.setTextColor('#1e3a34');
      doc.setFont('helvetica', 'bold');
      doc.text('Primary Account Balances', 14, accountsY);

      const activeAccounts = accountsWithBalance?.length ? accountsWithBalance : accounts;
      const topAccounts = [...(activeAccounts || [])]
        .sort(
          (a, b) =>
            (b.currentBalance ?? b.initialBalance ?? 0) -
            (a.currentBalance ?? a.initialBalance ?? 0)
        )
        .slice(0, 3);

      const accountColors = [
        { bg: '#ffedd5', text: '#f97316', border: '#fed7aa' }, // Orange (Wallet)
        { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }, // Blue (Savings)
        { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' }, // Green (Investment)
      ];

      topAccounts.forEach((acc, i) => {
        const xPos = 14 + i * 65;
        const color = accountColors[i % accountColors.length];
        const balance = acc.currentBalance ?? acc.initialBalance ?? 0;

        // Card Border/BG
        doc.setDrawColor('#e5e3d8');
        doc.setFillColor('#ffffff');
        doc.roundedRect(xPos, accountsY + 4, 60, 22, 3, 3, 'FD');

        // Icon Box (Rounded Rect) - Wider Rectangular look for bank logos
        doc.setFillColor(color.bg);
        doc.setDrawColor(color.border);
        doc.roundedRect(xPos + 4, accountsY + 8, 13, 9, 2, 2, 'FD');

        const iconName = acc.icon?.toLowerCase() || '';
        let addedImage = false;

        // -- Specific Icon Drawing Logic (Adjusted for 13x9 box) --
        if (iconName.includes('pnb')) {
          try {
            doc.addImage('/images/pnb.png', 'PNG', xPos + 5, accountsY + 9, 11, 7);
            addedImage = true;
          } catch (e) {}
        } else if (iconName.includes('ippb')) {
          // Draw IPPB Logo with primitives
          doc.setFillColor('#3a0f1a');
          doc.roundedRect(xPos + 5, accountsY + 9, 11, 7, 1, 1, 'F');
          doc.setFillColor('#d92b2b');
          doc.circle(xPos + 8.5, accountsY + 12.5, 1.5, 'F');
          doc.setDrawColor('#ffd036');
          doc.setLineWidth(0.2);
          for (let j = 0; j < 3; j++) {
            doc.line(xPos + 7, accountsY + 11.5 + j * 0.8, xPos + 10, accountsY + 12 + j * 0.8);
          }
          addedImage = true;
        } else if (
          iconName.includes('wallet') ||
          iconName.includes('purse') ||
          iconName.includes('cash')
        ) {
          doc.setFillColor('#1f644e');
          doc.roundedRect(xPos + 6.5, accountsY + 9.5, 8, 6, 1, 1, 'F');
          doc.setFillColor('#17503e');
          doc.rect(xPos + 10.5, accountsY + 11, 4, 3, 'F');
          doc.setFillColor('#ffd036');
          doc.circle(xPos + 11.5, accountsY + 12.5, 0.5, 'F');
          addedImage = true;
        } else if (iconName.includes('rupay')) {
          doc.setFillColor('#0052CC');
          doc.roundedRect(xPos + 5, accountsY + 9, 11, 7, 1, 1, 'F');
          doc.setTextColor('#ffffff');
          doc.setFontSize(5);
          doc.text('R', xPos + 10.5, accountsY + 14, { align: 'center' });
          addedImage = true;
        }

        if (!addedImage) {
          doc.setFontSize(7);
          doc.setTextColor(color.text);
          doc.setFont('helvetica', 'bold');
          doc.text(acc.name.charAt(0).toUpperCase(), xPos + 10.5, accountsY + 14.5, {
            align: 'center',
          });
        }

        // Name (Shifted right to accommodate wider icon box)
        doc.setFontSize(8);
        doc.setTextColor('#7c8e88');
        doc.setFont('helvetica', 'normal');
        doc.text(acc.name, xPos + 19, accountsY + 13);

        // Balance (Shifted right)
        doc.setFontSize(10);
        doc.setTextColor('#1e3a34');
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${balance.toLocaleString('en-IN')}`, xPos + 19, accountsY + 20);
      });

      // -- Top Spending Categories Breakdown
      const expenseData = fetchedTransactions.filter((t) => t.type === 'expense');
      const categorySpending = {};
      expenseData.forEach((t) => {
        const name = t.category?.name || 'Uncategorized';
        categorySpending[name] = (categorySpending[name] || 0) + t.amount;
      });

      const topCategories = Object.entries(categorySpending)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const breakdownY = accountsY + 35;
      if (topCategories.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor('#1e3a34');
        doc.setFont('helvetica', 'bold');
        doc.text('Top Spending Categories', 14, breakdownY);

        topCategories.forEach((cat, i) => {
          const xPos = 14 + i * 65;
          const name = cat[0];
          const amount = cat[1];

          doc.setDrawColor('#e5e3d8');
          doc.setFillColor('#fdfbf7');
          doc.roundedRect(xPos, breakdownY + 4, 60, 12, 2, 2, 'FD');

          doc.setFontSize(8);
          doc.setTextColor('#7c8e88');
          doc.setFont('helvetica', 'normal');
          doc.text(name, xPos + 4, breakdownY + 11.5);

          doc.setFontSize(9);
          doc.setTextColor('#c94c4c');
          doc.setFont('helvetica', 'bold');
          doc.text(`Rs. ${amount.toFixed(0)}`, xPos + 56, breakdownY + 11.5, { align: 'right' });
        });
      }

      // -- Table
      const tableData = fetchedTransactions.map((t) => {
        const date = new Date(t.date).toLocaleDateString();
        const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
        const cat = t.category?.name || 'Uncategorized';
        const account =
          t.type === 'transfer'
            ? `${t.account?.name || 'Account'} -> ${t.toAccount?.name || 'Account'}`
            : t.account?.name || 'Account';
        const amount = `Rs. ${t.amount.toFixed(2)}`;

        // Show actual notes, but hide the default "Transaction" or "Transfer" labels to keep it clean
        let note = t.description || '';
        if (note === 'Transaction' || note === 'Transfer') {
          note = '';
        }

        return [date, type, cat, account, amount, note];
      });

      autoTable(doc, {
        startY: breakdownY + 25,
        head: [['Date', 'Type', 'Category', 'Account', 'Amount', 'Notes']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: '#1f644e',
          textColor: '#ffffff',
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'center', cellWidth: 20 },
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: '#e5e3d8',
          textColor: '#1e3a34',
        },
        alternateRowStyles: {
          fillColor: '#fcfbf5',
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const rowData = fetchedTransactions[data.row.index];
            if (rowData?.type === 'expense') {
              data.cell.styles.textColor = '#c94c4c';
            } else if (rowData?.type === 'income') {
              data.cell.styles.textColor = '#1f644e';
            }
          }
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor('#7c8e88');
          const footerText = `Page ${data.pageNumber} — Generated by Pocketly — ${new Date().toLocaleString()}`;
          doc.text(footerText, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {
            align: 'center',
          });
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
                Generates a clean, tabular report containing your transaction history, categories,
                and totals for the selected period.
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
