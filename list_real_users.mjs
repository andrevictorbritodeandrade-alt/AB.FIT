import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig, "admin-app-3");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const usersRef = collection(db, 'users');
const snapshot = await getDocs(usersRef);
snapshot.forEach(doc => {
  console.log(doc.id, doc.data().nome || doc.data().name);
});
process.exit(0);
