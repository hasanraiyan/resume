// src/hooks/useWebRTC.js
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

export function useWebRTC(meetingId, user) {
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnections = useRef({});
  const clientId = useRef(user.name || `Guest-${Math.random().toString(36).substring(2, 6)}`);

  const sendMessage = useCallback(
    async (message) => {
      await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, message: { ...message, senderId: clientId.current } }),
      });
    },
    [meetingId]
  );

  // Get local media stream
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) {
        console.error('Failed to get local stream', err);
      }
    };
    getMedia();
  }, []);

  // Signaling logic (polling)
  useEffect(() => {
    if (!localStream) return;

    const pollInterval = setInterval(async () => {
      const response = await fetch(
        `/api/signaling?meetingId=${meetingId}&clientId=${clientId.current}`
      );
      const { messages } = await response.json();

      for (const message of messages) {
        if (message.senderId === clientId.current) continue;

        const { senderId, offer, answer, iceCandidate } = message;

        let pc = peerConnections.current[senderId];

        if (!pc) {
          pc = new RTCPeerConnection(ICE_SERVERS);
          peerConnections.current[senderId] = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              sendMessage({ iceCandidate: event.candidate, targetId: senderId });
            }
          };

          pc.ontrack = (event) => {
            setRemoteStreams((prev) => ({ ...prev, [senderId]: event.streams[0] }));
          };

          localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        }

        if (offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendMessage({ answer, targetId: senderId });
        } else if (answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } else if (iceCandidate) {
          await pc.addIceCandidate(new RTCIceCandidate(iceCandidate));
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [localStream, meetingId, sendMessage]);

  // Effect to initiate connections to new peers
  useEffect(() => {
    // This is a simplified approach. A robust system would use a roster from the signaling server.
    // For now, we broadcast an offer to see who is in the room.
    sendMessage({ offer: 'ping', targetId: 'broadcast' });
  }, [localStream, sendMessage]);

  const toggleMedia = (kind, enabled) => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        if (track.kind === kind) {
          track.enabled = enabled;
        }
      });
    }
  };

  const leaveRoom = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    Object.values(peerConnections.current).forEach((pc) => pc.close());
  };

  return { localStream, remoteStreams, toggleMedia, leaveRoom };
}
