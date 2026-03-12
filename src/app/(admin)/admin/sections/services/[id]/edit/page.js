'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { updateService, deleteService } from '@/app/actions/serviceActions';
import ServiceForm from '@/components/admin/ServiceForm';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

export default function EditServicePage({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('📋 [SERVICE EDIT PAGE] Component initialized for service ID:', unwrappedParams.id);

  useEffect(() => {
    if (!unwrappedParams.id) {
      console.log('⚠️ [SERVICE EDIT PAGE] No service ID provided');
      return;
    }

    console.log('🔍 [SERVICE EDIT PAGE] Fetching service data for ID:', unwrappedParams.id);
    const fetchService = async () => {
      try {
        console.log('🌐 [SERVICE EDIT PAGE] Making API call to fetch service...');
        const response = await fetch(`/api/services/${unwrappedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch service data.');
        }
        const data = await response.json();
        console.log('📥 [SERVICE EDIT PAGE] Service data received:', data.service?.title);
        setService(data.service);
      } catch (err) {
        console.error('❌ [SERVICE EDIT PAGE] Error fetching service:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('🏁 [SERVICE EDIT PAGE] Service fetch operation completed');
      }
    };

    fetchService();
  }, [unwrappedParams.id]);

  if (loading) {
    console.log('⏳ [SERVICE EDIT PAGE] Loading state - showing skeleton UI');
    return (
      <AdminPageWrapper title="Edit Service">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="relative overflow-hidden rounded-3xl bg-neutral-100 px-8 py-12 text-white shadow-sm mb-8 animate-pulse">
            <div className="h-10 w-48 bg-neutral-200 rounded-lg mb-3" />
            <div className="h-6 w-96 bg-neutral-200 rounded-lg" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="p-8 bg-white border border-neutral-100 shadow-sm rounded-3xl space-y-8">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-neutral-100 rounded" />
                  <div className="h-12 w-full bg-neutral-50 rounded-2xl" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-32 bg-neutral-100 rounded" />
                  <div className="h-32 w-full bg-neutral-50 rounded-2xl" />
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="h-64 w-full bg-neutral-100 rounded-[2.5rem] animate-pulse" />
            </div>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  if (error || !service) {
    console.log('❌ [SERVICE EDIT PAGE] Error or no service found:', {
      error,
      hasService: !!service,
    });
    return (
      <AdminPageWrapper title="Error">
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-black mb-2">Could not load service</h3>
          <p className="text-neutral-600 mb-8">{error || 'The service may have been deleted.'}</p>
        </div>
      </AdminPageWrapper>
    );
  }

  console.log('✅ [SERVICE EDIT PAGE] Rendering service form for:', service.title);
  return (
    <ServiceForm
      initialData={service}
      onSave={updateService}
      onDelete={deleteService}
      isEditing={true}
      id={unwrappedParams.id}
    />
  );
}
