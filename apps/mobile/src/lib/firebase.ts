/**
 * Firebase on React Native.
 *
 * Three RN-specific details worth knowing:
 *   1. Auth needs an explicit AsyncStorage persistence layer, otherwise a user
 *      is signed out every cold start.
 *   2. Firestore's default transport uses streaming XHR, which React Native's
 *      networking stack handles badly on some Android builds. Long-polling is
 *      the supported fix and costs nothing at this scale.
 *   3. Firestore's persistent cache needs IndexedDB, so it is web-only. See
 *      the note above `localCache` below.
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
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

/**
 * Firestore's disk cache is built on IndexedDB, which exists on web and does
 * not exist in React Native — there is no such global in Hermes and nothing
 * polyfills it here.
 *
 * Asking for `persistentLocalCache` on a phone therefore does not fail loudly.
 * The SDK catches its own start-up error, logs "Error using user provided
 * cache. Falling back to memory cache", and carries on with an in-memory one.
 * Naming that outcome is worth more than the aspiration: this used to read as
 * if the rider's active task survived a cold start, and it never did.
 *
 * What actually survives a restart on device is the AsyncStorage mutation
 * queue in src/lib/offline-storage.ts. Firestore's in-memory cache still does
 * the job it can do — reads stay warm and offline writes replay while the app
 * is alive, which covers the dead spot between two buildings.
 */
const localCache = () =>
  Platform.OS === 'web'
    ? persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) })
    : memoryLocalCache();

export function db(): Firestore {
  if (_db) return _db;
  _db = initializeFirestore(app(), {
    // React Native's networking stack handles Firestore's streaming transport
    // badly on some Android builds. Long-polling is the supported fix.
    experimentalForceLongPolling: Platform.OS !== 'web',

    localCache: localCache(),
  });
  return _db;
}

export function storage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(app());
  return _storage;
}
