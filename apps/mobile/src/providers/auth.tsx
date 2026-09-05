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

import AsyncStorage from '@react-native-async-storage/async-storage';

import { COL, type Role, type UserProfile } from '@dfc/core';
import { auth, db, isConfigured } from '@/lib/firebase';
import { registerForPush, unregisterPush } from '@/lib/push';

export const MOCK_USER_STORAGE_KEY = 'dfc_mock_user_persona';

export const DEMO_PERSONAS: Record<Role, { user: User; profile: UserProfile }> = {
  customer: {
    user: {
      uid: 'cust-1',
      displayName: 'Anand Kumar',
      email: 'anand@dfc.test',
      phoneNumber: '+919876543210',
    } as unknown as User,
    profile: {
      uid: 'cust-1',
      name: 'Anand Kumar',
      phone: '+919876543210',
      role: 'customer',
      localityId: 'kk-nagar',
      addressLine: '12 80 Feet Road, KK Nagar',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  vendor: {
    user: {
      uid: 'vendor-1',
      displayName: 'Murugan Idli Shop',
      email: 'murugan@dfc.test',
      phoneNumber: '+919876500002',
    } as unknown as User,
    profile: {
      uid: 'vendor-1',
      name: 'Murugan Idli Shop',
      phone: '+919876500002',
      role: 'vendor',
      storeId: 'murugan-idli-shop',
      localityId: 'simmakkal',
      addressLine: 'West Masi Street, Madurai',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  rider: {
    user: {
      uid: 'rider-1',
      displayName: 'Captain Dhanush',
      email: 'dhanush@dfc.test',
      phoneNumber: '+919876500004',
    } as unknown as User,
    profile: {
      uid: 'rider-1',
      name: 'A. Dhanush',
      phone: '+919876500004',
      role: 'rider',
      localityId: 'simmakkal',
      addressLine: 'Sellur, Madurai',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  admin: {
    user: {
      uid: 'admin-1',
      displayName: 'Operations Admin',
      email: 'ops@dfc.test',
      phoneNumber: '+919876599999',
    } as unknown as User,
    profile: {
      uid: 'admin-1',
      name: 'Operations Admin',
      phone: '+919876599999',
      role: 'admin',
      localityId: 'kk-nagar',
      addressLine: 'DFC Central Ops, Madurai',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
};

interface AuthValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  /** Device has a fingerprint or face enrolled. */
  biometricsAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  loginAsDemoPersona: (role: Role) => Promise<void>;
  registerOfflineUser: (profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
    void (async () => {
      try {
        const savedMock = await AsyncStorage.getItem(MOCK_USER_STORAGE_KEY);
        if (savedMock) {
          const parsed = JSON.parse(savedMock) as { user: User; profile: UserProfile; role: Role };
          setUser(parsed.user);
          setProfile(parsed.profile);
          setRole(parsed.role);
          setLoading(false);
          return;
        }
      } catch {
        // continue
      }

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
    })();
  }, []);

  // Live profile — a locality change on one device shows up on the other.
  React.useEffect(() => {
    if (!user || !isConfigured) return;
    return onSnapshot(doc(db(), COL.users, user.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
    });
  }, [user]);

  // Push, once we know who this is. The role decides which Android channels
  // to declare, so this has to wait for the claim rather than the session.
  React.useEffect(() => {
    if (!user || !role || !isConfigured) return;
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
        if (!isConfigured) {
          const persona = DEMO_PERSONAS.customer;
          setUser(persona.user);
          setProfile(persona.profile);
          setRole('customer');
          return;
        }
        await signInWithEmailAndPassword(auth(), email.trim(), password);
      },

      loginAsDemoPersona: async (targetRole: Role) => {
        const persona = DEMO_PERSONAS[targetRole] ?? DEMO_PERSONAS.customer;
        setUser(persona.user);
        setProfile(persona.profile);
        setRole(targetRole);
        try {
          await AsyncStorage.setItem(
            MOCK_USER_STORAGE_KEY,
            JSON.stringify({ user: persona.user, profile: persona.profile, role: targetRole }),
          );
        } catch {
          // ignore
        }
      },

      registerOfflineUser: async (profileData) => {
        const uid = `local_${Date.now()}`;
        const newUser = {
          uid,
          displayName: profileData.name,
          phoneNumber: profileData.phone,
        } as unknown as User;
        const newProfile: UserProfile = {
          ...profileData,
          uid,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setUser(newUser);
        setProfile(newProfile);
        setRole(profileData.role);
        try {
          await AsyncStorage.setItem(
            MOCK_USER_STORAGE_KEY,
            JSON.stringify({ user: newUser, profile: newProfile, role: profileData.role }),
          );
        } catch {
          // ignore
        }
      },

      /**
       * Biometrics gate an *existing* session — Face ID cannot mint a Firebase
       * credential. If there is no session, the caller falls back to password.
       */
      unlockWithBiometrics: async () => {
        if (!biometricsAvailable || (!auth().currentUser && !user)) return false;
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock DFC',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
        });
        return res.success;
      },

      signOut: async () => {
        try {
          await AsyncStorage.removeItem(MOCK_USER_STORAGE_KEY);
        } catch {
          // ignore
        }
        setUser(null);
        setProfile(null);
        setRole(null);
        if (isConfigured) {
          const current = auth().currentUser;
          if (current && pushToken.current) {
            await unregisterPush(current.uid, pushToken.current);
          }
          await fbSignOut(auth());
        }
      },

      updateProfile: async (patch) => {
        if (!user) return;
        setProfile((prev) => (prev ? { ...prev, ...patch, updatedAt: Date.now() } : null));
        if (!isConfigured) {
          try {
            const saved = await AsyncStorage.getItem(MOCK_USER_STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.profile = { ...parsed.profile, ...patch, updatedAt: Date.now() };
              await AsyncStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(parsed));
            }
          } catch {
            // ignore
          }
          return;
        }
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
