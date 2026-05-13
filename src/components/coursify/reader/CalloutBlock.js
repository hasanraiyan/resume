'use client';

import React from 'react';
import { Info, AlertTriangle, Lightbulb, Flame } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

const CALLOUT_STYLES = {
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
  },
  tip: {
    icon: Lightbulb,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-900',
  },
  danger: {
    icon: Flame,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-red-900',
  },
};

export function CalloutBlock({ block }) {
  const type = block.calloutType || 'info';
  const style = CALLOUT_STYLES[type] || CALLOUT_STYLES.info;
  const Icon = style.icon;

  return (
    <section className="my-8">
      <div className={`p-5 rounded-2xl border ${style.bg} ${style.border} flex gap-4 shadow-sm`}>
        <div className={`shrink-0 mt-0.5 ${style.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          {block.title && (
            <h4 className={`text-base font-bold mb-1.5 ${style.titleColor}`}>{block.title}</h4>
          )}
          <div className="prose prose-sm max-w-none text-[#1e3a34] prose-p:leading-relaxed selection:bg-[#1f644e]/10">
            <MarkdownRenderer content={block.content || ''} />
          </div>
        </div>
      </div>
    </section>
  );
}
