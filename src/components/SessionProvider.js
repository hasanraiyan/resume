'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * NextAuth session provider wrapper component.
 *
 * This component wraps the application with NextAuth's SessionProvider to
 * enable session management throughout the app. It provides session context
 * to all child components for authentication state management.
 *
 * Configuration options:
 * - refetchInterval: Only check session every 5 minutes (default is aggressive)
 * - refetchOnWindowFocus: Disabled to prevent excessive API calls when tab is focused
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} NextAuth SessionProvider wrapper
 */
export default function SessionProvider({ children }) {
  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes instead of constantly
      refetchOnWindowFocus={false} // Prevent refetch on every window focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
