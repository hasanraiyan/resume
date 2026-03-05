'use client';

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import {
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Lock,
  Users,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const SIGNAL_SERVER_URL =
  process.env.NEXT_PUBLIC_MEET_SIGNAL_URL || 'https://pdfservice.pyqdeck.in';

export default function VideoMeet() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [passcode, setPasscode] = useState('');

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [otherUserJoined, setOtherUserJoined] = useState(false);

  const socketRef = useRef();
  const peerRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const streamRef = useRef();

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SIGNAL_SERVER_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast.error('Signalling server unreachable. Please try again later.');
      setIsConnecting(false);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopMediaTracks();
    };
  }, []);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startCall = async (e) => {
    e.preventDefault();
    if (!roomId || !passcode) {
      toast.error('Room ID and Passcode are required');
      return;
    }

    setIsConnecting(true);

    try {
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Connect to socket
      socketRef.current.connect();

      socketRef.current.emit('join-room', { roomId, passcode });

      // 3. Listen for server responses
      socketRef.current.on('join-error', ({ message }) => {
        toast.error(message || 'Failed to join room');
        handleLeaveCall();
      });

      socketRef.current.on('room-joined', ({ roomId: joinedRoomId, role }) => {
        setInCall(true);
        setIsConnecting(false);
        const isHost = role === 'host';
        toast.success(isHost ? 'Secure room created' : 'Successfully joined session');
      });

      // 4. Handle WebRTC signalling
      socketRef.current.on('user-joined', ({ userId }) => {
        setOtherUserJoined(true);
        toast.info('Peer has joined the session');
        initiatePeer(userId, stream, true);
      });

      socketRef.current.on('signal', ({ from, payload }) => {
        if (!peerRef.current) {
          initiatePeer(from, stream, false);
        }
        peerRef.current.signal(payload);
      });

      socketRef.current.on('peer-disconnected', () => {
        toast.info('The other user has left');
        setRemoteStream(null);
        setOtherUserJoined(false);
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
      });
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Could not access media devices. Check permissions.');
      setIsConnecting(false);
    }
  };

  const initiatePeer = (otherSocketId, stream, isInitiator) => {
    peerRef.current = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream: stream,
    });

    peerRef.current.on('signal', (data) => {
      socketRef.current.emit('signal', {
        roomId,
        payload: data,
      });
    });

    peerRef.current.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peerRef.current.on('error', (err) => {
      console.error('Peer error:', err);
    });
  };

  const handleLeaveCall = () => {
    setInCall(false);
    setIsConnecting(false);
    setOtherUserJoined(false);
    setRemoteStream(null);
    stopMediaTracks();
    setLocalStream(null);

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  if (!inCall) {
    return (
      <div className="bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-2 border-neutral-100 p-10 md:p-12 transition-all">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-neutral-900 leading-tight">
                Session <span className="italic text-neutral-500">Access</span>
              </h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold mt-1">
                Secure Token Required
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
              Cloud Encrypted
            </span>
          </div>
        </div>

        <form onSubmit={startCall} className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="group">
              <label className="block text-[11px] font-bold text-neutral-900 mb-2 uppercase tracking-widest flex items-center gap-2 transition-colors group-focus-within:text-blue-600">
                <Users size={14} className="opacity-50" /> Room Identifier
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. creative-sprint-01"
                className="w-full bg-neutral-50 border-2 border-neutral-100 focus:border-neutral-900 focus:bg-white focus:ring-0 rounded-2xl px-6 py-4 text-neutral-900 placeholder-neutral-400 transition-all outline-none font-medium shadow-sm"
                required
              />
            </div>

            <div className="group">
              <label className="block text-[11px] font-bold text-neutral-900 mb-2 uppercase tracking-widest flex items-center gap-2 transition-colors group-focus-within:text-blue-600">
                <Lock size={14} className="opacity-50" /> Access Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border-2 border-neutral-100 focus:border-neutral-900 focus:bg-white focus:ring-0 rounded-2xl px-6 py-4 text-neutral-900 placeholder-neutral-400 transition-all outline-none font-medium shadow-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isConnecting}
            className={`w-full py-5 rounded-[20px] font-bold uppercase tracking-[0.2em] text-sm text-white transition-all transform active:scale-[0.98] ${
              isConnecting
                ? 'bg-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)]'
            } flex items-center justify-center gap-3`}
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Handshaking...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Establish Connection
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="text-[10px] font-bold uppercase tracking-widest">P2P Mesh</div>
          <div className="w-1 h-1 bg-neutral-400 rounded-full" />
          <div className="text-[10px] font-bold uppercase tracking-widest">WebRTC Core</div>
          <div className="w-1 h-1 bg-neutral-400 rounded-full" />
          <div className="text-[10px] font-bold uppercase tracking-widest">AES-256</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
        {/* Local Video */}
        <div className="relative aspect-video md:aspect-auto bg-neutral-950 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white group">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror bg-neutral-900"
          />
          <div className="absolute top-6 left-6 z-10">
            <div className="bg-black/40 backdrop-blur-xl text-[10px] font-bold uppercase tracking-widest text-white px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}
              />
              Local Stream
            </div>
          </div>
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
              <VideoOff size={64} className="text-neutral-800" />
            </div>
          )}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-2">
              {isMicOn ? (
                <Mic size={14} className="text-white/60" />
              ) : (
                <MicOff size={14} className="text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative aspect-video md:aspect-auto bg-neutral-950 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white border-dashed border-neutral-200 group">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-neutral-900"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-6 p-12 text-center bg-neutral-50/50 backdrop-blur-sm">
              <div className="w-20 h-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center animate-bounce border border-neutral-100">
                <Users size={32} className="text-neutral-900" />
              </div>
              <div className="space-y-2">
                <p className="text-neutral-900 font-serif font-bold text-lg">
                  Awaiting Participant
                </p>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  Share ID: <span className="text-neutral-900 select-all">{roomId}</span>
                </p>
              </div>
            </div>
          )}

          {remoteStream && (
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-black/40 backdrop-blur-xl text-[10px] font-bold uppercase tracking-widest text-white px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 animate-pulse rounded-full" />
                Remote Peer
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Controls Panel */}
      <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] border border-neutral-200/50 flex items-center justify-center gap-8 self-center px-12">
        <button
          onClick={toggleMic}
          className={`p-5 rounded-2xl transition-all transform active:scale-90 flex flex-col items-center gap-2 ${
            isMicOn
              ? 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
          <span className="text-[8px] font-bold uppercase tracking-widest">
            {isMicOn ? 'Mute' : 'Unmute'}
          </span>
        </button>

        <button
          onClick={toggleCamera}
          className={`p-5 rounded-2xl transition-all transform active:scale-90 flex flex-col items-center gap-2 ${
            isCameraOn
              ? 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
          <span className="text-[8px] font-bold uppercase tracking-widest">
            {isCameraOn ? 'Stop Cam' : 'Start Cam'}
          </span>
        </button>

        <div className="h-10 w-px bg-neutral-200 mx-2" />

        <button
          onClick={handleLeaveCall}
          className="p-5 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-all transform active:scale-90 shadow-xl shadow-red-200 flex flex-col items-center gap-2 group"
        >
          <PhoneOff size={24} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[8px] font-bold uppercase tracking-widest">End Session</span>
        </button>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
