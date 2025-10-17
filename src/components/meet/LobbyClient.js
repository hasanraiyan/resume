// src/components/meet/LobbyClient.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Video, Plus, Keyboard } from 'lucide-react';

export default function LobbyClient({ isAdmin }) {
  const [meetingCode, setMeetingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateMeeting = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meet', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        router.push(`/meet/${data.meetingId}`);
      } else {
        alert('Failed to create meeting. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      // Basic validation for abc-def-ghi format
      const code = meetingCode.trim().split('/').pop();
      if (/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/.test(code)) {
        router.push(`/meet/${code}`);
      } else {
        alert('Please enter a valid meeting code.');
      }
    }
  };

  return (
    <div className="text-center max-w-2xl mx-auto px-4">
      <h1 className="text-4xl md:text-5xl font-bold font-['Playfair_Display'] mb-4">
        Video calls and meetings
      </h1>
      <p className="text-lg text-neutral-600 mb-12">
        Connect, collaborate, and celebrate from anywhere.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {isAdmin && (
          <Button variant="primary" onClick={handleCreateMeeting} disabled={isLoading}>
            {isLoading ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            New meeting
          </Button>
        )}
        <form onSubmit={handleJoinMeeting} className="flex items-center gap-2">
          <div className="relative">
            <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              placeholder="Enter a code or link"
              className="pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-black w-64"
            />
          </div>
          <Button
            type="submit"
            variant="ghost"
            disabled={!meetingCode.trim()}
            className="disabled:opacity-50"
          >
            Join
          </Button>
        </form>
      </div>

      <div className="w-full h-px bg-neutral-200 my-12"></div>

      <div className="text-center">
        <Video className="w-16 h-16 text-neutral-400 mx-auto" />
        <h3 className="text-xl font-semibold mt-4">Get a link you can share</h3>
        <p className="text-neutral-500 mt-1">
          {isAdmin
            ? 'Click "New meeting" to get a link you can send to people you want to meet with.'
            : 'Enter a meeting code to join a scheduled call.'}
        </p>
      </div>
    </div>
  );
}
