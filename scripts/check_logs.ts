
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const andreId = 'fixed-andre';
  
  console.log('--- Collection: alunos ---');
  const logsRef = collection(db, 'alunos', andreId, 'logsTreino');
  const snapLogs = await getDocs(query(logsRef, orderBy('dataHora', 'desc')));
  console.log(`Logs in alunos: ${snapLogs.size}`);
  snapLogs.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.prescricaoId} on ${data.dataHora?.toDate()?.toISOString() || 'no date'}`);
  });

  console.log('\n--- Collection: workouts ---');
  const workoutsRef = collection(db, 'workouts');
  const snapWorkouts = await getDocs(query(workoutsRef, orderBy('concluidoEm', 'desc')));
  const andreWorkouts = snapWorkouts.docs.filter(d => d.data().userId === andreId);
  console.log(`Workouts in global collection for André: ${andreWorkouts.length}`);
  andreWorkouts.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.treinoId} on ${data.concluidoEm?.toDate()?.toISOString() || 'no date'}`);
  });
}

check().catch(console.error);
