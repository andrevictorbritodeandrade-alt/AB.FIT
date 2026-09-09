import React, { useState } from 'react';
import { ArrowLeft, Radio, Music, Play, Pause, Sparkles, Volume2, Headphones, Disc, Flame, Heart, RefreshCw } from 'lucide-react';

interface RadioChannel {
    id: string;
    name: string;
    genre: string;
    description: string;
    videoId: string; // YouTube video / playlist ID
    bgGradient: string;
    icon: string;
    tag: string;
}

const RADIO_CHANNELS: RadioChannel[] = [
    {
        id: 'pagodao-baiano',
        name: 'Pagodão Baiano 2026',
        genre: 'Pagodão & Swingueira',
        description: 'Batuque pesado, coreografias e energia lá em cima para o seu treino.',
        videoId: '7ytgueWKpbY',
        bgGradient: 'from-amber-600 via-orange-900 to-black',
        icon: '🔥',
        tag: 'MAIS OUVIDO'
    },
    {
        id: 'roda-samba',
        name: 'Roda de Samba Ao Vivo',
        genre: 'Samba de Raiz',
        description: 'Cavaquinho, pandeiro e batuque autêntico em looping contínuo.',
        videoId: '5qap5aO4i9A',
        bgGradient: 'from-red-600 via-rose-900 to-black',
        icon: '🪘',
        tag: 'TRADIÇÃO'
    },
    {
        id: 'samba-roda-bahia',
        name: 'Samba de Roda da Bahia',
        genre: 'Bahia Roots',
        description: 'A verdadeira raiz baiana com palmas, viola e muita alegria.',
        videoId: 'jfKfPfyJRdk',
        bgGradient: 'from-yellow-600 via-amber-900 to-black',
        icon: '🌴',
        tag: 'BAHIA'
    },
    {
        id: 'forro-pe-de-serra',
        name: 'Forró Pé de Serra & Piseiro',
        genre: 'Forró',
        description: 'Sanfona, zabumba e triângulo para acelerar o passo no cardio.',
        videoId: '60ItHLz5WEA',
        bgGradient: 'from-emerald-600 via-teal-900 to-black',
        icon: '🪗',
        tag: 'FORROZÃO'
    },
    {
        id: 'sertanejo-raiz',
        name: 'Sertanejo Universitário & Modão',
        genre: 'Sertanejo',
        description: 'Os maiores sucessos do sertanejo para cantar junto treinando.',
        videoId: '9bZkp7q19f0',
        bgGradient: 'from-blue-600 via-indigo-900 to-black',
        icon: '🤠',
        tag: 'MODÃO'
    },
    {
        id: 'axe-music',
        name: 'Axé Music Anos 90 & 2000',
        genre: 'Axé',
        description: 'Carnaval o ano inteiro com os clássicos elétricos da Bahia.',
        videoId: 'C0KWj0V_JJc',
        bgGradient: 'from-cyan-600 via-blue-900 to-black',
        icon: '☀️',
        tag: 'CARNAVAL'
    },
    {
        id: 'mpb-classicos',
        name: 'MPB Essencial',
        genre: 'MPB',
        description: 'Melodias refinadas e grandes vozes da música popular brasileira.',
        videoId: '5qap5aO4i9A',
        bgGradient: 'from-purple-600 via-indigo-900 to-black',
        icon: '🎙️',
        tag: 'CLASSIC'
    },
    {
        id: 'rap-trap-nacional',
        name: 'Rap & Trap Nacional Workout',
        genre: 'Rap/Trap',
        description: 'Batidas pesadas e flows intensos para foco máximo na musculação.',
        videoId: 'V-_O7nl0Ii0',
        bgGradient: 'from-zinc-700 via-zinc-900 to-black',
        icon: '🎤',
        tag: 'FOCO TOTAL'
    }
];

export function MusicRadioView({ onBack, onToggleMenu }: { onBack: () => void, onToggleMenu?: () => void }) {
    const [activeChannel, setActiveChannel] = useState<RadioChannel>(RADIO_CHANNELS[0]);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [aiStationName, setAiStationName] = useState<string | null>(null);
    const [aiVideoId, setAiVideoId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const handleSelectChannel = (channel: RadioChannel) => {
        setActiveChannel(channel);
        setAiStationName(null);
        setAiVideoId(null);
        setIsPlaying(true);
    };

    const handleGenerateAiStation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setTimeout(() => {
            setAiStationName(aiPrompt.toUpperCase());
            // Select based on keyword or default video
            const query = aiPrompt.toLowerCase();
            let vid = '7ytgueWKpbY';
            if (query.includes('samba') || query.includes('pagode')) vid = '5qap5aO4i9A';
            else if (query.includes('forro') || query.includes('piseiro')) vid = '60ItHLz5WEA';
            else if (query.includes('trap') || query.includes('rap')) vid = 'V-_O7nl0Ii0';
            else if (query.includes('sertanejo')) vid = '9bZkp7q19f0';
            else if (query.includes('axe') || query.includes('axé')) vid = 'C0KWj0V_JJc';
            
            setAiVideoId(vid);
            setIsGenerating(false);
            setIsPlaying(true);
        }, 800);
    };

    const currentVid = aiVideoId || activeChannel.videoId;
    const currentName = aiStationName || activeChannel.name;
    const currentGenre = aiStationName ? 'Rádio Gerada por IA' : activeChannel.genre;

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 pb-28 max-w-7xl mx-auto flex flex-col items-center animate-fadeIn">
            {/* Header */}
            <header className="w-full flex justify-between items-center mb-6">
                <button 
                    onClick={onBack}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-lg flex items-center gap-2"
                >
                    <ArrowLeft size={20} />
                    <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Voltar</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                        <Radio size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest italic text-white">Rádios & Músicas ABFIT</h1>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Looper 24h Sem Anúncios</p>
                    </div>
                </div>
                {onToggleMenu && (
                    <button onClick={onToggleMenu} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-lg">
                        <Disc size={20} />
                    </button>
                )}
            </header>

            {/* Now Playing Active Player */}
            <div className="w-full max-w-3xl bg-zinc-900/90 border border-zinc-800 rounded-[2.5pfx] sm:rounded-[3rem] p-6 mb-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-zinc-700/50 flex flex-col items-center justify-center relative shadow-2xl shrink-0 overflow-hidden group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${aiStationName ? 'from-purple-600/30 to-pink-600/30' : activeChannel.bgGradient} opacity-40 group-hover:scale-105 transition-transform duration-700`}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Disc size={72} className={`text-white/20 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                        </div>
                        <span className="text-4xl relative z-10 mb-1">{aiStationName ? '✨' : activeChannel.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white bg-black/60 px-3 py-1 rounded-full relative z-10 border border-white/10">
                            {isPlaying ? 'AO VIVO' : 'PAUSADO'}
                        </span>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest italic animate-pulse">
                                {aiStationName ? 'ESTAÇÃO PERSONALIZADA' : activeChannel.tag}
                            </span>
                            <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest">• {currentGenre}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-wider text-white mb-2 leading-tight">
                            {currentName}
                        </h2>
                        <p className="text-xs text-zinc-400 font-medium mb-4 line-clamp-2">
                            {aiStationName ? `Estação gerada com inteligência artificial para o seu ritmo de treino.` : activeChannel.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-wider text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 active:scale-95"
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                <span>{isPlaying ? 'Pausar Rádio' : 'Ouvir Rádio'}</span>
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-2xl text-zinc-300 text-xs font-bold uppercase tracking-wider">
                                <Volume2 size={16} className="text-red-500 animate-bounce" />
                                <span>Looping Contínuo 24h</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden / Active YouTube Audio Embed Player */}
                {isPlaying && (
                    <div className="mt-6 w-full h-24 bg-black/80 rounded-2xl overflow-hidden border border-zinc-800 relative flex items-center justify-center">
                        <iframe 
                            src={`https://www.youtube-nocookie.com/embed/${currentVid}?autoplay=1&loop=1&playlist=${currentVid}&controls=1&modestbranding=1&rel=0`} 
                            title={currentName}
                            className="w-full h-full opacity-90"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>

            {/* AI Radio Generator Box */}
            <div className="w-full max-w-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 mb-8 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase italic tracking-wider text-white">Criar Rádio com Inteligência Artificial</h3>
                        <p className="text-[10px] text-zinc-400">Digite qualquer estilo, artista ou ritmo para a IA sintonizar a trilha sonora perfeita.</p>
                    </div>
                </div>

                <form onSubmit={handleGenerateAiStation} className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ex: Pagode 90s, Trap pesado de treino, Samba rock animado..."
                        className="flex-1 bg-black/60 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 font-bold uppercase"
                    />
                    <button 
                        type="submit"
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase italic tracking-wider text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span>Sintonizar IA</span>
                    </button>
                </form>
            </div>

            {/* Radio Stations Grid */}
            <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Headphones size={18} className="text-red-500" />
                        <h3 className="text-xs font-black uppercase italic tracking-widest text-zinc-300">Estações de Rádio Disponíveis ({RADIO_CHANNELS.length})</h3>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Toque em qualquer estação para alternar instantaneamente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {RADIO_CHANNELS.map((channel) => {
                        const isSelected = activeChannel.id === channel.id && !aiStationName;
                        return (
                            <div 
                                key={channel.id}
                                onClick={() => handleSelectChannel(channel)}
                                className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden shadow-xl
                                    ${isSelected 
                                        ? 'bg-zinc-900 border-red-600 shadow-red-600/20 scale-[1.02]' 
                                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                                    }`}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${channel.bgGradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                                
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-2xl shadow-inner">
                                            {channel.icon}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border
                                            ${isSelected ? 'bg-red-600 text-white border-red-500' : 'bg-black/40 text-zinc-400 border-zinc-800'}
                                        `}>
                                            {channel.tag}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block mb-1">{channel.genre}</span>
                                    <h4 className="text-sm font-black uppercase italic tracking-wide text-white mb-2 leading-tight group-hover:text-red-400 transition-colors">
                                        {channel.name}
                                    </h4>
                                    <p className="text-[11px] text-zinc-400 font-medium line-clamp-2 mb-4">
                                        {channel.description}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                        <Radio size={12} className={isSelected && isPlaying ? 'text-red-500 animate-pulse' : 'text-zinc-600'} />
                                        {isSelected && isPlaying ? 'Tocando Agora' : 'Sintonizar'}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                                        ${isSelected && isPlaying ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}
                                    `}>
                                        {isSelected && isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
