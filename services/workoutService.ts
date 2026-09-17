import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc,
  runTransaction, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  Unsubscribe 
} from "firebase/firestore";
import { db } from "./firebase";
import { ActivePlan } from "../types";

export interface WorkoutHistoryRecord {
  id?: string;
  planId: string;
  workoutType: 'A' | 'B' | 'C';
  dateCompleted?: any;
  volumeTotal?: number;
  exercises?: any[];
  duration?: string;
  duracaoMinutos?: number;
  calorias?: number;
  workoutName?: string;
  photoUrl?: string;
  [key: string]: any;
}

export interface FinalizarTreinoResult {
  success: boolean;
  message: string;
  notificacaoNecessaria: string | null;
  novaContagem?: number;
  targetSets?: number;
  tipoTreino?: 'A' | 'B' | 'C';
  error?: any;
}

/**
 * A Lógica Infalível de Salvar Treino (Transação Atômica no Firestore)
 */
export async function finalizarTreino(
  userId: string,
  planId: string = 'current',
  tipoTreino: 'A' | 'B' | 'C',
  dadosDoTreino: Partial<WorkoutHistoryRecord> = {}
): Promise<FinalizarTreinoResult> {
  try {
    const activePlanId = planId || 'current';
    let notificacaoNecessaria: string | null = null;
    let novaContagem = 1;
    let targetSets = 18;

    const planRef = doc(db, `alunos/${userId}/active_plans/${activePlanId}`);
    const historyRef = doc(collection(db, `alunos/${userId}/workout_history`));
    const statsRef = doc(db, `user_stats/${userId}`);
    const alunoRef = doc(db, 'alunos', userId);

    await runTransaction(db, async (transaction) => {
      const planDoc = await transaction.get(planRef);
      const statsDoc = await transaction.get(statsRef);
      const alunoDoc = await transaction.get(alunoRef);
      
      // 1. Atualizar Active Plan
      if (!planDoc.exists()) {
        targetSets = 18;
        novaContagem = 1;
        const initialProgress = { A: 0, B: 0, C: 0 };
        initialProgress[tipoTreino] = 1;
        
        transaction.set(planRef, {
          phaseName: "Mesociclo 16 - Hipertrofia",
          targetSets: 18,
          progress: initialProgress,
          updatedAt: serverTimestamp()
        });
      } else {
        const planData = planDoc.data() as any;
        targetSets = planData.targetSets || 18;
        const progress = planData.progress || { A: 0, B: 0, C: 0 };
        novaContagem = (progress[tipoTreino] || 0) + 1;
        
        transaction.update(planRef, {
          [`progress.${tipoTreino}`]: novaContagem,
          updatedAt: serverTimestamp()
        });
      }

      // 2. Adiciona o histórico
      transaction.set(historyRef, {
        planId: activePlanId,
        workoutType: tipoTreino,
        dateCompleted: serverTimestamp(),
        volumeTotal: dadosDoTreino.volumeTotal || 0.0,
        workoutName: dadosDoTreino.workoutName || `Treino ${tipoTreino}`,
        duration: dadosDoTreino.duration || '00:00',
        duracaoMinutos: dadosDoTreino.duracaoMinutos || 0,
        calorias: dadosDoTreino.calorias || 0,
        exercises: dadosDoTreino.exercises || [],
        photoUrl: dadosDoTreino.photoUrl || null
      });

      // 3. Atualizar User Stats Globais
      const currentGlobalCount = statsDoc.exists() ? (statsDoc.data().totalWorkouts || 0) : 0;
      transaction.set(statsRef, {
        totalWorkouts: currentGlobalCount + 1,
        lastWorkoutAt: serverTimestamp()
      }, { merge: true });

      // 4. Update fallback inside `alunos` for legacy compatibility
      if (alunoDoc.exists()) {
        const aData = alunoDoc.data();
        const pKey = '3 x 13';
        const prevProg = aData.periodizationProgress || {};
        const subProg = { ...(prevProg[pKey] || { A: 0, B: 0, C: 0 }) };
        subProg[tipoTreino] = novaContagem;
        
        transaction.update(alunoRef, {
          [`faseAjuste${tipoTreino}`]: novaContagem,
          [`totalGlobal${tipoTreino}`]: (aData[`totalGlobal${tipoTreino}`] || 0) + 1,
          [`activePlan.progress.${tipoTreino}`]: novaContagem,
          [`activePlan.targetSets`]: targetSets,
          [`periodizationProgress.${pKey}`]: subProg,
          lastUpdateTimestamp: serverTimestamp()
        });
      }

      if (novaContagem === 6 || novaContagem === 12) {
        notificacaoNecessaria = `Atenção: Você concluiu o treino ${tipoTreino} pela ${novaContagem}ª vez. Hora de ajustar as cargas!`;
      } else if (novaContagem === targetSets) {
        notificacaoNecessaria = `Parabéns! Você concluiu os ${targetSets} treinos do ${tipoTreino}. Última sessão antes de mudar a periodização!`;
      }
    });

    return {
      success: true,
      message: "Treino salvo com sucesso!",
      notificacaoNecessaria,
      novaContagem,
      targetSets,
      tipoTreino
    };
  } catch (error) {
    console.error("Erro ao salvar treino na transação atômica:", error);
    return {
      success: false,
      message: "Erro ao salvar. Tente novamente.",
      notificacaoNecessaria: null,
      error
    };
  }
}

export function subscribeToActivePlan(
  userId: string,
  onUpdate: (plan: ActivePlan) => void,
  planId: string = 'current'
): Unsubscribe {
  const planRef = doc(db, `alunos/${userId}/active_plans/${planId}`);
  return onSnapshot(planRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onUpdate({
        id: docSnap.id,
        phaseName: data.phaseName || "Mesociclo 16 - Hipertrofia",
        targetSets: data.targetSets || 18,
        progress: {
          A: data.progress?.A ?? 0,
          B: data.progress?.B ?? 0,
          C: data.progress?.C ?? 0
        },
        updatedAt: data.updatedAt
      });
    } else {
      onUpdate({
        id: 'current',
        phaseName: "Mesociclo 16 - Hipertrofia",
        targetSets: 18,
        progress: { A: 0, B: 0, C: 0 }
      });
    }
  });
}

export function subscribeToWorkoutHistory(
  userId: string,
  onUpdate: (history: WorkoutHistoryRecord[]) => void,
  limitCount: number = 50
): Unsubscribe {
  const historyRef = collection(db, `alunos/${userId}/workout_history`);
  const q = query(historyRef, orderBy('dateCompleted', 'desc'), limit(limitCount));
  
  return onSnapshot(q, (snapshot) => {
    const records: WorkoutHistoryRecord[] = [];
    snapshot.forEach(docSnap => {
      records.push({
        id: docSnap.id,
        ...docSnap.data()
      } as WorkoutHistoryRecord);
    });
    onUpdate(records);
  });
}

export function subscribeToUserStats(
  userId: string,
  onUpdate: (totalWorkouts: number) => void
): Unsubscribe {
  const statsRef = doc(db, `user_stats/${userId}`);
  return onSnapshot(statsRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data().totalWorkouts || 0);
    } else {
      onUpdate(0);
    }
  });
}
