/**
 * @fileoverview React context for managing component loading states.
 * Tracks which components are currently loading to coordinate page-level loading UI.
 */

'use client';

import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for tracking loading states across multiple components.
 */
const LoadingContext = createContext();

/**
 * Provider component for loading state management.
 * Maintains a Set of currently loading components.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function LoadingProvider({ children }) {
  // We use a Set to store the names of components that are currently loading.
  // A Set is efficient for adding and removing unique items.
  const [loadingComponents, setLoadingComponents] = useState(new Set());

  const registerComponent = useCallback((name) => {
    setLoadingComponents((prev) => new Set(prev).add(name));
  }, []);

  const markComponentAsLoaded = useCallback((name) => {
    setLoadingComponents((prev) => {
      const newSet = new Set(prev);
      newSet.delete(name);
      return newSet;
    });
  }, []);

  const value = {
    loadingComponents,
    registerComponent,
    markComponentAsLoaded,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

/**
 * Custom hook for accessing loading state context.
 * Provides methods to register and unregister loading components.
 *
 * @function useLoadingStatus
 * @returns {{loadingComponents: Set, registerComponent: Function, markComponentAsLoaded: Function}} Loading state and control functions
 * @throws {Error} If used outside of LoadingProvider
 */
export function useLoadingStatus() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingStatus must be used within a LoadingProvider');
  }
  return context;
}
