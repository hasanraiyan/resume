'use client';

import { useState } from 'react';
import { X, FileText, TrendingUp, LayoutGrid, ArrowDownToLine, Calendar } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

      let totalIncome = 0;
      let totalExpense = 0;
      fetchedTransactions.forEach((t) => {
        if (t.type === 'income') totalIncome += t.amount;
        else if (t.type === 'expense') totalExpense += t.amount;
      });
      const periodSavings = totalIncome - totalExpense;

      const doc = new jsPDF();
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

      const iconSize = 24;
      const iconX = doc.internal.pageSize.width - 14 - iconSize;
      const iconY = 8;
      doc.setFillColor('#ffffff');
      doc.roundedRect(iconX - 2, iconY - 2, iconSize + 4, iconSize + 4, 4, 4, 'F');
      try {
        doc.addImage('/images/apps/pocketly.png', 'PNG', iconX, iconY, iconSize, iconSize);
      } catch (e) {}

      const chartY = 45;
      const chartWidth = doc.internal.pageSize.width - 28;
      const chartHeight = 35;
      doc.setFontSize(10);
      doc.setTextColor('#1e3a34');
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Financial Trends', 14, chartY);

      const dailyData = {};
      fetchedTransactions.forEach((t) => {
        const day = new Date(t.date).toLocaleDateString();
        if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
        if (t.type === 'income') dailyData[day].income += t.amount;
        if (t.type === 'expense') dailyData[day].expense += t.amount;
      });
      const sortedDays = Object.keys(dailyData)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-14);
      const maxVal = Math.max(
        ...sortedDays.map((d) => Math.max(dailyData[d].income, dailyData[d].expense)),
        1
      );
      doc.setDrawColor('#f3f4f6');
      doc.setLineWidth(0.1);
      for (let i = 0; i <= 4; i++) {
        const yLine = chartY + 10 + (chartHeight - 10) * (i / 4);
        doc.line(14, yLine, 14 + chartWidth, yLine);
      }
      const pointGap = chartWidth / (Math.max(sortedDays.length, 2) - 1 || 1);
      const getY = (val) => chartY + chartHeight - (val / maxVal) * (chartHeight - 10);
      sortedDays.forEach((day, i) => {
        const x = 14 + i * pointGap;
        if (i > 0) {
          const prevX = 14 + (i - 1) * pointGap;
          const prevDay = sortedDays[i - 1];
          doc.setDrawColor('#1f644e');
          doc.setLineWidth(0.5);
          doc.line(prevX, getY(dailyData[prevDay].income), x, getY(dailyData[day].income));
          doc.setDrawColor('#c94c4c');
          doc.line(prevX, getY(dailyData[prevDay].expense), x, getY(dailyData[day].expense));
        }
        doc.setFillColor('#1f644e');
        doc.circle(x, getY(dailyData[day].income), 0.8, 'F');
        doc.setFillColor('#c94c4c');
        doc.circle(x, getY(dailyData[day].expense), 0.8, 'F');
        doc.setFontSize(5);
        doc.setTextColor('#7c8e88');
        const shortDate = day.split('/')[0] + '/' + day.split('/')[1];
        doc.text(shortDate, x, chartY + chartHeight + 3, { align: 'center' });
      });
      doc.setFontSize(7);
      doc.setTextColor('#1f644e');
      doc.text('— Daily Income', 14 + chartWidth, chartY, { align: 'right' });
      doc.setTextColor('#c94c4c');
      doc.text('— Daily Spending', 14 + chartWidth, chartY + 4, { align: 'right' });

      const flowY = chartY + 50;
      doc.setFontSize(10);
      doc.setTextColor('#1e3a34');
      doc.setFont('helvetica', 'bold');
      doc.text('Cashflow Distribution (Period)', 14, flowY);
      doc.setFillColor('#f3f4f6');
      doc.roundedRect(14, flowY + 4, chartWidth, 6, 3, 3, 'F');
      const totalTurnover = totalIncome + totalExpense;
      if (totalTurnover > 0) {
        const incomeRatio = totalIncome / totalTurnover;
        const incomeWidth = chartWidth * incomeRatio;
        if (incomeWidth > 0) {
          doc.setFillColor('#1f644e');
          doc.roundedRect(14, flowY + 4, incomeWidth, 6, 3, 3, 'F');
          if (incomeWidth < chartWidth - 2) doc.rect(14 + incomeWidth - 3, flowY + 4, 3, 6, 'F');
        }
        const expenseWidth = chartWidth - incomeWidth;
        if (expenseWidth > 0) {
          doc.setFillColor('#c94c4c');
          doc.roundedRect(14 + incomeWidth, flowY + 4, expenseWidth, 6, 3, 3, 'F');
          if (incomeWidth > 2) doc.rect(14 + incomeWidth, flowY + 4, 3, 6, 'F');
        }
      }
      doc.setFontSize(8);
      doc.setTextColor('#1f644e');
      doc.text(
        `Income: ${totalTurnover > 0 ? Math.round((totalIncome / totalTurnover) * 100) : 0}%`,
        14,
        flowY + 14
      );
      doc.setTextColor('#c94c4c');
      doc.text(
        `Expense: ${totalTurnover > 0 ? Math.round((totalExpense / totalTurnover) * 100) : 0}%`,
        doc.internal.pageSize.width - 14,
        flowY + 14,
        { align: 'right' }
      );

      const accountsY = flowY + 25;
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
        { bg: '#ffedd5', text: '#f97316', border: '#fed7aa' },
        { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
        { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
      ];
      topAccounts.forEach((acc, i) => {
        const xPos = 14 + i * 65;
        const color = accountColors[i % accountColors.length];
        const balance = acc.currentBalance ?? acc.initialBalance ?? 0;
        doc.setDrawColor('#e5e3d8');
        doc.setFillColor('#ffffff');
        doc.roundedRect(xPos, accountsY + 4, 60, 22, 3, 3, 'FD');
        doc.setFillColor(color.bg);
        doc.setDrawColor(color.border);
        doc.roundedRect(xPos + 4, accountsY + 8, 13, 9, 2, 2, 'FD');
        const iconName = acc.icon?.toLowerCase() || '';
        let addedImage = false;
        if (iconName.includes('pnb')) {
          try {
            doc.addImage('/images/pnb.png', 'PNG', xPos + 5, accountsY + 9, 11, 7);
            addedImage = true;
          } catch (e) {}
        }
        if (!addedImage) {
          doc.setFontSize(7);
          doc.setTextColor(color.text);
          doc.setFont('helvetica', 'bold');
          doc.text(acc.name.charAt(0).toUpperCase(), xPos + 10.5, accountsY + 14.5, {
            align: 'center',
          });
        }
        doc.setFontSize(8);
        doc.setTextColor('#7c8e88');
        doc.setFont('helvetica', 'normal');
        doc.text(acc.name, xPos + 19, accountsY + 13);
        doc.setFontSize(10);
        doc.setTextColor('#1e3a34');
        doc.setFont('helvetica', 'bold');
        doc.text(`Rs. ${balance.toLocaleString('en-IN')}`, xPos + 19, accountsY + 20);
      });

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
          doc.setDrawColor('#e5e3d8');
          doc.setFillColor('#fdfbf7');
          doc.roundedRect(xPos, breakdownY + 4, 60, 12, 2, 2, 'FD');
          doc.setFontSize(8);
          doc.setTextColor('#7c8e88');
          doc.setFont('helvetica', 'normal');
          doc.text(cat[0], xPos + 4, breakdownY + 11.5);
          doc.setFontSize(9);
          doc.setTextColor('#c94c4c');
          doc.setFont('helvetica', 'bold');
          doc.text(`Rs. ${cat[1].toFixed(0)}`, xPos + 56, breakdownY + 11.5, { align: 'right' });
        });
      }

      const incomeData = fetchedTransactions.filter((t) => t.type === 'income');
      const incomeCategoryTotals = {};
      incomeData.forEach((t) => {
        const name = t.category?.name || 'Uncategorized';
        incomeCategoryTotals[name] = (incomeCategoryTotals[name] || 0) + t.amount;
      });
      const topIncomeCategories = Object.entries(incomeCategoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      const incomeBreakdownY = breakdownY + (topCategories.length > 0 ? 25 : 0);
      if (topIncomeCategories.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor('#1e3a34');
        doc.setFont('helvetica', 'bold');
        doc.text('Top Income Categories', 14, incomeBreakdownY);
        topIncomeCategories.forEach((cat, i) => {
          const xPos = 14 + i * 65;
          doc.setDrawColor('#e5e3d8');
          doc.setFillColor('#f7faf7');
          doc.roundedRect(xPos, incomeBreakdownY + 4, 60, 12, 2, 2, 'FD');
          doc.setFontSize(8);
          doc.setTextColor('#7c8e88');
          doc.setFont('helvetica', 'normal');
          doc.text(cat[0], xPos + 4, incomeBreakdownY + 11.5);
          doc.setFontSize(9);
          doc.setTextColor('#1f644e');
          doc.setFont('helvetica', 'bold');
          doc.text(`Rs. ${cat[1].toFixed(0)}`, xPos + 56, incomeBreakdownY + 11.5, {
            align: 'right',
          });
        });
      }

      const tableData = fetchedTransactions.map((t) => {
        const date = new Date(t.date).toLocaleDateString();
        const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
        const cat = t.category?.name || 'Uncategorized';
        const account =
          t.type === 'transfer'
            ? `${t.account?.name || 'Account'} -> ${t.toAccount?.name || 'Account'}`
            : t.account?.name || 'Account';
        const amount = `Rs. ${t.amount.toFixed(2)}`;
        let note = t.description || '';
        if (note === 'Transaction' || note === 'Transfer') note = '';
        return [date, type, cat, account, amount, note];
      });

      autoTable(doc, {
        startY: incomeBreakdownY + (topIncomeCategories.length > 0 ? 25 : 10),
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
        styles: { fontSize: 9, cellPadding: 4, lineColor: '#e5e3d8', textColor: '#1e3a34' },
        alternateRowStyles: { fillColor: '#fcfbf5' },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const rowData = fetchedTransactions[data.row.index];
            if (rowData?.type === 'expense') data.cell.styles.textColor = '#c94c4c';
            else if (rowData?.type === 'income') data.cell.styles.textColor = '#1f644e';
          }
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor('#7c8e88');
          doc.text(
            `Page ${data.pageNumber} — Generated by Pocketly — ${new Date().toLocaleString()}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        },
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
