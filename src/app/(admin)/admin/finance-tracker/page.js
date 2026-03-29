import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FinanceTrackerClient from '@/components/admin/finance-tracker/FinanceTrackerClient';
import { getCategories, getFinanceSummary } from './actions';

export const metadata = {
  title: 'Finance Tracker | Admin Dashboard',
};

export default async function FinanceTrackerPage() {
  const [categoriesResult, summaryResult] = await Promise.all([
    getCategories(),
    getFinanceSummary(),
  ]);

  const categories = categoriesResult.success ? categoriesResult.categories : [];
  const summary = summaryResult.success
    ? summaryResult.summary
    : { total: 0, income: 0, expense: 0 };

  return (
    <AdminPageWrapper
      title="Finance Tracker"
      description="Manage your categories, income, and expenses securely in one place."
    >
      <div className="w-full flex justify-center pb-12">
        <FinanceTrackerClient initialCategories={categories} summary={summary} />
      </div>
    </AdminPageWrapper>
  );
}
