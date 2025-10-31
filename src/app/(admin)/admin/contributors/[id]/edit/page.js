import ContributorForm from '@/components/admin/ContributorForm';
import { getContributorById, updateContributor } from '@/app/actions/contributorActions';
import { notFound } from 'next/navigation';

export default async function EditContributorPage({ params }) {
  const { success, contributor } = await getContributorById(params.id);

  if (!success || !contributor) {
    notFound();
  }

  return <ContributorForm initialData={contributor} onSave={updateContributor} isEditing={true} />;
}
