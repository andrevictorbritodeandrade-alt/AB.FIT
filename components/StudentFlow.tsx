
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Dumbbell, Activity, Play,
  Loader2, Clock, Target, Award, ShieldCheck, Brain,
  Camera, CheckCircle2, X, Trash2, FastForward, Check,
  Trophy, AlertCircle, Info, ChevronDown, ChevronUp,
  Zap, Scan, Shield, Maximize2, Calendar, RefreshCw, Menu, Sparkles, AlertTriangle, LayoutGrid, TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LabelList 
} from 'recharts';
import { Card, AppFooter, HeaderTitle, BackgroundCarousel, FITNESS_IMAGES } from './Layout';
import GeraAi from './GeraAi';
import { Student, WorkoutHistoryEntry, Workout, AnalyticsData, Exercise } from '../types';
import { db, handleFirestoreError, OperationType, doc, getDoc, collection, query, onSnapshot, setDoc } from '../services/firebase';

const formatReps = (reps: any): string | null => {
  if (!reps) return null;
  const strReps = String(reps);
  const rangeMatch = strReps.match(/(\d+)\s*(?:-|a|to)\s*(\d+)/i);
  if (rangeMatch) return rangeMatch[2];
  const numberMatch = strReps.match(/(\d+)/);
  return numberMatch ? numberMatch[0] : strReps;
};

// --- BANCO DE DADOS VISUAL (FALLBACK) ---
const GIF_DATABASE: Record<string, string> = {
  // PERNAS / GLÚTEOS
  "leg press": "https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif",
  "levantar e sentar": "https://i.pinimg.com/originals/18/31/39/183139366e60970220677270387439da.gif",
  "agachamento": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "stiff": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif",
  "mesa flexora": "https://i.pinimg.com/originals/34/00/28/340028e35900508e063806f97653241e.gif",
  "cadeira extensora": "https://i.pinimg.com/originals/94/a5/d8/94a5d85203387c97561337dce95e4e20.gif",
  "panturrilha": "https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif",
  "extensão de quadril": "https://i.pinimg.com/originals/3e/23/e5/3e23e53625c2d32fb0d2ebf5d37df902.gif",
  "gluteo": "https://i.pinimg.com/originals/3e/23/e5/3e23e53625c2d32fb0d2ebf5d37df902.gif",
  "flexão de joelho": "https://i.pinimg.com/originals/c5/b4/1b/c5b41b94239c1b3595462539a2632200.gif",
  "abdução": "https://i.pinimg.com/originals/3e/23/e5/3e23e53625c2d32fb0d2ebf5d37df902.gif",
  "elevação pélvica": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif", 
  "elevação de quadril": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif",

  // SUPERIORES / COSTAS / PEITO
  "desenvolvimento aberto banco hbc": "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1920&auto=format&fit=crop",
  "supino aberto hbc": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1920&auto=format&fit=crop",
  "supino": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo inverso": "https://i.pinimg.com/originals/3c/69/34/3c6934c933fa76964a22b07d6776b772.gif",
  "voador dorsal": "https://i.pinimg.com/originals/3c/69/34/3c6934c933fa76964a22b07d6776b772.gif",
  "puxada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "remada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "desenvolvimento": "https://i.pinimg.com/originals/e7/17/74/e71774e363b9bc298d022b7a9f7374b0.gif",
  "elevação lateral": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "extensão de ombros": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  
  // BRAÇOS
  "rosca": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "bíceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "biceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "bíceps neutro": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "bíceps em pé": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "tríceps": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "triceps": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "corda": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "testa": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",

  // ABDOMEN / CORE
  "abdominal": "https://i.pinimg.com/originals/c9/26/50/c92650050893347c6920330424647306.gif",
  "prancha": "https://i.pinimg.com/originals/7e/63/01/7e63013d396d74704047c870296700c2.gif",
  "mata-borrão": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "super-man": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "superman": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "lombar": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "supino reto": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "supino inclinado": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "supino declinado": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "rosca direta": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "rosca martelo": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "tríceps corda": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "tríceps testa": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "agachamento livre": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "agachamento smith": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "leg press 45": "https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif",
  "extensora": "https://i.pinimg.com/originals/94/a5/d8/94a5d85203387c97561337dce95e4e20.gif",
  "flexora": "https://i.pinimg.com/originals/34/00/28/340028e35900508e063806f97653241e.gif",
  "panturrilha em pé": "https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif",
  "panturrilha sentado": "https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif"
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop";

// Componente de Imagem Inteligente com Fallback
function ExerciseImage({ ex, dbExercise, className }: { ex: Exercise, dbExercise?: any, className?: string }) {
  const [src, setSrc] = useState<string>("");
  const [attempt, setAttempt] = useState(0); // 0: dbExercise.imageUrl, 1: ex.thumb, 2: DB match, 3: Default

  const findInDb = (name: string) => {
    const nameLower = name.toLowerCase();
    // Requisito especial: Supino Aberto HBC
    if (nameLower.includes("supino") && nameLower.includes("aberto") && nameLower.includes("hbc")) {
      return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1920&auto=format&fit=crop";
    }
    // Requisito especial: Desenvolvimento Aberto Banco HBC
    const devWords = ["desenvolvimento", "aberto", "banco", "hbc"];
    const devMatchCount = devWords.filter(w => nameLower.includes(w)).length;
    if (devMatchCount >= 3) {
      return "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1920&auto=format&fit=crop";
    }
    const match = Object.keys(GIF_DATABASE).find(key => nameLower.includes(key));
    return match ? GIF_DATABASE[match] : null;
  };

  useEffect(() => {
    // Reset state when exercise changes
    setAttempt(0);
    if (dbExercise?.imageUrl) {
      setSrc(dbExercise.imageUrl);
    } else if (ex.thumb && ex.thumb.length > 10) {
      setSrc(ex.thumb);
      setAttempt(1);
    } else {
      // Try DB immediately if no thumb
      const dbMatch = findInDb(ex.name);
      if (dbMatch) {
        setSrc(dbMatch);
        setAttempt(2);
      } else {
        setSrc(DEFAULT_IMAGE);
        setAttempt(3);
      }
    }
  }, [ex, dbExercise]);

  const handleError = () => {
    if (attempt === 0) {
      if (ex.thumb && ex.thumb.length > 10) {
        setSrc(ex.thumb);
        setAttempt(1);
      } else {
        const dbMatch = findInDb(ex.name);
        if (dbMatch) {
          setSrc(dbMatch);
          setAttempt(2);
        } else {
          setSrc(DEFAULT_IMAGE);
          setAttempt(3);
        }
      }
    } else if (attempt === 1) {
        const dbMatch = findInDb(ex.name);
        if (dbMatch && dbMatch !== src) {
            setSrc(dbMatch);
            setAttempt(2);
        } else {
            setSrc(DEFAULT_IMAGE);
            setAttempt(3);
        }
    } else if (attempt === 2) {
        setSrc(DEFAULT_IMAGE);
        setAttempt(3);
    }
  };

  return (
    <img 
      src={src || DEFAULT_IMAGE} 
      alt={ex.name} 
      className={className} 
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
}

/**
 * Estilos de Animação para o "Loop" da Figura
 */
const animationStyles = `
  @keyframes biomechanicalVideo {
    0% { transform: scale(1); filter: brightness(1) contrast(1); }
    50% { transform: scale(1.02); filter: brightness(1.1) contrast(1.1); }
    100% { transform: scale(1); filter: brightness(1) contrast(1); }
  }
  .video-motion-engine { 
    animation: biomechanicalVideo 4s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
  }
`;

/**
 * Modal Cinematográfico ABFIT
 */
export function ABFITDetailModal({ ex, dbExercise, onClose }: { ex: Exercise, dbExercise?: any, onClose: () => void }) {
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
        let videoId = '';
        if (parsedUrl.hostname.includes('youtu.be')) {
          videoId = parsedUrl.pathname.slice(1);
        } else {
          videoId = parsedUrl.searchParams.get('v') || '';
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const embedUrl = dbExercise?.videoUrl ? getEmbedUrl(dbExercise.videoUrl) : '';

  return (
    <div className="fixed inset-0 z-[150] bg-background/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar text-left">
      <style>{animationStyles}</style>
      <header className="flex justify-between items-center mb-8 sticky top-0 z-50 py-2">
        <div className="flex flex-col">
          <p className="text-[13px] font-black text-red-600 uppercase tracking-[0.4em] italic leading-none mb-2">ABFIT</p>
          <h2 className="text-2xl font-black italic uppercase text-foreground tracking-tighter leading-none max-w-[80%]">{ex.name}</h2>
        </div>
        <button onClick={onClose} className="p-3 bg-card rounded-full border border-border text-muted-foreground hover:text-foreground transition-all shadow-2xl">
          <X size={24} />
        </button>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-8 pb-20">
        <div className="relative aspect-video w-full bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-3xl group">
          {embedUrl ? (
            <iframe 
              src={embedUrl} 
              className="w-full h-full object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          ) : (
            <ExerciseImage 
              ex={ex}
              dbExercise={dbExercise}
              className="w-full h-full object-cover video-motion-engine"
            />
          )}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600/30 animate-[scan_3s_infinite]"></div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-600/30">
               <Scan size={14} className="text-red-600 animate-pulse" />
               <span className="text-[11px] font-black text-foreground uppercase tracking-widest">Análise Ativa</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-card/50 border-border space-y-4">
             <div className="flex items-center gap-3">
                <Zap className="text-red-600" size={18} />
                <h4 className="text-[13px] font-black uppercase text-muted-foreground tracking-widest italic">Execução Técnica</h4>
             </div>
             <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-red-600 pl-4">
               {dbExercise?.biomechanics || ex.description || "Mantenha a estabilidade do core e controle a fase excêntrica do movimento. Respire de forma contínua durante a execução."}
             </p>
          </Card>
          <Card className="p-6 bg-card/50 border-border space-y-4">
             <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={18} />
                <h4 className="text-[13px] font-black uppercase text-muted-foreground tracking-widest italic">Laudo Clínico</h4>
             </div>
             <div className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-emerald-500 pl-4">
                {dbExercise?.clinicalNotes ? (
                  <p>{dbExercise.clinicalNotes}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(ex.benefits || "Tensão Mecânica,Estresse Metabólico,Performance").split(',').map((b: string, i: number) => (
                      <span key={i} className="text-[12px] font-black uppercase tracking-widest bg-background px-3 py-1.5 rounded-full text-muted-foreground border border-border italic">{b.trim()}</span>
                    ))}
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- FUNÇÕES DE PERSISTÊNCIA LOCAL PARA TREINOS ---
function getContagemTreinos(): { A: number, B: number, C: number } {
    const saved = localStorage.getItem('contagemTreinos');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao parsear contagemTreinos", e);
        }
    }
    // Valores iniciais para André Brito ou padrão
    return { A: 5, B: 4, C: 3 };
}

function salvarContagemTreinos(contagem: { A: number, B: number, C: number }) {
    localStorage.setItem('contagemTreinos', JSON.stringify(contagem));
}

function incrementarTreino(tipo: 'A' | 'B' | 'C') {
    let contagem = getContagemTreinos();
    console.log(`[DEBUG] Incrementando treino ${tipo}. Contagem anterior:`, JSON.stringify(contagem));
    
    // Assegura que os valores são numéricos e possui iniciais caso estivesse vazio
    if (typeof contagem[tipo] !== 'number') contagem[tipo] = 0;
    
    contagem[tipo] = (contagem[tipo] || 0) + 1;
    
    console.log(`[DEBUG] Nova contagem para ${tipo}:`, contagem[tipo], "Armazenando...");
    salvarContagemTreinos(contagem);
    
    const verificacao = getContagemTreinos();
    console.log(`[DEBUG] Verificação após salvar ${tipo}:`, JSON.stringify(verificacao));
    
    return contagem[tipo]; // Retorna o novo valor
}

// --- FUNÇÕES DE PERSISTÊNCIA LOCAL ---
function salvarCarga(exercicioId: string, carga: string) {
    const cargas = JSON.parse(localStorage.getItem('cargasTreino') || '{}');
    cargas[exercicioId] = carga;
    localStorage.setItem('cargasTreino', JSON.stringify(cargas));
}

function carregarCarga(exercicioId: string): string {
    const cargas = JSON.parse(localStorage.getItem('cargasTreino') || '{}');
    return cargas[exercicioId] || '';
}

function ExerciseCard({ ex, dbExercise, lastLoad, idx, progress, onToggleFinish, onMarkSet, onUpdateLoad, onUpdateUnit, onShowDetail, onShowPrescreveAI, currentReps, onSkip }: { 
  ex: Exercise, 
  dbExercise?: any,
  lastLoad?: string,
  idx: number, 
  progress: { completedSets: number[], isFinished: boolean },
  onToggleFinish: (id: string) => void,
  onMarkSet: (id: string, idx: number, rest: string) => void,
  onUpdateLoad: (id: string, val: string, skipSave?: boolean) => void,
  onUpdateUnit: (id: string, unit: 'Kg' | 'Placas') => void,
  onShowDetail: (ex: Exercise) => void,
  onShowPrescreveAI?: () => void,
  currentReps?: string | null,
  onSkip?: (id: string) => void,
  key?: React.Key
}) {
  const [localLoad, setLocalLoad] = useState(ex.load || '');
  const [displayLoad, setDisplayLoad] = useState(lastLoad || '--');

  useEffect(() => {
    setDisplayLoad(lastLoad || '--');
  }, [lastLoad]);

  useEffect(() => {
    const saved = carregarCarga(ex.id || '');
    if (saved) {
      setLocalLoad(saved);
      setDisplayLoad(saved);
    } else {
      setLocalLoad(ex.load || '');
    }
  }, [ex.load, ex.id]);

  const totalSets = parseInt(ex.sets || '3') || 3;
  const totalReps = formatReps(currentReps || ex.reps || '15');
  const allSetsCompleted = progress.completedSets.length >= totalSets;

  const getGroupBorderColor = (groupId?: string) => {
    if (!groupId) return 'border-orange-500';
    switch (groupId.toLowerCase()) {
      case 'g1': return 'border-emerald-500';
      case 'g2': return 'border-red-600';
      case 'g3': return 'border-blue-600';
      case 'g4': return 'border-yellow-500';
      case 'g5': return 'border-zinc-400';
      case 'g6': return 'border-orange-500';
      default: return 'border-orange-500';
    }
  };

  return (
    <div className={`relative bg-card/10 border rounded-[2.5rem] overflow-hidden transition-all duration-500 ease-out mb-4 p-5 shadow-xl group/card 
      ${allSetsCompleted 
        ? 'border-emerald-500 border-2 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-emerald-950/10' 
        : 'border-border hover:border-red-600/20 hover:shadow-[0_20px_50px_rgba(220,38,38,0.1)]'
      }`}
    >
      <div className={`flex flex-col items-center text-center mb-4 p-3 border-2 rounded-[2rem] bg-background/20 ${getGroupBorderColor(ex.groupId)}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`text-[9px] font-black italic uppercase tracking-[0.3em] leading-none ${allSetsCompleted ? 'text-emerald-500' : 'text-red-600'}`}>
            {idx + 1}º Exercício
          </span>
          {allSetsCompleted && <Check size={14} className="text-emerald-500" />}
        </div>
        
        <h4 className={`text-xl font-black italic uppercase tracking-tighter leading-tight transition-colors ${allSetsCompleted ? 'text-emerald-500' : 'text-foreground'}`}>
          {ex.name}
        </h4>
        {ex.method && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] italic mt-1">
            {ex.method}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 bg-background/20 border border-border/50 rounded-2xl p-4 flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from({ length: totalSets }).map((_, sIdx) => (
              <button 
                key={sIdx}
                onClick={() => onMarkSet(ex.id || '', sIdx, ex.rest || '30')}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-black italic text-base transition-all border-2 
                  ${progress.completedSets.includes(sIdx) 
                    ? 'bg-red-600 border-red-600 text-white shadow-lg' 
                    : 'bg-card border-border text-muted-foreground'
                  }`}
              >
                {sIdx + 1}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-3 italic">
            {allSetsCompleted ? <span className="text-emerald-500">SÉRIE CONCLUÍDA</span> : "Registro de Séries"}
          </p>
        </div>

        <div className="bg-background/20 border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
          <span className="text-2xl font-black text-foreground italic leading-none tracking-tighter">{totalReps}</span>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5 italic">Reps Alvo</p>
        </div>

        <div className="bg-background/20 border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-muted-foreground italic tracking-tighter">{displayLoad}</span>
            <span className="text-[8px] font-black text-muted-foreground uppercase italic">KG</span>
          </div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic">Última Carga</p>
        </div>

        <div className="col-span-2 bg-background/20 border border-border/50 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
          <div className="flex items-baseline gap-2">
            <input 
              type="number" 
              value={localLoad}
              placeholder="--"
              onChange={(e) => {
                setLocalLoad(e.target.value);
              }}
              className="bg-transparent border-none p-0 text-2xl font-black text-center text-foreground outline-none focus:ring-0 w-20 italic tracking-tighter placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => {
                onUpdateLoad(ex.id!, localLoad, false);
                salvarCarga(ex.id!, localLoad);
                setDisplayLoad(localLoad);
                alert('Carga salva!');
                const button = document.activeElement as HTMLElement;
                button?.blur();
              }}
              className="bg-emerald-600 rounded-full p-2 text-white hover:bg-emerald-700 transition-all font-black"
            >
              <Check size={16} />
            </button>
            <span className="text-[9px] font-black text-red-600 uppercase italic">KG</span>
          </div>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic">Carga Atual (Toque no ✅ para salvar)</p>
        </div>
        
        {onShowPrescreveAI && (
          <div className="col-span-2 mt-2">
            <button 
              onClick={onShowPrescreveAI}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <Sparkles size={16} /> Ver Biomecânica AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper para calcular reps dinâmicas
function getCurrentRepsForStudent(student: Student): string | null {
  if (!student.periodization || !student.periodization.microciclos) return null;
  
  const startDate = student.protocolStartDate || student.periodization.startDate;
  if (!startDate) return null;
  
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const diffWeeks = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  const currentMicro = student.periodization.microciclos.find((m: any) => {
    const range = String(m.range || m.semanas || "");
    if (!range) return false;
    const numbers = range.match(/\d+/g);
    if (!numbers) return false;
    const startWeek = parseInt(numbers[0]);
    const endWeek = numbers.length > 1 ? parseInt(numbers[1]) : startWeek;
    return diffWeeks >= startWeek && diffWeeks <= endWeek;
  });
  
  if (!currentMicro) return null;
  if (currentMicro.reps) return formatReps(currentMicro.reps);
  
  const volume = String(currentMicro.volume || currentMicro.volume_semanal || "");
  const repsMatch = volume.match(/(\d+-\d+|\d+)\s*REPETIÇÕES/i) || volume.match(/(\d+-\d+|\d+)\s*reps/i);
  return repsMatch ? formatReps(repsMatch[1]) : null;
}

export function WorkoutSessionView({ user, onBack, onSave, onFinishWorkout, isCoach = false }: { 
  user: Student, 
  onBack: () => void, 
  onSave: (id: string, data: any) => void, 
  onFinishWorkout?: (post: WorkoutHistoryEntry) => void,
  isCoach?: boolean 
}) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);
  const [restCountdown, setRestCountdown] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, { completedSets: number[], isFinished: boolean }>>({});
  const [dbExercises, setDbExercises] = useState<Record<string, any>>({});
  const [prescreveAIExercise, setPrescreveAIExercise] = useState<string | null>(null);

  const [localCounters, setLocalCounters] = useState({ A: 0, B: 0, C: 0 });

  useEffect(() => {
    setLocalCounters(getContagemTreinos());
  }, []);

  const [totalExecuted, setTotalExecuted] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const logsRef = collection(db, 'alunos', user.id, 'logsTreino');
    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      setTotalExecuted(snapshot.size);
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user.id]);

  const tProgress = user.trainingProgress || { completedCount: 0, targetCount: 60 };
  const totalCompleted = Math.max(totalExecuted, tProgress.completedCount || 0, (user.workoutHistory || []).length);
  const currentReps = useMemo(() => getCurrentRepsForStudent(user), [user]);

  const lastLoads = useMemo(() => {
    const map: Record<string, string> = {};
    if (!user.workoutHistory) return map;
    const history = [...user.workoutHistory].sort((a,b) => b.timestamp - a.timestamp);
    for (const entry of history) {
      if (entry.exercises) {
        for (const ex of entry.exercises) {
          if (!map[ex.name] && ex.load) map[ex.name] = ex.load;
        }
      }
    }
    return map;
  }, [user.workoutHistory]);

  const timerRef = useRef<any>(null);
  const restTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeWorkout) {
      const fetchDbExercises = async () => {
        const newDbExercises: Record<string, any> = {};
        for (const ex of activeWorkout.exercises) {
          const docId = ex.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
          try {
            const docSnap = await getDoc(doc(db, 'exercise_database', docId));
            if (docSnap.exists()) {
              newDbExercises[ex.name] = docSnap.data();
            }
          } catch (e) {
            try {
              handleFirestoreError(e, OperationType.GET, `exercise_database/${docId}`);
            } catch (innerError) {
              console.warn("Could not fetch exercise details from database. Using limited details.");
            }
          }
        }
        setDbExercises(newDbExercises);
      };
      fetchDbExercises();
    }
  }, [activeWorkout]);

  const workoutStats = useMemo(() => {
    if (!activeWorkout) return null;
    const title = activeWorkout.title.toLowerCase();
    const history = user.workoutHistory || [];
    
    let logCount = logs.filter(l => l.treinoId === activeWorkout.id || l.prescricaoId === activeWorkout.id).length;
    let historyCount = history.filter(h => h.workoutId === activeWorkout.id).length;
    let completed = Math.max(logCount, historyCount);

    if (title.includes('treino a')) {
      const historyA = history.filter(h => h.name.toLowerCase().includes('treino a'));
      const logsA = logs.filter(l => l.nome?.toLowerCase().includes('treino a'));
      completed = localCounters.A > (user.totalGlobalA || 0) ? localCounters.A : Math.max(user.totalGlobalA || 0, historyA.length, logsA.length);
    } else if (title.includes('treino b')) {
      const historyB = history.filter(h => h.name.toLowerCase().includes('treino b'));
      const logsB = logs.filter(l => l.nome?.toLowerCase().includes('treino b'));
      completed = localCounters.B > (user.totalGlobalB || 0) ? localCounters.B : Math.max(user.totalGlobalB || 0, historyB.length, logsB.length);
    } else if (title.includes('treino c')) {
      const historyC = history.filter(h => h.name.toLowerCase().includes('treino c'));
      const logsC = logs.filter(l => l.nome?.toLowerCase().includes('treino c'));
      completed = localCounters.C > (user.totalGlobalC || 0) ? localCounters.C : Math.max(user.totalGlobalC || 0, historyC.length, logsC.length);
    } else {
      completed = Math.max(logCount, history.filter(h => h.workoutId === activeWorkout.id || h.name === activeWorkout.title).length);
    }

    const total = activeWorkout.projectedSessions || 20;
    const startDateDisplay = user.protocolStartDate ? new Date(user.protocolStartDate).toLocaleDateString('pt-BR') : 'Aguardando 1º Treino';
    return { completed, total, totalGlobal: totalCompleted, startDate: startDateDisplay, rawStartDate: user.protocolStartDate };
  }, [activeWorkout, user.workoutHistory, user.protocolStartDate, user.totalGlobalA, user.totalGlobalB, user.totalGlobalC, logs, totalCompleted]);

  const allExercisesCompleted = useMemo(() => {
    if (!activeWorkout) return false;
    return activeWorkout.exercises.every(ex => {
        const prog = exerciseProgress[ex.id || ''];
        const totalSets = parseInt(ex.sets || '3') || 3;
        return prog && prog.completedSets.length >= totalSets;
    });
  }, [activeWorkout, exerciseProgress]);

  useEffect(() => {
    const savedStart = localStorage.getItem(`workout_start_${user.id}`);
    const savedId = localStorage.getItem(`active_workout_id_${user.id}`);
    const savedProgress = localStorage.getItem(`workout_progress_${user.id}`);
    
    if (savedStart && savedId && !activeWorkout && !isCoach) {
      const start = parseInt(savedStart);
      setSessionStartTime(start);
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
      const workout = user.workouts?.find(w => w.id === savedId);
      if (workout) {
        setActiveWorkout(workout);
        if (savedProgress) {
          try {
            setExerciseProgress(JSON.parse(savedProgress));
          } catch (e) {
            console.error("Failed to parse saved progress", e);
          }
        } else {
          const initialProgress: Record<string, { completedSets: number[], isFinished: boolean }> = {};
          workout.exercises.forEach(ex => {
            initialProgress[ex.id || ''] = { completedSets: [], isFinished: false };
          });
          setExerciseProgress(initialProgress);
        }
      }
    }
  }, [user.id, user.workouts, activeWorkout]);

  useEffect(() => {
    if (activeWorkout && Object.keys(exerciseProgress).length > 0) {
      localStorage.setItem(`workout_progress_${user.id}`, JSON.stringify(exerciseProgress));
    }
  }, [exerciseProgress, activeWorkout, user.id]);

  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStartTime]);

  useEffect(() => {
    if (isResting && restCountdown !== null && restCountdown > 0) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown(prev => (prev !== null ? prev - 1 : 0));
      }, 1000);
    } else if (restCountdown === 0) {
      setIsResting(false);
      setRestCountdown(null);
      
      // SINAL SONORO SUAVE (ALERTA DE FIM DE DESCANSO)
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioCtx = new AudioContext();
          
          const playBeep = (time: number) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine'; // Sine wave é mais suave que square
            oscillator.frequency.setValueAtTime(880.00, time); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440.00, time + 0.5); // Slide suave para A4
            
            // Volume reduzido em 20% (de 1.0 para 0.8) para não atrapalhar a música
            gainNode.gain.setValueAtTime(0.8, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.6);
          };

          const now = audioCtx.currentTime;
          playBeep(now);
        }
      } catch (e) {
        console.error("Erro ao tocar sinal sonoro", e);
      }
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [isResting, restCountdown]);

  const startSession = (workout: Workout) => {
    const now = Date.now();
    setSessionStartTime(now);
    setActiveWorkout(workout);
    localStorage.setItem(`workout_start_${user.id}`, now.toString());
    localStorage.setItem(`active_workout_id_${user.id}`, workout.id);
    localStorage.removeItem(`workout_progress_${user.id}`);
    const initialProgress: Record<string, { completedSets: number[], isFinished: boolean }> = {};
    workout.exercises.forEach(ex => {
      initialProgress[ex.id || ''] = { completedSets: [], isFinished: false };
    });
    setExerciseProgress(initialProgress);
  };

  const cancelSession = () => {
    localStorage.removeItem(`workout_start_${user.id}`);
    localStorage.removeItem(`active_workout_id_${user.id}`);
    localStorage.removeItem(`workout_progress_${user.id}`);
    setActiveWorkout(null);
    setSessionStartTime(null);
  };

  const capturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const finishSession = async () => {
    if (!activeWorkout) return;
    setIsFinishing(true);
    
    // Para o timer imediatamente para feedback visual
    setSessionStartTime(null);
    const finalElapsedTime = elapsedTime;
    const duracaoMinutos = Math.ceil(finalElapsedTime / 60);
    const calorias = duracaoMinutos * 7;
    const cargas = activeWorkout.exercises.map(ex => ({
      exercicio: ex.name,
      carga: ex.load || '0',
      unidade: ex.loadUnit || 'Kg'
    }));

    try {
      const now = new Date();
      const entry: WorkoutHistoryEntry = {
        id: Date.now().toString(),
        workoutId: activeWorkout.id,
        name: activeWorkout.title,
        duration: formatTime(finalElapsedTime),
        date: now.toLocaleDateString('pt-BR'),
        timestamp: Date.now(),
        photoUrl: selfieUrl || undefined,
        type: 'STRENGTH',
        exercises: activeWorkout.exercises
      };

      let result: any = { 
        total: (user.totalGlobalA || 0) + 1, 
        totalGlobal: (user.trainingProgress?.completedCount || 0) + 1,
        metaGlobal: 60 
      };
      
      try {
        const response = await fetch('/api/finalizarTreino', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: user.id, 
            treinoId: activeWorkout.id,
            duracaoMinutos,
            calorias,
            cargas
          }),
        });
        
        if (response.ok) {
          const apiResult = await response.json();
          result = { ...result, ...apiResult };
        }
      } catch (apiErr) {
        console.warn("API de finalização falhou, usando fallback local:", apiErr);
      }

      if (onFinishWorkout) {
        await onFinishWorkout(entry);
      } else {
        const updatedProtocolDate = user.protocolStartDate || now.toISOString();
        const updatedHistory = [entry, ...(user.workoutHistory || [])];
        const currentAnalytics = user.analytics || { sessionsCompleted: 0, streakDays: 0, exercises: {} };
        const newExercises = { ...currentAnalytics.exercises };
        
        activeWorkout.exercises.forEach(ex => {
          const prog = exerciseProgress[ex.id || ''];
          const totalSets = parseInt(ex.sets || '3') || 3;
          if (prog && prog.completedSets.length >= totalSets) {
            newExercises[ex.name] = { ...newExercises[ex.name], completed: (newExercises[ex.name]?.completed || 0) + 1 };
          }
        });

        const updatedAnalytics = {
          ...currentAnalytics,
          sessionsCompleted: result.totalGlobal || (currentAnalytics.sessionsCompleted || 0) + 1,
          lastSessionDate: now.toLocaleDateString('pt-BR'),
          exercises: newExercises
        };

        const updates: any = {
          workoutHistory: updatedHistory,
          protocolStartDate: updatedProtocolDate,
          analytics: updatedAnalytics,
          trainingProgress: {
            completedCount: result.totalGlobal || (user.trainingProgress?.completedCount || 0) + 1,
            targetCount: result.metaGlobal || 60
          }
        };

        const title = activeWorkout.title.toLowerCase();
        console.log("Título do treino finalizado:", title);
        if (title.includes('treino a')) {
          updates.faseAjusteA = (user.faseAjusteA || 0) + 1;
          updates.totalGlobalA = result.total || (user.totalGlobalA || 0) + 1;
          console.log("[DEBUG] Incrementando A, faseAjuste:", updates.faseAjusteA, "total:", updates.totalGlobalA);
          const novoA = incrementarTreino('A');
          setLocalCounters(prev => ({ ...prev, A: novoA }));
        } else if (title.includes('treino b')) {
          updates.faseAjusteB = (user.faseAjusteB || 0) + 1;
          updates.totalGlobalB = result.total || (user.totalGlobalB || 0) + 1;
          console.log("[DEBUG] Incrementando B, faseAjuste:", updates.faseAjusteB, "total:", updates.totalGlobalB);
          const novoB = incrementarTreino('B');
          setLocalCounters(prev => ({ ...prev, B: novoB }));
        } else if (title.includes('treino c')) {
          updates.faseAjusteC = (user.faseAjusteC || 0) + 1;
          updates.totalGlobalC = result.total || (user.totalGlobalC || 0) + 1;
          console.log("[DEBUG] Incrementando C, faseAjuste:", updates.faseAjusteC, "total:", updates.totalGlobalC);
          const novoC = incrementarTreino('C');
          setLocalCounters(prev => ({ ...prev, C: novoC }));
        }

        await onSave(user.id, updates);
        
        if (result.mensagem) {
            alert(result.mensagem);
        }
      }

      localStorage.removeItem(`workout_start_${user.id}`);
      localStorage.removeItem(`active_workout_id_${user.id}`);
      localStorage.removeItem(`workout_progress_${user.id}`);
      setSessionStartTime(null);
      setActiveWorkout(null);
      setSelfieUrl(null);
      setIsFinishing(false);
      setShowPhotoStep(false);
      setShowCompletionModal(false);
      onBack();
    } catch (error) {
      console.error("Erro ao finalizar sessão:", error);
      setIsFinishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isResting) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-foreground animate-in fade-in duration-300 text-center">
        <p className="text-red-600 font-black uppercase tracking-[0.4em] mb-8 italic text-2xl max-w-xs mx-auto leading-tight">
          Recuperação<br/>Biomecânica
        </p>
        <div className="text-[12rem] font-black italic tracking-tighter leading-none text-foreground animate-pulse tabular-nums mb-12">
          {restCountdown}
        </div>
        <button 
          onClick={() => setRestCountdown(0)} 
          className="mt-8 flex items-center gap-2 bg-card px-10 py-5 rounded-3xl border border-border font-black uppercase tracking-widest text-base hover:bg-red-600 shadow-2xl transition-all active:scale-95"
        >
          Pular Descanso
        </button>
      </div>
    );
  }

  if (prescreveAIExercise) {
    return <GeraAi onBack={() => setPrescreveAIExercise(null)} initialExerciseName={prescreveAIExercise} />;
  }

  if (showCompletionModal) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
        <Card className="w-full max-w-xs bg-card border-red-600/30 p-6 text-center shadow-3xl animate-in zoom-in-95">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-600/30">
            <Trophy className="text-white" size={40} />
          </div>
          <h3 className="text-xl font-black italic uppercase text-foreground tracking-tighter leading-none mb-2">Protocolo Vencido!</h3>
          <p className="text-muted-foreground text-[11px] font-black uppercase tracking-widest mb-8">Sua performance foi gravada com sucesso.</p>
          <div className="bg-background/60 p-4 rounded-2xl mb-8 border border-border shadow-inner">
             <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Tempo Total</p>
             <p className="text-xl font-black text-foreground italic tracking-tighter leading-none">{formatTime(elapsedTime)}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setShowCompletionModal(false); setShowPhotoStep(true); }} className="w-full py-4 bg-red-600 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-red-700 transition-all">Gravar Selfie ABFIT</button>
            <button onClick={() => { setShowCompletionModal(false); finishSession(); }} className="w-full py-4 bg-card border border-border rounded-xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all">Finalizar sem Foto</button>
          </div>
        </Card>
      </div>
    );
  }

  if (showPhotoStep) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col p-6 text-foreground animate-in zoom-in duration-300 text-left">
        <header className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Resumo da Missão</h3>
          <button onClick={() => setShowPhotoStep(false)} className="p-2 bg-card rounded-full shadow-lg"><X size={20}/></button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-sm aspect-square bg-card rounded-3xl border-2 border-dashed border-red-600/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shadow-2xl"
          >
            {selfieUrl ? <img src={selfieUrl} className="w-full h-full object-cover" /> : <><Camera size={40} className="text-red-600 mb-4 group-hover:scale-110 transition-transform" /><p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Registrar Selfie ABFIT</p></>}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={capturePhoto} />
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-black italic uppercase text-foreground tracking-tighter">{activeWorkout?.title}</h4>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2 px-8 leading-relaxed">
              Quase lá! Clique abaixo para finalizar e salvar seu treino no histórico.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <div className="flex flex-col"><span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Tempo Total</span><span className="text-2xl font-black text-red-600 italic tabular-nums">{formatTime(elapsedTime)}</span></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 mb-8">
          <button onClick={finishSession} disabled={isFinishing} className="w-full py-5 bg-red-600 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all flex items-center justify-center gap-3">
            {isFinishing ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> SALVANDO...</span> : <><CheckCircle2 /> SALVAR NO FEED</>}
          </button>
          {!selfieUrl && (
            <button onClick={finishSession} disabled={isFinishing} className="w-full py-4 bg-card border border-border rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all">
              Pular Foto e Finalizar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!activeWorkout) {
    return (
      <div className="p-6 pb-48 text-foreground overflow-y-auto h-screen text-left custom-scrollbar bg-background animate-in fade-in">
        <header className="flex flex-col mb-10 sticky top-0 bg-background/90 backdrop-blur-md py-4 z-40 -mx-6 px-6 border-b border-border">
           <div className="flex items-center justify-between mb-4">
              <button onClick={onBack} className="p-2 bg-card rounded-full shadow-lg text-foreground hover:bg-red-600 transition-colors shadow-xl">
                <ArrowLeft size={20}/>
              </button>
              <div className="bg-card border border-border px-4 py-2 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Global: {totalCompleted} de {tProgress.targetCount || 60}</span>
              </div>
           </div>
           <h2 className="text-xl font-black italic uppercase tracking-tighter">
             <HeaderTitle text="Planilhas de Treino" />
           </h2>
        </header>
        <div className="space-y-4">
          {(user.workouts || []).filter(w => !['treino-intervalado-confortavel', 'treino-intervalado-desconfortavel', 'treino-rodagem'].includes(w.id)).length > 0 ? (
            (user.workouts || []).filter(w => !['treino-intervalado-confortavel', 'treino-intervalado-desconfortavel', 'treino-rodagem'].includes(w.id)).map(w => {
              const title = w.title.toLowerCase();
              const history = user.workoutHistory || [];
              
              let logCount = logs.filter(l => l.treinoId === w.id || l.prescricaoId === w.id).length;
              let historyCount = history.filter(h => h.workoutId === w.id).length;
              let completed = Math.max(logCount, historyCount);
              
              if (title.includes('treino a')) {
                const historyA = history.filter(h => h.name.toLowerCase().includes('treino a'));
                const logsA = logs.filter(l => l.nome?.toLowerCase().includes('treino a'));
                completed = Math.max(user.totalGlobalA || 0, historyA.length, logsA.length);
              } else if (title.includes('treino b')) {
                const historyB = history.filter(h => h.name.toLowerCase().includes('treino b'));
                const logsB = logs.filter(l => l.nome?.toLowerCase().includes('treino b'));
                completed = Math.max(user.totalGlobalB || 0, historyB.length, logsB.length);
              } else if (title.includes('treino c')) {
                const historyC = history.filter(h => h.name.toLowerCase().includes('treino c'));
                const logsC = logs.filter(l => l.nome?.toLowerCase().includes('treino c'));
                completed = Math.max(user.totalGlobalC || 0, historyC.length, logsC.length);
              } else {
                completed = history.filter(h => h.workoutId === w.id || h.name === w.title).length;
              }

              const total = w.projectedSessions || 20;

              return (
                <Card key={w.id} className="p-5 bg-card/50 border-border flex flex-row items-center gap-5 group cursor-pointer hover:border-red-600/20 shadow-xl rounded-[2rem] transition-all hover:scale-[1.02] active:scale-95" onClick={() => startSession(w)}>
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg shrink-0">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1 pr-10">
                      <h4 className="text-xl font-black italic uppercase text-foreground tracking-tighter group-hover:text-red-600 transition-colors leading-none truncate pr-2">{w.title}</h4>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-black italic text-red-600 uppercase tracking-tighter leading-none">{completed} Executados</span>
                        <span className="text-[9px] font-black italic text-muted-foreground uppercase tracking-tighter leading-none mt-1">{Math.max(0, total - completed)} Faltam</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em] mb-3">{w.exercises.length} Exercícios Prescritos</p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
                        style={{ width: `${Math.min(100, (completed / total) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-[3rem]">
               <Dumbbell size={48} className="text-muted-foreground mb-6" />
               <p className="text-muted-foreground font-black uppercase text-xs italic tracking-widest">Nenhum treino publicado pelo professor.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-foreground overflow-y-auto h-screen text-left custom-scrollbar bg-background animate-in fade-in duration-500">
      <div className="max-w-xl mx-auto">
        <header className="flex items-center justify-between mb-8 sticky top-0 bg-background/90 backdrop-blur-md z-40 py-4 -mx-6 px-4 border-b border-border">
        <div className="flex-1 flex items-center gap-2 min-w-0">
           <button onClick={onBack} className="p-2 sm:p-3 bg-card rounded-xl sm:rounded-2xl text-muted-foreground hover:text-foreground transition-colors shadow-lg shrink-0">
              <LayoutGrid size={18}/>
           </button>
           <button onClick={cancelSession} className="p-2 sm:p-3 bg-muted rounded-xl sm:rounded-2xl text-muted-foreground hover:text-foreground transition-colors shadow-lg shrink-0">
              <ArrowLeft size={18}/>
           </button>
           <div className="flex flex-col hidden sm:flex min-w-0">
              <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.3em] italic leading-none mb-1">Status Ativo</span>
              <h2 className="text-sm font-black italic uppercase tracking-tighter text-foreground leading-none truncate">{activeWorkout.title}</h2>
           </div>
        </div>

        <div className={`flex flex-col items-center shrink-0 mx-2 ${allExercisesCompleted ? 'hidden sm:flex' : ''}`}>
           <div className="flex items-center gap-1.5">
             <Clock size={16} className="text-red-600 animate-pulse sm:w-6 sm:h-6" />
             <span className="text-xl sm:text-3xl font-black text-foreground italic tracking-tighter tabular-nums leading-none">{formatTime(elapsedTime)}</span>
           </div>
           <span className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Tempo</span>
        </div>

        <div className="flex-1 flex flex-col items-end">
           {allExercisesCompleted ? (
             <button onClick={() => setShowCompletionModal(true)} className="bg-emerald-600 px-4 sm:px-6 py-2 rounded-full font-black text-xs uppercase shadow-lg shadow-emerald-900/30 text-white tracking-widest sm:animate-pulse hover:bg-emerald-700 transition-all shrink-0">
                SALVAR
             </button>
           ) : (
             <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden sm:block">ANDAMENTO</span>
           )}
        </div>
      </header>

      {workoutStats && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
           <Card className="bg-card/40 border-border p-4 flex items-center justify-between backdrop-blur-xl rounded-[2.5rem] shadow-3xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 shrink-0">
                    <Calendar size={18} className="text-red-600" />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 leading-none">Início Protocolo</span>
                    <span className={`font-black italic tracking-tighter leading-none truncate ${!workoutStats.rawStartDate ? 'text-muted-foreground text-[10px]' : 'text-foreground text-lg'}`}>
                      {!workoutStats.rawStartDate ? workoutStats.startDate : (
                        <>{(workoutStats.startDate || "").split('/')[0]}<span className="text-red-600 text-sm">/</span>{(workoutStats.startDate || "").split('/')[1]}</>
                      )}
                    </span>
                 </div>
              </div>
              <div className="flex gap-4 sm:gap-8 shrink-0">
                 <div className="text-center">
                    <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 block">Execuções</span>
                    <div className="flex items-baseline gap-0.5">
                       <span className="text-lg font-black text-foreground italic tracking-tighter leading-none">{workoutStats.completed}</span>
                       <span className="text-[11px] font-black text-muted-foreground italic">/{workoutStats.total}</span>
                    </div>
                 </div>
                 <div className="text-right hidden xs:block">
                    <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 block">Renovação</span>
                    <div className="flex items-center gap-1 justify-end">
                       <RefreshCw size={10} className={workoutStats.completed >= workoutStats.total - 2 ? "text-amber-500 animate-spin" : "text-muted-foreground"} />
                       <span className={`text-xs font-black italic uppercase leading-none ${workoutStats.completed >= workoutStats.total - 2 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {workoutStats.completed >= workoutStats.total ? "EXCEDIDA" : "OK"}
                       </span>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      )}

      <div className="space-y-4">
        {activeWorkout.exercises.map((ex, idx) => {
          const progress = exerciseProgress[ex.id || ''] || { completedSets: [], isFinished: false };
          return (
            <ExerciseCard 
              key={ex.id || idx} 
              ex={ex} 
              dbExercise={dbExercises[ex.name]}
              lastLoad={lastLoads[ex.name]}
              idx={idx} 
              progress={progress} 
              currentReps={currentReps}
              onToggleFinish={(id) => setExerciseProgress(p => ({ ...p, [id]: { ...p[id], isFinished: !p[id].isFinished } }))}
              onMarkSet={(id, sIdx, rest) => {
                 setExerciseProgress(p => {
                   const prev = p[id] || { completedSets: [], isFinished: false };
                   const newSets = prev.completedSets.includes(sIdx) 
                     ? prev.completedSets.filter(s => s !== sIdx)
                     : [...prev.completedSets, sIdx];
                   return { ...p, [id]: { ...prev, completedSets: newSets } };
                 });
                 // Inicia timer apenas se o set não estava marcado (está marcando agora)
                 if (!progress.completedSets.includes(sIdx)) {
                    setRestCountdown(parseInt(rest) || 30);
                    setIsResting(true);
                 }
              }}
              onUpdateLoad={async (id, val, skipSave = false) => {
                if (!activeWorkout) return;
                const updatedExercises = activeWorkout.exercises.map(e => e.id === id ? { ...e, load: val } : e);
                const updatedWorkouts = user.workouts?.map(w => w.id === activeWorkout.id ? { ...w, exercises: updatedExercises } : w);
                
                // Update local state first for instant feedback (the user asked for "appearing to save")
                setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
                
                if (!skipSave) {
                  await onSave(user.id, { workouts: updatedWorkouts });
                  alert('Carga salva com sucesso!');
                }
              }}
              onUpdateUnit={(id, unit) => {
                if (!activeWorkout) return;
                const updatedExercises = activeWorkout.exercises.map(e => e.id === id ? { ...e, loadUnit: unit } : e);
                setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
                onSave(user.id, { 
                  workouts: user.workouts?.map(w => w.id === activeWorkout.id ? { ...w, exercises: updatedExercises } : w) 
                });
              }}
              onShowDetail={setExerciseDetail}
              onShowPrescreveAI={() => setPrescreveAIExercise(ex.name)}
              onSkip={(id) => {
                setExerciseProgress(p => {
                  const totalSets = parseInt(ex.sets || '3') || 3;
                  const allSets = Array.from({ length: totalSets }).map((_, i) => i);
                  return { ...p, [id]: { completedSets: allSets, isFinished: true } };
                });
              }}
            />
          );
        })}
      </div>

      {allExercisesCompleted && (
         <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-50">
            <button 
               onClick={() => setShowCompletionModal(true)}
               className="w-full py-6 bg-emerald-600 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse hover:scale-[1.02] transition-transform text-white"
            >
               VOCÊ TERMINOU DE TREINAR?
            </button>
         </div>
      )}

      {exerciseDetail && <ABFITDetailModal ex={exerciseDetail} dbExercise={dbExercises[exerciseDetail.name]} onClose={() => setExerciseDetail(null)} />}
      <AppFooter />
      </div>
    </div>
  );
}

import { BioimpedanceView } from './BioimpedanceView';

export function StudentAssessmentView({ student, onBack, onToggleMenu }: { student: Student, onBack: () => void, onToggleMenu?: () => void }) {
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [chartMetric, setChartMetric] = useState<'peso' | 'gordura' | 'massa'>('peso');

  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields state
  const [pesoVal, setPesoVal] = useState<string>('');
  const [alturaVal, setAlturaVal] = useState<string>(student.height ? String(student.height) : '180');
  const [gorduraVal, setGorduraVal] = useState<string>('');
  const [massaVal, setMassaVal] = useState<string>('');

  // Optional and detailed fields helper
  const [gorduraVisceralVal, setGorduraVisceralVal] = useState<string>('');
  const [aguaVal, setAguaVal] = useState<string>('');
  const [metabolismoVal, setMetabolismoVal] = useState<string>('');
  const [ossosVal, setOssosVal] = useState<string>('2.8');
  const [dataVal, setDataVal] = useState<string>(new Date().toISOString().split('T')[0]);

  // Dobras cutâneas values
  const [dobraPeitoralVal, setDobraPeitoralVal] = useState<string>('');
  const [dobraAbdominalVal, setDobraAbdominalVal] = useState<string>('');
  const [dobraCoxaVal, setDobraCoxaVal] = useState<string>('');
  const [dobraSubescapularVal, setDobraSubescapularVal] = useState<string>('');

  // Circunferências values
  const [pescocoVal, setPescocoVal] = useState<string>('');
  const [ombroVal, setOmbroVal] = useState<string>('');
  const [toraxVal, setToraxVal] = useState<string>('');
  const [cinturaVal, setCinturaVal] = useState<string>('');
  const [abdomenVal, setAbdomenVal] = useState<string>('');
  const [quadrilVal, setQuadrilVal] = useState<string>('');
  const [bracoEsquerdoVal, setBracoEsquerdoVal] = useState<string>('');
  const [bracoDireitoVal, setBracoDireitoVal] = useState<string>('');
  const [antebracoEsquerdoVal, setAntebracoEsquerdoVal] = useState<string>('');
  const [antebracoDireitoVal, setAntebracoDireitoVal] = useState<string>('');
  const [coxaProximalEsquerdaVal, setCoxaProximalEsquerdaVal] = useState<string>('');
  const [coxaProximalDireitaVal, setCoxaProximalDireitaVal] = useState<string>('');
  const [coxaDistalEsquerdaVal, setCoxaDistalEsquerdaVal] = useState<string>('');
  const [coxaDistalDireitaVal, setCoxaDistalDireitaVal] = useState<string>('');
  const [panturrilhaEsquerdaVal, setPanturrilhaEsquerdaVal] = useState<string>('');
  const [panturrilhaDireitaVal, setPanturrilhaDireitaVal] = useState<string>('');

  // IA Extraction States
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedSuccess, setExtractedSuccess] = useState<boolean>(false);

  const sortedAssessments = useMemo(() => {
    if (!student.physicalAssessments) return [];
    return [...student.physicalAssessments].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [student.physicalAssessments]);

  const chartData = useMemo(() => {
    if (!student.physicalAssessments) return [];
    return [...student.physicalAssessments]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .map(pa => ({
        date: new Date(pa.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(pa.data).toLocaleDateString('pt-BR'),
        peso: typeof pa.peso === 'number' ? pa.peso : parseFloat(pa.peso),
        gordura: pa.gordura?.value || pa.bio_percentual_gordura || 0,
        massa: pa.pesoMassaMuscular?.value || 0
      }));
  }, [student.physicalAssessments]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setExtractedSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
          setExtractedSuccess(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const triggerIAExtraction = async () => {
    if (!imageUrl) return;
    setIsExtracting(true);
    setExtractedSuccess(false);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-image',
          prompt: 'Você é um detector inteligente da ABFIT. Leia o print de tela de bioimpedância anexado. Geralmente é do app Samsung Health no Galaxy Watch 7 ou de outra balança inteligente. Extraia os valores com a máxima correspondência aos nomes e retorne RIGOROSAMENTE apenas um objeto JSON com estes campos (com valores numéricos puros, por exemplo):\n- "gordura": o percentual de gordura corporal (% como float)\n- "massa": o percentual ou peso de massa muscular esquelética (% como float)\n- "gorduraVisceral": o índice de gordura visceral (inteiro)\n- "agua": o percentual de água corporal (% como float)\n- "metabolismo": a taxa metabólica basal em kcal (inteiro)\n\nRetorne apenas o JSON limpo, sem markdown:',
          isImageAnalysis: true,
          imageBase64: imageUrl,
          responseMimeType: 'application/json'
        })
      });

      if (!response.ok) {
        throw new Error('Falha no upload do print');
      }

      const resData = await response.json();
      let rawText = resData.text || '';
      
      // Clean up markdown block headers if any
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawText);
      
      if (parsed) {
        if (parsed.gordura !== undefined && parsed.gordura !== null) setGorduraVal(String(parsed.gordura));
        if (parsed.massa !== undefined && parsed.massa !== null) setMassaVal(String(parsed.massa));
        if (parsed.gorduraVisceral !== undefined && parsed.gorduraVisceral !== null) setGorduraVisceralVal(String(parsed.gorduraVisceral));
        if (parsed.agua !== undefined && parsed.agua !== null) setAguaVal(String(parsed.agua));
        if (parsed.metabolismo !== undefined && parsed.metabolismo !== null) setMetabolismoVal(String(parsed.metabolismo));
        
        setExtractedSuccess(true);
      } else {
        throw new Error('Parse falhou');
      }
    } catch (err) {
      console.error(err);
      alert('Não conseguimos ler os dados automaticamente do imagem. Por favor, ajuste ou insira as métricas de bioimpedância manualmente nos campos abaixo.');
    } finally {
      setIsExtracting(false);
    }
  };

  const resetForm = () => {
    setPesoVal('');
    setGorduraVal('');
    setMassaVal('');
    setGorduraVisceralVal('');
    setAguaVal('');
    setMetabolismoVal('');
    setDobraPeitoralVal('');
    setDobraAbdominalVal('');
    setDobraCoxaVal('');
    setDobraSubescapularVal('');
    setPescocoVal('');
    setOmbroVal('');
    setToraxVal('');
    setCinturaVal('');
    setAbdomenVal('');
    setQuadrilVal('');
    setBracoEsquerdoVal('');
    setBracoDireitoVal('');
    setAntebracoEsquerdoVal('');
    setAntebracoDireitoVal('');
    setCoxaProximalEsquerdaVal('');
    setCoxaProximalDireitaVal('');
    setCoxaDistalEsquerdaVal('');
    setCoxaDistalDireitaVal('');
    setPanturrilhaEsquerdaVal('');
    setPanturrilhaDireitaVal('');
    setImageFile(null);
    setImageUrl('');
    setExtractedSuccess(false);
  };

  const handleSaveAssessment = async () => {
    if (!pesoVal) {
      alert("Por favor, preencha pelo menos o Peso Corporal.");
      return;
    }

    setLoading(true);
    try {
      const pesoNum = parseFloat(pesoVal);
      const alturaNum = parseFloat(alturaVal) || (student.height ? parseFloat(String(student.height)) : 175);
      const gorduraNum = gorduraVal ? parseFloat(gorduraVal) : 18;
      const massaNum = massaVal ? parseFloat(massaVal) : 38;

      const heightInMeters = alturaNum / 100;
      const imcVal = parseFloat((pesoNum / (heightInMeters * heightInMeters)).toFixed(1));

      function getIMCStatus(imc: number) {
        if (imc < 18.5) return 'Baixo';
        if (imc < 25) return 'Saudável';
        if (imc < 30) return 'Sobrepeso';
        return 'Alto';
      }

      function getIMCColor(imc: number) {
        if (imc < 18.5) return 'blue';
        if (imc < 25) return 'green';
        if (imc < 30) return 'yellow';
        return 'red';
      }

      function getFatStatus(fat: number) {
        if (fat < 15) return 'Baixo';
        if (fat < 25) return 'Saudável';
        if (fat < 32) return 'Sobrepeso';
        return 'Obeso';
      }

      function getFatColor(fat: number) {
        if (fat < 15) return 'blue';
        if (fat < 25) return 'green';
        if (fat < 32) return 'yellow';
        return 'red';
      }

      const newAssessment = {
        id: `bio-user-${Date.now()}`,
        data: `${dataVal}T12:00:00Z`,
        type: 'BIOIMPEDANCIA',
        peso: pesoNum,
        altura: alturaNum,
        imc: { value: imcVal, status: getIMCStatus(imcVal), color: getIMCColor(imcVal) },
        gordura: { value: gorduraNum, status: getFatStatus(gorduraNum), color: getFatColor(gorduraNum) },
        bio_percentual_gordura: gorduraNum,
        pesoGordura: { value: parseFloat((pesoNum * (gorduraNum / 100)).toFixed(1)), status: getFatStatus(gorduraNum), color: getFatColor(gorduraNum) },
        percentualMassaMuscularEsqueletica: { value: massaNum, status: 'Saudável', color: 'green' },
        pesoMassaMuscularEsqueletica: { value: parseFloat((pesoNum * (massaNum / 100)).toFixed(1)), status: 'Saudável', color: 'green' },
        registroMassaMuscular: { value: massaNum, status: 'Excelente', color: 'green' },
        pesoMassaMuscular: { value: parseFloat((pesoNum * (massaNum / 100)).toFixed(1)), status: 'Excelente', color: 'green' },
        aguaPercentual: { value: parseFloat(aguaVal) || 52, status: 'Saudável', color: 'green' },
        pesoAgua: { value: parseFloat((pesoNum * ((parseFloat(aguaVal) || 52) / 100)).toFixed(1)), status: 'Saudável', color: 'green' },
        gorduraVisceral: { value: parseFloat(gorduraVisceralVal) || 5, status: 'Saudável', color: 'green' },
        ossos: { value: parseFloat(ossosVal) || 2.8, status: 'Saudável', color: 'green' },
        metabolismo: { value: parseFloat(metabolismoVal) || 1500, status: 'Saudável', color: 'green' },
        proteina: { value: 16.5, status: 'Saudável', color: 'green' },
        obesidade: { value: 5.0, status: 'Saudável', color: 'green' },
        idadeMetabolica: student.age ? parseFloat(String(student.age)) - 2 : 30,
        lbm: parseFloat((pesoNum * (1 - (gorduraNum / 100))).toFixed(2)),
        idadeReal: student.age ? parseFloat(String(student.age)) : 32,
        
        // Mapped typed fields
        pescoco: pescocoVal ? parseFloat(pescocoVal) : undefined,
        ombro: ombroVal ? parseFloat(ombroVal) : undefined,
        torax: toraxVal ? parseFloat(toraxVal) : undefined,
        cintura: cinturaVal ? parseFloat(cinturaVal) : undefined,
        abdomen: abdomenVal ? parseFloat(abdomenVal) : undefined,
        quadril: quadrilVal ? parseFloat(quadrilVal) : undefined,
        bracoEsquerdo: bracoEsquerdoVal ? parseFloat(bracoEsquerdoVal) : undefined,
        bracoDireito: bracoDireitoVal ? parseFloat(bracoDireitoVal) : undefined,
        antebracoEsquerdo: antebracoEsquerdoVal ? parseFloat(antebracoEsquerdoVal) : undefined,
        antebracoDireito: antebracoDireitoVal ? parseFloat(antebracoDireitoVal) : undefined,
        coxaProximalEsquerda: coxaProximalEsquerdaVal ? parseFloat(coxaProximalEsquerdaVal) : undefined,
        coxaProximalDireita: coxaProximalDireitaVal ? parseFloat(coxaProximalDireitaVal) : undefined,
        coxaDistalEsquerda: coxaDistalEsquerdaVal ? parseFloat(coxaDistalEsquerdaVal) : undefined,
        coxaDistalDireita: coxaDistalDireitaVal ? parseFloat(coxaDistalDireitaVal) : undefined,
        panturrilhaEsquerda: panturrilhaEsquerdaVal ? parseFloat(panturrilhaEsquerdaVal) : undefined,
        panturrilhaDireita: panturrilhaDireitaVal ? parseFloat(panturrilhaDireitaVal) : undefined,

        // Mapped dobras
        dobraPeitoral: dobraPeitoralVal ? parseFloat(dobraPeitoralVal) : undefined,
        dobraAbdominal: dobraAbdominalVal ? parseFloat(dobraAbdominalVal) : undefined,
        dobraCoxa: dobraCoxaVal ? parseFloat(dobraCoxaVal) : undefined,
        dobraSubescapular: dobraSubescapularVal ? parseFloat(dobraSubescapularVal) : undefined,

        analiseComposicao: {
          agua: 'Saudável',
          gordura: getFatStatus(gorduraNum),
          proteina: 'Saudável',
          ossos: 'Excelente'
        },
        analiseTipoCorpo: {
          tipo: 'Saudável',
          descricao: 'Seu corpo está em excelente desenvolvimento muscular.'
        },
        dicasControlePeso: {
          pesoIdeal: parseFloat((21.7 * heightInMeters * heightInMeters).toFixed(1)),
          pesoDiff: parseFloat((pesoNum - (21.7 * heightInMeters * heightInMeters)).toFixed(1)),
          massaMuscularDiff: 0,
          gorduraDiff: 0
        },
        veredictoPeriodizacao: "Avaliação gerada pelo usuário via aplicativo. Excelente esforço em manter os dados atualizados de forma autônoma para análise de performance tensional."
      };

      const currentAssessments = student.physicalAssessments || [];
      const updatedAssessments = [newAssessment, ...currentAssessments];

      await setDoc(doc(db, 'alunos', student.id), {
        physicalAssessments: updatedAssessments,
        weight: pesoNum,
        height: alturaNum
      }, { merge: true });

      setIsCreating(false);
      resetForm();
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar avaliação física.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedAssessment && (selectedAssessment.type === 'BIOIMPEDANCE' || selectedAssessment.type === 'BIOIMPEDANCIA')) {
    return <BioimpedanceView assessment={selectedAssessment} allAssessments={student.physicalAssessments} onBack={() => setSelectedAssessment(null)} />;
  }

  if (isCreating) {
    return (
      <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-transparent relative animate-in fade-in">
        <header className="flex items-center gap-4 mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
          <button onClick={() => { setIsCreating(false); resetForm(); }} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-zinc-800 transition-colors shadow-lg">
            <ArrowLeft size={20}/>
          </button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            <HeaderTitle text="Nova Avaliação" />
          </h2>
        </header>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card 1: Primitives (Peso e Data) */}
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
              <Activity size={22} className="text-red-500" />
              <div>
                <h3 className="text-sm font-black italic uppercase text-white leading-none">Dados Pessoais & Peso</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">Sua base de medição inicial</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Peso Corporal (kg) *</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 82.5"
                  value={pesoVal}
                  required
                  onChange={e => setPesoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-sm font-black text-white focus:border-red-600 focus:outline-none placeholder:text-zinc-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Sua Altura (cm)</label>
                <input 
                  type="number"
                  step="0.5"
                  placeholder="Ex: 175"
                  value={alturaVal}
                  onChange={e => setAlturaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-sm font-black text-white focus:border-red-600 focus:outline-none placeholder:text-zinc-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">Data da Medição</label>
                <input 
                  type="date"
                  value={dataVal}
                  onChange={e => setDataVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-sm font-black text-white focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Samsung Galaxy Watch 7 Bioimpedancia Extraction */}
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
              <Zap size={22} className="text-yellow-500" />
              <div>
                <h3 className="text-sm font-black italic uppercase text-white leading-none">Bioimpedância (Samsung Watch 7 ou Print)</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">Extraia gordura, músculo e metabolismo automaticamente por imagem</p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            {!imageUrl ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/50 hover:border-zinc-700 rounded-2xl p-8 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center group"
              >
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Camera size={36} className="text-zinc-500 group-hover:text-white transition-colors mb-2" />
                <span className="text-xs font-black uppercase text-zinc-400 group-hover:text-white transition-colors">Arraste ou clique para enviar print da Bioimpedância</span>
                <span className="text-[10px] text-zinc-600 font-bold mt-1 uppercase tracking-wider">Geralmente print do visor do Watch 7 ou do Samsung Health</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-800">
                    <img src={imageUrl} alt="Print Upload" className="object-cover w-full h-full" />
                    <button 
                      onClick={() => { setImageUrl(''); setImageFile(null); setExtractedSuccess(false); }} 
                      className="absolute top-1 right-1 p-0.5 bg-black/80 hover:bg-black rounded-full text-zinc-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-white">Screenshot Carregado</p>
                    <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Pronto para extração inteligente.</p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={triggerIAExtraction}
                      disabled={isExtracting}
                      className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black rounded-xl font-black italic uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      {isExtracting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      {isExtracting ? 'Analisando...' : 'Extrair com IA'}
                    </button>
                  </div>
                </div>

                {extractedSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-500 text-xs font-black uppercase">
                    <Check size={14} /> Dados extraídos com sucesso do print! Verifique abaixo.
                  </div>
                )}
              </div>
            )}

            {/* Editable values extracted */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Gordura (%)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 18.5"
                  value={gorduraVal}
                  onChange={e => setGorduraVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Massa Músculo (%)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 38.2"
                  value={massaVal}
                  onChange={e => setMassaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Gordura Visceral</label>
                <input 
                  type="number"
                  step="0.5"
                  placeholder="Ex: 5"
                  value={gorduraVisceralVal}
                  onChange={e => setGorduraVisceralVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Água (%)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 52"
                  value={aguaVal}
                  onChange={e => setAguaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Metabolismo</label>
                <input 
                  type="number"
                  step="1"
                  placeholder="Ex: 1550"
                  value={metabolismoVal}
                  onChange={e => setMetabolismoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
            </div>
          </Card>

          {/* Card 3: Dobras Cutâneas (Digitado) */}
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
              <Dumbbell size={22} className="text-red-500" />
              <div>
                <h3 className="text-sm font-black italic uppercase text-white leading-none">Dobras Cutâneas (mm)</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">Insira seus valores de plicômetro</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block mb-2">Peitoral (mm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 8.5"
                  value={dobraPeitoralVal}
                  onChange={e => setDobraPeitoralVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-black text-white focus:border-red-600 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block mb-2">Abdominal (mm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 15.0"
                  value={dobraAbdominalVal}
                  onChange={e => setDobraAbdominalVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-black text-white focus:border-red-600 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block mb-2">Coxa (mm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 12.5"
                  value={dobraCoxaVal}
                  onChange={e => setDobraCoxaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-black text-white focus:border-red-600 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
            </div>
          </Card>

          {/* Card 4: Circunferências Corporais (Digitado) */}
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
              <Scan size={22} className="text-red-500" />
              <div>
                <h3 className="text-sm font-black italic uppercase text-white leading-none">Medidas de Circunferência (cm)</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">Insira suas fitas métricas</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Pescoço (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Pescoço"
                  value={pescocoVal}
                  onChange={e => setPescocoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Ombros (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ombros"
                  value={ombroVal}
                  onChange={e => setOmbroVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Tórax (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Tórax"
                  value={toraxVal}
                  onChange={e => setToraxVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Cintura (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Cintura"
                  value={cinturaVal}
                  onChange={e => setCinturaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Abdômen (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Abdômen"
                  value={abdomenVal}
                  onChange={e => setAbdomenVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Quadril (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Quadril"
                  value={quadrilVal}
                  onChange={e => setQuadrilVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Braço Esquerdo (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Esquerdo"
                  value={bracoEsquerdoVal}
                  onChange={e => setBracoEsquerdoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Braço Direito (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Direito"
                  value={bracoDireitoVal}
                  onChange={e => setBracoDireitoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Antebraço Esq. (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Esquerdo"
                  value={antebracoEsquerdoVal}
                  onChange={e => setAntebracoEsquerdoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Antebraço Dir. (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Direito"
                  value={antebracoDireitoVal}
                  onChange={e => setAntebracoDireitoVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Coxa Esquerda (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Esquerda"
                  value={coxaProximalEsquerdaVal}
                  onChange={e => setCoxaProximalEsquerdaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Coxa Direita (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Direita"
                  value={coxaProximalDireitaVal}
                  onChange={e => setCoxaProximalDireitaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Panturrilha Esq. (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Esquerda"
                  value={panturrilhaEsquerdaVal}
                  onChange={e => setPanturrilhaEsquerdaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1">Panturrilha Dir. (cm)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Direita"
                  value={panturrilhaDireitaVal}
                  onChange={e => setPanturrilhaDireitaVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs font-black text-white focus:border-red-650 focus:outline-none placeholder:text-zinc-800 text-center"
                />
              </div>
            </div>
          </Card>

          <button 
            type="button"
            onClick={handleSaveAssessment}
            disabled={loading}
            className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black italic uppercase text-[12px] tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all mt-6 active:scale-[0.99]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {loading ? 'Salvando Avaliação...' : 'Salvar Avaliação Física'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-transparent relative animate-in fade-in">
      <header className="flex items-center justify-between gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
             {onToggleMenu && (
               <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
                 <Menu size={20}/>
               </button>
             )}
             <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
               <ArrowLeft size={20}/>
             </button>
          </div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            <HeaderTitle text="AVALIAÇÃO FISICA" />
          </h2>
        </div>
        <button 
          onClick={() => {
            setAlturaVal(student.height ? String(student.height) : '180');
            setIsCreating(true);
          }}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all shadow-lg active:scale-95"
        >
          <Sparkles size={12} />
          Nova Avaliação
        </button>
      </header>
      
      <div className="space-y-6">
        {/* Gráfico de Evolução */}
        {chartData.length > 1 && (
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="flex flex-col mb-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-red-500" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Análise de Tendência</p>
              </div>
              <h3 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none mb-4">Evolução Corporal</h3>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'peso', label: 'Peso (kg)', color: 'text-white bg-zinc-800' },
                  { id: 'gordura', label: 'Gordura (%)', color: 'text-red-500 bg-red-950/20' },
                  { id: 'massa', label: 'Massa Musc. (kg)', color: 'text-emerald-500 bg-emerald-950/20' }
                ].map(metric => (
                  <button
                    key={metric.id}
                    onClick={() => setChartMetric(metric.id as any)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                      ${chartMetric === metric.id ? 'ring-2 ring-red-600 scale-105' : 'opacity-40 hover:opacity-100'}
                      ${metric.color}
                    `}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 35, right: 35, left: 35, bottom: 25 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartMetric === 'peso' ? '#FFFFFF' : chartMetric === 'gordura' ? '#DC2626' : '#10B981'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartMetric === 'peso' ? '#FFFFFF' : chartMetric === 'gordura' ? '#DC2626' : '#10B981'} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      {chartData.map((entry, index) => {
                        if (index === 0) return null;
                        const prev = chartData[index - 1][chartMetric];
                        const curr = entry[chartMetric];
                        const color = curr < prev ? '#10B981' : curr > prev ? '#DC2626' : '#FFFFFF';
                        const startOffset = ((index - 1) / (chartData.length - 1)) * 100;
                        const endOffset = (index / (chartData.length - 1)) * 100;
                        return (
                          <React.Fragment key={index}>
                            <stop offset={`${startOffset}%`} stopColor={color} />
                            <stop offset={`${endOffset}%`} stopColor={color} />
                          </React.Fragment>
                        );
                      })}
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} horizontal={false} stroke="none" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#666', fontSize: 10, fontWeight: 'black' }}
                    dy={12}
                    interval={0}
                  />
                  <YAxis 
                    hide 
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#ef4444', marginBottom: '4px', fontWeight: '900', fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={chartMetric} 
                    stroke="url(#strokeGradient)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorMetric)"
                    animationDuration={1500}
                    dot={(props: any) => {
                      const { cx, cy, index, payload } = props;
                      if (index === 0) return <circle cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke="#18181b" strokeWidth={2} />;
                      const prev = chartData[index - 1][chartMetric];
                      const curr = payload[chartMetric];
                      const color = curr < prev ? '#10B981' : curr > prev ? '#DC2626' : '#FFFFFF';
                      return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#18181b" strokeWidth={2} />;
                    }}
                  >
                    <LabelList 
                      dataKey={chartMetric} 
                      position="top" 
                      offset={12}
                      content={(props: any) => {
                        const { x, y, value } = props;
                        
                        return (
                          <text 
                            x={x} 
                            y={y - 12} 
                            fill="#FFFFFF" 
                            fontSize={11} 
                            fontWeight="900" 
                            textAnchor="middle"
                            className="italic text-[11px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                          >
                            {value?.toFixed(1)}
                          </text>
                        );
                      }}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {sortedAssessments.length > 0 ? (
          sortedAssessments.map(pa => (
            <Card key={pa.id} onClick={() => setSelectedAssessment(pa)} className="p-6 bg-zinc-900 border-zinc-800 rounded-3xl shadow-xl cursor-pointer hover:bg-zinc-800 transition-all active:scale-95 group">
               <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-black italic uppercase text-white tracking-tighter leading-none group-hover:text-red-500 transition-colors">
                    <HeaderTitle text={new Date(pa.data).toLocaleDateString('pt-BR')} />
                    {(pa.type === 'BIOIMPEDANCE' || pa.type === 'BIOIMPEDANCIA') && (
                      <span className="block mt-1 text-[10px] text-white uppercase tracking-widest italic">Bioimpedância (Detalhada)</span>
                    )}
                  </h4>
                  <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white tracking-widest shadow-lg">Validada</div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-black/60 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic mb-1">Massa Corporal</p>
                    <p className="text-xl font-black text-white group-hover:text-red-600 transition-colors italic tracking-tighter leading-none">{pa.peso}KG</p>
                  </div>
                  <div className="p-4 bg-black/60 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic mb-1">Gordura Bio</p>
                    <p className="text-xl font-black text-white group-hover:text-red-600 transition-colors italic tracking-tighter leading-none">{pa.gordura?.value || pa.bio_percentual_gordura}%</p>
                  </div>
               </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-zinc-700 italic py-12 border-2 border-dashed border-zinc-900 rounded-[3rem] uppercase font-black text-[13px] tracking-widest">Aguardando Avaliação Presencial</p>
        )}
      </div>
    </div>
  );
}

export function StudentPeriodizationView({ student, onBack, onToggleMenu }: { student: Student, onBack: () => void, onToggleMenu?: () => void }) {
  const plan = student.periodization;

  if (!plan || !plan.generalStrategy) {
    return (
      <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-transparent relative animate-in fade-in">

        <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             {onToggleMenu && (
               <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
                 <Menu size={20}/>
               </button>
             )}
             <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
               <ArrowLeft size={20}/>
             </button>
          </div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            <HeaderTitle text="Periodização" />
          </h2>
        </header>
        <div className="flex flex-col items-center justify-center py-20">
          <Brain className="text-zinc-800 mb-6" size={64} />
          <p className="text-zinc-500 font-black uppercase text-xs italic text-center">Aguardando configuração de macrociclo<br/>pelo seu treinador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-transparent relative animate-in fade-in">
      <header className="flex items-center gap-4 mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
           {onToggleMenu && (
             <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
               <Menu size={20}/>
             </button>
           )}
           <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
             <ArrowLeft size={20}/>
           </button>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Periodização" />
        </h2>
      </header>

      {/* Barra de Progresso do Macrociclo */}
      <div className="mb-8 p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 italic">Progresso do Macrociclo</p>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
              Semana {Math.min(12, Math.max(1, Math.ceil((Date.now() - new Date(plan.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))))} <span className="text-white">de 12</span>
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 italic">Conclusão</p>
            <p className="text-sm font-black italic text-white">
              {Math.min(100, Math.round(((Date.now() - new Date(plan.startDate).getTime()) / (12 * 7 * 24 * 60 * 60 * 1000)) * 100))}%
            </p>
          </div>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-1000" 
            style={{ width: `${Math.min(100, ((Date.now() - new Date(plan.startDate).getTime()) / (12 * 7 * 24 * 60 * 60 * 1000)) * 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {plan.bioInsight && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-950/40 to-black border border-rose-600/20 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles className="text-rose-500" size={48}/></div>
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <Sparkles className="text-rose-500" size={18} />
                <h3 className="text-base font-black uppercase italic text-rose-500 tracking-widest">Bio-Insight</h3>
             </div>
             
             <p className="text-zinc-300 text-[11px] italic leading-relaxed mb-6 relative z-10 font-medium">
               {plan.bioInsight.context}
             </p>

             <div className="space-y-4 relative z-10">
               {plan.bioInsight.tips.map((tip, idx) => (
                 <div key={idx} className="flex gap-4">
                    <span className="text-rose-500 font-black italic text-lg">{idx + 1}.</span>
                    <p className="text-zinc-400 text-[14px] leading-relaxed">
                      {(tip || "").split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part)}
                    </p>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="p-6 bg-zinc-900/50 border-white/5 h-full">
              <h3 className="text-[11px] font-black uppercase text-red-600 tracking-widest mb-3 italic">Estratégia Geral</h3>
              <p className="text-white text-[13px] italic font-medium leading-relaxed mb-4">
                "{plan.generalStrategy}"
              </p>
              {plan.phaseTitle && (
                <div className="pt-4 border-t border-white/5">
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Fase Atual</p>
                   <p className="text-[11px] text-white font-bold uppercase">{plan.phaseTitle}</p>
                </div>
              )}
           </Card>

           <Card className="p-6 bg-red-950/10 border-red-900/20 h-full">
              <h3 className="text-[11px] font-black uppercase text-red-500 tracking-widest mb-4 italic">Segurança Clínica</h3>
              <div className="space-y-4">
                 {(plan.clinicalSafety || []).map((item, idx) => (
                   <div key={idx} className="flex gap-3">
                      <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">{item}</p>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        {plan.microciclos && plan.microciclos.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-6">Cronograma de Microciclos</h3>
            <div className="space-y-6">
              {(plan.microciclos || []).map((micro: any, idx: number) => (
                <Card key={idx} className="p-6 bg-zinc-900/40 border-white/5">
                  <div className="mb-6">
                    <h4 className="text-red-500 font-black text-lg mb-1">Semanas {micro.range || micro.semanas}</h4>
                    <p className="text-[13px] text-zinc-500 font-black uppercase tracking-widest">{micro.focus || micro.titulo}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                    <div>
                      <p className="text-[12px] text-zinc-500 font-black uppercase tracking-widest mb-1">Método</p>
                      <p className="text-sm text-white font-bold">{micro.method || micro.metodo}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-zinc-500 font-black uppercase tracking-widest mb-1">Intensidade</p>
                      <p className="text-sm text-white font-bold">{String(micro.intensity || micro.intensidade || "").split(' ')[0]}</p>
                      <p className="text-[13px] text-red-500 font-bold">{String(micro.intensity || micro.intensidade || "").split(' ').slice(1).join(' ')}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-zinc-500 font-black uppercase tracking-widest mb-1">Volume</p>
                      <p className="text-sm text-white font-bold">{String(micro.volume || micro.volume_semanal || "").split(' ')[0]}</p>
                      <p className="text-[13px] text-red-500 font-bold">{String(micro.volume || micro.volume_semanal || "").split(' ').slice(1).join(' ')}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-zinc-500 font-black uppercase tracking-widest mb-1">Repetições</p>
                      <p className="text-sm text-white font-bold">{formatReps(micro.reps || String(micro.volume || micro.volume_semanal || "").split(',')[1]?.trim()) || "N/A"}</p>
                    </div>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-4">
                    <p className="text-[12px] text-zinc-500 font-black uppercase tracking-widest mb-2">Volume Semanal (Séries)</p>
                    <p className="text-xs text-zinc-300 font-mono">{micro.weeklyVolume || String(micro.volume || micro.volume_semanal || "").split(',')[0] || "N/A"}</p>
                  </div>

                  {(micro.notes || micro.descricao) && (
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-zinc-400 italic">Obs: {micro.notes || micro.descricao}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-transparent relative animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Sobre a ABFIT" />
        </h2>
      </header>
      <div className="space-y-12">
        <div className="text-center">
          <h3 className="text-5xl font-black italic uppercase text-red-600 tracking-tighter leading-none">ABFIT Performance</h3>
          <p className="text-[13px] font-black uppercase text-zinc-500 tracking-[0.4em] mt-2 italic">Me. André Brito</p>
        </div>
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/40 border-white/5">
            <h4 className="text-sm font-black uppercase italic text-white mb-3">Nossa Missão</h4>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              Proporcionar treinamento de alto nível fundamentado em Ciência do Exercício e Biomecânica, 
              utilizando tecnologia de ponta para otimizar resultados e garantir a segurança do atleta.
            </p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900 rounded-3xl border border-white/5 text-center">
               <Award className="text-red-600 mx-auto mb-2" size={24} />
               <p className="text-[13px] font-black uppercase text-white leading-none">Mestrado UERJ</p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-3xl border border-white/5 text-center">
               <Shield className="text-red-600 mx-auto mb-2" size={24} />
               <p className="text-[13px] font-black uppercase text-white leading-none">Segurança PBE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
