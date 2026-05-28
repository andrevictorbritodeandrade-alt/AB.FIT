
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints,
  Info, LogOut, Layout, Bell,
  BarChart3, ChevronRight, Activity, Settings2, Bot, ArrowLeft, Menu, MapPin,
  AlertTriangle, Sparkles, Calendar
} from 'lucide-react';
import { Logo, BackgroundWrapper, AppFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge, SideNav, HeaderTitle } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager, StudentWorkoutHistoryView } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import AICoach from './components/AICoach';
import { CorreRJView } from './components/CorreRJ';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId, handleFirestoreError, OperationType, collection, query, onSnapshot, doc, setDoc, addDoc } from './services/firebase';
import { Student, Workout, AppNotification, WorkoutHistoryEntry } from './types';
import { useTheme } from './components/ThemeContext';

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

function SettingsView({ onBack }: { onBack: () => void }) {
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

         <Card className="p-5 bg-card border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg">
                  <Bell className="text-white" size={20} />
               </div>
               <div>
                  <h4 className="text-[13px] font-black uppercase italic text-foreground">Notificações</h4>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Alertas de treino e renovação</p>
               </div>
            </div>
            <div className="w-10 h-5 bg-emerald-600 rounded-full relative">
               <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
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
    const coachOption = { name: "PROFESSOR", value: "PROFESSOR", type: "COACH" };
    const studentOptions = [...students]
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
      .map(s => ({
        name: s.nome,
        value: s.email,
        type: "ALUNO"
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
                      <div className="text-left"><p className="text-white text-base font-black uppercase tracking-tight text-left">{opt.name}</p><p className="text-[12px] text-zinc-500 lowercase text-left">{opt.value}</p></div>
                      <span className={`text-[11px] font-black px-2 py-1 rounded-full ${opt.type === 'COACH' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{opt.type}</span>
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
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const studentForView = useMemo(() => {
    if (!selectedStudent) return null;
    if (isCoach) return selectedStudent;
    // O aluno vê o que está selecionado (que vem do banco ou do merge)
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
        console.error("Erro na autenticação:", err);
        
        let errorMessage = "";
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          errorMessage = "O login anônimo está desativado no Console do Firebase. Por favor, ative-o em Authentication > Sign-in method > Anonymous.";
          console.warn(errorMessage);
          // We log it but don't set dbError to avoid blocking the whole app
        } else if (err.code === 'auth/configuration-not-found') {
          errorMessage = "Configuração do Firebase não encontrada ou incompleta.";
          console.warn(errorMessage);
        } else {
          console.warn("Auth warning:", err.message);
        }
        
        // Even if auth fails, we try to proceed since some rules are 'if true'
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
          workoutHistory: [
            {
              id: 'hist-1',
              name: 'Treino Livre',
              duration: '48:54',
              date: '19/04/2026',
              timestamp: new Date('2026-04-19T12:10:00').getTime(),
              type: 'RUNNING',
              runningStats: {
                distance: 3.74,
                avgHR: 105,
                calories: 223,
                elevation: 32,
                cadence: 101
              }
            },
            {
              id: 'hist-2',
              name: 'Treino Livre',
              duration: '33:15',
              date: '16/04/2026',
              timestamp: new Date('2026-04-16T22:22:00').getTime(),
              type: 'RUNNING',
              runningStats: {
                distance: 3.52,
                avgHR: 115,
                calories: 195,
                elevation: 2,
                cadence: 118
              }
            },
            {
              id: 'hist-3',
              name: 'Treino Livre',
              duration: '38:18',
              date: '15/04/2026',
              timestamp: new Date('2026-04-15T21:06:00').getTime(),
              type: 'RUNNING',
              runningStats: {
                distance: 3.12,
                avgHR: 110,
                calories: 174,
                elevation: 4,
                cadence: 104
              }
            },
            {
              id: 'hist-4',
              name: 'Treino Livre',
              duration: '29:31',
              date: '09/04/2026',
              timestamp: new Date('2026-04-09T16:03:00').getTime(),
              type: 'RUNNING',
              runningStats: {
                distance: 2.48,
                avgHR: 119,
                calories: 152,
                elevation: 41,
                cadence: 103
              }
            }
          ], 
          analytics: {
            sessionsCompleted: 0,
            streakDays: 0,
            exercises: {},
            lastSessionDate: ''
          },
          sexo: 'Feminino', 
          periodization: {
            id: 'per-liliane-01',
            titulo: 'Relatório Científico',
            startDate: '2026-02-23T00:00:00.000Z',
            type: 'STRENGTH',
            phaseTitle: 'Emagrecimento e Controle TDAH',
            generalStrategy: "Periodização focada em déficit calórico e preservação de massa magra. Usa variação constante de estímulos (circuitos, superséries, EMOM) para engajar o TDAH. Exercícios de baixo impacto protegem o joelho, fortalecendo quadril e core para otimizar a biomecânica e maximizar a perda de gordura.",
            clinicalSafety: [
              "Cuidados com o Joelho: Priorizar exercícios em cadeia cinética fechada (Leg Press, Agachamento, Elevação Pélvica). Evitar cadeira extensora com carga alta e atividades de alto impacto (saltos, corrida em esteira). Utilizar elíptico, remo ou bike para cardio.",
              "Manejo do TDAH: Utilizar métodos dinâmicos (EMOM, AMRAP, PHA) para evitar o tédio. Manter as sessões densas (45-50 minutos) com transições rápidas e metas claras de repetições/tempo para gamificar o treino e aumentar a adesão.",
              "Monitoramento de Emagrecimento: Como a meta é agressiva (15 kg em 6 meses), o déficit calórico será alto. Monitorar sinais de fadiga excessiva e ajustar a intensidade caso haja piora nas dores articulares ou episódios de desatenção severa."
            ],
            bioInsight: {
              context: "Liliane Torres é uma aluna com possível TDAH.",
              tips: ["Estrutura e Previsibilidade...", "Âncoras de Foco Visual...", "Reforço Imediato..."]
            },
            targetVolume: {
              "Quadríceps e Adutores": 6,
              "Glúteos e Posteriores": 6,
              "Peito": 2,
              "Costas e Cintura Escapular": 3,
              "Ombro": 3,
              "Biceps": 1,
              "Triceps": 1,
              "Core e Abdomen": 8
            },
            microciclos: [
              {
                range: "Semana 1-2",
                focus: "ADAPTAÇÃO ANATÔMICA E ENGAJAMENTO",
                method: "Circuito Full Body",
                intensity: "Baixa (50-60% 1RM)",
                volume: "Médio (60% V.Max)",
                reps: "15-20 reps",
                weeklyVolume: "MMII: 12, MMSS: 10, Core: 8",
                notes: "Foco em estabilização do joelho e transições rápidas entre exercícios para manter o foco (TDAH)."
              },
              {
                range: "Semana 3-4",
                focus: "RESISTÊNCIA MUSCULAR LOCALIZADA",
                method: "Agonista-Antagonista (Superséries)",
                intensity: "Média (60-65% 1RM)",
                volume: "Alto (75% V.Max)",
                reps: "12-15 reps",
                weeklyVolume: "MMII: 14, MMSS: 12, Core: 10",
                notes: "Utilizar exercícios em cadeia cinética fechada para os membros inferiores visando proteção patelofemoral."
              },
              {
                range: "Semana 5-6",
                focus: "HIPERTROFIA FUNCIONAL",
                method: "Tri-sets Dinâmicos",
                intensity: "Média-Alta (65-75% 1RM)",
                volume: "Alto (85% V.Max)",
                reps: "10-12 reps",
                weeklyVolume: "MMII: 16, MMSS: 14, Core: 10",
                notes: "Manter alta densidade de treino (descansos curtos) para prender a atenção e elevar o gasto calórico."
              },
              {
                range: "Semana 7-8",
                focus: "CHOQUE METABÓLICO",
                method: "PHA (Peripheral Heart Action)",
                intensity: "Alta (70-80% 1RM)",
                volume: "Muito Alto (100% V.Max)",
                reps: "8-12 reps",
                weeklyVolume: "MMII: 18, MMSS: 16, Core: 12",
                notes: "Alternar exercícios de MMSS e MMII para manter a frequência cardíaca alta sem sobrecarregar os joelhos."
              },
              {
                range: "Semana 9-10",
                focus: "RECUPERAÇÃO ATIVA E FORÇA BASE",
                method: "Treino Tradicional + LISS",
                intensity: "Alta (80-85% 1RM)",
                volume: "Baixo (50% V.Max)",
                reps: "6-8 reps",
                weeklyVolume: "MMII: 10, MMSS: 10, Core: 6",
                notes: "Reduzir volume para recuperar articulações. Dar foco no fortalecimento de glúteos para estabilizar os joelhos."
              },
              {
                range: "Semana 11-12",
                focus: "POTÊNCIA E CONDICIONAMENTO",
                method: "Complexos com Halteres/Kettlebell",
                intensity: "Média-Alta (70-75% 1RM)",
                volume: "Médio-Alto (75% V.Max)",
                reps: "8-10 reps",
                weeklyVolume: "MMII: 14, MMSS: 12, Core: 10",
                notes: "Evitar saltos (pliometria). Focar na velocidade da fase concêntrica para recrutar fibras de contração rápida."
              },
              {
                range: "Semana 13-14",
                focus: "DENSIDADE MÁXIMA",
                method: "EMOM (Every Minute on the Minute)",
                intensity: "Alta (75-80% 1RM)",
                volume: "Alto (85% V.Max)",
                reps: "10-12 reps",
                weeklyVolume: "MMII: 16, MMSS: 14, Core: 12",
                notes: "O relógio dita o ritmo. Excelente estímulo gamificado para manter a motivação e foco do TDAH."
              },
              {
                range: "Semana 15-16",
                focus: "POLIMENTO E PICO METABÓLICO",
                method: "Circuitos AMRAP",
                intensity: "Média (65-75% 1RM)",
                volume: "Alto (90% V.Max)",
                reps: "12-15 reps",
                weeklyVolume: "MMII: 16, MMSS: 14, Core: 12",
                notes: "Reta final para completar as 100 sessões. Foco em manter o movimento constante com exercícios de baixo impacto."
              }
            ]
          },
          workouts: [
            {
              id: 'treino-a-liliane',
              title: 'TREINO A - Musculação',
              status: 'published',
              exercises: [
                { id: 'l-a-1', name: 'LEG PRESS HORIZONTAL', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-2', name: 'LEG PRESS HORIZONTAL UNILATERAL', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-3', name: 'AGACHAMENTO NO BANCO COM HALTER', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-4', name: 'CADEIRA EXTENSORA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-5', name: 'CRUCIFIXO ABERTO NO BANCO RETO COM HALTER', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-6', name: 'ABDUÇÃO DE OMBROS EM PÉ COM HALTER', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-7', name: 'TRÍCEPS EM PÉ NO CROSS COM BARRA RETA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-8', name: 'ABDOMINAL SUPRA NO SOLO', sets: '3', reps: '15', rest: '45s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-liliane',
              title: 'TREINO B - Musculação',
              status: 'published',
              exercises: [
                { id: 'l-b-1', name: 'ELEVAÇÃO DE QUADRIL NO SOLO', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-2', name: 'EXTENSÃO DE QUADRIL EM PÉ COM CANELEIRA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-3', name: 'ABDUÇÃO DE QUADRIL EM PÉ COM CANELEIRA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-4', name: 'CADEIRA FLEXORA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-5', name: 'REMADA ABERTA EM PÉ NO CROSS', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-6', name: 'EXTENSÃO DE OMBROS EM PÉ NO CROSS', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-7', name: 'BÍCEPS EM PÉ NO CROSS COM BARRA RETA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-8', name: 'FLEXÃO PLANTAR EM PÉ', sets: '3', reps: '15', rest: '45s', executionType: 'Simples' }
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
                { id: 'ex-rod-1', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '50 min', rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        },
        { 
          id: 'fixed-andre', 
          nome: 'André Brito', 
          email: 'andrevictorbritodeandrade@gmail.com', 
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20of%20a%20black%20man%20named%20André%20Brito%2C%20full%20beard%2C%20round%20glasses%2C%20wearing%20a%20safari%20hat%20and%20leopard%20print%20shirt%2C%20standing%20in%20a%20colorful%20colonial%20street?width=400&height=400&nologo=true',
          age: 36,
          weight: 103,
          height: 180,
          goal: 'health',
          medicalHistory: '⚠️ Patela esquerda já saiu do lugar 4 vezes em um intervalo de 14 meses.',
          medications: 'BUP, Venvanse, Vitaminas bariátricas, Topiramato, Sertralina',
          physicalAssessments: [
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
          workoutHistory: [
            {
              id: "hist-andre-treino-b-20260519",
              workoutId: "treino-b-andre",
              name: "TREINO B (terças e sextas)",
              duration: "28:48",
              date: "19/05/2026",
              timestamp: new Date('2026-05-19T17:00:00').getTime(),
              type: "STRENGTH",
              exercises: [
                { id: 'a-b-1', name: 'REMADA ABERTA EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '30' },
                { id: 'a-b-2', name: 'REMADA NEUTRA NA MÁQUINA SENTADA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '15' },
                { id: 'a-b-3', name: 'CRUCIFIXO INVERSO NO BANCO 30 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '4' },
                { id: 'a-b-4', name: 'PUXADA ABERTA NO PULLEY ALTO COM BARRA RETA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '25' },
                { id: 'a-b-5', name: 'PUXADA SUPINADA NO PULLEY ALTO', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '25' },
                { id: 'a-b-6', name: 'EXTENSÃO DE OMBROS EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '20' },
                { id: 'a-b-7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '6', reps: '20', rest: '40s', executionType: 'Simples', load: '' }
              ]
            },
            {
              id: "hist-andre-run-20260428",
              workoutId: "unplanned",
              name: "Corrida",
              athleteName: "André Brito",
              duration: "43:43",
              date: "28/04/2026",
              timestamp: new Date('2026-04-28T15:54:00').getTime(),
              type: "RUNNING",
              runningStats: {
                distance: 3.71,
                avgSpeed: 5.1,
                avgHR: 113,
                calories: 345,
                steps: 4571,
                elevation: 17,
                vo2max: 36.1,
                vo2maxClass: "red",
                sweatLoss: 295,
                hydrationRecomendation: 442,
                weather: { temp: 28, condition: "Nublado", humidity: 81, wind: 18 },
                hrZones: {
                  max: "161-178 bpm",
                  anaerobic: "143-160 bpm",
                  aerobic: "125-142 bpm",
                  weightControl: "107-124 bpm",
                  lowIntensity: "89-106 bpm"
                },
                splits: [
                  { km: "1.00", time: "12:00", speed: "4.9 km/h" },
                  { km: "1.00", time: "11:37", speed: "5.1 km/h" },
                  { km: "1.00", time: "11:46", speed: "5.0 km/h" },
                  { km: "0.71", time: "08:19", speed: "5.1 km/h" }
                ]
              }
            },
            {
              id: "hist-andre-run-20260420",
              workoutId: "unplanned",
              name: "Corrida",
              athleteName: "André Brito",
              duration: "46:20",
              date: "20/04/2026",
              timestamp: new Date('2026-04-20T17:32:00').getTime(),
              type: "RUNNING",
              runningStats: {
                distance: 4.50,
                avgPace: "10'17\"",
                avgHR: 131,
                calories: 362,
                cadence: 112,
                elevation: 34,
                vo2max: 36.1,
                vo2maxClass: "red",
                sweatLoss: 606,
                hydrationRecomendation: 909,
                hrZones: {
                  max: "161-178 bpm (Uso Mínimo)",
                  anaerobic: "143-160 bpm (Uso Moderado)",
                  aerobic: "125-142 bpm (Uso Predominante/Longo)",
                  weightControl: "107-124 bpm (Uso Baixo)",
                  lowIntensity: "89-106 bpm (Uso Baixo)"
                },
                advancedMetricsColors: {
                  asymmetry: "blue",
                  groundTime: "orange",
                  airTime: "green",
                  regularity: "blue",
                  vertical: "orange",
                  stiffness: "orange"
                },
                splits: [
                  { km: "1.00", time: "11:42", pace: "11'42\"" },
                  { km: "1.00", time: "09:04", pace: "09'04\"" },
                  { km: "1.00", time: "09:52", pace: "09'52\"" },
                  { km: "1.00", time: "10:12", pace: "10'12\"" },
                  { km: "0.50", time: "05:28", pace: "10'53\"" }
                ]
              }
            },
            {
              id: "hist-andre-run-20260419",
              workoutId: "unplanned",
              name: "Corrida (ritmo de caminhada)",
              athleteName: "André Brito",
              duration: "48:54",
              date: "19/04/2026",
              timestamp: new Date('2026-04-19T12:10:00').getTime(),
              type: "RUNNING",
              runningStats: {
                distance: 3.74,
                avgPace: "13'04\"",
                avgHR: 105,
                calories: 223,
                cadence: 101,
                elevation: 32,
                vo2max: 36.1,
                vo2maxClass: "green",
                sweatLoss: 317,
                hydrationRecomendation: 475,
                weather: { temp: 27, condition: "Sol entre nuvens", humidity: 76, wind: 23 },
                hrZones: {
                  max: "161-178 bpm (0%)",
                  anaerobic: "143-160 bpm (0%)",
                  aerobic: "125-142 bpm (Mínimo/Traço)",
                  weightControl: "107-124 bpm (Presença significativa)",
                  lowIntensity: "89-106 bpm (PREDOMINANTE)"
                },
                splits: [
                  { km: "1.00", time: "13:57", pace: "13'57\"" },
                  { km: "1.00", time: "12:56", pace: "12'56\"" },
                  { km: "1.00", time: "12:34", pace: "12'34\"" },
                  { km: "0.74", time: "09:26", pace: "12'43\"" }
                ]
              }
            },
            {
              id: "hist-andre-run-20260416",
              workoutId: "treino-rodagem",
              name: "Caminhada",
              athleteName: "André Brito",
              duration: "33:15",
              date: "16/04/2026",
              timestamp: new Date('2026-04-16T22:22:00').getTime(),
              type: "RUNNING",
              runningStats: {
                distance: 3.52,
                avgSpeed: 6.3,
                avgHR: 115,
                calories: 195,
                steps: 3967,
                elevation: 2,
                vo2max: 36.1,
                vo2maxClass: "green",
                sweatLoss: 188,
                hydrationRecomendation: 282,
                weather: { temp: 23, condition: "Céu limpo/Noite", humidity: 88, wind: 11 },
                hrZones: {
                  max: "161-178 bpm (0%)",
                  anaerobic: "143-160 bpm (Traço mínimo)",
                  aerobic: "125-142 bpm (Presença moderada)",
                  weightControl: "107-124 bpm (Predominante)",
                  lowIntensity: "89-106 bpm (Presença moderada)"
                },
                splits: [
                  { km: "1.00", time: "11:25", speed: "5.2 km/h" },
                  { km: "1.00", time: "09:18", speed: "6.4 km/h" },
                  { km: "1.00", time: "08:04", speed: "7.4 km/h" },
                  { km: "0.52", time: "04:26", speed: "7.1 km/h" }
                ]
              }
            },
            {
              id: "hist-andre-run-20260415",
              workoutId: "treino-intervalado-desconfortavel",
              name: "Corrida",
              athleteName: "André Brito",
              duration: "38:18",
              date: "15/04/2026",
              timestamp: new Date('2026-04-15T21:06:00').getTime(),
              type: "RUNNING",
              runningStats: {
                distance: 3.12,
                avgPace: "12'14\"",
                avgHR: 110,
                calories: 174,
                cadence: 104,
                elevation: 4,
                vo2max: 36.1,
                vo2maxClass: "orange",
                sweatLoss: 252,
                hydrationRecomendation: 378,
                weather: { temp: 23, condition: "Céu limpo com nuvens", humidity: 91, wind: 5 },
                hrZones: {
                  max: "162-179 bpm (Inexistente)",
                  anaerobic: "144-161 bpm (Inexistente)",
                  aerobic: "126-143 bpm (Baixa presença)",
                  weightControl: "108-125 bpm (PREDOMINANTE)",
                  lowIntensity: "89-107 bpm (Presença moderada)"
                },
                advancedMetricsColors: {
                  asymmetry: "blue",
                  groundTime: "orange",
                  airTime: "green",
                  regularity: "blue",
                  vertical: "orange",
                  stiffness: "orange"
                },
                splits: [
                  { km: "1.00", time: "11:52", pace: "11'52\"" },
                  { km: "1.00", time: "13:21", pace: "13'21\"" },
                  { km: "1.00", time: "13:26", pace: "13'26\"" },
                  { km: "0.13", time: "01:37", pace: "12'46\"" }
                ]
              }
            }
          ], 
          analytics: {
            sessionsCompleted: 6,
            streakDays: 2,
            exercises: {
              'Remada aberta na máquina': { completed: 1, skipped: 0 },
              'Puxada aberta com barra romana pulley alto': { completed: 1, skipped: 0 },
              'Voador dorsal': { completed: 1, skipped: 0 },
              'Bíceps neutro com HBC banco 75 graus': { completed: 1, skipped: 0 },
              'Bíceps em pé com HBM pegada supinada': { completed: 1, skipped: 0 },
              'Agachamento sumô com HBC': { completed: 1, skipped: 0 },
              'Subida no step': { completed: 1, skipped: 0 },
              'Extensão de quadril e joelho em pé no cross': { completed: 1, skipped: 0 },
              'Mata-borrão isométrico no solo (super-man)': { completed: 1, skipped: 0 },
              'REMADA ABERTA EM PÉ NO CROSS': { completed: 1, skipped: 0 },
              'REMADA NEUTRA NA MÁQUINA SENTADA': { completed: 1, skipped: 0 },
              'CRUCIFIXO INVERSO NO BANCO 30 GRAUS COM HALTER': { completed: 1, skipped: 0 },
              'PUXADA ABERTA NO PULLEY ALTO COM BARRA RETA': { completed: 1, skipped: 0 },
              'PUXADA SUPINADA NO PULLEY ALTO': { completed: 1, skipped: 0 },
              'EXTENSÃO DE OMBROS EM PÉ NO CROSS': { completed: 1, skipped: 0 },
              'ABDOMINAL SUPRA NO SOLO': { completed: 1, skipped: 0 }
            } as Record<string, { completed: number; skipped: number }>,
            lastSessionDate: '19/05/2026'
          },
          sexo: 'Masculino', 
          periodization: {
            id: 'per-andre-01',
            titulo: 'Periodização Científica',
            startDate: '2026-04-30T10:00:00Z',
            type: 'STRENGTH',
            phaseTitle: 'Mesociclo de Recomposição Corporal, Mitigação de Sarcopenia Pós-Bariátrica e Estabilização Patelofemoral - 12 Semanas',
            generalStrategy: "O perfil do aluno Andre apresenta alta complexidade fisiologica devido ao status pos-cirurgia bariatrica, demandando foco absoluto na mitigacao da sarcopenia (retencao de massa magra) e estimulo a sintese proteica para suportar o deficit calorico continuo rumo aos 87kg. A instabilidade patelar cronica (4 luxacoes) exige prescricao biomecanica restritiva, priorizando o fortalecimento do Vasto Medial Obliquo (VMO) e gluteo medio em cadeia cinetica fechada para realinhamento patelofemoral. O espectro autista (TEA) combinado ao TDAH sugere a necessidade de previsibilidade macroestrutural ambiental para conforto cognitivo, aliada a microvariacoes nos estimulos (gamificacao de carga e metodo) para engajamento dopaminergico continuo.",
            clinicalSafety: [
              "Biomecanica Patelar: Substituir Cadeira Extensora tradicional com arco completo de movimento por variacoes em cadeia cinetica fechada (Leg Press com pes altos, Box Squat, Step-ups controlados) para reduzir forcas de cisalhamento. Fortalecimento de abdutores e rotadores externos do quadril e fundamental para evitar o valgo dinamico.",
              "Fisiologia Pos-Bariatrica: Risco elevado de perda de densidade ossea, malabsorcao e sarcopenia. A hidratacao intra-treino deve ocorrer em pequenos goles constantes (100ml a cada 15 min) para evitar distensao gastrica ou dumping. Garantir com a equipe de nutricao aporte proteico peri-treino adequado.",
              "Neurodivergencia (TEA e TDAH): Manter a ordem geral dos exercicios estritamente identica para evitar ansiedade antecipatoria (TEA), mas estipular quebra de micro-recordes (PRs de carga, repeticao ou qualidade de movimento) para garantir o pico de dopamina necessario ao foco (TDAH). Considerar o uso de fones com cancelamento de ruido para isolamento sensorial no ambiente de academia.",
              "Recuperacao e Sono: O aluno necessita de higiene do sono rigorosa, pois o deficit calorico somado ao choque neuromuscular exigira otimizacao do GH e testosterona liberados predominantemente nas fases de sono profundo, cruciais para a manutencao da massa magra pos-bariatrica."
            ],
            bioInsight: {
              context: "Referências Científicas: Schoenfeld, B. J. (2010). The mechanisms of muscle hypertrophy and their application to resistance training. Journal of Strength and Conditioning Research, 24(10), 2857-2872. | Escamilla, R. F., et al. (2009). Patellofemoral joint kinematics and kinetics during common lower extremity exercises. Sports Medicine, 39(1), 15-37. | Mechanick, J. I., et al. (2020). Clinical Practice Guidelines for the Perioperative Nutrition, Metabolic, and Nonsurgical Support of Patients Undergoing Bariatric Procedures. Surgery for Obesity and Related Diseases, 16(2), 175-247. | Ratey, J. J. (2008). Spark: The Revolutionary New Science of Exercise and the Brain. Little, Brown Spark. (Mecanismos neurobiologicos do exercicio no TDAH e TEA).",
              tips: []
            },
            targetVolume: {
              "Peito": 11,
              "Costas e Cintura Escapular": 11,
              "Ombro": 11,
              "Biceps": 11,
              "Triceps": 11,
              "Quadríceps e Adutores": 11,
              "Glúteos e Posteriores": 11,
              "Core e Abdomen": 11
            },
            microciclos: [
              {
                id: 'm1',
                semanas: '1-3',
                titulo: 'ADAPTAÇÃO ANATÔMICA, ESTABILIDADE ARTICULAR E CONTROLE MOTOR',
                metodo: 'Tempo Training (Cadência 4010)',
                intensidade: '60-65% 1RM | RIR 3-4 | PSE 6',
                volume: '10-12 series/musculo/semana | 12-15 repeticoes',
                descricao: 'Obs: Foco na fase excentrica para adaptacao tendinea. Evitar flexao de joelho alem de 90 graus. Nos exercicios de extensao de joelho, utilizar apenas isometria nos 15 graus finais (terminal knee extension) para ativação específica de VMO sem cisalhamento excessivo. Ambiente de treino deve ser previsivel.'
              },
              {
                id: 'm2',
                semanas: '4-6',
                titulo: 'HIPERTROFIA MIOFIBRILAR E DENSIDADE DE TREINO',
                metodo: 'Superseries Agonista-Antagonista',
                intensidade: '70-75% 1RM | RIR 2 | PSE 7-8',
                volume: '12-14 series/musculo/semana | 8-12 repeticoes',
                descricao: 'Obs: Progressao de carga linear. Uso de superseries para otimizar a sessao de 60 min, mantendo a frequencia cardiaca elevada (potencializando oxidacao lipidica). Fornecer feedbacks claros e objetivos (TEA). Monitorar fadiga abrupta e sinais de hipoglicemia reativa comum em pacientes bariatricos.'
              },
              {
                id: 'm3',
                semanas: '7-9',
                titulo: 'FORÇA SUBMÁXIMA E RESISTÊNCIA METABÓLICA',
                metodo: 'Cluster Sets (Superiores) e Circuito Fechado (Inferiores)',
                intensidade: '80-85% 1RM | RIR 1-2 | PSE 8-9',
                volume: '14-16 series/musculo/semana | 4-6 repeticoes (Cluster) e 15-20 (Circuito)',
                descricao: 'Obs: Uso de Agachamento em Caixa (Box Squat) para garantir bloqueio biomecanico de amplitude e confianca na estabilidade patelar. O metodo Cluster Set permite o uso de cargas mais altas mantendo alta qualidade de execucao, fracionando a serie para modular o deficit de atencao (TDAH) atraves de pequenas metas sequenciais.'
              },
              {
                id: 'm4',
                semanas: '10-12',
                titulo: 'CHOQUE METABÓLICO E MAXIMIZADO DE EPOC',
                metodo: 'Rest-Pause',
                intensidade: '75-80% 1RM | RIR 0-1 | PSE 9-10',
                volume: '16-18 series/semana (Sem. 10-11) e 10 series (Sem. 12)',
                descricao: 'Obs: Elevacao do estresse metabolico para maximizar o Consumo Excessivo de Oxigenio Pos-Exercicio (EPOC). Semana 12 servira como Tapering (reducao de 40% do volume) para dissipar fadiga acumulada e consolidar a recomposicao corporal. Atencao redobrada a tecnica sob fadiga para protecao patelofemoral.'
              }
            ]
          },
          faseAjusteA: 5,
          faseAjusteB: 4,
          faseAjusteC: 3,
          totalGlobalA: 5,
          totalGlobalB: 4,
          totalGlobalC: 3,
          trainingProgress: { completedCount: 12, targetCount: 60 },
          workouts: [
            {
              id: 'treino-a-andre',
              title: 'TREINO A (segundas e quintas)',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'a-a-1', name: 'SUPINO ABERTO NO BANCO RETO COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-a-2', name: 'SUPINO ABERTO ALTERNADO NO BANCO 30 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-a-3', name: 'CRUCIFIXO ABERTO NO BANCO RETO COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-a-4', name: 'DESENVOLVIMENTO NO BANCO 75 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-a-5', name: 'FLEXÃO DE OMBRO ALTERNADO NO BANCO 75 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-a-6', name: 'ABDUÇÃO DE OMBROS EM PÉ COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-a-7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '6', reps: '20', rest: '40s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-andre',
              title: 'TREINO B (terças e sextas)',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'a-b-1', name: 'REMADA ABERTA EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '30' },
                { id: 'a-b-2', name: 'REMADA NEUTRA NA MÁQUINA SENTADA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '15' },
                { id: 'a-b-3', name: 'CRUCIFIXO INVERSO NO BANCO 30 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '4' },
                { id: 'a-b-4', name: 'PUXADA ABERTA NO PULLEY ALTO COM BARRA RETA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '25' },
                { id: 'a-b-5', name: 'PUXADA SUPINADA NO PULLEY ALTO', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '25' },
                { id: 'a-b-6', name: 'EXTENSÃO DE OMBROS EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '20' },
                { id: 'a-b-7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '6', reps: '20', rest: '40s', executionType: 'Simples', load: '' }
              ]
            },
            {
              id: 'treino-c-andre',
              title: 'TREINO C (quartas e sábados)',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'a-c-1', name: 'Elevação de quadril no banco (Hip Thrust)', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-c-2', name: 'Leg press horizontal (amplitude reduzida)', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-c-3', name: 'Mesa flexora', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-c-4', name: 'Cadeira abdutora', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-c-5', name: 'Stiff unilateral com halter', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-c-6', name: 'Panturrilha em pé no smith', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'a-c-7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '6', reps: '20', rest: '40s', executionType: 'Simples' }
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
                { id: 'ex-rod-1', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '50 min', rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        }, 
        { 
          id: 'fixed-marcelly', 
          nome: 'Marcelly Bispo', 
          email: 'marcellybispo92@gmail.com', 
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20of%20a%20black%20woman%20named%20Marcelly%20Bispo%2C%20voluminous%20curly%20afro%20hair%2C%20wearing%20a%20yellow%20leopard%20print%20one-shoulder%20top%20and%20skirt%2C%20standing%20in%20a%20colorful%20Brazilian%20colonial%20street?width=400&height=400&nologo=true',
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
            id: 'per-marcelly-01',
            titulo: 'Periodização Científica',
            startDate: '2026-04-30T10:00:00Z',
            type: 'STRENGTH',
            phaseTitle: 'Macrociclo de Hipertrofia Progressiva e Choque Tensional - 12 Semanas',
            generalStrategy: "A periodização de Marcelly foca no ganho de 2kg de massa muscular limpa (hipertrofia) otimizando uma janela de 60 minutos diários, 5 vezes por semana. A fisiologia da hipertrofia exige tensão mecânica, estresse metabólico e dano muscular. O plano utiliza uma Periodização Ondulatória para garantir estímulos constantes. Considerando o quadro suspeito de TDAH, o treinamento foi estruturado com alta densidade, métodos avançados dinâmicos e pausas ativas ou curtas para manter altos níveis de dopamina e noradrenalina, otimizando o engajamento cognitivo e o foco durante as sessões.",
            clinicalSafety: [
              "Nutrição e Composição Corporal: Para atingir a meta de +2kg de massa magra, é indispensável dieta hipercalórica leve (+200 a 300kcal/dia) com ingestão proteica entre 1.8g/kg e 2.2g/kg.",
              "Manejo do TDAH (Suspeito): Evitar pausas longas e passivas. Substituir por descansos ativos (alongamentos leves, mobilidade) ou métodos de alta densidade para manter a estimulação dopaminérgica contínua. Fones de ouvido com música estimulante são altamente recomendados.",
              "Recuperação e Modulação do Estresse: Atenção rigorosa à higiene do sono (mínimo de 7-8h). O sono de qualidade é crucial para a liberação noturna de GH, testosterona e reparo do dano muscular.",
              "Biomecânica: Focar em amplitude completa de movimento (ADM) e controle da cadência (ex: 3 segundos na fase excêntrica) para maximizar o tempo sob tensão sem sobrecarregar as articulações com cargas excessivas."
            ],
            bioInsight: {
              context: "Embasamento Científico: Schoenfeld, B. J. (2010). The mechanisms of muscle hypertrophy and their application to resistance training. Journal of Strength and Conditioning Research, 24(10), 2857-2872. | American College of Sports Medicine (ACSM) (2009). Progression Models in Resistance Training for Healthy Adults. Medicine & Science in Sports & Exercise, 41(3), 687-708. | Ratey, J. J. (2008). Spark: The Revolutionary New Science of Exercise and the Brain. Little, Brown Spark.",
              tips: [
                "Semanas 1-4: Adaptação Anatômica e Hipertrofia Base. Intensidade: 70-75% 1RM (RIR 2-3). Volume: 12-14 séries semanais por grupamento, 8-12 repetições. Método: Pirâmide crescente e drop-sets eventuais.",
                "Semanas 5-8: Tensão Mecânica e Hipertrofia Miofibrilar. Intensidade: 80-85% 1RM (RIR 1-2). Volume: 14-16 séries semanais por grupamento, 6-8 repetições. Método: Rest-Pause (Pausa-Descanso).",
                "Semanas 9-11: Estresse Metabólico e Overreaching Funcional. Intensidade: 65-75% 1RM (RIR 0 - Falha Momentânea). Volume: 18-20 séries semanais por grupamento, 12-15 repetições. Método: Bi-sets agonista-antagonista e cluster sets.",
                "Semana 12: Supercompensação e Dissipação de Fadiga (Deload). Intensidade: 50-60% 1RM (RIR 3-4). Volume: 8-10 séries semanais por grupamento, 10-12 repetições. Método: Séries tradicionais com foco em conexão mente-músculo."
              ]
            },
            targetVolume: {
              "Peito": 13,
              "Costas e Cintura Escapular": 13,
              "Ombro": 13,
              "Biceps": 13,
              "Triceps": 13,
              "Quadríceps e Adutores": 13,
              "Glúteos e Posteriores": 13,
              "Core e Abdomen": 13
            },
            microciclos: [
              {
                id: 'm1',
                semanas: '1-4',
                titulo: 'ADAPTAÇÃO ANATÔMICA E HIPERTROFIA BASE',
                intensidade: '70-75% 1RM (RIR 2-3)',
                volume: '12-14 SÉRIES SEMANAIS POR GRUPAMENTO, 8-12 REPETIÇÕES',
                metodo: 'PIRÂMIDE CRESCENTE E DROP-SETS EVENTUAIS',
                descricao: 'Sessões estruturadas para focar em grupos específicos dentro de 60 minutos. Ritmo dinâmico para evitar dispersão atencional.'
              },
              {
                id: 'm2',
                semanas: '5-8',
                titulo: 'TENSÃO MECÂNICA E HIPERTROFIA MIOFIBRILAR',
                intensidade: '80-85% 1RM (RIR 1-2)',
                volume: '14-16 SÉRIES SEMANAIS POR GRUPAMENTO, 6-8 REPETIÇÕES',
                metodo: 'REST-PAUSE (PAUSA-DESCANSO)',
                descricao: 'Excelente para traços de TDAH, pois o tempo de descanso é curtíssimo (10-15s), mantendo o sistema nervoso central em alerta e encurtando o tempo da sessão.'
              },
              {
                id: 'm3',
                semanas: '9-11',
                titulo: 'ESTRESSE METABÓLICO E OVERREACHING FUNCIONAL',
                intensidade: '65-75% 1RM (RIR 0 - FALHA MOMENTÂNEA)',
                volume: '18-20 SÉRIES SEMANAIS POR GRUPAMENTO, 12-15 REPETIÇÕES',
                metodo: 'BI-SETS AGONISTA-ANTAGONISTA E CLUSTER SETS',
                descricao: 'Aumenta drasticamente o fluxo sanguíneo (pump) e economiza tempo. Transições rápidas sustentam o foco mental de indivíduos neurodivergentes.'
              },
              {
                id: 'm4',
                semanas: '12',
                titulo: 'SUPERCOMPENSAÇÃO E DISSIPAÇÃO DE FADIGA (DELOAD)',
                intensidade: '50-60% 1RM (RIR 3-4)',
                volume: '8-10 SÉRIES SEMANAIS POR GRUPAMENTO, 10-12 REPETIÇÕES',
                metodo: 'SÉRIES TRADICIONAIS COM FOCO EM CONEXÃO MENTE-MÚSCULO',
                descricao: 'Redução do estresse sistêmico para permitir a regeneração tecidual e consolidação dos ganhos hipertróficos projetados (2kg).'
              }
            ]
          },
          faseAjusteA: 2,
          faseAjusteB: 2,
          faseAjusteC: 1,
          totalGlobalA: 2,
          totalGlobalB: 2,
          totalGlobalC: 1,
          trainingProgress: { completedCount: 5, targetCount: 60 },
          workouts: [
            {
              id: 'treino-a-marcelly',
              title: 'TREINO A (segundas e quintas)',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'm-a-1', name: 'AGACHAMENTO LIVRE COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-a-2', name: 'AGACHAMENTO PASSADA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-a-3', name: 'AGACHAMENTO NO BANCO COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-a-4', name: 'LEG PRESS HORIZONTAL', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-a-5', name: 'LEG PRESS HORIZONTAL UNILATERAL', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-a-6', name: 'ABDOMINAL SUPRA NO SOLO', sets: '5', reps: '20', rest: '40s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-marcelly',
              title: 'TREINO B (terças e sextas)',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'm-b-1', name: 'AGACHAMENTO SUMÔ COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-b-2', name: 'LEVANTAMENTO TERRA COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-b-3', name: 'STIFF EM PÉ COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-b-4', name: 'ELEVAÇÃO DE QUADRIL NO SOLO', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-b-5', name: 'CADEIRA FLEXORA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-b-6', name: 'ABDOMINAL SUPRA NO SOLO', sets: '5', reps: '20', rest: '40s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-c-marcelly',
              title: 'TREINO C (quartas e sábados)',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'm-c-1', name: 'SUPINO ABERTO NO BANCO RETO COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-c-2', name: 'DESENVOLVIMENTO NO BANCO 75 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-c-3', name: 'REMADA ABERTA EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-c-4', name: 'PUXADA NEUTRA NO PULLEY', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-c-5', name: 'TRÍCEPS EM PÉ NO CROSS COM BARRA RETA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                { id: 'm-c-6', name: 'ABDOMINAL SUPRA NO SOLO', sets: '5', reps: '20', rest: '40s', executionType: 'Simples' }
              ]
            }
          ]
        }
    ], []);

  useEffect(() => {
    let unsub: () => void;
    
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
            if (student.id === 'fixed-andre' && (!student.workouts || student.workouts.length === 0)) {
                student.workouts = [
                    {
                      id: 'treino-a-andre',
                      title: 'TREINO A (segundas e quintas)',
                      status: 'published',
                      exercises: [
                        { id: 'a-a-1', name: 'SUPINO ABERTO NO BANCO RETO COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                        { id: 'a-a-2', name: 'SUPINO ABERTO ALTERNADO NO BANCO 30 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                        { id: 'a-a-3', name: 'CRUCIFIXO ABERTO NO BANCO RETO COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                        { id: 'a-a-4', name: 'DESENVOLVIMENTO NO BANCO 75 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                        { id: 'a-a-5', name: 'FLEXÃO DE OMBRO ALTERNADO NO BANCO 75 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                        { id: 'a-a-6', name: 'ABDUÇÃO DE OMBROS EM PÉ COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples' },
                        { id: 'a-a-7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '6', reps: '20', rest: '40s', executionType: 'Simples' }
                      ]
                    },
                    {
                      id: 'treino-b-andre',
                      title: 'TREINO B (terças e sextas)',
                      status: 'published',
                      exercises: [
                        { id: 'a-b-1', name: 'REMADA ABERTA EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '30' },
                        { id: 'a-b-2', name: 'REMADA NEUTRA NA MÁQUINA SENTADA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '15' },
                        { id: 'a-b-3', name: 'CRUCIFIXO INVERSO NO BANCO 30 GRAUS COM HALTER', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '4' },
                        { id: 'a-b-4', name: 'PUXADA ABERTA NO PULLEY ALTO COM BARRA RETA', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '25' },
                        { id: 'a-b-5', name: 'PUXADA SUPINADA NO PULLEY ALTO', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '25' },
                        { id: 'a-b-6', name: 'EXTENSÃO DE OMBROS EM PÉ NO CROSS', sets: '4', reps: '12', rest: '40s', executionType: 'Simples', load: '20' },
                        { id: 'a-b-7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '6', reps: '20', rest: '40s', executionType: 'Simples', load: '' }
                      ]
                    },
                ];
            }
            if (student.nome?.includes('Marcelly') && student.workouts) {
              student.workouts = student.workouts.filter(w => !((w.title?.toUpperCase() === 'TREINO A') && (!w.exercises || w.exercises.length === 0)));
            }
            return student;
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
              
              // --- MERGE COM DADOS PADRÃO (FIX PARA ALUNO) ---
              const defaultProfile = defaultStudentsData.find(d => d.id === rawData.id || (d.email && rawData.email && d.email.toLowerCase() === rawData.email.toLowerCase()));
              
              if (defaultProfile) {
                  let hasCloudChanges = false;
                  
                  if (!rawData.nome) { rawData.nome = defaultProfile.nome; hasCloudChanges = true; }
                  if (!rawData.email) { rawData.email = defaultProfile.email; hasCloudChanges = true; }
                  
                  if (!rawData.periodization && defaultProfile.periodization) {
                      rawData.periodization = defaultProfile.periodization;
                      hasCloudChanges = true;
                  } else if (rawData.periodization && defaultProfile.periodization) {
                      rawData.periodization!.targetVolume = defaultProfile.periodization.targetVolume;
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
                  
                  if (workoutsModified || !rawData.workouts) {
                      rawData.workouts = currentWorkouts;
                      hasCloudChanges = true;
                  }
                  
                  // History Sync (Union based on ID)
                  let currentHistory = rawData.workoutHistory || [];
                  const defaultHistory = defaultProfile.workoutHistory || [];

                  // Force global counts for Andre
                  if (defaultProfile.email === 'andrevictorbritodeandrade@gmail.com') {
                    if (rawData.totalGlobalA === undefined || rawData.totalGlobalA < 5) { rawData.totalGlobalA = 5; hasCloudChanges = true; }
                    if (rawData.totalGlobalB === undefined || rawData.totalGlobalB < 4) { rawData.totalGlobalB = 4; hasCloudChanges = true; }
                    if (rawData.totalGlobalC === undefined || rawData.totalGlobalC < 3) { rawData.totalGlobalC = 3; hasCloudChanges = true; }
                    if (rawData.faseAjusteA === undefined || rawData.faseAjusteA < 5) { rawData.faseAjusteA = 5; hasCloudChanges = true; }
                    if (rawData.faseAjusteB === undefined || rawData.faseAjusteB < 4) { rawData.faseAjusteB = 4; hasCloudChanges = true; }
                    if (rawData.faseAjusteC === undefined || rawData.faseAjusteC < 3) { rawData.faseAjusteC = 3; hasCloudChanges = true; }
                    if (!rawData.trainingProgress || rawData.trainingProgress.completedCount < 12) {
                        rawData.trainingProgress = { completedCount: 12, targetCount: 60 };
                        hasCloudChanges = true;
                    }
                  }

                  // Override for André Brito to ensure PERFECTLY sync history and weights (as requested)
                  if (defaultProfile.email === 'andrevictorbritodeandrade@gmail.com' && !(rawData as any)._fixedHistoryMay19) {
                      currentHistory = defaultHistory;
                      (rawData as any)._fixedHistoryMay19 = true;
                      hasCloudChanges = true;
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
                  
                  if (assessmentsModified || hasCloudChanges) {
                      rawData.physicalAssessments = mergedAssessments;
                      hasCloudChanges = true;
                  }

                  // If we detected that local defaults were missing from cloud, sync them up
                  if (hasCloudChanges) {
                      const docRefSave = doc(db, path);
                      try {
                        console.log(`Sincronizando dados base de ${rawData.nome} para a nuvem...`);
                        await setDoc(docRefSave, { 
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
                        }, { merge: true });

                        // Also sync to prescricoes subcollection for server-side endpoints
                        if (rawData.workouts && Array.isArray(rawData.workouts)) {
                            for (const w of rawData.workouts) {
                                const pRef = doc(db, `alunos/${targetId}/prescricoes`, w.id);
                                await setDoc(pRef, {
                                    nome: w.title,
                                    totalSessoes: w.projectedSessions || 20,
                                    ativo: true,
                                    lastUpdate: Date.now()
                                }, { merge: true });
                            }
                        }
                      } catch (e: any) {
                        console.warn("Silent sync error:", e);
                      }
                  }
              }
              
              setSelectedStudent(rawData);
              
              // Restaurar Treino em Andamento se necessário
              if ((window as any)._tempWorkoutId && rawData.workouts) {
                 const w = rawData.workouts.find(w => w.id === (window as any)._tempWorkoutId);
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
      } catch (e) {
        console.error("Erro ao iniciar listener do aluno:", e);
      }
    }
    return () => { 
      if (unsub) unsub(); 
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
            if (!existing.photoUrl && def.photoUrl) merged[existingIndex].photoUrl = def.photoUrl;
            
            if (!existing.periodization && def.periodization) {
                merged[existingIndex].periodization = def.periodization;
            } else if (existing.periodization && def.periodization && merged[existingIndex].periodization) {
                merged[existingIndex].periodization!.targetVolume = def.periodization.targetVolume;
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
            merged[existingIndex].workouts = currentWorkoutsForCoach;
            
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
            if (existing.faseAjusteA === undefined && def.faseAjusteA !== undefined) merged[existingIndex].faseAjusteA = def.faseAjusteA;
            if (existing.faseAjusteB === undefined && def.faseAjusteB !== undefined) merged[existingIndex].faseAjusteB = def.faseAjusteB;
            if (existing.faseAjusteC === undefined && def.faseAjusteC !== undefined) merged[existingIndex].faseAjusteC = def.faseAjusteC;
            if (existing.totalGlobalA === undefined && def.totalGlobalA !== undefined) merged[existingIndex].totalGlobalA = def.totalGlobalA;
            if (existing.totalGlobalB === undefined && def.totalGlobalB !== undefined) merged[existingIndex].totalGlobalB = def.totalGlobalB;
            if (existing.totalGlobalC === undefined && def.totalGlobalC !== undefined) merged[existingIndex].totalGlobalC = def.totalGlobalC;
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


  // Feed de Performance Global para o Professor
  const globalFeedHistory = useMemo(() => {
    if (!isCoach) return studentForView?.workoutHistory || [];
    
    // Mescla todos os históricos de todos os alunos e injeta o nome do atleta
    const allHistory: WorkoutHistoryEntry[] = students.flatMap(s => 
      (s.workoutHistory || []).map(h => ({
        ...h,
        athleteName: s.nome // Injeta o nome do aluno para o professor saber quem treinou
      }))
    );
    
    return allHistory.sort((a, b) => b.timestamp - a.timestamp);
  }, [isCoach, students, studentForView]);

  const studentNotifications = useMemo(() => {
    if (!studentForView) return [];
    const notifications: AppNotification[] = [];
    const history = studentForView.workoutHistory || [];
    studentForView.workouts?.forEach(w => {
      const completed = history.filter(h => h.workoutId === w.id || h.name === w.title).length;
      const target = w.projectedSessions || 12;
      const remaining = target - completed;
      if (remaining <= 2 && remaining >= 0) {
        notifications.push({ 
          id: `renew-${w.id}`, 
          title: 'Renovação e Avaliação', 
          message: `Faltam ${remaining} sessões. Agende sua nova avaliação física para troca de série.`, 
          date: new Date().toLocaleDateString('pt-BR'), 
          read: false, 
          type: 'RENEWAL' 
        });
      }
    });

    // Assessment check
    const assessments = studentForView.physicalAssessments || [];
    if (assessments.length === 0) {
        notifications.push({
            id: 'assessment-first',
            title: 'Avaliação Física',
            message: 'Você ainda não possui uma avaliação física registrada. Agende agora!',
            date: new Date().toLocaleDateString('pt-BR'),
            read: false,
            type: 'SYSTEM'
        });
    } else {
        const lastAssessment = assessments[assessments.length - 1];
        const lastDate = new Date(lastAssessment.data);
        if (!isNaN(lastDate.getTime())) {
            const diffTime = Date.now() - lastDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 45) { // Needs renewal
                notifications.push({
                    id: 'assessment-renewal',
                    title: 'Avaliação Física',
                    message: `Sua última avaliação foi há ${diffDays} dias. Agende uma nova.`,
                    date: new Date().toLocaleDateString('pt-BR'),
                    read: false,
                    type: 'SYSTEM'
                });
            }
        }
    }

    return notifications;
  }, [studentForView]);

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
    
    // Robustly remove undefined values to prevent Firestore errors
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
    
    const finalData = removeUndefined(data);

    if (data.periodization) {
      finalData.trainingProgress = { completedCount: 0, targetCount: 20 }; // Default target 20, coach can adjust
      finalData.analytics = { sessionsCompleted: 0, streakDays: 0, exercises: {}, lastSessionDate: null };
    }

    try { 
      const docRef = doc(db, path);
      await setDoc(docRef, { ...finalData, lastUpdateTimestamp: Date.now() }, { merge: true });

      // If workouts are updated, sync to prescricoes subcollection
      if (finalData.workouts && Array.isArray(finalData.workouts)) {
          for (const w of finalData.workouts) {
              const pRef = doc(db, `alunos/${sid}/prescricoes`, w.id);
              await setDoc(pRef, removeUndefined({
                  nome: w.title,
                  totalSessoes: w.projectedSessions || 20,
                  ativo: true,
                  lastUpdate: Date.now()
              }), { merge: true });
          }
      }
      setSyncStatus('synced');
      return true;
    } catch (e: any) { 
      setSyncStatus('offline');
      try {
        handleFirestoreError(e, OperationType.WRITE, path);
      } catch (err) {
        console.error("Failed to sync save data:", err);
      }
      return false;
    }
  };

  const handleFinishWorkout = async (post: WorkoutHistoryEntry) => {
    if (!studentForView) return;
    
    const currentHistory = studentForView.workoutHistory || [];
    const updatedHistory = [post, ...currentHistory];
    
    // Calculate stats for logsTreino
    const duracaoMinutos = post.duration ? parseInt(post.duration.split(':')[0]) * 60 + parseInt(post.duration.split(':')[1]) : 0;
    const calorias = Math.ceil(duracaoMinutos / 60) * 7;
    const cargas = (post.exercises || []).map(ex => ({
      exercicio: ex.name,
      carga: ex.load || '0',
      unidade: ex.loadUnit || 'Kg'
    }));

    // Save to logsTreino subcollection
    const logsRef = collection(db, 'alunos', studentForView.id, 'logsTreino');
    const newLog = {
      treinoId: post.workoutId,
      prescricaoId: post.workoutId, // assume they are same for now
      nome: post.name,
      dataHora: post.timestamp,
      duracaoMinutos,
      calorias,
      cargas,
      concluido: true
    };

    try {
      await addDoc(logsRef, newLog);
    } catch (e) {
      console.warn("Falha ao salvar logTreino:", e);
    }
    
    const currentProgress = studentForView.trainingProgress || { completedCount: 0, targetCount: 60 };
    const updatedProgress = {
      ...currentProgress,
      completedCount: currentProgress.completedCount + 1
    };

    // Update Analytics sessions
    const currentAnalytics = studentForView.analytics || { sessionsCompleted: 0, streakDays: 0, exercises: {} };
    const updatedAnalytics = {
      ...currentAnalytics,
      sessionsCompleted: (currentAnalytics.sessionsCompleted || 0) + 1,
      lastSessionDate: new Date().toLocaleDateString('pt-BR')
    };

    const title = post.name.toLowerCase();
    
    // Sync-up and update localStorage 'contagemTreinos'
    const savedContagem = localStorage.getItem('contagemTreinos');
    let contagem = { A: 5, B: 4, C: 3 };
    if (savedContagem) {
      try {
        contagem = JSON.parse(savedContagem);
      } catch (e) {
        console.error("Erro ao parsear contagemTreinos no handleFinishWorkout", e);
      }
    }

    const updates: any = { 
      workoutHistory: updatedHistory,
      trainingProgress: updatedProgress,
      analytics: updatedAnalytics
    };

    if (title.includes('treino a')) {
      updates.faseAjusteA = (studentForView.faseAjusteA || 0) + 1;
      updates.totalGlobalA = (studentForView.totalGlobalA || 0) + 1;
      contagem.A = (contagem.A || 0) + 1;
    } else if (title.includes('treino b')) {
      updates.faseAjusteB = (studentForView.faseAjusteB || 0) + 1;
      updates.totalGlobalB = (studentForView.totalGlobalB || 0) + 1;
      contagem.B = (contagem.B || 0) + 1;
    } else if (title.includes('treino c')) {
      updates.faseAjusteC = (studentForView.faseAjusteC || 0) + 1;
      updates.totalGlobalC = (studentForView.totalGlobalC || 0) + 1;
      contagem.C = (contagem.C || 0) + 1;
    }

    // Save updated contagem back to localStorage
    localStorage.setItem('contagemTreinos', JSON.stringify(contagem));

    console.log("Finishing workout for:", studentForView.id, "Current Progress:", studentForView.trainingProgress, "Updates:", updates);
    await handleSaveData(studentForView.id, updates);

    // Manually update local state immediately for faster UI feedback
    setSelectedStudent({
        ...studentForView,
        ...updates
    });
  };

  const handleAddPost = async (post: WorkoutHistoryEntry) => {
    if (!studentForView) return;
    const currentHistory = studentForView.workoutHistory || [];
    const updatedHistory = [post, ...currentHistory];
    await handleSaveData(studentForView.id, { workoutHistory: updatedHistory });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStudent) {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          await handleSaveData(selectedStudent.id, { photoUrl: compressedBase64 });
          setUploadingPhoto(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
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
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização', icon: Brain, color: 'indigo' },
    { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
    { id: 'CORRE_RJ', label: 'Corre RJ 2026', icon: MapPin, color: 'yellow' },
    { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
    {id: 'ANALYTICS', label: 'Evolução e Dados', icon: BarChart3, color: 'blue' },
    { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' }
  ];

  const visibleDashboardItems = allDashboardItems.filter(item => {
    // Se o aluno não tiver a lista de disabledFeatures, mostra tudo.
    // Se tiver, esconde se o ID estiver na lista.
    return !studentForView?.disabledFeatures?.includes(item.id);
  });

  const AssessmentAlert = ({ student }: { student: Student }) => {
    // Definimos o marco da última avaliação completa (Bio + Dobras + Fitas + Relogio)
    // Se o aluno tiver avaliações registradas, usamos a data da mais recente.
    // Senão, se for o André, usamos '2026-04-20' como fallback, senão podemos mostrar um banner convidativo para registrar sua primeira avaliação física!
    let lastFullDate = '';
    
    if (student.physicalAssessments && student.physicalAssessments.length > 0) {
      // Obtém a data da avaliação física mais recente
      const sorted = [...student.physicalAssessments].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      lastFullDate = sorted[0].data.split('T')[0];
    } else if (student.id === 'fixed-andre') {
      lastFullDate = '2026-04-20';
    } else {
      // Banner convidativo para alunos novos sem avaliações
      return (
        <div 
          onClick={() => setView('STUDENT_ASSESSMENT')}
          className="w-full max-w-xl p-4 rounded-[2.5rem] border-2 border-dashed border-red-650 bg-red-950/10 shadow-xl relative overflow-hidden transition-all flex flex-row items-center gap-5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] animate-pulse"
        >
          <div className="w-16 h-16 rounded-[1.8rem] bg-red-600 text-white shadow-lg shrink-0 flex items-center justify-center">
             <Sparkles size={24} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] italic mb-1 text-red-500">REQUISITO ABFIT</p>
            <h3 className="text-xs font-black italic uppercase tracking-widest text-white leading-tight">Cadastrar Primeira Avaliação Física</h3>
            <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wide">Toque aqui para enviar seu print de Bioimpedância ou digitar suas medidas corporais.</p>
          </div>
        </div>
      );
    }

    const nextDate = new Date(lastFullDate);
    nextDate.setDate(nextDate.getDate() + 30);
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Mostra o alerta se faltar menos de 30 dias ou se estiver atrasado
    const isOverdue = diffDays <= 0;
    const isUrgent = diffDays <= 7;

    return (
      <div 
        onClick={() => setView('STUDENT_ASSESSMENT')}
        className={`w-full max-w-xl h-[92px] p-4 rounded-[2.5rem] border-2 shadow-xl relative overflow-hidden transition-all flex flex-row items-center gap-5 backdrop-blur-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]
        ${isOverdue 
          ? 'bg-red-950/40 border-red-600 shadow-red-600/20 animate-pulse' 
          : isUrgent
            ? 'bg-amber-950/30 border-amber-500 shadow-amber-600/10'
            : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          {isOverdue ? <AlertTriangle size={40} className="text-red-500" /> : <Calendar size={40} className="text-zinc-600" />}
        </div>

        <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shrink-0 shadow-lg relative z-10
          ${isOverdue ? 'bg-red-600 text-white shadow-red-600/40' : 'bg-zinc-800 text-zinc-400'}
        `}>
          <Activity size={32} />
        </div>
        
        <div className="flex-1 text-left relative z-10">
          <p className={`text-[8px] font-black uppercase tracking-[0.2em] italic mb-1
            ${isOverdue ? 'text-red-500' : 'text-zinc-500'}
          `}>
            {isOverdue ? "MISSÃO OBRIGATÓRIA ATRASADA" : "AVALIAÇÃO FÍSICA COMPLETA"}
          </p>
          <h3 className="text-xs font-black italic uppercase tracking-widest text-white leading-tight">
            Próxima Auditoria Corporal
          </h3>
          <div className="mt-1 flex items-center gap-2">
             <span className={`text-[9px] font-black uppercase italic
               ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-zinc-400'}
             `}>
               {isOverdue 
                 ? `ATRASADO ${Math.abs(diffDays)} DIAS` 
                 : `DAQUI A ${diffDays} DIAS`
               }
             </span>
             <span className="text-[8px] font-black text-white/30 uppercase italic">Ref: {nextDate.toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <BackgroundWrapper>
        <GlobalSyncIndicator status={syncStatus} />
        
        {showSidebar && (
          <SideNav 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            activeView={view} 
            onNavigate={setView}
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
              <WeatherWidget />
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
               <div className="absolute -top-3 -right-4"> <NotificationBadge notifications={studentNotifications} /> </div>
            </div>
            <p className="text-xl font-black text-white italic uppercase tracking-[0.3em] mt-2">{studentForView.nome}</p>
            
            <div className="w-full mt-10 space-y-4 pb-20 flex flex-col max-w-xl mx-auto px-4 sm:px-0">
              <AssessmentAlert student={studentForView} />
              
              {visibleDashboardItems.map(item => {
                const isPeriodization = item.id === 'STUDENT_PERIODIZATION';
                const isWorkouts = item.id === 'WORKOUTS';
                
                let progress = 0;
                let progressText = "";
                if (isPeriodization && studentForView?.periodization?.startDate) {
                  progress = Math.min(100, Math.round(((Date.now() - new Date(studentForView.periodization.startDate).getTime()) / (12 * 7 * 24 * 60 * 60 * 1000)) * 100));
                } else if (isWorkouts) {
                  const tProgress = studentForView.trainingProgress || { completedCount: 0, targetCount: 60 };
                  // Sum total sessions from all workouts
                  const activeWorkoutsTotal = (studentForView.workouts || []).reduce((acc: number, w: any) => acc + (w.projectedSessions || 20), 0);
                  const targetCount = activeWorkoutsTotal || tProgress.targetCount || 60;
                  const completedCount = Math.max(totalExecuted, tProgress.completedCount || 0);

                  progress = Math.min(100, Math.round((completedCount / targetCount) * 100));
                  progressText = `Global: ${completedCount} de ${targetCount}`;
                }

                return (
                  <div 
                    key={item.id} 
                    className={`w-full h-[92px] p-4 bg-zinc-950/80 border-2 border-${item.color}-600/30 group cursor-pointer active:scale-95 transition-all shadow-xl shadow-${item.color}-600/10 flex flex-row items-center gap-5 rounded-[2.5rem] backdrop-blur-md hover:border-${item.color}-600/60`} 
                    onClick={() => setView(item.id)}
                  >
                    <div className={`w-16 h-16 bg-${item.color}-600 rounded-[1.8rem] flex items-center justify-center shadow-lg shadow-${item.color}-600/40 shrink-0`}> 
                      <item.icon className="text-white" size={32} /> 
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-[0.2em] leading-tight">{item.label}</h3>
                        {isWorkouts && progressText && (
                          <span className="text-[9px] font-black uppercase text-red-600 italic tracking-widest">{progressText}</span>
                        )}
                      </div>
                      {(isPeriodization || isWorkouts) && (
                        <div className="mt-2 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-${item.color}-600 shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000`} style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      {!isPeriodization && !isWorkouts && (
                        <div className="mt-2 text-[8px] font-black uppercase text-zinc-600 tracking-widest italic">Acesse sua jornada</div>
                      )}
                    </div>
                    <ChevronRight size={16} className={`text-${item.color}-600 opacity-30 group-hover:opacity-100 transition-opacity mr-2`} />
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
        {view === 'SETTINGS' && <SettingsView onBack={isCoach ? () => setView('PROFESSOR_DASH') : toggleSidebar} />}
        {view === 'STUDENT_PERIODIZATION' && studentForView && <StudentPeriodizationView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'STUDENT_ASSESSMENT' && studentForView && <StudentAssessmentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'RUNTRACK_STUDENT' && studentForView && <RunTrackStudentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onSave={handleSaveData} onToggleMenu={toggleSidebar} />}
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
      </main>
    </BackgroundWrapper>
  </ErrorBoundary>
  );
}
