'use client';

import { Volume2, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { parseMarkdownToBlocks } from '@/utils/coursify-parser';

function stripMarkdown(text) {
  if (!text) return '';
  return (
    text
      // Remove all fenced blocks (```...```) entirely — code, mermaid, etc.
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]*`/g, '')
      // Keyword syntax [word]{def="..."} → keep just the word
      .replace(/\[([^\]]+)\]\{def="[^"]*"\}/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      // Links → keep label text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Footnote references
      .replace(/\[\^[^\]]+\]/g, '')
      // Headings — strip # markers, keep text
      .replace(/^#{1,6}\s+/gm, '')
      // Bold / italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Blockquotes
      .replace(/^>\s*/gm, '')
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // List markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // HTML tags
      .replace(/<[^>]+>/g, '')
      // Collapse whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function blocksToSpeakText(content) {
  const blocks = parseMarkdownToBlocks(content);
  const parts = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'MdBlock':
        parts.push(stripMarkdown(block.content));
        break;

      case 'StepByStepBlock':
        if (block.title) parts.push(block.title + '.');
        (block.steps || []).forEach((step, i) => {
          parts.push(`Step ${i + 1}: ${stripMarkdown(step.title)}.`);
          if (step.content) parts.push(stripMarkdown(step.content));
        });
        break;

      case 'AccordionBlock':
        if (block.title) parts.push(block.title + '.');
        (block.items || []).forEach((item) => {
          parts.push(stripMarkdown(item.title) + '.');
          if (item.content) parts.push(stripMarkdown(item.content));
        });
        break;

      case 'TabsBlock':
        (block.tabs || []).forEach((tab) => {
          parts.push(stripMarkdown(tab.title) + '.');
          if (tab.content) parts.push(stripMarkdown(tab.content));
        });
        break;

      case 'CalloutBlock': {
        const label =
          block.calloutType === 'warning'
            ? 'Warning'
            : block.calloutType === 'tip'
              ? 'Tip'
              : 'Note';
        const title = block.title ? stripMarkdown(block.title) + '. ' : '';
        parts.push(`${label}. ${title}${stripMarkdown(block.content)}`);
        break;
      }

      case 'VideoBlock':
        if (block.video?.title) parts.push(`Video: ${block.video.title}.`);
        break;

      case 'ResourceBlock':
        if (block.resource?.title) parts.push(`Resource: ${block.resource.title}.`);
        break;

      case 'ChartBlock':
        if (block.chart?.title) parts.push(`Chart: ${block.chart.title}.`);
        if (block.chart?.description) parts.push(block.chart.description);
        break;

      case 'QuizBlock':
        // Skip — interactive only
        break;
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

export default function SpeakButton({ content }) {
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

    const text = blocksToSpeakText(content);
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
