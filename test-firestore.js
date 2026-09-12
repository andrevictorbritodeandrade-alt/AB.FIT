import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
try {
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log("Success!");
} catch (e) {
  console.error("Error:", e);
}
