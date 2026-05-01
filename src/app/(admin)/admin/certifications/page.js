import { getAllCertifications } from '@/app/actions/certificationActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/custom-ui';
import Link from 'next/link';

export default async function CertificationsPage() {
  const certifications = await getAllCertifications();

  return (
    <AdminPageWrapper
      title="Certifications"
      description="Manage your professional certifications and credentials."
      actionButton={
        <Button href="/admin/certifications/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> Add Certification
        </Button>
      }
    >
      <div className="space-y-4">
        {certifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-certificate text-neutral-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No certifications yet</h3>
            <p className="text-neutral-600 mb-8">Get started by adding your first certification.</p>
            <Button href="/admin/certifications/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Add First Certification
            </Button>
          </div>
        ) : (
          certifications.map((cert) => (
            <Card key={cert._id} className="p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-certificate text-neutral-600"></i>
                </div>
                <div>
                  <p className="font-bold">{cert.name}</p>
                  <p className="text-sm text-neutral-600">
                    {cert.issuer} • {cert.date}
                  </p>
                  <Badge variant={cert.isActive ? 'success' : 'secondary'}>
                    {cert.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-500">Order: {cert.displayOrder}</span>
                <Link href={`/admin/certifications/${cert._id}/edit`}>
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
