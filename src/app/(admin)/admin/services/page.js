import { getAllServices } from '@/app/actions/serviceActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';
import Link from 'next/link';

export default async function ServicesPage() {
  console.log('📋 [ADMIN SERVICES PAGE] Loading services admin page...');
  const services = await getAllServices();
  console.log('📊 [ADMIN SERVICES PAGE] Services loaded:', services.length);
  console.log('🔍 [ADMIN SERVICES PAGE] Services data:', services);

  return (
    <AdminPageWrapper
      title="Services"
      description="Manage the services you offer on your portfolio."
      actionButton={
        <Button href="/admin/services/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> Add Service
        </Button>
      }
    >
      <div className="space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-cog text-neutral-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No services yet</h3>
            <p className="text-neutral-600 mb-8">
              Get started by creating your first service offering.
            </p>
            <Button href="/admin/services/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Create First Service
            </Button>
          </div>
        ) : (
          services.map((service) => {
            console.log('🔲 [ADMIN SERVICES PAGE] Rendering service card:', service.title);
            return (
              <Card key={service._id} className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <i className={`${service.icon} text-xl w-8 text-center`}></i>
                  <div>
                    <p className="font-bold">{service.title}</p>
                    <p className="text-sm text-neutral-600">
                      {service.description.length > 60
                        ? `${service.description.substring(0, 60)}...`
                        : service.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {!service.isActive && (
                    <Badge variant="tag" className="bg-neutral-100 text-neutral-600">
                      Inactive
                    </Badge>
                  )}
                  <div className="text-sm text-neutral-500">Order: {service.displayOrder || 0}</div>
                  <Button href={`/admin/services/${service._id}/edit`} variant="ghost" size="small">
                    Edit
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </AdminPageWrapper>
  );
}
