import { initializeApp as initFirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const firebaseApp = initFirebaseApp(firebaseConfig, 'final-verification');
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function verify() {
  const ids = ['fixed-andre', 'fixed-marcelly'];
  for (const id of ids) {
    const d = await getDoc(doc(db, 'alunos', id));
    if (!d.exists()) { console.log(`${id} not found`); continue; }
    const data = d.data();
    console.log(`--- ${data.name || data.nome} ---`);
    data.workouts.forEach((w: any) => {
        console.log(`${w.title}: ${w.exercises.map((e: any) => e.name).join(', ')}`);
    });
  }
}
verify().catch(console.error);
