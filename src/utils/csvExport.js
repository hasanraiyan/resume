/**
 * Advanced CSV Export utility for Pocketly
 */

export const downloadTransactionsCsv = (transactions, filters = {}) => {
  const { type, categoryId, startDate, endDate } = filters;

  // 1. Filter transactions
  let filtered = [...transactions];

  if (type && type !== 'all') {
    filtered = filtered.filter((t) => t.type === type);
  }

  if (categoryId && categoryId !== 'all') {
    filtered = filtered.filter((t) => {
      const tCatId = t.category?._id || t.category?.id || t.category;
      return tCatId === categoryId;
    });
  }

  if (startDate) {
    const start = new Date(startDate);
    filtered = filtered.filter((t) => new Date(t.date) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    filtered = filtered.filter((t) => new Date(t.date) <= end);
  }

  // 2. Format CSV
  const headers = [
    'Date',
    'Type',
    'Category',
    'Account',
    'To Account',
    'Amount',
    'Description',
    'Note',
  ];

  const rows = filtered.map((t) => [
    new Date(t.date).toLocaleDateString('en-IN'),
    t.type,
    t.category?.name || '',
    t.account?.name || '',
    t.toAccount?.name || '',
    t.amount,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  // 3. Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `pocketly_transactions_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
