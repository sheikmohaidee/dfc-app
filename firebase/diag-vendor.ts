import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAdu82O206RV5jt0E0gSe_v7tYQJe-SEEs',
  authDomain: 'dfc-app-bdb4e.firebaseapp.com',
  projectId: 'dfc-app-bdb4e',
  storageBucket: 'dfc-app-bdb4e.firebasestorage.app',
  messagingSenderId: '736541487031',
  appId: '1:736541487031:web:0e1375514299b33e75c232',
};

async function testVendorPermissions() {
  const app = initializeApp(firebaseConfig, 'diagApp');
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, 'vendor@dfc.test', 'dfc-vendor-2026');
  console.log('Vendor signed in:', cred.user.uid);
  const token = await cred.user.getIdTokenResult();
  console.log('Vendor claims:', token.claims);

  try {
    const storeSnap = await getDoc(doc(db, 'stores', 'konar-kadai'));
    console.log('Store read SUCCESS:', storeSnap.data());
  } catch (e: any) {
    console.log('Store read FAILED:', e.message);
  }

  // Check the order from previous run: live-order-9159-mujw8uhb
  try {
    const orderSnap = await getDoc(doc(db, 'orders', 'live-order-9159-mujw8uhb'));
    console.log('Order read SUCCESS:', orderSnap.data()?.status, orderSnap.data()?.storeId);
  } catch (e: any) {
    console.log('Order read FAILED:', e.message);
  }
}

testVendorPermissions().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
