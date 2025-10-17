'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Section } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import io from 'socket.io-client';
import VideoPlayer from '@/components/ui/VideoPlayer';

// A simple, temporary unique ID generator
const generateParticipantId = () => `anon-${Math.random().toString(36).substring(2, 9)}`;

const iceServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VideoCallRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [participantId] = useState(generateParticipantId());
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Function to send signals via WebSocket
  const sendSignal = useCallback(
    (receiverId, type, data) => {
      socketRef.current.emit('relay-signal', {
        roomId,
        senderId: participantId,
        receiverId,
        type,
        data,
      });
    },
    [roomId, participantId]
  );

  // Function to create a peer connection
  const createPeerConnection = useCallback(
    (peerId) => {
      if (peerConnectionsRef.current.has(peerId)) {
        return peerConnectionsRef.current.get(peerId);
      }

      console.log(`Creating peer connection for ${peerId}`);
      const pc = new RTCPeerConnection(iceServers);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, 'candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        console.log(`Received remote track from ${peerId}`);
        setRemoteStreams((prev) => {
          // Avoid adding duplicate streams
          if (prev.find((p) => p.peerId === peerId)) {
            return prev;
          }
          return [...prev, { peerId, stream: event.streams[0] }];
        });
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [sendSignal]
  );

  // Main useEffect for WebSocket connection and event handling
  useEffect(() => {
    // Connect to the signaling server
    const socket = io(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:4000');
    socketRef.current = socket;

    // 1. Join the room once connected
    socket.on('connect', () => {
      console.log('Connected to signaling server with socket ID:', socket.id);
      socket.emit('join-room', roomId, participantId);
    });

    // 2. Receive list of existing participants and create offers
    socket.on('existing-participants', (participants) => {
      console.log('Existing participants:', participants);
      participants.forEach((peerId) => {
        const pc = createPeerConnection(peerId);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            sendSignal(peerId, 'offer', pc.localDescription);
          });
      });
    });

    // 3. A new user has joined, create a peer connection for them
    socket.on('user-joined', (peerId) => {
      console.log(`New user joined: ${peerId}. We will wait for their offer.`);
      // The new user will send us an offer, which is handled by 'signal-received'
      createPeerConnection(peerId);
    });

    // 4. Handle signals received from other users
    socket.on('signal-received', async ({ senderId, type, data }) => {
      console.log(`Signal received from ${senderId}:`, type);
      const pc = createPeerConnection(senderId);

      switch (type) {
        case 'offer':
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(senderId, 'answer', answer);
          break;
        case 'answer':
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          break;
        case 'candidate':
          if (data) {
            await pc.addIceCandidate(new RTCIceCandidate(data));
          }
          break;
      }
    });

    // 5. A user has left, clean up their connection
    socket.on('user-left', (peerId) => {
      console.log(`User left: ${peerId}`);
      if (peerConnectionsRef.current.has(peerId)) {
        peerConnectionsRef.current.get(peerId).close();
        peerConnectionsRef.current.delete(peerId);
      }
      setRemoteStreams((prev) => prev.filter((p) => p.peerId !== peerId));
    });

    // Cleanup on component unmount
    return () => {
      console.log('Cleaning up video call component...');
      socket.disconnect();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
    };
  }, [roomId, participantId, createPeerConnection, sendSignal]);

  // Get user media
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        // If peer connections already exist, add tracks to them
        peerConnectionsRef.current.forEach((pc) => {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        });
      } catch (error) {
        console.error('Error accessing media devices.', error);
        toast.error('Could not access camera or microphone.');
      }
    };
    getMedia();
  }, []);

  const leaveCall = () => {
    socketRef.current.emit('leave-room');
    router.push('/video-call');
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
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
            <VideoPlayer stream={localStream} muted={true} />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
              You
            </div>
          </div>

          {/* Remote Videos */}
          {remoteStreams.map(({ peerId, stream }) => (
            <div key={peerId} className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer key={stream.id} stream={stream} />
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
