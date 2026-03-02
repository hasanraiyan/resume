import { CheckCircle2, Clock } from 'lucide-react';

export default function ToolCard({ label, Icon, pending }) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border font-medium transition-all duration-300 shadow-sm max-w-full overflow-hidden ${
        pending
          ? 'border-neutral-300 bg-neutral-100 text-neutral-700 text-xs'
          : 'border-neutral-300 bg-neutral-100 text-neutral-900 text-xs'
      }`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            pending ? 'bg-neutral-200' : 'bg-neutral-200'
          }`}
        >
          {Icon && (
            <Icon className={`w-3 h-3 ${pending ? 'text-neutral-600' : 'text-neutral-700'}`} />
          )}
        </div>
        {pending && (
          <span className="absolute inset-0 rounded-full border border-neutral-400/30 animate-pulse" />
        )}
      </div>
      <span className="font-semibold truncate">{label}</span>
      <div className="ml-1 flex-shrink-0">
        {pending ? (
          <Clock className="w-3.5 h-3.5 text-neutral-600 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700" />
        )}
      </div>
    </div>
  );
}
