import { createCertification } from '@/app/actions/certificationActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Input, Select } from '@/components/ui';
import Link from 'next/link';

export default function NewCertificationPage() {
  return (
    <AdminPageWrapper
      title="Create New Certification"
      description="Add a new professional certification."
    >
      <Card className="p-6">
        <form action={createCertification} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              Certification Name *
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="e.g., AWS Certified Solutions Architect"
              required
            />
          </div>

          <div>
            <label htmlFor="issuer" className="block text-sm font-medium text-neutral-700 mb-2">
              Issuing Organization *
            </label>
            <Input
              type="text"
              id="issuer"
              name="issuer"
              placeholder="e.g., Amazon Web Services"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-2">
              Certification Date/Year *
            </label>
            <Input type="text" id="date" name="date" placeholder="e.g., 2023" required />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-neutral-700 mb-2">
              Verification URL *
            </label>
            <Input type="url" id="url" name="url" placeholder="https://..." required />
            <p className="text-sm text-neutral-500 mt-1">
              Link to verify or view the certification details
            </p>
          </div>

          <div>
            <label htmlFor="iconType" className="block text-sm font-medium text-neutral-700 mb-2">
              Icon Type *
            </label>
            <Select id="iconType" name="iconType" required>
              <option value="">Select icon type</option>
              <option value="fa">FontAwesome</option>
              <option value="lucide">Lucide</option>
            </Select>
          </div>

          <div>
            <label htmlFor="iconName" className="block text-sm font-medium text-neutral-700 mb-2">
              Icon Name *
            </label>
            <Input
              type="text"
              id="iconName"
              name="iconName"
              placeholder="e.g., faAws, Server"
              required
            />
          </div>

          <div>
            <label
              htmlFor="displayOrder"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Display Order
            </label>
            <Input
              type="number"
              id="displayOrder"
              name="displayOrder"
              placeholder="e.g., 1"
              defaultValue="0"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-neutral-700">Active (visible on site)</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href="/admin/certifications">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit">
              <i className="fas fa-save mr-2"></i>
              Create Certification
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageWrapper>
  );
}
