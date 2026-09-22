
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function fix() {
  const andreId = 'fixed-andre';
  const planRef = doc(db, 'alunos', andreId, 'active_plans', 'current');
  
  // Update progress in the current plan
  await setDoc(planRef, {
    progress: { A: 6, B: 6, C: 0 },
    targetSets: 18,
    updatedAt: new Date()
  }, { merge: true });
  
  // Update trainingProgress in the student document
  const studentRef = doc(db, 'alunos', andreId);
  await updateDoc(studentRef, {
    faseAjusteA: 6,
    faseAjusteB: 6,
    totalGlobalA: 6,
    totalGlobalB: 6,
    'trainingProgress.completedCount': 12,
    'trainingProgress.targetCount': 36,
    'activePlan.progress.A': 6,
    'activePlan.progress.B': 6,
    'activePlan.targetSets': 18,
    'periodizationProgress.3 x 13.A': 6,
    'periodizationProgress.3 x 13.B': 6,
    'periodizationProgress.Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps).A': 6,
    'periodizationProgress.Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps).B': 6,
  });

  console.log('André Brito progress fixed to A:6, B:6 (Total: 12/36)');
}

fix().catch(console.error);
