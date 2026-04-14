import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  // Brand greens
  primary: '#1a5c47', // deep forest green
  primaryMid: '#1f644e',
  primaryLight: '#e8f2ee',
  primaryMuted: '#8ab5a4',

  // Semantic
  income: '#16a34a',
  incomeLight: '#dcfce7',
  expense: '#dc2626',
  expenseLight: '#fee2e2',
  transfer: '#2563eb',
  transferLight: '#dbeafe',
  savings: '#0d9488',
  savingsLight: '#ccfbf1',

  // Neutrals (warm)
  bg: '#f7f8f6',
  surface: '#ffffff',
  border: '#dde4df',
  borderLight: '#edf2ee',
  textDark: '#111f1a',
  textMid: '#3d5448',
  textMuted: '#7a9488',
  textFaint: '#a8bdb5',

  // Decorative
  gold: '#d4a843',
  goldLight: '#fdf3dc',
};

const fmt = (n) =>
  `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (n) => {
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}K`;
  return `Rs. ${n.toFixed(0)}`;
};

// Helper: set fill/draw from hex
const rgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

/**
 * Generates a redesigned premium Pocketly Transaction Report PDF
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
  const PW = doc.internal.pageSize.width; // 210
  const PH = doc.internal.pageSize.height; // 297
  const M = 14; // margin
  const CW = PW - M * 2; // content width

  // ─── Pre-compute Summary ─────────────────────────────────────────────────
  let totalIncome = 0,
    totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });
  const periodSavings = totalIncome - totalExpense;

  // ─── 1. HEADER ───────────────────────────────────────────────────────────
  const HDR_H = 46;

  // Main fill
  doc.setFillColor(...rgb(C.primary));
  doc.rect(0, 0, PW, HDR_H, 'F');

  // Decorative circle — top right, large, semi-transparent feel (lighter green)
  doc.setFillColor(...rgb(C.primaryMid));
  doc.circle(PW - 8, 4, 34, 'F');

  // Smaller decorative circle
  doc.setFillColor(...rgb('#17503e'));
  doc.circle(PW + 2, 42, 18, 'F');

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...rgb(C.surface));
  doc.text('Pocketly', M, 20);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...rgb(C.primaryMuted));
  doc.text('Personal Finance Report', M, 27);

  // Divider line in header
  doc.setDrawColor(...rgb(C.primaryMid));
  doc.setLineWidth(0.3);
  doc.line(M, 31, 90, 31);

  // Date range
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...rgb('#c8ddd5'));
  const dateStr =
    dateRange === 'all-time'
      ? 'Full Transaction History'
      : `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}  →  ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  doc.text(dateStr, M, 39);

  // Generated timestamp — top right of header
  doc.setFontSize(7);
  doc.setTextColor(...rgb('#c8ddd5'));
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, PW - M, 39, { align: 'right' });

  // App icon
  try {
    const iconSize = 22;
    const iconX = PW - M - iconSize;
    const iconY = 6;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(iconX - 2, iconY - 2, iconSize + 4, iconSize + 4, 4, 4, 'F');
    doc.addImage('/images/apps/pocketly.png', 'PNG', iconX, iconY, iconSize, iconSize);
  } catch (e) {
    /* skip */
  }

  // ─── 2. KPI SUMMARY STRIP ────────────────────────────────────────────────
  const KPI_Y = HDR_H + 8;
  const KPI_H = 26;
  const KPI_W = (CW - 9) / 4; // 4 cards with 3 gaps of 3

  const kpis = [
    { label: 'Total Income', value: totalIncome, color: C.income, bg: C.incomeLight, sign: '+' },
    {
      label: 'Total Expense',
      value: totalExpense,
      color: C.expense,
      bg: C.expenseLight,
      sign: '-',
    },
    {
      label: 'Period Savings',
      value: Math.abs(periodSavings),
      color: periodSavings >= 0 ? C.savings : C.expense,
      bg: periodSavings >= 0 ? C.savingsLight : C.expenseLight,
      sign: periodSavings >= 0 ? '+' : '-',
    },
    {
      label: 'Net Balance',
      value: totalBalance ?? 0,
      color: C.primary,
      bg: C.primaryLight,
      sign: '',
    },
  ];

  kpis.forEach((kpi, i) => {
    const x = M + i * (KPI_W + 3);

    // Card background
    doc.setFillColor(...rgb(C.surface));
    doc.setDrawColor(...rgb(C.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(x, KPI_Y, KPI_W, KPI_H, 3, 3, 'FD');

    // Left accent bar
    doc.setFillColor(...rgb(kpi.color));
    doc.roundedRect(x, KPI_Y, 3, KPI_H, 1.5, 1.5, 'F');
    doc.rect(x + 1.5, KPI_Y, 1.5, KPI_H, 'F'); // flush right side of the rounded rect

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...rgb(C.textMuted));
    doc.text(kpi.label, x + 6, KPI_Y + 8);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...rgb(kpi.color));
    const valText = (kpi.sign ? kpi.sign + ' ' : '') + fmtShort(kpi.value);
    doc.text(valText, x + 6, KPI_Y + 19);
  });

  // ─── 3. SECTION LABEL helper ─────────────────────────────────────────────
  let cursor = KPI_Y + KPI_H + 10;

  const sectionHeader = (label, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...rgb(C.textDark));
    doc.text(label, M, y);
    // underline
    doc.setDrawColor(...rgb(C.border));
    doc.setLineWidth(0.4);
    doc.line(M, y + 2, M + CW, y + 2);
    return y + 6;
  };

  // ─── 4. DAILY TRENDS CHART ───────────────────────────────────────────────
  cursor = sectionHeader('Daily Financial Trends', cursor);

  const CH = 40; // chart height
  const chartPadL = 22; // left padding for y-axis labels

  // Chart background panel
  doc.setFillColor(...rgb(C.bg));
  doc.setDrawColor(...rgb(C.borderLight));
  doc.setLineWidth(0.2);
  doc.roundedRect(M, cursor, CW, CH + 8, 3, 3, 'FD');

  // Build daily data
  const dailyData = {};
  transactions.forEach((t) => {
    const day = new Date(t.date).toLocaleDateString('en-IN');
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

  // Grid lines + y-axis labels
  const gridLines = 4;
  const chartInnerX = M + chartPadL;
  const chartInnerW = CW - chartPadL - 4;
  const chartTop = cursor + 5;
  const chartBot = cursor + CH;

  for (let i = 0; i <= gridLines; i++) {
    const yLine = chartBot - ((CH - 5) * i) / gridLines;
    doc.setDrawColor(...rgb(C.borderLight));
    doc.setLineWidth(0.15);
    doc.line(chartInnerX, yLine, chartInnerX + chartInnerW, yLine);

    // y-axis value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...rgb(C.textFaint));
    const yVal = Math.round((maxVal * i) / gridLines);
    doc.text(fmtShort(yVal).replace('Rs. ', ''), M + chartPadL - 2, yLine + 1.5, {
      align: 'right',
    });
  }

  if (sortedDays.length >= 2) {
    const pointGap = chartInnerW / (sortedDays.length - 1);
    const getY = (val) => chartBot - (val / maxVal) * (CH - 5);

    // Draw income area fill (simple trapezoid fill per segment)
    sortedDays.forEach((day, i) => {
      if (i === 0) return;
      const prevDay = sortedDays[i - 1];
      const x0 = chartInnerX + (i - 1) * pointGap;
      const x1 = chartInnerX + i * pointGap;
      const yI0 = getY(dailyData[prevDay].income);
      const yI1 = getY(dailyData[day].income);

      // Income fill
      doc.setFillColor(...rgb(C.incomeLight));
      doc.triangle(x0, yI0, x1, yI1, x0, chartBot, 'F');
      doc.triangle(x1, yI1, x1, chartBot, x0, chartBot, 'F');

      // Expense fill
      const yE0 = getY(dailyData[prevDay].expense);
      const yE1 = getY(dailyData[day].expense);
      doc.setFillColor(...rgb(C.expenseLight));
      doc.triangle(x0, yE0, x1, yE1, x0, chartBot, 'F');
      doc.triangle(x1, yE1, x1, chartBot, x0, chartBot, 'F');
    });

    // Draw lines + dots
    sortedDays.forEach((day, i) => {
      const x = chartInnerX + i * pointGap;
      if (i > 0) {
        const prevDay = sortedDays[i - 1];
        const px = chartInnerX + (i - 1) * pointGap;

        doc.setDrawColor(...rgb(C.income));
        doc.setLineWidth(0.8);
        doc.line(px, getY(dailyData[prevDay].income), x, getY(dailyData[day].income));

        doc.setDrawColor(...rgb(C.expense));
        doc.line(px, getY(dailyData[prevDay].expense), x, getY(dailyData[day].expense));
      }

      doc.setFillColor(...rgb(C.income));
      doc.circle(x, getY(dailyData[day].income), 1, 'F');
      doc.setFillColor(...rgb(C.expense));
      doc.circle(x, getY(dailyData[day].expense), 1, 'F');

      // x-axis date label (every other)
      if (i % 2 === 0 || sortedDays.length <= 7) {
        doc.setFontSize(5);
        doc.setTextColor(...rgb(C.textFaint));
        const parts = day.split('/');
        doc.text(`${parts[0]}/${parts[1]}`, x, chartBot + 5, { align: 'center' });
      }
    });
  }

  // Legend
  const legendY = cursor + 2.5;
  doc.setFillColor(...rgb(C.income));
  doc.circle(PW - M - 38, legendY + 1, 1.2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...rgb(C.textMid));
  doc.text('Income', PW - M - 35, legendY + 2);

  doc.setFillColor(...rgb(C.expense));
  doc.circle(PW - M - 18, legendY + 1, 1.2, 'F');
  doc.text('Expense', PW - M - 15, legendY + 2);

  cursor += CH + 12;

  // ─── 5. CASHFLOW BAR ─────────────────────────────────────────────────────
  cursor = sectionHeader('Cashflow Distribution', cursor);

  const BAR_H = 8;
  const totalTurnover = totalIncome + totalExpense;
  const incomeRatio = totalTurnover > 0 ? totalIncome / totalTurnover : 0;
  const incomeW = CW * incomeRatio;

  // Track
  doc.setFillColor(...rgb(C.border));
  doc.roundedRect(M, cursor, CW, BAR_H, BAR_H / 2, BAR_H / 2, 'F');

  if (incomeW > 0) {
    doc.setFillColor(...rgb(C.income));
    doc.roundedRect(M, cursor, Math.max(incomeW, 4), BAR_H, BAR_H / 2, BAR_H / 2, 'F');
    if (incomeW < CW - 4) {
      // sharp right edge for income portion
      doc.rect(M + incomeW - 4, cursor, 4, BAR_H, 'F');
    }
  }
  if (incomeW < CW) {
    doc.setFillColor(...rgb(C.expense));
    doc.roundedRect(M + incomeW, cursor, CW - incomeW, BAR_H, BAR_H / 2, BAR_H / 2, 'F');
    if (incomeW > 4) {
      doc.rect(M + incomeW, cursor, 4, BAR_H, 'F');
    }
  }

  // Labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...rgb(C.income));
  const incPct = totalTurnover > 0 ? Math.round(incomeRatio * 100) : 0;
  doc.text(`Income ${incPct}%  •  ${fmtShort(totalIncome)}`, M, cursor + BAR_H + 6);
  doc.setTextColor(...rgb(C.expense));
  doc.text(`Expense ${100 - incPct}%  •  ${fmtShort(totalExpense)}`, PW - M, cursor + BAR_H + 6, {
    align: 'right',
  });

  cursor += BAR_H + 12;

  // ─── 6. ACCOUNT CARDS ────────────────────────────────────────────────────
  cursor = sectionHeader('Account Balances', cursor);

  const activeAccounts = accountsWithBalance?.length ? accountsWithBalance : accounts;
  const topAccounts = [...(activeAccounts || [])]
    .sort(
      (a, b) =>
        (b.currentBalance ?? b.initialBalance ?? 0) - (a.currentBalance ?? a.initialBalance ?? 0)
    )
    .slice(0, 3);

  const ACC_COLORS = [
    { accent: '#f97316', light: '#fff7ed', border: '#fed7aa' },
    { accent: C.primary, light: C.primaryLight, border: '#b2d0c5' },
    { accent: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
  ];

  const ACC_W = (CW - 8) / 3;
  const ACC_H = 24;

  topAccounts.forEach((acc, i) => {
    const x = M + i * (ACC_W + 4);
    const color = ACC_COLORS[i % ACC_COLORS.length];
    const balance = acc.currentBalance ?? acc.initialBalance ?? 0;

    // Card
    doc.setFillColor(...rgb(C.surface));
    doc.setDrawColor(...rgb(color.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cursor, ACC_W, ACC_H, 3, 3, 'FD');

    // Top accent strip
    doc.setFillColor(...rgb(color.accent));
    doc.roundedRect(x, cursor, ACC_W, 3, 1.5, 1.5, 'F');
    doc.rect(x, cursor + 1.5, ACC_W, 1.5, 'F');

    // Icon circle
    doc.setFillColor(...rgb(color.light));
    doc.circle(x + 9, cursor + 12, 5, 'F');

    // Icon initial
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...rgb(color.accent));
    doc.text(acc.name.charAt(0).toUpperCase(), x + 9, cursor + 13.5, { align: 'center' });

    // Account name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...rgb(C.textMuted));
    const truncName = acc.name.length > 12 ? acc.name.slice(0, 11) + '…' : acc.name;
    doc.text(truncName, x + 16, cursor + 11);

    // Balance
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...rgb(C.textDark));
    doc.text(fmtShort(balance), x + 16, cursor + 19);
  });

  cursor += ACC_H + 10;

  // ─── 7. CATEGORY BREAKDOWNS ──────────────────────────────────────────────
  const expenseByCategory = {};
  const incomeByCategory = {};
  transactions.forEach((t) => {
    const name = t.category?.name || 'Uncategorized';
    if (t.type === 'expense') expenseByCategory[name] = (expenseByCategory[name] || 0) + t.amount;
    if (t.type === 'income') incomeByCategory[name] = (incomeByCategory[name] || 0) + t.amount;
  });

  const topExpCats = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topIncCats = Object.entries(incomeByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const renderCategories = (cats, type, startY) => {
    if (!cats.length) return startY;
    const label = type === 'expense' ? 'Top Spending Categories' : 'Top Income Categories';
    let y = sectionHeader(label, startY);

    const maxAmt = cats[0]?.[1] || 1;
    const CAT_H = 14;
    const CAT_W = (CW - 8) / 3;
    const color = type === 'expense' ? C.expense : C.income;
    const lightBg = type === 'expense' ? C.expenseLight : C.incomeLight;

    cats.forEach((cat, i) => {
      const x = M + i * (CAT_W + 4);
      const ratio = cat[1] / maxAmt;

      doc.setFillColor(...rgb(C.surface));
      doc.setDrawColor(...rgb(C.border));
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, CAT_W, CAT_H, 2, 2, 'FD');

      // Progress bar
      doc.setFillColor(...rgb(lightBg));
      doc.roundedRect(x + 2, y + CAT_H - 3.5, CAT_W - 4, 2, 1, 1, 'F');
      doc.setFillColor(...rgb(color));
      doc.roundedRect(x + 2, y + CAT_H - 3.5, Math.max((CAT_W - 4) * ratio, 2), 2, 1, 1, 'F');

      // Category name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...rgb(C.textMid));
      const truncCat = cat[0].length > 14 ? cat[0].slice(0, 13) + '…' : cat[0];
      doc.text(truncCat, x + 4, y + 6);

      // Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...rgb(color));
      doc.text(fmtShort(cat[1]), x + CAT_W - 4, y + 6, { align: 'right' });

      // Rank badge
      doc.setFillColor(...rgb(lightBg));
      doc.circle(x + CAT_W - 4, y + CAT_H - 6.5, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(...rgb(color));
      doc.text(`#${i + 1}`, x + CAT_W - 4, y + CAT_H - 5.3, { align: 'center' });
    });

    return y + CAT_H + 8;
  };

  cursor = renderCategories(topExpCats, 'expense', cursor);
  cursor = renderCategories(topIncCats, 'income', cursor);

  // ─── 8. TRANSACTION TABLE ────────────────────────────────────────────────
  const tableData = transactions.map((t) => {
    const date = new Date(t.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
    const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
    const cat = t.category?.name || '—';
    const account =
      t.type === 'transfer'
        ? `${t.account?.name || 'Acc'} → ${t.toAccount?.name || 'Acc'}`
        : t.account?.name || '—';
    const amount = fmt(t.amount);
    let note = (t.description || '').trim();
    if (!note || note === 'Transaction' || note === 'Transfer') note = '—';
    return [date, type, cat, account, amount, note];
  });

  autoTable(doc, {
    startY: cursor + 2,
    head: [['Date', 'Type', 'Category', 'Account', 'Amount', 'Notes']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: rgb(C.primary),
      textColor: rgb(C.surface),
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 30 },
      3: { cellWidth: 38 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
      5: { textColor: rgb(C.textMuted), cellWidth: 'auto' },
    },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: rgb(C.borderLight),
      lineWidth: 0.2,
      textColor: rgb(C.textDark),
      font: 'helvetica',
    },
    alternateRowStyles: {
      fillColor: rgb(C.bg),
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const t = transactions[data.row.index];
      if (!t) return;

      // Type column — color the text
      if (data.column.index === 1) {
        if (t.type === 'expense') data.cell.styles.textColor = rgb(C.expense);
        if (t.type === 'income') data.cell.styles.textColor = rgb(C.income);
        if (t.type === 'transfer') data.cell.styles.textColor = rgb(C.transfer);
        data.cell.styles.fontStyle = 'bold';
      }

      // Amount column — color
      if (data.column.index === 4) {
        if (t.type === 'expense') data.cell.styles.textColor = rgb(C.expense);
        if (t.type === 'income') data.cell.styles.textColor = rgb(C.income);
        if (t.type === 'transfer') data.cell.styles.textColor = rgb(C.transfer);
      }
    },
    didDrawCell: (data) => {
      // Dot indicator in the Type cell
      if (data.section === 'body' && data.column.index === 1) {
        const t = transactions[data.row.index];
        if (!t) return;
        const dotColor =
          t.type === 'expense' ? C.expense : t.type === 'income' ? C.income : C.transfer;
        doc.setFillColor(...rgb(dotColor));
        doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 1.2, 'F');
      }
    },
    didDrawPage: (data) => {
      // ── Continuation page header ─────────────────────────────────────────
      if (data.pageNumber > 1) {
        doc.setFillColor(...rgb(C.primary));
        doc.rect(0, 0, PW, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...rgb(C.surface));
        doc.text('Pocketly  ·  Transaction Report', M, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...rgb(C.primaryMuted));
        doc.text(`Page ${data.pageNumber}`, PW - M, 8, { align: 'right' });
      }

      // ── Footer ────────────────────────────────────────────────────────────
      const fy = PH - 8;
      doc.setDrawColor(...rgb(C.borderLight));
      doc.setLineWidth(0.3);
      doc.line(M, fy - 3, PW - M, fy - 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...rgb(C.textFaint));
      doc.text(
        `Pocketly  ·  Generated ${new Date().toLocaleString('en-IN')}  ·  Page ${data.pageNumber}`,
        PW / 2,
        fy,
        { align: 'center' }
      );
    },
  });

  return doc;
};
