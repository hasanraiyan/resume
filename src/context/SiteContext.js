'use client';

import { createContext, useContext } from 'react';

const SiteContext = createContext(null);

export function SiteProvider({ children, value }) {
  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  return context;
}