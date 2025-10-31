import { Button } from '@/components/ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import ContributorsClient from '@/components/admin/ContributorsClient';
import { getAllContributors } from '@/app/actions/contributorActions';

export default async function ContributorsPage() {
  const { success, contributors } = await getAllContributors();

  return (
    <AdminPageWrapper
      title="Contributors"
      description="Create and manage project contributors. Add team members and collaborators to your portfolio projects."
      actionButton={
        <Button href="/admin/contributors/new" variant="primary">
          <i className="fas fa-plus mr-2"></i>
          Add Contributor
        </Button>
      }
    >
      <ContributorsClient initialContributors={contributors} />
    </AdminPageWrapper>
  );
}
