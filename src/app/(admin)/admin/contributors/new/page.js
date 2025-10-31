import ContributorForm from '@/components/admin/ContributorForm';
import { createContributor } from '@/app/actions/contributorActions';

export default function NewContributorPage() {
  return <ContributorForm onSave={createContributor} />;
}
