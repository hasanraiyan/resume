'use client';

import { useState } from 'react';

/**
 * Reusable Tab Navigation Component
 * Horizontal tabs with icons, optional sticky behavior
 */
export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  sticky = true,
  fullWidth = false,
  className = '',
}) {
  const stickyClasses = sticky ? 'sticky top-16 sm:top-20 z-40 bg-white/95 backdrop-blur-sm' : '';
  const containerClasses = fullWidth ? 'w-full' : 'max-w-5xl mx-auto';

  return (
    <div className={`py-0 bg-gray-50 border-b ${stickyClasses} ${className}`}>
      <div className={containerClasses}>
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon && <i className={`fas fa-${tab.icon}`}></i>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
