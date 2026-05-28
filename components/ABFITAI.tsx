import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronRight, Activity, Download, FileText, AlertCircle, Dumbbell, Zap, Target, Loader2, Building2, TreePine, ClipboardList, BookOpen, User, Users, Image as ImageIcon, Shirt, Save, Video, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType, doc, setDoc } from '../services/firebase';
import { callAI } from '../services/gemini';

// ==========================================
// CONSTANTES DE CONFIGURAÇÃO
// ==========================================
const MODEL_TEXT = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

const FILTROS_MUSCULARES = [
  'TODOS', 'PEITORAL', 'DORSAIS', 'OMBROS', 'BÍCEPS', 'TRÍCEPS', 
  'QUADRÍCEPS', 'POSTERIORES DE COXA', 'GLÚTEOS', 'ADUTORES', 
  'PANTURRILHA', 'PARAVERTEBRAIS', 'ABDOMINAIS'
];

const JERSEYS_DATA: Record<string, string> = {
  "BAHIA 88": "Authentic Bahia 1988 Tricolor kit jersey, bold vertical stripes in blue, red and white. Vintage Coca-Cola logo in white script on a red box background. Classic red Adidas Originals Trefoil logo on the chest.",
  "REAL MADRID 81": "Authentic Real Madrid 1981 Home kit jersey, clean white base with purple Adidas stripes on shoulders and purple cuffs. Purple classic Adidas Originals Trefoil logo and purple Zanussi sponsor text.",
  "MÉXICO 26 (AWAY)": "Mexico 2026 Away kit jersey, white base with an intricate all-over light grey Aztec/Mayan geometric pattern. Green Adidas stripes on shoulders, red and green trim on the collar. Green Adidas Originals Trefoil logo.",
  "COLÔMBIA 26 (AWAY)": "Colombia 2026 Away kit jersey, dark teal/black base with a striking wavy graphic pattern in neon green and yellow. Neon green Adidas stripes and neon green Adidas Originals Trefoil logo.",
  "ARGÉLIA 26 (AWAY)": "Algeria 2026 Away kit jersey, vibrant emerald green with darker green vertical pinstripes. Red detailing on the collar. White Adidas stripes and white classic Adidas Originals Trefoil logo.",
  "VENEZUELA 26 (AWAY)": "Venezuela 2026 Away kit jersey, clean white base with gold stripes on the shoulders and gold classic Adidas Originals Trefoil logo.",
  "ÁFRICA DO SUL 26 (AWAY)": "South Africa 2026 Away kit jersey, dark green base with yellow and white geometric line patterns. Yellow Adidas stripes and Trefoil logo."
};

const EXERCISE_CATALOG: Record<string, string[]> = {
  "PEITORAL": [
    "CRUCIFIXO ABERTO ALTERNADO NO BANCO 30 GRAUS NO CROSS", "CRUCIFIXO ABERTO ALTERNADO NO BANCO 30 GRAUS COM HALTER DE BARRA CURTA", "CRUCIFIXO ABERTO ALTERNADO NO BANCO DECLINADO NO CROSS", "CRUCIFIXO ABERTO ALTERNADO NO BANCO RETO NO CROSS", "CRUCIFIXO ABERTO ALTERNADO NO BANCO RETO COM HALTER DE BARRA CURTA", "CRUCIFIXO ABERTO ALTERNADO EM PÉ NO CROSS POLIA ALTA", "CRUCIFIXO ABERTO ALTERNADO EM PÉ NO CROSS POLIA MÉDIA", "CRUCIFIXO ABERTO ALTERNADO EM PÉ NO VOADOR PEITORAL", "CRUCIFIXO ABERTO NO BANCO 30 GRAUS NO CROSS", "CRUCIFIXO ABERTO NO BANCO 30 GRAUS COM HALTER DE BARRA CURTA", "CRUCIFIXO ABERTO NO BANCO DECLINADO NO CROSS", "CRUCIFIXO ABERTO NO BANCO RETO COM HALTER DE BARRA CURTA", "CRUCIFIXO ABERTO NO BANCO RETO NO CROSS", "CRUCIFIXO ABERTO EM PÉ NO CROSS NA POLIA ALTA", "CRUCIFIXO ABERTO EM PÉ NO CROSS NA POLIA MÉDIA", "CRUCIFIXO ABERTO NO VOADOR PEITORAL", "CRUCIFIXO ABERTO UNILATERAL NO BANCO 30 GRAUS NO CROSS", "CRUCIFIXO ABERTO UNILATERAL NO BANCO 30 GRAUS COM HALTER DE BARRA CURTA", "CRUCIFIXO ABERTO UNILATERAL NO BANCO DECLINADO NO CROSS", "CRUCIFIXO ABERTO UNILATERAL NO BANCO RETO NO CROSS", "CRUCIFIXO ABERTO UNILATERAL NO BANCO RETO COM HALTER DE BARRA CURTA", "CRUCIFIXO ABERTO UNILATERAL EM PÉ NO CROSS NA POLIA ALTA", "CRUCIFIXO ABERTO UNILATERAL EM PÉ NO CROSS NA POLIA MÉDIA", "CRUCIFIXO ABERTO UNILATERAL NO VOADOR PEITORAL", "EXTENSÃO DE COTOVELOS ABERTO DE FRENTE PARA PAREDE", "EXTENSÃO DE COTOVELOS ABERTO INCLINADO NO SMITH", "EXTENSÃO DE COTOVELOS ABERTO NO SOLO", "EXTENSÃO DE COTOVELOS ABERTO MÃOS NO BANCO RETO", "EXTENSÃO DE COTOVELOS ABERTO PÉS NO BANCO RETO", "EXTENSÃO DE COTOVELOS ABERTO NO SOLO ENTRE DOIS STEPS", "PULL UP NO CROSS", "SUPINO ABERTO NO SMITH", "VOADOR PEITORAL"
  ],
  "OMBROS": [
    "ENCOLHIMENTO DE OMBROS EM PÉ NO CROSS COM BARRA RETA", "ENCOLHIMENTO DE OMBROS EM PÉ COM HALTER", "ENCOLHIMENTO DE OMBROS EM PÉ NO SMITH", "ABDUÇÃO DE OMBRO ALTERNADO NO BANCO 45 GRAUS", "ABDUÇÃO DE OMBROS ALTERNADO EM PÉ NO CROSS", "ABDUÇÃO DE OMBRO UNILATERAL NO BANCO 45 GRAUS", "DESENVOLVIMENTO ARNOLD EM PÉ", "DESENVOLVIMENTO FECHADO NA MÁQUINA ARTICULADA", "REMADA ALTA EM PÉ NO CROSS", "ROTAÇÃO EXTERNA DE OMBRO NO CROSS"
  ],
  "DORSAIS": [
    "ADUÇÃO ALTERNADA DE OMBROS NO CROSS", "CRUCIFIXO INVERSO ALTERNADO NO BANCO 30 GRAUS", "EXTENSÃO DE OMBROS NO CROSS", "PULL OVER NO BANCO 30 GRAUS NO CROSS", "PULL OVER NO BANCO RETO COM HALTER", "PUXADA ABERTA NA BARRA FIXA", "PUXADA NEUTRA NO PULLEY ALTO", "REMADA ABERTA CURVADA COM HALTER", "REMADA NEUTRA NA MÁQUINA SENTADA", "VOADOR DORSAL"
  ],
  "TRÍCEPS": [
    "SUPINO FECHADO NO BANCO RETO", "TRÍCEPS COICE NO CROSS", "TRÍCEPS EM PÉ NO CROSS COM BARRA RETA", "TRÍCEPS FRANCÊS NO BANCO 75 GRAUS", "TRÍCEPS TESTA COM BARRA H", "TRÍCEPS NA PARALELA GRAVITON", "TRÍCEPS SUPERMAN NO CROSS"
  ],
  "BÍCEPS": [
    "BÍCEPS ALTERNADO NO BANCO 60 GRAUS", "BÍCEPS Scott na Máquina", "BÍCEPS CONCENTRADO COM HALTER", "BÍCEPS EM PÉ COM BARRA W", "BÍCEPS SUPERMAN NO CROSS"
  ],
  "QUADRÍCEPS": [
    "AGACHAMENTO LIVRE", "AGACHAMENTO NO SMITH", "AGACHAMENTO NO HACK MACHINE", "CADEIRA EXTENSORA", "LEG PRESS 45 GRAUS", "AGACHAMENTO PASSADA", "AGACHAMENTO NO SISSY"
  ],
  "ADUTORES": [
    "ADUÇÃO DE QUADRIL EM PÉ NO APOLETE", "ADUÇÃO DE QUADRIL NO CROSS", "ADUÇÃO DE QUADRIL COM CANELEIRA", "CADEIRA ADUTORA"
  ],
  "GLÚTEOS": [
    "ABDUÇÃO DE QUADRIL EM TRÊS APOIOS", "AGACHAMENTO SUMÔ COM HALTER", "ELEVAÇÃO DE QUADRIL NO SMITH", "LEVANTAMENTO TERRA NO CROSS", "STIFF EM PÉ COM HALTER"
  ],
  "POSTERIORES DE COXA": [
    "CADEIRA FLEXORA", "FLEXÃO DE JOELHO NÓRDICA", "MESA FLEXORA", "STIFF UNILATERAL COM HALTER", "FLEXÃO DE JOELHO EM PÉ NO CROSS"
  ],
  "PANTURRILHA": [
    "DORSIFLEXÃO COM CANELEIRA", "FLEXÃO PLANTAR NO LEG PRESS", "FLEXÃO PLANTAR NO SMITH", "FLEXÃO PLANTAR NO DEGRAU"
  ],
  "PARAVERTEBRAIS": [
    "ELEVAÇÃO DE QUADRIL NO SOLO EM ISOMETRIA", "EXTENSÃO DE TRONCO NO APARELHO", "MATA-BORRÃO NO SOLO", "PERDIGUEIRO NO SOLO"
  ],
  "ABDOMINAIS": [
    "ABDOMINAL CRUNCH NA MÁQUINA", "ABDOMINAL INFRA PENDURADO", "PRANCHA VENTRAL NO SOLO", "ABDOMINAL SUPRA NA BOLA"
  ]
};

const getFallbackImage = (muscle: string, exerciseName: string = "") => {
  const m = (muscle || "").toUpperCase();
  const ex = (exerciseName || "").toUpperCase();

  if (ex.includes("SUPINO") || ex.includes("PECK DECK") || ex.includes("CRUCIFIXO")) {
    return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop";
  }
  if (ex.includes("ELEVAÇÃO DE QUADRIL") || ex.includes("HIP THRUST") || ex.includes("PONTE")) {
    return "https://images.unsplash.com/photo-1526506114642-54cb358634a5?q=80&w=1200&auto=format&fit=crop";
  }
  if (ex.includes("AGACHAMENTO") || ex.includes("LEG PRESS") || ex.includes("HACK") || ex.includes("AFUNDO") || ex.includes("BÚLGARO") || ex.includes("PASSADA") || ex.includes("AVANÇO")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop";
  }
  if (ex.includes("MESA FLEXORA") || ex.includes("CADEIRA EXTENSORA") || ex.includes("ABDUTORA") || ex.includes("STIFF")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop";
  }
  if (ex.includes("ROSCA") || ex.includes("TRÍCEPS") || ex.includes("DESENVOLVIMENTO") || ex.includes("ELEVAÇÃO LATERAL") || ex.includes("OMBROS")) {
    return "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1200&auto=format&fit=crop";
  }
  if (ex.includes("PUXADA") || ex.includes("REMADA") || ex.includes("BARRA FIXA") || ex.includes("PULL UP") || ex.includes("PULL DOWN")) {
    return "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop";
  }

  if (m.includes("PEITORAL")) {
    return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop";
  }
  if (m.includes("GLÚTEOS")) {
    return "https://images.unsplash.com/photo-1526506114642-54cb358634a5?q=80&w=1200&auto=format&fit=crop";
  }
  if (m.includes("QUADRÍCEPS") || m.includes("ISQUIOTIBIAIS") || m.includes("PERNAS")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop";
  }
  if (m.includes("OMBROS") || m.includes("BÍCEPS") || m.includes("TRÍCEPS")) {
    return "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1200&auto=format&fit=crop";
  }
  if (m.includes("COSTAS") || m.includes("DORSAL") || m.includes("PARAVERTEBRAIS")) {
    return "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop";
  }
  if (m.includes("PANTURRILHA")) {
    return "https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=1200&auto=format&fit=crop";
  }
  if (m.includes("ABDÔMEN") || m.includes("ABDOMINAIS")) {
    return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop";
  }
  
  return "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop";
};

export const ABFITAIModule: React.FC<{ studentName?: string, onClose?: () => void }> = ({ studentName, onClose }) => {
  const [environment, setEnvironment] = useState('ACADEMIA');
  const [selectedModel, setSelectedModel] = useState('HOMEM');
  const [selectedJersey, setSelectedJersey] = useState('BAHIA 88');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fullExerciseList = useMemo(() => {
    return Object.entries(EXERCISE_CATALOG).flatMap(([group, items]) => 
      items.map(name => ({ group, name }))
    );
  }, []);

  const filteredExercises = useMemo(() => {
    let list = fullExerciseList;
    if (activeFilter !== 'TODOS') list = list.filter(ex => ex.group === activeFilter);
    if (searchTerm.trim()) list = list.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.slice(0, 500); 
  }, [searchTerm, activeFilter, fullExerciseList]);

  const handleFilterClick = (tag: string) => {
    setActiveFilter(tag);
    setSearchTerm(''); 
    setSelectedExercise(null);
    setShowDropdown(true);
  };

  const handleGenerate = async () => {
    if (!selectedExercise) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedData(null);
    setShowDropdown(false);

    try {
      const jerseyPrompt = JERSEYS_DATA[selectedJersey];
      
      const modelSpecs = selectedModel === 'HOMEM' 
        ? "Powerful muscular black man with short hair and an athletic build"
        : "Lean athletic black woman, very thick muscular legs and glutes, extremely small waist, large breasts, lean defined arms. 1.77m tall, voluminous curly 4c hair, dark retinta skin, full lips";
      
      const clothesSpecs = selectedModel === 'HOMEM'
        ? "wearing black Adidas Tiro track pants with three white stripes and white Adidas Superstar sneakers"
        : "wearing short black Adidas athletic shorts with three white stripes and white Adidas Superstar sneakers. Her socks are no-show invisible style. IMPORTANT: The jersey must be worn as a CROP TOP (either lifted or tied up) to fully expose her midriff and belly button, clearly displaying a silver belly button piercing";

      const systemPrompt = `Você é um Doutor em Biomecânica Especialista. Retorne um JSON estrito.
      
CRÍTICO - MODO OUTDOOR: Se o modo for OUTDOOR, você deve adaptar obrigatoriamente o exercício para Calistenia (peso corporal), TRX ou Theraband (elástico).

REGRAS JSON:
1. "visualPrompt": Em INGLÊS. Imagem diptych (Split-screen). Lado esquerdo: START. Lado direito: FINISH.
   CRÍTICO - SEM TEXTO: "THE IMAGE MUST BE COMPLETELY CLEAN. NO TEXT, NO LETTERS. NO START/FINISH WORDS ON IMAGE."
   DESCRIÇÃO: "${modelSpecs}, fully dressed in the requested jersey (${jerseyPrompt}), paired with ${clothesSpecs}. High resolution 8k, photorealistic studio setting, light gray seamless background. Cinematic soft lighting."
2. "nomeAdaptado": Nome do exercício (adaptado se outdoor).
3. "agonistas": Músculos principais.
4. "sinergistas": Músculos auxiliares.
5. "cinesiologia": Análise biomecânica técnica.
6. "citacao": Citação acadêmica.
7. "guiaPassos": ARRAY de strings com passos numerados.`;

      const textResponse = await callAI({
        model: MODEL_TEXT,
        prompt: `Modo: ${environment}. Exercício Base: ${selectedExercise.name}. Grupo: ${selectedExercise.group}. 
Make sure that the "visualPrompt" includes extremely detailed step-by-step biomechanical descriptions of the start and finish states of the actual athletic movement of "${selectedExercise.name}" to avoid generic standing poses. Point out the exact correct alignment of the athlete's limbs, hips, feet, and hands under resistance.`,
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      });
      
      const data = JSON.parse(textResponse.text || "{}");

      // Use gemini-2.5-flash-image for generation via backend
      let imageUrl = "";
      try {
        const imgResult = await callAI({
          model: MODEL_IMAGE,
          prompt: data.visualPrompt,
          isImageGeneration: true
        });
        imageUrl = imgResult.imageUrl || "";
      } catch (imgErr: any) {
        console.warn("Falha na geração da imagem IA no PrescreveAI, usando stock fallback:", imgErr);
        imageUrl = getFallbackImage(selectedExercise.group, selectedExercise.name);
        const errMsg = imgErr.message || String(imgErr);
        if (errMsg.includes("chave") || errMsg.includes("Gemini") || errMsg.includes("cota") || errMsg.includes("Limite") || errMsg.includes("vazada") || errMsg.includes("API")) {
          setError(errMsg);
        }
      }

      data.image = imageUrl || getFallbackImage(selectedExercise.group, selectedExercise.name);
      setGeneratedData(data);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "Falha na renderização. Tente gerar novamente.";
      setError(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!generatedData || !selectedExercise) return;
    setIsSaving(true);
    const docId = selectedExercise.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    const path = `exercise_database/${docId}`;
    try {
      await setDoc(doc(db, path), {
        ...generatedData,
        videoUrl: videoUrl,
        originalName: selectedExercise.name,
        group: selectedExercise.group,
        environment,
        updatedAt: new Date().toISOString()
      });
      console.log('Exercício salvo com sucesso na base de dados central!');
    } catch (e) {
      try {
        handleFirestoreError(e, OperationType.WRITE, path);
      } catch (err) {
        console.error('Firestore write error in ABFITAI:', err);
      }
      console.error('Erro ao salvar na base de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 font-sans antialiased p-4 sm:p-8 flex flex-col items-center overflow-y-auto custom-scrollbar">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md text-slate-500 hover:text-red-500 z-50">
          <X size={24} />
        </button>
      )}
      
      {/* HEADER PREMIUM ESTÁVEL */}
      <header className="max-w-6xl w-full flex flex-col items-start mb-12 pt-4">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-tr from-red-600 to-orange-500 p-4 rounded-2xl shadow-xl">
            <Dumbbell size={36} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 leading-tight">
              PRESCREVEAI
            </h1>
            <p className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200 mt-1 pt-1">
              PRESCRIÇÃO E BIOMECÂNICA DE ALTA PERFORMANCE
            </p>
          </div>
        </div>
      </header>

      {/* CONTROLES */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setEnvironment('ACADEMIA')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-red-600 text-white shadow-md"><Building2 size={18}/> Academia</button>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setSelectedModel('HOMEM')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${selectedModel === 'HOMEM' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><User size={18}/> Homem</button>
          <button onClick={() => setSelectedModel('MULHER')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${selectedModel === 'MULHER' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> Mulher</button>
        </div>
      </div>

      {/* SELETOR DE CAMISAS */}
      <div className="max-w-4xl w-full flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {Object.keys(JERSEYS_DATA).map(team => (
          <button 
            key={team} 
            onClick={() => setSelectedJersey(team)} 
            className={`flex-none flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${selectedJersey === team ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Shirt size={14} /> {team}
          </button>
        ))}
      </div>

      {/* BUSCA */}
      <section className="max-w-4xl w-full relative z-50 mb-12" ref={searchRef}>
        <div className="relative group">
          <div className="absolute -inset-1 rounded-[3rem] blur-lg opacity-20 bg-gradient-to-r from-red-600 to-orange-500"></div>
          <div className="relative bg-white border border-slate-100 rounded-[3rem] p-2 flex items-center shadow-lg transition-all">
            <div className="pl-6 pr-2"><Search size={26} className="text-red-500" /></div>
            <input
              type="text"
              placeholder={`Buscar em ${activeFilter.toLowerCase()}...`}
              className="w-full bg-transparent text-xl text-slate-800 placeholder-slate-400 py-4 px-2 focus:outline-none font-medium"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
            />
            {selectedExercise && (
              <button onClick={handleGenerate} disabled={isGenerating} className="hidden md:flex ml-2 mr-2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-4 rounded-full font-bold hover:scale-[1.02] active:scale-95 transition-all items-center gap-2 disabled:opacity-50 shadow-lg">
                {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>} Gerar Análise 8K
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {FILTROS_MUSCULARES.map(tag => (
            <button key={tag} onClick={() => handleFilterClick(tag)} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all shadow-sm ${activeFilter === tag ? 'bg-red-600 text-white scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:text-red-600'}`}>{tag}</button>
          ))}
        </div>

        {showDropdown && (
          <div className="absolute top-[105px] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 scroll-smooth">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((ex, idx) => (
                  <button key={idx} onClick={() => { setSelectedExercise(ex); setSearchTerm(ex.name); setShowDropdown(false); }} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-between group border-b border-slate-50 last:border-0">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-red-500 uppercase mb-1 block">{ex.group}</span>
                      <span className="text-base text-slate-700 font-bold capitalize group-hover:text-red-600">{ex.name.toLowerCase()}</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-red-500" />
                  </button>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 font-medium italic">Nenhum exercício encontrado.</div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ÁREA DE RESULTADOS */}
      {(isGenerating || generatedData) && (
        <section className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-xl relative overflow-hidden h-fit">
               {isGenerating ? (
                 <div className="aspect-video flex flex-col items-center justify-center bg-slate-50 rounded-[2rem]">
                    <Loader2 size={64} className="animate-spin text-red-500 mb-4" strokeWidth={2.5}/>
                    <p className="text-slate-700 font-black text-xl animate-pulse uppercase tracking-widest text-center">Modelando Biomecânica Adaptada...</p>
                 </div>
               ) : (
                 <div className="relative group overflow-hidden rounded-[1.5rem]">
                    <img src={generatedData.image} alt="Biomecânica" className="w-full h-auto shadow-inner" />
                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-5 py-2 rounded-xl text-sm font-black text-slate-800 shadow-xl border border-slate-200 select-none uppercase">START</div>
                    <div className="absolute top-6 left-[52%] bg-white/95 backdrop-blur-sm px-5 py-2 rounded-xl text-sm font-black text-slate-800 shadow-xl border border-slate-200 select-none uppercase">FINISH</div>
                 </div>
               )}
            </div>
            {!isGenerating && (
              <div className="px-4 flex flex-col gap-4">
                <div>
                  <span className="text-sm font-black text-red-600 uppercase tracking-[0.2em]">{environment} • {selectedExercise?.group || ""}</span>
                  <h2 className="text-4xl font-black text-slate-900 uppercase leading-none mt-2">{generatedData.nomeAdaptado}</h2>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><Video size={16}/> Link do Vídeo (YouTube/Vimeo)</label>
                  <input 
                    type="text" 
                    placeholder="https://youtube.com/..." 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button onClick={handleSaveToDatabase} disabled={isSaving} className="w-full bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 mt-2">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} 
                  SALVAR NA BASE DE DADOS CENTRAL
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8 h-fit relative overflow-hidden">
               <div className="flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 relative z-10">
                  <div className="bg-red-50 p-3 rounded-2xl"><FileText size={28} className="text-red-500" /></div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Laudo Clínico</h2>
               </div>

               {isGenerating ? (
                 <div className="space-y-6">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse"/>)}
                 </div>
               ) : (
                 <div className="space-y-6 text-sm font-medium text-slate-700 leading-relaxed relative z-10">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 uppercase tracking-widest text-xs mb-2">AGONISTAS</p>
                      <p>{generatedData.agonistas}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 uppercase tracking-widest text-xs mb-2">SINERGISTAS</p>
                      <p>{generatedData.sinergistas}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 uppercase tracking-widest text-xs mb-2">CINESIOLOGIA</p>
                      <p>{generatedData.cinesiologia}</p>
                    </div>
                    <div className="p-5 border border-red-100 bg-red-50/30 rounded-2xl italic font-bold text-slate-600">
                      "{generatedData.citacao}"
                    </div>
                 </div>
               )}
            </div>

            {!isGenerating && generatedData.guiaPassos && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8 h-fit">
                 <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-emerald-50 p-3 rounded-2xl"><ClipboardList size={28} className="text-emerald-500" /></div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Guia de Execução</h2>
                 </div>
                 <div className="space-y-4">
                    {generatedData.guiaPassos.map((passo: string, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                        <span className="text-2xl font-black text-emerald-300 group-hover:text-emerald-500 leading-none">{idx+1}</span>
                        <p className="text-sm font-bold text-slate-600 leading-snug">{passo.replace(/^\d+ [-.]? /, '')}</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

        </section>
      )}

      {error && (
        <div className="max-w-4xl w-full mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-bounce shadow-md">
          <AlertCircle size={24} /> <p className="text-sm font-black uppercase tracking-wider">{error}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid white; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}
