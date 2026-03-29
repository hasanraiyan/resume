import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Card } from '@/components/ui';

export default function FinanceTrackerPage() {
  return (
    <AdminPageWrapper
      title="Finance Tracker"
      description="Manage your personal or business finances in one place. Add incomes, expenses, budgets, and reports."
    >
      <Card className="p-8 rounded-2xl border border-neutral-200 bg-white" variant="flat">
        <h2 className="text-xl font-semibold text-black mb-3">Finance Tracker is coming soon</h2>
        <p className="text-neutral-600">
          Use this screen to build your new finance tracker app. For now, your navigation entry is
          live and routed correctly.
        </p>
      </Card>
    </AdminPageWrapper>
  );
}
