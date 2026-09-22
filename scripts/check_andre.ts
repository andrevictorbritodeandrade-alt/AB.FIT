
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const andreId = 'fixed-andre';
  const historyRef = collection(db, 'users', andreId, 'workout_history');
  const q = query(historyRef, orderBy('dateCompleted', 'desc'));
  const snapshot = await getDocs(q);
  
  console.log(`History for André: ${snapshot.size} records`);
  let countA = 0;
  let countB = 0;
  let countC = 0;
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.workoutType} on ${data.dateCompleted?.toDate()?.toISOString() || 'no date'}`);
    if (data.workoutType === 'A') countA++;
    if (data.workoutType === 'B') countB++;
    if (data.workoutType === 'C') countC++;
  });
  
  console.log(`Calculated: A:${countA}, B:${countB}, C:${countC}`);
}

check().catch(console.error);
