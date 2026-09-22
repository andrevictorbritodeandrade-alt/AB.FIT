
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const andreId = 'fixed-andre';
  const planRef = doc(db, 'users', andreId, 'active_plans', 'current');
  const snap = await getDoc(planRef);
  if (snap.exists()) {
    console.log('Current Plan:', JSON.stringify(snap.data(), null, 2));
  } else {
    console.log('Plan not found');
  }
}

check().catch(console.error);
