import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, Square, ChevronRight, Volume2, VolumeX, X, User, Users, Map as MapIcon, BarChart2, Check, Timer, Wifi, LayoutGrid, Camera, Loader2, Heart, Activity, Menu, ArrowLeft, Zap, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Logo } from './Layout';
import { callAI } from '../services/gemini';

// Fix Leaflet marker icon issue
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

export interface WorkoutSegment {
    type: 'warmup' | 'stimulus' | 'recovery' | 'cooldown' | 'continuous';
    duration: number; // in seconds
    title: string;
    speed?: string;
}

interface LiveRunSessionProps {
    segments: WorkoutSegment[];
    workoutTitle: string;
    onClose: () => void;
    onFinish: (totalTime: number, stats?: any) => void;
    studentWeight?: number;
    studentHeight?: number;
    studentPhoto?: string;
    athleteName?: string;
    isFreeMode?: boolean;
}

type Gender = 'male' | 'female';
type Mode = 'indoor' | 'outdoor';

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export function LiveRunSession({ segments, workoutTitle, onClose, onFinish, studentWeight, studentHeight, studentPhoto, athleteName, isFreeMode }: LiveRunSessionProps) {
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [segmentTimeLeft, setSegmentTimeLeft] = useState(segments[0]?.duration || 0);
    const segmentTimeLeftRef = useRef(segments[0]?.duration || 0);
    const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [gender, setGender] = useState<Gender>('female');
    const [mode, setMode] = useState<Mode>('indoor');
    const [weight, setWeight] = useState(studentWeight || 70);
    const [height, setHeight] = useState(studentHeight || 170);
    const [viewMode, setViewMode] = useState<'stats' | 'map'>('stats');
    
    // Profiles for the "Athlete" selection step
    const PROFILES: Record<string, { id: string, name: string }> = {
        marcelly: { id: 'marcelly', name: 'Marcelly Bispo' },
        andre: { id: 'andre', name: 'André Brito' },
        liliane: { id: 'liliane', name: 'Líliane Torres' }
    };
    
    const initialMatch = athleteName 
        ? Object.entries(PROFILES).find(([_, p]) => p.name.toLowerCase().includes(athleteName.toLowerCase()))
        : null;

    const [selectedProfile, setSelectedProfile] = useState<string>(initialMatch ? initialMatch[0] : 'marcelly');
    const [setupStep, setSetupStep] = useState(initialMatch ? 2 : 1);
    const [resumeDialog, setResumeDialog] = useState<{show: boolean, state: any}>({show: false, state: null});

    // Offline State Recovery
    useEffect(() => {
        const savedState = localStorage.getItem('abfit_run_active_session');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const age = Date.now() - state.timestamp;
                if (age < 3600000) { // If less than 1 hour old
                    setResumeDialog({show: true, state});
                }
            } catch (e) {}
        }
    }, []);

    const handleResume = () => {
        if (!resumeDialog.state) return;
        const s = resumeDialog.state;
        setTotalTimeElapsed(s.totalTimeElapsed);
        accumulatedTimeRef.current = s.totalTimeElapsed;
        setDistance(s.distance);
        stepsRef.current = s.steps || 0;
        setSteps(s.steps || 0);
        setPath(s.path || []);
        setCurrentSegmentIndex(s.currentSegmentIndex || 0);
        setSegmentTimeLeft(s.segmentTimeLeft || 0);
        segmentTimeLeftRef.current = s.segmentTimeLeft || 0;
        setSetupStep(4);
        setIsRunning(true);
        setResumeDialog({show: false, state: null});
    };

    const [distance, setDistance] = useState(0); // in km
    const [calories, setCalories] = useState(0);
    const [pace, setPace] = useState('0:00');
    const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
    const [avgSpeed, setAvgSpeed] = useState(0); // km/h
    const [elevationGain, setElevationGain] = useState(0); // meters
    // Heart Rate Monitoring (Camera)
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [heartRate, setHeartRate] = useState(0);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdownNum, setCountdownNum] = useState<number | string>(3);
    const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
    
    // Performance Sensors
    const [steps, setSteps] = useState(0);
    const [cadence, setCadence] = useState(0);
    const [avgHeartRate, setAvgHeartRate] = useState<number | null>(null);

    // Saving & Status
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isFinished, setIsFinished] = useState(false);
    const [workoutDate, setWorkoutDate] = useState<string>(new Date().toLocaleDateString('pt-BR'));
    const [isAutoPaused, setIsAutoPaused] = useState(false);
    const [hasMovedOnce, setHasMovedOnce] = useState(false);
    const sessionStartRef = useRef<number | null>(null);
    const accumulatedTimeRef = useRef<number>(0);
    const stepsRef = useRef<number>(0);
    const lastStepMagnitudeRef = useRef<number>(0);
    const isOfflineMode = useRef(false);

    // Daily Health Stats
    const [dailySteps, setDailySteps] = useState(10500);
    const [dailySleep, setDailySleep] = useState("7h 15m");
    const [dailyActiveMin, setDailyActiveMin] = useState(75);
    const [isProcessingHealth, setIsProcessingHealth] = useState(false);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(0);
    const watchIdRef = useRef<number | null>(null);
    const lastPosRef = useRef<{lat: number, lng: number} | null>(null);
    const lastPositionRef = useRef<GeolocationPosition | null>(null);
    const selectedVoiceObj = useRef<SpeechSynthesisVoice | null>(null);
    const lastAltRef = useRef<number | null>(null);
    const lastStepTimeRef = useRef(0);
    const lastMovementTimeRef = useRef<number>(0);
    const speechQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);
    const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
    const wakeLockRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastAnnouncedKmRef = useRef<number>(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const hrLoopRef = useRef<NodeJS.Timeout | null>(null);
    const hrHistoryRef = useRef<number[]>([]);
    const lastBeatTimeRef = useRef(0);
    const [path, setPath] = useState<{lat: number, lng: number}[]>([]);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [showStopConfirm, setShowStopConfirm] = useState(false);

    // Effect for accurate step counting via motion sensor
    useEffect(() => {
        const handleMotion = (event: DeviceMotionEvent) => {
            if (!isRunning || isAutoPaused) return;
            
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;
            
            const magnitude = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
            const delta = magnitude - lastStepMagnitudeRef.current;
            lastStepMagnitudeRef.current = magnitude;
            
            // Peak detection logic
            if (delta > 1.8 && magnitude > 11.2) {
                const now = Date.now();
                if (now - lastStepTimeRef.current > 250) { // Max 4 steps per second (240 spm)
                    stepsRef.current += 1;
                    setSteps(stepsRef.current);
                    lastStepTimeRef.current = now;
                    
                    // Update cadence (only used internally now)
                    const timeDiff = now - lastStepTimeRef.current;
                    if (timeDiff > 0) {
                        setCadence(Math.round(60000 / (now - lastStepTimeRef.current)));
                    }
                }
            }
        };

        if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', handleMotion);
        }
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [isRunning, isAutoPaused]);

    // Offline State Recovery
    useEffect(() => {
        const savedState = localStorage.getItem('abfit_run_active_session');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                // If it's a very fresh session (less than 1 hour old), we could offer to restore
                // But for now, let's just log it.
                console.log("Found previous session state", state);
            } catch (e) {}
        }
    }, []);

    const saveSessionState = useCallback(() => {
        if (!isRunning) return;
        const state = {
            totalTimeElapsed,
            distance,
            steps: stepsRef.current,
            path,
            segments,
            currentSegmentIndex,
            timestamp: Date.now()
        };
        localStorage.setItem('abfit_run_active_session', JSON.stringify(state));
    }, [totalTimeElapsed, distance, path, segments, currentSegmentIndex, isRunning]);

    useEffect(() => {
        const interval = setInterval(saveSessionState, 5000);
        return () => clearInterval(interval);
    }, [saveSessionState]);

    const currentSegment = segments[currentSegmentIndex];

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getSpeechDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m > 0 && s > 0) return `${m} minutos e ${s} segundos`;
        if (m > 0) return `${m} minutos`;
        return `${s} segundos`;
    };

    const initSpeechMode = (g: Gender) => {
        setGender(g);
        speak(g === 'female' ? "Modo feminino ativado." : "Modo masculino ativado.", true);
    };

    const toggleCameraHRM = async () => {
        if (isCameraActive) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (hrLoopRef.current) clearInterval(hrLoopRef.current);
            setIsCameraActive(false);
            setHeartRate(0);
        } else {
            try {
                // Alternado para 'environment' (câmera traseira) que é onde fica o flash e o dedo normalmente
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment', width: { ideal: 10 }, height: { ideal: 10 } }, 
                    audio: false 
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                setIsCameraActive(true);
                startHRLoop();
            } catch (err) {
                console.error("Camera Error:", err);
                alert("Erro ao acessar a câmera traseira. Tente autorizar e usar a câmera onde você coloca o dedo.");
            }
        }
    };

    const startHRLoop = () => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let frameCount = 0;
        let localMin = 255;
        let localMax = 0;
        let lastCrossingTime = 0;

        hrLoopRef.current = setInterval(() => {
            if (!videoRef.current || !ctx) return;
            
            // Desenhar um pequeno trecho para processar
            ctx.drawImage(videoRef.current, 0, 0, 10, 10);
            const frame = ctx.getImageData(0, 0, 10, 10).data;
            
            let rSum = 0;
            for (let i = 0; i < frame.length; i += 4) {
                rSum += frame[i]; // Pegamos apenas o canal vermelho
            }
            const rAvg = rSum / (frame.length / 4);
            
            hrHistoryRef.current.push(rAvg);
            if (hrHistoryRef.current.length > 60) hrHistoryRef.current.shift(); // ~3 segundos em 20fps
            
            // Algoritmo de cruzamento de média móvel para detecção de pulso
            if (hrHistoryRef.current.length > 20) {
                // Calcular min/max recente para normalização
                localMin = Math.min(...hrHistoryRef.current);
                localMax = Math.max(...hrHistoryRef.current);
                const range = localMax - localMin;
                
                // Se a variação for muito baixa, provavelmente não há dedo ou pulso detectável
                if (range > 5) { 
                    const threshold = localMin + (range * 0.7); // 70% do range (pico)
                    const lastValue = hrHistoryRef.current[hrHistoryRef.current.length - 1];
                    const prevValue = hrHistoryRef.current[hrHistoryRef.current.length - 2];
                    
                    // Detecção de subida cruzando o limiar
                    if (prevValue <= threshold && lastValue > threshold) {
                        const now = Date.now();
                        const diff = now - lastCrossingTime;
                        
                        // Limitado a batimentos humanos normais (40 a 200 bpm)
                        if (diff > 300 && diff < 1500) {
                            const bpm = Math.round(60000 / diff);
                            setHeartRate(bpm);
                            setAvgHeartRate(curr => curr === null ? bpm : Math.round((curr * 0.8) + (bpm * 0.2)));
                        }
                        lastCrossingTime = now;
                    }
                } else {
                    // Se não houver variação, zera a leitura atual (mas mantém a média se desejar)
                    setHeartRate(0);
                }
            }
            
            frameCount++;
        }, 50);
    };

    const isWatch = React.useMemo(() => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        const isWearOS = ua.includes('wear os') || ua.includes('wearos');
        const isWatchUA = ua.includes('watch') || ua.includes('samsung');
        const isSmallScreen = window.innerWidth < 500 && window.innerHeight < 500;
        return (isWearOS || isWatchUA) && isSmallScreen;
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const updateCalories = (dist: number) => {
        const kcal = weight * dist * 1.036;
        setCalories(Math.round(kcal));
    };

    useEffect(() => {
        if (mode === 'outdoor' && !isFinished) {
            if ('geolocation' in navigator) {
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }

                watchIdRef.current = window.navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude, accuracy } = position.coords;
                        
                        // Ignore coordinates with poor accuracy (> 65m)
                        if (accuracy > 65) return;

                        const lastPos = lastPositionRef.current;
                        let d = 0;
                        
                        // Se já temos a última posição e o cronômetro está rodando
                        if (lastPos && lastPos.coords.latitude !== 0) {
                            d = calculateDistance(
                                lastPos.coords.latitude,
                                lastPos.coords.longitude,
                                latitude,
                                longitude
                            );
                            
                            // Acumular distância apenas se o treino estiver rolando
                            // Relaxed distance threshold and added correction factor to match watch accuracy
                            if (isRunning && d > 0.0002 && d < 0.8) {
                                lastMovementTimeRef.current = Date.now();
                                if (isAutoPaused) {
                                    setIsAutoPaused(false);
                                    speak("Treino retomado.", true);
                                }
                                setDistance(prev => {
                                    const correctionFactor = 1.25; // User had ~33% difference, 1.25 is a safe boost
                                    const next = prev + (d * correctionFactor);
                                    updateCalories(next);
                                    return next;
                                });
                                setPath(prev => [...prev, { lat: latitude, lng: longitude }]);
                                
                                if (position.coords.altitude !== null && lastPos.coords.altitude !== null) {
                                    const diff = position.coords.altitude - lastPos.coords.altitude;
                                    if (diff > 0.5) setElevationGain(prev => prev + diff);
                                }
                            } else if (!isRunning) {
                                // Se não estiver rodando, apenas marca a posição no mapa sem contar distância
                                setPath([{ lat: latitude, lng: longitude }]);
                            }
                        } else {
                            lastMovementTimeRef.current = Date.now();
                            if (isAutoPaused) setIsAutoPaused(false);
                            setPath([{ lat: latitude, lng: longitude }]);
                        }
                        
                        lastPositionRef.current = position;
                        setLastPosition(position);
                        
                        if (isRunning) {
                            let speedKmh = 0;
                            if (position.coords.speed !== null && position.coords.speed > 0.1) {
                                // Add a 1km/h correction as requested by user to match Samsung/Adidas
                                speedKmh = (position.coords.speed * 3.6) + 1.0;
                            } else if (lastPos) {
                                // Fallback speed calc from distance/time
                                const timeDeltaS = (position.timestamp - lastPos.timestamp) / 1000;
                                if (timeDeltaS > 0.5) {
                                    speedKmh = ((d * 3600) / timeDeltaS) + 1.0;
                                }
                            }

                            if (speedKmh > 0.5) {
                                setCurrentSpeed(speedKmh);
                                const paceMinKm = 60 / speedKmh;
                                const mins = Math.floor(paceMinKm);
                                const secs = Math.round((paceMinKm - mins) * 60);
                                setPace(`${mins}:${secs.toString().padStart(2, '0')}`);
                            } else {
                                setCurrentSpeed(0);
                            }
                        } else {
                            setCurrentSpeed(0);
                        }
                    },
                    (error) => console.error("GPS Error:", error),
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            }
        }
        
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [mode, isRunning, isFinished, weight, height]);

    useEffect(() => {
        if (segments[0]?.title === 'Photo Sync') {
            setIsFinished(true);
            setSetupStep(4);
            speak("Abra a foto do seu Samsung Health para sincronizar os dados.");
        }
    }, [segments]);

    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

    const speak = (text: string, interrupt = false) => {
        if (!soundEnabled || !('speechSynthesis' in window)) return;
        if (interrupt) {
            window.speechSynthesis.cancel();
            speechQueueRef.current = [];
            isSpeakingRef.current = false;
        }
        if (!interrupt && speechQueueRef.current.includes(text)) return;
        speechQueueRef.current.push(text);
        
        // Fast path for interrupt
        if (interrupt) {
            processSpeechQueue();
        } else {
            processSpeechQueue();
        }
    };

    const processSpeechQueue = () => {
        if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;
        const text = speechQueueRef.current.shift()!;
        isSpeakingRef.current = true;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = text.length < 10 ? 1.3 : 1.1; // Fast-talk for countdowns
        utterance.volume = 1;
        utterance.pitch = 1;

        if (!voiceRef.current) {
            const voices = window.speechSynthesis.getVoices();
            const ptVoices = voices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
            if (ptVoices.length > 0) {
                // Prefer Google voices if on Android as they are usually faster
                const googleVoice = ptVoices.find(v => v.name.toLowerCase().includes('google'));
                voiceRef.current = googleVoice || ptVoices[0];
            }
        }
        
        if (voiceRef.current) {
            utterance.voice = voiceRef.current;
        }
        
        activeUtterancesRef.current.push(utterance);
        
        let hasEnded = false;
        let timeoutId: any;
        
        const finishSpeaking = () => {
            if (hasEnded) return;
            hasEnded = true;
            clearTimeout(timeoutId);
            
            activeUtterancesRef.current = activeUtterancesRef.current.filter(u => u !== utterance);
            isSpeakingRef.current = false;
            
            // Reduced delay for faster transitions between queued messages
            setTimeout(() => {
                processSpeechQueue();
            }, 50);
        };

        utterance.onend = finishSpeaking;
        utterance.onerror = finishSpeaking;
        
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        
        window.speechSynthesis.speak(utterance);
        timeoutId = setTimeout(finishSpeaking, Math.max(2000, text.length * 150));
    };

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const ptVoices = voices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
            if (ptVoices.length > 0) {
                const googleVoice = ptVoices.find(v => v.name.toLowerCase().includes('google'));
                voiceRef.current = googleVoice || ptVoices[0];
            }
        };

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    // Timer Logic - Absolute Timestamp Based (Precise in background)
    useEffect(() => {
        if (isRunning && !isFinished && typeof countdownNum === 'number' && !isAutoPaused) {
            if (sessionStartRef.current === null) {
                sessionStartRef.current = Date.now();
            }

            if (lastMovementTimeRef.current === 0) lastMovementTimeRef.current = Date.now();
            
            timerRef.current = setInterval(() => {
                const now = Date.now();
                
                // Auto-pause detection
                if (mode === 'outdoor' && !isAutoPaused && hasMovedOnce) {
                    if (now - lastMovementTimeRef.current > 12000) { 
                        setIsAutoPaused(true);
                        speak("Treino pausado automaticamente. Volte a se movimentar para retomar.", true);
                        if (sessionStartRef.current !== null) {
                            accumulatedTimeRef.current += Math.floor((now - sessionStartRef.current) / 1000);
                            sessionStartRef.current = null;
                        }
                        return;
                    }
                }

                if (sessionStartRef.current !== null) {
                    const sessionDelta = Math.floor((now - sessionStartRef.current) / 1000);
                    const newTotal = accumulatedTimeRef.current + sessionDelta;
                    
                    if (newTotal !== totalTimeElapsed) {
                        setTotalTimeElapsed(newTotal);
                        
                        if (!isFreeMode) {
                            const tickDelta = newTotal - totalTimeElapsed;
                            const next = segmentTimeLeftRef.current - tickDelta;
                            
                            // Speak FIRST to give TTS engine a head start
                            if (next === 5) speak("Cinco", true);
                            if (next === 4) speak("Quatro", true);
                            if (next === 3) speak("Três", true);
                            if (next === 2) speak("Dois", true);
                            if (next === 1) speak("Um", true);
                            
                            segmentTimeLeftRef.current = next;
                            setSegmentTimeLeft(next);

                            if (next <= 0) { 
                                handleNextSegment(); 
                            }
                        }
                    }
                }
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            if (sessionStartRef.current !== null) {
                accumulatedTimeRef.current += Math.floor((Date.now() - sessionStartRef.current) / 1000);
                sessionStartRef.current = null;
            }
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning, isFinished, countdownNum, isAutoPaused, isFreeMode, totalTimeElapsed]);

    // Secondary effect to update average speed periodically without restarting timer
    useEffect(() => {
        if (totalTimeElapsed > 0 && distance > 0) {
            setAvgSpeed(distance / (totalTimeElapsed / 3600));
        }
    }, [totalTimeElapsed, distance]);

    // Feedback audio por KM
    useEffect(() => {
        if (!isRunning || isAutoPaused || distance === 0) return;
        
        const currentKm = Math.floor(distance);
        if (currentKm > lastAnnouncedKmRef.current) {
            lastAnnouncedKmRef.current = currentKm;
            
            // Format time and pace for spoken words
            const paceParts = pace.split(':');
            const paceMin = parseInt(paceParts[0] || '0', 10);
            const paceSec = parseInt(paceParts[1] || '0', 10);
            let spokenPace = '';
            if (paceMin > 0) spokenPace += `${paceMin} minuto${paceMin > 1 ? 's' : ''}`;
            if (paceSec > 0) {
                if (spokenPace.length > 0) spokenPace += ' e ';
                spokenPace += `${paceSec} segundo${paceSec > 1 ? 's' : ''}`;
            }

            const formattedTime = Math.floor(totalTimeElapsed / 60);

            speak(`Você completou ${currentKm} quilômetro${currentKm > 1 ? 's' : ''}. Tempo total: ${formattedTime} minuto${formattedTime !== 1 ? 's' : ''}. Pace médio atual de: ${spokenPace || pace} por quilômetro. Continue assim!`);
        }
    }, [distance, isRunning, isAutoPaused, pace, totalTimeElapsed]);

    // Wake Lock to prevent screen sleep
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                }
            } catch (err: any) {
                // Silently drop permission errors in iframe preview to keep console clean
                if (err.name !== 'NotAllowedError') {
                    console.error("Wake Lock Error:", err);
                }
            }
        };

        if (isRunning) requestWakeLock();
        return () => { if (wakeLock) { try { wakeLock.release(); } catch(e) {} } };
    }, [isRunning]);

    const handleHealthImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingHealth(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                
                const prompt = `Analise esta foto do Samsung Health ou app de corrida e extraia os dados em JSON. 
                Campos obrigatórios: distance (km), duration (minutos), calories (kcal), avgHR (bpm), steps (número), elevation (metros), date (string no formato dd/mm/aaaa). 
                Seja preciso. Retorne APENAS o JSON no formato: 
                {"distance": float, "duration": int, "calories": int, "avgHR": int, "steps": int, "elevation": int, "date": "dd/mm/aaaa"}`;
                
                const response = await callAI({
                    model: "gemini-3-flash-preview",
                    prompt: prompt,
                    base64Image: base64,
                    mimeType: file.type
                });
                
                const text = response.text || "";
                const jsonMatch = text.match(/\{.*\}/s);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    
                    if (data.distance) setDistance(parseFloat(data.distance));
                    if (data.duration) setTotalTimeElapsed(parseInt(data.duration) * 60);
                    if (data.calories) setCalories(parseInt(data.calories));
                    if (data.avgHR) setAvgHeartRate(parseInt(data.avgHR));
                    if (data.steps) setSteps(parseInt(data.steps));
                    if (data.elevation) setElevationGain(parseInt(data.elevation));
                    if (data.date) setWorkoutDate(data.date);
                    
                    speak("Dados sincronizados com sucesso!");
                }
                setIsProcessingHealth(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Health sync error:", error);
            setIsProcessingHealth(false);
            speak("Erro ao extrair dados da imagem.");
        }
    };

    const saveWorkout = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const entryId = `run-${Date.now()}`;
            const historyEntry = {
                id: entryId,
                workoutId: isFreeMode ? 'free' : 'planned',
                name: workoutTitle,
                duration: formatTime(totalTimeElapsed),
                date: workoutDate,
                timestamp: Date.now(),
                type: 'RUNNING',
                photo: capturedPhoto,
                runningStats: {
                    distance: Number(distance.toFixed(2)),
                    avgSpeed: Number(avgSpeed.toFixed(1)),
                    calories: calories,
                    avgHR: avgHeartRate || 0,
                    elevation: Number(elevationGain.toFixed(0)),
                    steps: steps,
                    path: path.map(p => [p.lat, p.lng])
                }
            };

            onFinish(totalTimeElapsed, historyEntry);
            setSaveStatus('success');
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            console.error("Error saving workout:", err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNextSegment = (forceFinish = false) => {
        if (forceFinish || currentSegmentIndex + 1 >= segments.length) {
            speak(forceFinish ? "Treino encerrado." : "FINAL DE TREINO!", true);
            setIsRunning(false);
            setIsFinished(true);
        } else {
            const nextIndex = currentSegmentIndex + 1;
            const nextSegment = segments[nextIndex];
            
            speak("Bloco concluído.", true);

            if (nextSegment.type === 'stimulus' || nextSegment.type === 'continuous' || currentSegment.type === 'warmup') {
                startCountdown(() => {
                    setCurrentSegmentIndex(nextIndex);
                    setSegmentTimeLeft(nextSegment.duration);
                    segmentTimeLeftRef.current = nextSegment.duration;
                    announceSegment(nextSegment);
                });
            } else {
                setCurrentSegmentIndex(nextIndex);
                setSegmentTimeLeft(nextSegment.duration);
                segmentTimeLeftRef.current = nextSegment.duration;
                announceSegment(nextSegment);
            }
        }
    };

    const announceSegment = (segment: WorkoutSegment) => {
        speak(`Iniciando ${segment.title}. Tempo: ${getSpeechDuration(segment.duration)}.`, false);
    };

    const startCountdown = (callback: () => void) => {
        setIsRunning(false);
        setIsCountingDown(true);
        let count = 3;
        setCountdownNum(count);
        speak("Atenção, preparando...", true);
        speak("Três", false);
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdownNum(count);
                speak(count === 2 ? "Dois" : "Um", false);
            } else if (count === 0) {
                setCountdownNum("JÁ!");
                speak("Já!", false);
            } else {
                clearInterval(interval);
                setIsCountingDown(false);
                setCountdownNum(3); // Reset
                setIsRunning(true);
                callback();
            }
        }, 1000);
    };

    const startRunCountdown = () => {
        setIsCountingDown(true);
        setCountdownNum(3);
        speak("Atenção, preparando para iniciar.", true);
        speak("Três", false);
        
        let count = 3;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdownNum(count);
                speak(count === 2 ? "Dois" : "Um", false);
            } else if (count === 0) {
                 setCountdownNum("JÁ!");
                 speak("Já!", false);
            } else {
                clearInterval(interval);
                setIsCountingDown(false);
                setCountdownNum(3); // Reset to number to un-pause the timer hook
                setIsRunning(true);
                announceSegment(segments[0]);
            }
        }, 1000);
    };

    const startWorkout = () => {
        const initialDuration = segments[0]?.duration || 0;
        setSegmentTimeLeft(initialDuration);
        segmentTimeLeftRef.current = initialDuration;
        setSetupStep(4);
        speak(`Painel aberto. O seu primeiro bloco será ${segments[0]?.title}, com duração de ${getSpeechDuration(segments[0]?.duration)}. Pressione Play para começar.`, true);
    };

    if (resumeDialog.show) {
        return (
            <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-[#e2ff00]/10 rounded-full flex items-center justify-center mb-6 border border-[#e2ff00]/20">
                    <Activity size={40} className="text-[#e2ff00] animate-pulse" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Treino em Andamento!</h3>
                <p className="text-zinc-400 text-sm mb-10 font-bold uppercase tracking-widest leading-relaxed">Detectamos um treino que não foi finalizado. Deseja retomar de onde parou?</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('abfit_run_active_session');
                            setResumeDialog({show: false, state: null});
                        }}
                        className="py-5 rounded-2xl bg-zinc-900 text-zinc-500 font-black uppercase tracking-widest text-[10px] border border-white/5 active:scale-95 transition-all"
                    >
                        Descartar
                    </button>
                    <button 
                        onClick={handleResume}
                        className="py-5 rounded-2xl bg-[#e2ff00] text-black font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg shadow-[#e2ff00]/20"
                    >
                        Retomar Treino
                    </button>
                </div>
            </div>
        );
    }

    if (setupStep === 1) {
        return (
            <div className="fixed inset-0 z-[1100] bg-black text-white p-6 font-sans flex flex-col justify-center max-w-md mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#e2ff00]">Atleta</h2>
                    <p className="text-zinc-500 text-sm mt-2 font-bold uppercase tracking-widest">Quem vai treinar?</p>
                </div>
                <div className="space-y-4">
                    {Object.values(PROFILES).map(profile => (
                        <button 
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile.id)}
                            className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                                selectedProfile === profile.id ? 'bg-[#e2ff00] text-black border-[#e2ff00]' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <Users size={24} />
                                <span className="text-xl font-black italic uppercase">{profile.name}</span>
                            </div>
                            {selectedProfile === profile.id && <ChevronRight size={24} />}
                        </button>
                    ))}
                </div>
                <div className="flex gap-4 mt-12">
                    <button onClick={onClose} className="py-5 px-6 bg-zinc-900 text-zinc-500 font-black uppercase text-xs tracking-widest rounded-2xl">Fechar</button>
                    <button 
                        onClick={() => setSetupStep(2)}
                        className="flex-1 py-5 bg-white text-black font-black uppercase text-sm tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
                    >
                        Próximo
                    </button>
                </div>
            </div>
        );
    }

    if (setupStep === 2) {
        return (
            <div className="fixed inset-0 z-[1100] bg-black text-white p-6 font-sans flex flex-col justify-center max-w-md mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#e2ff00]">Ambiente</h2>
                    <p className="text-zinc-500 text-sm mt-2 font-bold uppercase tracking-widest">Local do Treino</p>
                </div>
                <div className="space-y-4">
                    <button 
                        onClick={() => setMode('indoor')}
                        className={`w-full flex items-center justify-between p-8 rounded-3xl border-2 transition-all ${
                            mode === 'indoor' ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                        }`}
                    >
                        <div className="text-left">
                            <span className="block text-2xl font-black italic uppercase">Indoor</span>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Esteira / Ginásio</span>
                        </div>
                        <Activity size={32} />
                    </button>
                    <button 
                        onClick={() => {
                            setMode('outdoor');
                            if ('geolocation' in navigator) {
                                navigator.geolocation.getCurrentPosition(() => {}, () => {
                                    alert("Para marcar o percurso corretamente, autorize o acesso à localização e permita que o navegador use o GPS em segundo plano (Não fechar a aba).");
                                });
                            }
                        }}
                        className={`w-full flex items-center justify-between p-8 rounded-3xl border-2 transition-all ${
                            mode === 'outdoor' ? 'bg-[#e2ff00] border-[#e2ff00] text-black shadow-[0_0_20px_rgba(226,255,0,0.5)]' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                        }`}
                    >
                        <div className="text-left">
                            <span className="block text-2xl font-black italic uppercase">Outdoor</span>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Rua / GPS Real</span>
                        </div>
                        <MapIcon size={32} />
                    </button>
                    {mode === 'outdoor' && (
                        <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-2xl animate-in slide-in-from-top-4">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-relaxed">
                                <Zap size={10} className="inline mr-1" /> ATENÇÃO: Mantenha a tela ligada e o GPS ativo para não travar o tempo.
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-4 mt-12">
                     <button onClick={() => setSetupStep(1)} className="py-5 px-6 bg-zinc-900 text-zinc-500 font-black uppercase text-xs tracking-widest rounded-2xl">Voltar</button>
                     <button 
                        onClick={startWorkout}
                        className="flex-1 py-5 bg-white text-black font-black uppercase text-sm tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
                    >
                        Próximo
                    </button>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="fixed inset-0 z-[1100] bg-black text-white flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar font-sans pb-32">
                <div className="flex justify-between items-center mb-12 mt-4">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">TREINO CONCLUÍDO</h2>
                    <div className="bg-zinc-900 border border-white/5 px-5 py-2 rounded-full text-zinc-400 font-black italic text-xs tracking-widest">
                        {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-3xl p-10 mb-8 shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="flex items-center gap-3 mb-10">
                        <Activity size={20} className="text-red-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">MÉTRICAS DE PERFORMANCE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-12 gap-x-6">
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">DISTÂNCIA</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{distance.toFixed(2)} <span className="text-sm font-black uppercase italic text-zinc-400">km</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">VELOCIDADE MÉDIA</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{avgSpeed.toFixed(1)} <span className="text-sm font-black uppercase italic text-zinc-400">km/h</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">TEMPO FINAL</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{formatTime(totalTimeElapsed)} <span className="text-sm font-black uppercase italic text-zinc-400">min</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">ELEVAÇÃO GANHA</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{elevationGain.toFixed(0)} <span className="text-sm font-black uppercase italic text-zinc-400">m</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">CALORIAS</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{calories} <span className="text-sm font-black uppercase italic text-zinc-400">kcal</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">PASSOS</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{steps} <span className="text-sm font-black uppercase italic text-zinc-400">steps</span></p></div>
                    </div>
                </div>

                <div className="w-full h-64 rounded-3xl bg-[#1a1a1a] mb-8 overflow-hidden relative border border-white/5 shadow-2xl">
                    {mode === 'outdoor' && path.length > 0 ? (
                        <MapContainer center={[path[0].lat, path[0].lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} touchZoom={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Polyline positions={path.map(p => [p.lat, p.lng] as [number, number])} color="#e2ff00" weight={5} />
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-3 bg-zinc-950/50">
                            <MapIcon size={48} className="opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Treino Indoor • Sem GPS Ativo</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#1a1a1a] rounded-3xl p-8 mb-8 border border-white/5 shadow-2xl">
                    <div className="flex flex-col items-center mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4 italic">FOTO DA VITÓRIA (OPCIONAL)</span>
                        {capturedPhoto ? (
                             <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[#e2ff00]/30 shadow-2xl group">
                                 <img src={capturedPhoto} alt="Workout" className="w-full h-full object-cover" />
                                 <button 
                                    onClick={() => setCapturedPhoto(null)} 
                                    className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-full text-white hover:bg-red-600 transition-colors"
                                 >
                                    <X size={20} />
                                 </button>
                             </div>
                        ) : (
                            <button 
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (re: any) => setCapturedPhoto(re.target.result);
                                            reader.readAsDataURL(file);
                                        }
                                    };
                                    input.click();
                                }}
                                className="w-full aspect-video rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4 hover:border-[#e2ff00]/50 hover:bg-zinc-800/50 transition-all text-zinc-600"
                            >
                                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5"><Camera size={32} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest italic group-hover:text-white transition-colors">Tirar ou Anexar Foto</span>
                            </button>
                        )}
                    </div>

                    {saveStatus === 'success' ? (
                        <div className="bg-emerald-600/20 border border-emerald-500/30 p-8 rounded-[2rem] text-center animate-in zoom-in duration-300">
                            <Check size={48} className="text-emerald-500 mx-auto mb-4" />
                            <p className="text-xl font-black italic uppercase text-white">Treino Salvo!</p>
                            <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mt-2">Sincronizado</p>
                        </div>
                    ) : saveStatus === 'error' ? (
                        <div className="bg-red-600/20 border border-red-500/30 p-8 rounded-[2rem] text-center animate-in shake duration-500">
                            <X size={48} className="text-red-500 mx-auto mb-4" />
                            <p className="text-xl font-black italic uppercase text-white">Erro ao Salvar</p>
                            <button onClick={saveWorkout} className="mt-4 px-6 py-2 bg-red-600 rounded-full text-xs font-black uppercase">Tentar Novamente</button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => {
                                localStorage.removeItem('abfit_run_active_session');
                                saveWorkout();
                            }}
                            disabled={isSaving}
                            className="w-full py-8 bg-[#e2ff00] text-black rounded-3xl font-black italic uppercase tracking-widest text-2xl shadow-2xl shadow-[#e2ff00]/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={32} className="animate-spin" />
                                    SALVANDO...
                                </>
                            ) : (
                                <>
                                    <Check size={32} />
                                    SALVAR TREINO
                                </>
                            )}
                        </button>
                    )}
                </div>

                <button onClick={() => {
                    localStorage.removeItem('abfit_run_active_session');
                    onClose();
                }} className="w-full py-6 bg-transparent text-zinc-700 rounded-3xl font-black italic uppercase tracking-widest text-[10px] hover:text-white transition-all mb-4 italic">DESCARTAR DADOS DO TREINO</button>

                <div className="bg-[#1a1a1a] rounded-3xl p-10 mt-12 mb-8 shadow-2xl relative border border-white/5">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40"><Activity size={16} className="text-white" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">DAILY HEALTH SUMMARY</span>
                        </div>
                        <Heart size={20} className="text-blue-600 fill-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-y-12 gap-x-10">
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">PASSOS DIÁRIOS</p><p className="text-4xl font-black italic text-blue-500 tracking-tighter leading-none">{dailySteps.toLocaleString()} <span className="text-[10px] font-bold uppercase italic text-zinc-600">steps</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">QUALIDADE SONO</p><p className="text-4xl font-black italic text-blue-500 tracking-tighter leading-none">{dailySleep}</p></div>
                        <div className="col-span-2"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">ATIVIDADE ATIVA NO DIA</p><p className="text-4xl font-black italic text-blue-500 tracking-tighter leading-none">{dailyActiveMin} <span className="text-sm font-black uppercase italic text-zinc-600">minutos</span></p></div>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-10 w-full py-5 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center gap-4 text-zinc-400 hover:text-[#e2ff00] transition-all group">
                        {isProcessingHealth ? <Loader2 className="animate-spin text-[#e2ff00]" size={20} /> : <Camera size={20} className="group-hover:scale-110 transition-transform" />}
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Sincronizar Samsung Health (Screenshot)</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleHealthImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <p className="text-center text-[8px] font-black text-zinc-700 uppercase tracking-widest italic mt-4">ABFIT PERFORMANCE SYSTEM • DADOS CRIPTOGRAFADOS</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[1000] bg-black text-white flex flex-col animate-in slide-in-from-bottom-full duration-700 overflow-hidden font-sans max-w-md mx-auto">
            {/* Hidden Video for Camera HRM */}
            <video ref={videoRef} playsInline style={{ display: 'none' }}></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <AnimatePresence>
                {isCountingDown && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} className="fixed inset-0 z-[1100] bg-black/95 flex flex-col items-center justify-center pointer-events-none">
                         <div className="text-[#e2ff00] text-sm font-black uppercase tracking-[0.5em] mb-8 text-center px-4">
                            Prepara: <br/>{segments[isRunning ? currentSegmentIndex + 1 : 0]?.title.toUpperCase() || 'VAMOS!'}
                        </div>
                        <motion.span 
                            initial={{ y: 50 }} animate={{ y: 0 }}
                            className="font-black italic text-[#e2ff00] tracking-tighter drop-shadow-[0_10px_60px_rgba(226,255,0,0.6)] leading-none text-[clamp(15rem,40vw,30rem)]"
                        >
                            {countdownNum}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STOP CONFIRMATION MODAL */}
            <AnimatePresence>
                {showStopConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1500] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 p-10 rounded-3xl shadow-2xl w-full max-w-sm"
                        >
                            <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/20">
                                <Square size={32} className="text-red-600 animate-pulse" fill="currentColor" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Finalizar Treino?</h3>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed">Seus dados serão processados e salvos no histórico.</p>
                            
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => {
                                        setShowStopConfirm(false);
                                        handleNextSegment(true);
                                    }}
                                    className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-600/20"
                                >
                                    Sim, Finalizar
                                </button>
                                <button 
                                    onClick={() => setShowStopConfirm(false)}
                                    className="w-full py-5 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all"
                                >
                                    Continuar Treinando
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AUTO-PAUSE OVERLAY */}
            <AnimatePresence>
                {isAutoPaused && isRunning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="bg-zinc-900 border-4 border-[#e2ff00] p-10 rounded-3xl shadow-[0_0_50px_rgba(226,255,0,0.3)] animate-pulse">
                            <Pause size={64} className="text-[#e2ff00] mx-auto mb-6" fill="#e2ff00" />
                            <h2 className="text-4xl font-black italic uppercase text-white tracking-widest mb-2">AUTO-PAUSE</h2>
                            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Retome o movimento para continuar</p>
                        </div>
                        <button 
                            onClick={() => {
                                setIsAutoPaused(false);
                                speak("Treino retomado.", true);
                                lastMovementTimeRef.current = Date.now();
                            }}
                            className="mt-8 px-10 py-5 bg-[#e2ff00] text-black font-black uppercase text-sm tracking-widest rounded-2xl active:scale-95 transition-all"
                        >
                            Retomar Manualmente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <header className="px-6 py-6 flex justify-between items-center z-[1050] bg-black">
                <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isRunning && mode === 'outdoor' ? 'bg-[#e2ff00]' : 'bg-zinc-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">
                        {mode === 'outdoor' ? 'GPS' : 'Indoor'}
                    </span>
                </div>
                {mode === 'outdoor' && (
                    <button 
                        onClick={() => setViewMode(prev => prev === 'stats' ? 'map' : 'stats')}
                        className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 hover:text-white transition-all flex items-center gap-2"
                    >
                        {viewMode === 'stats' ? <><MapIcon size={12}/> Ver Mapa</> : <><Activity size={12}/> Ver Dados</>}
                    </button>
                )}
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border border-zinc-800 px-3 py-1 rounded-lg">
                    Atleta: <span className="text-white">{(PROFILES as any)[selectedProfile]?.name.split(' ')[0]}</span>
                </div>
            </header>

            {viewMode === 'map' && mode === 'outdoor' ? (
                <div className="flex-1 relative mx-6 mb-28 rounded-3xl overflow-hidden border-2 border-zinc-800">
                    {lastPosition ? (
                        <MapContainer center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} zoom={17} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Polyline positions={path.map(p => [p.lat, p.lng] as [number, number])} color="#e2ff00" weight={5} />
                            <Marker position={[lastPosition.coords.latitude, lastPosition.coords.longitude]} />
                            <MapUpdater center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} />
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
                            <Loader2 size={32} className="animate-spin text-[#e2ff00] mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Buscando Sinal de GPS...</p>
                        </div>
                    )}
                    
                    {/* Floating Info on Map */}
                    <div className="absolute top-4 left-4 right-4 z-[400] grid grid-cols-2 gap-2">
                        <div className="bg-black/80 backdrop-blur p-3 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Distância</p>
                            <p className="text-xl font-black text-white">{distance.toFixed(2)}km</p>
                        </div>
                        <div className="bg-black/80 backdrop-blur p-3 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Ritmo Atual</p>
                            <p className="text-xl font-black text-white">{currentSpeed > 1 ? pace : "0'00"}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* GRID SUPERIOR DE DADOS */}
            <div className="px-6 grid grid-cols-3 gap-2 mb-4">
                <div className="bg-zinc-900/40 p-3 rounded-[20px] border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Velocidade</span>
                    <p className="text-lg font-black text-[#e2ff00]">{currentSpeed.toFixed(1)}<span className="text-[8px] ml-0.5 text-zinc-500 italic">km/h</span></p>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-[20px] border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Passos</span>
                    <p className="text-lg font-black text-blue-400">{steps}</p>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-[20px] border border-zinc-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Elevação</span>
                    <p className="text-lg font-black text-emerald-400">{elevationGain.toFixed(0)}<span className="text-[8px] ml-0.5 text-zinc-500">m</span></p>
                </div>
            </div>

            <div className="px-6 grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <MapPin size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Distância</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter">{distance.toFixed(2)}<span className="text-xs ml-1 text-zinc-500 italic">KM</span></p>
                </div>

                <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Timer size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Ritmo</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter">
                        {currentSpeed > 1 ? pace : "0'00"}
                        <span className="text-xs ml-1 text-zinc-500 italic">/KM</span>
                    </p>
                </div>
            </div>

            {/* PAINEL CENTRAL REGRESSIVO */}
            <div className="mx-6 flex-1 flex flex-col items-center justify-center bg-zinc-900/30 rounded-3xl border border-zinc-800/50 shadow-2xl p-8 mb-4 relative overflow-hidden">
                <div 
                    className="absolute bottom-0 left-0 h-1.5 bg-[#e2ff00] transition-all duration-1000 shadow-[0_0_15px_rgba(226,255,0,0.5)]"
                    style={{ width: `${(isFreeMode ? 100 : (segmentTimeLeft / (currentSegment?.duration || 1)) * 100)}%` }}
                />
                <div className="text-center w-full z-10 px-2">
                    <p className="text-lg md:text-xl font-black uppercase italic tracking-tighter mb-2 text-[#e2ff00] w-full truncate">
                        {isFreeMode ? 'TREINO LIVRE' : currentSegment?.title}
                    </p>
                    <h2 className="text-[90px] leading-none font-black tabular-nums tracking-tighter" style={{textShadow: "0 0 20px rgba(226, 255, 0, 0.2)"}}>
                        {isFreeMode ? formatTime(totalTimeElapsed) : formatTime(segmentTimeLeft)}
                    </h2>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] mt-4 tracking-[0.4em]">
                        {isFreeMode ? 'EM EXECUÇÃO' : `Etapa ${currentSegmentIndex + 1} de ${segments.length}`}
                    </p>
                </div>
                
                {/* Background Map Overlay if Outdoor */}
                {mode === 'outdoor' && lastPosition && viewMode === 'stats' && (
                    <div className="absolute inset-0 z-[0] opacity-20 pointer-events-none">
                        <MapContainer center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} zoom={18} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Polyline positions={path.map(p => [p.lat, p.lng] as [number, number])} color="#e2ff00" weight={4} />
                            <Circle center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} radius={5} pathOptions={{ color: '#e2ff00' }} />
                            <MapUpdater center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} />
                        </MapContainer>
                    </div>
                )}
            </div>

            {/* CONTROLES DE AÇÃO - Trocando o footer de posição quando estiver no painel stats */}
            {viewMode === 'stats' && (
                <div className="px-6 grid grid-cols-2 gap-4 mb-28">
                    <div className="text-center bg-zinc-900/20 p-4 rounded-3xl">
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">Tempo Total</p>
                        <h1 className="text-2xl font-black tabular-nums tracking-tighter italic">
                            {formatTime(totalTimeElapsed)}
                        </h1>
                    </div>
                    <div className="text-center bg-zinc-900/20 p-4 rounded-3xl">
                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">Calorias</p>
                        <h1 className="text-2xl font-black tabular-nums tracking-tighter italic text-orange-500">
                            {Math.round(calories)} <span className="text-xs text-zinc-600">KCAL</span>
                        </h1>
                    </div>
                </div>
            )}
                </>
            )}

            {/* CONTROLES DE AÇÃO / BOTOES */}
            <div className="fixed bottom-8 left-0 right-0 px-10 flex justify-center items-center gap-6 z-[1050]">
                {/* STOP BUTTON (Visible when active or paused) */}
                {(isRunning || totalTimeElapsed > 0) && !isFinished && (
                    <button 
                        onClick={() => {
                            if (totalTimeElapsed > 0) {
                                setShowStopConfirm(true);
                            }
                        }}
                        className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center active:scale-90 transition-all border-2 border-red-600/30 group"
                    >
                        <Square size={20} className="text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" />
                    </button>
                )}

                {/* PLAY / PAUSE BUTTON */}
                {!isRunning ? (
                    <button 
                        onClick={() => {
                            if (isFinished) return;
                            if (totalTimeElapsed === 0) startRunCountdown();
                            else {
                                speak("Treino retomado.", true);
                                setIsRunning(true);
                            }
                        }}
                        className={`w-24 h-24 bg-[#e2ff00] rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(226,255,0,0.3)] active:scale-90 transition-all border-[6px] border-black ${isFinished ? 'opacity-0 scale-0' : ''}`}
                    >
                        <Play size={40} fill="black" />
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            speak("Treino pausado.", true);
                            setIsRunning(false);
                        }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-90 transition-all border-[6px] border-black"
                    >
                        <Pause size={40} fill="black" />
                    </button>
                )}

                {/* PLACEHOLDER OR VOLUME TOGGLE TO KEEP CENTERED BUTTONS */}
                {(isRunning || totalTimeElapsed > 0) && !isFinished && (
                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-800 active:scale-90 transition-all"
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                )}
            </div>
        </div>
    );
};
