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
  theme = 'default',
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

  const isGreenTheme = theme === 'green';
  const isDarkTheme = theme === 'dark';

  let buttonColors = '';
  if (isListening) {
    if (isDarkTheme) {
      buttonColors = 'bg-blue-500 text-white hover:bg-blue-600';
    } else if (isGreenTheme) {
      buttonColors = 'bg-[#1f644e]/10 text-[#1f644e] hover:bg-[#1f644e]/20';
    } else {
      buttonColors = 'bg-blue-100 text-blue-600 hover:bg-blue-200';
    }
  } else {
    if (isDarkTheme) {
      buttonColors = 'bg-white/10 text-white/80 hover:bg-white/20';
    } else if (isGreenTheme) {
      buttonColors = 'bg-[#f0f2eb] text-[#1e3a34] hover:bg-[#e5e7de]';
    } else {
      buttonColors = 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200';
    }
  }

  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      {isListening && (
        <div
          className={`absolute inset-0 rounded-full animate-ping ${
            isDarkTheme ? 'bg-blue-500/30' : isGreenTheme ? 'bg-[#1f644e]/20' : 'bg-blue-500/20'
          }`}
        />
      )}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isLoading}
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${buttonColors} ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={isListening ? 'Listening... Click to stop' : 'Voice Input'}
      >
        {isLoading ? (
          <span
            className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
              isDarkTheme
                ? 'border-white/20 border-t-white'
                : isGreenTheme
                  ? 'border-[#1f644e]/20 border-t-[#1f644e]'
                  : 'border-neutral-400/40 border-t-neutral-600'
            }`}
          />
        ) : isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
