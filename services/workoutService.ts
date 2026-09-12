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
 * 1. Salva o histórico permanentemente em users/{userId}/workout_history
 * 2. Atualiza a contagem atômica em users/{userId}/active_plans/{planId} usando runTransaction
 * 3. Notificações automáticas nas marcas de carga (6, 12) e término (targetSets)
 */
export async function finalizarTreino(
  userId: string,
  planId: string = 'current',
  tipoTreino: 'A' | 'B' | 'C',
  dadosDoTreino: Partial<WorkoutHistoryRecord> = {}
): Promise<FinalizarTreinoResult> {
  try {
    const activePlanId = planId || 'current';

    // 1. Salva o histórico permanentemente (Nunca sai dos registros)
    const historyRef = collection(db, `users/${userId}/workout_history`);
    const historyDoc = await addDoc(historyRef, {
      planId: activePlanId,
      workoutType: tipoTreino,
      dateCompleted: serverTimestamp(),
      volumeTotal: dadosDoTreino.volumeTotal || 0.0,
      workoutName: dadosDoTreino.workoutName || `Treino ${tipoTreino}`,
      duration: dadosDoTreino.duration || '00:00',
      duracaoMinutos: dadosDoTreino.duracaoMinutos || 0,
      calorias: dadosDoTreino.calorias || 0,
      exercises: dadosDoTreino.exercises || [],
      photoUrl: dadosDoTreino.photoUrl || null,
      timestamp: Date.now()
    });

    // 2. Atualiza a contagem usando uma TRANSAÇÃO (Garante que não vai perder dados)
    const planRef = doc(db, `users/${userId}/active_plans/${activePlanId}`);
    let notificacaoNecessaria: string | null = null;
    let novaContagem = 1;
    let targetSets = 18;

    await runTransaction(db, async (transaction) => {
      const planDoc = await transaction.get(planRef);
      
      if (!planDoc.exists()) {
        targetSets = 18;
        novaContagem = 1;
        const initialProgress = {
          A: tipoTreino === 'A' ? 1 : 0,
          B: tipoTreino === 'B' ? 1 : 0,
          C: tipoTreino === 'C' ? 1 : 0
        };
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

      // 3. Lógica de Notificação (Alerta de Ajuste de Carga e Transição)
      if (novaContagem === 6 || novaContagem === 12) {
        notificacaoNecessaria = `Atenção: Você concluiu o treino ${tipoTreino} pela ${novaContagem}ª vez. Hora de ajustar as cargas!`;
      } else if (novaContagem === targetSets) {
        notificacaoNecessaria = `Parabéns! Você concluiu os ${targetSets} treinos do ${tipoTreino}. Última sessão antes de mudar a periodização!`;
      }
    });

    // 4. Sincroniza em segundo plano o documento do aluno em alunos/{userId}
    try {
      const alunoRef = doc(db, 'alunos', userId);
      const alunoSnap = await getDoc(alunoRef);
      if (alunoSnap.exists()) {
        const pKey = '3 x 13';
        const aData = alunoSnap.data();
        const prevProg = aData.periodizationProgress || {};
        const subProg = { ...(prevProg[pKey] || { A: 0, B: 0, C: 0 }) };
        subProg[tipoTreino] = novaContagem;

        const updatesToAluno: any = {
          [`faseAjuste${tipoTreino}`]: novaContagem,
          [`totalGlobal${tipoTreino}`]: (aData[`totalGlobal${tipoTreino}`] || 0) + 1,
          [`activePlan.progress.${tipoTreino}`]: novaContagem,
          [`activePlan.targetSets`]: targetSets,
          [`periodizationProgress.${pKey}`]: subProg,
          lastUpdateTimestamp: serverTimestamp()
        };
        await setDoc(alunoRef, updatesToAluno, { merge: true });
      }
    } catch (syncErr) {
      console.warn("Aviso ao sincronizar perfil do aluno em alunos/:", syncErr);
    }

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

/**
 * Escuta em tempo real (onSnapshot) o plano ativo do Firestore
 * Garantindo que o Firebase seja a única fonte da verdade
 */
export function subscribeToActivePlan(
  userId: string,
  onUpdate: (plan: ActivePlan) => void,
  planId: string = 'current'
): Unsubscribe {
  const planRef = doc(db, `users/${userId}/active_plans/${planId || 'current'}`);
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
      // Fallback padrão se ainda não existir
      onUpdate({
        id: 'current',
        phaseName: "Mesociclo 16 - Hipertrofia",
        targetSets: 18,
        progress: { A: 1, B: 2, C: 0 }
      });
    }
  }, (error) => {
    console.warn("Erro ao ouvir active_plans:", error);
  });
}

/**
 * Escuta em tempo real o histórico eterno de treinos de users/{userId}/workout_history
 */
export function subscribeToWorkoutHistory(
  userId: string,
  onUpdate: (history: WorkoutHistoryRecord[]) => void,
  limitCount: number = 50
): Unsubscribe {
  const historyRef = collection(db, `users/${userId}/workout_history`);
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
  }, (error) => {
    console.warn("Erro ao ouvir workout_history:", error);
  });
}
