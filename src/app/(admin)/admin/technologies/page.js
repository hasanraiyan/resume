import { getAllTechnologies } from '@/app/actions/technologyActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/custom-ui';
import Link from 'next/link';

export default async function TechnologiesPage() {
  const technologies = await getAllTechnologies();

  return (
    <AdminPageWrapper
      title="Technologies"
      description="Manage your technology stack and tools."
      actionButton={
        <Button href="/admin/technologies/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> Add Technology
        </Button>
      }
    >
      <div className="space-y-4">
        {technologies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-cogs text-neutral-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No technologies yet</h3>
            <p className="text-neutral-600 mb-8">Get started by adding your first technology.</p>
            <Button href="/admin/technologies/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Add First Technology
            </Button>
          </div>
        ) : (
          technologies.map((tech) => (
            <Card key={tech._id} className="p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-code text-neutral-600"></i>
                </div>
                <div>
                  <p className="font-bold">{tech.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-600">
                      Icon: {tech.iconType}/{tech.iconName}
                    </span>
                    <Badge variant={tech.isActive ? 'success' : 'secondary'}>
                      {tech.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-500">Order: {tech.displayOrder}</span>
                <Link href={`/admin/technologies/${tech._id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <i className="fas fa-edit"></i>
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </AdminPageWrapper>
  );
}
