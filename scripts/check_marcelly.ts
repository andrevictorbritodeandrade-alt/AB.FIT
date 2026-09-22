
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const marcellyId = 'fixed-marcelly';
  const historyRef = collection(db, 'users', marcellyId, 'workout_history');
  const snapshot = await getDocs(query(historyRef, orderBy('dateCompleted', 'desc')));
  
  console.log(`History for Marcelly: ${snapshot.size} records`);
  let countA = 0, countB = 0, countC = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.workoutType === 'A') countA++;
    if (data.workoutType === 'B') countB++;
    if (data.workoutType === 'C') countC++;
  });
  console.log(`Calculated: A:${countA}, B:${countB}, C:${countC}`);
}

check().catch(console.error);
