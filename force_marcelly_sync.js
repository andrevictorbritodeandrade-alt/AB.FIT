import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'alunos'), where('email', '==', 'marcellybispo92@gmail.com'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("Marcelly not found in db");
    return;
  }
  
  const docRef = snapshot.docs[0].ref;
  
  await updateDoc(docRef, {
    faseAjusteA: 2,
    faseAjusteB: 2,
    totalGlobalA: 2,
    totalGlobalB: 2,
    "activePlan.progress.A": 2,
    "activePlan.progress.B": 2,
    "trainingProgress.completedCount": 4,
    "periodizationProgress.3 x 13.A": 2,
    "periodizationProgress.3 x 13.B": 2,
  });
  
  console.log("Updated Marcelly's DB state to exactly 2x2!");
}

run().catch(console.error).finally(() => process.exit(0));
