import { createSkill } from '@/app/actions/skillActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Input, Textarea } from '@/components/ui';
import Link from 'next/link';

export default function NewSkillPage() {
  return (
    <AdminPageWrapper
      title="Create New Skill"
      description="Add a new technical skill to your portfolio."
    >
      <Card className="p-6">
        <form action={createSkill} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              Skill Name *
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="e.g., JavaScript, React, Node.js"
              required
            />
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-neutral-700 mb-2">
              Proficiency Level (0-100) *
            </label>
            <Input
              type="number"
              id="level"
              name="level"
              min="0"
              max="100"
              placeholder="e.g., 95"
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
            <p className="text-sm text-neutral-500 mt-1">
              Lower numbers appear first. Leave as 0 for auto-ordering.
            </p>
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
            <Link href="/admin/skills">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit">
              <i className="fas fa-save mr-2"></i>
              Create Skill
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageWrapper>
  );
}
