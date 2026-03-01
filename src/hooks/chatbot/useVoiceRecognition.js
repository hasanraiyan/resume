import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useVoiceRecognition(inputMessage, setInputMessage, inputRef) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const originalInput = inputMessage.trim();

    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
        setIsListening(false);
      }, 5000); // 5 seconds of silence
    };

    recognition.onstart = () => {
      setIsListening(true);
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      resetSilenceTimer();
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInputMessage(originalInput ? originalInput + ' ' + currentTranscript : currentTranscript);

      // Auto-resize textarea when text is added via voice
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
        }
      }, 0);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error(`Microphone error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
    }
  }, [isListening, inputMessage, setInputMessage, inputRef]);

  return { isListening, toggleListening };
}
