'use client';

import { homepagePersonas, PERSONA_KEYS } from '@/config/homepagePersonas';
import { cn } from '@/utils/classNames';

export default function PersonaSwitcher({ activePersona, onPersonaChange, compact = false }) {
  const personas = [homepagePersonas.business, homepagePersonas.developer];

  return (
    <div
      className={cn(
        'inline-flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/90 p-3 shadow-xl shadow-black/5 backdrop-blur',
        compact ? 'w-full sm:w-auto' : 'w-full sm:w-auto'
      )}
      aria-label="Choose homepage view"
    >
      <p className="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
        Are you a...
      </p>
      <div className="grid grid-cols-2 gap-2">
        {personas.map((persona) => {
          const isActive = activePersona === persona.key;
          return (
            <button
              key={persona.key}
              type="button"
              onClick={() => onPersonaChange(persona.key)}
              aria-pressed={isActive}
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 hover-target',
                isActive
                  ? 'bg-black text-white shadow-lg shadow-black/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black'
              )}
            >
              {persona.key === PERSONA_KEYS.business ? 'Business Owner' : 'Developer'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
