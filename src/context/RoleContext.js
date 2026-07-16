'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ROLE_KEY = 'portfolio-role';

/**
 * @typedef {'developer' | 'business'} UserRole
 */

/**
 * @type {React.Context<{role: UserRole | null, setRole: (role: UserRole) => void, toggleRole: () => void, isRoleGateDone: boolean, setRoleGateDone: (done: boolean) => void, isDeveloper: boolean, isBusiness: boolean}>}
 */
const RoleContext = createContext({
  role: null,
  setRole: () => {},
  toggleRole: () => {},
  isRoleGateDone: false,
  setRoleGateDone: () => {},
  isDeveloper: false,
  isBusiness: false,
});

/**
 * RoleProvider — stores the selected role (developer | business) in localStorage
 * and provides a toggle function to switch between them at runtime.
 *
 * The `isRoleGateDone` flag tracks whether the user has seen & answered the
 * RoleGate screen. Once done, the gate is never shown again unless cleared.
 */
export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(null);
  const [isRoleGateDone, setRoleGateDoneState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ROLE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role && ['developer', 'business'].includes(parsed.role)) {
          setRoleState(parsed.role);
        }
        if (parsed.gateDone) {
          setRoleGateDoneState(true);
        }
      }
    } catch {
      // localStorage not available or corrupted — start fresh
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever state changes (but only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(ROLE_KEY, JSON.stringify({ role, gateDone: isRoleGateDone }));
    } catch {
      // silently fail
    }
  }, [role, isRoleGateDone, hydrated]);

  const setRole = useCallback((newRole) => {
    setRoleState(newRole);
  }, []);

  const toggleRole = useCallback(() => {
    setRoleState((prev) => (prev === 'developer' ? 'business' : 'developer'));
  }, []);

  const setRoleGateDone = useCallback((done) => {
    setRoleGateDoneState(done);
  }, []);

  const value = {
    role,
    setRole,
    toggleRole,
    isRoleGateDone,
    setRoleGateDone,
    isDeveloper: role === 'developer',
    isBusiness: role === 'business',
    hydrated,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/**
 * Hook to access the current role and role-related actions.
 * Must be used within a RoleProvider.
 */
export function useRole() {
  const context = useContext(RoleContext);
  return context;
}
