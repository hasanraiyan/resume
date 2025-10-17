'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/components/ui';
import ActionButton from '@/components/admin/ActionButton';
import toast from 'react-hot-toast';

// Browser-compatible random ID generator
const generateRoomId = () => {
  return 'room-' + Math.random().toString(36).substring(2, 11);
};

export default function CreateVideoCallPage() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateRoom = () => {
    setIsCreating(true);
    toast.loading('Creating a new room...');

    const newRoomId = generateRoomId();

    // A slight delay to allow the toast to be seen
    setTimeout(() => {
      toast.success('Room created! Redirecting...');
      router.push(`/video-call/${newRoomId}`);
    }, 500);
  };

  return (
    <Section
      id="create-video-call"
      title="Video Call Demo"
      description="Click the button below to create a new video call room and get a shareable link."
      centered={true}
      className="py-24"
    >
      <div className="text-center">
        <ActionButton
          onClick={handleCreateRoom}
          isSaving={isCreating}
          text="Create New Demo Room"
          savingText="Creating..."
          variant="primary"
          className="px-10 py-5"
        />
      </div>
    </Section>
  );
}
