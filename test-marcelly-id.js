import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'alunos'), where('email', '==', 'marcellybispo92@gmail.com'));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    console.log("Marcelly's ID is:", doc.id);
  } else {
    console.log("Marcelly not found in db by email");
  }
}

run().catch(console.error).finally(() => process.exit(0));
