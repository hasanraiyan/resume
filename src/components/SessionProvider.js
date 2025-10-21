'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * NextAuth session provider wrapper component.
 *
 * This component wraps the application with NextAuth's SessionProvider to
 * enable session management throughout the app. It provides session context
 * to all child components for authentication state management.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} NextAuth SessionProvider wrapper
 */
export default function SessionProvider({ children }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
