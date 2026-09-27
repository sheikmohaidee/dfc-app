import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyAdu82O206RV5jt0E0gSe_v7tYQJe-SEEs',
  authDomain: 'dfc-app-bdb4e.firebaseapp.com',
  projectId: 'dfc-app-bdb4e',
  storageBucket: 'dfc-app-bdb4e.firebasestorage.app',
  messagingSenderId: '736541487031',
  appId: '1:736541487031:web:0e1375514299b33e75c232',
};

async function assignVendorToFoodStore() {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, 'admin@dfc.test', 'dfc-admin-2026');
  console.log('Admin signed in');

  const ref = doc(db, 'stores', 'konar-kadai');
  await updateDoc(ref, {
    ownerUid: 'seed-vendor',
    updatedAt: Date.now(),
  });
  console.log('Assigned konar-kadai ownerUid to seed-vendor');

  const snap = await getDoc(ref);
  console.log('konar-kadai state:', snap.data());
}

assignVendorToFoodStore().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
