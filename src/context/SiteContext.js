/**
 * @fileoverview React context for site-wide data and configuration.
 * Provides global access to site settings and shared data.
 */

'use client';

import { createContext, useContext } from 'react';

/**
 * Context for site-wide data and configuration.
 */
const DEFAULT_SITE_CONTEXT = {
  heroData: { socialLinks: [] },
  initials: 'MM',
};

const SiteContext = createContext(DEFAULT_SITE_CONTEXT);

/**
 * Provider component for site context.
 * Wraps the application to provide global site data.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {*} props.value - Site data to provide to consumers
 */
export function SiteProvider({ children, value }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

/**
 * Custom hook for accessing site context.
 * Provides access to global site data and configuration.
 *
 * @function useSiteContext
 * @returns {*} Site context value
 * @throws {Error} If used outside of SiteProvider
 */
export function useSiteContext() {
  const context = useContext(SiteContext);
  return context || DEFAULT_SITE_CONTEXT;
}
