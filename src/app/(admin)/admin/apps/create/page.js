'use client';

import { useRouter } from 'next/navigation';
import AppEditor from '@/components/AppEditor';

export default function CreateAppPage() {
  const router = useRouter();

  const handleSave = async (data) => {
    const res = await fetch('/api/admin/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push('/admin/apps');
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save app');
    }
  };

  return <AppEditor showModeSelection={true} onSave={handleSave} />;
}
