
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, CalendarDays, Flame, Info, Plus, 
  Trash2, X, Brain, ChevronDown, Play, Zap, BarChart3,
  ArrowLeft, Menu, Gauge, TrendingUp, CheckCircle2, ChevronRight, ChevronLeft,
  Timer, Calculator, Edit3, Circle, Camera, Upload, Loader2, Sparkles, Heart
} from 'lucide-react';
import { 
  db, handleFirestoreError, OperationType,
  collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, getDocs 
} from '../services/firebase';
import { callAI } from '../services/gemini';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

const MODEL_TEXT = 'gemini-3-flash-preview';

import { Student, WorkoutHistoryEntry } from '../types';
import { HeaderTitle, Card, AppFooter, BackgroundCarousel, RUNNING_IMAGES } from './Layout';

// --- CONFIGURATION ---
const RUN_COLLECTION = 'runtrack-elite-v4';

// --- TYPES FROM ABFIT RUN ---
interface WorkoutModel {
  id: string;
  studentId: string;
  type: string; 
  dayOfWeek: string;
  warmupTime?: string;
  cooldownTime?: string;
  distance?: string; 
  totalTime?: string;
  pace?: string;
  status?: 'draft' | 'published';
  projectedSessions?: number;
  sets?: string;
  reps?: string;
  stimulusTime?: string;
  recoveryTime?: string;
  speed?: string; 
  description?: string;
  customDisplay?: string;
  createdAt?: string;
  segments?: WorkoutSegment[];
}

// --- HELPER FUNCTIONS FOR TIME CALCULATION ---

const parseToMinutes = (val: string | undefined, speedStr: string | undefined): number => {
    if (!val) return 0;
    // Safety check: ensure val is a string
    const v = String(val).toLowerCase().replace(',', '.').trim();
    const speed = parseFloat((speedStr || '10').replace(',', '.')) || 10;

    // 1. Explicit Time (contains ' or min)
    if (v.includes("'") || v.includes("min")) {
        return parseFloat(v) || 0;
    }

    // 2. Explicit Distance (km or m)
    if (v.includes("km")) {
        const distKm = parseFloat(v);
        // Add 15% buffer to distance-based segments to avoid ending too early
        return ((distKm / speed) * 60) * 1.15;
    }
    if (v.includes("m") && !v.includes("min")) {
        const distM = parseFloat(v);
        return ((distM / 1000 / speed) * 60) * 1.15;
    }

    // 3. Numeric Heuristic
    const num = parseFloat(v);
    if (isNaN(num)) return 0;

    // Assume Minutes if < 60, otherwise treat as meters/seconds logic (simplified)
    if (num >= 60) {
        return (num / 1000 / speed) * 60;
    }

    return num;
};

const estimateWorkoutDuration = (w: WorkoutModel): number => {
    if (!w) return 0;
    let total = 0;
    
    // Warmup & Cooldown
    total += parseToMinutes(w.warmupTime, w.speed);
    total += parseToMinutes(w.cooldownTime, w.speed);

    // Main Set
    const sets = parseFloat(w.sets || '1') || 1;
    const reps = parseFloat(w.reps || '1') || 1;
    
    const stimMin = parseToMinutes(w.stimulusTime, w.speed);
    const recMin = parseToMinutes(w.recoveryTime, w.speed);

    total += sets * reps * (stimMin + recMin);

    return Math.ceil(total || 0);
};

const formatDuration = (totalMin: number) => {
    if (isNaN(totalMin) || totalMin <= 0) return '0min';
    const h = Math.floor(totalMin / 60);
    const m = Math.floor(totalMin % 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
}

// --- UI COMPONENTS ---

const Button = ({ children, onClick, variant = "primary", className = "", loading = false }: any) => {
  const variants: any = {
    primary: "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700",
    ghost: "bg-transparent text-zinc-400 hover:text-white"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className={`px-6 py-4 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", className = "", placeholder = "" }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>}
    <input 
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-red-600 outline-none font-bold text-white w-full transition-all ${className}`} 
    />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>}
    <textarea 
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-red-600 outline-none font-bold text-white w-full transition-all resize-none" 
    />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div className="flex flex-col gap-2 w-full relative">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>}
    <div className="relative">
      <select 
        value={value} onChange={(e) => onChange(e.target.value)} 
        className="w-full px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-red-600 outline-none font-bold appearance-none cursor-pointer text-white pr-10"
      >
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" size={18} />
    </div>
  </div>
);

const WorkoutLegend = () => (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mt-8">
        <h5 className="font-black italic uppercase text-zinc-500 text-[10px] tracking-widest mb-4 flex items-center gap-2">
            <Info size={14} className="text-red-600"/> Legenda
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {short: 'AQ', long: 'Aquecimento'}, {short: 'CO', long: 'Corrida'},
              {short: 'CA', long: 'Caminhada'}, {short: 'REC', long: 'Recuperação'},
              {short: ':', long: 'Alternância'}
            ].map(item => (
              <div key={item.short} className="flex flex-col border-l-2 border-zinc-800 pl-3">
                  <span className="font-black text-red-600 text-sm">{item.short}</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.long}</span>
              </div>
            ))}
        </div>
    </div>
);

// --- LOGIC FOR PROGRESSION ---
const calculateAdjustedWorkout = (workout: WorkoutModel) => {
    if (!workout) return { adjusted: {} as WorkoutModel, badge: null };
    if (!workout.createdAt) return { adjusted: workout, badge: null };

    const created = new Date(workout.createdAt);
    const now = new Date();
    // Safety check for invalid dates
    if (isNaN(created.getTime())) return { adjusted: workout, badge: null };

    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let factor = 1.0;
    let badge = null;

    if (diffDays > 30) {
        factor = 1.10; // +10% after 30 days
        badge = "NÍVEL 3 (+10%)";
    } else if (diffDays > 15) {
        factor = 1.05; // +5% after 15 days
        badge = "NÍVEL 2 (+5%)";
    } else {
        return { adjusted: workout, badge: null };
    }

    const adjusted = { ...workout };

    // Apply progression to Speed
    if (adjusted.speed) {
        const speedNum = parseFloat(adjusted.speed.replace(',', '.'));
        if (!isNaN(speedNum)) {
            adjusted.speed = (speedNum * factor).toFixed(1).replace('.', ',');
        }
    }

    // Apply progression to Stimulus Time
    if (adjusted.stimulusTime) {
        const stimNum = parseFloat(adjusted.stimulusTime);
        if (!isNaN(stimNum)) {
             if (stimNum < 10) {
                 adjusted.stimulusTime = (stimNum * factor).toFixed(1).replace('.0', '');
             } else {
                 adjusted.stimulusTime = Math.ceil(stimNum * factor).toString();
             }
        }
    }

    return { adjusted, badge };
};

const WorkoutCard: React.FC<{ workout: WorkoutModel, onDelete?: () => void, onEdit?: () => void, isCompleted?: boolean, compact?: boolean, isToday?: boolean, stats?: any, hideActions?: boolean }> = ({ workout, onDelete, onEdit, isCompleted, compact, isToday, stats, hideActions }) => {
    const { adjusted, badge } = useMemo(() => calculateAdjustedWorkout(workout), [workout]);
    const totalDuration = useMemo(() => estimateWorkoutDuration(adjusted), [adjusted]);

    if (!adjusted || !adjusted.type) return null;

    const formatTime = (val?: string) => {
        if (!val || val === '0') return null;
        const isNumber = /^\d+([.,]\d+)?$/.test(val);
        return isNumber ? `${val}'` : val;
    };

    const warmPart = formatTime(adjusted.warmupTime) ? `${formatTime(adjusted.warmupTime)} AQ` : null;
    
    const sets = Number(adjusted.sets) || 1;
    const reps = Number(adjusted.reps) || 1;
    const totalBlocks = sets * reps;
    
    const stimTime = formatTime(adjusted.stimulusTime);
    const showBlocks = totalBlocks > 1 && !!stimTime;
    
    const stimPart = stimTime ? `${stimTime} CO` : '';
    const speedPart = adjusted.speed ? `${adjusted.speed}km/h` : '';
    
    const recTime = formatTime(adjusted.recoveryTime);
    const recPart = recTime && recTime !== "0'" ? `${recTime} CA` : null;
    
    const coolPart = formatTime(adjusted.cooldownTime) ? `${formatTime(adjusted.cooldownTime)} REC` : null;

    if (compact) {
        return (
            <div className={`p-4 rounded-xl border transition-all ${isToday ? 'border-red-600 ring-1 ring-red-600/20' : ''} ${isCompleted ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {adjusted.type}
                        </span>
                        {isToday && <span className="text-[6px] font-black bg-red-600 text-white px-1 rounded">HOJE</span>}
                    </div>
                    {isCompleted && <CheckCircle2 size={12} className="text-emerald-500" />}
                </div>
                <p className="text-xs font-black italic uppercase text-white leading-tight">
                    {adjusted.customDisplay ? (
                        <span dangerouslySetInnerHTML={{ __html: adjusted.customDisplay }} className="[&>span]:mx-0 [&>span]:text-[10px]" />
                    ) : (
                        <>{showBlocks && `${totalBlocks}x `}{stimPart} {speedPart && `@ ${speedPart}`}</>
                    )}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase">
                    <Timer size={8} /> Est. {formatDuration(totalDuration)}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-zinc-900 border p-5 rounded-3xl relative group transition-all overflow-hidden ${isToday ? 'border-red-600 ring-2 ring-red-600/20' : badge ? 'border-red-600/40 shadow-[0_0_20px_rgba(220,38,38,0.15)]' : 'border-zinc-800 hover:border-red-600/30'} ${isCompleted ? 'opacity-80' : ''}`}>
            {isToday && (
                <div className="absolute -top-3 left-6 bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-xl z-10 animate-bounce">
                    TREINO DE HOJE
                </div>
            )}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                {onEdit && (
                    <button onClick={onEdit} className="text-zinc-500 hover:text-white p-2 rounded-xl transition-all bg-zinc-800 hover:bg-zinc-700">
                        <Edit3 size={16} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={onDelete} className="text-zinc-500 hover:text-red-500 p-2 rounded-xl transition-all hover:bg-zinc-800">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            
            <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1 flex items-center gap-1">
                        <CalendarDays size={12} /> {adjusted.dayOfWeek}
                    </span>
                    {badge ? (
                        <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                            <TrendingUp size={10} /> {badge}
                        </span>
                    ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg mr-16">
                            <Timer size={10} /> {formatDuration(totalDuration)}
                        </span>
                    )}
                </div>
                <h4 className="text-2xl font-black italic uppercase text-white leading-none tracking-tight">
                    {adjusted.type}
                </h4>
            </div>

            {/* SINGLE BLOCK LAYOUT - UNIFIED TEXT */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-4 flex items-center justify-center text-center">
                <p className="text-sm font-black italic uppercase text-white leading-snug tracking-wide">
                    {adjusted.customDisplay ? (
                        <span dangerouslySetInnerHTML={{ __html: adjusted.customDisplay }} />
                    ) : (
                        <>
                            {/* AQUECIMENTO */}
                            {warmPart && (
                                <>
                                    <span className="text-emerald-500">{warmPart}</span>
                                    <span className="text-red-600 mx-3">+</span>
                                </>
                            )}
                            
                            {/* BLOCOS E ESTIMULO */}
                            {showBlocks && (
                                <span>{totalBlocks} BLOCOS DE </span>
                            )}
                            
                            <span className="text-red-600">{stimPart}</span>
                            {speedPart && <span className="text-zinc-400 ml-3 text-[0.9em]">{speedPart}</span>}
                            
                            {/* RECUPERAÇÃO ENTRE TIROS */}
                            {recPart && (
                                <>
                                    <span className="text-red-600 mx-3">:</span>
                                    <span className="text-emerald-500">{recPart}</span>
                                </>
                            )}
                            
                            {/* DESAQUECIMENTO */}
                            {coolPart && (
                                <>
                                    <span className="text-red-600 mx-3">+</span>
                                    <span className="text-emerald-500">{coolPart}</span>
                                </>
                            )}
                        </>
                    )}
                </p>
            </div>

            {workout.description && (
                <div className="p-3 rounded-lg border-l-2 border-red-600 bg-red-600/5 mb-4">
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">"{workout.description}"</p>
                </div>
            )}

            {stats && !stats.empty && (
                <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-white/5 space-y-4 overflow-hidden shadow-xl mt-2">
                    <div className="flex items-center justify-between">
                        <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1 italic">
                            <Activity size={10} className="text-red-600 animate-pulse" /> Resumo
                        </h5>
                        <div className="bg-zinc-800 px-2 py-0.5 rounded-full text-[9px] font-black text-zinc-400 uppercase tracking-widest border border-white/5">
                            {stats.duration}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Distância</div>
                            <div className="text-3xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.distance} <span className="text-[10px]">km</span></div>
                        </div>
                        <div>
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Pace Médio</div>
                            <div className="text-3xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.avgPace} <span className="text-[10px]">/km</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 pt-3 border-t border-white/5 mt-3">
                        {stats.calories && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Calorias</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.calories} <span className="text-[9px]">kcal</span></div>
                            </div>
                        )}
                        {stats.cadence && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Cadência</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.cadence} <span className="text-[9px]">spm</span></div>
                            </div>
                        )}
                        {stats.elevation && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Elevação</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.elevation} <span className="text-[9px]">m</span></div>
                            </div>
                        )}
                        {stats.avgHR && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">BPM Médio</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.avgHR} <span className="text-[9px]">bpm</span></div>
                            </div>
                        )}
                        {stats.duration && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Tempo</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.duration} <span className="text-[9px]">min</span></div>
                            </div>
                        )}
                        {stats.maxHR && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">BPM Máx</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.maxHR} <span className="text-[9px]">bpm</span></div>
                            </div>
                        )}
                        {stats.avgSpeed && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Vel. Média</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.avgSpeed} <span className="text-[9px]">km/h</span></div>
                            </div>
                        )}
                        {stats.maxSpeed && (
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Vel. Máxima</div>
                                <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.maxSpeed} <span className="text-[9px]">km/h</span></div>
                            </div>
                        )}
                    </div>

                    {stats.maxPace && (
                        <div className="pt-3 border-t border-white/5">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5 italic">Melhor Pace</div>
                            <div className="text-xl font-black text-[#e2ff00] italic tracking-tighter leading-none">{stats.maxPace} <span className="text-[9px]">/km</span></div>
                        </div>
                    )}

                    {stats.hrZones && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Zonas de Frequência</div>
                            
                            <div className="grid grid-cols-1 gap-1">
                                {stats.hrZones.max && (
                                    <div className="flex justify-between items-center bg-red-950/20 px-2 py-1 rounded-lg border border-red-500/10">
                                        <span className="text-[9px] font-black text-red-500 uppercase truncate">Z5 - Máx</span>
                                        <span className="text-[10px] font-black text-white shrink-0">{stats.hrZones.max}</span>
                                    </div>
                                )}
                                {stats.hrZones.anaerobic && (
                                    <div className="flex justify-between items-center bg-orange-950/20 px-2 py-1 rounded-lg border border-orange-500/10">
                                        <span className="text-[9px] font-black text-orange-500 uppercase truncate">Z4 - Anaeróbico</span>
                                        <span className="text-[10px] font-black text-white shrink-0">{stats.hrZones.anaerobic}</span>
                                    </div>
                                )}
                                {stats.hrZones.aerobic && (
                                    <div className="flex justify-between items-center bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-500/10">
                                        <span className="text-[9px] font-black text-emerald-500 uppercase truncate">Z3 - Aeróbico</span>
                                        <span className="text-[10px] font-black text-white shrink-0">{stats.hrZones.aerobic}</span>
                                    </div>
                                )}
                                {stats.hrZones.weightControl && (
                                    <div className="flex justify-between items-center bg-blue-950/20 px-2 py-1 rounded-lg border border-blue-500/10">
                                        <span className="text-[9px] font-black text-blue-500 uppercase truncate">Z2 - C. Peso</span>
                                        <span className="text-[10px] font-black text-white shrink-0">{stats.hrZones.weightControl}</span>
                                    </div>
                                )}
                                {stats.hrZones.lowIntensity && (
                                    <div className="flex justify-between items-center bg-zinc-800/50 px-2 py-1 rounded-lg border border-zinc-700/50">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase truncate">Z1 - Baixa Int.</span>
                                        <span className="text-[10px] font-black text-white shrink-0">{stats.hrZones.lowIntensity}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {stats.splits && stats.splits.length > 0 && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Voltas (Splits)</div>
                            <div className="space-y-1">
                                {stats.splits.map((s: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5">
                                        <span className="text-[9px] font-black text-zinc-500 w-4">{idx + 1}</span>
                                        <span className="text-[10px] font-black text-white w-10">{s.km} <span className="text-[8px] text-zinc-500">km</span></span>
                                        <span className="text-[10px] font-black text-[#e2ff00] w-10 text-center">{s.time}</span>
                                        {s.pace && <span className="text-[9px] font-black text-zinc-400 w-14 text-right truncate">{s.pace}/km</span>}
                                        {s.speed && <span className="text-[9px] font-black text-zinc-400 w-14 text-right truncate">{s.speed}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {stats.metricsColors && (!stats.advancedMetricsColors) && stats.metricsColors && !stats.advancedMetricsColors /* fallback */}
                    {stats.advancedMetricsColors && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Métricas Avançadas</div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Assimetria', key: 'asymmetry' },
                                    { label: 'T. no Solo', key: 'groundTime' },
                                    { label: 'Tempo Ar', key: 'airTime' },
                                    { label: 'Regularidade', key: 'regularity' },
                                    { label: 'Vertical', key: 'vertical' },
                                    { label: 'Rigidez', key: 'stiffness' }
                                ].map(metric => {
                                    const c = stats.advancedMetricsColors[metric.key as keyof typeof stats.advancedMetricsColors];
                                    if (!c) return null;
                                    let bg = 'bg-zinc-800';
                                    let text = 'text-white';
                                    if (c === 'red') { bg = 'bg-red-500'; text = 'text-white'; }
                                    if (c === 'orange') { bg = 'bg-orange-500'; text = 'text-white'; }
                                    if (c === 'yellow') { bg = 'bg-yellow-500'; text = 'text-black'; }
                                    if (c === 'green') { bg = 'bg-emerald-500'; text = 'text-white'; }
                                    if (c === 'blue') { bg = 'bg-blue-500'; text = 'text-white'; }
                                    return (
                                        <div key={metric.key} className="flex bg-zinc-900/50 rounded-md overflow-hidden border border-white/5 items-center justify-between">
                                            <div className="text-[8px] text-zinc-400 uppercase font-black tracking-widest px-1.5 py-0.5 truncate">{metric.label}</div>
                                            <div className={`px-1.5 py-0.5 flex justify-center shrink-0 w-12 ${bg}`}>
                                                <span className={`text-[7px] font-black uppercase tracking-widest truncate ${text}`}>
                                                    {c === 'red' ? 'Ruim' : c === 'orange' ? 'Laranja' : c === 'yellow' ? 'Médio' : c === 'green' ? 'Ótimo' : 'Tendência'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {(stats.vo2max || stats.sweatLoss || stats.weather) && (
                         <div className="pt-3 border-t border-white/5 space-y-2">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Performance</div>
                            
                            {stats.vo2max && (
                                <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase">VO2 Máx</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-black text-white italic">{stats.vo2max}</span>
                                        {stats.vo2maxClass && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${stats.vo2maxClass === 'green' ? 'bg-emerald-500' : stats.vo2maxClass === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {stats.sweatLoss && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-zinc-900/50 p-1.5 rounded-lg border border-white/5 text-center flex flex-col justify-center">
                                        <div className="text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Perda Suor</div>
                                        <div className="text-[10px] font-black text-blue-400">{stats.sweatLoss} <span className="text-[7px]">ml</span></div>
                                    </div>
                                    {stats.hydrationRecomendation && (
                                        <div className="bg-zinc-900/50 p-1.5 rounded-lg border border-white/5 text-center flex flex-col justify-center">
                                            <div className="text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Repor (150%)</div>
                                            <div className="text-[10px] font-black text-blue-500">{stats.hydrationRecomendation} <span className="text-[7px]">ml</span></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {stats.weather && (
                                <div className="bg-zinc-900/50 p-1.5 rounded-lg border border-white/5 flex justify-between items-center gap-2">
                                    <div className="text-center flex-1">
                                        <div className="text-[7px] text-zinc-500 uppercase font-black tracking-widest truncate">Clima</div>
                                        <div className="text-[9px] font-black text-white truncate">{stats.weather.temp}°C</div>
                                    </div>
                                    <div className="w-px h-4 bg-white/5" />
                                    <div className="text-center flex-1">
                                        <div className="text-[7px] text-zinc-500 uppercase font-black tracking-widest truncate">Umidade</div>
                                        <div className="text-[9px] font-black text-white truncate">{stats.weather.humidity}%</div>
                                    </div>
                                    <div className="w-px h-4 bg-white/5" />
                                    <div className="text-center flex-1">
                                        <div className="text-[7px] text-zinc-500 uppercase font-black tracking-widest truncate">Vento</div>
                                        <div className="text-[9px] font-black text-white truncate">{stats.weather.wind}km/h</div>
                                    </div>
                                </div>
                            )}
                         </div>
                    )}

                    {stats.path && stats.path.length > 0 && (
                        <div className="h-64 w-full rounded-[2rem] overflow-hidden border border-white/5 relative mt-4 shadow-inner">
                            <MapContainer 
                                center={stats.path[0].lat !== undefined ? [stats.path[0].lat, stats.path[0].lng] : stats.path[0]} 
                                zoom={15} 
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                                dragging={false}
                                touchZoom={false}
                                scrollWheelZoom={false}
                                doubleClickZoom={false}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                <Polyline positions={stats.path.map((p: any) => [p.lat !== undefined ? p.lat : p[0], p.lng !== undefined ? p.lng : p[1]])} color="#e2ff00" weight={4} />
                            </MapContainer>
                        </div>
                    )}
                    
                    {/* RESUMO DIÁRIO (IF DATA EXISTS) */}
                    {(stats.steps || stats.sleep) && (
                        <div className="pt-8 mt-4 border-t border-white/5">
                             <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                        <Activity size={10} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">RESUMO DIÁRIO (HEALTH)</span>
                                </div>
                                <Heart size={14} className="text-blue-600 fill-blue-600" />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                {stats.steps && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 italic">PASSOS</p>
                                        <p className="text-2xl font-black italic text-blue-500 tracking-tighter leading-none">{stats.steps.toLocaleString()} <span className="text-[10px] uppercase">steps</span></p>
                                    </div>
                                )}
                                {stats.sleep && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 italic">SONO</p>
                                        <p className="text-2xl font-black italic text-blue-500 tracking-tighter leading-none">{stats.sleep}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function WorkoutBuilder({ studentId, onClose, initialData }: { studentId: string, onClose: () => void, initialData?: WorkoutModel }) {
    const [type, setType] = useState(initialData?.type || 'Longão');
    const [day, setDay] = useState(initialData?.dayOfWeek || 'Segunda');
    const [loading, setLoading] = useState(false);

    // Consolidated Form State for ALL types
    const [form, setForm] = useState({
        warmup: initialData?.warmupTime || '10',
        cooldown: initialData?.cooldownTime || '5',
        sets: initialData?.sets || '1',
        reps: initialData?.reps || '1',
        stimulus: initialData?.stimulusTime || '0',
        recovery: initialData?.recoveryTime || '0',
        speed: initialData?.speed || '', 
        description: initialData?.description || ''
    });

    const recommendation = useMemo(() => {
        let advice = { title: "Geral", volume: "Moderado", intensity: "Zona 2", notes: [] as string[] };
        if (type === 'Longão') {
            advice.title = "Longo";
            advice.intensity = "65-75% FCmáx";
            advice.volume = "20-30% Vol. Semanal";
        } else if (type === 'Intervalado') {
            advice.title = "Intervalado";
            advice.intensity = "90-95% FCmáx";
            advice.volume = "Alta Intensidade";
        }
        return advice;
    }, [type]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload: any = {
                studentId,
                type,
                dayOfWeek: day,
                warmupTime: form.warmup,
                cooldownTime: form.cooldown,
                sets: form.sets,
                reps: form.reps,
                stimulusTime: form.stimulus,
                recoveryTime: form.recovery,
                speed: form.speed,
                description: form.description,
            };

            // Wrap operation in a Promise.race to prevent infinite loading state in case of connection lag
            const path = initialData && initialData.id 
                ? `artifacts/${RUN_COLLECTION}/workouts/${initialData.id}`
                : `artifacts/${RUN_COLLECTION}/workouts`;

            const saveOperation = initialData && initialData.id
                ? updateDoc(doc(db, path), payload)
                : addDoc(collection(db, path), { ...payload, createdAt: new Date().toISOString() });

            const timeout = new Promise((resolve) => setTimeout(resolve, 3000));

            await Promise.race([saveOperation, timeout]);
            
            // Forces modal close to allow new creation
            onClose();
        } catch (e) { 
            const path = initialData && initialData.id 
                ? `artifacts/${RUN_COLLECTION}/workouts/${initialData.id}`
                : `artifacts/${RUN_COLLECTION}/workouts`;
            try {
                handleFirestoreError(e, initialData && initialData.id ? OperationType.WRITE : OperationType.WRITE, path);
            } catch (err) {
                console.error(err);
            }
            // Even on error, we might want to close or at least stop loading
            setLoading(false);
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-full">
                <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl h-full shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-red-500">
                        <Brain size={18} /> <span className="text-xs font-black uppercase tracking-widest">Insight IA</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-2xl font-black italic uppercase text-white">{recommendation.title}</h3>
                        <div className="flex gap-4">
                             <div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Intensidade</span>
                                <p className="text-white font-bold">{recommendation.intensity}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Volume</span>
                                <p className="text-white font-bold">{recommendation.volume}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X /></button>
                <h4 className="text-xl font-black italic uppercase mb-8 text-red-600">{initialData ? 'Editar Treino' : 'Nova Sessão'}</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Select label="Dia" value={day} onChange={setDay} options={[
                        {value: 'Segunda', label: 'Segunda'}, {value: 'Terça', label: 'Terça'}, {value: 'Quarta', label: 'Quarta'},
                        {value: 'Quinta', label: 'Quinta'}, {value: 'Sexta', label: 'Sexta'}, {value: 'Sábado', label: 'Sábado'}, {value: 'Domingo', label: 'Domingo'}
                    ]} />
                    <Select label="Tipo" value={type} onChange={setType} options={[
                        {value: 'Longão', label: 'Longão'}, {value: 'Intervalado', label: 'Intervalado'}, {value: 'Fartlek', label: 'Fartlek'},
                        {value: 'Ritmo', label: 'Ritmo / Tempo'}, {value: 'Subida', label: 'Subida'}, {value: 'Regenerativo', label: 'Regenerativo'}
                    ]} />
                </div>

                {/* STANDARD LAYOUT FOR ALL TYPES */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Aquecimento" type="number" value={form.warmup} onChange={(v: string) => setForm({...form, warmup: v})} />
                        <Input label="Desaquecimento" type="number" value={form.cooldown} onChange={(v: string) => setForm({...form, cooldown: v})} />
                        <Input label="Séries" type="number" value={form.sets} onChange={(v: string) => setForm({...form, sets: v})} />
                    </div>
                    
                    <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 grid grid-cols-3 gap-4">
                        <Input label="Reps" type="number" value={form.reps} onChange={(v: string) => setForm({...form, reps: v})} />
                        <Input label="Estímulo" value={form.stimulus} onChange={(v: string) => setForm({...form, stimulus: v})} />
                        <Input label="Recuperação" value={form.recovery} onChange={(v: string) => setForm({...form, recovery: v})} />
                    </div>

                    <div className="grid grid-cols-1">
                        <Input label="Velocidade (km/h)" value={form.speed} onChange={(v: string) => setForm({...form, speed: v})} placeholder="Ex: 12.5" />
                    </div>
                    
                    <TextArea label="Instruções" value={form.description} onChange={(v: string) => setForm({...form, description: v})} placeholder="Ex: Manter postura, final forte..." />
                </div>

                <Button onClick={handleSave} loading={loading} className="w-full">{initialData ? 'Atualizar Treino' : 'Criar Treino'}</Button>
            </div>
        </div>
    );
}

// --- CALENDAR COMPONENTS ---

const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

const RunCalendar = ({ workouts, history, onCheckIn, studentId }: { workouts: WorkoutModel[], history: WorkoutHistoryEntry[], onCheckIn: (date: string, workout: WorkoutModel, stats?: any) => void, studentId?: string }) => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [statsForm, setStatsForm] = useState({
        distance: '',
        duration: '',
        avgPace: '',
        avgHR: '',
        calories: ''
    });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
    
    const normalizeDay = (d: any) => {
        if (!d) return "";
        return String(d).toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .split('-')[0]
            .trim();
    };

    const dayNameMap: Record<string, number> = {
        'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sabado': 6
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getWorkoutForDate = (day: number) => {
        const date = new Date(year, month, day);
        const dayOfWeekIndex = date.getDay(); // 0 is Sunday
        const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = daysMap[dayOfWeekIndex];
        
        return workouts.find(w => {
            if (!w.dayOfWeek) return false;
            const d = normalizeDay(String(w.dayOfWeek));
            return d === normalizeDay(dayName);
        });
    };

    const isCompleted = (day: number, workoutId?: string) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        if (workoutId) {
            return history.some(h => h.date === dateStr && h.workoutId === workoutId && h.type === 'RUNNING');
        }
        return history.some(h => h.date === dateStr && h.type === 'RUNNING');
    };

    const getHistoryEntry = (day: number, workoutId?: string) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        if (workoutId) {
            return history.find(h => h.date === dateStr && h.workoutId === workoutId && h.type === 'RUNNING');
        }
        return history.find(h => h.date === dateStr && h.type === 'RUNNING');
    };

    const handleDayClick = (day: number, workout: WorkoutModel) => {
        setSelectedDay(day === selectedDay ? null : day);
    };

    const handleToggleComplete = (day: number, workout: WorkoutModel) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        if (isCompleted(day, workout.id)) {
            // If already completed, clicking again will undo it (no stats needed)
            onCheckIn(dateStr, workout);
        } else {
            // Show modal to collect stats
            setStatsForm({
                distance: '',
                duration: '',
                avgPace: '',
                avgHR: '',
                calories: ''
            });
            setShowStatsModal(true);
        }
    };

    const submitStats = () => {
        if (!selectedDay || !selectedWorkout) return;
        const dateStr = new Date(year, month, selectedDay).toLocaleDateString('pt-BR');
        
        const rawStats = {
            distance: parseFloat(statsForm.distance) || undefined,
            duration: statsForm.duration || undefined,
            avgPace: statsForm.avgPace || undefined,
            avgHR: parseInt(statsForm.avgHR) || undefined,
            calories: parseInt(statsForm.calories) || undefined
        };

        // Clean undefined values for Firestore
        const cleanStats = Object.fromEntries(Object.entries(rawStats).filter(([_, v]) => v !== undefined));
        
        // If object is empty, pass undefined so it doesn't store an empty object
        const finalStats = Object.keys(cleanStats).length > 0 ? cleanStats : { empty: true };

        onCheckIn(dateStr, selectedWorkout, finalStats);
        setShowStatsModal(false);
    };

    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const selectedWorkout = selectedDay ? getWorkoutForDate(selectedDay) : null;

    return (
        <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
                    <h3 className="text-sm font-black uppercase text-white tracking-widest">{monthNames[month]} {year}</h3>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><ChevronRight size={20}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-zinc-600 uppercase">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {blanks.map(b => <div key={`blank-${b}`} className="aspect-square"></div>)}
                    {days.map(day => {
                        const workout = getWorkoutForDate(day);
                        const completed = isCompleted(day);
                        const dateObj = new Date(year, month, day);
                        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isMissed = workout && !completed && isPast;
                        const hasUnplannedWorkout = !workout && completed;
                        const todayHighlight = isToday(day) ? "bg-zinc-800" : "bg-transparent";
                        const isSelected = selectedDay === day;
                        
                        return (
                            <div key={day} className="aspect-square relative">
                                {(workout || hasUnplannedWorkout) ? (
                                    <button 
                                        onClick={() => handleDayClick(day, workout || { id: 'unplanned', type: 'TREINO LIVRE', dayOfWeek: '' } as any)}
                                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 relative overflow-hidden
                                            ${completed 
                                                ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                                : isMissed
                                                    ? 'bg-red-950/30 border-red-900/50'
                                                    : isSelected
                                                        ? 'border-red-600 bg-red-600/10'
                                                        : `border-zinc-800 hover:border-red-600/50 ${todayHighlight}`
                                            }
                                        `}
                                    >
                                        <span className={`text-[10px] font-black z-10 ${completed ? 'text-emerald-500' : isMissed ? 'text-red-500' : 'text-white'}`}>{day}</span>
                                        <span className="text-[6px] font-black uppercase tracking-tighter opacity-40 absolute bottom-1">
                                            {workout ? workout.type.substring(0, 3) : 'LIV'}
                                        </span>
                                        <div className={`w-1 h-1 rounded-full absolute top-1 right-1 ${completed ? 'bg-emerald-500' : isMissed ? 'bg-red-900' : 'bg-red-600'}`}></div>
                                    </button>
                                ) : (
                                    <div className={`w-full h-full rounded-xl flex flex-col items-center justify-center border border-transparent text-zinc-700 ${todayHighlight}`}>
                                        <span className="text-[10px] font-medium">{day}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex items-center gap-4 mt-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Treino</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Concluído</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-900"></div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Falta</span>
                    </div>
                </div>
            </div>

            {/* SELECTED DAY DETAILS */}
            {selectedDay && selectedWorkout && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest">
                            Treino de {selectedDay} de {monthNames[month]}
                        </h4>
                        <button 
                            onClick={() => handleToggleComplete(selectedDay, selectedWorkout)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2
                                ${isCompleted(selectedDay, selectedWorkout.id)
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }
                            `}
                        >
                            {isCompleted(selectedDay, selectedWorkout.id) ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                            {isCompleted(selectedDay, selectedWorkout.id) ? 'Concluído' : 'Marcar Concluído'}
                        </button>
                    </div>
                    <WorkoutCard 
                        workout={selectedWorkout} 
                        isCompleted={isCompleted(selectedDay, selectedWorkout.id)} 
                        stats={getHistoryEntry(selectedDay, selectedWorkout.id)?.runningStats}
                    />
                </div>
            )}

            {/* STATS MODAL */}
            {showStatsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowStatsModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>
                        <h3 className="text-lg font-black italic uppercase text-white tracking-tighter mb-6">Dados do Treino</h3>
                        <p className="text-xs text-zinc-400 mb-6">Insira os dados do seu Galaxy Watch 7 (opcional)</p>
                        
                        <div className="space-y-4 mb-8">
                            <Input label="Distância (km)" type="number" value={statsForm.distance} onChange={(v: string) => setStatsForm({...statsForm, distance: v})} placeholder="Ex: 5.2" />
                            <Input label="Duração Total" value={statsForm.duration} onChange={(v: string) => setStatsForm({...statsForm, duration: v})} placeholder="Ex: 45 min" />
                            <Input label="Pace Médio" value={statsForm.avgPace} onChange={(v: string) => setStatsForm({...statsForm, avgPace: v})} placeholder="Ex: 6'30&quot;" />
                            <Input label="BPM Médio" type="number" value={statsForm.avgHR} onChange={(v: string) => setStatsForm({...statsForm, avgHR: v})} placeholder="Ex: 145" />
                            <Input label="Calorias" type="number" value={statsForm.calories} onChange={(v: string) => setStatsForm({...statsForm, calories: v})} placeholder="Ex: 450" />
                        </div>
                        
                        <div className="flex gap-4">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowStatsModal(false)}>Cancelar</Button>
                            <Button className="flex-1" onClick={submitStats}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COACH VIEW ---

export function RunTrackCoachView({ student, onBack }: { student: Student, onBack: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);
    const [runnerCount, setRunnerCount] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutModel | null>(null);
    
    useEffect(() => {
        if (!student.id) return;
        const hasSeeded = localStorage.getItem(`seeded_${student.id}_run_v9`);
        if (!hasSeeded) {
            const checkAndSeed = async () => {
                try {
                    await new Promise(r => setTimeout(r, 2000));
                    
                    // Query firestore directly to avoid closure stale state
                    const path = `artifacts/${RUN_COLLECTION}/workouts`;
                    const q = collection(db, path);
                    const snap = await getDocs(q);
                    const currentWorkouts = snap.docs
                        .map(d => ({id: d.id, ...d.data()} as WorkoutModel))
                        .filter(w => w.studentId === student.id);

                    if (['fixed-andre', 'fixed-liliane', 'fixed-marcelly'].includes(student.id)) {
                        for (const w of currentWorkouts) {
                            const docPath = `artifacts/${RUN_COLLECTION}/workouts/${w.id}`;
                            await deleteDoc(doc(db, docPath));
                        }
                        await seedWorkouts(student.id);
                    }
                    localStorage.setItem(`seeded_${student.id}_run_v9`, 'true');
                } catch (err) {
                    const path = `artifacts/${RUN_COLLECTION}/workouts`;
                    try {
                        handleFirestoreError(err, OperationType.GET, path);
                    } catch (e) {
                        console.error(e);
                    }
                    localStorage.setItem(`seeded_${student.id}_run_v9`, 'true');
                }
            };
            checkAndSeed();
        }
    }, [student.id]);

    useEffect(() => {
        const path = `artifacts/${RUN_COLLECTION}/workouts`;
        const q = collection(db, path);
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as WorkoutModel));
            setWorkouts(data.filter(w => w.studentId === student.id));
            
            // Count unique students with prescribed workouts
            const studentIds = new Set(data.map(d => d.studentId));
            setRunnerCount(studentIds.size);
        }, (error) => {
            try {
                handleFirestoreError(error, OperationType.GET, path);
            } catch (e) {
                console.error(e);
            }
        });
        return () => unsub();
    }, [student.id]);

    const deleteWorkout = async (id: string) => {
        const path = `artifacts/${RUN_COLLECTION}/workouts/${id}`;
        try {
            await deleteDoc(doc(db, path));
        } catch (error) {
            try {
                handleFirestoreError(error, OperationType.DELETE, path);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleEdit = (workout: WorkoutModel) => {
        setEditingWorkout(workout);
        setIsCreating(true); // Re-use the builder logic
    };

    const handleCloseBuilder = () => {
        setIsCreating(false);
        setEditingWorkout(null);
    };

    const weeklyVolume = useMemo(() => {
        return workouts.reduce((acc, w) => acc + estimateWorkoutDuration(calculateAdjustedWorkout(w).adjusted), 0);
    }, [workouts]);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
            <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b border-white/5">
                <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  <HeaderTitle text={`ABFIT RUN ${student.nome}`} />
                </h2>
            </header>

            {/* WEEKLY VOLUME SUMMARY */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <BarChart3 size={12} className="text-red-600" /> Volume Semanal
                    </span>
                    <span className="text-3xl font-black italic text-white tracking-tighter leading-none">
                        {formatDuration(weeklyVolume)}
                    </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <TrendingUp size={24} className="text-zinc-500" />
                </div>
            </div>

            <div className="flex justify-between items-center p-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                    <Flame className="text-red-600" /> Planilhas
                </h3>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)} variant="secondary">
                       <Plus size={16} /> Adicionar
                    </Button>
                )}
            </div>

            {isCreating && (
                <WorkoutBuilder 
                    studentId={student.id}
                    onClose={handleCloseBuilder}
                    initialData={editingWorkout || undefined} 
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                {workouts.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                        <p className="font-bold text-zinc-600 uppercase text-xs tracking-widest">SEM TREINOS PRESCRITOS</p>
                    </div>
                ) : (
                   [...workouts].sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(w => (
                       <WorkoutCard 
                           key={w.id} 
                           workout={w} 
                           onDelete={() => deleteWorkout(w.id)} 
                           onEdit={() => handleEdit(w)}
                       />
                   )) 
                )}
            </div>
            
            <WorkoutLegend />
        </div>
    )
}

// --- STUDENT VIEW ---

import { LiveRunSession, WorkoutSegment } from './LiveRunSession';

function parseWorkoutSegments(workout: WorkoutModel): WorkoutSegment[] {
    if (workout.type === 'TREINO LIVRE') {
        return [{ type: 'continuous', duration: 24 * 60 * 60, title: 'Treino Livre' }];
    }
    if (workout.segments && workout.segments.length > 0) {
        return workout.segments;
    }
    const segments: WorkoutSegment[] = [];
    
    // Warmup
    const warmupMins = parseToMinutes(workout.warmupTime, workout.speed);
    if (warmupMins > 0) {
        segments.push({
            type: 'warmup',
            duration: Math.round(warmupMins * 60),
            title: 'Aquecimento'
        });
    }

    // Main Block
    const sets = parseInt(workout.sets || '1') || 1;
    const reps = parseInt(workout.reps || '1') || 1;
    const totalIntervals = sets * reps;

    if (totalIntervals > 1 && workout.stimulusTime) {
        // Interval training
        const stimulusMins = parseToMinutes(workout.stimulusTime, workout.speed);
        const recoveryMins = parseToMinutes(workout.recoveryTime, workout.speed);
        
        for (let i = 0; i < totalIntervals; i++) {
            if (stimulusMins > 0) {
                segments.push({
                    type: 'stimulus',
                    duration: Math.round(stimulusMins * 60),
                    title: `${i + 1} de ${totalIntervals} - Corrida`,
                    speed: workout.speed
                });
            }
            if (recoveryMins > 0) { 
                segments.push({
                    type: 'recovery',
                    duration: Math.round(recoveryMins * 60),
                    title: `${i + 1} de ${totalIntervals} - Caminhada`
                });
            }
        }
    } else {
        // Continuous
        const mainMins = parseToMinutes(workout.totalTime, workout.speed) || parseToMinutes(workout.distance, workout.speed);
        if (mainMins > 0) {
            segments.push({
                type: 'continuous',
                duration: Math.round(mainMins * 60),
                title: 'Corrida Principal',
                speed: workout.speed
            });
        }
    }

    // Cooldown
    const cooldownMins = parseToMinutes(workout.cooldownTime, workout.speed);
    if (cooldownMins > 0) {
        segments.push({
            type: 'cooldown',
            duration: Math.round(cooldownMins * 60),
            title: 'Caminhada Regenerativa'
        });
    }

    // Fallback if no segments could be parsed (e.g. just distance without pace)
    if (segments.length === 0) {
        segments.push({
            type: 'continuous',
            duration: 0, // 0 means indefinite
            title: 'Corrida Livre'
        });
    }

    return segments;
}

export function RunTrackStudentView({ student, onBack, onSave, onToggleMenu }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void, onToggleMenu?: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);
    const [runnerCount, setRunnerCount] = useState(1);
    const [loggingWorkout, setLoggingWorkout] = useState<WorkoutModel | null>(null);
    const [liveWorkout, setLiveWorkout] = useState<WorkoutModel | null>(null);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY'>('OVERVIEW');

    useEffect(() => {
        if (!student.id) return;
        
        const checkAndSeed = async () => {
            try {
                const path = `artifacts/${RUN_COLLECTION}/workouts`;
                const q = collection(db, path);
                const querySnapshot = await getDocs(q);
                const currentWorkouts = querySnapshot.docs
                    .map(d => ({id: d.id, ...d.data()} as WorkoutModel))
                    .filter(w => w.studentId === student.id);

                // Only seed if there are NO workouts for this student
                if (currentWorkouts.length === 0 && ['fixed-andre', 'fixed-liliane', 'fixed-marcelly'].includes(student.id)) {
                    console.log(`Seeding initial workouts for ${student.nome}...`);
                    await seedWorkouts(student.id);
                }
            } catch (err) {
                console.error("Error during workout check/seed:", err);
            }
        };
        
        checkAndSeed();
    }, [student.id]);

    useEffect(() => {
        if (!student.id) return;
        const path = `artifacts/${RUN_COLLECTION}/workouts`;
        const q = collection(db, path);
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as WorkoutModel));
            setWorkouts(data.filter(w => w.studentId === student.id));
            
            // Count unique students with prescribed workouts
            const studentIds = new Set(data.map(d => d.studentId));
            setRunnerCount(studentIds.size);
        }, (error) => {
            try {
                handleFirestoreError(error, OperationType.GET, path);
            } catch (e) {
                console.error(e);
            }
        });
        return () => unsub();
    }, [student.id]);

    const daysMap = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const todayName = daysMap[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    const uniqueWorkoutsByDay = useMemo(() => {
        const map = new Map<string, WorkoutModel>();
        workouts.forEach(w => {
            const day = normalizeDay(w.dayOfWeek);
            if (!map.has(day)) {
                map.set(day, w);
            }
        });

        return daysMap.map(dayName => {
            const normalized = normalizeDay(dayName);
            const workout = map.get(normalized);
            if (workout) return workout;
            
            // Return a "Day Off" placeholder
            return {
                id: `day-off-${normalized}`,
                studentId: student.id,
                type: 'DAY OFF',
                dayOfWeek: dayName,
                description: 'Recuperação total. Hidrate-se e descanse.',
                isDayOff: true
            } as any;
        });
    }, [workouts, student.id]);

    const todayWorkout = workouts.find(w => {
        if (!w.dayOfWeek) return false;
        const d = normalizeDay(String(w.dayOfWeek));
        return d.includes(normalizeDay(todayName));
    });

    const isWatch = React.useMemo(() => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        const isWearOS = ua.includes('wear os') || ua.includes('wearos');
        const isWatchUA = ua.includes('watch') || ua.includes('samsung');
        const isSmallScreen = window.innerWidth < 500 && window.innerHeight < 500;
        return (isWearOS || isWatchUA) && isSmallScreen;
    }, []);

    const weeklyVolume = useMemo(() => {
        return workouts.reduce((acc, w) => acc + estimateWorkoutDuration(calculateAdjustedWorkout(w).adjusted), 0);
    }, [workouts]);

    const handleCheckIn = (dateStr: string, workout: WorkoutModel, stats?: any) => {
        // Toggle logic: If exists, remove. If not, add.
        const currentHistory = student.workoutHistory || [];
        const existingIndex = currentHistory.findIndex(h => h.date === dateStr && h.workoutId === workout.id && h.type === 'RUNNING');

        let updatedHistory;
        let isAdding = false;
        
        if (existingIndex > -1 && !stats) {
            // Remove check-in (Undo) - only if no stats provided (simple toggle)
            updatedHistory = currentHistory.filter((_, idx) => idx !== existingIndex);
        } else {
            // Add or Update check-in
            isAdding = existingIndex === -1;
            const newEntry: WorkoutHistoryEntry = {
                id: existingIndex > -1 ? currentHistory[existingIndex].id : Date.now().toString(),
                workoutId: workout.id,
                name: workout.type, // e.g. "Longão"
                date: dateStr,
                timestamp: Date.now(),
                duration: stats?.duration || workout.totalTime || formatDuration(estimateWorkoutDuration(calculateAdjustedWorkout(workout).adjusted)),
                type: 'RUNNING',
                runningStats: stats
            };

            if (existingIndex > -1) {
                updatedHistory = currentHistory.map((h, idx) => idx === existingIndex ? newEntry : h);
            } else {
                updatedHistory = [newEntry, ...currentHistory];
            }
        }

        const currentAnalytics = student.analytics || { sessionsCompleted: 0, streakDays: 0, exercises: {} };
        let updatedAnalytics = { ...currentAnalytics };

        if (isAdding) {
            const now = new Date();
            let newStreak = currentAnalytics.streakDays;
            const lastDateStr = currentAnalytics.lastSessionDate;
            const todayStr = now.toLocaleDateString('pt-BR');
            
            if (lastDateStr) {
                const [lastDay, lastMonth, lastYear] = lastDateStr.split('/');
                const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, parseInt(lastDay));
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            updatedAnalytics = {
                ...currentAnalytics,
                sessionsCompleted: currentAnalytics.sessionsCompleted + 1,
                streakDays: newStreak,
                lastSessionDate: todayStr
            };
        } else if (existingIndex > -1 && !stats) {
            // If removing, we could decrement sessionsCompleted, but streak is hard to recalculate.
            // For simplicity, just decrement sessionsCompleted.
            updatedAnalytics = {
                ...currentAnalytics,
                sessionsCompleted: Math.max(0, currentAnalytics.sessionsCompleted - 1)
            };
        }

        onSave(student.id, { workoutHistory: updatedHistory, analytics: updatedAnalytics });
        setLoggingWorkout(null);
    };

    const totalCalories = (student.workoutHistory || [])
        .filter(h => h.type === 'RUNNING' && h.runningStats?.calories)
        .reduce((sum, h) => sum + (Number(h.runningStats?.calories) || 0), 0);

    const fatLossKg = (totalCalories / 7700).toFixed(2);

    return (
        <div className={`animate-in fade-in duration-500 text-left h-screen overflow-hidden bg-transparent flex flex-col relative ${isWatch ? 'rounded-full border-2 border-red-600 p-2' : ''}`}>
            {/* STICKY HEADER */}
            {!isWatch && (
                <header className="p-6 pb-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                           {onToggleMenu && (
                             <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
                               <Menu size={20}/>
                             </button>
                           )}
                           <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                             <ArrowLeft size={20}/>
                           </button>
                        </div>
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
                          <HeaderTitle text="ABFIT RUN" />
                        </h2>
                    </div>
                </header>
            )}

            {!isWatch && (
                <div className="bg-black/80 backdrop-blur-md px-6 flex gap-6 z-40 relative">
                    <button 
                        onClick={() => setActiveTab('OVERVIEW')} 
                        className={`py-4 uppercase text-xs font-black tracking-widest relative ${activeTab === 'OVERVIEW' ? 'text-red-600' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Visão Geral
                        {activeTab === 'OVERVIEW' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')} 
                        className={`py-4 uppercase text-xs font-black tracking-widest relative ${activeTab === 'HISTORY' ? 'text-red-600' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Histórico
                        {activeTab === 'HISTORY' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />}
                    </button>
                </div>
            )}

            <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 ${isWatch ? 'space-y-6' : 'space-y-12'}`}>
                {activeTab === 'OVERVIEW' ? (
                <>
                {/* WEEKLY VOLUME SUMMARY - NRC STYLE */}
                <div className={`${isWatch ? 'p-4 rounded-3xl' : 'p-8 rounded-[2.5rem]'} bg-zinc-900 border border-white/5 shadow-2xl relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/20 transition-all" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`${isWatch ? 'text-[8px]' : 'text-[10px]'} font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2`}>
                                <Activity size={isWatch ? 10 : 14} className="text-red-600" /> Volume
                            </span>
                            
                            {!isWatch && runnerCount > 1 && (
                                <div className="flex items-center gap-2 bg-black/40 py-1.5 px-3 rounded-full border border-white/5 backdrop-blur-md">
                                    <div className="flex -space-x-1.5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-5 h-5 rounded-full border border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                <img src={`https://picsum.photos/seed/athlete${i}/32/32`} alt="athlete" referrerPolicy="no-referrer" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.15em] leading-none">
                                        Você e +{runnerCount - 1} <span className="text-zinc-600">Atletas</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className={`${isWatch ? 'text-4xl' : 'text-7xl'} font-black italic text-white tracking-tighter leading-none`}>
                                {formatDuration(weeklyVolume).split(' ')[0]}
                            </span>
                            <span className={`${isWatch ? 'text-xs' : 'text-2xl'} font-black italic text-zinc-500 uppercase tracking-tight`}>
                                {formatDuration(weeklyVolume).split(' ')[1] || 'min'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* TOTAL CALORIES & FAT LOSS */}
                <div className={`${isWatch ? 'p-4 rounded-3xl' : 'p-8 rounded-[2.5rem]'} bg-gradient-to-br from-zinc-900 to-black border border-white/5 shadow-2xl relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-orange-600/20 transition-all" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <span className={`${isWatch ? 'text-[8px]' : 'text-[10px]'} font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2`}>
                                <Flame size={isWatch ? 10 : 14} className="text-orange-500" /> Metabolismo
                            </span>
                            <span className="text-[9px] font-black italic text-zinc-600 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded-md">Real Estimado</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Calorias Queimadas</div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`${isWatch ? 'text-2xl' : 'text-4xl'} font-black italic text-white tracking-tighter leading-none`}>
                                        {totalCalories}
                                    </span>
                                    <span className="text-xs font-black italic text-zinc-500 uppercase tracking-tight">Kcal</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Massa Gorda (Bal.)</div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`${isWatch ? 'text-2xl' : 'text-4xl'} font-black italic text-orange-500 tracking-tighter leading-none`}>
                                        -{fatLossKg}
                                    </span>
                                    <span className="text-xs font-black italic text-zinc-500 uppercase tracking-tight">Kg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* QUICK LOG SECTION */}
                {!isWatch && (
                    <div className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6 shadow-xl">
                         <div className="flex items-center gap-3 mb-4">
                            <Zap size={18} className="text-[#e2ff00]" />
                            <h3 className="text-sm font-black italic uppercase text-white tracking-widest leading-none">Registro Rápido</h3>
                        </div>
                        <button 
                            onClick={() => setLiveWorkout({ 
                                id: `photo-sync-${Date.now()}`, 
                                type: 'TREINO LIVRE', 
                                dayOfWeek: todayName,
                                segments: [{ type: 'continuous', duration: 0, title: 'Photo Sync' }] 
                            } as any)}
                            className="w-full py-5 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center gap-3 text-zinc-500 hover:text-[#e2ff00] hover:border-[#e2ff00]/50 transition-all group"
                        >
                            <Camera size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Sincronizar Samsung Health (IA)</span>
                        </button>
                    </div>
                )}

                <div className={`max-w-md mx-auto ${isWatch ? 'space-y-6' : 'space-y-12'} pb-24`}>
                    {/* CALENDAR */}
                    {!isWatch && (
                        <RunCalendar 
                            workouts={workouts} 
                            history={student.workoutHistory || []} 
                            onCheckIn={handleCheckIn} 
                            studentId={student.id}
                        />
                    )}

                    {/* HERO CARD (TODAY) */}
                    {todayWorkout ? (
                        <div className={`relative overflow-hidden ${isWatch ? 'rounded-3xl p-6' : 'rounded-[3rem] p-10'} bg-zinc-900 border border-zinc-800 group shadow-2xl transition-all`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Hoje</span>
                                    {isWatch && (
                                        <button onClick={onBack} className="p-1 bg-black/40 rounded-full text-white"><ArrowLeft size={12}/></button>
                                    )}
                                </div>
                                
                                <h3 className={`${isWatch ? 'text-xl' : 'text-5xl'} font-black italic uppercase mb-2 leading-none tracking-tighter text-white`}>{todayWorkout.type}</h3>
                                
                                <button 
                                    onClick={() => setLiveWorkout(todayWorkout)}
                                    className={`w-full ${isWatch ? 'py-3 mt-4' : 'py-6 mt-8'} bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-2xl shadow-red-600/40`}
                                >
                                    <Play size={isWatch ? 16 : 24} className="fill-white" />
                                    {isWatch ? 'Iniciar' : 'Iniciar Corrida'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`bg-zinc-900 ${isWatch ? 'rounded-3xl p-6 h-40' : 'rounded-[3rem] p-12 h-96'} text-center border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/5 to-transparent" />
                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <p className="text-white font-black text-xl italic uppercase tracking-tighter">Descanso</p>
                                <button 
                                    onClick={() => setLiveWorkout({
                                        id: `free-run-${Date.now()}`,
                                        studentId: student.id,
                                        type: 'TREINO LIVRE',
                                        dayOfWeek: todayName,
                                        description: 'Treino Livre',
                                    } as any)}
                                    className="py-4 px-8 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black italic uppercase tracking-widest flex items-center gap-2 transition-all"
                                >
                                    <Play size={18} />
                                    Treinar Livre
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RECENT RUNS HISTORY - NRC STYLE */}
                    {!isWatch && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <BarChart3 size={24} className="text-red-600"/>
                                    <h3 className="text-2xl font-black italic uppercase text-zinc-400 tracking-tighter">Atividades Recentes</h3>
                                </div>
                                <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Ver Tudo</button>
                            </div>
                            
                            <div className="space-y-6">
                                {[...(student.workoutHistory || [])]
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .filter(h => h.type === 'RUNNING')
                                    .slice(0, 1)
                                    .map(h => {
                                        const workout = workouts.find(w => w.id === h.workoutId);
                                        return (
                                            <div key={h.id} className="animate-in slide-in-from-bottom-4 duration-500">
                                                <div className="flex items-center gap-3 mb-3 pl-2">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{h.date}</span>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <WorkoutCard 
                                                    workout={workout || { type: h.name, dayOfWeek: '' } as any} 
                                                    stats={h.runningStats}
                                                    isCompleted={true}
                                                />
                                            </div>
                                        );
                                    })
                                }
                                {!(student.workoutHistory || []).some(h => h.type === 'RUNNING') && (
                                    <div className="p-12 text-center bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-800">
                                        <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Nenhuma corrida registrada ainda</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isWatch && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4 pl-2">
                                <Calculator size={24} className="text-red-600"/>
                                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Sua Planilha</h3>
                            </div>
                            {uniqueWorkoutsByDay.map(w => {
                                const isTodayWorkout = normalizeDay(w.dayOfWeek).includes(normalizeDay(todayName));
                                return (
                                    <div key={w.id} onClick={() => !w.isDayOff && setLoggingWorkout(w)} className={w.isDayOff ? 'opacity-50 grayscale' : 'cursor-pointer'}>
                                        <WorkoutCard 
                                            workout={w} 
                                            isToday={isTodayWorkout}
                                            isCompleted={student.workoutHistory?.some(h => h.workoutId === w.id && h.date === new Date().toLocaleDateString('pt-BR'))}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!isWatch && <WorkoutLegend />}
                </div>
                </>
                ) : (
                    // HISTORY TAB CONTENT
                    <div className="max-w-md mx-auto space-y-6 pb-24">
                        <div className="flex items-center gap-3 mb-8 px-2 mt-4">
                            <Activity size={24} className="text-red-600"/>
                            <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Histórico Completo</h3>
                        </div>
                        <div className="space-y-6">
                            {[...(student.workoutHistory || [])]
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .filter(h => h.type === 'RUNNING')
                                .map((h, index) => {
                                    const workout = workouts.find(w => w.id === h.workoutId) || { id: 'unplanned', type: h.name || 'TREINO LIVRE', dayOfWeek: '', customDisplay: h.name || 'TREINO LIVRE' } as any;
                                    return (
                                        <div key={h.id || index} className="animate-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex items-center gap-3 mb-3 pl-2">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{h.date}</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                            </div>
                                            <WorkoutCard 
                                                workout={workout} 
                                                stats={h.runningStats}
                                                isCompleted={true}
                                                hideActions={true}
                                            />
                                        </div>
                                    );
                                })
                            }
                            {!(student.workoutHistory || []).some(h => h.type === 'RUNNING') && (
                                <div className="p-12 text-center bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-800">
                                    <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Nenhuma corrida registrada ainda</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <AppFooter />
            </div>

            {loggingWorkout && (
                <LogWorkoutModal 
                    workout={loggingWorkout} 
                    onClose={() => setLoggingWorkout(null)} 
                    onSave={(stats) => handleCheckIn(new Date().toLocaleDateString('pt-BR'), loggingWorkout, stats)}
                    initialStats={(loggingWorkout as any).initialStats}
                />
            )}

            {liveWorkout && (
                <LiveRunSession
                    segments={parseWorkoutSegments(liveWorkout)}
                    workoutTitle={`${liveWorkout.type} - ${liveWorkout.dayOfWeek}`}
                    isFreeMode={liveWorkout.type === 'TREINO LIVRE'}
                    onClose={() => setLiveWorkout(null)}
                    studentWeight={typeof student.weight === 'string' ? parseFloat(student.weight) : student.weight}
                    studentHeight={typeof student.height === 'string' ? parseFloat(student.height) : student.height}
                    studentPhoto={student.photoUrl}
                    athleteName={student.nome}
                    onFinish={(totalTime, stats) => {
                        // Save immediately to history
                        const dateStr = new Date().toLocaleDateString('pt-BR');
                        // Ensure we pass the whole history entry object as the third argument
                        handleCheckIn(dateStr, liveWorkout, stats);
                    }}
                />
            )}
        </div>
    )
}

const LogWorkoutModal = ({ workout, onClose, onSave, initialStats }: { workout: WorkoutModel, onClose: () => void, onSave: (stats: any) => void, initialStats?: any }) => {
    const [stats, setStats] = useState({
        distance: initialStats?.distance || '',
        avgPace: initialStats?.avgPace || '',
        avgHR: initialStats?.avgHR || '',
        calories: initialStats?.calories || '',
        duration: initialStats?.duration || '',
        elevation: initialStats?.elevation || '',
        path: initialStats?.path || []
    });
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                
                const prompt = "Analise esta foto de uma esteira ou print de app de corrida e extraia os seguintes dados em formato JSON: distance (km), duration (minutos), avgPace (ritmo médio), avgHR (batimentos cardíacos), calories (kcal). Se não encontrar algum dado, deixe em branco. Retorne APENAS o JSON.";
                
                const response = await callAI({
                    model: "gemini-3-flash-preview",
                    prompt: prompt,
                    isImageAnalysis: true,
                    imageBase64: base64
                });
                
                const text = response.text || "";
                const jsonMatch = text.match(/\{.*\}/s);
                    if (jsonMatch) {
                        const data = JSON.parse(jsonMatch[0]);
                        setStats({
                            distance: data.distance || '',
                            duration: data.duration || '',
                            avgPace: data.avgPace || '',
                            avgHR: data.avgHR || '',
                            calories: data.calories || '',
                            elevation: data.elevation || '',
                            path: stats.path // Keep existing path if any
                        });
                    }
                setIsExtracting(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Erro ao extrair dados:", error);
            setIsExtracting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                <header className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Registrar Treino</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{workout.type} - {workout.dayOfWeek}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </header>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* PHOTO UPLOAD SECTION */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">EXTRAIR DADOS (SAMSUNG HEALTH / NRC)</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="w-full py-10 border-2 border-dashed border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#e2ff00]/50 hover:bg-[#e2ff00]/5 transition-all group relative overflow-hidden bg-black/20"
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 size={32} className="text-[#e2ff00] animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Processando Imagem com IA...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-[#e2ff00] group-hover:text-black transition-all shadow-xl">
                                        <Camera size={28} />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-xs font-black uppercase tracking-widest text-[#e2ff00]">Sincronizar Samsung Health</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Tire uma foto ou envie um print</span>
                                    </div>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">DISTÂNCIA (KM)</label>
                            <input 
                                type="text" 
                                placeholder="0.00"
                                value={stats.distance}
                                onChange={e => setStats({...stats, distance: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-2xl text-[#e2ff00] font-black italic focus:border-[#e2ff00] transition-colors outline-none tracking-tighter"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">DURAÇÃO (MIN)</label>
                            <input 
                                type="text" 
                                placeholder="00"
                                value={stats.duration}
                                onChange={e => setStats({...stats, duration: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-2xl text-[#e2ff00] font-black italic focus:border-[#e2ff00] transition-colors outline-none tracking-tighter"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">RITMO MÉDIO (PACE)</label>
                            <input 
                                type="text" 
                                placeholder="0:00"
                                value={stats.avgPace}
                                onChange={e => setStats({...stats, avgPace: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-2xl text-white font-black italic focus:border-[#e2ff00] transition-colors outline-none tracking-tighter"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">FC MÉDIA (BPM)</label>
                            <input 
                                type="text" 
                                placeholder="--"
                                value={stats.avgHR}
                                onChange={e => setStats({...stats, avgHR: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-2xl text-white font-black italic focus:border-[#e2ff00] transition-colors outline-none tracking-tighter"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">CALORIAS (KCAL)</label>
                            <input 
                                type="text" 
                                placeholder="0"
                                value={stats.calories}
                                onChange={e => setStats({...stats, calories: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-2xl text-white font-black italic focus:border-[#e2ff00] transition-colors outline-none tracking-tighter"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2 italic">ELEVAÇÃO (M)</label>
                            <input 
                                type="text" 
                                placeholder="0"
                                value={stats.elevation || ''}
                                onChange={e => setStats({...stats, elevation: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-2xl text-white font-black italic focus:border-[#e2ff00] transition-colors outline-none tracking-tighter"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-[#e2ff00]/5 border border-[#e2ff00]/10 rounded-3xl flex items-start gap-4">
                        <Sparkles size={20} className="text-[#e2ff00] shrink-0 mt-1" />
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed italic">
                            A inteligência artificial do ABFIT analisa seu print do Samsung Health ou NRC e preenche tudo instantaneamente.
                        </p>
                    </div>
                </div>

                <footer className="p-8 border-t border-white/5 bg-zinc-950">
                    <button 
                        onClick={() => onSave(stats)}
                        className="w-full py-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-lg shadow-2xl shadow-red-900/40 active:scale-95 transition-all hover:bg-red-500"
                    >
                        Confirmar Registro
                    </button>
                </footer>
            </div>
        </div>
    );
};

// --- HELPERS ---

const normalizeDay = (d: any) => {
    if (!d) return "";
    return String(d).toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split('-')[0]
        .trim();
};

const getDayIndex = (day: string): number => {
    if (!day) return 99;
    const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const d = normalizeDay(day);
    const idx = days.findIndex(x => x === d);
    return idx === -1 ? 99 : idx;
};

const seedWorkouts = async (studentId: string) => {
    const complexSegments: WorkoutSegment[] = [
        { type: 'warmup', duration: 10 * 60, title: 'Aquecimento' },
        { type: 'stimulus', duration: 90, title: 'Tiro 1/8' },
        { type: 'recovery', duration: 90, title: 'Recuperação 1/8' },
        { type: 'stimulus', duration: 90, title: 'Tiro 2/8' },
        { type: 'recovery', duration: 90, title: 'Recuperação 2/8' },
        { type: 'stimulus', duration: 90, title: 'Tiro 3/8' },
        { type: 'recovery', duration: 90, title: 'Recuperação 3/8' },
        { type: 'stimulus', duration: 90, title: 'Tiro 4/8' },
        { type: 'recovery', duration: 90, title: 'Recuperação 4/8' },
        { type: 'recovery', duration: 510, title: 'Transição' },
        { type: 'stimulus', duration: 90, title: 'Tiro 5/8' },
        { type: 'recovery', duration: 120, title: 'Recuperação 5/8' },
        { type: 'stimulus', duration: 90, title: 'Tiro 6/8' },
        { type: 'recovery', duration: 120, title: 'Recuperação 6/8' },
        { type: 'stimulus', duration: 90, title: 'Tiro 7/8' },
        { type: 'recovery', duration: 120, title: 'Recuperação 7/8' },
        { type: 'stimulus', duration: 90, title: 'Tiro 8/8' },
        { type: 'recovery', duration: 120, title: 'Recuperação 8/8' },
        { type: 'cooldown', duration: 510, title: 'Desaquecimento' }
    ];

    const intervaladoConfortavel = {
        type: 'Intervalado',
        warmupTime: '10', sets: '1', reps: '1', stimulusTime: '26', recoveryTime: '8.5', cooldownTime: '8.5',
        customDisplay: '<span class="text-emerald-500">10\' AQ</span> <span class="text-zinc-400 mx-2">+</span> <span>4x</span> <span class="text-red-600">1\'30 CO</span><span class="text-zinc-400 mx-1">:</span><span class="text-white">1\'30 CA</span> <span class="text-zinc-400 mx-2">+</span> <span class="text-white">8\'30 CA</span> <span class="text-zinc-400 mx-2">+</span> <span>4x</span> <span class="text-red-600">1\'30 CO</span><span class="text-zinc-400 mx-1">:</span><span class="text-white">2\' CA</span> <span class="text-zinc-400 mx-2">+</span> <span class="text-white">8\'30 REC</span>',
        description: 'Ritmo deve permitir conversa fácil.',
        segments: complexSegments
    };

    const intervaladoDesconfortavel = {
        type: 'Intervalado',
        warmupTime: '10', sets: '1', reps: '1', stimulusTime: '26', recoveryTime: '8.5', cooldownTime: '8.5',
        customDisplay: '<span class="text-emerald-500">10\' AQ</span> <span class="text-zinc-400 mx-2">+</span> <span>4x</span> <span class="text-red-600">1\'30 CO</span><span class="text-zinc-400 mx-1">:</span><span class="text-white">1\'30 CA</span> <span class="text-zinc-400 mx-2">+</span> <span class="text-white">8\'30 CA</span> <span class="text-zinc-400 mx-2">+</span> <span>4x</span> <span class="text-red-600">1\'30 CO</span><span class="text-zinc-400 mx-1">:</span><span class="text-white">2\' CA</span> <span class="text-zinc-400 mx-2">+</span> <span class="text-white">8\'30 REC</span>',
        description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.',
        segments: complexSegments
    };

    const rodagem = {
        type: 'Rodagem',
        warmupTime: '50', sets: '1', reps: '1', stimulusTime: '0', recoveryTime: '0', cooldownTime: '0',
        customDisplay: '<span class="text-emerald-500">50\' CA</span> <span class="text-zinc-400 ml-3 text-[0.9em]">5.5km/h</span>',
        description: 'Caminhada Contínua a 5,5 km/h'
    };

    const payloadMap: Record<string, any[]> = {
        'fixed-andre': [
            { studentId: 'fixed-andre', dayOfWeek: 'Segunda', ...intervaladoConfortavel },
            { studentId: 'fixed-andre', dayOfWeek: 'Terça', ...rodagem },
            { studentId: 'fixed-andre', dayOfWeek: 'Quarta', ...intervaladoDesconfortavel },
            { studentId: 'fixed-andre', dayOfWeek: 'Quinta', ...rodagem },
            { studentId: 'fixed-andre', dayOfWeek: 'Sexta', ...intervaladoConfortavel }
        ],
        'fixed-liliane': [
            { studentId: 'fixed-liliane', dayOfWeek: 'Segunda', ...intervaladoConfortavel },
            { studentId: 'fixed-liliane', dayOfWeek: 'Terça', ...rodagem },
            { studentId: 'fixed-liliane', dayOfWeek: 'Quarta', ...intervaladoDesconfortavel },
            { studentId: 'fixed-liliane', dayOfWeek: 'Quinta', ...rodagem },
            { studentId: 'fixed-liliane', dayOfWeek: 'Sexta', ...intervaladoConfortavel }
        ],
        'fixed-marcelly': [
            { studentId: 'fixed-marcelly', dayOfWeek: 'Segunda', ...intervaladoConfortavel },
            { studentId: 'fixed-marcelly', dayOfWeek: 'Terça', ...rodagem },
            { studentId: 'fixed-marcelly', dayOfWeek: 'Quarta', ...intervaladoDesconfortavel },
            { studentId: 'fixed-marcelly', dayOfWeek: 'Quinta', ...rodagem },
            { studentId: 'fixed-marcelly', dayOfWeek: 'Sexta', ...intervaladoConfortavel }
        ]
    };

    const payload = payloadMap[studentId];
    if (!payload) return;

    const path = `artifacts/${RUN_COLLECTION}/workouts`;
    // Use Promise.all to ensure all are added before finishing
    await Promise.all(payload.map(async (w) => {
        try {
            await addDoc(collection(db, path), { 
                ...w, 
                createdAt: new Date().toISOString() 
            });
        } catch (error) {
            try {
                handleFirestoreError(error, OperationType.WRITE, path);
            } catch (e) {
                console.error(e);
            }
        }
    }));
    
    localStorage.setItem(`seeded_${studentId}_run_v9`, 'true');
};
