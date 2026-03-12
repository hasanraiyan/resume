'use client';

import { createService } from '@/app/actions/serviceActions';
import ServiceForm from '@/components/admin/ServiceForm';

export default function NewServicePage() {
  return <ServiceForm onSave={createService} isEditing={false} />;
}
