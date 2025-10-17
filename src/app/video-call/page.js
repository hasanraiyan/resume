'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/components/ui';
import ActionButton from '@/components/admin/ActionButton';
import toast from 'react-hot-toast';

export default function CreateVideoCallPage() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setIsCreating(true);
    const toastId = toast.loading('Creating a new room...');

    try {
      const response = await fetch('/api/video-call/create', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const { roomId } = await response.json();
      toast.success('Room created! Redirecting...', { id: toastId });
      router.push(`/video-call/${roomId}`);
    } catch (error) {
      console.error('Error creating video call room:', error);
      toast.error('Could not create a room. Please try again.', { id: toastId });
      setIsCreating(false);
    }
  };

  return (
    <Section
      id="create-video-call"
      title="Video Call Demo"
      description="Create a new video call room to test the WebRTC implementation."
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
