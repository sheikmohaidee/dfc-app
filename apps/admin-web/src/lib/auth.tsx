'use client';

/**
 * Auth context for the admin app.
 *
 * The role comes off the ID token's custom claim, not a Firestore read — the
 * security rules read the same claim, so the client and the server agree by
 * construction.
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

interface AuthState {
  user: User | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdTokenResult();
        setRole((token.claims.role as Role) ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      role,
      loading,
      configured: isConfigured,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth(), email, password);
      },
      signOut: async () => {
        await fbSignOut(auth());
      },
    }),
    [user, role, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
