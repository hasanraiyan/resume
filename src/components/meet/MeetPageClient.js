// src/components/meet/MeetPageClient.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useWebRTC } from '@/hooks/useWebRTC';

const VideoStream = ({ stream, isMuted = false }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-full h-full object-cover"
    />
  );
};

export default function MeetPageClient({ meetingId, user }) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const router = useRouter();

  const { localStream, remoteStreams, toggleMedia, leaveRoom } = useWebRTC(meetingId, user);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleToggleMic = () => {
    toggleMedia('audio', !isMicOn);
    setIsMicOn(!isMicOn);
  };

  const handleToggleCamera = () => {
    toggleMedia('video', !isCameraOn);
    setIsCameraOn(!isCameraOn);
  };

  const handleLeave = () => {
    leaveRoom();
    router.push('/meet');
  };

  if (!isJoined) {
    // --- Green Room UI ---
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center bg-neutral-50 gap-8 p-4">
        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg shadow-lg">
          <video
            ref={localVideoRef}
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
              onClick={handleToggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-neutral-600/50 text-white' : 'bg-red-500 text-white'}`}
            >
              {isMicOn ? <Mic /> : <MicOff />}
            </button>
            <button
              onClick={handleToggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-neutral-600/50 text-white' : 'bg-red-500 text-white'}`}
            >
              {isCameraOn ? <Video /> : <VideoOff />}
            </button>
          </div>
        </div>
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
  const remotePeers = Object.keys(remoteStreams);

  return (
    <div className="relative w-screen h-screen bg-neutral-800 flex flex-col items-center justify-center text-white p-4">
      {/* Main Participant Grid */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Peers */}
        {remotePeers.map((peerId) => (
          <div key={peerId} className="bg-black rounded-lg overflow-hidden relative">
            <VideoStream stream={remoteStreams[peerId]} />
            <span className="absolute bottom-2 left-2 text-sm bg-black/50 px-2 py-1 rounded">
              {peerId}
            </span>
          </div>
        ))}

        {/* Placeholder if alone */}
        {remotePeers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
            <Users className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-semibold">You're the first one here</h2>
            <p className="mt-2">
              Invite others with the meeting code:{' '}
              <code className="bg-neutral-700 px-2 py-1 rounded">{meetingId}</code>
            </p>
          </div>
        )}
      </div>

      {/* Self View */}
      <div className="absolute bottom-24 right-4 w-48 h-27 bg-black rounded-lg overflow-hidden border-2 border-neutral-600">
        <VideoStream stream={localStream} isMuted={true} />
        <div className="absolute bottom-1 left-2 text-xs">{user.name} (You)</div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-700/50 backdrop-blur-md p-3 rounded-full">
        <button
          onClick={handleToggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-neutral-600' : 'bg-red-500'}`}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </button>
        <button
          onClick={handleToggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-neutral-600' : 'bg-red-500'}`}
        >
          {isCameraOn ? <Video /> : <VideoOff />}
        </button>
        <button
          onClick={handleLeave}
          className="w-20 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors"
        >
          <PhoneOff />
        </button>
        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-600">
          <MessageSquare />
        </button>
        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-600">
          <Users />
        </button>
      </div>
    </div>
  );
}
