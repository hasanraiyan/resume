'use client'

import { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const LoadingContext = createContext();

// Create the Provider component
export function LoadingProvider({ children }) {
  // We use a Set to store the names of components that are currently loading.
  // A Set is efficient for adding and removing unique items.
  const [loadingComponents, setLoadingComponents] = useState(new Set());

  const registerComponent = useCallback((name) => {
    setLoadingComponents(prev => new Set(prev).add(name));
  }, []);

  const markComponentAsLoaded = useCallback((name) => {
    setLoadingComponents(prev => {
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

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// Create the custom hook for easy consumption
export function useLoadingStatus() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingStatus must be used within a LoadingProvider');
  }
  return context;
}
