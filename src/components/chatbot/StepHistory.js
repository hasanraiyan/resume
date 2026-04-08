import { useState } from 'react';
import { ChevronDown, CheckCircle2, Clock } from 'lucide-react';

export default function StepHistory({ steps, onInteract }) {
  const [expanded, setExpanded] = useState(true);
  if (!steps || steps.length === 0) return null;

  const tools = steps.filter((s) => s.type === 'tool');
  const uniqueIcons = [...new Set(tools.map((t) => t.Icon).filter(Boolean))];
  const completedTools = tools.filter((t) => t.done).length;

  return (
    <div className="flex flex-col w-full mb-4 group/history ">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors w-fit cursor-pointer"
      >
        <span className="text-sm font-medium text-neutral-700 ">
          Performed {tools.length} action{tools.length > 1 ? 's' : ''}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 text-neutral-600 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-3 ml-2 pl-5 border-l-2 border-dashed border-neutral-200 space-y-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
          {steps.map((step, idx) => {
            if (step.type === 'tool') {
              return (
                <div
                  key={`step-${idx}`}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-all duration-200 ${
                    step.done
                      ? 'bg-neutral-50 border border-neutral-200/60'
                      : 'bg-neutral-50/80 border border-neutral-200/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        step.done
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-neutral-200/70 text-neutral-600'
                      }`}
                    >
                      {step.Icon ? <step.Icon className="w-3.5 h-3.5" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium truncate ${
                          step.done ? 'text-neutral-900' : 'text-neutral-700'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-neutral-600 animate-spin" />
                    )}
                  </div>
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
