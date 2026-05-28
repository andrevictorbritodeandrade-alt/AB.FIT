import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Dumbbell, X, Zap, Menu, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { EXERCISE_CATALOG, IMAGEN_MODEL, GEMINI_MODEL } from '../src/constants/exerciseCatalog';
import { callAI } from '../services/gemini';
import { BackgroundCarousel, FITNESS_IMAGES } from './Layout';

const MULTI_KEYWORDS = [
  "SUPINO", "DESENVOLVIMENTO", "PUXADA", "REMADA", "AGACHAMENTO",
  "LEG PRESS", "HACK", "AFUNDO", "PASSADA", "TERRA", "STIFF", "PARALELA", 
  "GRAVITON", "PULL UP", "BARRA FIXA", "CANIVETE", "REMADOR", "LEVANTAMENTO", 
  "HIP THRUST", "PONTE", "BÚLGARO", "GOOD MORNING", "AVANÇO", "SISSY", 
  "MATA-BORRÃO", "PERDIGUEIRO"
];

const getFallbackImage = (muscle: string, exerciseName: string = "") => {
  const m = (muscle || "").toUpperCase();
  const ex = (exerciseName || "").toUpperCase();

  // 1. Specific exercise category checks to avoid wrong body posture fallbacks
  if (ex.includes("SUPINO") || ex.includes("PECK DECK") || ex.includes("CRUCIFIXO")) {
    return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop"; // Bench press setup in gym
  }
  if (ex.includes("ELEVAÇÃO DE QUADRIL") || ex.includes("HIP THRUST") || ex.includes("PONTE")) {
    return "https://images.unsplash.com/photo-1526506114642-54cb358634a5?q=80&w=1200&auto=format&fit=crop"; // Barbell setup on rubber flooring
  }
  if (ex.includes("AGACHAMENTO") || ex.includes("LEG PRESS") || ex.includes("HACK") || ex.includes("AFUNDO") || ex.includes("BÚLGARO") || ex.includes("PASSADA") || ex.includes("AVANÇO")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"; // Premium heavy squat rack / leg zone
  }
  if (ex.includes("MESA FLEXORA") || ex.includes("CADEIRA EXTENSORA") || ex.includes("ABDUTORA") || ex.includes("STIFF")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop"; // Clean gym plates / weights close-up
  }
  if (ex.includes("ROSCA") || ex.includes("TRÍCEPS") || ex.includes("DESENVOLVIMENTO") || ex.includes("ELEVAÇÃO LATERAL") || ex.includes("OMBROS")) {
    return "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1200&auto=format&fit=crop"; // Rows of steel dumbbells on racks
  }
  if (ex.includes("PUXADA") || ex.includes("REMADA") || ex.includes("BARRA FIXA") || ex.includes("PULL UP") || ex.includes("PULL DOWN")) {
    return "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop"; // Cable lat pulldown handles & pull up bar environment
  }

  // 2. Fallbacks for general muscle group categories
  if (m.includes("PEITORAL")) {
    return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop"; // Chest press station
  }
  if (m.includes("GLÚTEOS")) {
    return "https://images.unsplash.com/photo-1526506114642-54cb358634a5?q=80&w=1200&auto=format&fit=crop"; // Barbell setup on rubber flooring
  }
  if (m.includes("QUADRÍCEPS") || m.includes("ISQUIOTIBIAIS")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"; // Leg squat platform
  }
  if (m.includes("OMBROS") || m.includes("BÍCEPS") || m.includes("TRÍCEPS")) {
    return "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1200&auto=format&fit=crop"; // Dumbbells
  }
  if (m.includes("COSTAS") || m.includes("DORSAL") || m.includes("PARAVERTEBRAIS")) {
    return "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop"; // Cable station
  }
  if (m.includes("PANTURRILHA")) {
    return "https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=1200&auto=format&fit=crop"; // Ground training
  }
  if (m.includes("ABDÔMEN")) {
    return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop"; // Studio exercise mats
  }
  if (m.includes("CARDIO")) {
    return "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop"; // Treadmills
  }

  // 3. Ultra-premium default gym background
  return "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop";
};

const getExerciseCategory = (name: string) => {
  const upper = name.toUpperCase();
  const isMulti = upper.includes("TRÍCEPS NA PARALELA") || upper.includes("TRÍCEPS NA PARELELA") || MULTI_KEYWORDS.some(kw => upper.includes(kw));
  const mainType = isMulti ? "Multiarticulares" : "Uniarticulares";
  
  let subType = "Simples";
  if (upper.includes("UNILATERAL") || upper.includes("1 BRAÇO") || upper.includes("UMA PERNA") || upper.includes("1 PERNA") || upper.includes("UM BRAÇO")) {
    subType = "Unilateral";
  } else if (upper.includes("ALTERNADO") || upper.includes("ALTERNADA")) {
    subType = "Alternado";
  }
  
  return `${mainType} - ${subType}`;
}

const CATEGORY_ORDER = [
  "Multiarticulares - Simples",
  "Multiarticulares - Alternado",
  "Multiarticulares - Unilateral",
  "Uniarticulares - Simples",
  "Uniarticulares - Alternado",
  "Uniarticulares - Unilateral"
];

export default function GeraAi({ onBack, initialExerciseName }: { onBack?: () => void, initialExerciseName?: string }) {
  const [selectedMuscle, setSelectedMuscle] = useState<string>("PEITORAL");
  const [searchQuery, setSearchQuery] = useState(initialExerciseName || "");
  
  const [selectedExercise, setSelectedExercise] = useState<{name: string, muscle: string} | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isImageFallback, setIsImageFallback] = useState(false);
  const [analysis, setAnalysis] = useState<{ tecnicaAplicada: string; impactoFisiologico: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  const muscleGroups = Object.keys(EXERCISE_CATALOG);
  
  const filteredExercises = (EXERCISE_CATALOG[selectedMuscle as keyof typeof EXERCISE_CATALOG] || [])
    .filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedExercises: Record<string, string[]> = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {} as Record<string, string[]>);

  filteredExercises.forEach(ex => {
    const cat = getExerciseCategory(ex);
    if (!groupedExercises[cat]) groupedExercises[cat] = [];
    groupedExercises[cat].push(ex);
  });

  useEffect(() => {
    if (initialExerciseName) {
        for (const [muscle, exercises] of Object.entries(EXERCISE_CATALOG)) {
            const matchedEx = exercises.find(ex => ex.toLowerCase() === initialExerciseName.toLowerCase() || ex.toLowerCase().includes(initialExerciseName.toLowerCase()));
            if (matchedEx) {
                setSelectedMuscle(muscle);
                handleExerciseClick(matchedEx, muscle);
                break;
            }
        }
    }
  }, [initialExerciseName]);

  const handleExerciseClick = async (exerciseName: string, muscle: string) => {
    setSelectedExercise({ name: exerciseName, muscle });
    setGeneratedImage(null);
    setAnalysis(null);
    setAiWarning(null);
    setIsImageFallback(false);
    setIsGenerating(true);

    let positionInstructions = "";
    const upperName = exerciseName.toUpperCase();
    if (upperName.includes("DECLINADO")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a DECLINE bench press exercise (Supino Declinado). The gym bench MUST be visibly angled downwards towards the floor (angle -30 degrees). The athlete's head MUST be near the floor, pointing downwards. The athlete's hips and knees MUST be significantly higher than their head. Their legs/ankles MUST be securely locked under padded rollers at the top of the bench to avoid sliding down. They press the weight upwards from their lower chest. DO NOT draw an incline or flat bench.";
    } else if (upperName.includes("INCLINADO")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is an INCLINE bench press exercise (Supino Inclinado). The gym bench MUST be angled upwards at 30 to 45 degrees. The athlete sits with their back flat against the incline, head significantly higher than hips, pressing the weight vertically upwards from their upper chest.";
    } else if (upperName.includes("RETO") || upperName.includes("SUPINO RETO") || upperName.includes("SUPINO ABERTO NO BANCO RETO")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a flat chest press exercise (Supino Reto). The athlete is lying completely flat on their back on a horizontal flat gym bench, pressing the barbell or dumbbells straight up over their chest. Their feet are flat on the floor.";
    } else if (upperName.includes("ELEVAÇÃO DE QUADRIL") || upperName.includes("HIP THRUST") || upperName.includes("PONTE")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a glute HIP THRUST / ELEVAÇÃO DE QUADRIL exercise! The athlete's body is in a horizontal bridge-like position. Their upper back and shoulder blades are resting securely across the side of a horizontal flat gym bench. Their feet are flat on the gym floor with knees bent at a 90-degree angle. A loaded barbell with round weight plates resides across the athlete's hips/lap, gripped and stabilized by both hands. Hips are raised in full extension parallel to the floor, squeezing the glutes. DO NOT draw a standing athlete! DO NOT draw a deadlift, overhead bar, or standard squat! The posture must show support from the shoulder blades on the bench, feet flat on the floor, and weight on the lap.";
    } else if (upperName.includes("AGACHAMENTO") || upperName.includes("HACK") || upperName.includes("AFUNDO") || upperName.includes("BÚLGARO") || upperName.includes("PASSADA") || upperName.includes("AVANÇO") || upperName.includes("SQUAT") || upperName.includes("SISSY")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a lower body Squat/Agachamento or Lunge/Passada. The athlete's hips are lowered with knees bent at approximately 90 degrees in a powerful, stable stance. Torso is strong, upright, and feet are planted flat on the rubber gym flooring, showing perfect hip and knee flexion. For squats, a bar is placed on their upper back.";
    } else if (upperName.includes("REMADA UNILATERAL") || upperName.includes("SERRUCHO") || upperName.includes("SERROTE")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a REMADA UNILATERAL (One-Arm Dumbbell Row) exercise. The athlete supports their horizontal torso on a flat gym bench with one knee and the hand of that same side resting flat on the bench. The other leg is standing on the ground to stabilize. With the free hand, they pull a dumbbell upward toward their hip in a rowing motion, keeping their flat back parallel to the floor.";
    } else if (upperName.includes("REMADA") || upperName.includes("ROW")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a REMADA (Rowing) exercise. The athlete's torso is slightly bent at the hips with a flat, straight back, pulling a barbell, cable, or handles toward their midsection in a high-tension contraction.";
    } else if (upperName.includes("ROSCA") || upperName.includes("CURL")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a bicep curl (Rosca) exercise. The athlete is standing upright with open chest, keeping elbows tucked close to their sides, flexing and curling a bar or dumbbells upward to activate and isolate the bicep muscles.";
    } else if (upperName.includes("TRÍCEPS TESTA")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a skull crusher (Tríceps Testa) exercise. The athlete lies flat on their back on a gym bench, holding a bar with hands close together, bending only at the elbows to lower the bar towards their forehead, keeping upper arms fully vertical.";
    } else if (upperName.includes("TRÍCEPS") || upperName.includes("COICE") || upperName.includes("PARALELA")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a triceps extension movement. The athlete extends their elbows against resistance, compressing the back of the arms in a focused lock-out with controlled form.";
    } else if (upperName.includes("DESENVOLVIMENTO") || upperName.includes("SHOULDER PRESS") || upperName.includes("OVERHEAD PRESS")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is an overhead shoulder press (Desenvolvimento). The athlete is pushing dumbbells or a bar directly overhead to full vertical arm lock-out, showcasing defined deltoid muscles.";
    } else if (upperName.includes("ELEVAÇÃO LATERAL")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a lateral raise (Elevação Lateral). The athlete stands upright, raising dumbbells out to their sides up to shoulder level, forming a broad 'T' shape with elbows slightly bent.";
    } else if (upperName.includes("STIFF") || upperName.includes("TERRA") || upperName.includes("DEADLIFT")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a hip-hinge Stiff/Romanian Deadlift stretch. The athlete hinges at the hips, pushing their glutes back and keeping their flat torso straight as they lower the barbell down the front of their legs with nearly straight knees (only a micro-bend).";
    } else if (upperName.includes("PUXADA") || upperName.includes("PULLDOWN") || upperName.includes("BARRA FIXA")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a lat pull-down/pull-up exercise. The athlete pulls the bar down toward their upper chest, keeping their shoulders pinned back, showing high muscular width and detail in the latissimus dorsi back muscles.";
    } else if (upperName.includes("PRANCHA") || upperName.includes("PLANK")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a plank (Prancha) core exercise. The athlete's body is held in a straight horizontal line parallel to the ground, supported only on their forearms and toes on an exercise mat, squeezing their abs hard.";
    } else if (upperName.includes("PANTURRILHA")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a calf raise (Panturrilha) movement. The athlete is elevated high on their tiptoes on a step edge, showcasing powerful defined gastrocnemius calf muscles.";
    } else if (upperName.includes("PERDIGUEIRO")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a bird dog (Perdigueiro) exercise. The athlete is on all fours, extending one arm straight forward and the opposite leg straight backward, keeping their spine aligned and flat.";
    }

    const imgPrompt = `A highly detailed, professional fitness photography of a muscular Black athlete (either male or female, dark skin complexion) perfectly demonstrating the gym exercise: "${exerciseName}". 
Target muscle group: ${muscle}. 
The athlete is wearing the official South Africa national soccer team jersey for the World Cup, styled with a vibrant golden-yellow base, deep emerald-green sleeve cuffs and green neck collar, with dark green sublimated line patterns on the chest and body.
The athlete is also wearing long black Adidas workout training pants with the signature three parallel white vertical stripes going down the sides, and clean white Adidas athletic superstar sneakers with three black stripes on the sides.
Ensure the athlete's feet are positioned naturally and anatomically correctly, facing forward or slightly outward, flat on the ground or appropriately positioned on the machine, without any awkward twisting or backward rotation.
${positionInstructions}
The image should show peak muscle contraction with perfect biomechanical form. Professional modern gym environment, dramatic cinematic lighting, 8k resolution, ultra-realistic, photorealistic.`;

    const textPrompt = `Atue como um especialista em biomecânica esportiva. Faça a análise biomecânica do exercício "${exerciseName}" focado no músculo "${muscle}". 
Responda APENAS em JSON válido, sem formatação markdown ou texto adicional. Use este formato exato:
{
  "tecnicaAplicada": "Descrição técnica e biomecânica de como realizar o movimento, em um parágrafo bem redigido.",
  "impactoFisiologico": ["Ponto 1 sobre os músculos e fisiologia", "Ponto 2", "Ponto 3"]
}`;

    // 1. Try Text Analysis API
    try {
      const textRes = await callAI({
        model: GEMINI_MODEL,
        prompt: textPrompt,
        responseMimeType: "application/json"
      });
      const rawText = textRes.text || "{}";
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleaned);
      setAnalysis(parsedData);
    } catch (err: any) {
      console.error("Failed to fetch or parse analysis JSON:", err);
      const errMsg = err.message || String(err);
      if (errMsg.includes("chave") || errMsg.includes("Gemini") || errMsg.includes("cota") || errMsg.includes("Limite") || errMsg.includes("vazada") || errMsg.includes("API")) {
        setAiWarning(errMsg);
      }
      setAnalysis({
        tecnicaAplicada: `Para realizar o exercício ${exerciseName}, mantenha postura ereta, faça o movimento de forma controlada respeitando a cadência recomendada e garanta a correta ativação muscular do grupo ${muscle}.`,
        impactoFisiologico: [
          `Foco primário de ativação na região do(a) ${muscle}.`,
          "Melhora da estabilidade articular e fortalecimento das estruturas motoras.",
          "Estímulo metabólico direcionado com baixo estresse articular residual."
        ]
      });
    }

    // 2. Try Image Generation API
    try {
      const imgRes = await callAI({
        model: IMAGEN_MODEL,
        prompt: imgPrompt,
        isImageGeneration: true
      });
      if (imgRes && imgRes.imageUrl) {
        setGeneratedImage(imgRes.imageUrl);
      } else {
        throw new Error("No image URL returned");
      }
    } catch (err: any) {
      console.warn("Image generation failed or quota reached. Applying elegant Stock fallback:", err);
      const errMsg = err.message || String(err);
      if (!aiWarning && (errMsg.includes("chave") || errMsg.includes("Gemini") || errMsg.includes("cota") || errMsg.includes("Limite") || errMsg.includes("vazada") || errMsg.includes("API"))) {
        setAiWarning(errMsg);
      }
      setGeneratedImage(getFallbackImage(muscle, exerciseName));
      setIsImageFallback(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    setSelectedExercise(null);
    setGeneratedImage(null);
    setAnalysis(null);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-red-500/30">
      <BackgroundCarousel images={FITNESS_IMAGES} />
      
      <header className="sticky top-0 z-30 border-b border-red-500/10 bg-black/80 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center transform -skew-x-12 shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]">
              <Dumbbell className="w-6 h-6 text-white transform skew-x-12" />
            </div>
            <h1 className="text-3xl font-black font-display tracking-tighter italic uppercase flex items-center">
              <span className="text-white">GER</span>
              <span className="text-red-500">AÍ</span>
            </h1>
          </div>
          
          <div className="relative group w-48 md:w-80 hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-red-400 transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 backdrop-blur-md transition-all"
            />
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex w-full h-[calc(100vh-80px)] overflow-hidden relative">
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`
          absolute lg:static inset-y-0 left-0 z-50
          w-72 bg-black/95 lg:bg-transparent lg:bg-black/20 lg:backdrop-blur-md border-r border-white/5
          transform transition-transform duration-300 ease-in-out
          flex flex-col h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
        `}>
          <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 pl-2">Grupos Musculares</h2>
            <nav className="flex flex-col gap-2">
              {muscleGroups.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => {
                    setSelectedMuscle(muscle);
                    setSearchQuery("");
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`text-left px-4 py-3 rounded-2xl text-sm transition-all duration-300 font-bold font-display tracking-widest uppercase flex items-center justify-between group ${
                    selectedMuscle === muscle 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span>{muscle}</span>
                  {selectedMuscle === muscle && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
          <div className="relative w-full sm:hidden mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 backdrop-blur-md transition-all"
            />
          </div>

          <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white tracking-tight">{selectedMuscle}</h2>
            <span className="text-xs font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {filteredExercises.length} exercícios
            </span>
          </div>

          {filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <Search className="w-8 h-8 text-zinc-600 mb-4" />
              <p className="text-zinc-400">Nenhum exercício encontrado para "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {Object.entries(groupedExercises).map(([category, exercisesInCategory]) => {
                if (!exercisesInCategory || exercisesInCategory.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h3 className="text-xl md:text-2xl font-black font-display text-white mb-6 uppercase tracking-widest border-b-2 border-red-500/20 pb-3 flex items-center gap-3">
                      <div className="w-2 h-6 bg-red-500/80 rounded-full" />
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {exercisesInCategory.map((exercise, idx) => (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          key={exercise}
                          onClick={() => handleExerciseClick(exercise, selectedMuscle)}
                          className="group flex flex-col items-start p-4 bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 hover:border-red-500/30 shadow-lg hover:shadow-red-500/10 rounded-2xl text-left transition-all backdrop-blur-md"
                        >
                          <span className="text-base font-bold font-display tracking-wide text-zinc-300 group-hover:text-white transition-colors uppercase text-left">{exercise}</span>
                          <div className="mt-4 flex items-center gap-2 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon className="w-4 h-4" />
                            <span>Visualizar Biomecânica</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 py-8 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
          >
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-red-950/20 to-transparent pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-10 bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-auto"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black text-white/70 hover:text-white backdrop-blur-md transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {isGenerating ? (
                <div className="p-12 sm:p-24 flex items-center justify-center bg-zinc-950 relative min-h-[60vh]">
                  <div className="flex flex-col items-center text-center max-w-sm">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                      <div className="absolute inset-0 border-t-2 border-red-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-r-2 border-white/20 rounded-full animate-[spin_1.5s_reverse_infinite]"></div>
                      <ImageIcon className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </div>
                    <h4 className="text-base text-white font-medium mb-2 uppercase tracking-widest">Processando Visão Biomecânica</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed font-mono">
                      Sintetizando {selectedExercise.name}...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative w-full aspect-video sm:aspect-[21/9] bg-zinc-900 border-b border-white/5">
                    {generatedImage ? (
                      <img src={generatedImage} alt={selectedExercise.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                        <p>Não foi possível gerar a imagem.</p>
                      </div>
                    )}
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full z-20">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_1s_ease-in-out_infinite]" />
                      <span className="text-[10px] font-bold tracking-widest text-white uppercase">Live Biomechanic Feed</span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-10 flex flex-col gap-8">
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black font-display italic tracking-tight text-white max-w-4xl uppercase leading-[1.1]">
                        {selectedExercise.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <span className="bg-[#ef4444] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                          Análise AI
                        </span>
                        <span className="bg-[#1a1a1a] text-zinc-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/5">
                          Biomecânica
                        </span>
                      </div>
                    </div>

                    {aiWarning && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-3 items-start">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Fluxo de Contingência Ativo</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{aiWarning}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                      <div className="flex flex-col gap-4">
                        <h3 className="flex items-center gap-3 text-[#ef4444] text-xs font-bold tracking-[0.2em] uppercase">
                          <Zap className="w-4 h-4 fill-red-500 text-red-500" /> Técnica Aplicada
                        </h3>
                        <div className="border-l-[3px] border-[#ef4444]/60 pl-5 py-1">
                          <p className="text-zinc-400 text-sm leading-loose sm:text-[15px]">
                            {analysis?.tecnicaAplicada || "Analisando técnica de movimento..."}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-inner">
                        <h3 className="text-zinc-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-6">
                          Impacto Fisiológico
                        </h3>
                        <ul className="flex flex-col gap-4">
                          {analysis?.impactoFisiologico ? (
                            analysis.impactoFisiologico.map((item, i) => (
                              <li key={i} className="text-zinc-300 text-sm italic leading-relaxed flex gap-3">
                                <span className="text-zinc-500 font-normal">{i + 1}.</span>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-zinc-600 text-sm italic">Calculando implicações fisiológicas...</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
