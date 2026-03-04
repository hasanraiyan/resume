'use client';
import { ChevronDown, Check, Zap, Award, Brain } from 'lucide-react';
import { AGENT_IDS } from '@/lib/constants/agents';

export default function ModelSelector({
  selectedAgentId,
  setSelectedAgentId,
  isModelSelectorOpen,
  setIsModelSelectorOpen,
  setIsToolsMenuOpen,
  isLoading,
  inputRef,
}) {
  const tiers = [
    {
      id: AGENT_IDS.CHAT_FAST,
      name: 'Fast',
      description: 'Answers quickly',
      icon: Zap,
      color: 'text-amber-500',
    },
    {
      id: AGENT_IDS.CHAT_THINKING,
      name: 'Thinking',
      description: 'Solves complex problems',
      icon: Brain,
      color: 'text-purple-500',
    },
    {
      id: AGENT_IDS.CHAT_PRO,
      name: 'Pro',
      description: 'Advanced maths and code',
      icon: Award,
      color: 'text-blue-500',
    },
  ];

  const currentTier = tiers.find((t) => t.id === selectedAgentId) || tiers[0];

  return (
    <div className="relative model-selector-container">
      <button
        type="button"
        onClick={() => {
          setIsModelSelectorOpen(!isModelSelectorOpen);
          if (!isModelSelectorOpen) setIsToolsMenuOpen(false);
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
      >
        <span>{currentTier.name}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isModelSelectorOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200/50 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/80">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
              AI Tiers
            </span>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedAgentId === tier.id;

              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    setSelectedAgentId(tier.id);
                    setIsModelSelectorOpen(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-50/50 text-blue-700 ring-1 ring-blue-100'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${isSelected ? 'bg-white shadow-sm' : 'bg-neutral-100'}`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? tier.color : 'text-neutral-500'}`} />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-xs font-bold leading-none">{tier.name}</span>
                    <span className="text-[10px] text-neutral-400 mt-1 truncate">
                      {tier.description}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
