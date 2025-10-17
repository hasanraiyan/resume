// src/components/meet/MeetPageClient.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare } from 'lucide-react';
import { Button } from '@/components/ui';

// This is a simplified placeholder for the UI.
// The full WebRTC logic would be complex and is abstracted for this example.

export default function MeetPageClient({ meetingId, user }) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef(null);
  const router = useRouter();

  // Get user's camera and mic
  useEffect(() => {
    async function getMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
        alert('Could not access your camera or microphone. Please check permissions.');
        setIsCameraOn(false);
        setIsMicOn(false);
      }
    }
    if (!isJoined) {
      getMedia();
    }
  }, [isJoined]);

  if (!isJoined) {
    // --- Green Room UI ---
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center bg-neutral-50 gap-8 p-4">
        {/* Left: Video Preview */}
        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            className={`w-full h-full object-cover rounded-lg ${!isCameraOn && 'hidden'}`}
          ></video>
          {!isCameraOn && (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-16 h-16 text-neutral-600" />
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-neutral-600/50 text-white' : 'bg-red-500 text-white'}`}
            >
              {isMicOn ? <Mic /> : <MicOff />}
            </button>
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-neutral-600/50 text-white' : 'bg-red-500 text-white'}`}
            >
              {isCameraOn ? <Video /> : <VideoOff />}
            </button>
          </div>
        </div>

        {/* Right: Join Actions */}
        <div className="text-center md:text-left w-full max-w-sm">
          <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-4">Ready to join?</h2>
          <p className="text-neutral-500 mb-8">No one else is here.</p>
          <Button
            variant="primary"
            size="large"
            onClick={() => setIsJoined(true)}
            className="w-full sm:w-auto"
          >
            Join now
          </Button>
          <div className="mt-6">
            <Button variant="ghost">
              <ScreenShare className="w-5 h-5 mr-2" /> Present
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- In-Meeting UI ---
  return (
    <div className="relative w-screen h-screen bg-neutral-800 flex items-center justify-center text-white">
      {/* Main Participant Area */}
      <div className="flex items-center justify-center">
        <div className="w-40 h-40 bg-red-800 rounded-full flex items-center justify-center">
          <span className="text-6xl font-medium">{user.name.charAt(0).toUpperCase()}</span>
        </div>
      </div>

      {/* Self View */}
      <div className="absolute bottom-24 right-4 w-48 h-27 bg-black rounded-lg overflow-hidden border-2 border-neutral-600">
        <video
          ref={videoRef}
          autoPlay
          muted
          className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}
        ></video>
        {!isCameraOn && (
          <div className="w-full h-full flex items-center justify-center bg-neutral-900">
            <VideoOff className="w-8 h-8 text-neutral-500" />
          </div>
        )}
        <div className="absolute bottom-1 left-2 text-xs">{user.name}</div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-700/50 backdrop-blur-md p-3 rounded-full">
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-neutral-600' : 'bg-red-500'}`}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </button>
        <button
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-neutral-600' : 'bg-red-500'}`}
        >
          {isCameraOn ? <Video /> : <VideoOff />}
        </button>
        <button
          onClick={() => router.push('/meet')}
          className="w-20 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors"
        >
          <PhoneOff />
        </button>
        {/* Add other controls like captions, present, etc. here */}
      </div>
    </div>
  );
}
