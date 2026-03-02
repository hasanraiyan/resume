'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

const COMMON_ICONS = [
  'Server',
  'Database',
  'Globe',
  'Box',
  'Cpu',
  'Brain',
  'Zap',
  'Cloud',
  'Code',
  'Terminal',
  'Activity',
  'Shield',
  'Lock',
  'FileText',
  'Image',
  'MessageSquare',
  'Layout',
  'Layers',
  'Settings',
  'Tool',
  'Wrench',
  'Link',
  'Search',
  'Radio',
  'Webhook',
  'Key',
  'FileJson',
  'Briefcase',
  'BookOpen',
  'Youtube',
];

export default function LucideIconPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const IconComponent = LucideIcons[value] || LucideIcons.HelpCircle;

  const filteredIcons = COMMON_ICONS.filter((icon) =>
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${isOpen ? 'z-[60]' : 'z-10'}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full h-[42px] px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm flex items-center justify-between hover:bg-neutral-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-white border border-neutral-200 shadow-sm text-neutral-600">
            {IconComponent && <IconComponent className="w-4 h-4" />}
          </div>
          <span className="text-neutral-700">{value || 'Select Icon'}</span>
        </div>
        <LucideIcons.ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-[320px] bg-white rounded-xl shadow-xl border border-neutral-200/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 left-0">
          <div className="p-3 border-b border-neutral-100">
            <div className="relative">
              <LucideIcons.Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search common icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 max-h-56 overflow-y-auto custom-scrollbar">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {filteredIcons.map((iconName) => {
                  const Icon = LucideIcons[iconName];
                  const isSelected = value === iconName;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        onChange(iconName);
                        setIsOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors gap-1.5 group relative ${
                        isSelected
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-white text-neutral-500 border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      title={iconName}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                      <span className="text-[9px] w-full truncate text-center opacity-70 group-hover:opacity-100 font-medium">
                        {iconName}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <LucideIcons.Check className="w-2 h-2 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 px-3">
                <p className="text-xs text-neutral-500 mb-2">Icon not in common list.</p>
                <p className="text-[10px] text-neutral-400">
                  Type exact{' '}
                  <a
                    href="https://lucide.dev/icons"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Lucide React
                  </a>{' '}
                  component name.
                </p>
                <div className="mt-3 flex items-center gap-2 max-w-full">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-neutral-50"
                    placeholder="e.g. Activity"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        const val = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1);
                        onChange(val);
                        setIsOpen(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!searchQuery.trim()) return;
                      const val = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1);
                      onChange(val);
                      setIsOpen(false);
                    }}
                    className="px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg font-medium disabled:opacity-50 transition-colors hover:bg-neutral-800"
                    disabled={!searchQuery.trim()}
                  >
                    Use
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
