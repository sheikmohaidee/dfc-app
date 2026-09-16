/**
 * Session, profile and role for the mobile apps.
 *
 * Supports seamless Demo Mode via local mock repository without Firebase dependency,
 * while preserving future Firebase Auth & Firestore listeners.
 */

import * as React from 'react';
import { Platform } from 'react-native';
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
import { DEMO_MODE } from '@/demo/config';
import { mockAuthRepository } from '@/demo/repositories/auth.repository';
import { demoStorage } from '@/demo/storage';

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
  user: User | { uid: string; email?: string; displayName?: string | null; phoneNumber?: string | null } | null;
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
  const [user, setUser] = React.useState<
    User | { uid: string; email?: string; displayName?: string | null; phoneNumber?: string | null } | null
  >(() => {
    if (DEMO_MODE) {
      const u = demoStorage.getUser();
      return u ? { uid: u.uid, email: `${u.role}@dfc.test`, displayName: u.name, phoneNumber: u.phone } : null;
    }
    return null;
  });
  const [profile, setProfile] = React.useState<UserProfile | null>(() => {
    if (DEMO_MODE) return demoStorage.getUser();
    return null;
  });
  const [role, setRole] = React.useState<Role | null>(() => {
    if (DEMO_MODE) return demoStorage.getUser()?.role ?? null;
    return null;
  });
  const [loading, setLoading] = React.useState(!DEMO_MODE);
  const [biometricsAvailable, setBiometrics] = React.useState(false);
  const pushToken = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    void (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometrics(hasHardware && enrolled);
      } catch {
        setBiometrics(false);
      }
    })();
  }, []);

  // Demo Mode or live session listener
  React.useEffect(() => {
    if (DEMO_MODE) {
      const unsub = demoStorage.subscribe(() => {
        const u = demoStorage.getUser();
        setUser(u ? { uid: u.uid, email: `${u.role}@dfc.test` } : null);
        setProfile(u);
        setRole(u?.role ?? null);
        setLoading(false);
      });
      setLoading(false);
      return unsub;
    }

    if (!isConfigured) {
      void (async () => {
        try {
          const savedMock = await AsyncStorage.getItem(MOCK_USER_STORAGE_KEY);
          if (savedMock) {
            const parsed = JSON.parse(savedMock) as { user: User; profile: UserProfile; role: Role };
            setUser(parsed.user);
            setProfile(parsed.profile);
            setRole(parsed.role);
          }
        } catch {
          // continue
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    const unsub = onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const token = await u.getIdTokenResult();
        setRole((token.claims.role as Role) ?? 'customer');
      } catch {
        setRole('customer');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  // Live profile listener (active when DEMO_MODE = false)
  React.useEffect(() => {
    if (DEMO_MODE || !user || !isConfigured) return;
    return onSnapshot(
      doc(db(), COL.users, user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile((prev) => prev ?? {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Customer',
            phone: user.phoneNumber || '+919876543210',
            role: role ?? 'customer',
            localityId: 'kk-nagar',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      },
      (err) => {
        console.warn('Profile listener error:', err);
      },
    );
  }, [user, role]);

  // Push notifications registration
  React.useEffect(() => {
    if (DEMO_MODE || !user || !role || !isConfigured) return;
    let token: string | null = null;
    void registerForPush(user.uid, role).then((r) => {
      token = r.token;
      pushToken.current = r.token;
    });
    return () => {
      void token;
    };
  }, [user, role]);

  const value = React.useMemo<AuthValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      configured: true,
      biometricsAvailable,

      signIn: async (email, password) => {
        if (DEMO_MODE) {
          const u = await mockAuthRepository.loginWithStaff(email, password);
          setUser({ uid: u.uid, email });
          setProfile(u);
          setRole(u.role);
          return;
        }
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
        if (DEMO_MODE) {
          await demoStorage.setUser(persona.profile);
        }
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
        if (DEMO_MODE) {
          await demoStorage.setUser(newProfile);
        }
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
        if (DEMO_MODE) return true;
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
        if (DEMO_MODE) {
          await mockAuthRepository.logout();
          setUser(null);
          setProfile(null);
          setRole(null);
          return;
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
        if (DEMO_MODE) {
          const updated = await mockAuthRepository.updateProfile(patch);
          setProfile(updated);
          return;
        }
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
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
