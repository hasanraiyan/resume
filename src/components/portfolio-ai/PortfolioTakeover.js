'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { AGENT_IDS } from '@/lib/constants/agents';
import { useChatStreaming } from '@/hooks/chatbot/useChatStreaming';
import { useVoiceRecognition } from '@/hooks/chatbot/useVoiceRecognition';
import FluidCursorCanvas from './FluidCursorCanvas';
import PortfolioLanding from './PortfolioLanding';
import PortfolioChatView from './PortfolioChatView';

// scale + borderRadius are compositor-only (no repaint of the heavy WebGL/blur
// children on every frame like clip-path was), anchored at the FAB's position
// via transformOrigin so it reads as the button itself expanding to fill the screen.
const revealVariants = {
  closed: {
    scale: 0.001,
    borderRadius: '50%',
    transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] },
  },
  open: {
    scale: 1,
    borderRadius: '0%',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function PortfolioTakeover({ onClose, heroData, siteConfig }) {
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [revealComplete, setRevealComplete] = useState(false);
  const inputRef = useRef(null);

  const { messages, isLoading, statusMessage, send } = useChatStreaming();
  const { isListening, toggleListening } = useVoiceRecognition(
    inputMessage,
    setInputMessage,
    inputRef
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleQuery = useCallback(
    (text) => {
      if (!text?.trim()) return;
      if (!hasStartedChat) setHasStartedChat(true);
      send(text, '', AGENT_IDS.PORTFOLIO_SHOWCASE, false);
      setInputMessage('');
    },
    [hasStartedChat, send]
  );

  const name = heroData?.introduction?.name || siteConfig?.ownerName || '';

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black text-white overflow-hidden origin-[calc(100%-2.75rem)_calc(100%-2.75rem)] sm:origin-[calc(100%-3.5rem)_calc(100%-3.5rem)]"
      variants={revealVariants}
      initial="closed"
      animate="open"
      exit="closed"
      onAnimationComplete={(variant) => {
        // Defer the WebGL shader compile/sim init until after the reveal
        // finishes — doing it during the transition was what made it stutter.
        if (variant === 'open') setRevealComplete(true);
      }}
    >
      {revealComplete && <FluidCursorCanvas />}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center text-white transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 h-full flex flex-col">
        {!hasStartedChat ? (
          <PortfolioLanding
            name={name}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            inputRef={inputRef}
            onQuery={handleQuery}
          />
        ) : (
          <PortfolioChatView
            messages={messages}
            isLoading={isLoading}
            statusMessage={statusMessage}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            inputRef={inputRef}
            onQuery={handleQuery}
            isListening={isListening}
            toggleListening={toggleListening}
          />
        )}
      </div>
    </motion.div>
  );
}
