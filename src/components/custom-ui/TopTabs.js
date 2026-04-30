'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export default function TopTabs({
  options = [],
  activeId,
  onChange = () => {},
  theme = 'green',
  showLabelsOnMobile = false,
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

  return (
    <div
      // Removed shadow-sm here
      className="relative flex items-center rounded-2xl border p-1.5"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {safeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            // Added cursor-pointer here
            className="relative flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: isActive ? colors.textActive : colors.inactive,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = colors.hover;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = colors.inactive;
            }}
          >
            {/* The Animated Background Pill */}
            {isActive && (
              <motion.div
                layoutId={`active-pill-${uniqueTabGroupId}`}
                // Removed shadow-sm here
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
                <span className={`${showLabelsOnMobile ? 'inline' : 'hidden sm:inline'} truncate`}>
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
