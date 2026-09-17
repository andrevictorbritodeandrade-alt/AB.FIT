import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig, "admin-app");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const alunosRef = collection(db, 'alunos');
const snapshot = await getDocs(alunosRef);
snapshot.forEach(doc => {
  const data = doc.data();
  if (data.nome && data.nome.toLowerCase().includes('liliane')) {
    console.log(doc.id, data.nome);
  }
});
process.exit(0);
