'use client';

import { createContext, useContext, useState, useCallback } from 'react';

/**
 * @fileoverview React context for managing the state and appearance of the custom cursor.
 * Provides a global way for components to control cursor text, size, and type.
 */

const CursorContext = createContext(null);

/**
 * Provider component for the CursorContext.
 * Wraps the application to provide global access to cursor state controls.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to be rendered within the provider.
 */
export function CursorProvider({ children }) {
  const [cursorText, setCursorText] = useState('');
  const [cursorVariant, setCursorVariant] = useState('default');

  const value = {
    cursorText,
    setCursorText: useCallback((text) => setCursorText(text), []),
    cursorVariant,
    setCursorVariant: useCallback((variant) => setCursorVariant(variant), []),
  };

  return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
}

/**
 * Custom hook for accessing and controlling the cursor context.
 * Provides a simple interface for components to change the cursor's appearance.
 *
 * @returns {{
 *   cursorText: string,
 *   setCursorText: (text: string) => void,
 *   cursorVariant: string,
 *   setCursorVariant: (variant: string) => void
 * }} An object containing the current cursor state and functions to update it.
 *
 * @example
 * const { setCursorText, setCursorVariant } = useCursor();
 *
 * const handleMouseEnter = () => {
 *   setCursorText("View Project");
 *   setCursorVariant("project");
 * };
 *
 * const handleMouseLeave = () => {
 *   setCursorText("");
 *   setCursorVariant("default");
 * };
 */
export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}
