/**
 * Session, profile and role for the mobile apps.
 *
 * The role decides which route group the router lands on. It comes from the
 * ID token claim so it matches what the security rules see; the Firestore
 * profile carries everything else (name, locality, store).
 */

import * as React from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import * as LocalAuthentication from 'expo-local-authentication';

import { COL, type Role, type UserProfile } from '@dfc/core';
import { auth, db, isConfigured } from '@/lib/firebase';
import { registerForPush, unregisterPush } from '@/lib/push';

interface AuthValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  /** Device has a fingerprint or face enrolled. */
  biometricsAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const Ctx = React.createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [biometricsAvailable, setBiometrics] = React.useState(false);
  const pushToken = React.useRef<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometrics(hasHardware && enrolled);
    })();
  }, []);

  React.useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const token = await u.getIdTokenResult();
      setRole((token.claims.role as Role) ?? 'customer');
      setLoading(false);
    });
  }, []);

  // Live profile — a locality change on one device shows up on the other.
  React.useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db(), COL.users, user.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
    });
  }, [user]);

  // Push, once we know who this is. The role decides which Android channels
  // to declare, so this has to wait for the claim rather than the session.
  React.useEffect(() => {
    if (!user || !role) return;
    let token: string | null = null;
    void registerForPush(user.uid, role).then((r) => {
      token = r.token;
      pushToken.current = r.token;
    });
    return () => {
      // Deliberately not unregistering on unmount — that fires on every fast
      // refresh. Sign-out handles it, below.
      void token;
    };
  }, [user, role]);

  const value = React.useMemo<AuthValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      configured: isConfigured,
      biometricsAvailable,

      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth(), email.trim(), password);
      },

      /**
       * Biometrics gate an *existing* session — Face ID cannot mint a Firebase
       * credential. If there is no session, the caller falls back to password.
       */
      unlockWithBiometrics: async () => {
        if (!biometricsAvailable || !auth().currentUser) return false;
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock DFC',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
        });
        return res.success;
      },

      signOut: async () => {
        // Drop this device's token first, so the next person to sign in here
        // is not notified about someone else's orders.
        const current = auth().currentUser;
        if (current && pushToken.current) {
          await unregisterPush(current.uid, pushToken.current);
        }
        await fbSignOut(auth());
      },

      updateProfile: async (patch) => {
        if (!user) return;
        await setDoc(
          doc(db(), COL.users, user.uid),
          { ...patch, uid: user.uid, updatedAt: Date.now() },
          { merge: true },
        );
      },
    }),
    [user, profile, role, loading, biometricsAvailable],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
