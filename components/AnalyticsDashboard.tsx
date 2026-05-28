
import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, Activity, BarChart3, Calendar, Menu, Layers, Filter } from 'lucide-react';
import { Card, AppFooter, HeaderTitle, BackgroundCarousel, FITNESS_IMAGES } from './Layout';
import { Student, WorkoutHistoryEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { EXERCISE_DATABASE } from '../constants/exercises';
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType } from '../services/firebase';

interface AnalyticsProps {
  student: Student;
  onBack: () => void;
  onToggleMenu?: () => void;
}

export function AnalyticsDashboard({ student, onBack, onToggleMenu }: AnalyticsProps) {
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Treino A' | 'Treino B' | 'Treino C'>('all');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const logsRef = collection(db, 'alunos', student.id, 'logsTreino');
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, `alunos/${student.id}/logsTreino`);
      } catch (e) {
        console.warn("Silent logsTreino fetch error in Analytics:", e);
      }
    });
    return () => unsubscribe();
  }, [student.id]);

  // Garantia de dados iniciais para evitar crash
  const rawHistory = useMemo(() => {
    // Combine logs and workoutHistory
    const combined: any[] = [...(student.workoutHistory || [])];
    
    logs.forEach(log => {
        const timestamp = log.dataHora || log.timestamp || Date.now();
        // Check if already in history by timestamp (within 1 min)
        const exists = combined.some(h => Math.abs((h.timestamp || 0) - timestamp) < 60000);
        if (!exists) {
            combined.push({
                id: log.id,
                workoutId: log.treinoId,
                name: log.nome || 'Treino',
                timestamp,
                date: new Date(timestamp).toLocaleDateString('pt-BR'),
                duration: log.duracaoMinutos ? `${log.duracaoMinutos}:00` : '00:00',
                type: 'STRENGTH',
                exercises: log.exercises || []
            });
        }
    });

    return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [student.workoutHistory, logs]);

  const history = useMemo(() => {
    let filtered = [...rawHistory];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(h => h.name.toUpperCase().includes(typeFilter.toUpperCase()));
    }

    // Filter by period
    if (periodFilter !== 'all') {
      const now = Date.now();
      const days = periodFilter === '7d' ? 7 : 30;
      const ms = days * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(h => (now - h.timestamp) <= ms);
    }

    return filtered;
  }, [rawHistory, typeFilter, periodFilter]);

  const analytics = useMemo(() => {
    if (periodFilter === 'all' && typeFilter === 'all') return student.analytics || { exercises: {}, sessionsCompleted: 0, streakDays: 0 };
    
    // Re-calculate basic counts if filtered
    const exercises: Record<string, any> = {};
    history.forEach(h => {
        if (h.exercises) {
            h.exercises.forEach((ex: any) => {
                if (!exercises[ex.name]) exercises[ex.name] = { completed: 0, skipped: 0 };
                exercises[ex.name].completed += 1;
            });
        }
    });

    return {
        exercises,
        sessionsCompleted: history.length,
        streakDays: (student.analytics?.streakDays || 0) // streak is harder to recalculate exactly, keep original for now
    };
  }, [history, periodFilter, typeFilter, student.analytics]);

  // 1. Preparação dos dados de Exercícios (Gráfico de Barras)
  const exerciseData = useMemo(() => {
    const entries = Object.entries(analytics.exercises || {});
    if (entries.length === 0) return [];

    return entries.map(([name, stats]: [string, any]) => ({
      name: name.length > 12 ? name.substring(0, 10) + '..' : name,
      fullName: name,
      completed: stats.completed || 0,
      skipped: stats.skipped || 0,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 6);
  }, [analytics.exercises]);

  // 2. Preparação da Frequência (Gráfico de Linha)
  const frequencyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('pt-BR'); // Formato "DD/MM/YYYY"
    });

    return last7Days.map(dateStr => {
      const count = history.filter(h => h.date === dateStr).length;
      return {
        date: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], // Apenas "DD/MM" para o eixo X
        count: count
      };
    });
  }, [history]);

  // 3. Análise de Volume por Grupo Muscular (Prescrito vs Alvo)
  const volumeAnalysis = useMemo(() => {
    const prescribedVolume: Record<string, number> = {};
    const workouts = student.workouts || [];
    const targetVolume = student.periodization?.targetVolume || {};

    // Helper para extrair número de séries
    const parseSets = (setsStr: string | undefined): number => {
      if (!setsStr) return 0;
      const match = setsStr.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    };

    // Mapeamento reverso do banco de exercícios: Nome -> Grupo
    const exerciseToGroup: Record<string, string> = {};
    Object.entries(EXERCISE_DATABASE).forEach(([group, exercises]) => {
      exercises.forEach(ex => {
        exerciseToGroup[ex.toLowerCase()] = group;
      });
    });

    // Contabiliza volume prescrito
    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        let group = exerciseToGroup[ex.name.toLowerCase()];
        
        // Fallback: busca por substring se não houver match exato
        if (!group) {
          const lowerName = ex.name.toLowerCase();
          for (const [dbEx, dbGroup] of Object.entries(exerciseToGroup)) {
            if (lowerName.includes(dbEx) || dbEx.includes(lowerName)) {
              group = dbGroup;
              break;
            }
          }
        }

        if (group) {
          const sets = parseSets(ex.sets);
          prescribedVolume[group] = (prescribedVolume[group] || 0) + sets;
        }
      });
    });

    // Grupos relevantes para exibição (os que têm alvo ou prescrição)
    const allGroups = Array.from(new Set([...Object.keys(targetVolume), ...Object.keys(prescribedVolume)]));
    
    return allGroups.map(group => {
      const prescribed = prescribedVolume[group] || 0;
      const target = targetVolume[group] || 0;
      return {
        group: group.length > 15 ? group.substring(0, 13) + '..' : group,
        fullGroup: group,
        prescribed,
        target,
        percent: target ? Math.round((prescribed / target) * 100) : 0
      };
    }).sort((a, b) => b.prescribed - a.prescribed);
  }, [student.workouts, student.periodization]);

  const totalPrescribed = useMemo(() => 
    volumeAnalysis.reduce((acc, curr) => acc + curr.prescribed, 0)
  , [volumeAnalysis]);

  const totalTarget = useMemo(() => 
    volumeAnalysis.reduce((acc, curr) => acc + curr.target, 0)
  , [volumeAnalysis]);

  // 4. Evolução de Cargas e Novos Métricos
  const analyticsCalculations = useMemo(() => {
    const muscleGroupsData: Record<string, { totalSets: number; totalVolumeKg: number }> = {};
    const loadEvolution: Record<string, { date: string; load: number }[]> = {};
    let totalVolumeNewton = 0;

    // Helper para extrair número de séries e carga
    const parseSets = (setsStr: string | undefined): number => {
      if (!setsStr) return 0;
      const match = setsStr.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    };
    const parseLoad = (loadStr: string | undefined): number => {
      if (!loadStr) return 0;
      const cleanLoad = parseFloat(loadStr.toString().replace(',', '.'));
      return isNaN(cleanLoad) ? 0 : cleanLoad;
    };

    // Mapeamento reverso do banco de exercícios: Nome -> Grupo
    const exerciseToGroup: Record<string, string> = {};
    Object.entries(EXERCISE_DATABASE).forEach(([group, exercises]) => {
      exercises.forEach(ex => {
        exerciseToGroup[ex.toLowerCase()] = group;
      });
    });

    // Analisa todo o histórico
    [...history].sort((a,b) => a.timestamp - b.timestamp).forEach(session => {
        session.exercises?.forEach((ex: any) => {
            const group = exerciseToGroup[ex.name.toLowerCase()] || 'Outros';
            const sets = parseSets(ex.sets);
            const load = parseLoad(ex.load);
            const reps = parseSets(ex.reps);

            // Volume por grupo
            if (!muscleGroupsData[group]) muscleGroupsData[group] = { totalSets: 0, totalVolumeKg: 0 };
            muscleGroupsData[group].totalSets += sets;
            muscleGroupsData[group].totalVolumeKg += (sets * reps * load);

            // Evolução de Carga
            if (load > 0) {
               if (!loadEvolution[ex.name]) loadEvolution[ex.name] = [];
               loadEvolution[ex.name].push({ date: session.date, load });
            }

            // Volume Total (estimativa simples: rep * load * sets)
            totalVolumeNewton += (sets * reps * load * 9.8); // Ajuste para Newtons força
        });
    });

    return { muscleGroupsData, loadEvolution, totalVolumeNewton };
  }, [history]);

  // Componente de Estado Vazio
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-10 opacity-20">
      <Activity size={40} className="mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
    </div>
  );

  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-white overflow-y-auto h-screen custom-scrollbar text-left bg-transparent relative">
      <header className="flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
           {onToggleMenu && (
             <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
               <Menu size={20}/>
             </button>
           )}
           <button 
             onClick={onBack} 
             className="p-2 bg-zinc-900 rounded-full shadow-lg text-white hover:bg-red-600 transition-colors"
           >
             <ArrowLeft size={20}/>
           </button>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Análise de Dados" />
        </h2>
      </header>

      {/* FILTROS INTEGRADOS */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-red-500" />
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Período de Análise</span>
          </div>
          <div className="flex gap-2">
            {[
              { id: '7d', label: '7 DIAS' },
              { id: '30d', label: '30 DIAS' },
              { id: 'all', label: 'TUDO' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={`flex-1 py-3 text-[10px] font-black rounded-2xl border transition-all ${
                  periodFilter === p.id 
                    ? 'bg-red-600 border-red-600 shadow-lg shadow-red-900/30' 
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-red-500" />
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Filtro de Treino</span>
          </div>
          <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'TODOS' },
              { id: 'Treino A', label: 'T. A' },
              { id: 'Treino B', label: 'T. B' },
              { id: 'Treino C', label: 'T. C' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-6 py-2.5 text-[10px] font-black rounded-xl transition-all whitespace-nowrap ${
                  typeFilter === t.id 
                    ? 'bg-white text-black' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 gap-3 mb-8">
         <Card className="p-4 bg-zinc-900/50 border-zinc-800 text-center col-span-2">
            <h3 className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Volume Total Estimado (Força)</h3>
            <p className="text-xl font-black text-red-600 italic tracking-tighter">
              {(analyticsCalculations.totalVolumeNewton / 1000).toFixed(1)} kN
            </p>
         </Card>
         <Card className="p-4 bg-zinc-900/50 border-zinc-800 text-center">
            <h3 className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-2 italic">Ciclo Atual</h3>
            <p className="text-2xl font-black text-red-600 italic tracking-tighter">
              {student.trainingProgress?.completedCount || 0}<span className="text-zinc-600 text-xs mx-1">/</span>{student.trainingProgress?.targetCount || 60}
            </p>
         </Card>
         <Card className="p-4 bg-zinc-900/50 border-zinc-800 text-center">
            <h3 className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-2 italic">Histórico Total</h3>
            <p className="text-2xl font-black text-white italic tracking-tighter">{history.length}</p>
         </Card>
      </div>

      <div className="space-y-10">
         {/* ANÁLISE DE VOLUME (NOVO) */}
         <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-3 italic">
                 <Layers size={14} className="text-red-600"/> Volume Prescrito vs Alvo
               </h3>
               {totalTarget > 0 && (
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                   Total: {totalPrescribed}/{totalTarget}
                 </span>
               )}
            </div>
            <div className="bg-zinc-900/30 rounded-[2.5rem] border border-white/5 p-6 shadow-inner space-y-6">
               {volumeAnalysis.length > 0 ? (
                 <>
                   <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeAnalysis}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                           <XAxis 
                            dataKey="group" 
                            stroke="#444" 
                            fontSize={8} 
                            tickLine={false} 
                            axisLine={false}
                            fontFamily="monospace"
                           />
                           <YAxis hide />
                           <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                           />
                           <Bar dataKey="prescribed" name="Prescrito" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={15} />
                           <Bar dataKey="target" name="Alvo" fill="#444" radius={[4, 4, 0, 0]} barSize={15} />
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-3">
                      {volumeAnalysis.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
                           <div>
                              <p className="text-[10px] font-black uppercase text-white italic">{item.fullGroup}</p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                                {item.prescribed} / {item.target} séries
                              </p>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="text-right">
                                 <p className={`text-[11px] font-black italic ${item.percent >= 100 ? 'text-emerald-500' : item.percent >= 80 ? 'text-yellow-500' : 'text-red-600'}`}>
                                    {item.percent}%
                                 </p>
                              </div>
                              <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full ${item.percent >= 100 ? 'bg-emerald-500' : item.percent >= 80 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                                 ></div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 </>
               ) : <EmptyState message="Defina o volume alvo na periodização" />}
            </div>
         </div>

         {/* GRÁFICO DE FREQUÊNCIA */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <Calendar size={14} className="text-red-600"/> Consistência Semanal
            </h3>
            <div className="h-56 w-full bg-zinc-900/30 rounded-[2.5rem] border border-white/5 p-6 shadow-inner">
               {history.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                       <XAxis 
                        dataKey="date" 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                        fontFamily="monospace"
                       />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#dc2626' }}
                       />
                       <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#dc2626" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#000' }} 
                        activeDot={{ r: 6, fill: '#fff' }} 
                       />
                    </LineChart>
                 </ResponsiveContainer>
               ) : <EmptyState message="Sem dados de frequência" />}
            </div>
         </div>

          {/* EVOLUÇÃO DE CARGAS */}
          <div className="space-y-4">
             <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
               <TrendingUp size={14} className="text-emerald-500"/> Evolução de Carga (Kg)
             </h3>
             <div className="space-y-4">
                {Object.keys(analyticsCalculations.loadEvolution).length > 0 ? (
                  Object.entries(analyticsCalculations.loadEvolution).slice(0, 4).map(([exName, loads], idx) => (
                    <div key={idx} className="bg-zinc-900/30 rounded-[2rem] border border-white/5 p-6 shadow-inner">
                       <p className="text-[10px] font-black uppercase text-white italic mb-4">{exName}</p>
                       <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={loads}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <Tooltip 
                                   contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                                   itemStyle={{ color: '#10b981' }}
                                />
                                <Line 
                                   type="monotone" 
                                   dataKey="load" 
                                   stroke="#10b981" 
                                   strokeWidth={3} 
                                   dot={{ r: 3, fill: '#10b981' }} 
                                />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                  ))
                ) : <EmptyState message="Aguardando registros com carga" />}
             </div>
          </div>

         {/* GRÁFICO DE EXERCÍCIOS */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <BarChart3 size={14} className="text-red-600"/> Engajamento por Exercício
            </h3>
            <div className="h-64 w-full bg-zinc-900/30 rounded-[2.5rem] border border-white/5 p-6 shadow-inner">
               {exerciseData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={exerciseData}>
                       <XAxis type="number" hide />
                       <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#666" 
                        fontSize={9} 
                        width={70} 
                        tickLine={false} 
                        axisLine={false}
                        fontFamily="monospace"
                       />
                       <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                       />
                       <Bar dataKey="completed" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                 </ResponsiveContainer>
               ) : <EmptyState message="Aguardando registros de treino" />}
            </div>
         </div>

         {/* ALERTAS DE SKIPS */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <AlertTriangle size={14} className="text-amber-500"/> Fatores de Evasão
            </h3>
            <div className="bg-zinc-900/50 rounded-[2rem] p-6 border border-white/5">
               {exerciseData.filter(e => e.skipped > 0).length > 0 ? (
                 <div className="space-y-4">
                   {exerciseData.filter(e => e.skipped > 0).map((ex, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-black uppercase truncate max-w-[120px]">{ex.fullName}</span>
                        <div className="flex items-center gap-3">
                           <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500" 
                                style={{ width: `${Math.min((ex.skipped / ((ex.completed + ex.skipped) || 1)) * 100, 100)}%` }}
                              ></div>
                           </div>
                           <span className="text-[9px] font-black text-amber-500 uppercase">{ex.skipped} Skips</span>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex items-center justify-center gap-3 py-4 opacity-40">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Aderência de 100% detectada</p>
                 </div>
               )}
            </div>
         </div>

         {/* HISTÓRICO DE TREINOS */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <Activity size={14} className="text-red-600"/> Histórico de Treinos
            </h3>
            <div className="space-y-3">
               {history.length > 0 ? (
                 history.slice().sort((a, b) => b.timestamp - a.timestamp).map((entry, idx) => (
                   <div key={entry.id || idx} className="bg-zinc-900/50 rounded-[2rem] p-5 border border-white/5 flex items-center justify-between">
                      <div>
                         <p className="text-sm font-black italic uppercase text-white">{entry.name}</p>
                         <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{entry.date} • {entry.duration}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center text-red-500">
                         <CheckCircle2 size={18} />
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="bg-zinc-900/50 rounded-[2rem] p-6 border border-white/5">
                    <EmptyState message="Nenhum treino registrado" />
                 </div>
               )}
            </div>
         </div>
      </div>
      <AppFooter />
    </div>
  );
}

