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
  notificacaoNecessaria?: string | null;
  novaContagem?: number;
  targetSets?: number;
  tipoTreino?: 'A' | 'B' | 'C';
  error?: any;
}

/**
 * Serviço dedicado para finalizar treino no cliente via Transação Atômica do Firestore
 */
export const finalizarTreinoNoCliente = async (
  userId: string, 
  workoutType: 'A' | 'B' | 'C', 
  workoutData: any
): Promise<FinalizarTreinoResult> => {
  try {
    // 1. Salva o histórico permanentemente com a data do servidor
    const historyRef = collection(db, `users/${userId}/workout_history`);
    const historyRefAlunos = collection(db, `alunos/${userId}/workout_history`);
    
    const historyPayload = {
      ...workoutData,
      workoutType,
      dateCompleted: serverTimestamp(), // Data correta do servidor
      createdAt: serverTimestamp()
    };

    await addDoc(historyRef, historyPayload).catch(() => {});
    await addDoc(historyRefAlunos, historyPayload).catch(() => {});

    // 2. Atualiza a contagem atômica no plano ativo e nas coleções relacionadas
    const planRef = doc(db, `users/${userId}/active_plans`, 'current');
    const planRefAlunos = doc(db, `alunos/${userId}/active_plans`, 'current');
    const statsRef = doc(db, `user_stats/${userId}`);
    const alunoRef = doc(db, 'alunos', userId);
    const userProgressRef = doc(db, 'userProgress', userId);

    let novaContagem = 1;
    let targetSets = userId === 'fixed-liliane' ? 32 : 18;
    let notificacaoNecessaria: string | null = null;
    
    await runTransaction(db, async (transaction) => {
      let planDoc = await transaction.get(planRef);
      if (!planDoc.exists()) {
        const altDoc = await transaction.get(planRefAlunos);
        if (altDoc.exists()) {
          planDoc = altDoc;
        }
      }
      
      if (!planDoc.exists()) {
        // Se não existe, cria o plano com o primeiro treino
        novaContagem = 1;
        const initialPlan = {
          phaseName: userId === 'fixed-liliane' ? 'Treino A e Treino B (32 Sessões)' : 'Fase 1: Retorno & Adaptação (18 Sessões)',
          targetSets,
          progress: { A: workoutType === 'A' ? 1 : 0, B: workoutType === 'B' ? 1 : 0, C: workoutType === 'C' ? 1 : 0 },
          updatedAt: serverTimestamp()
        };
        transaction.set(planRef, initialPlan);
        transaction.set(planRefAlunos, initialPlan);
      } else {
        const planData = planDoc.data() || {};
        targetSets = userId === 'fixed-liliane' ? 32 : (planData.targetSets || 18);
        const currentProgress = planData.progress || { A: 0, B: 0, C: 0 };
        novaContagem = (currentProgress[workoutType] || 0) + 1;

        const updatedProgress = {
          ...currentProgress,
          [workoutType]: novaContagem
        };

        transaction.set(planRef, {
          progress: updatedProgress,
          updatedAt: serverTimestamp()
        }, { merge: true });

        transaction.set(planRefAlunos, {
          progress: updatedProgress,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Atualiza userProgress
      const upDoc = await transaction.get(userProgressRef);
      const totalGlobal = upDoc.exists() ? ((upDoc.data().totalWorkouts || 0) + 1) : novaContagem;
      transaction.set(userProgressRef, {
        totalWorkouts: totalGlobal,
        lastWorkoutAt: serverTimestamp(),
        lastWorkoutName: workoutData.workoutName || `Treino ${workoutType}`
      }, { merge: true });

      // Atualiza user_stats
      const statsDoc = await transaction.get(statsRef);
      const currentStats = statsDoc.exists() ? (statsDoc.data().totalWorkouts || 0) : 0;
      transaction.set(statsRef, {
        totalWorkouts: currentStats + 1,
        lastWorkoutAt: serverTimestamp()
      }, { merge: true });

      // Atualiza documento aluno se existir
      const aDoc = await transaction.get(alunoRef);
      if (aDoc.exists()) {
        const aData = aDoc.data();
        const pKey = '3 x 13';
        const prevProg = aData.periodizationProgress || {};
        const subProg = { ...(prevProg[pKey] || { A: 0, B: 0, C: 0 }) };
        subProg[workoutType] = novaContagem;

        // Calcula novo total global de treinos para este aluno
        const currentGlobalTotal = (aData.trainingProgress?.completedCount || 0) + 1;

        transaction.set(alunoRef, {
          [`faseAjuste${workoutType}`]: novaContagem,
          [`totalGlobal${workoutType}`]: (aData[`totalGlobal${workoutType}`] || 0) + 1,
          trainingProgress: {
            ...(aData.trainingProgress || { targetCount: 36 }),
            completedCount: currentGlobalTotal
          },
          analytics: {
            ...(aData.analytics || {}),
            sessionsCompleted: currentGlobalTotal,
            lastSessionDate: new Date().toLocaleDateString('pt-BR')
          },
          activePlan: {
            ...(aData.activePlan || {}),
            targetSets,
            progress: {
              ...(aData.activePlan?.progress || {}),
              [workoutType]: novaContagem
            }
          },
          periodizationProgress: {
            ...prevProg,
            [pKey]: subProg
          },
          lastUpdateTimestamp: serverTimestamp()
        }, { merge: true });
      }

      if (novaContagem === 6 || novaContagem === 12) {
        notificacaoNecessaria = `Atenção: Você concluiu o treino ${workoutType} pela ${novaContagem}ª vez. Hora de ajustar as cargas!`;
      } else if (novaContagem === targetSets) {
        notificacaoNecessaria = `Parabéns! Você concluiu os ${targetSets} treinos do ${workoutType}. Última sessão antes de mudar a periodização!`;
      }
    });

    return { 
      success: true, 
      message: 'Treino salvo com sucesso!',
      novaContagem,
      targetSets,
      tipoTreino: workoutType,
      notificacaoNecessaria
    };
  } catch (error) {
    console.error("Erro ao finalizar treino:", error);
    return { success: false, message: 'Erro ao salvar treino.', error };
  }
};

/**
 * Função unificada para salvar treino (compatível com finalizarTreinoNoCliente)
 */
export async function finalizarTreino(
  userId: string,
  planId: string = 'current',
  tipoTreino: 'A' | 'B' | 'C',
  dadosDoTreino: Partial<WorkoutHistoryRecord> = {}
): Promise<FinalizarTreinoResult> {
  return finalizarTreinoNoCliente(userId, tipoTreino, {
    planId,
    ...dadosDoTreino
  });
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
