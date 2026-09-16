import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'workouts'), where('userId', '==', 'fixed-marcelly'));
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.size} workouts for Marcelly in the global collection.`);
}

run().catch(console.error).finally(() => process.exit(0));
