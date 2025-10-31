'use client';

import { createTechnology } from '@/app/actions/technologyActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Input } from '@/components/ui';
import IconPicker from '@/components/admin/IconPicker';
import Link from 'next/link';
import { useState } from 'react';

export default function NewTechnologyPage() {
  const [iconType, setIconType] = useState('fa');
  const [iconName, setIconName] = useState('');
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
            <select
              id="iconType"
              name="iconType"
              value={iconType}
              onChange={(e) => {
                setIconType(e.target.value);
                setIconName('');
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="fa">FontAwesome</option>
              <option value="lucide">Lucide</option>
            </select>
          </div>

          <div>
            <label htmlFor="iconName" className="block text-sm font-medium text-neutral-700 mb-2">
              Icon {iconType === 'fa' ? 'Picker' : 'Name'} *
            </label>
            {iconType === 'fa' ? (
              <IconPicker
                selectedIcon={iconName}
                onIconSelect={setIconName}
                placeholder="Choose a FontAwesome icon..."
                className="w-full"
              />
            ) : (
              <Input
                type="text"
                id="iconName"
                name="iconName"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="e.g., Server, Database, Code"
                required
              />
            )}
            <input type="hidden" name="iconName" value={iconName} />
            <p className="text-sm text-neutral-500 mt-1">
              {iconType === 'fa'
                ? 'Choose from FontAwesome icons'
                : 'Use the Lucide icon component name (e.g., Server, Database, Code)'}
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
