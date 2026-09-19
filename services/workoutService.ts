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
    const isLiliane = userId === 'fixed-liliane';
    const defaultTarget = isLiliane ? 32 : 18;
    const defaultPhase = isLiliane ? "Treino A e Treino B (32 Sessões)" : "Fase 1: Retorno & Adaptação (18 Sessões)";
    let notificacaoNecessaria: string | null = null;
    let novaContagem = 1;
    let targetSets = defaultTarget;

    const planRef = doc(db, `users/${userId}/active_plans/${activePlanId}`);
    const historyRef = doc(collection(db, `users/${userId}/workout_history`));
    const statsRef = doc(db, `user_stats/${userId}`);
    const alunoRef = doc(db, 'alunos', userId);
    const planRefAlunos = doc(db, `alunos/${userId}/active_plans/${activePlanId}`);
    const historyRefAlunos = doc(collection(db, `alunos/${userId}/workout_history`));

    await runTransaction(db, async (transaction) => {
      let planDoc = await transaction.get(planRef);
      if (!planDoc.exists()) {
        const altDoc = await transaction.get(planRefAlunos);
        if (altDoc.exists()) {
          planDoc = altDoc;
        }
      }
      const statsDoc = await transaction.get(statsRef);
      const alunoDoc = await transaction.get(alunoRef);
      
      // 1. Atualizar Active Plan
      if (!planDoc.exists()) {
        targetSets = defaultTarget;
        novaContagem = 1;
        const initialProgress = { A: 0, B: 0, C: 0 };
        initialProgress[tipoTreino] = 1;
        
        const planPayload = {
          phaseName: defaultPhase,
          targetSets: defaultTarget,
          progress: initialProgress,
          updatedAt: serverTimestamp()
        };
        transaction.set(planRef, planPayload);
        transaction.set(planRefAlunos, planPayload);
      } else {
        const planData = planDoc.data() as any;
        targetSets = isLiliane ? 32 : (planData.targetSets || defaultTarget);
        const progress = planData.progress || { A: 0, B: 0, C: 0 };
        novaContagem = (progress[tipoTreino] || 0) + 1;
        
        const updatePayload = {
          targetSets,
          [`progress.${tipoTreino}`]: novaContagem,
          updatedAt: serverTimestamp()
        };
        transaction.update(planRef, updatePayload);
        transaction.set(planRefAlunos, {
          ...planData,
          targetSets,
          progress: {
            ...progress,
            [tipoTreino]: novaContagem
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // 2. Adiciona o histórico nas coleções do Firestore
      const historyPayload = {
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
      };
      transaction.set(historyRef, historyPayload);
      transaction.set(historyRefAlunos, historyPayload);

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
  const planRef = doc(db, `users/${userId}/active_plans/${planId}`);
  const planRefAlunos = doc(db, `alunos/${userId}/active_plans/${planId}`);
  const isLiliane = userId === 'fixed-liliane';
  const defaultTarget = isLiliane ? 32 : 18;
  const defaultPhase = isLiliane ? "Treino A e Treino B (32 Sessões)" : "Fase 1: Retorno & Adaptação (18 Sessões)";

  let unsubAlunos: Unsubscribe | null = null;

  const unsubUsers = onSnapshot(planRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onUpdate({
        id: docSnap.id,
        phaseName: data.phaseName || defaultPhase,
        targetSets: isLiliane ? 32 : (data.targetSets || defaultTarget),
        progress: {
          A: data.progress?.A ?? 0,
          B: data.progress?.B ?? 0,
          C: data.progress?.C ?? 0
        },
        updatedAt: data.updatedAt
      });
    } else {
      if (!unsubAlunos) {
        unsubAlunos = onSnapshot(planRefAlunos, (altSnap) => {
          if (altSnap.exists()) {
            const data = altSnap.data();
            onUpdate({
              id: altSnap.id,
              phaseName: data.phaseName || defaultPhase,
              targetSets: isLiliane ? 32 : (data.targetSets || defaultTarget),
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
              phaseName: defaultPhase,
              targetSets: defaultTarget,
              progress: { A: 0, B: 0, C: 0 }
            });
          }
        });
      }
    }
  }, (err) => {
    console.warn("Active plan snapshot fallback:", err);
    onUpdate({
      id: 'current',
      phaseName: defaultPhase,
      targetSets: defaultTarget,
      progress: { A: 0, B: 0, C: 0 }
    });
  });

  return () => {
    unsubUsers();
    if (unsubAlunos) unsubAlunos();
  };
}

export function subscribeToWorkoutHistory(
  userId: string,
  onUpdate: (history: WorkoutHistoryRecord[]) => void,
  limitCount: number = 50
): Unsubscribe {
  const historyRef = collection(db, `users/${userId}/workout_history`);
  const historyRefAlunos = collection(db, `alunos/${userId}/workout_history`);
  const q = query(historyRef, orderBy('dateCompleted', 'desc'), limit(limitCount));
  const qAlunos = query(historyRefAlunos, orderBy('dateCompleted', 'desc'), limit(limitCount));

  let recordsUsers: WorkoutHistoryRecord[] = [];
  let recordsAlunos: WorkoutHistoryRecord[] = [];

  const mergeAndNotify = () => {
    const map = new Map<string, WorkoutHistoryRecord>();
    [...recordsUsers, ...recordsAlunos].forEach(rec => {
      const key = rec.id || `${rec.workoutType}-${rec.timestamp}`;
      if (!map.has(key)) {
        map.set(key, rec);
      }
    });
    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      const timeA = a.dateCompleted?.seconds ? a.dateCompleted.seconds * 1000 : (a.timestamp || 0);
      const timeB = b.dateCompleted?.seconds ? b.dateCompleted.seconds * 1000 : (b.timestamp || 0);
      return timeB - timeA;
    });
    onUpdate(merged);
  };

  const unsubUsers = onSnapshot(q, (snapshot) => {
    recordsUsers = [];
    snapshot.forEach(docSnap => {
      recordsUsers.push({
        id: docSnap.id,
        ...docSnap.data()
      } as WorkoutHistoryRecord);
    });
    mergeAndNotify();
  }, (err) => {
    console.warn("Users workout history listener error:", err);
  });

  const unsubAlunos = onSnapshot(qAlunos, (snapshot) => {
    recordsAlunos = [];
    snapshot.forEach(docSnap => {
      recordsAlunos.push({
        id: docSnap.id,
        ...docSnap.data()
      } as WorkoutHistoryRecord);
    });
    mergeAndNotify();
  }, (err) => {
    console.warn("Alunos workout history listener error:", err);
  });

  return () => {
    unsubUsers();
    unsubAlunos();
  };
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
