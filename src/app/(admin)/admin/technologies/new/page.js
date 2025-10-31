import { createTechnology } from '@/app/actions/technologyActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Input, Select } from '@/components/ui';
import Link from 'next/link';

export default function NewTechnologyPage() {
  return (
    <AdminPageWrapper
      title="Create New Technology"
      description="Add a new technology to your stack."
    >
      <Card className="p-6">
        <form action={createTechnology} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              Technology Name *
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="e.g., React, Node.js, Docker"
              required
            />
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
              placeholder="e.g., faReact, Server, Database"
              required
            />
            <p className="text-sm text-neutral-500 mt-1">
              Use the icon component name (e.g., faReact for FontAwesome, Server for Lucide)
            </p>
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
            <Link href="/admin/technologies">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit">
              <i className="fas fa-save mr-2"></i>
              Create Technology
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageWrapper>
  );
}
