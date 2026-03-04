'use client';

import { Search, Brain, CheckCircle2 } from 'lucide-react';

export default function ResearchPlanningIndicator({ isActive = true }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200/60 mb-3">
      {/* Research Step */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-medium text-neutral-600">Research</span>
      </div>

      {/* Connector */}
      <div className="w-6 h-px bg-neutral-300"></div>

      {/* Planning Step - currently active */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-neutral-300 border-t-black animate-spin flex items-center justify-center">
          <Brain className="w-2.5 h-2.5 text-black" />
        </div>
        <span className="text-xs font-medium text-neutral-800">Planning response...</span>
      </div>
    </div>
  );
}
