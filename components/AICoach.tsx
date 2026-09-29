
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Dumbbell, Target, Info, Loader2, ChevronRight, Play, Box, User,
  Zap, Layout, ListFilter, ZapIcon, Activity, Video, Clock, Maximize2,
  BookOpen, MessageSquare, Sparkles, ChevronDown, UserPlus, ClipboardList,
  Calendar, Stethoscope, BrainCircuit, Timer, FileText, TrendingUp,
  AlertTriangle, CheckCircle2, Download, Lightbulb, ShieldCheck, X, Menu, ArrowLeft, Plus
} from 'lucide-react';
import { callAI } from '../services/gemini';
import { AppFooter } from './Layout';

// Using recommended models as per guidelines
const MODEL_TEXT = 'gemini-flash-latest';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

const EXERCISE_DATABASE: Record<string, string[]> = {
  "Peito": [
    "Crucifixo aberto alternado com HBC no banco declinado",
    "Crucifixo aberto alternado com HBC no banco inclinado",
    "Crucifixo aberto alternado com HBC no banco reto",
    "Crucifixo aberto com HBC no banco declinado",
    "Crucifixo aberto com HBC no banco inclinado",
    "Crucifixo aberto com HBC no banco reto",
    "Crucifixo aberto na máquina",
    "Crucifixo alternado na máquina",
    "Crucifixo em pé no cross polia alta",
    "Crucifixo em pé no cross polia média",
    "Crucifixo unilateral na máquina",
    "Extensão de cotovelos no solo (Flexão de Braços)",
    "PullUp na polia baixa pegada supinada",
    "Supino aberto banco declinado no smith",
    "Supino aberto banco inclinado no smith",
    "Supino aberto no banco reto no smith",
    "Supino alternado banco 45° fechado no crossover",
    "Supino alternado banco 45° no crossover",
    "Supino alternado banco 75° aberto no crossover",
    "Supino alternado banco 75° fechado no crossover",
    "Supino alternado banco reto aberto no crossover",
    "Supino alternado banco reto fechado no crossover",
    "Supino alternado deitado aberto na máquina",
    "Supino alternado deitado fechado na máquina",
    "Supino alternado inclinado aberto na máquina",
    "Supino alternado inclinado fechado na máquina",
    "Supino alternado sentado aberto na máquina",
    "Supino alternado sentado fechado na máquina",
    "Supino banco 45º aberto no crossover",
    "Supino banco 45º fechado no crossover",
    "Supino banco 75º aberto no crossover",
    "Supino banco 75º fechado no crossover",
    "Supino banco reto aberto no crossover",
    "Supino banco reto fechado no crossover",
    "Supino declinado alternado com HBC",
    "Supino declinado com HBC",
    "Supino declinado com HBL",
    "Supino deitado aberto na máquina",
    "Supino deitado fechado na máquina",
    "Supino inclinado aberto na máquina",
    "Supino inclinado alternado com HBC",
    "Supino inclinado com HBC",
    "Supino inclinado com HBL",
    "Supino inclinado fechado na máquina",
    "Supino Reto com HBL",
    "Supino reto alternado com HBC",
    "Supino reto com HBC",
    "Supino sentado aberto na máquina",
    "Supino sentado fechado na máquina",
    "Supino unilateral deitado aberto na máquina",
    "Supino unilateral deitado fechado na máquina",
    "Supino unilateral inclinado aberto na máquina",
    "Supino unilateral inclinado fechado na máquina",
    "Supino unilateral sentado aberto na máquina",
    "Supino unilateral sentado fechado na máquina",
    "Voador peitoral"
  ],
  "Ombro": [
    "Abdução de ombros banco 75º com HBC pegada neutra",
    "Abdução de ombros banco 75º com HBC pegada pronada",
    "Abdução de ombros em pé com HBC"
  ]
};

const AICoach: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const systemInstruction = "Você é o Coach AI da ABFIT. Você é um especialista Mestre em biomecânica e fisiologia do exercício. Ajude o atleta com orientações técnicas baseadas em ciência. Seja encorajador, preciso e profissional. Se o usuário perguntar sobre exercícios, use o banco de dados disponível se necessário: " + JSON.stringify(Object.keys(EXERCISE_DATABASE));

      const response = await callAI({
        model: MODEL_TEXT,
        prompt: userMsg,
        systemInstruction: systemInstruction
      });

      // Extracting text output from GenerateContentResponse using the .text property
      const text = response.text || "Desculpe, tive um problema ao processar sua resposta.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err: any) {
      console.error("AI Error:", err);
      const errMsg = err.message || "Erro ao conectar com a IA.";
      setMessages(prev => [...prev, { role: 'model', text: `Desculpe, não consegui obter uma resposta dos servidores de IA devido à seguinte falha:\n\n💬 "${errMsg}"\n\n💡 Verifique suas chaves de API ('GEMINI_API_KEY') no painel Settings/Secrets se esta falha persistir.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-6 pb-32">
      <header className="flex items-center gap-3 sm:gap-4 mb-6 sticky top-0 bg-zinc-900/80 backdrop-blur-xl z-40 py-3.5 -mx-6 px-6 border-b border-zinc-700/30 shadow-sm">
        {onBack && (
          <button onClick={onBack} className="p-2.5 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all active:scale-95 shadow-md shrink-0 group cursor-pointer" title="Voltar">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform text-zinc-300 group-hover:text-white"/>
          </button>
        )}
        <div className="p-2.5 bg-red-600 rounded-2xl shadow-md shrink-0">
          <BrainCircuit className="text-white" size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-zinc-200 leading-none truncate">
            ABFIT <span className="text-red-500">AI</span>
          </h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Consultoria Mestre em Biomecânica</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 space-y-4 pr-2" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
            <Sparkles size={64} className="mb-6 text-red-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Inicie seu protocolo IA</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-300 border border-white/5 rounded-tl-none'} text-sm leading-relaxed shadow-xl`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 p-4 rounded-3xl rounded-tl-none border border-white/5 shadow-xl">
              <Loader2 className="animate-spin text-red-600" size={20} />
            </div>
          </div>
        )}
      </div>

      <div className="relative mb-6">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Como posso otimizar seu treino hoje?"
          className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] text-white outline-none focus:border-red-600 transition-all text-xs font-bold uppercase placeholder:text-zinc-700 shadow-2xl"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-red-600 rounded-xl text-white hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
        </button>
      </div>
      <AppFooter />
    </div>
  );
};

export default AICoach;
