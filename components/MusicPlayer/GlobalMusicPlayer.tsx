import React, { useState, useEffect } from 'react';
import { audioService, AudioPlayerState } from '../../services/youtubeAudioService';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Disc3, 
  Music2, 
  Maximize2, 
  Minimize2,
  Heart
} from 'lucide-react';

interface GlobalMusicPlayerProps {
  isFullPlayerOpen: boolean;
  onOpenFullPlayer: () => void;
}

export const GlobalMusicPlayer: React.FC<GlobalMusicPlayerProps> = ({
  isFullPlayerOpen,
  onOpenFullPlayer
}) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>(audioService.getState());

  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setPlayerState({ ...state });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const { currentSong, isPlaying, currentTime, duration, showMiniVideo, playbackKey } = playerState;

  // Conectar API do YouTube ao iframe quando montado ou alterar música
  useEffect(() => {
    if (currentSong) {
      const timer = setTimeout(() => {
        audioService.attachYouTubePlayer('abfit-main-youtube-frame');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentSong?.id, playbackKey]);

  if (!currentSong) return null;

  return (
    <>
      {/* ========================================================= */}
      {/* NÓ DE ÁUDIO/VÍDEO NATIVO DO YOUTUBE PERMANENTE            */}
      {/* ========================================================= */}
      <div 
        className={`fixed transition-all duration-300 z-[100] overflow-hidden shadow-2xl ${
          showMiniVideo
            ? 'bottom-24 right-4 w-72 h-44 rounded-2xl border-2 border-red-600 bg-black shadow-red-950/80'
            : 'bottom-0 right-0 w-[2px] h-[2px] opacity-[0.01] pointer-events-none'
        }`}
      >
        {showMiniVideo && (
          <div className="bg-zinc-900 px-3 py-1.5 flex items-center justify-between border-b border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-500 truncate max-w-[180px]">
              {currentSong.title}
            </span>
            <button 
              onClick={() => audioService.toggleMiniVideo()}
              className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
              title="Minimizar vídeo"
            >
              <Minimize2 size={14} />
            </button>
          </div>
        )}
        <iframe
          id="abfit-main-youtube-frame"
          key={`${currentSong.id}-${playbackKey}`}
          src={`https://www.youtube.com/embed/${currentSong.id}?enablejsapi=1&autoplay=${isPlaying ? '1' : '0'}&playsinline=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title="ABFIT Music Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* ========================================================= */}
      {/* MINI PLAYER FLUTUANTE GLOBAL (EXIBIDO QUANDO FORA DO PLAYER) */}
      {/* ========================================================= */}
      {!isFullPlayerOpen && (
        <div 
          onClick={onOpenFullPlayer}
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-96 z-50 bg-zinc-900/95 border-2 border-red-600/80 hover:border-red-500 rounded-2xl p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.95)] backdrop-blur-xl flex items-center justify-between gap-3 cursor-pointer group transition-all duration-300 active:scale-[0.99] select-none"
        >
          {/* Thin Red Progress Line at the bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/80 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
              style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
            />
          </div>

          {/* Left: Thumbnail + Titles */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/80 shrink-0 shadow-md">
              <img 
                src={`https://img.youtube.com/vi/${currentSong.id}/hqdefault.jpg`} 
                alt={currentSong.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                {isPlaying ? (
                  <Disc3 size={20} className="text-red-500 animate-spin" />
                ) : (
                  <Music2 size={18} className="text-zinc-300" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-950/60 border border-red-800/40 px-1.5 py-0.2 rounded-full leading-none">
                  Tocando
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5 text-red-500">
                    <span className="w-1 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-3.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
              <h4 className="text-xs font-black italic uppercase text-white tracking-tight truncate group-hover:text-red-400 transition-colors">
                {currentSong.title}
              </h4>
              <p className="text-[10px] font-semibold text-zinc-400 truncate">
                {currentSong.artist || 'ABFIT Music'}
              </p>
            </div>

            {/* Curtir / Descurtir */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                audioService.toggleFavorite(currentSong.id, currentSong);
              }}
              className="p-1.5 text-zinc-400 hover:text-red-500 transition-all rounded-full hover:bg-zinc-800/80 active:scale-125 cursor-pointer shrink-0"
              title={playerState.favorites.includes(currentSong.id) ? 'Remover das favoritas' : 'Curtir música (salvar nas favoritas)'}
            >
              <Heart
                size={16}
                className={playerState.favorites.includes(currentSong.id) ? 'text-red-500 fill-red-500 scale-110' : 'text-zinc-400 hover:text-white'}
              />
            </button>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => audioService.handlePrevious()}
              className="p-2 text-zinc-400 hover:text-white transition-colors active:scale-95 cursor-pointer rounded-full hover:bg-zinc-800"
              title="Anterior"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={() => audioService.togglePlay()}
              className="w-9 h-9 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? (
                <Pause size={16} className="fill-black" />
              ) : (
                <Play size={16} className="fill-black translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => audioService.handleNext()}
              className="p-2 text-zinc-400 hover:text-white transition-colors active:scale-95 cursor-pointer rounded-full hover:bg-zinc-800"
              title="Próxima"
            >
              <SkipForward size={16} />
            </button>

            <button
              onClick={onOpenFullPlayer}
              className="p-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer rounded-full hover:bg-red-950/40 ml-1"
              title="Expandir Player"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalMusicPlayer;
