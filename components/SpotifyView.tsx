import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Play, Headphones, AlertTriangle, Link as LinkIcon, Music } from 'lucide-react';

const SPOTIFY_DEFAULT_PLAYLISTS = [
    { id: '37i9dQZF1DX76Wlfdnj7AP', name: 'Treino Pesado (Rap/Trap)' },
    { id: '37i9dQZF1DWZq91oLsHZvy', name: 'Treino Pop & Eletrônica' },
    { id: '37i9dQZF1DX0aBhuElJFRM', name: 'Samba & Pagode' },
    { id: '37i9dQZF1DXcBWIGoYBM5M', name: 'Top Brasil' },
];

export function SpotifyView({ onBack }: { onBack: () => void }) {
    const [customUrl, setCustomUrl] = useState('');
    const [activeEmbed, setActiveEmbed] = useState<string>('37i9dQZF1DX76Wlfdnj7AP'); // Default to first playlist
    const [embedType, setEmbedType] = useState<'playlist' | 'track' | 'album' | 'show' | 'episode'>('playlist');

    const handleLoadCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customUrl) return;

        try {
            // Extract the ID and type from various Spotify URL formats
            // Example: https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP?si=...
            const url = new URL(customUrl);
            const pathParts = url.pathname.split('/').filter(Boolean);
            
            if (pathParts.length >= 2) {
                const type = pathParts[0] as any;
                const id = pathParts[1];
                if (['playlist', 'track', 'album', 'show', 'episode'].includes(type)) {
                    setEmbedType(type);
                    setActiveEmbed(id);
                    setCustomUrl('');
                    return;
                }
            }
            alert("URL do Spotify inválida. Copie o link direto de uma playlist, música ou álbum.");
        } catch (error) {
            alert("Formato de link inválido.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 pb-28 max-w-5xl mx-auto flex flex-col items-center animate-fadeIn">
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
                    <div className="w-10 h-10 rounded-2xl bg-[#1DB954] flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/30">
                        <Headphones size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest italic text-white">Spotify Free</h1>
                        <p className="text-[10px] font-bold text-[#1DB954] uppercase tracking-widest">Player Integrado</p>
                    </div>
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Aviso Técnico Importante (Sobre Extensões/Blockify e iFrames) */}
            <div className="w-full bg-blue-950/30 border border-blue-900/50 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center shrink-0 text-blue-400">
                    <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-1">Aviso sobre o Blockify</h3>
                    <p className="text-xs text-blue-200/70 leading-relaxed">
                        Extensões de navegador (como o <strong>Blockify</strong>) não têm permissão para atuar dentro de aplicativos embutidos (iFrames). O Spotify também bloqueia o espelhamento completo da sua página web por motivos de segurança.
                        Para usar a interface completa do Spotify com o Blockify bloqueando anúncios, abra no botão abaixo.
                    </p>
                </div>
                <a 
                    href="https://open.spotify.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                    Abrir Spotify Web
                    <ExternalLink size={16} />
                </a>
            </div>

            {/* Inserir URL Customizada */}
            <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 mb-8">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LinkIcon size={16} className="text-[#1DB954]" />
                    Tocar sua própria Playlist ou Música
                </h3>
                <form onSubmit={handleLoadCustom} className="flex flex-col sm:flex-row gap-3">
                    <input 
                        type="url" 
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="Cole o link do Spotify aqui (Ex: https://open.spotify.com/playlist/...)"
                        className="flex-1 bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#1DB954] transition-colors"
                    />
                    <button 
                        type="submit"
                        disabled={!customUrl.trim()}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all"
                    >
                        <Play size={16} className="text-[#1DB954]" />
                        Carregar
                    </button>
                </form>
            </div>

            {/* Playlists Rápidas */}
            <div className="w-full mb-6">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Playlists Recomendadas</h3>
                <div className="flex flex-wrap gap-3">
                    {SPOTIFY_DEFAULT_PLAYLISTS.map(playlist => (
                        <button
                            key={playlist.id}
                            onClick={() => {
                                setEmbedType('playlist');
                                setActiveEmbed(playlist.id);
                            }}
                            className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2
                                ${activeEmbed === playlist.id && embedType === 'playlist'
                                    ? 'bg-[#1DB954]/20 border-[#1DB954] text-[#1DB954]' 
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                                }`}
                        >
                            <Music size={14} />
                            {playlist.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Embed Player */}
            <div className="w-full bg-zinc-900 rounded-[2rem] overflow-hidden border-2 border-zinc-800 shadow-2xl">
                <iframe 
                    title="Spotify Web Player" 
                    src={`https://open.spotify.com/embed/${embedType}/${activeEmbed}?utm_source=generator&theme=0`}
                    width="100%" 
                    height="400" 
                    frameBorder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    className="w-full"
                    style={{ borderRadius: '12px' }}
                ></iframe>
            </div>

        </div>
    );
}
