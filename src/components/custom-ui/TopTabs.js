'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export default function TopTabs({
  options = [],
  activeId,
  onChange = () => {},
  theme = 'green',
  showLabelsOnMobile = false,
  scrollable = false,
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  // Generates a unique ID so if you have multiple Tab groups on the same page,
  // the animated pills don't fly between them.
  const uniqueTabGroupId = useId();

  const themeColors = {
    green: {
      pill: '#1f644e',
      inactive: '#7c8e88',
      hover: '#1e3a34',
      border: '#e5e3d8',
      background: '#ffffff',
      textActive: '#ffffff',
    },
    dark: {
      pill: '#374151',
      inactive: '#9ca3af',
      hover: '#111827',
      border: '#e5e7eb',
      background: '#ffffff',
      textActive: '#ffffff',
    },
  };

  const colors = themeColors[theme] || themeColors.green;

  const containerClasses = scrollable
    ? 'relative flex items-center overflow-x-auto no-scrollbar gap-1'
    : 'relative flex items-center rounded-2xl border p-1.5';

  return (
    <div
      className={containerClasses}
      style={
        !scrollable
          ? {
              borderColor: colors.border,
              backgroundColor: colors.background,
            }
          : {}
      }
    >
      {safeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0 ${scrollable && !isActive ? 'border border-[#e5e3d8] bg-white' : ''}`}
            style={{
              color: isActive ? colors.textActive : colors.inactive,
              ...(scrollable && isActive ? { backgroundColor: colors.pill } : {}),
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = colors.hover;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = colors.inactive;
            }}
          >
            {/* The Animated Background Pill (Desktop/Non-scrollable) */}
            {!scrollable && isActive && (
              <motion.div
                layoutId={`active-pill-${uniqueTabGroupId}`}
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: colors.pill }}
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}

            {/* Tab Content (Icon + Label) */}
            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {option.label && (
                <span
                  className={`${showLabelsOnMobile || scrollable ? 'inline' : 'hidden sm:inline'} truncate`}
                >
                  {option.label}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
