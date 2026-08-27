/**
 * Firebase on React Native.
 *
 * Two RN-specific details worth knowing:
 *   1. Auth needs an explicit AsyncStorage persistence layer, otherwise a user
 *      is signed out every cold start.
 *   2. Firestore's default transport uses streaming XHR, which React Native's
 *      networking stack handles badly on some Android builds. Long-polling is
 *      the supported fix and costs nothing at this scale.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error — not in the public types, but it is the documented RN entry point.
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

export const isConfigured = Boolean(config.apiKey && config.projectId);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function app(): FirebaseApp {
  if (!_app) _app = getApps().length ? getApp() : initializeApp(config);
  return _app;
}

export function auth(): Auth {
  if (_auth) return _auth;
  try {
    _auth = initializeAuth(app(), {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast refresh already initialised it.
    _auth = getAuth(app());
  }
  return _auth;
}

export function db(): Firestore {
  if (_db) return _db;
  _db = initializeFirestore(app(), {
    // React Native's networking stack handles Firestore's streaming transport
    // badly on some Android builds. Long-polling is the supported fix.
    experimentalForceLongPolling: true,

    // Disk-backed cache. This is what keeps a rider working through a dead
    // spot: the active task — address, phone, OTP, items — is already local,
    // so the screen renders and status taps queue up instead of failing.
    // Writes made offline replay automatically when signal returns.
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(undefined),
    }),
  });
  return _db;
}

export function storage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(app());
  return _storage;
}
