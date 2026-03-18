'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppEditor from '@/components/AppEditor';

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.id;

  const [initialData, setInitialData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchApp = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/apps/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch app');
      const data = await res.json();

      setInitialData({
        name: data.app.name,
        description: data.app.description,
        content: data.app.content,
        designSchema: data.app.designSchema || 'modern',
        type: data.app.type,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (appId) fetchApp();
  }, [appId, fetchApp]);

  const handleSave = async (data) => {
    const res = await fetch(`/api/admin/apps/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update app');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-1/3 bg-neutral-100 animate-pulse rounded-lg" />
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-[700px] bg-neutral-100 animate-pulse rounded-2xl" />
          <div className="lg:col-span-4 h-[400px] bg-neutral-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <AppEditor
      isEdit={true}
      initialData={initialData}
      onSave={handleSave}
      showModeSelection={false}
    />
  );
}
