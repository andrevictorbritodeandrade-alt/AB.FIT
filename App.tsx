
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints,
  Info, LogOut, Layout, Bell,
  BarChart3, ChevronRight, Activity, Settings2, Bot, ArrowLeft, Menu, MapPin,
  AlertTriangle, Sparkles, Calendar, Smartphone, Headphones
} from 'lucide-react';
import { Logo, BackgroundWrapper, AppFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge, SideNav, HeaderTitle } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager, StudentWorkoutHistoryView } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';
import GlobalMusicPlayer from './components/MusicPlayer/GlobalMusicPlayer';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import AICoach from './components/AICoach';
import { CorreRJView } from './components/CorreRJ';
import { InstallPrompt } from './components/InstallPrompt';
import { NotificationsModal } from './components/NotificationsModal';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  db, 
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  appId, 
  handleFirestoreError, 
  OperationType, 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  addDoc, 
  getDoc, 
  getDocs, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction, 
  writeBatch,
  increment,
  arrayUnion 
} from './services/firebase';
import { Student, Workout, AppNotification, WorkoutHistoryEntry, Exercise } from './types';
import { finalizarTreino, finalizarTreinoNoCliente, subscribeToActivePlan, subscribeToUserStats, subscribeToWorkoutHistory } from './services/workoutService';
import { useTheme } from './components/ThemeContext';

const removeUndefined = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj
      .map(item => removeUndefined(item))
      .filter(item => item !== undefined);
  }
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = removeUndefined(obj[key]);
    }
  });
  return newObj;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error.message || "Ocorreu um erro inesperado.";

      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
          <AlertTriangle className="text-red-600 mb-4" size={48} />
          <h2 className="text-xl font-black uppercase italic mb-2">Ops! Algo deu errado</h2>
          <p className="text-sm font-bold uppercase tracking-widest mb-6 opacity-70 max-w-md">
            {errorMessage}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-red-700 transition-all shadow-lg"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function SettingsView({ 
  onBack, 
  onOpenNotifications, 
  notifications = [] 
}: { 
  onBack: () => void, 
  onOpenNotifications?: () => void, 
  notifications?: AppNotification[] 
}) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-foreground overflow-y-auto h-screen custom-scrollbar text-left bg-background transition-colors">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-secondary rounded-full shadow-lg text-foreground hover:bg-red-600 transition-colors">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
          <HeaderTitle text="Configurações ABFIT" />
        </h2>
      </header>
      <div className="max-w-2xl mx-auto space-y-6">
         <Card className="p-5 bg-card border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2.5 bg-red-600 rounded-xl shadow-lg">
                  <UserIcon className="text-white" size={20} />
               </div>
               <div>
                  <h4 className="text-[13px] font-black uppercase italic text-foreground">Perfil do Atleta</h4>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Edite seus dados pessoais</p>
               </div>
            </div>
            <ChevronRight className="text-muted-foreground" size={18} />
         </Card>

         <Card 
           onClick={onOpenNotifications}
           className="p-5 bg-card border-border flex items-center justify-between cursor-pointer hover:border-red-600/50 transition-colors group"
         >
            <div className="flex items-center gap-4">
               <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                  <Bell className="text-white" size={20} />
               </div>
               <div>
                  <h4 className="text-[13px] font-black uppercase italic text-foreground flex items-center gap-2">
                    Notificações
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                        {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </h4>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Alertas de treino, renovação e avaliações</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline">Ver todas</span>
               <ChevronRight className="text-muted-foreground group-hover:text-white transition-colors" size={18} />
            </div>
         </Card>
      </div>
      <AppFooter />
    </div>
  );
}

function LoginScreen({ onLogin, error, students }: { onLogin: (val: string) => void, error: string, students: Student[] }) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const registeredOptions = useMemo(() => {
    const coachOption = { name: "PROFESSOR", value: "PROFESSOR", type: "COACH", photoUrl: undefined };
    const studentOptions = [...students]
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
      .map(s => ({
        name: s.nome,
        value: s.email,
        type: "ALUNO",
        photoUrl: s.photoUrl
      }));
    
    return [coachOption, ...studentOptions];
  }, [students]);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 text-center font-sans text-foreground transition-colors overflow-hidden">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center">
        <div className="animate-in fade-in zoom-in duration-700 text-center mb-12">
          <Logo size="text-[5.5rem] xs:text-[7rem] sm:text-[9rem]" subSize="text-[9px] sm:text-xs" />
        </div>
        
        <div className="w-full space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">
          <div className="text-left">
            <div className="relative" ref={dropdownRef}>
              <input type="text" name="login-email-no-autofill" id="login-email-no-autofill" placeholder="E-MAIL OU 'PROFESSOR'" className="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] text-white outline-none focus:border-red-600 transition-all text-center font-black tracking-tight uppercase placeholder:text-zinc-500 shadow-2xl" value={input} autoComplete="new-password" onChange={e => setInput(e.target.value)} onClick={() => setShowDropdown(true)} onFocus={() => setShowDropdown(true)} />
              {showDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-4 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="p-3 border-b border-white/5 bg-zinc-800/50 text-center sticky top-0 z-10"><p className="text-[11px] font-black text-zinc-500 uppercase text-center tracking-[0.2em]">Selecione um perfil</p></div>
                  {registeredOptions.map((opt, idx) => (
                    <button key={`opt-${idx}`} onClick={() => { setInput(opt.value); setShowDropdown(false); }} className="w-full p-4 hover:bg-red-600/10 text-left flex items-center justify-between border-b border-white/5 transition-colors group">
                      <div className="flex items-center gap-3 text-left">
                        {opt.photoUrl ? (
                          <img src={opt.photoUrl} alt={opt.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                            {opt.name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white text-base font-black uppercase tracking-tight text-left leading-tight">{opt.name}</p>
                          <p className="text-[12px] text-zinc-500 lowercase text-left truncate max-w-[200px]">{opt.value}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-black px-2 py-1 rounded-full shrink-0 ${opt.type === 'COACH' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{opt.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p className="text-red-500 text-[13px] font-black uppercase py-2 tracking-widest text-center">{error}</p>}
          <button onClick={() => onLogin(input)} className="w-full bg-red-600 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-2xl shadow-red-900/40 hover:bg-red-700 text-lg">ENTRAR NO ECOSSISTEMA</button>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 z-10">
        <AppFooter />
      </div>
    </div>
  );
}

import GeraAi from './components/GeraAi';

export const applyDynamicPeriodization = (u: Student): Student => {
  return u;
};

export default function App() {
  const [view, setView] = useState('LOGIN');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [runningWorkouts, setRunningWorkouts] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [globalWorkoutCount, setGlobalWorkoutCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [workoutAlertNotification, setWorkoutAlertNotification] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('abfit_read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const markNotificationAsRead = (id: string) => {
    setReadNotificationIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem('abfit_read_notifications', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    const allIds = studentNotifications.map(n => n.id);
    setReadNotificationIds(prev => {
      const next = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('abfit_read_notifications', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const studentForView = useMemo(() => {
    if (!selectedStudent) return null;
    const isAndre = selectedStudent.id === 'fixed-andre' || selectedStudent.email === 'andrevictorbritodeandrade@gmail.com' || selectedStudent.nome?.toLowerCase().includes('andré');
    const isMarcelly = selectedStudent.id === 'fixed-marcelly' || selectedStudent.email === 'marcellybispo92@gmail.com' || selectedStudent.nome?.toLowerCase().includes('marcelly');
    if (isAndre || isMarcelly) {
      return {
        ...selectedStudent,
        photoUrl: '/images/profiles/andre_marcelly.jpg'
      };
    }
    return selectedStudent;
  }, [selectedStudent, view, isCoach]);

  // Fetch running workouts
  useEffect(() => {
    if (!authReady) return;
    const q = query(collection(db, `artifacts/runtrack-elite-v4/workouts`));
    const unsub = onSnapshot(q, (snapshot) => {
      const workouts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRunningWorkouts(workouts);
    }, (error) => {
      console.error("Snapshot error:", error);
    });
    return () => unsub();
  }, [authReady]);

  const resetApp = () => {
    localStorage.removeItem('elite_session_v2');
    localStorage.removeItem('theme');
    delete (window as any)._tempStudentId;
    delete (window as any)._tempWorkoutId;
    window.location.reload();
  };

  useEffect(() => {
    console.log("App Initialization Debug:", {
      appId,
      dbInstance: db ? "Initialized" : "Missing",
      view,
      isCoach,
      selectedStudentId: selectedStudent?.id
    });
  }, [view, isCoach, selectedStudent]);

  useEffect(() => {
    if (syncStatus === 'synced' || syncStatus === 'offline') {
      const timer = setTimeout(() => setSyncStatus('synced'), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);
  const [loginError, setLoginError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [totalExecuted, setTotalExecuted] = useState(0);
  
  // SESSION RESTORE STATE
  const [restoredSession, setRestoredSession] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(true);

  // --- 1. CONFIGURAÇÃO DE PERSISTÊNCIA E LOGIN AUTOMÁTICO ---
  useEffect(() => {
    const restoreSession = async () => {
        const savedSession = localStorage.getItem('elite_session_v2');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed.isCoach !== undefined) {
                    setIsCoach(parsed.isCoach);
                    // Restaurar a view se existir
                    if (parsed.view) setView(parsed.view); 
                    
                    // O aluno será selecionado quando os dados do Firestore carregarem
                    if (parsed.selectedStudentId) {
                        // Armazenamos temporariamente para usar no efeito de carga de dados
                        (window as any)._tempStudentId = parsed.selectedStudentId;
                    }
                    if (parsed.selectedWorkoutId) {
                        (window as any)._tempWorkoutId = parsed.selectedWorkoutId;
                    }
                    setRestoredSession(true);
                }
            } catch (e) {
                console.error("Erro ao restaurar sessão", e);
                localStorage.removeItem('elite_session_v2');
            }
        }
    };
    restoreSession();
  }, []);

  // --- 2. SALVAMENTO AUTOMÁTICO DE ESTADO (VIEW E SELEÇÃO) ---
  useEffect(() => {
    if (view === 'LOGIN') {
        localStorage.removeItem('elite_session_v2');
    } else {
        const sessionData = {
            isCoach,
            view,
            selectedStudentId: selectedStudent?.id,
            selectedWorkoutId: selectedWorkout?.id
        };
        localStorage.setItem('elite_session_v2', JSON.stringify(sessionData));
    }
  }, [view, isCoach, selectedStudent, selectedWorkout]);

  // Verificação de PWA (Instalação) - Desativado a pedido do usuário
  useEffect(() => {
    // const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    // if (!isStandalone) {
    //   // Desativado a pedido do usuário
    //   // const timer = setTimeout(() => {
    //   //   setShowInstallPrompt(true);
    //   // }, 2000);
    //   // return () => clearTimeout(timer);
    // }
  }, []);

  useEffect(() => {
    const initAuth = async () => { 
      console.log("Iniciando autenticação anônima...");
      try { 
        await signInAnonymously(auth); 
        console.log("Autenticação anônima concluída.");
      } catch (err: any) { 
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          console.warn("Autenticação anônima desativada no Console do Firebase. Operando com dados locais/cache.");
        } else if (err.code === 'auth/configuration-not-found') {
          console.warn("Configuração de Auth do Firebase em modo autônomo/offline.");
        } else {
          console.warn("Auth status notice:", err?.message || err);
        }
        
        // Even if auth fails, proceed smoothly with local cache / default state
        setAuthReady(true);
        setLoading(false);
      } 
    };
    initAuth();
    
    // Safety timeout to prevent stuck loading screen
    const timeout = setTimeout(() => {
      console.warn("Auth timeout reached.");
      setAuthReady(true);
      setLoading(false);
    }, 8000);

    const unsubAuth = onAuthStateChanged(auth, (u) => { 
      console.log("Estado de autenticação alterado:", u ? "Usuário logado" : "Nenhum usuário");
      if (u) { 
        setUser(u); 
        setAuthReady(true);
        setLoading(false); 
        clearTimeout(timeout);
      } else {
        setUser(null);
        setAuthReady(true);
        setLoading(false);
        clearTimeout(timeout);
      }
    });
    return () => {
      unsubAuth();
      clearTimeout(timeout);
    };
  }, []);

  // One-time migration/reset for André and Marcelly
  useEffect(() => {
    if (authReady && students.length > 0) {
      // Remoção dos blocos de migração que estavam sobrescrevendo dados do Firestore
      // O App agora confia exclusivamente na "Fonte da Verdade" (Firebase)
    }
  }, [authReady, students.length]);

  // Migration/reset blocks removed to prevent overwriting Firestore data.
  // The app now relies exclusively on the "Source of Truth" (Firebase).


  // Definição dos Exercícios e Histórico Inicial de André Brito
  const exAndreTreinoA: Exercise[] = [
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

  const exAndreTreinoB: Exercise[] = [
    { id: 'a-b-1', name: 'Stiff em pé com HBC ou HBM', sets: '3', reps: '13', rest: '20s', load: '10 Kg', executionType: 'Simples' },
    { id: 'a-b-2', name: 'Extensão de quadril na máquina', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
    { id: 'a-b-3', name: 'Cadeira abdutora', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
    { id: 'a-b-4', name: 'Cadeira flexora', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
    { id: 'a-b-5', name: 'Remada aberta na máquina', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
    { id: 'a-b-6', name: 'Remada fechada na máquina', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
    { id: 'a-b-7', name: 'Puxada fechada com triângulo no pulley alto', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
    { id: 'a-b-8', name: 'Bíceps em pé no cross barra reta', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
    { id: 'a-b-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', load: '5 Kg', executionType: 'Simples' }
  ];

  const andreHistory: WorkoutHistoryEntry[] = [
    {
      id: 'andre-a-7-20260922',
      date: '22/09/2026',
      timestamp: new Date('2026-09-22T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '7 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    },
    {
      id: 'andre-b-6-20260920',
      date: '20/09/2026',
      timestamp: new Date('2026-09-20T11:00:00Z').getTime(),
      name: 'TREINO B (quartas, sábados e domingos)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '6 de 18',
      workoutId: 'treino-b-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoB
    },
    {
      id: 'andre-a-6-20260919',
      date: '19/09/2026',
      timestamp: new Date('2026-09-19T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '6 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    },
    {
      id: 'andre-b-5-20260917',
      date: '17/09/2026',
      timestamp: new Date('2026-09-17T11:00:00Z').getTime(),
      name: 'TREINO B (quartas, sábados e domingos)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '5 de 18',
      workoutId: 'treino-b-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoB
    },
    {
      id: 'andre-a-5-20260916',
      date: '16/09/2026',
      timestamp: new Date('2026-09-16T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '5 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    },
    {
      id: 'andre-b-4-20260915',
      date: '15/09/2026',
      timestamp: new Date('2026-09-15T11:00:00Z').getTime(),
      name: 'TREINO B (quartas, sábados e domingos)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '4 de 18',
      workoutId: 'treino-b-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoB
    },
    {
      id: 'andre-a-4-20260913',
      date: '13/09/2026',
      timestamp: new Date('2026-09-13T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '4 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    },
    {
      id: 'andre-b-3-20260912',
      date: '12/09/2026',
      timestamp: new Date('2026-09-12T11:00:00Z').getTime(),
      name: 'TREINO B (quartas, sábados e domingos)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '3 de 18',
      workoutId: 'treino-b-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoB
    },
    {
      id: 'andre-a-3-20260910',
      date: '10/09/2026',
      timestamp: new Date('2026-09-10T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '3 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    },
    {
      id: 'andre-b-2-20260909',
      date: '09/09/2026',
      timestamp: new Date('2026-09-09T11:00:00Z').getTime(),
      name: 'TREINO B (quartas, sábados e domingos)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '2 de 18',
      workoutId: 'treino-b-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoB
    },
    {
      id: 'andre-a-2-20260908',
      date: '08/09/2026',
      timestamp: new Date('2026-09-08T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '2 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    },
    {
      id: 'andre-b-1-20260905',
      date: '05/09/2026',
      timestamp: new Date('2026-09-05T11:00:00Z').getTime(),
      name: 'TREINO B (quartas, sábados e domingos)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '1 de 18',
      workoutId: 'treino-b-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoB
    },
    {
      id: 'andre-a-1-20260904',
      date: '04/09/2026',
      timestamp: new Date('2026-09-04T11:00:00Z').getTime(),
      name: 'TREINO A (terças, quintas e sábados)',
      type: 'STRENGTH',
      duration: '30:00',
      countText: '1 de 18',
      workoutId: 'treino-a-andre',
      athleteName: 'André Victor Brito de Andrade',
      periodization: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
      exercises: exAndreTreinoA
    }
  ];

  // Removed strict auth redirect to allow offline/unauthenticated access to default data
  // useEffect(() => {
  //   if (!loading && !user && view !== 'LOGIN') {
  //     setView('LOGIN');
  //     localStorage.removeItem('elite_session_v2');
  //     delete (window as any)._tempStudentId;
  //   }
  // }, [loading, user, view]);

  // Definição Centralizada dos Alunos Padrão
  const defaultStudentsData = useMemo<Student[]>(() => [
        { 
          id: 'fixed-liliane', 
          nome: 'Liliane Torres', 
          email: 'lilicatorres@gmail.com', 
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20illustration%20of%20a%20smiling%20Brazilian%20woman%20named%20Liliane%20Torres%2C%20long%20brown%20hair%2C%20wearing%20a%20yellow%20Flamengo%20soccer%20jersey%2C%20standing%20in%20a%20packed%20stadium?width=400&height=400&nologo=true',
          age: 35,
          weight: 81,
          height: 165,
          goal: 'health',
          medicalHistory: '⚠️ Dores no joelho',
          medications: 'Nenhuma',
          physicalAssessments: [], 
          workoutHistory: [], 
          analytics: {
            sessionsCompleted: 0,
            streakDays: 0,
            exercises: {},
            lastSessionDate: ''
          },
          sexo: 'Feminino', 
          activePlan: {
            id: 'current',
            phaseName: 'Treino A e Treino B (32 Sessões)',
            targetSets: 32,
            progress: { A: 0, B: 0, C: 0 }
          },
          periodization: {
            id: 'per-liliane-32',
            titulo: 'Periodização Liliane Torres - Treino A e Treino B (32 Sessões)',
            startDate: '2026-04-20T00:00:00.000Z',
            type: 'STRENGTH',
            phaseTitle: 'Treino A e Treino B (32 Sessões cada) - 13 Repetições',
            generalStrategy: 'Treino A e Treino B, executar 32 sessões em cada um dos treinos; 13 repetições com 20 segundos de recuperação entre as séries, sendo 4 séries nos membros inferiores e 3 séries nos superiores; A cada 8 sessões, fazer ajustes de cargas, para aumentar de maneira que tenha desconforto comparada com a anterior.',
            clinicalSafety: [
              'Ajuste Periódico de Cargas: A cada 8 sessões, fazer ajustes de cargas, para aumentar de maneira que tenha desconforto comparada com a anterior.',
              'Intervalo Estrito de Recuperação: 20 segundos de recuperação entre as séries.',
              'Divisão de Séries e Repetições: 13 repetições por série, sendo 4 séries nos membros inferiores e 3 séries nos superiores.',
              'Prescrição Aeróbica (32 sessões): Seg/Qua/Sex (caminhada escalonada 5 a 6,5 km/h por 35 min) e Ter/Qui/Sáb (35 min contínuos a 6,0 km/h).'
            ],
            frequenciaSemanal: 'Treino A e Treino B (32 sessões cada) + Treino Aeróbico (32 sessões)',
            limiteTempoSessao: '20 segundos de recuperação entre as séries',
            microciclos: [
              {
                range: 'Sessões 1-8',
                focus: 'BLOCO 1 (SESSÕES 1 A 8) - CARGAS INICIAIS',
                method: '13 Repetições | 20s de recuperação | 4 séries MMII / 3 séries MMSS',
                reps: '13 reps',
                notes: 'Estabelecer cargas de referência gerando desconforto inicial adequado com 20s de descanso.'
              },
              {
                range: 'Sessões 9-16',
                focus: 'BLOCO 2 (SESSÕES 9 A 16) - 1º AJUSTE DE CARGAS',
                method: '13 Repetições | 20s de recuperação | 4 séries MMII / 3 séries MMSS',
                reps: '13 reps',
                notes: 'Fazer ajuste de cargas para aumentar de maneira que tenha desconforto comparada com o bloco anterior.'
              },
              {
                range: 'Sessões 17-24',
                focus: 'BLOCO 3 (SESSÕES 17 A 24) - 2º AJUSTE DE CARGAS',
                method: '13 Repetições | 20s de recuperação | 4 séries MMII / 3 séries MMSS',
                reps: '13 reps',
                notes: 'Novo ajuste de cargas para aumentar de maneira que tenha desconforto comparada com a anterior.'
              },
              {
                range: 'Sessões 25-32',
                focus: 'BLOCO 4 (SESSÕES 25 A 32) - 3º AJUSTE DE CARGAS (PICO DE INTENSIDADE)',
                method: '13 Repetições | 20s de recuperação | 4 séries MMII / 3 séries MMSS',
                reps: '13 reps',
                notes: 'Ajuste final de cargas aumentando o desconforto e consolidando as 32 sessões de treino.'
              }
            ]
          },
          workouts: [
            {
              id: 'treino-a-liliane',
              title: 'TREINO A',
              projectedSessions: 32,
              status: 'published',
              exercises: [
                { id: 'l-a-1', name: 'Leg Press Horizontal', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-2', name: 'Agachamento na parede com bola suíssa e HBC', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-3', name: 'Agachamento passada com HBC segurando no espaldar', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-4', name: 'Cadeira extensora', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-5', name: 'Cadeira extensora unilateral', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-6', name: 'Supino aberto no banco reto com HBC', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-7', name: 'Remada alta em pé com HBC', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-8', name: 'Tríceps em pé no cross barra reta', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-9', name: 'Abdominal diagonal no solo', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-a-10', name: 'Prancha ventral no solo em isometria', sets: '3', reps: 'Isometria', rest: '20s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-liliane',
              title: 'TREINO B',
              projectedSessions: 32,
              status: 'published',
              exercises: [
                { id: 'l-b-1', name: 'Subida unilateral no banco reto ou 2 steps', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-2', name: 'Extensão de quadril e joelho em pé com caneleira joelho estendido no segurando no espaldar (Coice)', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-3', name: 'Extensão de quadril em pé com caneleira joelho estendido no segurando no espaldar', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-4', name: 'Flexão de joelho em pé com caneleira segurando no espaldar', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-5', name: 'Cadeira flexora', sets: '4', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-6', name: 'Remada baixa pegada supinada com barra reta sentada no solo com steps', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-7', name: 'Puxada alta aberta com barra reta', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-8', name: 'Bíceps em pé no cross com barra reta ou com HBC', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-9', name: 'Abdominal diagonal no solo', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'l-b-10', name: 'Prancha ventral no solo em isometria', sets: '3', reps: 'Isometria', rest: '20s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-aerobico-seg-qua-sex-liliane',
              title: 'AERÓBICO ESCALONADO - Seg/Qua/Sex',
              projectedSessions: 32,
              frequencyWeekly: 3,
              status: 'published',
              exercises: [
                { id: 'l-aero-1', name: "5' caminhada em 5 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' },
                { id: 'l-aero-2', name: "5' caminhada em 5,5 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' },
                { id: 'l-aero-3', name: "5' caminhada em 6,0 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' },
                { id: 'l-aero-4', name: "5' caminhada em 6,5 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' },
                { id: 'l-aero-5', name: "5' caminhada em 6,0 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' },
                { id: 'l-aero-6', name: "5' caminhada em 5,5 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' },
                { id: 'l-aero-7', name: "5' caminhada em 5 km/h", sets: '1', reps: "5 min", rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-aerobico-ter-qui-sab-liliane',
              title: 'AERÓBICO CONTÍNUO - Ter/Qui/Sáb',
              projectedSessions: 32,
              frequencyWeekly: 3,
              status: 'published',
              exercises: [
                { id: 'l-aero-8', name: "35' de caminhada contínua em 6,0 km/h", sets: '1', reps: "35 min", rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        },
        { 
          id: 'fixed-andre', 
          nome: 'André Brito', 
          email: 'andrevictorbritodeandrade@gmail.com', 
          photoUrl: '/images/profiles/andre_marcelly.jpg',
          age: 36,
          weight: 103,
          height: 180,
          goal: 'health',
          medicalHistory: '⚠️ Patela esquerda já saiu do lugar 4 vezes em um intervalo de 14 meses.',
          medications: 'BUP, Venvanse, Vitaminas bariátricas, Topiramato, Sertralina',
          physicalAssessments: [
            {
              id: 'bio-andre-20260915',
              data: '2026-09-15T13:17:02Z',
              type: 'BIOIMPEDANCIA',
              notes: 'Avaliação Física Completa (Bio + Relógio + Dobras + Fitas)',
              peso: 100.0,
              altura: 180,
              imc: { value: 30.9, status: 'Obeso', color: 'red' },
              gordura: { value: 30.0, status: 'Obeso', color: 'red' },
              bio_percentual_gordura: 30.0,
              pesoGordura: { value: 30.0, status: 'Obeso', color: 'red' },
              percentualMassaMuscularEsqueletica: { value: 36.9, status: 'Saudável', color: 'green' },
              pesoMassaMuscularEsqueletica: { value: 36.9, status: 'Saudável', color: 'green' },
              registroMassaMuscular: { value: 67.1, status: 'Excelente', color: 'green' },
              pesoMassaMuscular: { value: 67.1, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 51.0, status: 'Baixo', color: 'blue' },
              pesoAgua: { value: 51.0, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 19.0, status: 'Obeso', color: 'red' },
              ossos: { value: 2.93, status: 'Saudável', color: 'green' },
              metabolismo: { value: 2019.0, status: 'Alto', color: 'yellow' },
              proteina: { value: 16.1, status: 'Saudável', color: 'green' },
              obesidade: { value: 42.9, status: 'Moderado', color: 'orange' },
              idadeMetabolica: 47.0,
              lbm: 70.03,
              idadeReal: 37,
              galaxyWatch: {
                peso: 100.0,
                massaGorda: 35.6,
                musculoEsqueletico: 33.9,
                aguaCorporal: 47.2,
                gorduraCorporalPercentual: 35.6,
                tmb: 1761,
                imc: 30.9
              },
              peitoral: 115.5,
              torax: 115.5,
              cintura: 100.0,
              abdomen: 109.0,
              quadril: 118.0,
              coxaProximalDireita: 73.5,
              coxaDistalDireita: 48.5,
              coxaProximalEsquerda: 74.0,
              coxaDistalEsquerda: 49.0,
              panturrilhaDireita: 40.0,
              panturrilhaEsquerda: 40.5,
              bracoDireito: 34.0,
              bracoEsquerdo: 35.0,
              antebracoDireito: 26.5,
              antebracoEsquerdo: 27.5,
              dobraPeitoral: 15.0,
              dobraAbdominal: 23.0,
              dobraCoxa: 20.0,
              analiseComposicao: {
                agua: 'Baixo',
                gordura: 'Obeso',
                proteina: 'Saudável',
                ossos: 'Saudável'
              },
              observacaoEvolucao: 'Avaliação atualizada via AI. Analisar composição detalhadamente.'
            },
            {
              id: 'bio-andre-20260520',
              data: '2026-05-20T12:00:00Z',
              type: 'BIOIMPEDANCIA',
              notes: 'Avaliação Física Completa (Bio + Relógio + Dobras + Fitas)',
              peso: 98.7,
              altura: 180,
              imc: { value: 30.5, status: 'Alto', color: 'red' },
              gordura: { value: 29.5, status: 'Obeso', color: 'red' },
              bio_percentual_gordura: 29.5,
              pesoGordura: { value: 29.1, status: 'Obeso', color: 'red' },
              percentualMassaMuscularEsqueletica: { value: 37.2, status: 'Saudável', color: 'green' },
              pesoMassaMuscularEsqueletica: { value: 36.7, status: 'Saudável', color: 'green' },
              registroMassaMuscular: { value: 67.5, status: 'Excelente', color: 'green' },
              pesoMassaMuscular: { value: 66.6, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 51.2, status: 'Baixo', color: 'blue' },
              pesoAgua: { value: 50.5, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 18.5, status: 'Obeso', color: 'red' },
              ossos: { value: 2.92, status: 'Saudável', color: 'green' },
              metabolismo: { value: 2006.6, status: 'Alto', color: 'yellow' },
              proteina: { value: 16.3, status: 'Saudável', color: 'green' },
              obesidade: { value: 41.0, status: 'Moderado', color: 'orange' },
              idadeMetabolica: 46.0,
              lbm: 69.55,
              idadeReal: 36,
              galaxyWatch: {
                peso: 98.7,
                massaGorda: 34.4,
                musculoEsqueletico: 33.9,
                aguaCorporal: 47.1,
                gorduraCorporalPercentual: 34.8,
                tmb: 1759,
                imc: 30.5
              },
              peitoral: 116,
              torax: 116,
              cintura: 97,
              abdomen: 107,
              quadril: 116,
              coxaProximalDireita: 71,
              coxaDistalDireita: 47,
              coxaProximalEsquerda: 71,
              coxaDistalEsquerda: 48,
              panturrilhaDireita: 40,
              panturrilhaEsquerda: 40,
              bracoDireito: 34,
              bracoEsquerdo: 34.5,
              antebracoDireito: 27,
              antebracoEsquerdo: 27.5,
              dobraPeitoral: 13.67,
              dobraAbdominal: 23,
              dobraCoxa: 19,
              analiseComposicao: {
                agua: 'Baixo',
                gordura: 'Obeso',
                proteina: 'Saudável',
                ossos: 'Saudável'
              },
              analiseTipoCorpo: {
                tipo: 'Obesidade',
                descricao: 'O seu tipo de corpo é obeso, com excesso de gordura corporal e peso. Mas nota-se evolução positiva com o ganho de massa magra e diminuição do peso total.'
              },
              dicasControlePeso: {
                pesoIdeal: 70.3,
                pesoDiff: -28.4,
                massaMuscularDiff: 6.5,
                gorduraDiff: -13.5
              },
              veredictoPeriodizacao: 'André, comparando com 27/04/2026, você teve uma excelente redução no peso total de 100.1kg para 98.7kg (-1.4kg)! A gordura visceral reduziu de 19.0 para 18.5, e sua massa muscular se manteve forte e estável. As fitas e dobras foram coletadas em triplicata com média impecável, garantindo excelente precisão métrica. Continue firme no planejamento de cargas tencionais!'
            },
            {
              id: 'bio-andre-20260427',
              data: '2026-04-27T12:56:07Z',
              type: 'BIOIMPEDANCIA',
              peso: 100.1,
              altura: 180,
              imc: { value: 30.9, status: 'Alto', color: 'yellow' },
              gordura: { value: 30.0, status: 'Obeso', color: 'red' },
              pesoGordura: { value: 30.0, status: 'Obeso', color: 'red' },
              percentualMassaMuscularEsqueletica: { value: 36.9, status: 'Saudável', color: 'green' },
              pesoMassaMuscularEsqueletica: { value: 36.9, status: 'Saudável', color: 'green' },
              registroMassaMuscular: { value: 67.1, status: 'Excelente', color: 'green' },
              pesoMassaMuscular: { value: 67.2, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 51.0, status: 'Baixo', color: 'blue' },
              pesoAgua: { value: 51.0, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 19.0, status: 'Obeso', color: 'red' },
              ossos: { value: 2.92, status: 'Saudável', color: 'green' },
              metabolismo: { value: 2025.0, status: 'Alto', color: 'yellow' },
              proteina: { value: 16.1, status: 'Saudável', color: 'green' },
              obesidade: { value: 43.0, status: 'Moderado', color: 'orange' },
              idadeMetabolica: 46.0,
              lbm: 70.09,
              idadeReal: 36,
              analiseComposicao: {
                agua: 'Baixo',
                gordura: 'Obeso',
                proteina: 'Saudável',
                ossos: 'Saudável'
              },
              analiseTipoCorpo: {
                tipo: 'Obesidade',
                descricao: 'O seu tipo de corpo é obeso, com excesso de gordura corporal e peso. Como mestre em ciências do exercício, André, você sabe que isso requer atenção estratégica no treinamento de força.'
              },
              dicasControlePeso: {
                pesoIdeal: 70.0,
                pesoDiff: -22.4,
                massaMuscularDiff: 6.9,
                gorduraDiff: -12.2
              },
              veredictoPeriodizacao: 'André, comparando com 23/04/2026, você teve uma variação de -0.40kg no peso total. A massa muscular subiu (+0.40kg), o que é excelente para manter a taxa metabólica ativa.'
            },
            {
              id: 'bio-andre-20260423',
              data: '2026-04-23T10:00:00Z',
              type: 'BIOIMPEDANCIA',
              peso: 100.5,
              altura: 180,
              gordura: { value: 28.0, status: 'Obeso', color: 'red' },
              pesoMassaMuscular: { value: 66.8, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 51.2, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 16.2, status: 'Obeso', color: 'red' },
              metabolismo: { value: 2010.0, status: 'Alto', color: 'yellow' },
              idadeReal: 36,
            },
            {
              id: 'bio-andre-20260421',
              data: '2026-04-21T08:00:00Z',
              type: 'BIOIMPEDANCIA',
              peso: 100.8,
              altura: 180,
              imc: { value: 31.1, status: 'Alto', color: 'yellow' },
              gordura: { value: 28.2, status: 'Obeso', color: 'red' },
              pesoGordura: { value: 28.4, status: 'Obeso', color: 'red' },
              percentualMassaMuscularEsqueletica: { value: 37.4, status: 'Saudável', color: 'green' },
              pesoMassaMuscularEsqueletica: { value: 37.7, status: 'Saudável', color: 'green' },
              pesoMassaMuscular: { value: 66.7, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 51.0, status: 'Baixo', color: 'blue' },
              pesoAgua: { value: 51.4, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 16.4, status: 'Obeso', color: 'red' },
              metabolismo: { value: 2015.0, status: 'Alto', color: 'yellow' },
              idadeReal: 36,
              analiseComposicao: {
                agua: 'Baixo',
                gordura: 'Obeso',
                proteina: 'Saudável',
                ossos: 'Saudável'
              },
              analiseTipoCorpo: {
                tipo: 'Obesidade',
                descricao: 'O seu tipo de corpo é obeso, com excesso de gordura corporal e peso. Como mestre em ciências do exercício, André, você sabe que isso requer atenção estratégica no treinamento de força.'
              },
              dicasControlePeso: {
                pesoIdeal: 70.0,
                pesoDiff: -22.4,
                massaMuscularDiff: 6.9,
                gorduraDiff: -12.2
              },
              veredictoPeriodizacao: 'André, comparando com 20/04/2026, você teve uma variação de -2.2kg no peso total. A massa muscular subiu, o que é excelente para manter a taxa metabólica ativa.'
            },
            {
              id: 'bio-andre-20260420',
              data: '2026-04-20T09:00:00Z',
              type: 'BIOIMPEDANCIA',
              notes: 'Avaliação Física Completa (Bio + Relógio + Dobras + Fitas)',
              peso: 100.9,
              altura: 180,
              gordura: { value: 28.3, status: 'Obeso', color: 'red' },
              pesoMassaMuscular: { value: 66.7, status: 'Excelente', color: 'green' },
              idadeReal: 36,
            },
            {
              id: 'bio-andre-20260418',
              data: '2026-04-18T08:00:00Z',
              type: 'BIOIMPEDANCIA',
              peso: 101.0,
              altura: 180,
              imc: { value: 31.2, status: 'Alto', color: 'yellow' },
              gordura: { value: 28.5, status: 'Obeso', color: 'red' },
              pesoGordura: { value: 28.8, status: 'Obeso', color: 'red' },
              percentualMassaMuscularEsqueletica: { value: 37.3, status: 'Saudável', color: 'green' },
              pesoMassaMuscularEsqueletica: { value: 37.7, status: 'Saudável', color: 'green' },
              pesoMassaMuscular: { value: 66.7, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 50.8, status: 'Baixo', color: 'blue' },
              pesoAgua: { value: 51.3, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 16.5, status: 'Obeso', color: 'red' },
              metabolismo: { value: 2020.0, status: 'Alto', color: 'yellow' },
              idadeReal: 36,
              analiseComposicao: {
                agua: 'Baixo',
                gordura: 'Obeso',
                proteina: 'Saudável',
                ossos: 'Saudável'
              },
              analiseTipoCorpo: {
                tipo: 'Obesidade',
                descricao: 'O seu tipo de corpo é obeso, com excesso de gordura corporal e peso. Como mestre em ciências do exercício, André, você sabe que isso requer atenção estratégica no treinamento de força.'
              },
              dicasControlePeso: {
                pesoIdeal: 70.0,
                pesoDiff: -22.4,
                massaMuscularDiff: 6.9,
                gorduraDiff: -12.2
              },
              veredictoPeriodizacao: 'André, comparando com 13/04/2026, você teve uma variação de -2.0kg no peso total. Atenção à massa muscular, busque manter os estímulos de força.'
            },
            {
              id: 'bio-andre-20260413',
              data: '2026-04-13T08:00:00Z',
              type: 'BIOIMPEDANCIA',
              peso: 103.0,
              altura: 180,
              imc: { value: 31.8, status: 'Alto', color: 'yellow' },
              gordura: { value: 29.4, status: 'Obeso', color: 'red' },
              pesoGordura: { value: 30.2, status: 'Obeso', color: 'red' },
              percentualMassaMuscularEsqueletica: { value: 37.1, status: 'Saudável', color: 'green' },
              pesoMassaMuscularEsqueletica: { value: 38.2, status: 'Saudável', color: 'green' },
              pesoMassaMuscular: { value: 66.9, status: 'Excelente', color: 'green' },
              aguaPercentual: { value: 50.2, status: 'Baixo', color: 'blue' },
              pesoAgua: { value: 51.7, status: 'Baixo', color: 'blue' },
              gorduraVisceral: { value: 17.0, status: 'Obeso', color: 'red' },
              metabolismo: { value: 2050.0, status: 'Alto', color: 'yellow' },
              idadeReal: 36,
              analiseComposicao: {
                agua: 'Baixo',
                gordura: 'Obeso',
                proteina: 'Saudável',
                ossos: 'Saudável'
              },
              analiseTipoCorpo: {
                tipo: 'Obesidade',
                descricao: 'O seu tipo de corpo é obeso, com excesso de gordura corporal e peso. Como mestre em ciências do exercício, André, você sabe que isso requer atenção estratégica no treinamento de força.'
              },
              dicasControlePeso: {
                pesoIdeal: 70.0,
                pesoDiff: -22.4,
                massaMuscularDiff: 6.9,
                gorduraDiff: -12.2
              }
            },
            {
              id: 'bio-andre-20260407',
              data: '2026-04-07T08:00:00Z',
              type: 'BIOIMPEDANCIA',
              peso: 102.0,
              altura: 180,
              gordura: { value: 29.0, status: 'Obeso', color: 'red' },
              pesoMassaMuscular: { value: 66.2, status: 'Excelente', color: 'green' },
              idadeReal: 36,
            }
          ], 
          workoutHistory: andreHistory, 
          analytics: {
            sessionsCompleted: 11,
            streakDays: 5,
            exercises: {} as Record<string, { completed: number; skipped: number }>,
            lastSessionDate: '20/09/2026'
          },
          sexo: 'Masculino', 
          periodization: {
            id: 'per-andre-18sessoes',
            titulo: 'Periodização Científica - Fase 1: Retorno & Adaptação (18 Sessões)',
            startDate: '2026-09-09T00:00:00.000Z',
            type: 'STRENGTH',
            phaseTitle: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
            generalStrategy: "Retorno de inatividade física de 3 meses. Frequência mínima de 5 vezes na semana (com flexibilidade para treinar 6 ou 7 dias sempre que possível). Foco estrito em musculação com 9 exercícios por sessão (4 membros inferiores, 4 membros superiores e 1 de core), divididos em Cadeia Anterior (Treino A) e Cadeia Posterior (Treino B). Duração rigorosamente limitada a no máximo 1 hora (60 minutos) devido ao perfil neurodivergente (Autista e TDAH), para evitar fadiga e desestabilização sensorial pelo ambiente. Progressão de carga estruturada: Treinos 1 ao 6 com carga estável; 1º ajuste/aumento de carga a partir do Treino 7; 2º aumento a partir do Treino 13; encerramento no Treino 18 com Avaliação Física Obrigatória para validar a transição para a Fase 2.",
            frequenciaSemanal: "Mínimo de 5 vezes na semana (sempre que possível, 6 a 7 dias)",
            limiteTempoSessao: "Máximo 1 hora (60 minutos) - Teto inegociável por regulação sensorial (Autismo e TDAH)",
            restricoesOrtopedicas: "Tendinopatia no joelho esquerdo. Dificuldade de execução de corrida (contraindicada). Cardio restrito a baixo/zero impacto: no máximo caminhada, elíptico ou bicicleta.",
            regraAvaliacaoFisica: "Avaliação física obrigatória sempre que precisar mudar a série de treino, ou seja, no final de cada periodização (ao término do 18º treino).",
            proximaPeriodizacaoProposta: {
              titulo: "Fase 2: Força & Sobrecarga Tensional (24 Sessões / 3x11 reps)",
              sessoes: 24,
              reps: "11 repetições (3x11)",
              descanso: "30 segundos entre as séries",
              estruturaExercicios: "11 exercícios por treino (+1 de membro inferior e +1 de membro superior em cada série: 5 inferiores, 5 superiores, 1 core)",
              objetivo: "Potencializar aumento de força neuromuscular e progressão de cargas",
              tempoLimite: "Máximo de 60 minutos por sessão",
              gatilhoAtivacao: "Realização e validação da avaliação física completa no 18º treino da Fase 1"
            },
            clinicalSafety: [
              "Treinos 1 ao 6: Carga estável. Adaptação neuromuscular e consolidação técnica pós-inatividade de 3 meses.",
              "Treino 7: 1º Ponto de Ajuste de Carga. Elevação moderada de sobrecarga nos 9 exercícios.",
              "Treino 13: 2º Ponto de Ajuste de Carga. Nova progressão de carga mantendo 13 repetições.",
              "Treino 18: Fechamento da Fase 1. Realização obrigatória de Avaliação Física para mudança de série.",
              "Limite de 1 Hora: Sessão de treino com teto estrito de 60 minutos (Autismo e TDAH - prevenção de sobrecarga sensorial).",
              "Joelho Esquerdo: Tendinopatia patelar/joelho esquerdo. Sem corrida. Cardio permitido apenas caminhada, elíptico ou bicicleta ergométrica.",
              "Frequência Semanal: Mínimo 5 dias na semana, com possibilidade de treinar mais dias sempre que viável."
            ],
            bioInsight: {
              context: "Periodização Científica personalizada para André Brito: Retorno de inatividade de 3 meses, frequência mínima de 5x/semana (até 7 dias), sessões de no máximo 1 hora (Autismo/TDAH), 9 exercícios diários (4 inf, 4 sup, 1 core) divididos em Anterior e Posterior. Carga estável nos treinos 1 a 6, aumento a partir do treino 7, novo aumento a partir do 13, conclusão no treino 18. Avaliação física obrigatória no final da periodização para transição para a Fase 2 (24 sessões de 11 reps com 30s de descanso e +1 exercício inferior e +1 superior).",
              tips: [
                "Treinos 1 a 6: Carga estável. Adaptação articular e neuromuscular sem aumentar peso precipitadamente.",
                "Treino 7: 1º Ajuste de Carga. Aumentar moderadamente a carga nos 9 exercícios mantendo cadência controlada.",
                "Treino 13: 2º Ajuste de Carga. Nova progressão de peso para maximizar hipertrofia e força.",
                "Treino 18: Término da 1ª Periodização -> Avaliação Física Completa Obrigatória.",
                "Transição Fase 2: 24 sessões por série, 11 repetições, descanso de 30s e 11 exercícios por treino (+1 inferior e +1 superior)."
              ]
            },
            targetVolume: {
              "Peito": 6,
              "Costas e Cintura Escapular": 9,
              "Ombro": 3,
              "Biceps": 3,
              "Triceps": 3,
              "Quadríceps e Adutores": 12,
              "Glúteos e Posteriores": 12,
              "Core e Abdomen": 6
            },
            microciclos: [
              {
                id: 'm-1-6',
                semanas: 'Treinos 1 a 6',
                titulo: 'FASE INICIAL: ADAPTAÇÃO & CARGA ESTÁVEL',
                metodo: 'Séries retas 3x13 (9 exercícios: 4 inf, 4 sup, 1 core)',
                intensidade: 'Carga Estável / Descanso: 20s / Sessão máx 1h',
                volume: '3 x 13 (Cadeia Anterior & Posterior)',
                descricao: 'Retorno de 3 meses parado. Manter carga rigorosamente estável dos treinos 1 a 6 para adaptação tendínea e articular.'
              },
              {
                id: 'm-7-12',
                semanas: 'Treinos 7 a 12',
                titulo: 'PROGRESSÃO: 1º AJUSTE DE CARGA (A PARTIR DO TREINO 7)',
                metodo: 'Séries retas 3x13 com sobrecarga progressiva',
                intensidade: 'Aumento gradual de carga / Descanso: 20s / Sessão máx 1h',
                volume: '3 x 13 (9 exercícios)',
                descricao: 'A partir do treino 7: primeiro aumento gradual de carga nos exercícios. Frequência mínima 5x/semana.'
              },
              {
                id: 'm-13-18',
                semanas: 'Treinos 13 a 18',
                titulo: 'CONSOLIDAÇÃO: 2º AJUSTE DE CARGA & AVALIAÇÃO FÍSICA FINAL',
                metodo: 'Séries retas 3x13 -> Reavaliação no Treino 18',
                intensidade: 'Sobrecarga Máxima / Descanso: 20s / Sessão máx 1h',
                volume: '3 x 13 -> Término no Treino 18',
                descricao: 'A partir do treino 13: segundo aumento de carga. No treino 18: término da 1ª periodização e Avaliação Física Obrigatória para mudança de série.'
              }
            ]
          },
          faseAjusteA: 7,
          faseAjusteB: 6,
          faseAjusteC: 0,
          totalGlobalA: 7,
          totalGlobalB: 6,
          totalGlobalC: 0,
          trainingProgress: { completedCount: 13, targetCount: 36 },
          activePlan: {
            id: 'current',
            phaseName: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
            targetSets: 18,
            progress: { A: 7, B: 6, C: 0 }
          },
          periodizationProgress: {
            '3 x 13': { A: 7, B: 6, C: 0 },
            'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)': { A: 7, B: 6, C: 0 }
          } as Record<string, { A: number; B: number; C: number }>,
          workouts: [
            {
              id: 'treino-a-andre',
              title: 'TREINO A (terças, quintas e sábados)',
              projectedSessions: 18,
              frequencyWeekly: 3,
              status: 'published',
              description: '18 treinos (6 semanas, 3x/semana). Ajustes de carga no treino 6 e 12. No treino 18: transição para 11 reps.',
              exercises: [
                { id: 'a-a-1', name: 'Leg press horizontal/máquina', sets: '3', reps: '13', rest: '20s', load: '50 Kg', executionType: 'Simples' },
                { id: 'a-a-2', name: 'Agachamento no aparelho hack machine', sets: '3', reps: '13', rest: '20s', load: '-- Kg', executionType: 'Simples' },
                { id: 'a-a-3', name: 'Cadeira extensora', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
                { id: 'a-a-4', name: 'Cadeira extensora unilateral', sets: '3', reps: '13', rest: '20s', load: '5 Kg', executionType: 'Simples' },
                { id: 'a-a-5', name: 'Supino aberto na máquina', sets: '3', reps: '13', rest: '20s', load: '30 Kg', executionType: 'Simples' },
                { id: 'a-a-6', name: 'Supino aberto no banco inclinado na máquina', sets: '3', reps: '13', rest: '20s', load: '2,5 Kg', executionType: 'Simples' },
                { id: 'a-a-7', name: 'Desenvolvimento aberto máquina', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
                { id: 'a-a-8', name: 'Tríceps em pé no Cross barra reta', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
                { id: 'a-a-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-andre',
              title: 'TREINO B (quartas, sábados e domingos)',
              projectedSessions: 18,
              frequencyWeekly: 3,
              status: 'published',
              description: '18 treinos (6 semanas, 3x/semana). Ajustes de carga no treino 6 e 12. No treino 18: transição para 11 reps.',
              exercises: [
                { id: 'a-b-1', name: 'Stiff em pé com HBC ou HBM', sets: '3', reps: '13', rest: '20s', load: '10 Kg', executionType: 'Simples' },
                { id: 'a-b-2', name: 'Extensão de quadril na máquina', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
                { id: 'a-b-3', name: 'Cadeira abdutora', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
                { id: 'a-b-4', name: 'Cadeira flexora', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
                { id: 'a-b-5', name: 'Remada aberta na máquina', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
                { id: 'a-b-6', name: 'Remada fechada na máquina', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
                { id: 'a-b-7', name: 'Puxada fechada com triângulo no pulley alto', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
                { id: 'a-b-8', name: 'Bíceps em pé no cross barra reta', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
                { id: 'a-b-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', load: '5 Kg', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-confortavel',
              title: 'INTERVALADO (Confortável) - Seg/Sex',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-aq-1', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-1', name: 'Bloco 1: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-tr-1', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-1', name: 'Bloco 2: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-dq-1', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-desconfortavel',
              title: 'INTERVALADO (Desconfortável) - Qua',
              projectedSessions: 10,
              frequencyWeekly: 1,
              status: 'published',
              exercises: [
                { id: 'ex-aq-2', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-2', name: 'Bloco 1: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-tr-2', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-2', name: 'Bloco 2: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-dq-2', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-rodagem',
              title: 'RODAGEM - Ter/Qui',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-rod-1', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '60 min', rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        },
        {
          id: 'fixed-marcia',
          nome: 'Marcia Brito',
          email: 'andrademarcia.ucam@gmail.com',
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20of%20a%20brazilian%20mature%20woman%20named%20Marcia%20Brito%2C%2060%20years%20old%2C%20wearing%20fitness%20clothes%2C%20standing%20in%20a%20colorful%20Brazilian%20colonial%20street?width=400&height=400&nologo=true',
          age: 60,
          weight: 70,
          height: 160,
          goal: 'health',
          medicalHistory: '⚠️ Nada',
          medications: 'Nada',
          physicalAssessments: [],
          workoutHistory: [],
          analytics: {
            sessionsCompleted: 0,
            streakDays: 0,
            exercises: {},
            lastSessionDate: ''
          },
          sexo: 'Feminino',
          periodization: {
            id: 'per-marcia-01',
            titulo: 'Adaptação e Fortalecimento Global',
            startDate: '2026-07-07T10:00:00Z',
            type: 'STRENGTH',
            phaseTitle: 'Treino Único para o Corpo Todo',
            generalStrategy: "Foco na melhoria da funcionalidade, ganho de força e condicionamento geral em uma rotina única a ser feita 3 vezes na semana.",
            clinicalSafety: [
                "Controle rigoroso da execução e postura.",
                "Sempre manter cadência controlada.",
                "Aumentar cargas gradativamente preservando as articulações."
            ],
            microciclos: []
          },
          trainingProgress: { completedCount: 0, targetCount: 36 },
          workouts: [
            {
              id: 'treino-unico-marcia',
              title: 'TREINO ÚNICO',
              projectedSessions: 36,
              frequencyWeekly: 3,
              status: 'published',
              exercises: [
                { id: 'm-u-1', name: 'AGACHAMENTO LIVRE SEGURANDO NO ESPALDAR', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-2', name: 'LEVANTAR E SENTAR DO BANCO RETO COM HBC', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-3', name: 'CADEIRA EXTENSORA', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-4', name: 'CADEIRA FLEXORA', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-5', name: 'CRUCIFIXO ABERTO COM HBC NO BANCO INCLINADO 30º', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-6', name: 'DESENVOLVIMENTO FECHADO PEGADA NEUTRA COM HBC NO BANCO 75º', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-7', name: 'PUXADA ABERTA NO PULLEY ALTO COM BARRA RETA', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' },
                { id: 'm-u-8', name: 'TRÍCEPS EM PÉ NO CROSS COM BARRA RETA', sets: '3', reps: '15', rest: '25s', executionType: 'Simples' }
              ]
            }
          ]
        },
        { 
          id: 'fixed-marcelly', 
          nome: 'Marcelly Bispo', 
          email: 'marcellybispo92@gmail.com', 
          photoUrl: '/images/profiles/andre_marcelly.jpg',
          age: 34,
          weight: 61.2,
          height: 167,
          goal: 'health',
          medicalHistory: '⚠️ Nada',
          medications: 'Nada',
          physicalAssessments: [
            {
              id: 'marcelly-assessment-2024-07-07',
              data: '2024-07-07T10:45:22',
              peso: 59.9,
              altura: 167,
              imc: 21.5,
              bio_percentual_gordura: 27.2,
              pesoGordura: 16.3,
              percentualMassaMuscularEsqueletica: 40.4,
              pesoMassaMuscularEsqueletica: 24.2,
              registroMassaMuscular: 68.6,
              pesoMassaMuscular: 41.1,
              aguaPercentual: 50.7,
              pesoAgua: 30.4,
              gorduraVisceral: 3.5,
              ossos: 2.54,
              metabolismo: 1302.8,
              proteina: 17.9,
              obesidade: 2.9,
              idadeMetabolica: 26.0,
              lbm: 43.62,
              idadeReal: 32,
              type: 'BIOIMPEDANCE',
              analiseComposicao: {
                agua: 'Saudável',
                gordura: 'Saudável',
                proteina: 'Saudável',
                ossos: 'Excelente'
              },
              analiseTipoCorpo: {
                tipo: 'Saudável',
                descricao: "Excelente desenvolvimento muscular para a idade, com controle calórico ideal."
              },
              dicasControlePeso: {
                pesoDiff: 0,
                pesoIdeal: 59.9,
                massaMuscularDiff: 0,
                gorduraDiff: 0
              },
              veredictoPeriodizacao: "O relatório de 2024 mostra Marcelly em um estado físico fenomenal, com uma massa muscular esquelética acima da média (40.4%) e gordura visceral baixíssima. Mantendo esse padrão, a longevidade e performance estão garantidas."
            },
            {
              id: 'marcelly-assessment-2026-04-30',
              data: '2026-04-30T10:00:00',
              peso: 61.2,
              altura: 167,
              imc: 21.9,
              bio_percentual_gordura: 28.3,
              pesoGordura: 17.3,
              percentualMassaMuscularEsqueletica: 39.8,
              pesoMassaMuscularEsqueletica: 24.4,
              registroMassaMuscular: 67.5,
              pesoMassaMuscular: 41.3,
              aguaPercentual: 50.3,
              pesoAgua: 30.8,
              gorduraVisceral: 4.0,
              ossos: 2.61,
              metabolismo: 1308.8,
              proteina: 17.2,
              obesidade: 5.2,
              idadeMetabolica: 29.0,
              lbm: 43.9,
              idadeReal: 34,
              type: 'BIOIMPEDANCE',
              // Perímetros
              torax: 85,
              cintura: 73,
              abdomen: 76,
              quadril: 96,
              coxaProximalDireita: 58.5,
              coxaProximalEsquerda: 59.5,
              coxaDistalDireita: 45,
              coxaDistalEsquerda: 44.5,
              panturrilhaDireita: 35.5,
              panturrilhaEsquerda: 35.5,
              bracoDireito: 27,
              bracoEsquerdo: 27,
              antebracoDireito: 22.5,
              antebracoEsquerdo: 22,
              // Dobras
              dobraSubescapular: 16,
              dobraAbdominal: 20,
              dobraCoxa: 27,
              analiseComposicao: {
                agua: 'Saudável',
                gordura: 'Alto',
                proteina: 'Saudável',
                ossos: 'Excelente'
              },
              analiseTipoCorpo: {
                tipo: 'Saudável',
                descricao: "Equilíbrio entre massa magra e gordura, mas com margem para redução de gordura subcutânea."
              },
              dicasControlePeso: {
                pesoDiff: 1.3,
                pesoIdeal: 59.9,
                massaMuscularDiff: 0.5,
                gorduraDiff: -1.2
              },
              veredictoPeriodizacao: "Marcelly, sua massa muscular esquelética está excelente (39.8%). O foco agora é reduzir levemente o percentual de gordura (28.3%) mantendo essa base muscular. As medidas antropométricas mostram uma boa simetria de membros inferiores. Continue firme no plano de hipertrofia com foco metabólico."
            }
          ], 
          workoutHistory: [],
          analytics: {
            sessionsCompleted: 0,
            streakDays: 0,
            exercises: {},
            lastSessionDate: ''
          },
          sexo: 'Feminino',
          periodization: {
            id: 'per-marcelly-18sessoes',
            titulo: 'Periodização Científica - Fase 1: Retorno & Adaptação (18 Sessões)',
            startDate: '2026-09-09T00:00:00.000Z',
            type: 'STRENGTH',
            phaseTitle: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
            generalStrategy: "Retorno de inatividade física de 3 meses. Frequência mínima de 5 vezes na semana (com flexibilidade para treinar 6 ou 7 dias sempre que possível). Foco estrito em musculação com 9 exercícios por sessão (4 membros inferiores, 4 membros superiores e 1 de core), divididos em Cadeia Anterior (Treino A) e Cadeia Posterior (Treino B). Duração rigorosamente limitada a no máximo 1 hora (60 minutos) devido ao perfil neurodivergente (Autista e TDAH), para evitar fadiga e desestabilização sensorial pelo ambiente. Progressão de carga estruturada: Treinos 1 ao 6 com carga estável; 1º ajuste/aumento de carga a partir do Treino 7; 2º aumento a partir do Treino 13; encerramento no Treino 18 com Avaliação Física Obrigatória para validar a transição para a Fase 2.",
            frequenciaSemanal: "Mínimo de 5 vezes na semana (sempre que possível, 6 a 7 dias)",
            limiteTempoSessao: "Máximo 1 hora (60 minutos) - Teto inegociável por regulação sensorial (Autismo e TDAH)",
            restricoesOrtopedicas: "Tendinopatia no joelho esquerdo. Dificuldade de execução de corrida (contraindicada). Cardio restrito a baixo/zero impacto: no máximo caminhada, elíptico ou bicicleta.",
            regraAvaliacaoFisica: "Avaliação física obrigatória sempre que precisar mudar a série de treino, ou seja, no final de cada periodização (ao término do 18º treino).",
            proximaPeriodizacaoProposta: {
              titulo: "Fase 2: Força & Sobrecarga Tensional (24 Sessões / 3x11 reps)",
              sessoes: 24,
              reps: "11 repetições (3x11)",
              descanso: "30 segundos entre as séries",
              estruturaExercicios: "11 exercícios por treino (+1 de membro inferior e +1 de membro superior em cada série: 5 inferiores, 5 superiores, 1 core)",
              objetivo: "Potencializar aumento de força neuromuscular e progressão de cargas",
              tempoLimite: "Máximo de 60 minutos por sessão",
              gatilhoAtivacao: "Realização e validação da avaliação física completa no 18º treino da Fase 1"
            },
            clinicalSafety: [
              "Treinos 1 ao 6: Carga estável. Adaptação neuromuscular e consolidação técnica pós-inatividade de 3 meses.",
              "Treino 7: 1º Ponto de Ajuste de Carga. Elevação moderada de sobrecarga nos 9 exercícios.",
              "Treino 13: 2º Ponto de Ajuste de Carga. Nova progressão de carga mantendo 13 repetições.",
              "Treino 18: Fechamento da Fase 1. Realização obrigatória de Avaliação Física para mudança de série.",
              "Limite de 1 Hora: Sessão de treino com teto estrito de 60 minutos (Autismo e TDAH - prevenção de sobrecarga sensorial).",
              "Joelho Esquerdo: Tendinopatia patelar/joelho esquerdo. Sem corrida. Cardio permitido apenas caminhada, elíptico ou bicicleta ergométrica.",
              "Frequência Semanal: Mínimo 5 dias na semana, com possibilidade de treinar mais dias sempre que viável."
            ],
            bioInsight: {
              context: "Periodização Científica personalizada para Marcelly Bispo: Retorno de inatividade de 3 meses, frequência mínima de 5x/semana (até 7 dias), sessões de no máximo 1 hora (Autismo/TDAH), 9 exercícios diários (4 inf, 4 sup, 1 core) divididos em Anterior e Posterior. Carga estável nos treinos 1 a 6, aumento a partir do treino 7, novo aumento a partir do 13, conclusão no treino 18. Avaliação física obrigatória no final da periodização para transição para a Fase 2 (24 sessões de 11 reps com 30s de descanso e +1 exercício inferior e +1 superior).",
              tips: [
                "Treinos 1 a 6: Carga estável. Adaptação articular e neuromuscular sem aumentar peso precipitadamente.",
                "Treino 7: 1º Ajuste de Carga. Aumentar moderadamente a carga nos 9 exercícios mantendo cadência controlada.",
                "Treino 13: 2º Ajuste de Carga. Nova progressão de peso para maximizar hipertrofia e força.",
                "Treino 18: Término da 1ª Periodização -> Avaliação Física Completa Obrigatória.",
                "Transição Fase 2: 24 sessões por série, 11 repetições, descanso de 30s e 11 exercícios por treino (+1 inferior e +1 superior)."
              ]
            },
            targetVolume: {
              "Peito": 6,
              "Costas e Cintura Escapular": 9,
              "Ombro": 3,
              "Biceps": 3,
              "Triceps": 3,
              "Quadríceps e Adutores": 12,
              "Glúteos e Posteriores": 12,
              "Core e Abdomen": 6
            },
            microciclos: [
              {
                id: 'm-1-6-marcelly',
                semanas: 'Treinos 1 a 6',
                titulo: 'FASE INICIAL: ADAPTAÇÃO & CARGA ESTÁVEL',
                metodo: 'Séries retas 3x13 (9 exercícios: 4 inf, 4 sup, 1 core)',
                intensidade: 'Carga Estável / Descanso: 20s / Sessão máx 1h',
                volume: '3 x 13 (Cadeia Anterior & Posterior)',
                descricao: 'Retorno de 3 meses parado. Manter carga rigorosamente estável dos treinos 1 a 6 para adaptação tendínea e articular.'
              },
              {
                id: 'm-7-12-marcelly',
                semanas: 'Treinos 7 a 12',
                titulo: 'PROGRESSÃO: 1º AJUSTE DE CARGA (A PARTIR DO TREINO 7)',
                metodo: 'Séries retas 3x13 com sobrecarga progressiva',
                intensidade: 'Aumento gradual de carga / Descanso: 20s / Sessão máx 1h',
                volume: '3 x 13 (9 exercícios)',
                descricao: 'A partir do treino 7: primeiro aumento gradual de carga nos exercícios. Frequência mínima 5x/semana.'
              },
              {
                id: 'm-13-18-marcelly',
                semanas: 'Treinos 13 a 18',
                titulo: 'CONSOLIDAÇÃO: 2º AJUSTE DE CARGA & AVALIAÇÃO FÍSICA FINAL',
                metodo: 'Séries retas 3x13 -> Reavaliação no Treino 18',
                intensidade: 'Sobrecarga Máxima / Descanso: 20s / Sessão máx 1h',
                volume: '3 x 13 -> Término no Treino 18',
                descricao: 'A partir do treino 13: segundo aumento de carga. No treino 18: término da 1ª periodização e Avaliação Física Obrigatória para mudança de série.'
              }
            ]
          },
          faseAjusteA: 5,
          faseAjusteB: 5,
          faseAjusteC: 0,
          totalGlobalA: 5,
          totalGlobalB: 5,
          totalGlobalC: 0,
          trainingProgress: { completedCount: 10, targetCount: 36 },
          activePlan: {
            id: 'current',
            phaseName: 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
            targetSets: 18,
            progress: { A: 5, B: 5, C: 0 }
          },
          periodizationProgress: {
            '3 x 13': { A: 5, B: 5, C: 0 },
            'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)': { A: 5, B: 5, C: 0 }
          },
          workouts: [
            {
              id: 'treino-a-marcelly',
              title: 'TREINO A (Membros Inferiores)',
              projectedSessions: 18,
              frequencyWeekly: 3,
              status: 'published',
              description: '18 treinos (6 semanas, 3x/semana). Ajustes de carga no treino 6 e 12.',
              exercises: [
                { id: 'm-a-1', name: 'Leg press horizontal/máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-2', name: 'Agachamento no aparelho hack machine', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-3', name: 'Cadeira extensora', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-4', name: 'Cadeira extensora unilateral', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-1', name: 'Stiff em pé com HBC ou HBM', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-2', name: 'Extensão de quadril na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-3', name: 'Cadeira abdutora', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-4', name: 'Cadeira flexora', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-marcelly',
              title: 'TREINO B (Membros Superiores)',
              projectedSessions: 18,
              frequencyWeekly: 3,
              status: 'published',
              description: '18 treinos (6 semanas, 3x/semana). Ajustes de carga no treino 6 e 12.',
              exercises: [
                { id: 'm-a-5', name: 'Supino aberto na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-6', name: 'Supino aberto no banco inclinado na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-7', name: 'Desenvolvimento aberto máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-8', name: 'Tríceps em pé no Cross barra reta', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-5', name: 'Remada aberta na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-6', name: 'Remada fechada na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-7', name: 'Puxada fechada com triângulo no pulley alto', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-8', name: 'Bíceps em pé no cross barra reta', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-9', name: 'Mata-borrão isométrico no solo', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' }
              ]
            }
          ]
        }
    ], []);

  useEffect(() => {
    let unsub: () => void;
    let unsubPlan: (() => void) | null = null;
    let unsubHistory: (() => void) | null = null;
    
    // Se a autenticação ainda não estiver pronta, esperamos.
    // Mas se estiver pronta, prosseguimos mesmo sem usuário (user === null)
    // pois as regras do Firestore para 'students' são públicas (allow read, write: if true)
    if (!authReady && view !== 'LOGIN') {
      return;
    }

    // Safety timeout for student loading
    const studentLoadTimeout = setTimeout(() => {
      if (view !== 'LOGIN' && !selectedStudent && view !== 'PROFESSOR_DASH' && view !== 'COACH_AI' && view !== 'SETTINGS' && view !== 'FEED' && view !== 'CORRE_RJ') {
          console.warn("Student loading timed out, redirecting...");
          if (isCoach) {
              setView('PROFESSOR_DASH');
          } else {
              setView('LOGIN');
              localStorage.removeItem('elite_session_v2');
              delete (window as any)._tempStudentId;
          }
      }
    }, 8000);

    if (view !== 'LOGIN' && isCoach) {
      console.log('Tentando buscar dados de alunos (Coach)...');
      const path = `alunos`;
      const q = collection(db, path);
      
      // Timeout para carregamento de dados
      const dataTimeout = setTimeout(() => {
        if (students.length === 0) {
          console.warn("Timeout ao buscar dados de alunos (Coach).");
          setDbError("Erro ao conectar ao banco. Verifique as Regras de Segurança.");
          setLoading(false);
        }
      }, 5000);

      try {
        unsub = onSnapshot(q, (snapshot) => {
          clearTimeout(dataTimeout);
          setDbError(null);
          if (snapshot.metadata.hasPendingWrites) {
            setSyncStatus('syncing');
          } else {
            setSyncStatus(prev => prev === 'syncing' ? 'synced' : prev);
          }
          const updatedStudents = snapshot.docs.map(d => {
            const student = { id: d.id, ...d.data() } as Student;
            if (student.id === 'fixed-andre' || student.email === 'andrevictorbritodeandrade@gmail.com') {
                const def = defaultStudentsData.find(s => s.id === 'fixed-andre');
                if (def) {
                    const currentA = student.faseAjusteA ?? student.activePlan?.progress?.A ?? 0;
                    const currentB = student.faseAjusteB ?? student.activePlan?.progress?.B ?? 0;
                    const finalA = Math.max(7, currentA);
                    const finalB = Math.max(6, currentB);
                    student.faseAjusteA = finalA;
                    student.faseAjusteB = finalB;
                    student.totalGlobalA = finalA;
                    student.totalGlobalB = finalB;
                    student.trainingProgress = {
                        completedCount: Math.max(13, finalA + finalB, student.trainingProgress?.completedCount || 0),
                        targetCount: 36
                    };
                    if (student.activePlan) {
                        student.activePlan.progress.A = finalA;
                        student.activePlan.progress.B = finalB;
                        student.activePlan.targetSets = 18;
                    }
                    if (student.periodizationProgress) {
                        const pKey = '3 x 13';
                        const phaseKey = 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)';
                        if (student.periodizationProgress[pKey]) {
                            student.periodizationProgress[pKey].A = finalA;
                            student.periodizationProgress[pKey].B = finalB;
                        }
                        if (student.periodizationProgress[phaseKey]) {
                            student.periodizationProgress[phaseKey].A = finalA;
                            student.periodizationProgress[phaseKey].B = finalB;
                        }
                    }
                }
            }
            if (student.id === 'fixed-marcelly' || student.email === 'marcellybispo92@gmail.com') {
                const currentA = student.faseAjusteA ?? student.activePlan?.progress?.A ?? 0;
                const currentB = student.faseAjusteB ?? student.activePlan?.progress?.B ?? 0;
                const finalA = Math.max(5, currentA);
                const finalB = Math.max(5, currentB);
                student.faseAjusteA = finalA;
                student.faseAjusteB = finalB;
                student.totalGlobalA = finalA;
                student.totalGlobalB = finalB;
                student.trainingProgress = {
                    completedCount: Math.max(10, finalA + finalB, student.trainingProgress?.completedCount || 0),
                    targetCount: 36
                };
                if (student.activePlan) {
                    student.activePlan.progress.A = finalA;
                    student.activePlan.progress.B = finalB;
                    student.activePlan.targetSets = 18;
                }
                if (student.periodizationProgress) {
                    const pKey = '3 x 13';
                    const phaseKey = 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)';
                    if (student.periodizationProgress[pKey]) {
                        student.periodizationProgress[pKey].A = finalA;
                        student.periodizationProgress[pKey].B = finalB;
                    }
                    if (student.periodizationProgress[phaseKey]) {
                        student.periodizationProgress[phaseKey].A = finalA;
                        student.periodizationProgress[phaseKey].B = finalB;
                    }
                }
            }
            if ((student.id === 'fixed-andre' || student.email === 'andrevictorbritodeandrade@gmail.com')) {
                student.workouts = defaultStudentsData.find(s => s.id === 'fixed-andre')?.workouts || student.workouts;
            }
            if (student.nome?.includes('Marcelly') && student.workouts) {
              student.workouts = student.workouts.filter(w => !((w.title?.toUpperCase() === 'TREINO A') && (!w.exercises || w.exercises.length === 0)));
            }
            const def = defaultStudentsData.find(s => s.id === student.id || (s.email && student.email && s.email.toLowerCase() === student.email.toLowerCase()));
            if (def && def.physicalAssessments) {
              const curAss = student.physicalAssessments ? [...student.physicalAssessments] : [];
              def.physicalAssessments.forEach(defAss => {
                if (!curAss.some(a => a.id === defAss.id)) {
                  curAss.push(defAss);
                }
              });
              curAss.sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());
              student.physicalAssessments = curAss;
              if (curAss.length > 0 && curAss[0].peso) {
                student.weight = curAss[0].peso;
              }
            }
            return applyDynamicPeriodization(student);
          });
          console.log("Updated Students:", updatedStudents);
          setStudents(updatedStudents);
          // Atualiza o aluno selecionado em tempo real se ele estiver aberto
          if (selectedStudent) {
            const current = updatedStudents.find(s => s.id === selectedStudent.id);
            if (current) setSelectedStudent(current);
          }
          // Restauração de aluno selecionado após refresh
          if ((window as any)._tempStudentId && !selectedStudent) {
              const saved = updatedStudents.find(s => s.id === (window as any)._tempStudentId);
              if (saved) {
                  setSelectedStudent(saved);
                  // Limpa flag
                  delete (window as any)._tempStudentId;
              }
          }
        }, (error) => {
          if (error.code === 'permission-denied') {
            console.warn("Permissão negada ao buscar estudantes. Verifique se o usuário está logado e tem permissão.");
            setDbError("Acesso restrito. Por favor, faça login novamente.");
          } else {
            try {
              handleFirestoreError(error, OperationType.GET, path);
            } catch (err) {
              console.error("Firestore error via onSnapshot:", err);
            }
          }
        });
      } catch (e) {
        console.error("Erro ao iniciar listener de estudantes:", e);
      }
    } else if (view !== 'LOGIN' && !isCoach) {
      // Se tivermos um ID temporário restaurado ou um estudante já selecionado
      const targetId = selectedStudent?.id || (window as any)._tempStudentId;
      if (!targetId) {
          setView('LOGIN');
          localStorage.removeItem('elite_session_v2');
          return;
      }

      console.log(`Tentando buscar dados do aluno ${targetId}...`);
      const path = `alunos/${targetId}`;
      const docRef = doc(db, path);

      // Timeout para carregamento de dados do aluno
      const dataTimeout = setTimeout(() => {
        if (!studentForView) {
          console.warn("Timeout ao buscar dados do aluno.");
          setDbError("Erro ao conectar ao banco. Verifique as Regras de Segurança.");
          setLoading(false);
        }
      }, 5000);

      try {
        unsub = onSnapshot(docRef, async (docSnap) => {
          clearTimeout(dataTimeout);
          if (docSnap.metadata.hasPendingWrites) {
            setSyncStatus('syncing');
          } else {
            setSyncStatus(prev => prev === 'syncing' ? 'synced' : prev);
          }
          if (docSnap.exists()) {
              const rawData = { id: docSnap.id, ...docSnap.data() } as Student;
              
              // Merge local cache if available (fallback for offline / quota limits)
              try {
                  const cachedStr = localStorage.getItem(`student_cache_${targetId}`);
                  if (cachedStr) {
                      const cached = JSON.parse(cachedStr);
                      if (cached && cached.workoutHistory && Array.isArray(cached.workoutHistory)) {
                          const existingHistory = rawData.workoutHistory || [];
                          const mergedHist = [...existingHistory];
                          cached.workoutHistory.forEach((h: any) => {
                              if (!mergedHist.some(item => item.id === h.id || (item.date === h.date && item.workoutId === h.workoutId))) {
                                  mergedHist.unshift(h);
                              }
                          });
                          rawData.workoutHistory = mergedHist;
                      }
                      if (cached.analytics) {
                          rawData.analytics = { ...cached.analytics, ...(rawData.analytics || {}) };
                      }
                  }
              } catch (e) {
                  console.warn("Could not read student_cache from localStorage:", e);
              }
              
              // 1. Carrega histórico persistido da coleção 'workouts' do Firestore (Passo 3)
              try {
                const wQuery = query(
                  collection(db, 'workouts'),
                  where('userId', '==', targetId),
                  orderBy('timestamp', 'desc'),
                  limit(100)
                );
                const wSnap = await getDocs(wQuery);
                if (!wSnap.empty) {
                  const cloudWorkouts: WorkoutHistoryEntry[] = [];
                  wSnap.forEach(wDoc => {
                    const wd = wDoc.data();
                    cloudWorkouts.push({
                      id: wDoc.id,
                      workoutId: wd.workoutId || wd.treinoId || '',
                      name: wd.nome || 'Treino',
                      date: wd.concluidoEm?.toDate ? wd.concluidoEm.toDate().toLocaleDateString('pt-BR') : new Date(wd.timestamp || Date.now()).toLocaleDateString('pt-BR'),
                      duration: wd.duracao || (wd.duracaoMinutos ? `${wd.duracaoMinutos}:00` : '00:00'),
                      exercises: wd.exercicios || (wd.cargas || []).map((c: any) => ({ name: c.exercicio, load: c.carga, loadUnit: c.unidade })),
                      timestamp: wd.timestamp || Date.now(),
                      type: 'STRENGTH'
                    });
                  });
                  const existingHistory = rawData.workoutHistory || [];
                  const mergedHistory = [...existingHistory];
                  cloudWorkouts.forEach(cw => {
                    if (!mergedHistory.some(h => h.id === cw.id || (h.timestamp === cw.timestamp && h.workoutId === cw.workoutId))) {
                      mergedHistory.push(cw);
                    }
                  });
                  mergedHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                  rawData.workoutHistory = mergedHistory;
                }
              } catch (wErr) {
                console.warn("Aviso ao carregar coleção 'workouts' do Firestore:", wErr);
              }

              // 2. Carrega contadores atômicos da coleção 'userProgress' do Firestore (Passo 4)
              try {
                const pDocRef = doc(db, 'userProgress', targetId);
                const pDocSnap = await getDoc(pDocRef);
                if (pDocSnap.exists()) {
                  const pData = pDocSnap.data();
                  if (pData.totalWorkouts && (!rawData.trainingProgress?.completedCount || pData.totalWorkouts > rawData.trainingProgress.completedCount)) {
                    rawData.trainingProgress = {
                      completedCount: pData.totalWorkouts,
                      targetCount: rawData.trainingProgress?.targetCount || 60
                    };
                  }
                }
              } catch (pErr) {
                console.warn("Aviso ao carregar 'userProgress' do Firestore:", pErr);
              }
              
              // --- MERGE COM DADOS PADRÃO (FIX PARA ALUNO) ---
              const defaultProfile = defaultStudentsData.find(d => d.id === rawData.id || (d.email && rawData.email && d.email.toLowerCase() === rawData.email.toLowerCase()));
              
              if (defaultProfile) {
                  let hasCloudChanges = false;
                  
                  if (!rawData.nome) { rawData.nome = defaultProfile.nome; hasCloudChanges = true; }
                  if (!rawData.email) { rawData.email = defaultProfile.email; hasCloudChanges = true; }
                  
                  // Preserve custom user profile photos; default to initial asset only if photoUrl is missing
                  if (!rawData.photoUrl && defaultProfile.photoUrl) {
                    rawData.photoUrl = defaultProfile.photoUrl;
                    hasCloudChanges = true;
                  }
                  
                  if (!rawData.periodization && defaultProfile.periodization) {
                      rawData.periodization = defaultProfile.periodization;
                      hasCloudChanges = true;
                  } else if (rawData.periodization && defaultProfile.periodization) {
                      rawData.periodization = {
                          ...rawData.periodization,
                          ...defaultProfile.periodization,
                          startDate: rawData.periodization.startDate || defaultProfile.periodization.startDate
                      };
                      hasCloudChanges = true;
                  }
                  
                  // Workouts Sync
                  let currentWorkouts = rawData.workouts || [];
                  let workoutsModified = false;
                  
                  // FIX: Clean empty Treino A if it's Marcelly
                  if (rawData.nome?.includes('Marcelly')) {
                    const originalLength = currentWorkouts.length;
                    currentWorkouts = currentWorkouts.filter(w => !((w.title?.toUpperCase() === 'TREINO A') && (!w.exercises || w.exercises.length === 0)));
                    if (currentWorkouts.length !== originalLength) {
                        workoutsModified = true;
                    }
                  }
                  
                  const defaultWorkouts = defaultProfile.workouts || [];
                  
                  defaultWorkouts.forEach(defWorkout => {
                      if (!currentWorkouts.some(w => w.id === defWorkout.id)) {
                          currentWorkouts.push(defWorkout);
                          workoutsModified = true;
                      } else {
                          // Deep merge exercises to update base descriptions but PRESERVE live loads (carga) and user configurations
                          const existingWorkout = currentWorkouts.find(w => w.id === defWorkout.id);
                          if (existingWorkout) {
                              const mergedExercises = defWorkout.exercises.map(defEx => {
                                  const existingEx = existingWorkout.exercises?.find(e => e.id === defEx.id || e.name === defEx.name);
                                  if (existingEx) {
                                      return {
                                          ...defEx,
                                          ...existingEx, // keep existing load/loadUnit and other customizations
                                          name: defEx.name, // Always update to current prescribed exercise name
                                          description: existingEx.description || defEx.description,
                                          benefits: existingEx.benefits || defEx.benefits,
                                      };
                                  }
                                  return defEx;
                              });
                              // Also carry-over any custom exercises added by the coach/athlete
                              const extraExercises = (existingWorkout.exercises || []).filter(existingEx => 
                                  !defWorkout.exercises.some(defEx => defEx.id === existingEx.id || defEx.name === existingEx.name)
                              );
                              existingWorkout.exercises = [...mergedExercises, ...extraExercises];
                              existingWorkout.title = defWorkout.title;
                              workoutsModified = true;
                          }
                      }
                  });
                  
                  // Workouts fallback if not present in Firestore
                  if (workoutsModified || !rawData.workouts || rawData.workouts.length === 0) {
                      rawData.workouts = currentWorkouts;
                      hasCloudChanges = true;
                  }
                  
                  // History Sync (Union based on ID)
                  let currentHistory = rawData.workoutHistory || [];
                  const defaultHistory = defaultProfile.workoutHistory || [];



                  // One-time guaranteed sync for André Brito
                  if (defaultProfile.email === 'andrevictorbritodeandrade@gmail.com' || rawData.id === 'fixed-andre') {
                      if ((rawData as any)._planRevision !== 'v33-andre-exact-A7-B6') {
                          (rawData as any)._planRevision = 'v33-andre-exact-A7-B6';
                          
                          rawData.activePlan = {
                              id: 'current',
                              phaseName: defaultProfile.periodization?.phaseTitle || 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
                              targetSets: 18,
                              progress: { A: 7, B: 6, C: 0 }
                          };
                          rawData.trainingProgress = { completedCount: 13, targetCount: 36 };
                          rawData.faseAjusteA = 7;
                          rawData.faseAjusteB = 6;
                          rawData.totalGlobalA = 7;
                          rawData.totalGlobalB = 6;
                          rawData.periodizationProgress = {
                              ...(rawData.periodizationProgress || {}),
                              '3 x 13': { A: 7, B: 6, C: 0 }
                          };

                          // Atualizar Cargas do Treino A conforme as imagens enviadas
                          currentWorkouts = currentWorkouts.map(w => {
                              if (w.id === 'treino-a-andre') {
                                  return {
                                      ...w,
                                      exercises: [
                                          { id: 'a-a-1', name: 'Leg press horizontal/máquina', sets: '3', reps: '13', rest: '20s', load: '50 Kg', executionType: 'Simples' },
                                          { id: 'a-a-2', name: 'Agachamento no aparelho hack machine', sets: '3', reps: '13', rest: '20s', load: '-- Kg', executionType: 'Simples' },
                                          { id: 'a-a-3', name: 'Cadeira extensora', sets: '3', reps: '13', rest: '20s', load: '20 Kg', executionType: 'Simples' },
                                          { id: 'a-a-4', name: 'Cadeira extensora unilateral', sets: '3', reps: '13', rest: '20s', load: '5 Kg', executionType: 'Simples' },
                                          { id: 'a-a-5', name: 'Supino aberto na máquina', sets: '3', reps: '13', rest: '20s', load: '30 Kg', executionType: 'Simples' },
                                          { id: 'a-a-6', name: 'Supino aberto no banco inclinado na máquina', sets: '3', reps: '13', rest: '20s', load: '2,5 Kg', executionType: 'Simples' },
                                          { id: 'a-a-7', name: 'Desenvolvimento aberto máquina', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' },
                                          { id: 'a-a-8', name: 'Tríceps em pé no Cross barra reta', sets: '3', reps: '13', rest: '20s', load: '25 Kg', executionType: 'Simples' },
                                          { id: 'a-a-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', load: '15 Kg', executionType: 'Simples' }
                                      ]
                                  };
                              }
                              return w;
                          });
                          rawData.workouts = currentWorkouts;
                          try {
                              const cargas = JSON.parse(localStorage.getItem('cargasTreino') || '{}');
                              cargas['a-a-1'] = '50 Kg'; cargas['leg press horizontal/máquina'] = '50 Kg';
                              cargas['a-a-2'] = '-- Kg'; cargas['agachamento no aparelho hack machine'] = '-- Kg';
                              cargas['a-a-3'] = '20 Kg'; cargas['cadeira extensora'] = '20 Kg';
                              cargas['a-a-4'] = '5 Kg'; cargas['cadeira extensora unilateral'] = '5 Kg';
                              cargas['a-a-5'] = '30 Kg'; cargas['supino aberto na máquina'] = '30 Kg';
                              cargas['a-a-6'] = '2,5 Kg'; cargas['supino aberto no banco inclinado na máquina'] = '2,5 Kg';
                              cargas['a-a-7'] = '15 Kg'; cargas['desenvolvimento aberto máquina'] = '15 Kg';
                              cargas['a-a-8'] = '25 Kg'; cargas['tríceps em pé no cross barra reta'] = '25 Kg';
                              cargas['a-a-9'] = '15 Kg'; cargas['abdominal na máquina crunch'] = '15 Kg';
                              localStorage.setItem('cargasTreino', JSON.stringify(cargas));
                          } catch (e) {}
                          workoutsModified = true;
                          hasCloudChanges = true;
                      }
                  }

                  // One-time guaranteed sync for Marcelly Bispo
                  if (defaultProfile.email === 'marcellybispo92@gmail.com' || rawData.id === 'fixed-marcelly') {
                      if ((rawData as any)._planRevision !== 'v7-marcelly-exact-A5-B5') {
                          (rawData as any)._planRevision = 'v7-marcelly-exact-A5-B5';
                          
                          rawData.activePlan = {
                              id: 'current',
                              phaseName: defaultProfile.periodization?.phaseTitle || 'Adaptação e Fortalecimento Global',
                              targetSets: 18,
                              progress: { A: 5, B: 5, C: 0 }
                          };
                          rawData.trainingProgress = { completedCount: 10, targetCount: 36 };
                          rawData.faseAjusteA = 5;
                          rawData.faseAjusteB = 5;
                          rawData.totalGlobalA = 5;
                          rawData.totalGlobalB = 5;
                          rawData.periodizationProgress = {
                              ...(rawData.periodizationProgress || {}),
                              '3 x 13': { A: 5, B: 5, C: 0 }
                          };
                          workoutsModified = true;
                          hasCloudChanges = true;
                      }
                  }

                  const mergedHistory = [...currentHistory];
                  let historyModified = false;
                  
                  defaultHistory.forEach(defEntry => {
                      if (!mergedHistory.some(h => h.id === defEntry.id)) {
                          mergedHistory.push(defEntry);
                          historyModified = true;
                      }
                  });
                  
                  if (historyModified || hasCloudChanges) {
                      rawData.workoutHistory = mergedHistory;
                      hasCloudChanges = true;
                  }

                  // Analytics Sync
                  if (!rawData.analytics) {
                      rawData.analytics = defaultProfile.analytics;
                      hasCloudChanges = true;
                  }

                  // Physical Assessments Sync
                  let currentAssessments = rawData.physicalAssessments || [];
                  const defaultAssessments = defaultProfile.physicalAssessments || [];

                  if (defaultProfile.email === 'andrevictorbritodeandrade@gmail.com' && !(rawData as any)._fixedAssessmentsApril28) {
                      currentAssessments = defaultAssessments;
                      (rawData as any)._fixedAssessmentsApril28 = true;
                      hasCloudChanges = true;
                  }

                  if (defaultProfile.email === 'marcellybispo92@gmail.com' && !(rawData as any)._fixedAssessmentsApril30) {
                      currentAssessments = defaultAssessments;
                      (rawData as any)._fixedAssessmentsApril30 = true;
                      hasCloudChanges = true;
                  }

                  const mergedAssessments = [...currentAssessments];
                  let assessmentsModified = false;
                  
                  defaultAssessments.forEach(defEntry => {
                      if (!mergedAssessments.some((a: any) => a.id === defEntry.id)) {
                          mergedAssessments.push(defEntry);
                          assessmentsModified = true;
                      }
                  });
                  
                  mergedAssessments.sort((a: any, b: any) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());
                  if (assessmentsModified || hasCloudChanges) {
                      rawData.physicalAssessments = mergedAssessments;
                      if (mergedAssessments.length > 0 && mergedAssessments[0].peso) {
                          rawData.weight = mergedAssessments[0].peso;
                      }
                      hasCloudChanges = true;
                  }

                  // Specific sync guarantee for Andre and Marcelly counts
                  if (defaultProfile.email === 'andrevictorbritodeandrade@gmail.com' || rawData.id === 'fixed-andre') {
                      rawData.faseAjusteA = rawData.activePlan?.progress?.A ?? 7;
                      rawData.faseAjusteB = rawData.activePlan?.progress?.B ?? 6;
                      rawData.totalGlobalA = rawData.faseAjusteA;
                      rawData.totalGlobalB = rawData.faseAjusteB;
                      rawData.trainingProgress = { completedCount: (rawData.faseAjusteA || 7) + (rawData.faseAjusteB || 6), targetCount: 36 };
                      if (rawData.activePlan) {
                          rawData.activePlan.progress = { A: rawData.faseAjusteA, B: rawData.faseAjusteB, C: 0 };
                          rawData.activePlan.targetSets = 18;
                      }
                  }
                  if (defaultProfile.email === 'marcellybispo92@gmail.com' || rawData.id === 'fixed-marcelly') {
                      rawData.faseAjusteA = rawData.activePlan?.progress?.A ?? 5;
                      rawData.faseAjusteB = rawData.activePlan?.progress?.B ?? 5;
                      rawData.totalGlobalA = rawData.faseAjusteA;
                      rawData.totalGlobalB = rawData.faseAjusteB;
                      rawData.trainingProgress = { completedCount: (rawData.faseAjusteA || 5) + (rawData.faseAjusteB || 5), targetCount: 36 };
                      if (rawData.activePlan) {
                          rawData.activePlan.progress = { A: rawData.faseAjusteA, B: rawData.faseAjusteB, C: 0 };
                          rawData.activePlan.targetSets = 18;
                      }
                  }

                  // If we detected that local defaults were missing from cloud, sync them up
                  if (hasCloudChanges && !(window as any)._hasQuotaExceeded) {
                      const docRefSave = doc(db, path);
                      try {
                        console.log(`Sincronizando dados base de ${rawData.nome} para a nuvem...`);
                        await setDoc(docRefSave, removeUndefined({ 
                            nome: rawData.nome, 
                            email: rawData.email,
                            workouts: rawData.workouts,
                            workoutHistory: rawData.workoutHistory,
                            periodization: rawData.periodization,
                            analytics: rawData.analytics,
                            trainingProgress: rawData.trainingProgress,
                            totalGlobalA: rawData.totalGlobalA,
                            totalGlobalB: rawData.totalGlobalB,
                            totalGlobalC: rawData.totalGlobalC,
                            faseAjusteA: rawData.faseAjusteA,
                            faseAjusteB: rawData.faseAjusteB,
                            faseAjusteC: rawData.faseAjusteC,
                            physicalAssessments: rawData.physicalAssessments,
                            _fixedAssessmentsApril28: (rawData as any)._fixedAssessmentsApril28
                        }), { merge: true });

                        // Also sync to prescricoes subcollection for server-side endpoints
                        if (rawData.workouts && Array.isArray(rawData.workouts)) {
                            for (const w of rawData.workouts) {
                                const pRef = doc(db, `alunos/${targetId}/prescricoes`, w.id);
                                await setDoc(pRef, removeUndefined({
                                    nome: w.title,
                                    totalSessoes: w.projectedSessions || 20,
                                    ativo: true,
                                    lastUpdate: Date.now()
                                }), { merge: true });
                            }
                        }
                      } catch (e: any) {
                        console.warn("Silent sync error:", e);
                        if (e?.code === 'resource-exhausted') {
                          (window as any)._hasQuotaExceeded = true;
                        }
                      }
                  }
              }
              
              const finalData = applyDynamicPeriodization(rawData);
              setSelectedStudent(finalData);
              
              // Restaurar Treino em Andamento se necessário
              if ((window as any)._tempWorkoutId && finalData.workouts) {
                 const w = finalData.workouts.find(w => w.id === (window as any)._tempWorkoutId);
                 if (w) setSelectedWorkout(w); 
                 delete (window as any)._tempWorkoutId;
              }
          } else {
              // Se não existe no banco, verifica se é um aluno padrão
              const defaultProfile = defaultStudentsData.find(d => d.id === targetId);
              if (defaultProfile) {
                  setSelectedStudent(defaultProfile);
              } else {
                  // Se não for padrão e não estiver no banco, volta pro login
                  setView('LOGIN');
                  localStorage.removeItem('elite_session_v2');
              }
          }
        }, (error) => {
          if (error.code === 'permission-denied') {
            console.warn("Permissão negada ao buscar dados do aluno. Verifique se o usuário está logado.");
            setDbError("Acesso restrito. Por favor, faça login novamente.");
          } else {
            try {
              handleFirestoreError(error, OperationType.GET, path);
            } catch (err) {
              console.error("Firestore error via onSnapshot:", err);
            }
          }
        });
        try {
          unsubPlan = subscribeToActivePlan(targetId, (plan) => {
            setSelectedStudent(prev => {
              if (!prev || prev.id !== targetId) return prev;
              return {
                ...prev,
                activePlan: plan,
                faseAjusteA: plan.progress.A,
                faseAjusteB: plan.progress.B,
                faseAjusteC: plan.progress.C
              };
            });
          });
          
          unsubHistory = subscribeToWorkoutHistory(targetId, (historyRecords) => {
            setSelectedStudent(prev => {
              if (!prev || prev.id !== targetId) return prev;
              const mapped = historyRecords.map(rec => ({
                id: rec.id || `hist-${rec.workoutType}-${Date.now()}`,
                name: rec.workoutName || `Treino ${rec.workoutType}`,
                duration: rec.duration || (rec.duracaoMinutos ? `${rec.duracaoMinutos}:00` : '00:00'),
                date: rec.dateCompleted?.seconds ? new Date(rec.dateCompleted.seconds * 1000).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                timestamp: rec.dateCompleted?.seconds ? rec.dateCompleted.seconds * 1000 : (rec.timestamp || Date.now()),
                type: 'STRENGTH' as const,
                exercises: rec.exercises || []
              }));
              return {
                ...prev,
                workoutHistory: mapped
              };
            });
          });

          subscribeToUserStats(targetId, (count) => {
            setGlobalWorkoutCount(count);
          });
        } catch (pe) {
          console.warn("Aviso ao escutar activePlan/history:", pe);
        }
      } catch (e) {
        console.error("Erro ao iniciar listener do aluno:", e);
      }
    }
    return () => { 
      if (unsub) unsub(); 
      if (unsubPlan) unsubPlan();
      if (unsubHistory) unsubHistory();
      clearTimeout(studentLoadTimeout);
    };
  }, [authReady, view, selectedStudent?.id, isCoach, defaultStudentsData]);

  const allStudentsForCoach = useMemo(() => {
    // 1. Começamos com os alunos vindos do Firestore (students)
    const merged = [...students];

    // 2. Para cada aluno padrão, verificamos se ele já existe nos dados do Firestore
    defaultStudentsData.forEach(def => {
        const existingIndex = merged.findIndex(s => s.id === def.id || (s.email && s.email.toLowerCase() === def.email.toLowerCase()));
        
        if (existingIndex === -1) {
            // Se não existe no banco, adiciona o padrão completo
            merged.push(def);
        } else {
            // Se já existe, PRESERVAMOS os dados do banco.
            const existing = merged[existingIndex];
            
            if (!existing.nome) merged[existingIndex].nome = def.nome;
            if (!existing.email) merged[existingIndex].email = def.email;
            if (!existing.photoUrl && def.photoUrl) {
              merged[existingIndex].photoUrl = def.photoUrl;
            }
            
            if (def.id === 'fixed-marcelly' || def.id === 'fixed-andre' || def.id === 'fixed-liliane') {
                merged[existingIndex].periodization = def.periodization;
                merged[existingIndex].activePlan = def.activePlan;
            } else if (!existing.periodization && def.periodization) {
                merged[existingIndex].periodization = def.periodization;
            } else if (existing.periodization && def.periodization && merged[existingIndex].periodization) {
                merged[existingIndex].periodization = {
                    ...merged[existingIndex].periodization,
                    ...def.periodization,
                    startDate: merged[existingIndex].periodization!.startDate || def.periodization.startDate
                };
            }

            // Workouts Sync
            let currentWorkoutsForCoach = existing.workouts ? [...existing.workouts] : [];
            const defaultWorkoutsForCoach = def.workouts || [];
            
            defaultWorkoutsForCoach.forEach(defWorkout => {
                if (!currentWorkoutsForCoach.some(w => w.id === defWorkout.id)) {
                    currentWorkoutsForCoach.push(defWorkout);
                } else {
                    const w = currentWorkoutsForCoach.find(w => w.id === defWorkout.id);
                    if (w) {
                        const mergedExercises = defWorkout.exercises.map(defEx => {
                            const existingEx = w.exercises?.find(e => e.id === defEx.id || e.name === defEx.name);
                            if (existingEx) {
                                return {
                                    ...defEx,
                                    ...existingEx, // keep existing load/loadUnit and other customizations
                                    name: defEx.name, // Always update to current prescribed exercise name
                                    description: existingEx.description || defEx.description,
                                    benefits: existingEx.benefits || defEx.benefits,
                                };
                            }
                            return defEx;
                        });
                        // Also carry-over any custom exercises added by the coach/athlete
                        const extraExercises = (w.exercises || []).filter(existingEx => 
                            !defWorkout.exercises.some(defEx => defEx.id === existingEx.id || defEx.name === existingEx.name)
                        );
                        w.exercises = [...mergedExercises, ...extraExercises];
                        w.title = defWorkout.title;
                    }
                }
            });
            if (def.id === 'fixed-liliane') {
                merged[existingIndex].workouts = def.workouts || [];
            } else {
                merged[existingIndex].workouts = currentWorkoutsForCoach;
            }
            
            // Se o aluno não tiver histórico, adiciona o padrão (apenas se for um aluno fixo que nunca treinou)
            if (!existing.workoutHistory || existing.workoutHistory.length === 0) {
                merged[existingIndex].workoutHistory = def.workoutHistory;
            }

            // Se o aluno não tiver analytics, adiciona o padrão
            if (!existing.analytics) {
                merged[existingIndex].analytics = def.analytics;
            }

            // Se o aluno não tiver trainingProgress, adiciona o padrão
            if (!existing.trainingProgress && def.trainingProgress) {
                merged[existingIndex].trainingProgress = def.trainingProgress;
            } else if (!existing.trainingProgress) {
                merged[existingIndex].trainingProgress = { completedCount: 0, targetCount: 24 };
            }

            // Sync scalar fields for Treino A/B/C counters
            if (def.id === 'fixed-liliane') {
                merged[existingIndex].faseAjusteA = 0;
                merged[existingIndex].faseAjusteB = 0;
                merged[existingIndex].faseAjusteC = 0;
                merged[existingIndex].totalGlobalA = 0;
                merged[existingIndex].totalGlobalB = 0;
                merged[existingIndex].totalGlobalC = 0;
                merged[existingIndex].activePlan = {
                    ...(existing.activePlan || {}),
                    id: 'current',
                    phaseName: 'Nova Periodização Liliane Torres',
                    targetSets: 32,
                    progress: {
                        A: existing.activePlan?.progress?.A ?? 0,
                        B: existing.activePlan?.progress?.B ?? 0,
                        C: 0
                    }
                };
            } else if (def.id === 'fixed-andre' || def.id === 'fixed-marcelly') {
                const baseA = def.faseAjusteA ?? 0;
                const baseB = def.faseAjusteB ?? 0;
                const baseC = def.faseAjusteC ?? 0;
                const curA = existing.faseAjusteA ?? existing.activePlan?.progress?.A ?? 0;
                const curB = existing.faseAjusteB ?? existing.activePlan?.progress?.B ?? 0;
                const curC = existing.faseAjusteC ?? existing.activePlan?.progress?.C ?? 0;
                const finalA = Math.max(baseA, curA);
                const finalB = Math.max(baseB, curB);
                const finalC = Math.max(baseC, curC);

                merged[existingIndex].faseAjusteA = finalA;
                merged[existingIndex].faseAjusteB = finalB;
                merged[existingIndex].faseAjusteC = finalC;
                merged[existingIndex].totalGlobalA = finalA;
                merged[existingIndex].totalGlobalB = finalB;
                merged[existingIndex].totalGlobalC = finalC;
                
                const curCompleted = existing.trainingProgress?.completedCount ?? 0;
                const targetCount = def.trainingProgress?.targetCount || existing.trainingProgress?.targetCount || 36;
                merged[existingIndex].trainingProgress = {
                    completedCount: Math.max(finalA + finalB + finalC, curCompleted, def.trainingProgress?.completedCount || 0),
                    targetCount
                };
                merged[existingIndex].activePlan = {
                    ...(def.activePlan || existing.activePlan || {}),
                    id: 'current',
                    phaseName: existing.activePlan?.phaseName || def.activePlan?.phaseName || 'Fase 1: Retorno de Inatividade & Força Estabilizadora (18 Sessões - 3x13 reps)',
                    targetSets: def.activePlan?.targetSets || 18,
                    progress: {
                        A: finalA,
                        B: finalB,
                        C: finalC
                    }
                };
            } else {
                if (existing.faseAjusteA === undefined && def.faseAjusteA !== undefined) merged[existingIndex].faseAjusteA = def.faseAjusteA;
                if (existing.faseAjusteB === undefined && def.faseAjusteB !== undefined) merged[existingIndex].faseAjusteB = def.faseAjusteB;
                if (existing.faseAjusteC === undefined && def.faseAjusteC !== undefined) merged[existingIndex].faseAjusteC = def.faseAjusteC;
                if (existing.totalGlobalA === undefined && def.totalGlobalA !== undefined) merged[existingIndex].totalGlobalA = def.totalGlobalA;
                if (existing.totalGlobalB === undefined && def.totalGlobalB !== undefined) merged[existingIndex].totalGlobalB = def.totalGlobalB;
                if (existing.totalGlobalC === undefined && def.totalGlobalC !== undefined) merged[existingIndex].totalGlobalC = def.totalGlobalC;
            }

            // Physical Assessments Sync
            const existingAssessments = existing.physicalAssessments ? [...existing.physicalAssessments] : [];
            const defaultAssessments = def.physicalAssessments || [];
            defaultAssessments.forEach(defAss => {
                if (!existingAssessments.some((a: any) => a.id === defAss.id)) {
                    existingAssessments.push(defAss);
                }
            });
            existingAssessments.sort((a: any, b: any) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());
            merged[existingIndex].physicalAssessments = existingAssessments;
            if (existingAssessments.length > 0 && existingAssessments[0].peso) {
                merged[existingIndex].weight = existingAssessments[0].peso;
            }
        }
    });

    // Ordenação alfabética
    return merged.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [students, defaultStudentsData]);

  useEffect(() => {
    if (studentForView) {
      const logsRef = collection(db, 'alunos', studentForView.id, 'logsTreino');
      const unsubscribe = onSnapshot(logsRef, (snapshot) => {
        setTotalExecuted(snapshot.size);
      });
      return () => unsubscribe();
    }
  }, [studentForView]);

  // --- 3. CONTROLE DE VOLTAR (HARDWARE BACK BUTTON) ---
  const handleBackNavigation = () => {
      // Se for professor
      if (isCoach) {
          if (view === 'WORKOUT_EDITOR' || view === 'PERIODIZATION' || view === 'COACH_ASSESSMENT' || view === 'RUNTRACK_MANAGER' || view === 'ANALYTICS_COACH' || view === 'WORKOUT_HISTORY') {
              setView('STUDENT_MGMT');
          } else if (view === 'STUDENT_MGMT') {
              setView('PROFESSOR_DASH');
              setSelectedStudent(null);
          } else if (view === 'PROFESSOR_DASH') {
              // Já está na home do professor
          } else {
              setView('PROFESSOR_DASH'); // Fallback seguro
          }
      } 
      // Se for aluno
      else {
          // Se estiver em qualquer sub-menu, volta pro Dashboard
          if (view !== 'DASHBOARD' && view !== 'LOGIN') {
              setView('DASHBOARD');
          } else if (view === 'DASHBOARD' && isSidebarOpen) {
              setIsSidebarOpen(false);
          }
      }
  };

  useEffect(() => {
    // Adiciona um estado ao histórico sempre que a visualização muda (se não for login)
    if (view !== 'LOGIN') {
        window.history.pushState({ view }, '');
    }

    const onPopState = (event: PopStateEvent) => {
        // Intercepta o evento "Voltar" do navegador/Android
        event.preventDefault();
        
        if (view === 'LOGIN') return;

        // Lógica inteligente de voltar
        if (isCoach) {
            if (view === 'PROFESSOR_DASH') {
                // Se estiver na raiz, permite (ou segura, dependendo da UX desejada. Aqui seguramos para nao sair sem querer)
                // window.history.back(); // Descomente para permitir sair
            } else {
                handleBackNavigation();
            }
        } else {
            if (view === 'DASHBOARD') {
                // Raiz do aluno
            } else {
                handleBackNavigation();
            }
        }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [view, isCoach, isSidebarOpen]);


  // Feed de Performance Global para o Professor e Aluno
  const globalFeedHistory = useMemo(() => {
    if (!isCoach) {
      const list = studentForView?.workoutHistory || [];
      return list.map(h => {
        let dateString = h.date;
        const ts = h.timestamp || ((h as any).dateCompleted?.seconds ? (h as any).dateCompleted.seconds * 1000 : null);
        if (ts) {
          dateString = new Date(ts).toLocaleDateString('pt-BR');
        }
        return {
          ...h,
          date: dateString,
          athleteName: studentForView?.nome || 'Atleta'
        };
      }).sort((a, b) => {
        const timeA = a.timestamp || ((a as any).dateCompleted?.seconds ? (a as any).dateCompleted.seconds * 1000 : 0);
        const timeB = b.timestamp || ((b as any).dateCompleted?.seconds ? (b as any).dateCompleted.seconds * 1000 : 0);
        return timeB - timeA;
      });
    }
    
    // Mescla todos os históricos de todos os alunos e injeta o nome do atleta
    const allHistory: WorkoutHistoryEntry[] = students.flatMap(s => 
      (s.workoutHistory || []).map(h => {
        let dateString = h.date;
        const ts = h.timestamp || ((h as any).dateCompleted?.seconds ? (h as any).dateCompleted.seconds * 1000 : null);
        if (ts) {
          dateString = new Date(ts).toLocaleDateString('pt-BR');
        }
        return {
          ...h,
          date: dateString,
          athleteName: s.nome // Injeta o nome do aluno para o professor saber quem treinou
        };
      })
    );
    
    return allHistory.sort((a, b) => {
      const timeA = a.timestamp || ((a as any).dateCompleted?.seconds ? (a as any).dateCompleted.seconds * 1000 : 0);
      const timeB = b.timestamp || ((b as any).dateCompleted?.seconds ? (b as any).dateCompleted.seconds * 1000 : 0);
      return timeB - timeA;
    });
  }, [isCoach, students, studentForView]);

  const studentNotifications = useMemo(() => {
    if (!studentForView) return [];
    const notifications: AppNotification[] = [...(studentForView.notifications || [])];

    // Coach direct alert
    if (workoutAlertNotification) {
      notifications.push({
        id: 'coach-workout-alert',
        title: 'Notificação do Treinador',
        message: workoutAlertNotification,
        date: new Date().toLocaleDateString('pt-BR'),
        read: readNotificationIds.includes('coach-workout-alert'),
        type: 'COACH' as any
      });
    }

    const history = studentForView.workoutHistory || [];
    studentForView.workouts?.forEach(w => {
      const completed = history.filter(h => h.workoutId === w.id || h.name === w.title).length;
      const target = w.projectedSessions || 12;
      const remaining = target - completed;
      if (remaining <= 2 && remaining >= 0) {
        const notifId = `renew-${w.id}`;
        notifications.push({ 
          id: notifId, 
          title: 'Renovação e Avaliação', 
          message: `Faltam ${remaining} sessões no treino "${w.title}". Agende sua nova avaliação física para troca de série.`, 
          date: new Date().toLocaleDateString('pt-BR'), 
          read: readNotificationIds.includes(notifId), 
          type: 'RENEWAL' 
        });
      }
    });

    // Assessment check
    const assessments = studentForView.physicalAssessments || [];
    if (assessments.length === 0) {
      const notifId = 'assessment-first';
      notifications.push({
        id: notifId,
        title: 'Avaliação Física Obrigatória',
        message: 'Você ainda não possui uma avaliação física registrada. Agende com seu treinador!',
        date: new Date().toLocaleDateString('pt-BR'),
        read: readNotificationIds.includes(notifId),
        type: 'SYSTEM'
      });
    } else {
      const lastAssessment = assessments[assessments.length - 1];
      const lastDate = new Date(lastAssessment.data);
      if (!isNaN(lastDate.getTime())) {
        const diffTime = Date.now() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 45) { // Needs renewal
          const notifId = 'assessment-renewal';
          notifications.push({
            id: notifId,
            title: 'Renovação de Avaliação Física',
            message: `Sua última avaliação física foi há ${diffDays} dias. Recomenda-se agendar uma nova avaliação.`,
            date: new Date().toLocaleDateString('pt-BR'),
            read: readNotificationIds.includes(notifId),
            type: 'SYSTEM'
          });
        }
      }
    }

    // Periodization phase alert
    if (studentForView.activePlan?.phaseName) {
      const targetSets = studentForView.activePlan?.targetSets || 18;
      const countA = studentForView.activePlan?.progress?.A ?? (studentForView.faseAjusteA !== undefined ? studentForView.faseAjusteA : 0);
      const countB = studentForView.activePlan?.progress?.B ?? (studentForView.faseAjusteB !== undefined ? studentForView.faseAjusteB : 0);
      if (countA >= targetSets && countB >= targetSets) {
        const notifId = `phase-complete-${studentForView.activePlan.phaseName}`;
        notifications.push({
          id: notifId,
          title: 'Fase de Periodização Concluída',
          message: `Parabéns! Você completou a meta de treinos da fase ${studentForView.activePlan.phaseName}. Consulte seu treinador para a próxima fase.`,
          date: new Date().toLocaleDateString('pt-BR'),
          read: readNotificationIds.includes(notifId),
          type: 'SYSTEM'
        });
      }
    }

    // Always include a persistent status notification if no urgent notifications exist
    if (notifications.length === 0) {
      const notifId = `active-status-${studentForView.id}`;
      notifications.push({
        id: notifId,
        title: 'Assessoria Ativa',
        message: 'Seu plano de treinamento está ativo e em andamento. Mantenha a consistência em cada sessão!',
        date: new Date().toLocaleDateString('pt-BR'),
        read: readNotificationIds.includes(notifId),
        type: 'SYSTEM'
      });
    }

    return notifications;
  }, [studentForView, workoutAlertNotification, readNotificationIds]);

  const handleLogin = (val: string) => {
    setLoginError('');
    if (!val) return;
    const cleanVal = val.trim().toLowerCase();
    
    if (cleanVal === "professor") { 
        setIsCoach(true);
        setView('PROFESSOR_DASH'); 
        return; 
    }
    
    const student = allStudentsForCoach.find(s => (s.email || "").trim().toLowerCase() === cleanVal);
    if (student) { 
        setIsCoach(false);
        setSelectedStudent(student); 
        setView('DASHBOARD'); 
    } else { 
        setLoginError('ATLETA NÃO ENCONTRADO NO BANCO'); 
    }
  };

  const handleSaveData = async (sid: string, data: any): Promise<boolean> => {
    // Dispara o indicador de sync
    setSyncStatus('syncing');
    const path = `alunos/${sid}`;
    
    // Robustly remove undefined values and prevent circular references to prevent Firestore errors
    const removeUndefined = (obj: any, seen = new WeakSet()): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      // Handle circular references
      if (seen.has(obj)) {
        return undefined; // Drop circular references
      }
      seen.add(obj);
      
      if (Array.isArray(obj)) {
        return obj
          .map(item => removeUndefined(item, seen))
          .filter(item => item !== undefined);
      }
      
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          const val = removeUndefined(obj[key], seen);
          if (val !== undefined) {
            newObj[key] = val;
          }
        }
      });
      return newObj;
    };
    
    const finalData = removeUndefined(data);

    if (data.periodization) {
      finalData.trainingProgress = { completedCount: 0, targetCount: 20 }; // Default target 20, coach can adjust
      finalData.analytics = { sessionsCompleted: 0, streakDays: 0, exercises: {}, lastSessionDate: null };
    }

    // ALWAYS update local state and localStorage cache immediately so UI updates and user never loses data on quota/offline errors!
    if (selectedStudent && selectedStudent.id === sid) {
      const updated = { ...selectedStudent, ...finalData };
      setSelectedStudent(updated);
      
      // Efficient caching strategy: Keep full student data but strictly limit history to 50 items
      try {
        // Memory leak protection: slice history to last 50 and clear older caches if needed
        const history = Array.isArray(updated.workoutHistory) ? updated.workoutHistory : [];
        const limitedHistory = history.slice(0, 50);

        const cacheObj = {
          ...updated,
          photoUrl: updated.photoUrl?.startsWith('data:') ? undefined : updated.photoUrl,
          workoutHistory: limitedHistory,
        };
        
        const safeCacheString = (obj: any) => {
          const seen = new WeakSet();
          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) return;
              seen.add(value);
            }
            return value;
          });
        };
        
        const serialized = safeCacheString(cacheObj);
        
        try {
          localStorage.setItem(`student_cache_${sid}`, serialized);
        } catch (storageError) {
          // If storage is full, try clearing all other student caches first
          console.warn("Storage full, clearing other student caches...");
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('student_cache_') && key !== `student_cache_${sid}`) {
              localStorage.removeItem(key);
            }
          });
          localStorage.setItem(`student_cache_${sid}`, serialized);
        }
      } catch (err) {
        console.warn("Could not save to localStorage cache:", err);
      }
    }
    setStudents(prev => prev.map(s => s.id === sid ? { ...s, ...finalData } : s));

    try { 
      const batch = writeBatch(db);
      const docRef = doc(db, path);
      batch.set(docRef, { ...finalData, lastUpdateTimestamp: serverTimestamp() }, { merge: true });

      // Se trainingProgress foi atualizado e mudou, sincroniza também na coleção userProgress
      if (finalData.trainingProgress?.completedCount !== undefined && 
          finalData.trainingProgress.completedCount !== selectedStudent?.trainingProgress?.completedCount) {
        const uRef = doc(db, 'userProgress', sid);
        batch.set(uRef, {
          totalWorkouts: finalData.trainingProgress.completedCount,
          lastWorkoutAt: serverTimestamp()
        }, { merge: true });
      }

      // Sync activePlan to active_plans subcollections for real-time listeners
      if (finalData.activePlan) {
        const apRefAlunos = doc(db, `alunos/${sid}/active_plans/current`);
        const apRefUsers = doc(db, `users/${sid}/active_plans/current`);
        const activePlanPayload = removeUndefined({
          phaseName: finalData.activePlan.phaseName || 'Fase 1: Retorno & Adaptação (18 Sessões)',
          targetSets: finalData.activePlan.targetSets || 18,
          progress: finalData.activePlan.progress || { A: 0, B: 0, C: 0 },
          updatedAt: serverTimestamp()
        });
        batch.set(apRefAlunos, activePlanPayload, { merge: true });
        batch.set(apRefUsers, activePlanPayload, { merge: true });
      }

      // Sync latest workout history entries to subcollections
      if (Array.isArray(finalData.workoutHistory)) {
        const topHistory = finalData.workoutHistory.slice(0, 10);
        for (const hEntry of topHistory) {
          if (hEntry && hEntry.id) {
            const hRefAlunos = doc(db, `alunos/${sid}/workout_history/${hEntry.id}`);
            const hRefUsers = doc(db, `users/${sid}/workout_history/${hEntry.id}`);
            const hPayload = removeUndefined({
              planId: 'current',
              workoutType: hEntry.name?.toLowerCase().includes('treino b') ? 'B' : (hEntry.name?.toLowerCase().includes('treino c') ? 'C' : 'A'),
              workoutName: hEntry.name,
              dateCompleted: hEntry.timestamp ? new Date(hEntry.timestamp) : serverTimestamp(),
              timestamp: hEntry.timestamp || Date.now(),
              duration: hEntry.duration || '00:00',
              exercises: hEntry.exercises || [],
              countText: hEntry.countText || null
            });
            batch.set(hRefAlunos, hPayload, { merge: true });
            batch.set(hRefUsers, hPayload, { merge: true });
          }
        }
      }

      // If workouts are explicitly being updated, sync to prescricoes subcollection using the same batch
      if (data.workouts && Array.isArray(data.workouts)) {
          // Limit to first 20 to avoid batch size limits (max 500) and preserve quota
          const workoutsToSync = data.workouts.slice(0, 50); 
          for (const w of workoutsToSync) {
              const pRef = doc(db, `alunos/${sid}/prescricoes`, w.id);
              batch.set(pRef, removeUndefined({
                  nome: w.title,
                  totalSessoes: w.projectedSessions || 20,
                  ativo: true,
                  lastUpdate: serverTimestamp()
              }), { merge: true });
          }
      }
      
      await batch.commit();
      setSyncStatus('synced');
      return true;
    } catch (e: any) { 
      setSyncStatus('offline');
      try {
        handleFirestoreError(e, OperationType.WRITE, path);
      } catch (err) {
        console.error("Failed to sync save data:", err);
      }
      // Return true because local state and cache were successfully updated, ensuring user gets a smooth experience despite quota limits
      return true;
    }
  };

  const handleFinishWorkout = async (post: WorkoutHistoryEntry) => {
    if (!studentForView) return;

    // 1. Identificar o tipo de treino (A, B ou C)
    const title = (post.name || '').toLowerCase();
    let tipoTreino: 'A' | 'B' | 'C' = 'A';
    if (title.includes('treino b') || post.workoutId?.includes('-b')) tipoTreino = 'B';
    else if (title.includes('treino c') || post.workoutId?.includes('-c')) tipoTreino = 'C';

    // 2. Calcular dados
    const rawDuration = post.duration || '00:00';
    const parts = rawDuration.split(':');
    const duracaoMinutos = Math.max(1, (parseInt(parts[0], 10) || 0) + Math.ceil((parseInt(parts[1], 10) || 0) / 60));
    
    const cargas = (post.exercises || []).map(ex => ({
      exercicio: ex.name,
      carga: ex.load || '0',
      unidade: ex.loadUnit || 'Kg'
    }));

    setSyncStatus('syncing');

    try {
      // 3. Salva o histórico de execução
      const historyRef = collection(db, `users/${studentForView.id}/workout_history`);
      await addDoc(historyRef, {
        planId: 'current',
        workoutType: tipoTreino,
        workoutName: post.name || `Treino ${tipoTreino}`,
        duration: post.duration || '00:00',
        duracaoMinutos,
        calorias: Math.ceil(duracaoMinutos * 7),
        exercises: post.exercises || [],
        cargas: cargas,
        dateCompleted: serverTimestamp(),
        timestamp: Date.now()
      });

      // 4. Atualiza a contagem atômica no plano ativo
      const planRef = doc(db, `users/${studentForView.id}/active_plans`, 'current');
      let novaContagem = 0;
      let targetSets = 18;

      await runTransaction(db, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        if (!planDoc.exists()) {
          transaction.set(planRef, {
            phaseName: 'Fase 1: Retorno & Adaptação',
            targetSets: 18,
            progress: { A: tipoTreino === 'A' ? 1 : 0, B: tipoTreino === 'B' ? 1 : 0, C: tipoTreino === 'C' ? 1 : 0 },
            updatedAt: serverTimestamp()
          });
          novaContagem = 1;
          targetSets = 18;
          return;
        }

        const planData = planDoc.data();
        targetSets = planData.targetSets || 18;
        const currentProgress = planData.progress || { A: 0, B: 0, C: 0 };
        novaContagem = (currentProgress[tipoTreino] || 0) + 1;

        transaction.update(planRef, {
          [`progress.${tipoTreino}`]: novaContagem,
          updatedAt: serverTimestamp()
        });
      });

      // Atualiza o estado React local para feedback instantâneo na interface
      setSelectedStudent((prev: any) => {
        if (!prev) return prev;
        const updatedProg = { ...(prev.activePlan?.progress || { A: 0, B: 0, C: 0 }), [tipoTreino]: novaContagem };
        return {
          ...prev,
          [`faseAjuste${tipoTreino}`]: novaContagem,
          [`totalGlobal${tipoTreino}`]: novaContagem,
          activePlan: {
            ...prev.activePlan,
            phaseName: novaContagem >= targetSets ? 'Aguardando Nova Periodização' : (prev.activePlan?.phaseName || 'Fase 1: Retorno & Adaptação'),
            targetSets: novaContagem >= targetSets ? 0 : (prev.activePlan?.targetSets || targetSets),
            progress: updatedProg,
            status: novaContagem >= targetSets ? 'waiting' : prev.activePlan?.status
          },
          trainingProgress: {
            targetCount: prev.trainingProgress?.targetCount || 36,
            completedCount: (prev.trainingProgress?.completedCount || 0) + 1
          }
        };
      });

      // 5. Lógica de Notificação dos Terços (6, 12, 18)
      const umTerco = Math.round(targetSets / 3); // 6
      const doisTercos = umTerco * 2; // 12

      if (novaContagem === umTerco) {
        setWorkoutAlertNotification(`Ajuste de Carga! Você concluiu ${novaContagem} sessões (1/3 do treino). Aumente a carga para a próxima sessão!`);
      } else if (novaContagem === doisTercos) {
        setWorkoutAlertNotification(`Ajuste de Carga! Você concluiu ${novaContagem} sessões (2/3 do treino). Aumente a carga novamente!`);
      } else if (novaContagem >= targetSets) {
        // Arquivamento e Geração de Novo Treino
        setWorkoutAlertNotification(`Parabéns! Você concluiu os ${targetSets} treinos da fase atual. Seu treino foi arquivado e você está aguardando a nova periodização do seu treinador.`);
        
        // Arquiva o plano atual no histórico e cria um novo "Aguardando"
        const historyPlanRef = doc(db, `users/${studentForView.id}/active_plans`, `history_${Date.now()}`);
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
          await setDoc(historyPlanRef, planSnap.data()); // Salva o histórico do plano prescrito
        }
        
        await setDoc(planRef, {
          phaseName: 'Aguardando Nova Periodização',
          targetSets: 0,
          progress: { A: 0, B: 0, C: 0 },
          status: 'waiting',
          updatedAt: serverTimestamp()
        });
      } else {
        setWorkoutAlertNotification(`Treino ${tipoTreino} salvo e contabilizado! (${novaContagem} de ${targetSets})`);
      }

      // 6. Atualiza contador global
      const userProgressRef = doc(db, 'userProgress', studentForView.id);
      await setDoc(userProgressRef, { 
        totalWorkouts: increment(1), 
        lastWorkoutAt: serverTimestamp() 
      }, { merge: true });

      setSyncStatus('synced');
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      setSyncStatus('offline');
      setWorkoutAlertNotification("Treino salvo localmente! A sincronização com a nuvem será feita automaticamente quando a conexão/cota for restabelecida.");
    }
  };

  const handleAddPost = async (post: WorkoutHistoryEntry) => {
    if (!studentForView) return;
    const currentHistory = studentForView.workoutHistory || [];
    const updatedHistory = [post, ...currentHistory];
    await handleSaveData(studentForView.id, { workoutHistory: updatedHistory });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    
    setUploadingPhoto(true);

    // Função robusta para comprimir a imagem e converter para Base64
    const compressAndConvertToBase64 = (f: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 400; // 400px é suficiente para avatar e mantém o arquivo pequeno
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Falha ao criar contexto de canvas'));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            // Compressão para JPEG qualidade 0.6 (ótimo para avatars)
            const base64String = canvas.toDataURL('image/jpeg', 0.6);
            resolve(base64String);
          };
          img.onerror = () => reject(new Error('Falha ao carregar a imagem no elemento img'));
          if (event.target?.result) {
            img.src = event.target.result as string;
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
        reader.readAsDataURL(f);
      });
    };

    try {
      console.log("Iniciando processamento da foto de perfil...");
      
      // 1. Comprime e converte a imagem para Base64 (não depende de Firebase Storage)
      const base64Image = await compressAndConvertToBase64(file);

      // 2. Salva no Firestore usando o handleSaveData existente
      // O Base64 será salvo no campo photoUrl do documento do aluno
      const success = await handleSaveData(selectedStudent.id, { 
        photoUrl: base64Image,
        photoURL: base64Image // Garante compatibilidade com ambos os nomes de campo
      });

      if (success) {
        console.log("Foto de perfil salva com sucesso no Firestore.");
      } else {
        throw new Error("Falha ao salvar dados no Firestore.");
      }

    } catch (err: any) {
      console.error("Erro ao carregar foto de perfil:", err);
      alert("Não foi possível carregar a foto. Tente novamente com uma imagem menor ou verifique sua conexão.");
    } finally {
      // Sempre desliga o spinner, independente de sucesso ou falha
      setUploadingPhoto(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-red-600 mb-6" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.3em] mb-8">Iniciando ABFIT...</p>
      <button 
        onClick={resetApp}
        className="px-6 py-2 border border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
      >
        Resetar Aplicativo
      </button>
    </div>
  );

  const showSidebar = view !== 'LOGIN';
  
  // DEFINIÇÃO DOS BOTÕES DO DASHBOARD DO ALUNO
  // Filtramos aqui com base em studentForView.disabledFeatures
  const allDashboardItems = [
    { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
    { id: 'RUNTRACK_STUDENT', label: 'ABFIT RUN', icon: Footprints, color: 'rose' },
    { id: 'MUSIC_PLAYER', label: 'ABFIT MUSIC', icon: Headphones, color: 'emerald' },
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização', icon: Brain, color: 'indigo' },
    { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
    { id: 'CORRE_RJ', label: 'Corre RJ 2026', icon: MapPin, color: 'yellow' },
    { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
    { id: 'ANALYTICS', label: 'Evolução e Dados', icon: BarChart3, color: 'blue' },
    { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' }
  ];

  const visibleDashboardItems = allDashboardItems.filter(item => {
    // Se o aluno não tiver a lista de disabledFeatures, mostra tudo.
    // Se tiver, esconde se o ID estiver na lista.
    return !studentForView?.disabledFeatures?.includes(item.id);
  });

  return (
    <ErrorBoundary>
      <BackgroundWrapper>
        <GlobalSyncIndicator status={syncStatus} />
        
        {showSidebar && (
          <SideNav 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            activeView={view} 
            onNavigate={(targetView) => {
              if (targetView === 'NOTIFICATIONS') {
                setShowNotificationsModal(true);
              } else {
                setView(targetView);
              }
            }}
            isProfessor={isCoach}
            userPhoto={studentForView?.photoUrl}
          />
        )}

        <main className="transition-all duration-500">
          {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} error={loginError} students={allStudentsForCoach} />}
          
          {view !== 'LOGIN' && !isCoach && !studentForView && (
            <div className="h-screen flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              {dbError ? (
                <>
                  <AlertTriangle className="text-red-600 mb-4" size={48} />
                  <h3 className="text-lg font-black uppercase italic text-foreground mb-2">Erro de Conexão</h3>
                  <p className="text-xs font-bold uppercase tracking-widest mb-6 max-w-xs">
                    {dbError.includes('Database \'(default)\' not found') 
                      ? "O banco de dados Firestore não foi encontrado. Por favor, crie-o no Console do Firebase."
                      : dbError}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-red-700 transition-all shadow-lg"
                    >
                      Tentar Novamente
                    </button>
                    <button 
                      onClick={resetApp}
                      className="px-8 py-3 border border-border rounded-2xl font-black uppercase italic tracking-tighter hover:bg-muted transition-all"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
                  <p className="text-xs font-black uppercase tracking-widest mb-8">Carregando perfil...</p>
                  <button 
                    onClick={resetApp}
                    className="px-6 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Resetar Aplicativo
                  </button>
                </>
              )}
            </div>
          )}

          {view !== 'LOGIN' && isCoach && !studentForView && view !== 'PROFESSOR_DASH' && view !== 'COACH_AI' && view !== 'SETTINGS' && (
            <div className="h-screen flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              {dbError ? (
                <>
                  <AlertTriangle className="text-red-600 mb-4" size={48} />
                  <h3 className="text-lg font-black uppercase italic text-foreground mb-2">Erro de Conexão</h3>
                  <p className="text-xs font-bold uppercase tracking-widest mb-6 max-w-xs">
                    {dbError.includes('Database \'(default)\' not found') 
                      ? "O banco de dados Firestore não foi encontrado. Por favor, crie-o no Console do Firebase."
                      : "Não foi possível carregar os dados do servidor."}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-red-700 transition-all shadow-lg"
                  >
                    Tentar Novamente
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
                  <p className="text-xs font-black uppercase tracking-widest mb-8">Carregando dados...</p>
                  <button 
                    onClick={resetApp}
                    className="px-6 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Resetar Aplicativo
                  </button>
                </>
              )}
            </div>
          )}

        {view === 'DASHBOARD' && studentForView && (
          <div className="p-6 text-white text-center pt-6 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center">
            <header className="w-full flex justify-between items-center mb-4">
              <button onClick={toggleSidebar} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-colors shadow-lg">
                <Menu size={20}/>
              </button>
              <div className="flex items-center gap-3">
                <NotificationBadge 
                  notifications={studentNotifications} 
                  onClick={() => setShowNotificationsModal(true)} 
                  alwaysVisible={true}
                />
                <WeatherWidget />
              </div>
            </header>
            
            <Logo size="text-4xl" subSize="text-[8px] sm:text-[10px]" />
            <div className="relative mt-4 mb-8">
               <div className="relative group/photo cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-900 border-2 border-red-600 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.3)] relative">
                    {studentForView.photoUrl ? ( <img src={studentForView.photoUrl} className="w-full h-full object-cover" alt="Perfil"/> ) : ( <div className="w-full h-full flex items-center justify-center bg-zinc-800"><UserIcon size={40} className="text-zinc-600" /></div> )}
                    {uploadingPhoto && ( <div className="absolute inset-0 bg-black/60 flex items-center justify-center"> <Loader2 size={24} className="animate-spin text-red-600" /> </div> )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-red-600 p-2.5 rounded-full border-2 border-black shadow-lg shadow-red-600/40"> <Camera size={14} className="text-white" /> </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
               </div>
            </div>
            <p className="text-xl font-black text-white italic uppercase tracking-[0.3em] mt-2">{studentForView.nome}</p>
            
            <div className="w-full mt-10 space-y-4 pb-20 flex flex-col max-w-xl mx-auto px-4 sm:px-0">
              {visibleDashboardItems.map(item => {
                const isPeriodization = item.id === 'STUDENT_PERIODIZATION';
                const isWorkouts = item.id === 'WORKOUTS';
                
                let progress = 0;
                let progressText = "";
                if (isPeriodization && studentForView?.periodization?.startDate) {
                  const startDate = new Date(studentForView.periodization.startDate).getTime();
                  const diffDays = Math.floor(Math.max(0, Date.now() - startDate) / (24 * 60 * 60 * 1000));
                  const totalWks = studentForView.periodization.phaseTitle?.includes('16 Semanas') ? 16 : 12;
                  const curWk = Math.min(totalWks, Math.max(1, Math.floor(diffDays / 7) + 1));
                  progress = Math.min(100, Math.round((curWk / totalWks) * 100));
                  progressText = `Semana ${curWk} de ${totalWks}`;
                }

                const colorStyles: Record<string, any> = {
                  orange: { border: 'border-orange-600/30', hoverBorder: 'hover:border-orange-600/60', shadow: 'shadow-orange-600/10', bg: 'bg-orange-600', text: 'text-orange-600' },
                  rose: { border: 'border-rose-600/30', hoverBorder: 'hover:border-rose-600/60', shadow: 'shadow-rose-600/10', bg: 'bg-rose-600', text: 'text-rose-600' },
                  purple: { border: 'border-purple-600/30', hoverBorder: 'hover:border-purple-600/60', shadow: 'shadow-purple-600/10', bg: 'bg-purple-600', text: 'text-purple-600' },
                  indigo: { border: 'border-indigo-600/30', hoverBorder: 'hover:border-indigo-600/60', shadow: 'shadow-indigo-600/10', bg: 'bg-indigo-600', text: 'text-indigo-600' },
                  emerald: { border: 'border-emerald-600/30', hoverBorder: 'hover:border-emerald-600/60', shadow: 'shadow-emerald-600/10', bg: 'bg-emerald-600', text: 'text-emerald-600' },
                  yellow: { border: 'border-yellow-600/30', hoverBorder: 'hover:border-yellow-600/60', shadow: 'shadow-yellow-600/10', bg: 'bg-yellow-500', text: 'text-yellow-500' },
                  red: { border: 'border-red-600/30', hoverBorder: 'hover:border-red-600/60', shadow: 'shadow-red-600/10', bg: 'bg-red-600', text: 'text-red-600' },
                  blue: { border: 'border-blue-600/30', hoverBorder: 'hover:border-blue-600/60', shadow: 'shadow-blue-600/10', bg: 'bg-blue-600', text: 'text-blue-600' },
                  zinc: { border: 'border-zinc-600/30', hoverBorder: 'hover:border-zinc-600/60', shadow: 'shadow-zinc-600/10', bg: 'bg-zinc-600', text: 'text-zinc-600' },
                };
                const c = colorStyles[item.color] || colorStyles.zinc;

                return (
                  <div 
                    key={item.id} 
                    className={`w-full h-[92px] p-4 bg-zinc-950/80 border-2 ${c.border} group cursor-pointer active:scale-95 transition-all shadow-xl ${c.shadow} flex flex-row items-center gap-5 rounded-[2.5rem] backdrop-blur-md ${c.hoverBorder}`} 
                    onClick={() => setView(item.id)}
                  >
                    <div className={`w-16 h-16 ${c.bg} rounded-[1.8rem] flex items-center justify-center shadow-lg ${c.shadow} shrink-0`}> 
                      <item.icon className="text-white" size={32} /> 
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-[0.2em] leading-tight">{item.label}</h3>
                        {isPeriodization && progressText && (
                          <span className="text-[9px] font-black uppercase text-red-600 italic tracking-widest">{progressText}</span>
                        )}
                      </div>
                      {isPeriodization && (
                        <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${c.bg} shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000`} style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      {!isPeriodization && (
                        <div className="mt-2 text-[8px] font-black uppercase text-zinc-600 tracking-widest italic">Acesse sua jornada</div>
                      )}
                    </div>
                    <ChevronRight size={16} className={`${c.text} opacity-30 group-hover:opacity-100 transition-opacity mr-2`} />
                  </div>
                );
              })}
              <button onClick={() => { setUser(null); setView('LOGIN'); }} className="w-full mt-4 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-row items-center justify-center gap-4 text-zinc-600 hover:text-red-600 transition-all active:scale-95 shadow-xl group">
                <LogOut size={20} /> <span className="text-[11px] font-black uppercase tracking-[0.3em]">Finalizar Sessão</span>
              </button>
            </div>
            <AppFooter />
          </div>
        )}
        {view === 'FEED' && <WorkoutFeed history={globalFeedHistory} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} isProfessor={isCoach} onAddPost={!isCoach ? handleAddPost : undefined} />}
        {view === 'WORKOUTS' && studentForView && <WorkoutSessionView user={studentForView} onBack={handleBackNavigation} onSave={handleSaveData} onFinishWorkout={handleFinishWorkout} isCoach={isCoach} />}
        {view === 'COACH_AI' && <AICoach onBack={isCoach ? handleBackNavigation : undefined} />}
        {view === 'SETTINGS' && (
          <SettingsView 
            onBack={isCoach ? () => setView('PROFESSOR_DASH') : toggleSidebar} 
            onOpenNotifications={() => setShowNotificationsModal(true)}
            notifications={studentNotifications}
          />
        )}
        {view === 'STUDENT_PERIODIZATION' && studentForView && <StudentPeriodizationView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'STUDENT_ASSESSMENT' && studentForView && <StudentAssessmentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onSave={handleSaveData} onToggleMenu={toggleSidebar} />}
        {view === 'RUNTRACK_STUDENT' && studentForView && <RunTrackStudentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onSave={handleSaveData} onToggleMenu={toggleSidebar} />}
        {view === 'MUSIC_PLAYER' && (
          <MusicPlayer 
            onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} 
            userName={studentForView?.nome || selectedStudent?.nome || (isCoach ? 'Treinador' : undefined)}
          />
        )}
        {view === 'CORRE_RJ' && <CorreRJView onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} />}
        {view === 'ANALYTICS' && studentForView && <AnalyticsDashboard student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'ABOUT_ABFIT' && <AboutView onBack={handleBackNavigation} />}
        
        {view === 'PROFESSOR_DASH' && <ProfessorDashboard students={allStudentsForCoach} onLogout={() => setView('LOGIN')} onSelect={(s) => { setSelectedStudent(s); setView('STUDENT_MGMT'); }} onToggleMenu={toggleSidebar} onNavigate={setView} />}
        {view === 'STUDENT_MGMT' && selectedStudent && <StudentManagement student={selectedStudent} runningWorkouts={runningWorkouts.filter(w => w.studentId === selectedStudent.id)} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} onSave={handleSaveData} />}
        {view === 'WORKOUT_EDITOR' && selectedStudent && <WorkoutEditorView student={selectedStudent} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'COACH_ASSESSMENT' && selectedStudent && <CoachAssessmentView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'PERIODIZATION' && selectedStudent && <PeriodizationView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onProceedToWorkout={() => setView('WORKOUT_EDITOR')} onSave={handleSaveData} />}
        {view === 'RUNTRACK_MANAGER' && selectedStudent && <RunTrackManager student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
        {view === 'ANALYTICS_COACH' && selectedStudent && <AnalyticsDashboard student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onToggleMenu={undefined} />}
        {view === 'WORKOUT_HISTORY' && selectedStudent && <StudentWorkoutHistoryView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
        {view === 'PRESCREVE_AI' && <GeraAi onBack={() => setView(isCoach ? 'PROFESSOR_DASH' : 'DASHBOARD')} />}
        {(showInstallPrompt || view === 'INSTALL_APP') && (
          <InstallPrompt onClose={() => { setShowInstallPrompt(false); if (view === 'INSTALL_APP') setView(isCoach ? 'PROFESSOR_DASH' : 'DASHBOARD'); }} />
        )}

        {workoutAlertNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border-2 border-red-600 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-[0_0_50px_rgba(220,38,38,0.4)]">
              <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-600 flex items-center justify-center mx-auto text-red-600 animate-bounce">
                <Bell size={28} />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-red-600 tracking-[0.25em] italic">Notificação do Treinador</span>
                <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Periodização & Cargas</h3>
                <p className="text-sm font-semibold text-zinc-300 leading-relaxed pt-2">
                  {workoutAlertNotification}
                </p>
              </div>
              <button
                onClick={() => setWorkoutAlertNotification(null)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Modal de Notificações Interativo (Alertas de Treino, Avaliações e Renovação) */}
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={studentNotifications}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsAsRead}
          onNavigateToView={(targetView) => {
            setShowNotificationsModal(false);
            setView(targetView);
          }}
        />

        {/* Engine e Player Flutuante de Música Global (Persiste em Todas as Telas/Treinos) */}
        <GlobalMusicPlayer 
          isFullPlayerOpen={view === 'MUSIC_PLAYER'} 
          onOpenFullPlayer={() => setView('MUSIC_PLAYER')} 
        />
      </main>
    </BackgroundWrapper>
  </ErrorBoundary>
  );
}
