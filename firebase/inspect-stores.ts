import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyAdu82O206RV5jt0E0gSe_v7tYQJe-SEEs',
  authDomain: 'dfc-app-bdb4e.firebaseapp.com',
  projectId: 'dfc-app-bdb4e',
  storageBucket: 'dfc-app-bdb4e.firebasestorage.app',
  messagingSenderId: '736541487031',
  appId: '1:736541487031:web:0e1375514299b33e75c232',
};

async function inspectStores() {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, 'admin@dfc.test', 'dfc-admin-2026');
  console.log('Signed in as Admin');

  const snap = await getDocs(collection(db, 'stores'));
  console.log(`Found ${snap.size} stores:`);
  snap.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id}, Name: ${data.name}, Category: ${data.category}, OwnerUid: ${data.ownerUid}`);
  });

  const ridersSnap = await getDocs(collection(db, 'riders'));
  console.log(`Found ${ridersSnap.size} riders:`);
  ridersSnap.forEach(d => {
    const data = d.data();
    console.log(`- ID: ${d.id}, Name: ${data.name}, isOnline: ${data.isOnline}, activeOrderId: ${data.activeOrderId}`);
  });
}

inspectStores().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
