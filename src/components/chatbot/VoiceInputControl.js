import { Mic } from 'lucide-react';

export default function VoiceInputControl({ isListening, toggleListening, isLoading }) {
  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      {isListening && <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isLoading}
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
          isListening
            ? 'bg-neutral-100 text-blue-600'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
        title={isListening ? 'Listening...' : 'Voice Input'}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-neutral-400/40 border-t-neutral-600 rounded-full animate-spin" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
