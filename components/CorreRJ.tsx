
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, MapPin, Clock, ExternalLink, Bell, ArrowLeft, 
  DollarSign, TrendingUp, Zap, X, Info, CheckCircle 
} from 'lucide-react';
import { callAI } from '../services/gemini';
import { db, appId, handleFirestoreError, OperationType, collection, doc, setDoc, onSnapshot, deleteDoc } from '../services/firebase';
import { BackgroundCarousel } from './Layout';

// --- LINK ÚNICO DE INFORMAÇÕES ---
const INFO_LINK = "https://www.olympics.com/pt/noticias/corrida-de-rua-rio-de-janeiro-2026-calendario-provas";

// --- IMAGENS DE FUNDO DINÂMICO ---
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?q=80&w=1920&auto=format&fit=crop", // Running sunset
  "https://images.unsplash.com/photo-1552674605-46f538379c43?q=80&w=1920&auto=format&fit=crop", // Group running
  "https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=1920&auto=format&fit=crop", // Runner shoes
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1920&auto=format&fit=crop", // Track
  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1920&auto=format&fit=crop", // Trail
];

// --- COMPONENTE DE FIGURA (BANNER DE CABEÇALHO DO MÊS) ---
const MonthArt = ({ month, raceCount }: { month: string; raceCount: number }) => {
  const monthThemes: Record<string, string> = {
    "Janeiro": "Verão & Férias ☀️🌴",
    "Fevereiro": "Carnaval 🎉🏃‍♂️",
    "Março": "Mês da Mulher 👩🏽‍🦱💪",
    "Abril": "Páscoa 🐰🍫",
    "Maio": "Dia das Mães 👩‍👧‍👦❤️",
    "Junho": "Festas Juninas 🌽🔥",
    "Julho": "Festas Julinas 🥜🎉",
    "Agosto": "Inverno ❄️⛄",
    "Setembro": "Primavera 🌸🌻",
    "Outubro": "Dia das Crianças 🧸🎈",
    "Novembro": "Proclamação da República 🇧🇷",
    "Dezembro": "Natal 🎄🎅"
  };

  const themeText = monthThemes[month];

  return (
    <div className="w-full h-40 rounded-3xl border-4 border-zinc-800 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden mb-8 bg-zinc-950 flex items-center justify-center relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-zinc-900/50" />
      
      {/* Badge de Provas */}
      <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full border-2 border-zinc-800 shadow-xl z-20">
        <span className="text-[9px] font-black uppercase text-white tracking-widest leading-none">
          {raceCount} {raceCount === 1 ? 'Prova' : 'Provas'}
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
         <h2 className="text-5xl font-poppins font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">{month}</h2>
         {themeText && (
           <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mt-2 opacity-80">{themeText}</span>
         )}
      </div>
    </div>
  );
};

// --- DADOS TOTAIS (LISTA COMPLETA 2026) ---
const INITIAL_PREDICTIONS = [
  // JANEIRO
  { nome: "6ª Gratidão Run", data: "20/01", dataIso: "2026-01-20", cidade: "RJ", horario: "A definir", largada: "Parque Madureira", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "Corrida de São Sebastião", data: "20/01", dataIso: "2026-01-20T12:00:00", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Eclipse Night Run - Lua Nova", data: "24/01", dataIso: "2026-01-24", cidade: "RJ", horario: "A definir", largada: "Parque Olímpico", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Porto Saúde T&F Experience", data: "24/01", dataIso: "2026-01-24T12:00:00", cidade: "RJ", horario: "A definir", largada: "Shopping Américas", link: INFO_LINK, valor: "A consultar", info: "Treinão de Corrida. Distância: 5k" },
  { nome: "PTT Running", data: "24/01", dataIso: "2026-01-24T14:00:00", cidade: "RJ", horario: "A definir", largada: "Parque Olímpico", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "PTT Running (Posto 10)", data: "24/01", dataIso: "2026-01-24T16:00:00", cidade: "RJ", horario: "A definir", largada: "Posto 10", link: INFO_LINK, valor: "A consultar", info: "Distâncias: A definir" },
  { nome: "Corrida Mickey 1928", data: "25/01", dataIso: "2026-01-25", cidade: "RJ", horario: "A definir", largada: "Parque Madureira", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "Run Free", data: "25/01", dataIso: "2026-01-25T12:00:00", cidade: "RJ", horario: "A definir", largada: "A definir", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Verão Carioca Run", data: "25/01", dataIso: "2026-01-25T14:00:00", cidade: "RJ", horario: "A definir", largada: "Monumento aos Pracinhas", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },

  // FEVEREIRO
  { nome: "Circuito do Sol", data: "01/02", dataIso: "2026-02-01", cidade: "RJ", horario: "A definir", largada: "Praia da Glória", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k, 10k e 15k" },
  { nome: "Circuito Rio Maravilha - Verão", data: "01/02", dataIso: "2026-02-01T12:00:00", cidade: "RJ", horario: "A definir", largada: "Quinta da Boa Vista", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Circuito Divas Run - Verão", data: "08/02", dataIso: "2026-02-08", cidade: "RJ", horario: "A definir", largada: "Parque Olímpico", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Corrida de Carnaval", data: "08/02", dataIso: "2026-02-08T12:00:00", cidade: "RJ", horario: "A definir", largada: "Musal - Campo dos Afonsos", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 3k e 5k" },
  { nome: "Corrida Nostalgia Popeye", data: "08/02", dataIso: "2026-02-08T14:00:00", cidade: "RJ", horario: "A definir", largada: "Parque Madureira", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "ATR Running 10ª Ed.", data: "22/02", dataIso: "2026-02-22", cidade: "RJ", horario: "A definir", largada: "Posto 12, Recreio", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Circuito Elementos - Fogo", data: "28/02", dataIso: "2026-02-28", cidade: "RJ", horario: "A definir", largada: "Quinta da Boa Vista", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "Corrida Kids Bíblica", data: "28/02", dataIso: "2026-02-28T14:00:00", cidade: "RJ", horario: "A definir", largada: "Quinta da Boa Vista", link: INFO_LINK, valor: "A consultar", info: "Distâncias: A definir" },

  // MARÇO
  { nome: "Cats Run 2026", data: "01/03", dataIso: "2026-03-01", cidade: "RJ", horario: "A definir", largada: "Parque das Figueiras", link: INFO_LINK, valor: "A consultar", info: "Distância: 7,5k" },
  { nome: "Circuito Correndo pelo Rio - 1ª Etapa", data: "01/03", dataIso: "2026-03-01T12:00:00", cidade: "RJ", horario: "A definir", largada: "Quintal da Boa Vista", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "Fla Run 2026", data: "01/03", dataIso: "2026-03-01T14:00:00", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 3k, 5k e 10k" },
  { nome: "2ª Corrida e Caminhada do Mulheres com Voz", data: "08/03", dataIso: "2026-03-08", cidade: "RJ", horario: "A definir", largada: "Parque Olímpico da Barra", link: INFO_LINK, valor: "A consultar", info: "Distância: A definir" },
  { nome: "Circuito All Running - 1ª Etapa", data: "08/03", dataIso: "2026-03-08T10:00:00", cidade: "RJ", horario: "A definir", largada: "Parque Olímpico da Barra", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Circuito das Estações - Outono", data: "08/03", dataIso: "2026-03-08T12:00:00", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k, 10k e 13k" },
  { nome: "Corrida e Caminhada Contos Clássicos Mulan", data: "08/03", dataIso: "2026-03-08T14:00:00", cidade: "RJ", horario: "A definir", largada: "Parque de Madureira - Arcos Olímpicos", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "Corrida Kids Daniel na Cova do Leão", data: "14/03", dataIso: "2026-03-14", cidade: "RJ", horario: "A definir", largada: "Rua Walter Barbosa - Campo Grande", link: INFO_LINK, valor: "A consultar", info: "Distâncias: A definir" },
  { nome: "Corrida das Poderosas - 1º etapa", data: "15/03", dataIso: "2026-03-15", cidade: "RJ", horario: "A definir", largada: "Monumento aos Pracinhas", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Santander Track&Fields Run Series", data: "15/03", dataIso: "2026-03-15T12:00:00", cidade: "RJ", horario: "A definir", largada: "Avenida Lauro Sodré, 116", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "2ª Corrida das Águas", data: "22/03", dataIso: "2026-03-22", cidade: "RJ", horario: "A definir", largada: "Praça Pedro Bruno", link: INFO_LINK, valor: "A consultar", info: "Distância: 6k" },
  { nome: "32ª Corrida Mulher Maravilha Rio de Janeiro", data: "29/03", dataIso: "2026-03-29", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Corrida Solidária RH Raiz", data: "29/03", dataIso: "2026-03-29T12:00:00", cidade: "RJ", horario: "A definir", largada: "Parque de Madureira - Arcos Olímpicos", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },

  // ABRIL
  { nome: "Corrida e Caminhada pela Inclusão 2026", data: "05/04", dataIso: "2026-04-05", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Maratona de Revezamento PZTEAM", data: "11/04", dataIso: "2026-04-11", cidade: "RJ", horario: "A definir", largada: "Grumari", link: INFO_LINK, valor: "A consultar", info: "Distância: 45,9k" },
  { nome: "Corrida Bob Esponja 2026", data: "12/04", dataIso: "2026-04-12", cidade: "RJ", horario: "A definir", largada: "Em frente ao Posto 2", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Rj Half Marathon 2026", data: "19/04", dataIso: "2026-04-19", cidade: "RJ", horario: "A definir", largada: "A definir", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 21k" },
  { nome: "Corrida Kids Páscoa é Ressureição", data: "21/04", dataIso: "2026-04-21", cidade: "RJ", horario: "A definir", largada: "Rua Walter Barbosa - Campo Grande", link: INFO_LINK, valor: "A consultar", info: "Distâncias: A definir" },
  { nome: "Night Run 2026 - Etapa 1", data: "25/04", dataIso: "2026-04-25", cidade: "RJ", horario: "A definir", largada: "Sambódromo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Corrida e Caminhada Contos Clássicos Crônicas de Nárnia", data: "26/04", dataIso: "2026-04-26", cidade: "RJ", horario: "A definir", largada: "Parque de Madureira - Arcos Olímpicos", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },

  // MAIO
  { nome: "4ª Corrida da Mesa do Imperador", data: "17/05", dataIso: "2026-05-17", cidade: "RJ", horario: "A definir", largada: "Estrada da Vista Chinesa, 120", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "Corrida Corpo de Fuzileiros Navais e Intendentes da Marinha", data: "24/05", dataIso: "2026-05-24", cidade: "RJ", horario: "A definir", largada: "Monumento aos Pracinhas", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" },
  { nome: "Circuito das Estações - Inverno", data: "31/05", dataIso: "2026-05-31", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k, 10k e 15k" },
  { nome: "Corrida Betty Boop", data: "31/05", dataIso: "2026-05-31T12:00:00", cidade: "RJ", horario: "A definir", largada: "Parque Madureira - Arcos Olímpicos", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },
  { nome: "Corrida e Caminhada da Copa 2026", data: "31/05", dataIso: "2026-05-31T14:00:00", cidade: "RJ", horario: "A definir", largada: "Praça Mauá - Em frente ao Museu de Arte do Rio", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },

  // JUNHO
  { nome: "Corrida da Bela e da Fera", data: "28/06", dataIso: "2026-06-28", cidade: "RJ", horario: "A definir", largada: "Parque Radical de Deodoro", link: INFO_LINK, valor: "A consultar", info: "Distância: 4k" },

  // JULHO
  { nome: "Asics Golden Run RJ", data: "12/07", dataIso: "2026-07-12", cidade: "RJ", horario: "A definir", largada: "Monumento aos Pracinhas", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 10k e 21k" },
  { nome: "6 Milhas da Reserva", data: "26/07", dataIso: "2026-07-26", cidade: "RJ", horario: "A definir", largada: "Praia da Reserva", link: INFO_LINK, valor: "A consultar", info: "Distância: 6 milhas" },

  // AGOSTO
  { nome: "28ª Meia Maratona Internacional do Rio de Janeiro", data: "16/08", dataIso: "2026-08-16", cidade: "RJ", horario: "A definir", largada: "A definir", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k, 10k e 21k" },

  // SETEMBRO
  { nome: "7ª Meia Maratona da Reserva - Desafio", data: "19/09", dataIso: "2026-09-19", cidade: "RJ", horario: "A definir", largada: "Posto 12 - Praça Tim Maia", link: INFO_LINK, valor: "A consultar", info: "Distância: 5k" },
  { nome: "7ª Meia Maratona da Reserva - Desafio", data: "20/09", dataIso: "2026-09-20", cidade: "RJ", horario: "A definir", largada: "Posto 12 - Praça Tim Maia", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 10k e 21k" },
  { nome: "Circuito das Estações - Primavera", data: "20/09", dataIso: "2026-09-20T12:00:00", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k, 10k e 18k" },

  // OUTUBRO (Vazio conforme dados)

  // NOVEMBRO
  { nome: "Night Run 2026 - Etapa 2", data: "14/11", dataIso: "2026-11-14", cidade: "RJ", horario: "A definir", largada: "A definir", link: INFO_LINK, valor: "A consultar", info: "Distância: 7k" },

  // DEZEMBRO
  { nome: "Circuito das Estações - Verão", data: "06/12", dataIso: "2026-12-06", cidade: "RJ", horario: "A definir", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "A consultar", info: "Distâncias: 5k e 10k" }
];

// --- CARD DE PROVA SLIM ---
const RaceCard: React.FC<{ race: any; onTips: () => void }> = ({ race, onTips }) => {
  const isCompleted = new Date(race.dataIso).getTime() < Date.now();

  return (
    <div className={`bg-zinc-900 rounded-[20px] p-4 border-2 border-zinc-800 britto-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group relative overflow-hidden ${isCompleted ? 'opacity-70 grayscale-[0.5]' : ''}`}>
      {isCompleted && (
        <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 rounded-br-xl border-b-2 border-r-2 border-zinc-800 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 z-20 shadow-sm">
          <CheckCircle size={10} /> Check In
        </div>
      )}
      <div className="flex justify-between items-center mb-3 text-white mt-4">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className={`w-2 h-6 ${isCompleted ? 'bg-green-500' : 'bg-red-600'} rounded-full shrink-0`}></div>
        <h4 className={`text-sm font-poppins font-black leading-none uppercase italic truncate ${isCompleted ? 'text-green-700' : 'group-hover:text-red-600'} transition-colors tracking-tight`}>
          {race.nome}
        </h4>
      </div>
      <p className="text-xl font-poppins font-black tracking-tighter leading-none shrink-0 ml-2">{race.data}</p>
    </div>

    <div className="flex items-center gap-4 mb-3 text-[10px] font-bold text-zinc-400">
      <div className="flex items-center gap-1"><Clock size={12} className="text-red-500" />{race.horario}</div>
      <div className="flex items-center gap-1"><DollarSign size={12} className="text-green-600" />{race.valor}</div>
      <div className="flex items-center gap-1 flex-1 truncate"><MapPin size={12} className="text-zinc-500" />{race.largada}</div>
    </div>

    <div className="flex gap-2">
      <button 
        onClick={onTips} 
        className="flex-1 py-2 bg-red-600 text-white border-2 border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
      >
        <Zap size={11} fill="white" /> Estratégia IA
      </button>
      <a 
        href={INFO_LINK} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex-1 py-2 bg-zinc-800 text-zinc-100 border-2 border-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
      >
        Informações <ExternalLink size={11} />
      </a>
    </div>

    <div className="mt-3 pt-3 border-t-2 border-zinc-800 flex items-center gap-1.5 opacity-40 text-zinc-400">
      <Info size={10} />
      <p className="text-[8px] font-black uppercase italic truncate">"{race.info}"</p>
    </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export function CorreRJView({ onBack }: { onBack: () => void }) {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaContent, setIaContent] = useState<string | null>(null);
  const [showIaModal, setShowIaModal] = useState(false);
  const [activeRace, setActiveRace] = useState<any>(null);
  const [bgIndex, setBgIndex] = useState(0);
  
  // Ref para controlar o processo de seeding e evitar loops
  const seedingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % BG_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const path = `artifacts/${appId}/public/data/races`;
    const racesRef = collection(db, path);
    const unsubscribe = onSnapshot(racesRef, (snapshot) => {
      const raceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Verifica se a quantidade de corridas no banco é diferente do esperado e se o seeding já não está rodando
      if (raceList.length !== INITIAL_PREDICTIONS.length && !seedingRef.current) {
        console.log("Detectadas provas faltando ou sobrando. Iniciando sincronização...");
        seedingRef.current = true;
        seedInitialData(raceList).then(() => {
            // Opcional: poderíamos resetar o ref, mas para essa sessão o seeding roda uma vez.
        });
      }
      
      const sorted = raceList.sort((a: any, b: any) => new Date(a.dataIso).getTime() - new Date(b.dataIso).getTime());
      setRaces(sorted);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (err) {
        console.error("Firestore get error:", err);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const seedInitialData = async (existingData: any[]) => {
    const expectedIds = new Set(INITIAL_PREDICTIONS.map(race => 
      `seed_${race.dataIso}_${race.nome.toLowerCase().replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
    ));

    // Deleta as corridas que não estão mais na lista de predições
    for (const data of existingData) {
      if (!expectedIds.has(data.id)) {
        const path = `artifacts/${appId}/public/data/races/${data.id}`;
        try {
          await deleteDoc(doc(db, path));
        } catch (e) {
          try {
            handleFirestoreError(e, OperationType.DELETE, path);
          } catch (err) {
            console.error("Firestore delete error:", err);
          }
        }
      }
    }
    
    // Insere ou atualiza as corridas da lista
    for (const race of INITIAL_PREDICTIONS) {
      const raceId = `seed_${race.dataIso}_${race.nome.toLowerCase().replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
      const path = `artifacts/${appId}/public/data/races/${raceId}`;
      try {
        await setDoc(doc(db, path), { ...race, lastScrape: new Date().toISOString() }, { merge: true });
      } catch (e) {
        try {
          handleFirestoreError(e, OperationType.WRITE, path);
        } catch (err) {
          console.error("Firestore write error:", err);
        }
      }
    }
  };

  const callGemini = async (prompt: string, systemInstruction: string, race: any) => {
    setIaLoading(true); setIaContent(null); setActiveRace(race); setShowIaModal(true);
    try {
      const response = await callAI({
        model: 'gemini-3-flash-preview',
        prompt: prompt,
        systemInstruction: systemInstruction
      });
      setIaContent(response.text || "Sem resposta da IA.");
    } catch (error: any) { 
        console.error("AI Error:", error);
        const errMsg = error.message || "Erro ao conectar com a IA.";
        setIaContent(`Falha técnica na IA:\n\n💬 "${errMsg}"\n\n💡 Por favor, configure uma chave GEMINI_API_KEY válida nas configurações (Settings > Secrets) para reativar.`); 
    } finally { 
        setIaLoading(false); 
    }
  };

  const handleGenerateRaceTips = (race: any) => {
    callGemini(`Estratégia curta e direta para a corrida "${race.nome}" no Rio de Janeiro. Foque no percurso, altimetria estimada e dicas de ritmo.`, "Você é um especialista técnico em corridas de rua do Rio de Janeiro.", race);
  };

  const monthsOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const groupedRaces = useMemo(() => {
    const groups: Record<string, any[]> = {};
    races.forEach(r => {
      const date = new Date(r.dataIso + "T12:00:00Z");
      // Ajuste fuso se necessário, ou pegue UTC Month
      const m = isNaN(date.getTime()) ? "A Definir" : monthsOrder[date.getUTCMonth()];
      if (!groups[m]) groups[m] = [];
      groups[m].push(r);
    });
    return groups;
  }, [races]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-black overflow-x-hidden text-white selection:bg-red-900/30 font-sans animate-in slide-in-from-bottom-10 duration-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,700;0,800;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .glass-header { background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(12px); }
        .britto-shadow { box-shadow: 4px 4px 0px 0px rgba(255,255,255,0.05); }
      `}</style>

      {/* BACKGROUND CARROSSEL */}

      <div className="relative z-10 pb-20 h-screen overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-50 glass-header border-b border-zinc-800 px-4 py-5 shadow-xl">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition-colors">
                 <ArrowLeft size={24} className="text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-poppins font-black italic tracking-tighter uppercase leading-none text-white">
                  CORRE<span className="text-red-600">RJ</span>
                </h1>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Calendário 2026</p>
              </div>
            </div>
            <Bell size={20} className="opacity-30 text-white" />
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-6">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin"></div>
              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest text-white">Carregando provas...</p>
            </div>
          ) : (
            <div className="space-y-16 pb-24">
              {monthsOrder.map(month => groupedRaces[month] && (
                <section key={month} className="mb-12">
                  <MonthArt month={month} raceCount={groupedRaces[month].length} />

                  <div className="space-y-4 px-2">
                    {groupedRaces[month].map((race: any) => (
                      <RaceCard key={race.id} race={race} onTips={() => handleGenerateRaceTips(race)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
        
        <footer className="mt-16 px-8 text-center opacity-40 border-t border-white/10 pt-8 text-white pb-10">
          <p className="text-[8px] font-black uppercase tracking-[0.3em]">
            ESTRATÉGIA CORRE RJ • 2026
          </p>
        </footer>

        {showIaModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border-4 border-zinc-800 britto-shadow">
              <div className="px-5 py-4 border-b-4 border-zinc-800 flex items-center justify-between bg-red-600">
                <div className="flex items-center gap-2">
                  <Zap size={20} fill="white" className="text-white" />
                  <h3 className="font-poppins font-black text-xs uppercase text-white">Estratégia IA</h3>
                </div>
                <button onClick={() => setShowIaModal(false)} className="bg-black/20 text-white rounded-full p-1 hover:bg-black/40 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-zinc-100 font-semibold text-xs leading-relaxed bg-zinc-950">
                {iaLoading ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <div className="w-6 h-6 border-2 border-white/10 border-t-red-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase text-zinc-500">Analisando percurso...</span>
                    </div>
                ) : (
                    <div className="space-y-2 whitespace-pre-line">{iaContent}</div>
                )}
              </div>
              <div className="p-4 bg-zinc-900 flex justify-center border-t border-zinc-800">
                <button onClick={() => setShowIaModal(false)} className="px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg hover:bg-red-700">Entendido!</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}