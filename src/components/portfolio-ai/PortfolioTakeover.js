'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useIsPresent } from 'framer-motion';
import { X } from 'lucide-react';
import { AGENT_IDS } from '@/lib/constants/agents';
import { useChatStreaming } from '@/hooks/chatbot/useChatStreaming';
import { useVoiceRecognition } from '@/hooks/chatbot/useVoiceRecognition';
import FluidCursorCanvas from './FluidCursorCanvas';
import PortfolioLanding from './PortfolioLanding';
import PortfolioChatView from './PortfolioChatView';

export default function PortfolioTakeover({ onClose, heroData, siteConfig }) {
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [revealComplete, setRevealComplete] = useState(false);
  const inputRef = useRef(null);
  // Read once at mount (this component only ever mounts client-side, after the
  // FAB click that opens it — never during SSR) instead of via useEffect, so the
  // very first "closed" frame already has the right circle center and doesn't
  // pop to a different position after paint.
  const [fabOffset] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
      ? '3.5rem'
      : '2.75rem'
  );

  // clip-path: circle() defines a true circle regardless of the container's aspect
  // ratio — scale + borderRadius was tried first, but a fixed inset-0 div is
  // screen-shaped (not square), so borderRadius: 50% on it draws an ellipse
  // stretched to the screen's proportions, not a circle. The center must be a
  // literal calc() value (not a CSS var) — Framer Motion can't interpolate a
  // custom-property reference, so the whole clip-path just snapped instantly
  // instead of animating when one was used.
  const revealVariants = {
    closed: {
      clipPath: `circle(0% at calc(100% - ${fabOffset}) calc(100% - ${fabOffset}))`,
      transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] },
    },
    open: {
      clipPath: `circle(200% at calc(100% - ${fabOffset}) calc(100% - ${fabOffset}))`,
      transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const isPresent = useIsPresent();
  const { messages, isLoading, statusMessage, send } = useChatStreaming();
  const { isListening, toggleListening } = useVoiceRecognition(
    inputMessage,
    setInputMessage,
    inputRef
  );

  // Auto-focus input when the opening animation finishes or view switches
  useEffect(() => {
    if (revealComplete) {
      inputRef.current?.focus();
    }
  }, [revealComplete, hasStartedChat]);

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
      onAnimationComplete={(variant) => {
        // Defer the WebGL shader compile/sim init until after the reveal
        // finishes — doing it during the transition was what made it stutter.
        if (variant === 'open') setRevealComplete(true);
      }}
    >
      {/* Unmount immediately once closing starts (isPresent flips before the exit
          animation plays) — leaving the WebGL sim running while the clip-path
          shrinks around it is what caused the flicker on close. */}
      {revealComplete && isPresent && <FluidCursorCanvas />}

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
