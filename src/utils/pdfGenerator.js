import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Simplified Design Tokens ---
const C = {
  primary: '#1a5c47',
  income: '#16a34a',
  expense: '#dc2626',
  transfer: '#2563eb',
  bg: '#f7f8f6',
  surface: '#ffffff',
  textDark: '#111f1a',
  textMuted: '#7a9488',
  borderLight: '#edf2ee',
};

const fmt = (n) =>
  `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const rgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

/**
 * Generates a clean, simple Pocketly Transaction Report PDF
 */
export const generatePocketlyPdf = async ({
  start,
  end,
  dateRange,
  transactions,
  totalBalance,
  accountsWithBalance,
  accounts,
}) => {
  const doc = new jsPDF();
  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;
  const M = 14;

  // --- Pre-compute Summary ---
  let totalIncome = 0,
    totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });
  const periodSavings = totalIncome - totalExpense;

  // ─── 1. HEADER & ICON ───────────────────────────────────────────────────
  try {
    // Pocketly Icon
    doc.addImage('/images/apps/pocketly.png', 'PNG', M, M, 12, 12);
  } catch (e) {
    /* skip if image doesn't load */
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...rgb(C.textDark));
  doc.text('Pocketly Transaction Report', M + 16, M + 6);

  // Date Range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...rgb(C.textMuted));
  const dateStr =
    dateRange === 'all-time'
      ? 'Full Transaction History'
      : `${start.toLocaleDateString('en-IN')}  to  ${end.toLocaleDateString('en-IN')}`;
  doc.text(dateStr, M + 16, M + 11);

  // ─── 2. KPI SUMMARY TABLE ───────────────────────────────────────────────
  let cursorY = M + 20;

  autoTable(doc, {
    startY: cursorY,
    head: [['Total Income', 'Total Expense', 'Period Savings', 'Net Balance']],
    body: [[fmt(totalIncome), fmt(totalExpense), fmt(periodSavings), fmt(totalBalance ?? 0)]],
    theme: 'plain',
    headStyles: {
      fillColor: rgb(C.primary),
      textColor: rgb(C.surface),
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      cellPadding: 4,
      lineColor: rgb(C.borderLight),
      lineWidth: 0.1,
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 0) data.cell.styles.textColor = rgb(C.income);
        if (data.column.index === 1) data.cell.styles.textColor = rgb(C.expense);
        if (data.column.index === 2)
          data.cell.styles.textColor = rgb(periodSavings >= 0 ? C.income : C.expense);
        if (data.column.index === 3) data.cell.styles.textColor = rgb(C.textDark);
      }
    },
  });

  cursorY = doc.lastAutoTable.finalY + 10;

  // ─── 3. TRANSACTION TABLE ───────────────────────────────────────────────
  const tableData = transactions.map((t) => {
    const date = new Date(t.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
    const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
    const cat = t.category?.name || '—';

    // FIX 1: Replaced the unsupported "→" with standard "->" to prevent the garbage text issue
    const account =
      t.type === 'transfer'
        ? `${t.account?.name || 'Acc'} -> ${t.toAccount?.name || 'Acc'}`
        : t.account?.name || '—';

    let note = (t.description || '').trim();
    if (!note || note === 'Transaction' || note === 'Transfer') note = '—';

    return [date, type, cat, account, fmt(t.amount), note];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['Date', 'Type', 'Category', 'Account', 'Amount', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: rgb(C.primary),
      textColor: rgb(C.surface),
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
    },
    // FIX 2: Explicitly define column widths so Date doesn't wrap, and Account has room for transfers
    columnStyles: {
      0: { cellWidth: 22 }, // Date - wide enough for "18 Apr 26"
      1: { cellWidth: 18 }, // Type
      2: { cellWidth: 25 }, // Category
      3: { cellWidth: 45 }, // Account - wide enough for "Account A -> Account B"
      4: { cellWidth: 28, halign: 'right' }, // Amount
      5: { cellWidth: 'auto' }, // Notes - takes up whatever is left over
    },
    alternateRowStyles: {
      fillColor: rgb(C.bg),
    },
    didParseCell: (data) => {
      // Color-code the Amount and Type columns based on the transaction type
      if (data.section === 'body') {
        const tType = transactions[data.row.index]?.type;

        if (data.column.index === 1 || data.column.index === 4) {
          if (tType === 'expense') data.cell.styles.textColor = rgb(C.expense);
          if (tType === 'income') data.cell.styles.textColor = rgb(C.income);
          if (tType === 'transfer') data.cell.styles.textColor = rgb(C.transfer);

          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      // ── Footer ────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...rgb(C.textMuted));
      doc.text(
        `Pocketly • Generated ${new Date().toLocaleString('en-IN')} • Page ${data.pageNumber}`,
        PW / 2,
        PH - 8,
        { align: 'center' }
      );
    },
  });

  return doc;
};
