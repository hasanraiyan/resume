import { getAllServices } from '@/app/actions/serviceActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
        <Button href="/admin/sections/services/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> Add Service
        </Button>
      }
    >
      <div className="grid gap-6 max-w-6xl mx-auto">
        {services.length === 0 ? (
          <Card className="text-center py-24 bg-white/50 backdrop-blur-md border border-neutral-200/50 shadow-xl rounded-2xl group">
            <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
              <i className="fas fa-sparkles text-neutral-400 text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-black mb-3">No services yet</h3>
            <p className="text-neutral-500 mb-10 text-lg max-w-sm mx-auto">
              Ready to showcase your expertise? Start by creating your first service offering.
            </p>
            <Button href="/admin/sections/services/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Create First Service
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {services.map((service, index) => {
              console.log('🔲 [ADMIN SERVICES PAGE] Rendering service card:', service.title);
              return (
                <Card
                  key={service._id}
                  className="group p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/70 backdrop-blur-md border border-neutral-200/50 hover:border-black/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                >
                  <div className="flex items-center space-x-6 w-full sm:w-auto">
                    <div className="w-14 h-14 bg-black text-white rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <i className={service.icon}></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-bold text-lg text-black">{service.title}</p>
                        {!service.isActive && (
                          <Badge
                            variant="tag"
                            className="bg-neutral-100 text-neutral-500 text-[10px] uppercase tracking-wider py-0.5"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 max-w-md line-clamp-1">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-8 mt-6 sm:mt-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-neutral-100">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">
                        Display Order
                      </span>
                      <span className="text-sm font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                        {String(service.displayOrder || 0).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        href={`/admin/sections/services/${service._id}/edit`}
                        variant="ghost"
                        size="small"
                        className="bg-neutral-50 hover:bg-black hover:text-white rounded-lg transition-all duration-300"
                      >
                        <i className="fas fa-edit mr-2"></i> Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
