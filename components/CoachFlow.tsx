
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers, Video, X, Eye, EyeOff,
  BarChart3, ZapIcon, Settings2, Link as LinkIcon, Send, Menu, Layout, AlertTriangle, Scan, Upload, Copy,
  CheckCircle2, MapPin, History, Download
} from 'lucide-react';
import { Card, AppFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { callAI } from '../services/gemini';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification, PeriodizationPlan } from '../types';
import { analyzeExerciseAndGenerateImage, extractWorkoutFromImage, generateBioInsight } from '../services/gemini';
import { RunTrackCoachView } from './RunTrack';
import { EXERCISE_DATABASE, MUSCLE_GROUPS } from '../constants/exercises';
import ProgressBarABFIT from './ProgressBarABFIT';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

const formatReps = (reps: any): string | null => {
  if (!reps) return null;
  const strReps = String(reps);
  const rangeMatch = strReps.match(/(\d+)\s*(?:-|a|to)\s*(\d+)/i);
  if (rangeMatch) return rangeMatch[2];
  const numberMatch = strReps.match(/(\d+)/);
  return numberMatch ? numberMatch[0] : strReps;
};

// --- PRESCREVE AI CONSTANTS & DATABASE ---
const GEMINI_MODEL = "gemini-3-flash-preview";
const IMAGEN_MODEL = "imagen-4.0-generate-001";

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
  "supino": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo inverso": "https://i.pinimg.com/originals/3c/69/34/3c6934c933fa76964a22b07d6776b772.gif",
  "puxada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "remada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "desenvolvimento": "https://i.pinimg.com/originals/e7/17/74/e71774e363b9bc298d022b7a9f7374b0.gif",
  "elevação lateral": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "extensão de ombros": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  
  // BRAÇOS
  "rosca": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "bíceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "biceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
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
  "panturrilha sentado": "https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif",
  "lombar": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif"
};

const getExerciseGif = (name: string) => {
  const nameLower = name.toLowerCase();
  const matchKey = Object.keys(GIF_DATABASE).find(key => nameLower.includes(key));
  return matchKey ? GIF_DATABASE[matchKey] : null;
};

export function ProfessorDashboard({ students, onLogout, onSelect, onToggleMenu, onNavigate, notifications = [] }: { 
  students: Student[], 
  onLogout: () => void, 
  onSelect: (s: Student) => void, 
  onToggleMenu: () => void, 
  onNavigate: (view: string) => void,
  notifications?: AppNotification[]
}) {
  const alerts = useMemo(() => {
    const list: { studentId: string; studentName: string; type: 'STRENGTH' | 'RUNNING' | 'ASSESSMENT'; current?: number; total?: number; workoutTitle?: string; daysLeft?: number; nextDate?: string }[] = [];
    
    students.forEach(s => {
      // 1. Alertas de Avaliação Completa (Específico André/Recorrente)
      if (s.id === 'fixed-andre') {
        const lastFullDate = '2026-04-20';
        const nextDate = new Date(lastFullDate);
        nextDate.setDate(nextDate.getDate() + 30);
        const now = new Date();
        const diffTime = nextDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) {
          list.push({ 
            studentId: s.id, 
            studentName: s.nome, 
            type: 'ASSESSMENT', 
            daysLeft: diffDays, 
            nextDate: nextDate.toLocaleDateString('pt-BR') 
          });
        }
      }

      // 2. Strength Workouts
      const strengthWorkouts = (s.workouts || []).filter(w => w.status === 'published');
      strengthWorkouts.forEach(w => {
        const completed = (s.workoutHistory || []).filter(h => h.workoutId === w.id).length;
        const total = w.projectedSessions || 20;
        if (completed >= total - 2) {
          list.push({ studentId: s.id, studentName: s.nome, type: 'STRENGTH', current: completed, total, workoutTitle: w.title });
        }
      });

      // Running Workouts (ABFIT RUN)
      // Note: We'll assume running workouts also have projectedSessions or we use a global default for now
      // Since Running workouts might be in a separate collection, we rely on what's in the student object if synced
      // and checking if student has runAlertsEnabled
    });

    return list;
  }, [students]);

  const handleExportData = () => {
    const dataStr = JSON.stringify(students, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `abfit_export_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-6 text-foreground bg-background h-screen overflow-y-auto custom-scrollbar text-left flex flex-col items-center transition-colors">
      <header className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onToggleMenu} className="p-3 bg-card rounded-2xl text-muted-foreground hover:text-foreground transition-colors shadow-lg">
            <Menu size={20}/>
          </button>
          <WeatherWidget />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportData} className="p-3 bg-card rounded-full text-emerald-500 hover:text-emerald-400 transition-colors shadow-lg flex items-center gap-2" title="Exportar Todos os Dados">
            <Download size={20} />
          </button>
          <button onClick={onLogout} className="p-3 bg-card rounded-full text-muted-foreground hover:text-red-600 transition-colors shadow-lg">
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <Logo size="text-5xl" subSize="text-[9px] sm:text-xs" />

      {alerts.length > 0 && (
        <div className="w-full max-w-xl mt-6 px-2">
          <div className="flex items-center gap-3 mb-3">
             <Bell className="text-red-500 animate-bounce" size={16} />
             <h3 className="text-[12px] font-black uppercase text-foreground tracking-widest italic">Alertas de Troca de Treino</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <Card key={`${alert.studentId}-${idx}`} className="p-4 bg-red-600/10 border-red-600/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-background ${
                    alert.type === 'STRENGTH' ? 'text-orange-500' : 
                    alert.type === 'ASSESSMENT' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {alert.type === 'STRENGTH' ? <Dumbbell size={16} /> : 
                     alert.type === 'ASSESSMENT' ? <Activity size={16} /> : <Footprints size={16} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-foreground italic">{alert.studentName}</p>
                    {alert.type === 'ASSESSMENT' ? (
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">
                        AVALIAÇÃO COMPLETA • {alert.daysLeft! <= 0 ? 'ATRASADO' : `EM ${alert.daysLeft} DIAS`} ({alert.nextDate})
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{alert.workoutTitle} • {alert.current}/{alert.total}</p>
                    )
                    }
                  </div>
                </div>
                <button 
                  onClick={() => onSelect(students.find(s => s.id === alert.studentId)!)}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg active:scale-95 transition-all"
                >
                  Ajustar
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-xl mt-8 space-y-4 pb-20">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Card className="p-4 bg-card/50 border-border cursor-pointer active:scale-95 transition-all" onClick={() => onNavigate('FEED')}>
            <div className="p-2 bg-secondary w-fit rounded-xl mb-3">
              <Layout className="text-muted-foreground" size={18} />
            </div>
            <h3 className="text-[13px] font-black uppercase italic text-foreground tracking-widest">Feed Global</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Timeline de Atletas</p>
          </Card>
          <Card className="p-4 bg-card/50 border-border cursor-pointer active:scale-95 transition-all" onClick={() => onNavigate('PRESCREVE_AI')}>
            <div className="p-2 bg-secondary w-fit rounded-xl mb-3">
              <Sparkles className="text-blue-500" size={18} />
            </div>
            <h3 className="text-[13px] font-black uppercase italic text-foreground tracking-widest">GeraAi</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Biomecânica por IA</p>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2 mb-2">
            <Users className="text-red-600" size={14} />
            <h3 className="text-[13px] font-black uppercase text-muted-foreground tracking-[0.2em] italic">Gestão de Atletas ({students.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2.5">
            {students.map(s => (
              <button 
                key={s.id} 
                onClick={() => onSelect(s)} 
                className="w-full bg-card/50 p-4 rounded-3xl border border-border hover:border-red-600/40 transition-all text-left shadow-lg flex items-center justify-between group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border border-border shadow-inner">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} className="w-full h-full object-cover" alt={s.nome} />
                    ) : (
                      <Activity className="text-muted-foreground" size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm text-foreground leading-none tracking-tight">{s.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-[11px] text-muted-foreground uppercase font-bold truncate max-w-[120px]">{s.email}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="transition-all text-muted-foreground group-hover:text-red-600 group-hover:translate-x-1" size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

// ... (StudentManagement component remains unchanged) ...
const FEATURE_LIST = [
  { id: 'FEED', label: 'Feed Performance', icon: LayoutGrid },
  { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell },
  { id: 'STUDENT_PERIODIZATION', label: 'Periodização', icon: Brain },
  { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler },
  { id: 'RUNTRACK_STUDENT', label: 'RunTrack ABFIT', icon: Footprints },
  { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3 },
  { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info },
];

import { ABFITAIModule } from './ABFITAI';

export function StudentWorkoutHistoryView({ student, onBack }: { student: Student, onBack: () => void }) {
  const history = useMemo(() => {
    return [...(student.workoutHistory || [])].sort((a, b) => b.timestamp - a.timestamp);
  }, [student.workoutHistory]);

  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-white overflow-y-auto h-screen custom-scrollbar text-left bg-background transition-colors">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-background/90 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-border">
        <button onClick={onBack} className="p-2 bg-card rounded-full hover:bg-red-600 transition-colors shadow-lg">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
          <HeaderTitle text={`Histórico: ${student.nome}`} />
        </h2>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Activity size={48} className="mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-center">Nenhum treino concluído ainda</p>
          </div>
        ) : (
          history.map((entry) => (
            <Card key={entry.id} className="p-6 bg-card border-border shadow-xl hover:border-red-600/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-black uppercase italic text-foreground tracking-tight">{entry.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                      <Calendar size={12} className="text-red-600" />
                      {entry.date}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                      <Clock size={12} className="text-red-600" />
                      {entry.duration}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                  entry.type === 'RUNNING' ? 'bg-rose-600/10 text-rose-500' : 
                  entry.type === 'STRENGTH' ? 'bg-orange-600/10 text-orange-500' : 
                  'bg-blue-600/10 text-blue-500'
                }`}>
                  {entry.type}
                </span>
              </div>

              {entry.type === 'RUNNING' && entry.runningStats && (
                <div className="mt-4 grid grid-cols-3 gap-3 bg-secondary/30 p-4 rounded-2xl border border-white/5">
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Distância</p>
                    <p className="text-sm font-black italic text-[#e2ff00] leading-none">{entry.runningStats.distance}<span className="text-[8px] ml-0.5">km</span></p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Ritmo Médio</p>
                    <p className="text-sm font-black italic text-white leading-none">{entry.runningStats.avgPace || '--'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Calorias</p>
                    <p className="text-sm font-black italic text-white leading-none">{entry.runningStats.calories}<span className="text-[8px] ml-0.5">kcal</span></p>
                  </div>
                  <div className="text-center pt-2 border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Batimento</p>
                    <p className="text-sm font-black italic text-red-500 leading-none">{entry.runningStats.avgHR || '--'}<span className="text-[8px] ml-0.5">bpm</span></p>
                  </div>
                  <div className="text-center pt-2 border-t border-white/5 border-x border-white/5">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Elevação</p>
                    <p className="text-sm font-black italic text-white leading-none">{entry.runningStats.elevation || 0}<span className="text-[8px] ml-0.5">m</span></p>
                  </div>
                  <div className="text-center pt-2 border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Cadência</p>
                    <p className="text-sm font-black italic text-white leading-none">{entry.runningStats.cadence || '--'}<span className="text-[8px] ml-0.5">ppm</span></p>
                  </div>
                </div>
              )}

              {entry.text && (
                <div className="mt-4 p-4 bg-secondary/50 rounded-2xl border border-border">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText size={12} className="text-red-600" /> Feedback do Atleta
                  </p>
                  <p className="text-xs text-foreground font-medium leading-relaxed italic">
                    "{entry.text}"
                  </p>
                </div>
              )}

              {entry.photoUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-border shadow-lg">
                  <img src={entry.photoUrl} alt="Treino" className="w-full h-48 object-cover" />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
      <AppFooter />
    </div>
  );
}

export function StudentManagement({ student, runningWorkouts, onBack, onNavigate, onEditWorkout, onSave }: { student: Student, runningWorkouts: any[], onBack: () => void, onNavigate: (v: string) => void, onEditWorkout: (w: Workout | null) => void, onSave: (sid: string, data: any) => void }) {
  const [publishing, setPublishing] = useState(false);
  const [abrirPrescritor, setAbrirPrescritor] = useState(false);
  const workoutsRef = useRef<HTMLDivElement>(null);

  // Toggle de visibilidade do dashboard
  const toggleFeatureVisibility = async (featureId: string) => {
    // Calcula o novo estado baseando-se no atual (garante que não usamos valor stale)
    const currentDisabled = student.disabledFeatures || [];
    let newDisabled;
    if (currentDisabled.includes(featureId)) {
      newDisabled = currentDisabled.filter(id => id !== featureId);
    } else {
      newDisabled = [...currentDisabled, featureId];
    }
    
    // Chama o onSave (que agora dispara o indicador de sync)
    await onSave(student.id, { disabledFeatures: newDisabled });
  };

  const publishAllWorkouts = async () => {
    setPublishing(true);
    const updatedWorkouts = (student.workouts || []).map(w => ({ ...w, status: 'published' as const }));
    await onSave(student.id, { workouts: updatedWorkouts });
    setPublishing(false);
  };

  const hasDrafts = student.workouts?.some(w => w.status === 'draft' || !w.status);

  // Scroll suave para a lista de treinos
  const scrollToWorkouts = () => {
    workoutsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="p-6 text-foreground bg-background h-screen overflow-y-auto custom-scrollbar text-left transition-colors">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-background/90 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-card rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
            <HeaderTitle text={student.nome} />
          </h2>
        </div>
        {hasDrafts && (
           <button 
            onClick={publishAllWorkouts} 
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all text-white"
           >
             {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
             Publicar
           </button>
        )}
      </header>

      {/* MENU VERTICAL COMPLETO (IDÊNTICO AO ALUNO) */}
      <div className="space-y-3 mb-10">
        
        {/* Planilhas Ativas - Scroll para lista abaixo */}
        <button onClick={scrollToWorkouts} className="w-full p-3.5 rounded-3xl bg-orange-950/20 border border-orange-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-orange-600/50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                 <Dumbbell size={18} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Planilhas Ativas</span>
           </div>
           <ChevronRight className="text-orange-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* ABFIT RUN */}
        <button onClick={() => onNavigate('RUNTRACK_MANAGER')} className="w-full p-3.5 rounded-3xl bg-rose-950/20 border border-rose-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-rose-600/50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
                 <Footprints size={18} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">ABFIT RUN</span>
           </div>
           <ChevronRight className="text-rose-600 group-hover:translate-x-1 transition-transform" />
        </button>
        <div className="space-y-2 mt-2 px-2">
            {runningWorkouts.slice(0, 5).map(w => (
                <div key={w.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{w.type} - {w.dayOfWeek}</span>
                    <span className="text-[10px] text-zinc-500">{w.totalTime}</span>
                </div>
            ))}
        </div>

        {/* Periodização */}
        <button onClick={() => onNavigate('PERIODIZATION')} className="w-full p-3.5 rounded-3xl bg-indigo-950/20 border border-indigo-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-indigo-600/50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                 <Brain size={18} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Periodização</span>
           </div>
           <ChevronRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
        </button>
        <button onClick={() => onSave(student.id, { periodization: { ...student.periodization, startDate: new Date().toISOString() } })} className="w-full mt-2 p-2 bg-red-900/50 text-[10px] uppercase font-black tracking-widest text-white rounded-xl shadow-lg active:scale-95 transition-all">
          Reiniciar Macrociclo (Semana 1)
        </button>

        {/* Avaliação Física */}
        <button onClick={() => onNavigate('COACH_ASSESSMENT')} className="w-full p-3.5 rounded-3xl bg-emerald-950/20 border border-emerald-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-emerald-600/50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                 <Ruler size={18} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Avaliação Física</span>
           </div>
           <ChevronRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Corre RJ 2026 */}
        <button onClick={() => onNavigate('CORRE_RJ')} className="w-full p-4 rounded-3xl bg-yellow-950/20 border border-yellow-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-yellow-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-600/20">
                 <MapPin size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Corre RJ 2026</span>
           </div>
           <ChevronRight className="text-yellow-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Feed Performance */}
        <button onClick={() => onNavigate('FEED')} className="w-full p-4 rounded-3xl bg-red-950/20 border border-red-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-red-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                 <Layout size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Feed Performance</span>
           </div>
           <ChevronRight className="text-red-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Análise de Dados */}
        <button onClick={() => onNavigate('ANALYTICS_COACH')} className="w-full p-4 rounded-3xl bg-blue-950/20 border border-blue-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-blue-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                 <BarChart3 size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Análise de Dados</span>
           </div>
           <ChevronRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Histórico de Treinos */}
        <button onClick={() => onNavigate('WORKOUT_HISTORY')} className="w-full p-4 rounded-3xl bg-emerald-950/20 border border-emerald-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-emerald-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                 <History size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Histórico de Treinos</span>
           </div>
           <ChevronRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Sobre a ABFIT */}
        <button onClick={() => onNavigate('ABOUT_ABFIT')} className="w-full p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-zinc-700">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg shadow-zinc-800/20">
                 <Info size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-foreground tracking-wider text-sm">Sobre a ABFIT</span>
           </div>
           <ChevronRight className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
        </button>

      </div>

      {/* Progresso: Ajuste de Treino */}
      {(student.faseAjusteA !== undefined || student.faseAjusteB !== undefined) && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] italic">📊 Progresso: Ajuste de Treino</h3>
          </div>
          <div className="space-y-3">
            {student.faseAjusteA !== undefined && (
              <ProgressBarABFIT 
                label="Treino A" 
                atual={student.faseAjusteA} 
                totalFase={20} 
                totalGlobal={student.totalGlobalA || 0} 
              />
            )}
            {student.faseAjusteB !== undefined && (
              <ProgressBarABFIT 
                label="Treino B" 
                atual={student.faseAjusteB} 
                totalFase={20} 
                totalGlobal={student.totalGlobalB || 0} 
              />
            )}
          </div>
        </div>
      )}

      {/* Planilhas Atuais - Lista Expansível / Atalho Rápido */}
      <div className="mt-8 space-y-4" ref={workoutsRef}>
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] italic">Gerenciar Planilhas</h3>
            <span className="text-[8px] font-black uppercase text-muted-foreground bg-card px-2 py-1 rounded-md">{student.workouts?.length || 0} Ativas</span>
         </div>
         <div className="space-y-3">
            {(student.workouts || []).filter(w => !w.title.toUpperCase().includes('RUN')).map(w => (
              <div key={w.id} className="p-6 rounded-3xl border border-border bg-card/50 flex flex-col gap-4 group transition-all shadow-lg hover:border-orange-600/30">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <span className="font-black uppercase italic text-lg text-white leading-none">{w.title}</span>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic ${w.status === 'published' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/20' : 'bg-orange-600/10 text-orange-500 border border-orange-600/20'}`}>
                         {w.status === 'published' ? 'Publicado' : 'Rascunho'}
                       </span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { /* TODO: Quick Edit */ }} className="p-3 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-orange-600 transition-all">
                           <Zap size={18}/>
                       </button>
                       <button onClick={() => { onEditWorkout(w); onNavigate('WORKOUT_EDITOR'); }} className="p-3 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-red-600 transition-all">
                           <Edit3 size={18}/>
                       </button>
                    </div>
                 </div>
                 
                 {/* Progress Display */}
                 <div className="space-y-1">
                   <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                     <span>Progresso</span>
                     <span>{(student.workoutHistory || []).filter(h => h.workoutId === w.id).length} / {w.projectedSessions || 1} sessões</span>
                   </div>
                   <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                     <div className="bg-red-600 h-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((student.workoutHistory || []).filter(h => h.workoutId === w.id).length / (w.projectedSessions || 1)) * 100))}%` }}></div>
                   </div>
                 </div>
               </div>
            ))}
            {(!student.workouts || student.workouts.length === 0) && (
              <div className="text-center py-6 border-2 border-dashed border-zinc-900 rounded-3xl space-y-3">
                 <p className="text-zinc-700 text-[10px] font-black uppercase">Nenhuma planilha ativa</p>
                 <button onClick={() => { onEditWorkout(null); onNavigate('WORKOUT_EDITOR'); }} className="px-6 py-2 bg-red-600 rounded-full text-[10px] font-black uppercase text-white shadow-lg">Criar Novo Treino</button>
              </div>
            )}
            
            {/* Botão de Criação Rápida */}
            <button onClick={() => { onEditWorkout(null); onNavigate('WORKOUT_EDITOR'); }} className="w-full py-4 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl text-zinc-500 hover:text-white hover:border-red-600/50 transition-all flex items-center justify-center gap-2 group">
              <Plus size={16} className="group-hover:text-red-600 transition-colors"/>
              <span className="text-[10px] font-black uppercase tracking-widest">Novo Treino (Editor Padrão)</span>
            </button>

            {/* Botão ABFIT AI */}
            <button onClick={() => setAbrirPrescritor(true)} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 rounded-3xl text-white font-black uppercase tracking-widest hover:shadow-lg hover:shadow-red-600/20 transition-all flex items-center justify-center gap-2 group mt-4 active:scale-95">
              <Sparkles size={16} className="text-white animate-pulse"/>
              <span className="text-[10px]">CRIAR TREINO (ABFIT AI)</span>
            </button>
         </div>
      </div>

      {/* Módulo ABFIT AI Encapsulado */}
      {abrirPrescritor && (
        <ABFITAIModule 
          studentName={student.nome} 
          onClose={() => setAbrirPrescritor(false)} 
        />
      )}
    </div>
  );
}

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (sid: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || '');
  // Garante que projectedSessions seja um número
  const [projectedSessions, setProjectedSessions] = useState<number>(workoutToEdit?.projectedSessions || 12);
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'saved'>('idle');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Novos estados para padronização
  const [defaultSets, setDefaultSets] = useState(workoutToEdit?.defaultSets || '');
  const [defaultReps, setDefaultReps] = useState(workoutToEdit?.defaultReps || '');
  const [defaultRest, setDefaultRest] = useState(workoutToEdit?.defaultRest || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleApplyDefaults = () => {
    if (!defaultSets && !defaultReps && !defaultRest) return;
    
    const updatedExercises = exercises.map(ex => ({
      ...ex,
      sets: defaultSets || ex.sets,
      reps: defaultReps || ex.reps,
      rest: defaultRest || ex.rest
    }));
    setExercises(updatedExercises);
  };

  const handleSaveWorkout = async () => {
    setSaveState('loading');
    
    // Assegura que o valor seja um número válido antes de salvar
    const finalSessions = Number(projectedSessions);
    const safeSessions = isNaN(finalSessions) || finalSessions < 1 ? 12 : finalSessions;

    const newWorkout: Workout = {
      id: workoutToEdit?.id || Date.now().toString(),
      title: title || 'Novo Treino',
      exercises: exercises,
      projectedSessions: safeSessions, // Usa o valor garantido
      status: 'draft',
      defaultSets: defaultSets,
      defaultReps: defaultReps,
      defaultRest: defaultRest
    };

    const currentWorkouts = student.workouts || [];
    let updatedWorkouts;
    if (workoutToEdit) {
      updatedWorkouts = currentWorkouts.map(w => w.id === workoutToEdit.id ? newWorkout : w);
    } else {
      updatedWorkouts = [...currentWorkouts, newWorkout];
    }

    try {
      // Race condition para evitar que o loading fique infinito em caso de falha silenciosa
      const savePromise = onSave(student.id, { workouts: updatedWorkouts });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Save Timeout')), 10000));
      
      await Promise.race([savePromise, timeoutPromise]);
      
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (e) {
      console.error("Save error:", e);
      setSaveState('idle'); // Destrava o botão em caso de erro
      // alert("Ocorreu um erro ao salvar. Verifique sua conexão.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const extractedExercises = await extractWorkoutFromImage(base64);
          
          // Mapeia os exercícios extraídos com as imagens do banco usando o GIF_DATABASE
          const enrichedExercises = extractedExercises.map(ex => {
            // Busca simples por substring no banco de dados de GIFs (case insensitive)
            const matchKey = Object.keys(GIF_DATABASE).find(key => 
              ex.name.toLowerCase().includes(key.toLowerCase())
            );
            
            return {
              ...ex,
              id: Date.now().toString() + Math.random(),
              thumb: matchKey ? GIF_DATABASE[matchKey] : undefined,
              // Aplica defaults se disponíveis e não vierem da IA
              sets: ex.sets || defaultSets || '3',
              reps: ex.reps || defaultReps || '12',
              rest: ex.rest || defaultRest || '60'
            };
          });

          setExercises(prev => [...prev, ...enrichedExercises]);
        } catch (error) {
          console.error("Erro ao analisar imagem:", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    const updatedExercises = [...exercises];
    
    for (let i = 0; i < updatedExercises.length; i++) {
      const ex = updatedExercises[i];
      // Generate image if it doesn't have a thumb or if it's using the default fallback
      if (!ex.thumb || ex.thumb.includes('unsplash') || ex.thumb.includes('pinterest')) {
        try {
          const result = await analyzeExerciseAndGenerateImage(ex.name);
          if (result && result.imageUrl) {
            updatedExercises[i] = { ...ex, thumb: result.imageUrl };
            setExercises([...updatedExercises]); // Update UI progressively
          }
        } catch (e) {
          console.error(`Failed to generate image for ${ex.name}`, e);
        }
      }
    }
    setIsGeneratingImages(false);
  };

  const updateExerciseRest = (idx: number, val: string) => {
    const updated = [...exercises];
    updated[idx] = { ...updated[idx], rest: val };
    setExercises(updated);
  };

  return (
    <div className="p-6 text-foreground bg-background h-screen overflow-y-auto custom-scrollbar text-left transition-colors">
      <header className="flex items-center justify-between mb-10 sticky top-0 bg-background/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-card rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
            <HeaderTitle text="Editor de Treino" />
          </h2>
        </div>
        <button 
          onClick={handleSaveWorkout} 
          disabled={saveState === 'loading'}
          className={`px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-xl transition-all flex items-center gap-2 ${saveState === 'loading' ? 'bg-orange-600 animate-pulse text-white' : saveState === 'saved' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {saveState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
          {saveState === 'loading' ? 'Salvando...' : saveState === 'saved' ? 'Salvo!' : 'Salvar'}
        </button>
      </header>

      <div className="space-y-6 pb-32">
        <Card className="p-6 bg-card/50 space-y-4 border-border">
           <div>
             <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1 block">Nome da Planilha</label>
             <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO DO TREINO" className="w-full bg-background border border-border p-5 rounded-2xl text-foreground font-black italic text-lg outline-none focus:border-red-600" />
           </div>
           
           <div>
             <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1 block">Validade (Sessões)</label>
             <input type="number" value={projectedSessions} onChange={e => setProjectedSessions(parseInt(e.target.value) || 0)} placeholder="Ex: 12" className="w-full bg-background border border-border p-5 rounded-2xl text-foreground font-black italic text-lg outline-none focus:border-red-600" />
             <p className="text-[8px] text-muted-foreground mt-2 uppercase tracking-wide">O contador inicia automaticamente após o primeiro treino concluído.</p>
           </div>

           {/* NOVA ÁREA DE PADRONIZAÇÃO */}
           <div className="pt-4 border-t border-border">
             <div className="flex justify-between items-center mb-2">
               <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] block">Padronização de Carga</label>
               <button 
                  onClick={handleApplyDefaults}
                  className="flex items-center gap-1 text-[8px] font-black uppercase text-red-500 hover:text-foreground transition-colors bg-red-600/10 px-2 py-1 rounded-md"
               >
                  <Copy size={10} /> Aplicar Padrão a Todos
               </button>
             </div>
             <div className="grid grid-cols-3 gap-3">
               <div>
                 <input type="text" value={defaultSets} onChange={e => setDefaultSets(e.target.value)} placeholder="SÉRIES" className="w-full bg-background border border-border p-4 rounded-xl text-foreground font-black italic text-sm outline-none focus:border-red-600 text-center" />
                 <p className="text-[7px] text-muted-foreground uppercase text-center mt-1 font-bold">Séries</p>
               </div>
               <div>
                 <input type="text" value={defaultReps} onChange={e => setDefaultReps(e.target.value)} placeholder="REPS" className="w-full bg-background border border-border p-4 rounded-xl text-foreground font-black italic text-sm outline-none focus:border-red-600 text-center" />
                 <p className="text-[7px] text-muted-foreground uppercase text-center mt-1 font-bold">Repetições</p>
               </div>
               <div>
                 <input type="text" value={defaultRest} onChange={e => setDefaultRest(e.target.value)} placeholder="SEG" className="w-full bg-background border border-border p-4 rounded-xl text-foreground font-black italic text-sm outline-none focus:border-red-600 text-center" />
                 <p className="text-[7px] text-muted-foreground uppercase text-center mt-1 font-bold">Descanso (s)</p>
               </div>
             </div>
           </div>
        </Card>

        <div className="space-y-4">
           {/* Cabeçalho da Lista + Botão Discreto de Importação */}
           <div className="flex items-center justify-between pl-2">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Exercícios ({exercises.length})</h3>
              
              <div className="flex items-center gap-4">
                {/* Botão Gerar Imagens IA */}
                <button 
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages || exercises.length === 0}
                  className="flex items-center gap-2 cursor-pointer group p-1 opacity-70 hover:opacity-100 transition-all disabled:opacity-30"
                >
                  {isGeneratingImages ? (
                    <div className="flex items-center gap-1">
                      <Loader2 size={12} className="text-indigo-500 animate-spin" />
                      <span className="text-[8px] font-black uppercase text-indigo-500">Gerando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-[7px] font-black uppercase text-muted-foreground group-hover:text-foreground transition-colors mr-1 hidden sm:block">Gerar Imagens 4K</span>
                      <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-indigo-600/50 group-hover:bg-secondary transition-all shadow-lg">
                        <Sparkles size={14} className="text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </>
                  )}
                </button>

                {/* Botão Discreto IA - Principal acesso ao ABFIT AI */}
                <div 
                   onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                   className="flex items-center gap-2 cursor-pointer group p-1 opacity-70 hover:opacity-100 transition-all"
                >
                    {isAnalyzing ? (
                       <div className="flex items-center gap-1">
                          <Loader2 size={12} className="text-orange-500 animate-spin" />
                          <span className="text-[8px] font-black uppercase text-orange-500">Lendo ABFIT AI...</span>
                       </div>
                    ) : (
                       <>
                          <span className="text-[7px] font-black uppercase text-muted-foreground group-hover:text-foreground transition-colors mr-1 hidden sm:block">Importar Print</span>
                          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-red-600/50 group-hover:bg-secondary transition-all shadow-lg">
                             <Scan size={14} className="text-muted-foreground group-hover:text-red-600 transition-colors" />
                          </div>
                       </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>
           </div>

           {exercises.map((ex, i) => (
             <div key={i} className="flex flex-col gap-2 bg-card p-4 rounded-2xl border border-border animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background rounded-xl overflow-hidden shrink-0 border border-border">
                     {ex.thumb || getExerciseGif(ex.name) ? (
                       <img src={ex.thumb || getExerciseGif(ex.name)!} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-secondary">
                         <Dumbbell size={16} className="text-muted-foreground"/>
                       </div>
                     )}
                  </div>
                  <div className="flex-1">
                     <p className="text-xs font-black uppercase italic text-foreground leading-tight">{ex.name}</p>
                     <p className="text-[10px] text-muted-foreground font-bold">
                        {ex.sets}x{formatReps(ex.reps)}{ex.method ? ` • ${ex.method}` : ''}
                     </p>
                  </div>
                  <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-600"><Trash2 size={16}/></button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                   <label className="text-[8px] font-black uppercase text-muted-foreground">Descanso:</label>
                   <input type="text" value={ex.rest} onChange={(e) => updateExerciseRest(i, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-[10px] text-foreground w-16 text-center outline-none focus:border-red-600" />
                </div>
             </div>
           ))}
           <button onClick={() => onBack()} className="w-full py-6 border-2 border-dashed border-border rounded-3xl text-muted-foreground text-[10px] font-black uppercase hover:border-red-600/30 hover:text-red-600 transition-all">
             Voltar
           </button>
        </div>
      </div>
    </div>
  );
}

import { BioimpedanceView } from './BioimpedanceView';

export function CoachAssessmentView({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  if (selectedAssessment && (selectedAssessment.type === 'BIOIMPEDANCE' || selectedAssessment.type === 'BIOIMPEDANCIA')) {
    return <BioimpedanceView assessment={selectedAssessment} allAssessments={student.physicalAssessments} onBack={() => setSelectedAssessment(null)} />;
  }

  const handleSave = async () => {
    if (!weight || !bodyFat) return; // Simple validation
    setSaving(true);
    
    const newAssessment = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      peso: weight,
      altura: height || (student.height as string) || '',
      bio_percentual_gordura: bodyFat
    };

    const updatedAssessments = [newAssessment, ...(student.physicalAssessments || [])];
    
    // Update assessments and current stats
    await onSave(student.id, { 
      physicalAssessments: updatedAssessments,
      weight: weight,
      height: height || student.height
    });
    
    setSaving(false);
    onBack();
  };

  return (
    <div className="p-6 text-foreground bg-background h-screen overflow-y-auto custom-scrollbar text-left transition-colors">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-background/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-border">
        <button onClick={onBack} className="p-2 bg-card rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
          <HeaderTitle text="Nova Avaliação" />
        </h2>
      </header>

      <Card className="p-6 bg-card/50 border-border space-y-6">
        <div>
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 block">Peso Corporal (kg)</label>
          <input 
            type="number" 
            value={weight} 
            onChange={e => setWeight(e.target.value)} 
            placeholder="0.0"
            className="w-full bg-background border border-border p-4 rounded-2xl text-foreground font-black italic text-lg outline-none focus:border-red-600"
          />
        </div>
        <div>
           <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 block">Altura (cm)</label>
           <input 
             type="number" 
             value={height} 
             onChange={e => setHeight(e.target.value)} 
             placeholder={String(student.height || '')}
             className="w-full bg-background border border-border p-4 rounded-2xl text-foreground font-black italic text-lg outline-none focus:border-red-600"
           />
        </div>
        <div>
           <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 block">Gordura Corporal (%)</label>
           <input 
             type="number" 
             value={bodyFat} 
             onChange={e => setBodyFat(e.target.value)} 
             placeholder="0.0"
             className="w-full bg-background border border-border p-4 rounded-2xl text-foreground font-black italic text-lg outline-none focus:border-red-600"
           />
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full py-4 bg-red-600 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-white"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Salvar Avaliação
        </button>
      </Card>
      
      {/* History List */}
      <div className="mt-8 space-y-4">
        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-2">Histórico Recente</h3>
        {(student.physicalAssessments || []).map(a => (
           <div 
             key={a.id} 
             onClick={() => setSelectedAssessment(a)}
             className="flex justify-between items-center p-4 bg-card rounded-2xl border border-border cursor-pointer hover:bg-card/80 transition-colors active:scale-95"
           >
              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <p className="text-xs font-black text-foreground">{new Date(a.data).toLocaleDateString('pt-BR')}</p>
                   {(a.type === 'BIOIMPEDANCE' || a.type === 'BIOIMPEDANCIA') && (
                     <span className="bg-white/10 text-white border border-white/30 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Bioimpedância</span>
                   )}
                 </div>
                 <p className="text-[10px] text-muted-foreground">{a.peso}kg • {a.gordura?.value || a.bio_percentual_gordura}% Gordura</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
           </div>
        ))}
      </div>
    </div>
  );
}

export function PeriodizationView({ student, onBack, onProceedToWorkout, onSave }: { student: Student, onBack: () => void, onProceedToWorkout: () => void, onSave: (id: string, data: any) => void }) {
   const p = student.periodization || {} as any;
   
   const [phaseTitle, setPhaseTitle] = useState(p.phaseTitle || '');
   const [generalStrategy, setGeneralStrategy] = useState(p.generalStrategy || '');
   const [safetyNotes, setSafetyNotes] = useState(p.clinicalSafety ? p.clinicalSafety.join('\n') : '');
   const [bioContext, setBioContext] = useState(p.bioInsight?.context || '');
   const [bioTips, setBioTips] = useState(p.bioInsight?.tips ? p.bioInsight.tips.join('\n') : '');
   const [targetVolume, setTargetVolume] = useState<Record<string, number>>(p.targetVolume || {});
   const [generating, setGenerating] = useState(false);
   
   const handleAI = async () => {
      setGenerating(true);
      const insight = await generateBioInsight({ name: student.nome, phase: phaseTitle });
      if (insight) {
          setBioContext(insight);
      }
      setGenerating(false);
   };

   const updateTargetVolume = (group: string, val: string) => {
      const num = parseInt(val) || 0;
      setTargetVolume(prev => ({ ...prev, [group]: num }));
   };

   const handleSave = () => {
      const newPeriodization: PeriodizationPlan = {
         ...p,
         id: p.id || Date.now().toString(),
         startDate: p.startDate || new Date().toISOString(),
         phaseTitle,
         generalStrategy,
         clinicalSafety: safetyNotes.split('\n').filter((s: string) => s.trim()),
         bioInsight: {
            context: bioContext,
            tips: bioTips.split('\n').filter((s: string) => s.trim())
         },
         targetVolume,
         type: 'STRENGTH'
      };
      
      onSave(student.id, { periodization: newPeriodization });
      onBack();
   };

   return (
    <div className="p-6 text-foreground bg-background h-screen overflow-y-auto custom-scrollbar text-left transition-colors">
      <header className="flex items-center justify-between mb-10 sticky top-0 bg-background/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-border">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 bg-card rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
           <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
             <HeaderTitle text="Periodização" />
           </h2>
        </div>
        <button onClick={onProceedToWorkout} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
           Ir para Treinos <ChevronRight size={12} />
        </button>
      </header>
      
      <div className="space-y-6 pb-20">
         <Card className="p-6 bg-card/50 border-border space-y-4">
            <div>
               <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 block">Fase Atual</label>
               <input type="text" value={phaseTitle} onChange={e => setPhaseTitle(e.target.value)} className="w-full bg-background border border-border p-4 rounded-2xl text-foreground font-bold text-sm outline-none focus:border-red-600" placeholder="Ex: Hipertrofia Metabólica" />
            </div>
            <div>
               <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 block">Estratégia Geral</label>
               <textarea rows={4} value={generalStrategy} onChange={e => setGeneralStrategy(e.target.value)} className="w-full bg-background border border-border p-4 rounded-2xl text-foreground text-sm outline-none focus:border-red-600 resize-none" placeholder="Descreva a estratégia macro..." />
            </div>
         </Card>

         {/* VOLUME ALVO POR GRUPO MUSCULAR */}
         <Card className="p-6 bg-card/50 border-border space-y-4">
            <div className="flex items-center gap-2 text-foreground mb-2">
               <Layers size={16} className="text-red-600" />
               <h3 className="text-[10px] font-black uppercase tracking-widest">Volume Alvo (Semanas)</h3>
            </div>
            <p className="text-[8px] text-muted-foreground uppercase font-bold mb-4">Defina o total de séries semanais proposto para cada grupo.</p>
            
            <div className="grid grid-cols-2 gap-4">
               {["Quadríceps e Adutores", "Peito", "Ombro", "Triceps", "Core e Abdomen", "Biceps", "Costas e Cintura Escapular", "Glúteos e Posteriores", "Panturrilha", "Paravertebrais"].map(group => (
                  <div key={group}>
                     <label className="text-[8px] font-black uppercase text-muted-foreground block mb-1 truncate">{group}</label>
                     <input 
                        type="number" 
                        value={targetVolume[group] || ''} 
                        onChange={e => updateTargetVolume(group, e.target.value)}
                        placeholder="0"
                        className="w-full bg-background border border-border p-3 rounded-xl text-foreground font-black text-xs outline-none focus:border-red-600"
                     />
                  </div>
               ))}
            </div>
         </Card>

         <Card className="p-6 bg-red-950/10 border-red-900/20 space-y-4">
             <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Segurança Clínica</h3>
             </div>
             <textarea rows={3} value={safetyNotes} onChange={e => setSafetyNotes(e.target.value)} className="w-full bg-background/50 border border-red-900/30 p-4 rounded-2xl text-muted-foreground text-sm outline-none focus:border-red-600 resize-none" placeholder="Uma nota por linha..." />
         </Card>

         <Card className="p-6 bg-gradient-to-br from-indigo-950/20 to-background border-indigo-900/20 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-indigo-500">
                   <Brain size={16} />
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Bio-Insight (IA)</h3>
                </div>
                <button onClick={handleAI} disabled={generating} className="bg-indigo-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase text-white hover:bg-indigo-700 transition-colors flex items-center gap-1">
                   {generating ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />} Gerar
                </button>
             </div>
             <textarea rows={3} value={bioContext} onChange={e => setBioContext(e.target.value)} className="w-full bg-background/50 border border-indigo-900/30 p-4 rounded-2xl text-muted-foreground text-sm outline-none focus:border-indigo-600 resize-none" placeholder="Contexto científico..." />
             <textarea rows={3} value={bioTips} onChange={e => setBioTips(e.target.value)} className="w-full bg-background/50 border border-indigo-900/30 p-4 rounded-2xl text-muted-foreground text-sm outline-none focus:border-indigo-600 resize-none" placeholder="Dicas práticas (uma por linha)..." />
         </Card>

         <button onClick={handleSave} className="w-full py-5 bg-foreground text-background rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-muted-foreground transition-all">
            Salvar Periodização
         </button>
      </div>
    </div>
   );
}
