'use client';

/**
 * Firebase, browser side.
 *
 * The values in NEXT_PUBLIC_* are not secrets — they identify the project, and
 * every Firebase web app ships them. What actually protects the data is
 * firestore.rules plus App Check, which is initialised here.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === '1';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

function app(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(config);

  // App Check has to come before the first Firestore/Storage call.
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    try {
      initializeAppCheck(_app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch {
      // Already initialised by a fast-refresh cycle — harmless.
    }
  }
  return _app;
}

export function db(): Firestore {
  if (_db) return _db;
  // Offline cache with multi-tab coordination: an admin with the board open in
  // three tabs should not fight itself over the IndexedDB lease.
  _db = initializeFirestore(app(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  if (USE_EMULATOR) connectFirestoreEmulator(_db, '127.0.0.1', 8080);
  return _db;
}

export function auth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(app());
  if (USE_EMULATOR) connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  return _auth;
}

export function storage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(app());
  if (USE_EMULATOR) connectStorageEmulator(_storage, '127.0.0.1', 9199);
  return _storage;
}

/** Fallback so a fresh checkout renders instead of crashing on a blank .env. */
export const isConfigured = Boolean(config.apiKey && config.projectId);
