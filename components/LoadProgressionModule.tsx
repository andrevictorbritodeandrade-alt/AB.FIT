
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Calendar, Weight, Repeat, Layers } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SessionData {
  date: string;
  timestamp: number;
  load: number;
  prevLoad: number;
  reps: number;
  sets: number;
  volume: number;
  variation: number;
}

interface ExerciseAnalysis {
  name: string;
  data: SessionData[];
  trend: number; // Slope or average variation
  insight: string;
  lastSession: SessionData;
}

interface LoadProgressionModuleProps {
  history: any[];
  prescribedExercises?: string[];
}

export function LoadProgressionModule({ history, prescribedExercises }: LoadProgressionModuleProps) {
  const analysis = useMemo(() => {
    const exerciseMap: Record<string, SessionData[]> = {};

    // Helper functions (extracted from your current logic)
    const parseValue = (val: any): number => {
      if (!val) return 0;
      const match = val.toString().match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    };

    const parseLoad = (loadStr: any): number => {
      if (!loadStr) return 0;
      const cleanLoad = parseFloat(loadStr.toString().replace(',', '.'));
      return isNaN(cleanLoad) ? 0 : cleanLoad;
    };

    // Sort history by date ascending to calculate progression
    const sortedHistory = [...history].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sortedHistory.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const name = ex.name || ex.exercicio;
        if (!name) return;
        
        if (!exerciseMap[name]) exerciseMap[name] = [];
        
        const load = parseLoad(ex.load || ex.carga);
        const sets = parseValue(ex.sets);
        const reps = parseValue(ex.reps);
        const volume = load * sets * reps;
        
        const lastSession = exerciseMap[name][exerciseMap[name].length - 1];
        let variation = 0;
        if (lastSession && lastSession.load > 0) {
          variation = ((load - lastSession.load) / lastSession.load) * 100;
        }

        exerciseMap[name].push({
          date: session.date,
          timestamp: session.timestamp,
          load,
          prevLoad: lastSession ? lastSession.load : 0,
          reps,
          sets,
          volume,
          variation
        });
      });
    });

    const results: ExerciseAnalysis[] = Object.entries(exerciseMap)
      .filter(([name]) => {
        // If we have prescribed exercises, only show those to avoid showing old/deleted data
        if (prescribedExercises && prescribedExercises.length > 0) {
          return prescribedExercises.some(p => p.toLowerCase().trim() === name.toLowerCase().trim());
        }
        return true;
      })
      .map(([name, data]) => {
      const lastSession = data[data.length - 1];
      const prevSession = data[data.length - 2];
      
      // Calculate simple trend (average load variation over last 3 sessions)
      const recentData = data.slice(-3);
      const avgVar = recentData.reduce((acc, curr) => acc + curr.variation, 0) / (recentData.length || 1);

      // Generate Insight
      let insight = "";
      if (data.length < 2) {
        insight = "Dados insuficientes para análise de tendência. Continue registrando seus treinos.";
      } else if (lastSession.load > (prevSession?.load || 0)) {
        insight = `No exercício ${name}, houve um aumento de ${lastSession.variation.toFixed(1)}% na carga em ${lastSession.date}. Isso indica uma adaptação neural positiva e progressão de carga eficiente.`;
      } else if (lastSession.load === prevSession?.load && lastSession.reps > prevSession.reps) {
        insight = `Carga mantida, mas volume de repetições aumentado (+${lastSession.reps - prevSession.reps} reps). Progressão de volume detectada.`;
      } else if (recentData.every(d => d.load === recentData[0].load) && recentData.length >= 3) {
        insight = `Estagnação detectada no ${name} (mesma carga por 3 sessões). Sugiro alterar o estímulo, aumentar o volume de séries ou reduzir o tempo de descanso para quebrar o platô.`;
      } else {
        insight = `Estabilidade na carga detectada. Foque na qualidade da execução técnica antes do próximo incremento.`;
      }

      return {
        name,
        data,
        trend: avgVar,
        insight,
        lastSession
      };
    }).sort((a, b) => b.lastSession.timestamp - a.lastSession.timestamp); // Show most recent exercises first

    return results;
  }, [history]);

  if (analysis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <TrendingUp size={48} className="mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em]">Aguardando dados de progressão...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {analysis.map((ex, idx) => (
        <div key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
          {/* Header do Exercício */}
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-lg font-black italic uppercase text-white tracking-tighter leading-none">
                {ex.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                 {ex.trend > 0 ? (
                   <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase italic">
                     <TrendingUp size={10} /> Tendência de Alta
                   </span>
                 ) : ex.trend < 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase italic">
                      <TrendingDown size={10} /> Tendência de Baixa
                    </span>
                 ) : (
                    <span className="flex items-center gap-1 text-[10px] font-black text-zinc-500 uppercase italic">
                      <Minus size={10} /> Estável
                    </span>
                 )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Última Carga</p>
              <p className="text-xl font-black text-white italic">{ex.lastSession.load}kg</p>
            </div>
          </div>

          {/* Gráfico de Linha (Estilo Home Broker) */}
          <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-6 shadow-2xl overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="h-64 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={ex.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        fontFamily="monospace"
                        dy={10}
                      />
                      <YAxis 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        fontFamily="monospace"
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="load" 
                        stroke="#dc2626" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#000', stroke: '#dc2626', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#fff', stroke: '#dc2626', strokeWidth: 2 }}
                        animationDuration={1500}
                      />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Insight Master Class */}
          <div className="bg-zinc-900/60 p-5 rounded-3xl border-l-4 border-indigo-600 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
                <Info size={40} className="text-indigo-400" />
             </div>
             <div className="flex items-center gap-2 mb-2">
                <Layers size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic">Insight do Analista Sênior</span>
             </div>
             <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">
                "{ex.insight}"
             </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SessionData;
    const isPositive = data.variation > 0;
    
    return (
      <div className="bg-black/90 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl shadow-2xl space-y-3 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-red-600" />
            <span className="text-[10px] font-black text-white">{data.date}</span>
          </div>
          {data.variation !== 0 && (
            <span className={`text-[9px] font-black italic ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{data.variation.toFixed(1)}%
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Carga (Atual vs Ant)</p>
            <p className="text-xs font-black text-white flex items-center gap-1">
              <Weight size={10} className="text-red-600" /> {data.load}kg <span className="text-[9px] text-zinc-600">vs {data.prevLoad}kg</span>
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Esforço</p>
            <p className="text-xs font-black text-white flex items-center gap-1 justify-end">
              <Repeat size={10} className="text-red-600" /> {data.sets}x{data.reps}
            </p>
          </div>
          <div className="col-span-2 pt-2 border-t border-zinc-900 mt-1">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Volume Total da Sessão</p>
            <p className="text-sm font-black text-indigo-500 italic tracking-tight">{data.volume.toLocaleString()} kg/volume</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
