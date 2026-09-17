import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig, "admin-app-4");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const lilianeId = "liliane-torres-" + Date.now();

const alunoData = {
  nome: "Liliane Torres",
  email: "liliane.torres@example.com",
  status: "active",
  photoUrl: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  periodization: {
    phaseTitle: "Periodização 32 Sessões",
    targetSets: 32,
    description: "A cada 8 sessões, fazer ajustes de cargas, para aumentar de maneira que tenha desconforto comparada com a anterior.",
  },
  workouts: [
    {
      id: "treino-a",
      title: "Treino A",
      projectedSessions: 32,
      defaultRest: "20s",
      defaultReps: "13",
      exercises: [
        { name: "Leg Press Horizontal", sets: "4", reps: "13", rest: "20s" },
        { name: "Agachamento na parede com bola suíssa e HBC", sets: "4", reps: "13", rest: "20s" },
        { name: "Agachamento passada com HBC segurando no espaldar", sets: "4", reps: "13", rest: "20s" },
        { name: "Cadeira extensora", sets: "4", reps: "13", rest: "20s" },
        { name: "Cadeira extensora unilateral", sets: "4", reps: "13", rest: "20s" },
        { name: "Supino aberto no banco reto com HBC", sets: "3", reps: "13", rest: "20s" },
        { name: "Remada alta em pé com HBC", sets: "3", reps: "13", rest: "20s" },
        { name: "Tríceps em pé no cross barra reta", sets: "3", reps: "13", rest: "20s" },
        { name: "Abdominal diagonal no solo", sets: "3", reps: "13", rest: "20s" },
        { name: "Prancha ventral no solo em isometria", sets: "3", reps: "13", rest: "20s" }
      ]
    },
    {
      id: "treino-b",
      title: "Treino B",
      projectedSessions: 32,
      defaultRest: "20s",
      defaultReps: "13",
      exercises: [
        { name: "Subida unilateral no banco reto ou 2 steps", sets: "4", reps: "13", rest: "20s" },
        { name: "Extensão de quadril e joelho em pé com caneleira joelho estendido no segurando no espaldar (Coice)", sets: "4", reps: "13", rest: "20s" },
        { name: "Extensão de quadril em pé com caneleira joelho estendido no segurando no espaldar", sets: "4", reps: "13", rest: "20s" },
        { name: "Flexão de joelho em pé com caneleira segurando no espaldar", sets: "4", reps: "13", rest: "20s" },
        { name: "Cadeira flexora", sets: "4", reps: "13", rest: "20s" },
        { name: "Remada baixa pegada supinada com barra reta sentada no solo com steps", sets: "3", reps: "13", rest: "20s" },
        { name: "Puxada alta aberta com barra reta", sets: "3", reps: "13", rest: "20s" },
        { name: "Bíceps em pé no cross com barra reta ou com HBC", sets: "3", reps: "13", rest: "20s" },
        { name: "Abdominal diagonal no solo", sets: "3", reps: "13", rest: "20s" },
        { name: "Prancha ventral no solo em isometria", sets: "3", reps: "13", rest: "20s" }
      ]
    },
    {
      id: "treino-c",
      title: "Treino Aeróbico",
      projectedSessions: 32,
      description: "Seg, Qua e Sex: 5' cam. em 5km/h + 5' em 5,5km/h + 5' em 6,0km/h + 5' em 6,5km/h + 5' em 6,0km/h + 5' em 5,5km/h + 5' em 5km/h. Ter, Qui e Sáb: 35' de caminhada contínua em 6,0km/h.",
      exercises: [
        { name: "Caminhada Intercalada (Seg, Qua, Sex)", sets: "1", reps: "35 min", rest: "0s", method: "5km/h a 6.5km/h" },
        { name: "Caminhada Contínua (Ter, Qui, Sáb)", sets: "1", reps: "35 min", rest: "0s", method: "6.0km/h" }
      ]
    }
  ]
};

await setDoc(doc(db, "alunos", lilianeId), alunoData);

const planRef = doc(db, `alunos/${lilianeId}/active_plans/current`);
await setDoc(planRef, {
  phaseName: "Periodização 32 Sessões",
  targetSets: 32,
  progress: { A: 0, B: 0, C: 0 },
  updatedAt: serverTimestamp()
});

console.log("Successfully created Liliane Torres with ID:", lilianeId);
process.exit(0);
