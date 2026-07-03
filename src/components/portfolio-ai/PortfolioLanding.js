'use client';

import { ArrowRight, User, Briefcase, Code2, Award, UserPlus } from 'lucide-react';
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder';
import { MagnifyingDock, MagnifyingItem } from './MagnifyingDock';

const QUICK_PROMPTS = [
  { icon: User, label: 'Me', query: 'Tell me about yourself.' },
  { icon: Briefcase, label: 'Projects', query: 'Show me your projects.' },
  { icon: Award, label: 'Experience', query: 'Tell me about your experience and certifications.' },
  { icon: Code2, label: 'Skills', query: 'What is your tech stack?' },
  { icon: UserPlus, label: 'Contact', query: 'How can I get in touch with you?' },
];

export default function PortfolioLanding({
  name,
  inputMessage,
  setInputMessage,
  inputRef,
  onQuery,
}) {
  const placeholder = useTypewriterPlaceholder([
    'Ask me anything...',
    `What has ${name || 'they'} built?`,
    "What's the tech stack?",
    'Tell me about your experience...',
    'How can I get in touch?',
  ]);

  const handleSubmit = () => onQuery(inputMessage);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        <p className="text-white/50 text-lg font-serif italic mb-2">
          {name ? `Hey, I'm ${name}'s AI guide` : "Hey, I'm your AI guide"}
        </p>
        <h1 className="text-white text-4xl sm:text-6xl font-bold tracking-tight mb-8">
          Ask me anything
        </h1>

        <div className="w-full relative mb-8">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={placeholder}
            className="w-full bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-full py-4 pl-6 pr-14 text-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          <button
            onClick={handleSubmit}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <MagnifyingDock>
          {QUICK_PROMPTS.map((p) => (
            <MagnifyingItem key={p.label}>
              <button
                onClick={() => onQuery(p.query)}
                className="flex items-center gap-1.5 backdrop-blur-md border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2.5 rounded-full text-white/80 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <p.icon className="w-4 h-4" />
                {p.label}
              </button>
            </MagnifyingItem>
          ))}
        </MagnifyingDock>
      </div>
    </div>
  );
}
