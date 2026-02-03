'use client';

// src/app/(admin)/admin/storage/page.js
import { useState } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import UploadThingManagerClient from '@/components/admin/UploadThingManagerClient';

/**
 * Admin storage management page powered by UploadThing.
 *
 * @returns {JSX.Element} The UploadThing storage manager page.
 */
export default function StoragePage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AdminPageWrapper
      title="Storage Manager"
      description="UploadThing-powered storage with uploads, usage insights, and file cleanup tools."
      searchable={true}
      searchPlaceholder="Search by file name, key, or status..."
      onSearch={setSearchTerm}
    >
      <UploadThingManagerClient searchTerm={searchTerm} />
    </AdminPageWrapper>
  );
}
