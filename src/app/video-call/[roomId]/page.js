'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Section } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import ActionButton from '@/components/admin/ActionButton';

// A simple, temporary unique ID generator for anonymous users
const generateParticipantId = () => `anon-${Math.random().toString(36).substring(2, 9)}`;

// Using a public STUN server
const iceServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VideoCallRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [participantId] = useState(generateParticipantId());
  const [lastPoll, setLastPoll] = useState(new Date().toISOString());

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map()); // Store refs to video elements

  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Helper function to send signals
  const sendSignal = useCallback(
    async (receiverId, type, payload) => {
      try {
        await fetch(`/api/video-call/${roomId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: participantId, receiverId, type, payload }),
        });
      } catch (error) {
        console.error('Error sending signal:', error);
      }
    },
    [roomId, participantId]
  );

  const createPeerConnection = useCallback(
    (peerId) => {
      if (peerConnectionsRef.current.has(peerId)) {
        return peerConnectionsRef.current.get(peerId);
      }

      const pc = new RTCPeerConnection(iceServers);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, 'candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        console.log(`Received remote track from ${peerId}`);
        const stream = event.streams[0];
        setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [sendSignal]
  );

  // Join room and handle offers
  useEffect(() => {
    if (!localStreamRef.current) return;

    const joinRoom = async () => {
      try {
        const response = await fetch(`/api/video-call/${roomId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId }),
        });
        const { otherParticipants } = await response.json();

        console.log('Other participants:', otherParticipants);

        // Create offer for each existing participant
        otherParticipants.forEach(async (peerId) => {
          const pc = createPeerConnection(peerId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(peerId, 'offer', offer);
        });
      } catch (error) {
        console.error('Error joining room:', error);
      }
    };

    joinRoom();
  }, [roomId, participantId, createPeerConnection, sendSignal]);

  // Polling for signals
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/video-call/${roomId}/poll?participantId=${participantId}&since=${lastPoll}`
        );
        const { signals } = await response.json();
        setLastPoll(new Date().toISOString());

        signals.forEach(async (signal) => {
          const { senderId, type, payload } = signal;
          const pc = createPeerConnection(senderId);

          switch (type) {
            case 'offer':
              await pc.setRemoteDescription(new RTCSessionDescription(payload));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal(senderId, 'answer', answer);
              break;
            case 'answer':
              await pc.setRemoteDescription(new RTCSessionDescription(payload));
              break;
            case 'candidate':
              if (payload) {
                // a null candidate can be sent
                await pc.addIceCandidate(new RTCIceCandidate(payload));
              }
              break;
            default:
              break;
          }
        });
      } catch (error) {
        console.error('Error polling signals:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [roomId, participantId, lastPoll, createPeerConnection, sendSignal]);

  // Get user media
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices.', error);
        toast.error('Could not access camera or microphone.');
      }
    };
    getMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
    };
  }, []);

  // Effect to attach remote streams to video elements
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      const videoEl = remoteVideoRefs.current.get(peerId);
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    router.push('/video-call');
  };

  return (
    <Section id="video-call-room" className="py-8 min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-2">Video Call Room</h1>
        <p className="text-sm text-gray-500 mb-4">
          Room ID: {roomId.substring(0, 8)}... | Your ID: {participantId}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          {/* Local Video */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
              You
            </div>
          </div>

          {/* Remote Videos */}
          {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
            <div key={peerId} className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={(el) => remoteVideoRefs.current.set(peerId, el)}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                Participant {peerId.substring(0, 5)}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm p-4">
          <div className="flex justify-center items-center bg-white rounded-full shadow-lg p-3 space-x-4">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            <button
              onClick={leaveCall}
              className="p-3 rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
