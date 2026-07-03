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

// Anchored roughly at the FAB's position (bottom-4/6 right-4/6, ~14-16px circle)
// so opening/closing reads as the button itself expanding to fill the screen.
const revealVariants = {
  closed: {
    clipPath: 'circle(0% at calc(100% - 3rem) calc(100% - 3rem))',
    transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] },
  },
  open: {
    clipPath: 'circle(150% at calc(100% - 3rem) calc(100% - 3rem))',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function PortfolioTakeover({ onClose, heroData, siteConfig }) {
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
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
      className="fixed inset-0 z-[100] bg-black text-white overflow-hidden"
      variants={revealVariants}
      initial="closed"
      animate="open"
      exit="closed"
    >
      <FluidCursorCanvas />

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
