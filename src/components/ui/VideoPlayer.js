'use client';

import { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, muted = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
