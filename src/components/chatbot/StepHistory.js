import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import StaticGenUI from './StaticGenUI';

export default function StepHistory({ steps, onInteract }) {
  const [expanded, setExpanded] = useState(true);
  if (!steps || steps.length === 0) return null;

  const tools = steps.filter((s) => s.type === 'tool');
  const uniqueIcons = [...new Set(tools.map((t) => t.Icon).filter(Boolean))];

  return (
    <div className="flex flex-col w-full mb-3 group/history">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex fit-content items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-all duration-200 w-fit"
      >
        <div className="flex -space-x-1">
          {uniqueIcons.slice(0, 3).map((Icon, idx) => (
            <Icon key={idx} className="w-3.5 h-3.5" />
          ))}
        </div>
        <span className="text-[11px] font-medium">
          Performed {tools.length} action{tools.length > 1 ? 's' : ''}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
        />
      </button>

      {expanded && (
        <div className="mt-2 ml-4 pl-4 border-l-2 border-dashed border-neutral-200 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
          {steps.map((step, idx) => {
            if (step.type === 'tool') {
              return (
                <div
                  key={`step-${idx}`}
                  className="flex items-center justify-between text-[13px] text-neutral-600"
                >
                  <div className="flex items-center gap-2">
                    {step.Icon && <step.Icon className="w-3.5 h-3.5 text-neutral-400" />}
                    <span>{step.label}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-400">
                    {step.done ? 'DONE' : 'RUNNING'}
                  </div>
                </div>
              );
            }
            if (step.type === 'ui') {
              return (
                <div key={`step-${idx}`} className="w-full">
                  <StaticGenUI block={step} onInteract={onInteract} />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
