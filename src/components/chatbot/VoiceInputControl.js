'use client';

import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';

export default function VoiceInputControl({
  isListening,
  toggleListening,
  isLoading,
  onTranscript,
  continuous = false,
  lang = 'en-US',
}) {
  const recognitionRef = useRef(null);
  const isInitializedRef = useRef(false);

  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (isInitializedRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      console.log('[VoiceInput] Recognition started');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (onTranscript) {
        if (finalTranscript) {
          onTranscript(finalTranscript, false);
        } else if (interimTranscript) {
          onTranscript(interimTranscript, true);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('[VoiceInput] Recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toggleListening();
      }
    };

    recognition.onend = () => {
      console.log('[VoiceInput] Recognition ended');
      if (isListening) {
        toggleListening();
      }
    };

    recognitionRef.current = recognition;
    isInitializedRef.current = true;
    return recognition;
  }, [continuous, lang, onTranscript, toggleListening]);

  useEffect(() => {
    const recognition = initRecognition();
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.start();
      } catch (err) {
        console.error('[VoiceInput] Failed to start recognition:', err);
        toggleListening();
      }
    }

    return () => {
      if (recognition && recognition.recording) {
        try {
          recognition.stop();
        } catch (err) {
          console.error('[VoiceInput] Failed to stop recognition on unmount:', err);
        }
      }
    };
  }, [isListening, initRecognition, toggleListening]);

  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      {isListening && <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isLoading}
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          isListening
            ? 'bg-blue-100 text-blue-600'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Listening... Click to stop' : 'Voice Input'}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-neutral-400/40 border-t-neutral-600 rounded-full animate-spin" />
        ) : isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
