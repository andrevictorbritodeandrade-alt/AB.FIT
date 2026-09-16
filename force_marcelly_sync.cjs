const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('alunos').where('email', '==', 'marcellybispo92@gmail.com').get();
  if (snapshot.empty) {
    console.log("Marcelly not found in db");
    return;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  
  await doc.ref.update({
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
