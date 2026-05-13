'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechGuide(segments = []) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synthRef.current.getVoices();
        setVoices(availableVoices);

        // Prefer Google US English or similar high-quality voices if available
        const preferred = availableVoices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
                       || availableVoices.find(v => v.lang.startsWith('en'))
                       || availableVoices[0];
        setSelectedVoice(preferred);
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Stop playback and reset if segments change (e.g. navigation)
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentSegmentIndex(0);
  }, [segments]);

  const speak = useCallback((index) => {
    if (!synthRef.current || !segments[index]) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(segments[index]);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      if (index + 1 < segments.length) {
        setCurrentSegmentIndex(index + 1);
        speak(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentSegmentIndex(0);
      }
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance error', event);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
    setCurrentSegmentIndex(index);
  }, [segments, selectedVoice, rate, pitch]);

  const togglePlayPause = useCallback(() => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current.paused && utteranceRef.current) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        speak(currentSegmentIndex);
      }
    }
  }, [isPlaying, currentSegmentIndex, speak]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setCurrentSegmentIndex(0);
    }
  }, []);

  const nextSegment = useCallback(() => {
    if (currentSegmentIndex + 1 < segments.length) {
      speak(currentSegmentIndex + 1);
    }
  }, [currentSegmentIndex, segments.length, speak]);

  const prevSegment = useCallback(() => {
    if (currentSegmentIndex > 0) {
      speak(currentSegmentIndex - 1);
    }
  }, [currentSegmentIndex, speak]);

  return {
    isPlaying,
    currentSegmentIndex,
    totalSegments: segments.length,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    togglePlayPause,
    stop,
    nextSegment,
    prevSegment,
    setCurrentSegmentIndex: (idx) => {
      setCurrentSegmentIndex(idx);
      if (isPlaying) speak(idx);
    },
  };
}
