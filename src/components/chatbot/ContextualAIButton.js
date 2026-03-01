import { Sparkles } from 'lucide-react';

export default function ContextualAIButton({ selection, handleAskKiroContext, chatbotSettings }) {
  if (!selection.show) return null;

  return (
    <div
      className="fixed z-[100] animate-in zoom-in-95 duration-200 pointer-events-auto"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <button
        onClick={handleAskKiroContext}
        className="ai-selection-tooltip flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[11px] font-medium rounded-lg shadow-xl hover:bg-neutral-800 transition-colors border border-white/10"
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        Ask {chatbotSettings?.aiName || 'Kiro'}
      </button>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-black" />
    </div>
  );
}
