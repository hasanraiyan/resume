'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateContactStatus, deleteContact } from '@/app/actions/contactActions';

export default function ContactActions({ contactId }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleArchive = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await updateContactStatus(contactId, 'archived');
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to archive contact:', result.message);
      }
    } catch (error) {
      console.error('Error archiving contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this contact message? This action cannot be undone.'
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await deleteContact(contactId);
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to delete contact:', result.message);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleArchive}
        disabled={isLoading}
        className="text-neutral-600 hover:text-black transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Archive message"
      >
        <i className="fas fa-archive"></i>
      </button>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="text-red-600 hover:text-red-800 transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete message"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
}
