import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Skeleton, Card } from '@/components/ui';

export default function ServicesLoading() {
  return (
    <AdminPageWrapper
      title="Services"
      description="Manage the services you offer on your portfolio."
      actionButton={<div className="h-10 w-32 bg-neutral-200 rounded-lg animate-pulse" />}
    >
      <div className="space-y-4 max-w-6xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card
            key={i}
            className="p-6 flex justify-between items-center border border-neutral-100 shadow-sm bg-white/50 backdrop-blur-sm"
          >
            <div className="flex items-center space-x-6 w-full">
              <Skeleton variant="circle" className="w-12 h-12 flex-shrink-0" />
              <div className="space-y-2 w-full max-w-md">
                <Skeleton variant="text" className="w-1/3 h-6" />
                <Skeleton variant="text" className="w-full h-4" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton variant="rect" className="w-16 h-8" />
              <Skeleton variant="rect" className="w-12 h-8" />
            </div>
          </Card>
        ))}
      </div>
    </AdminPageWrapper>
  );
}
