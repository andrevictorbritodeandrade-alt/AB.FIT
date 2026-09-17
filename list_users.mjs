import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig, "admin-app-2");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const alunosRef = collection(db, 'alunos');
const snapshot = await getDocs(alunosRef);
snapshot.forEach(doc => {
  console.log(doc.id, doc.data().nome);
});
process.exit(0);
