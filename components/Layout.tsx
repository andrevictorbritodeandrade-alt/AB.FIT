
import React, { useState, useEffect } from 'react';
import { 
  CloudRain, Sun, RefreshCw, Bell, Dumbbell, Wifi, WifiOff, 
  Mail, Phone, Loader2, MapPin, MessageCircle, Menu, X, 
  LayoutGrid, Bot, Settings2, User, Layout, Brain, Ruler, 
  Footprints, BarChart3, Info, Cloud, Thermometer, Droplets, AlertTriangle
} from 'lucide-react';
import { AppNotification } from '../types';

export const RUNNING_IMAGES = [
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2070&auto=format&fit=crop'
];

export const FITNESS_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop'
];

export function BackgroundCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black">
      {images.map((img, idx) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={img}
            alt="Background"
            className="w-full h-full object-cover opacity-40 blur-[6px] brightness-50 grayscale contrast-125"
            referrerPolicy="no-referrer"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 mix-blend-multiply" />
    </div>
  );
}

export function HeaderTitle({ text }: { text: string }) {
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  
  if (words.length === 1) {
    const word = words[0];
    if (word.length <= 2) return <span className="text-red-600 uppercase italic tracking-tighter">{word}</span>;
    const splitIndex = word.length > 3 ? word.length - 3 : word.length - 2;
    return (
      <span className="tracking-tighter uppercase italic text-foreground">
        {word.substring(0, splitIndex)}
        <span className="text-red-600">{word.substring(splitIndex)}</span>
      </span>
    );
  }
  
  const lastWord = words.pop();
  return (
    <span className="tracking-tighter uppercase italic text-foreground">
      {words.join(' ')} <span className="text-red-600">{lastWord}</span>
    </span>
  );
}

export function Logo({ size = "text-4xl", subSize = "text-xs", collapsed = false }: { size?: string, subSize?: string, collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="p-2 bg-card rounded-xl border border-border shadow-2xl flex items-center justify-center">
        <span className="text-red-600 font-black italic text-xs transform -skew-x-12">AB</span>
      </div>
    );
  }
  return (
    <div className="text-center group select-none flex flex-col items-center justify-center w-full overflow-hidden px-2">
      <h1 className={`${size} font-black italic mb-0 transform -skew-x-12 tracking-tighter transition-all text-foreground uppercase leading-[0.9] px-1`} style={{ textShadow: '1px 1px 0px currentColor, -1px -1px 0px currentColor, 1px -1px 0px currentColor, -1px 1px 0px currentColor' }}>
        AB<span className="text-red-600">FIT</span>
      </h1>
      <p className={`${subSize} text-muted-foreground tracking-tight sm:tracking-[0.25em] uppercase font-bold leading-none mt-3 sm:mt-4 opacity-80 whitespace-nowrap overflow-hidden text-ellipsis w-full`}>Assessoria em Treinamentos Físicos</p>
    </div>
  );
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

export function SideNav({ 
  isOpen, 
  onClose, 
  activeView, 
  onNavigate,
  isProfessor = false,
  userPhoto = null
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  activeView: string, 
  onNavigate: (view: string) => void,
  isProfessor?: boolean,
  userPhoto?: string | null
}) {
  // Mapeamento de cores idêntico ao Dashboard em App.tsx
  const studentItems: NavItem[] = [
    { id: 'DASHBOARD', label: 'Home Dashboard', icon: LayoutGrid, color: 'zinc' },
    { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
    { id: 'RUNTRACK_STUDENT', label: 'ABFIT RUN', icon: Footprints, color: 'rose' },
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização', icon: Brain, color: 'indigo' },
    { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
    { id: 'CORRE_RJ', label: 'Corre RJ 2026', icon: MapPin, color: 'yellow' },
    { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
    { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3, color: 'blue' },
    { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' },
    { id: 'SETTINGS', label: 'Configurações', icon: Settings2, color: 'zinc' },
  ];

  const professorItems: NavItem[] = [
    { id: 'PROFESSOR_DASH', label: 'Gestão de Alunos', icon: LayoutGrid, color: 'zinc' },
    { id: 'COACH_AI', label: 'Assistente IA', icon: Bot, color: 'red' },
    { id: 'SETTINGS', label: 'Configurações', icon: Settings2, color: 'zinc' },
  ];

  const items = isProfessor ? professorItems : studentItems;

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-muted-foreground hover:text-foreground hover:bg-secondary/50';
    
    switch(color) {
      case 'red': return 'bg-red-600/10 text-foreground';
      case 'orange': return 'bg-orange-600/10 text-foreground';
      case 'indigo': return 'bg-indigo-600/10 text-foreground';
      case 'emerald': return 'bg-emerald-600/10 text-foreground';
      case 'rose': return 'bg-rose-600/10 text-foreground';
      case 'blue': return 'bg-blue-600/10 text-foreground';
      case 'yellow': return 'bg-yellow-600/10 text-foreground';
      default: return 'bg-secondary text-foreground';
    }
  };

  const getIconColor = (color: string, isActive: boolean) => {
    if (!isActive) return 'group-hover:text-foreground transition-colors';
    
    switch(color) {
      case 'red': return 'text-red-600';
      case 'orange': return 'text-orange-600';
      case 'indigo': return 'text-indigo-600';
      case 'emerald': return 'text-emerald-600';
      case 'rose': return 'text-rose-600';
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-yellow-500';
      default: return 'text-foreground';
    }
  };

  const getIndicatorColor = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]';
      case 'orange': return 'bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)]';
      case 'indigo': return 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.8)]';
      case 'emerald': return 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.8)]';
      case 'rose': return 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)]';
      case 'blue': return 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]';
      case 'yellow': return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]';
      default: return 'bg-foreground shadow-[0_0_15px_rgba(255,255,255,0.4)]';
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[80] bg-background/80 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside 
        className={`fixed top-0 left-0 z-[90] h-screen bg-background border-r border-border transition-transform duration-500 transform w-[280px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <Logo size="text-2xl" subSize="text-[8px]" />
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground bg-card rounded-full border border-border">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl transition-all group relative overflow-hidden text-left ${getColorClasses(item.color, isActive)}`}
                >
                  {isActive && <div className={`absolute left-0 top-0 bottom-0 w-1 ${getIndicatorColor(item.color)}`} />}
                  <item.icon size={18} className={`shrink-0 ${getIconColor(item.color, isActive)}`} />
                  <span className="text-[13px] font-black uppercase italic tracking-widest leading-tight text-left block">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
             <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-inner">
                   {userPhoto ? (
                     <img src={userPhoto} className="w-full h-full object-cover" alt="Profile" />
                   ) : (
                     <User className="text-muted-foreground" size={18} />
                   )}
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase text-foreground italic leading-none mb-1">ABFIT Member</span>
                   <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Status: Ativo</span>
                </div>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Card({ children, className = "", onClick, title, text }: { children?: React.ReactNode, className?: string, onClick?: any, key?: React.Key, title?: string, text?: string }) {
  return (
    <div onClick={onClick} className={`bg-card border border-border rounded-3xl shadow-xl overflow-hidden transition-all relative ${className}`}>
      {children}
    </div>
  );
}

export const GLOBAL_BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526506114642-54cb358634a5?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1920&auto=format&fit=crop"
];

export function BackgroundWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-sans text-left transition-colors">
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop" 
          alt="Gym Background" 
          className="w-full h-full object-cover opacity-40 grayscale blur-[4px] brightness-[0.4] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90" />
      </div>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export function GlobalSyncIndicator({ status }: { status: 'synced' | 'syncing' | 'offline' }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-1000 pointer-events-none select-none flex items-center justify-center">
       {!online || status === 'offline' ? (
         <WifiOff size={24} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
       ) : status === 'syncing' ? (
         <RefreshCw size={24} className="text-orange-500 animate-spin drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
       ) : (
         <div className="relative flex items-center justify-center">
            <Wifi size={24} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-50"></div>
         </div>
       )}
    </div>
  );
}

export function NotificationBadge({ notifications, onClick }: { notifications: AppNotification[], onClick?: () => void }) {
  const unreadCount = notifications.filter(n => !n.read).length;
  if (unreadCount === 0) return null;

  return (
    <button onClick={onClick} className="relative p-2 bg-card border border-border rounded-full text-muted-foreground hover:text-red-600 transition-colors">
      <Bell size={20} />
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] font-black text-white flex items-center justify-center border-2 border-background animate-bounce">
        {unreadCount}
      </span>
    </button>
  );
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  min: number;
  max: number;
  rainProb: number;
  condition: string;
  location: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      // 1. Fetch Weather Data (Open-Meteo)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
      );
      const wData = await weatherRes.json();

      // 2. Fetch Location Name (Reverse Geocoding free)
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
      );
      const gData = await geoRes.json();

      const city = gData.city || gData.locality || "Localização";

      setWeather({
        temp: Math.round(wData.current.temperature_2m),
        feelsLike: Math.round(wData.current.apparent_temperature),
        min: Math.round(wData.daily.temperature_2m_min[0]),
        max: Math.round(wData.daily.temperature_2m_max[0]),
        rainProb: wData.daily.precipitation_probability_max[0],
        condition: getWeatherCondition(wData.current.weather_code),
        location: city
      });
      setError(null);
    } catch (err) {
      console.error("Weather error:", err);
      setError("Erro Clima");
    } finally {
      setLoading(false);
    }
  };

  const getWeatherCondition = (code: number) => {
    if (code === 0) return 'Limpo';
    if (code >= 1 && code <= 3) return 'Nublado';
    if (code >= 45 && code <= 48) return 'Nevoeiro';
    if (code >= 51 && code <= 67) return 'Chuva Fraca';
    if (code >= 71) return 'Chuva Forte'; // Simplificação
    if (code >= 95) return 'Tempestade';
    return 'Variável';
  };

  const getIcon = () => {
    if (!weather) return <Sun size={16} className="text-orange-500" />;
    const cond = weather.condition.toLowerCase();
    if (cond.includes('chuva') || cond.includes('tempestade')) return <CloudRain size={16} className="text-blue-500" />;
    if (cond.includes('nublado') || cond.includes('nevoeiro')) return <Cloud size={16} className="text-muted-foreground" />;
    return <Sun size={16} className="text-orange-500" />;
  };

  useEffect(() => {
    const initWeather = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            console.error("GPS Error", err);
            // Fallback to Rio de Janeiro
            fetchWeather(-22.9068, -43.1729);
          }
        );
      } else {
        // Fallback to Rio de Janeiro
        fetchWeather(-22.9068, -43.1729);
      }
    };

    initWeather();

    // Atualiza a cada 1 hora (3600000 ms)
    const interval = setInterval(initWeather, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-card/40 px-4 py-2 rounded-2xl border border-border backdrop-blur-sm">
        <MapPin className="text-red-600" size={16} />
        <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest">{error}</span>
      </div>
    );
  }

  if (loading || !weather) {
    return (
      <div className="flex items-center gap-3 bg-card/40 px-4 py-2 rounded-2xl border border-border backdrop-blur-sm">
        <Loader2 className="text-muted-foreground animate-spin" size={16} />
        <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-card/40 pl-4 pr-5 py-2.5 rounded-[1.2rem] border border-border backdrop-blur-md shadow-lg group hover:bg-card/60 transition-colors cursor-default">
      {getIcon()}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black text-foreground italic leading-none">{weather.temp}°</span>
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide leading-none">
             Max {weather.max}° • Min {weather.min}°
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
           <MapPin size={8} className="text-red-600" />
           <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest truncate max-w-[100px]">{weather.location}</span>
           <span className="text-[8px] text-muted-foreground">|</span>
           <div className="flex items-center gap-1">
             <Thermometer size={8} className="text-orange-500" />
             <span className="text-[8px] font-bold text-muted-foreground uppercase">Sens {weather.feelsLike}°</span>
           </div>
           {weather.rainProb > 0 && (
             <div className="flex items-center gap-1 ml-1">
                <Droplets size={8} className="text-blue-500" />
                <span className="text-[8px] font-bold text-blue-400 uppercase">{weather.rainProb}%</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

export function AppFooter() {
  const coachEmail = "andrevictorbritodeandrade@gmail.com";
  const coachPhone = "5521994527694";

  return (
    <footer className="w-full py-6 mt-auto text-center border-t border-border opacity-60">
      <div className="flex justify-center gap-4 mb-4">
        <a 
          href={`mailto:${coachEmail}`} 
          className="p-1.5 bg-card rounded-lg text-muted-foreground hover:text-red-600 transition-all border border-border"
          title="Enviar E-mail"
        >
          <Mail size={12} />
        </a>
        <a 
          href={`https://wa.me/${coachPhone}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 bg-card rounded-lg text-muted-foreground hover:text-emerald-600 transition-all border border-border"
          title="WhatsApp"
        >
          <MessageCircle size={12} />
        </a>
        <a 
          href={`tel:+${coachPhone}`} 
          className="p-1.5 bg-card rounded-lg text-muted-foreground hover:text-blue-600 transition-all border border-border"
          title="Ligar"
        >
          <Phone size={12} />
        </a>
      </div>
      <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">
        Desenvolvido por André Victor Brito de Andrade • Contato: {coachEmail} • Versão 1.0.0 © 2026
      </p>
    </footer>
  );
}
