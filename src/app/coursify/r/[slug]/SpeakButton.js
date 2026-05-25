'use client';

import { Volume2, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SpeakButton() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const contentEl = document.getElementById('research-content');
    if (!contentEl) return;

    const text = contentEl.innerText?.trim();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      onClick={handleSpeak}
      aria-label={speaking ? 'Stop reading' : 'Read article aloud'}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#1f644e] border border-[#d4e6de] rounded-full hover:bg-[#f0f5f2] transition-all shrink-0"
    >
      {speaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
    </button>
  );
}
