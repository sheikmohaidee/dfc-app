import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, limit, query } from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyAdu82O206RV5jt0E0gSe_v7tYQJe-SEEs',
  authDomain: 'dfc-app-bdb4e.firebaseapp.com',
  projectId: 'dfc-app-bdb4e',
  storageBucket: 'dfc-app-bdb4e.firebasestorage.app',
  messagingSenderId: '736541487031',
  appId: '1:736541487031:web:0e1375514299b33e75c232',
};

async function testConnection() {
  console.log('Testing live Firebase connection to:', config.projectId);
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Attempting sign in with seed accounts...');
  const testUsers = [
    { email: 'customer@dfc.test', pass: 'dfc-customer-2026', role: 'customer' },
    { email: 'admin@dfc.test', pass: 'dfc-admin-2026', role: 'admin' },
    { email: 'vendor@dfc.test', pass: 'dfc-vendor-2026', role: 'vendor' },
    { email: 'rider@dfc.test', pass: 'dfc-rider-2026', role: 'rider' },
  ];

  for (const tu of testUsers) {
    try {
      const cred = await signInWithEmailAndPassword(auth, tu.email, tu.pass);
      const token = await cred.user.getIdTokenResult();
      console.log(`[AUTH SUCCESS] Signed in as ${tu.role}: ${tu.email} (UID: ${cred.user.uid}) claims:`, token.claims);
    } catch (e: any) {
      console.log(`[AUTH FAILED] for ${tu.email}: ${e.code || e.message}`);
    }
  }

  // Also check public stores or products
  try {
    const storesSnap = await getDocs(query(collection(db, 'stores'), limit(3)));
    console.log(`[FIRESTORE STORES] Found ${storesSnap.size} stores`);
    storesSnap.forEach(d => console.log('  Store:', d.id, d.data().name));
  } catch (e: any) {
    console.log('[FIRESTORE STORES ERROR]:', e.code || e.message);
  }

  try {
    const ordersSnap = await getDocs(query(collection(db, 'orders'), limit(3)));
    console.log(`[FIRESTORE ORDERS] Found ${ordersSnap.size} orders`);
    ordersSnap.forEach(d => console.log('  Order:', d.id, d.data().status));
  } catch (e: any) {
    console.log('[FIRESTORE ORDERS ERROR]:', e.code || e.message);
  }
}

testConnection().then(() => process.exit(0)).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
