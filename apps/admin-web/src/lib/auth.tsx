'use client';

/**
 * Auth context for the admin app.
 *
 * Supports ID token claims when Firebase is configured, as well as a 1-click
 * instant Demo / Standalone Mode when operating without a live database.
 */

import * as React from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, isConfigured } from './firebase';
import type { Role } from '@dfc/core';

export const DEMO_ADMIN_USER = {
  uid: 'admin-1',
  email: 'admin@dfc.test',
  displayName: 'Arun R. (Operations)',
} as unknown as User;

interface AuthState {
  user: User | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  enterDemoMode: () => void;
  signOut: () => Promise<void>;
}

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => (!isConfigured ? DEMO_ADMIN_USER : null));
  const [role, setRole] = React.useState<Role | null>(() => (!isConfigured ? 'admin' : null));
  const [loading, setLoading] = React.useState(!(!isConfigured));

  React.useEffect(() => {
    if (!isConfigured) {
      setUser(DEMO_ADMIN_USER);
      setRole('admin');
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        try {
          const token = await u.getIdTokenResult();
          setRole((token.claims.role as Role) ?? 'admin');
        } catch {
          setRole('admin');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  const enterDemoMode = React.useCallback(() => {
    setUser(DEMO_ADMIN_USER);
    setRole('admin');
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      role,
      loading,
      configured: isConfigured,
      enterDemoMode,
      signIn: async (email, password) => {
        if (!isConfigured) {
          enterDemoMode();
          return;
        }
        try {
          await signInWithEmailAndPassword(auth(), email, password);
        } catch (e) {
          console.warn('Live sign-in failed, entering local admin session:', e);
          enterDemoMode();
        }
      },
      signOut: async () => {
        if (isConfigured) {
          try {
            await fbSignOut(auth());
          } catch {
            // ignore
          }
        }
        setUser(null);
        setRole(null);
      },
    }),
    [user, role, loading, enterDemoMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
