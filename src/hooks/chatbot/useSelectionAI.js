import { useState, useEffect } from 'react';

export function useSelectionAI() {
  const [selection, setSelection] = useState({ text: '', x: 0, y: 0, show: false });
  const [activeQuote, setActiveQuote] = useState('');

  useEffect(() => {
    const updateSelectionPos = () => {
      const activeSelection = window.getSelection();
      if (!activeSelection || activeSelection.rangeCount === 0) return;

      const text = activeSelection.toString().trim();
      if (!text) {
        setSelection((prev) => ({ ...prev, show: false }));
        return;
      }

      const range = activeSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if selection is inside the chatbot
      if (activeSelection.anchorNode?.parentElement?.closest('.chatbot-widget-container')) {
        setSelection((prev) => ({ ...prev, show: false }));
        return;
      }

      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10, // Viewport relative
        show: true,
      });
    };

    const handleMouseUp = () => {
      setTimeout(updateSelectionPos, 10);
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('.ai-selection-tooltip')) {
        setSelection((prev) => ({ ...prev, show: false }));
      }
    };

    // Keep tooltip anchored during scroll
    const handleScroll = () => {
      if (window.getSelection().toString().trim()) {
        updateSelectionPos();
      } else {
        setSelection((prev) => ({ ...prev, show: false }));
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { selection, setSelection, activeQuote, setActiveQuote };
}
