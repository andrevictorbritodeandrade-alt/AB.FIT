
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function fix() {
  const andreId = 'fixed-andre';
  const planRef = doc(db, 'alunos', andreId, 'active_plans', 'current');
  
  // Update progress in the current plan for André
  await setDoc(planRef, {
    progress: { A: 7, B: 6, C: 0 },
    targetSets: 18,
    updatedAt: new Date()
  }, { merge: true });
  
  // Update trainingProgress and loads in the student document for André
  const exAndreTreinoA = [
    { id: 'a-a-1', name: 'Leg press horizontal/máquina', sets: '3', reps: '13', rest: '20s', load: '50 Kg', executionType: 'Simples' },
    { id: 'a-a-2', name: 'Agachamento no aparelho hack machine', sets: '3', reps: '13', rest: '20s', load: '-- Kg', executionType: 'Simples' },
    { id: 'a-a-3', name: 'Cadeira extensora', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
    { id: 'a-a-4', name: 'Cadeira extensora unilateral', sets: '3', reps: '13', rest: '20s', load: '5 Kg', executionType: 'Simples' },
    { id: 'a-a-5', name: 'Supino aberto na máquina', sets: '3', reps: '13', rest: '20s', load: '30 Kg', executionType: 'Simples' },
    { id: 'a-a-6', name: 'Supino aberto no banco inclinado na máquina', sets: '3', reps: '13', rest: '20s', load: '2,5 Kg', executionType: 'Simples' },
    { id: 'a-a-7', name: 'Desenvolvimento aberto máquina', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
    { id: 'a-a-8', name: 'Tríceps em pé no Cross barra reta', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
    { id: 'a-a-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' }
  ];

  const studentRef = doc(db, 'alunos', andreId);
  await updateDoc(studentRef, {
    faseAjusteA: 7,
    faseAjusteB: 6,
    totalGlobalA: 7,
    totalGlobalB: 6,
    'trainingProgress.completedCount': 13,
    'trainingProgress.targetCount': 36,
    'activePlan.progress.A': 7,
    'activePlan.progress.B': 6,
    'activePlan.targetSets': 18,
    'periodizationProgress.3 x 13.A': 7,
    'periodizationProgress.3 x 13.B': 6,
    'periodizationProgress.Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps).A': 7,
    'periodizationProgress.Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps).B': 6,
  });

  console.log('André Brito progress fixed to A:7, B:6 (Total: 13/36)');

  // Update progress for Marcelly
  const marcellyId = 'fixed-marcelly';
  const marcellyPlanRef = doc(db, 'alunos', marcellyId, 'active_plans', 'current');
  await setDoc(marcellyPlanRef, {
    progress: { A: 5, B: 5, C: 0 },
    targetSets: 18,
    updatedAt: new Date()
  }, { merge: true });

  const marcellyStudentRef = doc(db, 'alunos', marcellyId);
  await updateDoc(marcellyStudentRef, {
    faseAjusteA: 5,
    faseAjusteB: 5,
    totalGlobalA: 5,
    totalGlobalB: 5,
    'trainingProgress.completedCount': 10,
    'trainingProgress.targetCount': 36,
    'activePlan.progress.A': 5,
    'activePlan.progress.B': 5,
    'activePlan.targetSets': 18,
    'periodizationProgress.3 x 13.A': 5,
    'periodizationProgress.3 x 13.B': 5,
    'periodizationProgress.Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps).A': 5,
    'periodizationProgress.Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps).B': 5,
  });

  console.log('Marcelly Bispo progress fixed to A:5, B:5 (Total: 10/36)');
}

fix().catch(console.error);
