
export interface ExerciseDatabase {
  [key: string]: string[];
}

export interface Exercise {
  id?: string;
  name: string;
  description?: string;
  benefits?: string;
  thumb?: string | null;
  sets?: string;
  reps?: string;
  rest?: string;
  load?: string;
  loadUnit?: 'Kg' | 'Placas';
  method?: string; 
  groupId?: string; 
  executionType?: 'Simples' | 'Conjugado' | 'Drop Set' | 'Pirâmide' | 'Rest-Pause' | 'SST';
}

export interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  startDate?: string;
  endDate?: string;
  frequencyWeekly?: number;
  projectedSessions?: number;
  status?: 'draft' | 'published';
  defaultSets?: string;
  defaultReps?: string;
  defaultRest?: string;
}

export interface RunningStats {
  distance?: number;
  avgPace?: string;
  maxPace?: string;
  avgSpeed?: number;
  maxSpeed?: number;
  avgHR?: number;
  maxHR?: number;
  cadence?: number;
  steps?: number;
  vo2max?: number;
  vo2maxClass?: 'green' | 'orange' | 'red';
  elevation?: number;
  calories?: number;
  strideLength?: number;
  verticalOscillation?: number;
  groundContactTime?: number;
  asymmetry?: string;
  advancedMetricsColors?: {
    asymmetry?: 'blue' | 'green' | 'orange' | 'red';
    groundTime?: 'blue' | 'green' | 'orange' | 'red';
    airTime?: 'blue' | 'green' | 'orange' | 'red';
    regularity?: 'blue' | 'green' | 'orange' | 'red';
    vertical?: 'blue' | 'green' | 'orange' | 'red';
    stiffness?: 'blue' | 'green' | 'orange' | 'red';
  };
  sweatLoss?: number;
  hydrationRecomendation?: number;
  weather?: { temp: number; condition: string; humidity: number; wind: number };
  hrZones?: {
    max?: string;
    anaerobic?: string;
    aerobic?: string;
    weightControl?: string;
    lowIntensity?: string;
  };
  splits?: { km: string; time: string; pace?: string; speed?: string }[];
  path?: [number, number][];
}

export interface WorkoutHistoryEntry {
  id: string;
  workoutId?: string;
  name: string;
  athleteName?: string; // Novo: Identifica o atleta no Feed Global
  duration: string;
  date: string;
  timestamp: number;
  photoUrl?: string;
  text?: string;
  runningStats?: RunningStats;
  type: 'STRENGTH' | 'RUNNING' | 'POST';
  exercises?: Exercise[]; // Adicionado campo de exercícios com cargas
}

export interface WorkoutCompletion {
  id: string;
  treinoId: string;
  data: string;
  timestamp: number;
}

export interface PeriodizationPlan {
  id: string;
  titulo: string;
  startDate: string;
  modelo_teorico?: string;
  objetivo_longo_prazo?: string;
  microciclos: any[];
  targetVolume?: Record<string, number>;
  notas_mestre?: string;
  type: 'STRENGTH' | 'RUNNING';
  // Novos campos do Relatório Científico
  phaseTitle?: string;
  generalStrategy?: string;
  clinicalSafety?: string[];
  bioInsight?: {
    context: string;
    tips: string[];
  };
}

export interface PhysicalAssessment {
  id: string;
  data: string;
  peso: string | number;
  altura: string | number;
  bio_percentual_gordura?: string | number;
  veredictoPeriodizacao?: string;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'RENEWAL' | 'SYSTEM' | 'WORKOUT';
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionLog {
  id: string;
  name: string;
  date: string;
  macros: MacroNutrients;
}

export interface MealPlan {
  id: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface NutritionProfile {
  goal: string;
  restrictions: string;
  dailyTargets: MacroNutrients;
  logs: NutritionLog[];
  mealPlans: MealPlan[];
}

export interface AnalyticsData {
  sessionsCompleted: number;
  streakDays: number;
  exercises: Record<string, { completed: number; skipped: number }>;
  lastSessionDate?: string;
}

export interface TrainingProgress {
  completedCount: number;
  targetCount: number;
}

export interface Student {
  id: string;
  nome: string;
  email: string;
  photoUrl?: string;
  sexo?: 'Masculino' | 'Feminino';
  workouts?: Workout[];
  workoutHistory?: WorkoutHistoryEntry[];
  physicalAssessments?: PhysicalAssessment[];
  periodization?: PeriodizationPlan;
  analytics?: AnalyticsData;
  trainingProgress?: TrainingProgress;
  nutrition?: NutritionProfile;
  notifications?: AppNotification[];
  disabledFeatures?: string[];
  age?: string | number;
  weight?: string | number;
  height?: string | number;
  goal?: string;
  anamneseComplete?: boolean;
  protocolStartDate?: string;
  
  // ABFIT AI Specific Fields
  neurodivergence?: string;
  medicalHistory?: string;
  bariatric?: boolean;
  medications?: string;
  exercisePreference?: string;
  otherActivities?: string;
  trainingSchedule?: string;
  sessionDuration?: string;
  goalTimeline?: string;
  weeklyFrequency?: string;
  plannedSessions?: string;
  faseAjusteA?: number;
  faseAjusteB?: number;
  faseAjusteC?: number;
  totalGlobalA?: number;
  totalGlobalB?: number;
  totalGlobalC?: number;
  runAlertsEnabled?: boolean;
  _fixedHistoryApril2?: boolean;
}
