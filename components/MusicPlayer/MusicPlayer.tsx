import React, { useState, useEffect, useMemo } from 'react';
import { musicCategories, MusicCategory, Song } from '../../data/musicData';
import { audioService, AudioPlayerState } from '../../services/youtubeAudioService';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Clock, 
  Disc3, 
  Music2, 
  Flame,
  Maximize2,
  Minimize2,
  Tv
} from 'lucide-react';

interface MusicPlayerProps {
  onBack?: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ onBack }) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>(audioService.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'tudo' | 'estilos' | 'musicas' | 'favoritos'>('tudo');

  // Subscrever ao estado global do player de áudio
  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setPlayerState({ ...state });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const {
    currentSong,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    favorites,
    selectedCategory,
    showMiniVideo,
    playbackKey
  } = playerState;

  // Saudação no estilo Spotify
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Formatação de minutos:segundos
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Categorias filtradas por busca
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return musicCategories;
    const q = searchQuery.toLowerCase();
    return musicCategories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.songs.some(s => s.title.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const allSongsFlat = useMemo(() => {
    return musicCategories.flatMap(c => c.songs.map(s => ({ ...s, categoryName: c.name, categoryId: c.id })));
  }, []);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return allSongsFlat;
    const q = searchQuery.toLowerCase();
    return allSongsFlat.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.artist?.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q)
    );
  }, [allSongsFlat, searchQuery]);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white select-none pb-36 font-sans">
      
      {/* ========================================================= */}
      {/* NÓ DE ÁUDIO/VÍDEO NATIVO DO YOUTUBE COM SUPORTE AUTOPLAY  */}
      {/* ========================================================= */}
      {currentSong && (
        <div 
          className={`fixed transition-all duration-300 z-50 overflow-hidden shadow-2xl ${
            showMiniVideo
              ? 'bottom-28 right-4 w-72 h-44 rounded-2xl border-2 border-red-600 bg-black shadow-red-950/80'
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
                className="text-zinc-400 hover:text-white p-0.5"
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
      )}

      {/* ========================================================= */}
      {/* BARRA SUPERIOR DE NAVEGAÇÃO (ESTILO SPOTIFY)              */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Botão de Retorno ao Dashboard ABFIT */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 shadow-md flex items-center gap-1.5 group cursor-pointer"
              title="Voltar ao Painel"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline pr-1">Painel ABFIT</span>
            </button>
          )}

          {/* Navegação Interna Spotify (< e >) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => audioService.setSelectedCategory(null)}
              disabled={!selectedCategory}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                selectedCategory 
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer' 
                  : 'bg-zinc-900/40 text-zinc-600 cursor-not-allowed'
              }`}
              title="Voltar ao início do ABFIT Music"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled
              className="w-8 h-8 rounded-full bg-zinc-900/40 text-zinc-600 flex items-center justify-center cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Logo / Badge ABFIT MUSIC */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950/60">
              <Disc3 size={18} className={`text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black italic tracking-widest text-white">ABFIT</span>
                <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-500 border border-red-500/30">MUSIC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca (Estilo Spotify Search) */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você quer ouvir no treino?"
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Ações Rápidas (Favoritos + Mini Vídeo Toggle) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => audioService.toggleMiniVideo()}
            className={`p-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
              showMiniVideo 
                ? 'bg-red-600 text-white border-red-500' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
            title="Alternar Modo Vídeo/Clipe"
          >
            <Tv size={16} />
          </button>

          <button
            onClick={() => audioService.playFavorites()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:border-red-600/60 transition-all active:scale-95 cursor-pointer"
            title="Tocar Músicas Curtidas"
          >
            <Heart size={14} className={favorites.length > 0 ? 'text-red-500 fill-red-500' : 'text-zinc-400'} />
            <span className="hidden md:inline">{favorites.length} curtidas</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* CORPO PRINCIPAL: TELA DE PLAYLIST OU HOME SPOTIFY          */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6">

        {/* VISTA 1: DETALHE DA PLAYLIST / ESTILO SELECIONADO */}
        {selectedCategory ? (
          <div>
            {/* HERO DA PLAYLIST (GRADIENTE + CAPA GIGANTE + DADOS) */}
            <div className={`rounded-3xl p-6 md:p-8 bg-gradient-to-b ${selectedCategory.gradient || 'from-red-900 via-zinc-900 to-zinc-950'} border border-zinc-800/80 shadow-2xl relative overflow-hidden mb-8`}>
              <div className="absolute top-4 left-4">
                <button
                  onClick={() => audioService.setSelectedCategory(null)}
                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} /> Voltar ao Início
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-10 md:pt-6">
                {/* Capa da Playlist */}
                <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 shrink-0 group">
                  <img
                    src={`https://img.youtube.com/vi/${selectedCategory.songs[0]?.id || ''}/hqdefault.jpg`}
                    alt={selectedCategory.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-black/80 px-2 py-0.5 rounded">
                      ABFIT
                    </span>
                  </div>
                </div>

                {/* Informações da Playlist */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80 mb-2">
                    PLAYLIST OFICIAL DE TREINO
                  </p>
                  <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-white mb-3">
                    {selectedCategory.name}
                  </h1>
                  <p className="text-xs md:text-sm text-zinc-300 max-w-2xl leading-relaxed mb-4">
                    {selectedCategory.description || 'Ritmo dinâmico e batidas energéticas curadas pela ABFIT para potencializar seu rendimento nos treinos.'}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-zinc-400">
                    <span className="text-white font-bold">ABFIT Music</span>
                    <span>•</span>
                    <span>{selectedCategory.songs.length} faixas</span>
                    <span>•</span>
                    <span className="text-red-400 font-medium">Treino de Alta Performance</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação da Playlist */}
              <div className="flex items-center gap-4 mt-8 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    const isCurrentCategoryPlaying = isPlaying && queue.some(s => selectedCategory.songs.some(cs => cs.id === s.id));
                    if (isCurrentCategoryPlaying) {
                      audioService.togglePlay();
                    } else {
                      audioService.playCategory(selectedCategory);
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-950/80 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Reproduzir Playlist"
                >
                  {isPlaying && queue.some(s => selectedCategory.songs.some(cs => cs.id === s.id)) ? (
                    <Pause size={26} className="fill-white" />
                  ) : (
                    <Play size={26} className="fill-white translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => audioService.toggleShuffle()}
                  className={`p-3 rounded-full border transition-all cursor-pointer ${
                    shuffle 
                      ? 'bg-red-600/20 border-red-500 text-red-500 shadow-md shadow-red-950/40' 
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                  title="Modo Aleatório"
                >
                  <Shuffle size={20} />
                </button>

                <button
                  onClick={() => audioService.playFavorites()}
                  className="p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-zinc-700 transition-all cursor-pointer"
                  title="Músicas Curtidas"
                >
                  <Heart size={20} />
                </button>
              </div>
            </div>

            {/* TABELA DE MÚSICAS (TRACKLIST SPOTIFY) */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-6 mb-8 backdrop-blur-md">
              <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800/80 pb-3 mb-2 px-3">
                <span className="col-span-1 text-center">#</span>
                <span className="col-span-8 md:col-span-7">TÍTULO</span>
                <span className="col-span-3 md:col-span-3 hidden md:block">ARTISTA / VIBE</span>
                <span className="col-span-3 md:col-span-1 text-right flex items-center justify-end">
                  <Clock size={14} />
                </span>
              </div>

              <div className="space-y-1">
                {selectedCategory.songs.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isFav = favorites.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => audioService.playSong(song, selectedCategory.songs)}
                      className={`grid grid-cols-12 items-center px-3 py-3 rounded-xl cursor-pointer transition-all group ${
                        isCurrent 
                          ? 'bg-red-950/50 border border-red-600/50 text-white shadow-inner' 
                          : 'hover:bg-zinc-800/50 border border-transparent text-zinc-300'
                      }`}
                    >
                      {/* Número da faixa ou Play/Equalizador */}
                      <div className="col-span-1 flex items-center justify-center">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-red-500 animate-pulse h-full rounded" />
                            <span className="w-1 bg-red-500 animate-pulse h-2 rounded" style={{ animationDelay: '200ms' }} />
                            <span className="w-1 bg-red-500 animate-pulse h-3 rounded" style={{ animationDelay: '400ms' }} />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-zinc-500 group-hover:hidden">
                            {index + 1}
                          </span>
                        )}
                        <Play size={14} className="hidden group-hover:block text-white fill-white" />
                      </div>

                      {/* Capa + Título */}
                      <div className="col-span-8 md:col-span-7 flex items-center gap-3 pr-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/50 relative">
                          <img
                            src={`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs md:text-sm font-bold truncate ${isCurrent ? 'text-red-500 font-black' : 'text-white'}`}>
                            {song.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {song.artist || selectedCategory.name}
                          </p>
                        </div>
                      </div>

                      {/* Vibe / Artista */}
                      <div className="col-span-3 hidden md:block text-xs text-zinc-400 truncate">
                        {selectedCategory.name}
                      </div>

                      {/* Ações (Coração + Duração) */}
                      <div className="col-span-3 md:col-span-1 flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audioService.toggleFavorite(song.id);
                          }}
                          className="p-1 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                          title="Favoritar"
                        >
                          <Heart 
                            size={16} 
                            className={isFav ? 'text-red-500 fill-red-500' : 'opacity-0 group-hover:opacity-100'} 
                          />
                        </button>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {isCurrent && duration > 0 ? formatTime(duration) : 'Treino'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* VISTA 2: HOME DO SPOTIFY COM AS CORES DA ABFIT */
          <div className="space-y-8">
            {/* Header com Saudação & Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black italic tracking-tight text-white flex items-center gap-2">
                  <span>{greeting}</span>
                  <span className="text-red-600">⚡</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Selecione sua trilha sonora e turbine o foco no treino de hoje.
                </p>
              </div>

              {/* Filtros em Pílula */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['tudo', 'estilos', 'musicas', 'favoritos'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => {
                      setActiveFilter(filter);
                      if (filter === 'favoritos') audioService.playFavorites();
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-red-600 text-white shadow-lg shadow-red-950/60'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {filter === 'tudo' ? 'Tudo' : filter === 'estilos' ? 'Estilos' : filter === 'musicas' ? 'Músicas' : `Curtidas (${favorites.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID DE ACESSO RÁPIDO DO SPOTIFY (GRID DE 6 CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCategories.slice(0, 6).map(cat => {
                const isCatPlaying = isPlaying && queue.some(s => cat.songs.some(cs => cs.id === s.id));

                return (
                  <div
                    key={cat.id}
                    onClick={() => audioService.playCategory(cat)}
                    className="group relative flex items-center bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl overflow-hidden cursor-pointer transition-all shadow-md active:scale-[0.99]"
                  >
                    {/* Thumbnail Quadrada à Esquerda */}
                    <div className="w-16 h-16 shrink-0 relative bg-zinc-800 overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${cat.songs[0]?.id || ''}/mqdefault.jpg`}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e: any) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Título Central */}
                    <div className="flex-1 px-4 min-w-0">
                      <p className="text-xs md:text-sm font-black italic tracking-wide text-white truncate group-hover:text-red-400 transition-colors">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {cat.songs.length} {cat.songs.length === 1 ? 'música' : 'músicas'}
                      </p>
                    </div>

                    {/* Botão Flutuante Redondo Vermelho que surge no Hover */}
                    <div className="pr-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          audioService.playCategory(cat);
                        }}
                        className={`w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-black/80 transition-all cursor-pointer ${
                          isCatPlaying 
                            ? 'opacity-100 scale-100' 
                            : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                        }`}
                      >
                        {isCatPlaying ? (
                          <Pause size={18} className="fill-white" />
                        ) : (
                          <Play size={18} className="fill-white translate-x-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SEÇÃO 1: "FEITO PARA O SEU TREINO" (CARDS MODERNOS SPOTIFY) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-red-500" />
                  <h2 className="text-lg md:text-xl font-black italic uppercase tracking-wider text-white">
                    Feito para o seu Treino
                  </h2>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  ABFIT Curadoria
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredCategories.map(cat => {
                  const isCatActive = queue.some(s => cat.songs.some(cs => cs.id === s.id));

                  return (
                    <div
                      key={cat.id}
                      onClick={() => audioService.setSelectedCategory(cat)}
                      className="group relative bg-zinc-900/60 hover:bg-zinc-800/80 p-3.5 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all duration-300 cursor-pointer shadow-lg flex flex-col justify-between"
                    >
                      {/* Capa com Botão de Play que sobrepõe */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800 shadow-md">
                        <img
                          src={`https://img.youtube.com/vi/${cat.songs[0]?.id || ''}/hqdefault.jpg`}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e: any) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                        {/* Botão de Play Flutuante */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audioService.playCategory(cat);
                          }}
                          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-black/80 transition-all cursor-pointer ${
                            isCatActive && isPlaying 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105'
                          }`}
                        >
                          {isCatActive && isPlaying ? (
                            <Pause size={18} className="fill-white" />
                          ) : (
                            <Play size={18} className="fill-white translate-x-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Textos do Card */}
                      <div className="mt-3">
                        <h3 className="text-xs md:text-sm font-black italic text-white group-hover:text-red-400 transition-colors truncate">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-tight">
                          {cat.description || 'Série de faixas com ritmo constante para treino.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO 2: "TODAS AS FAIXAS DISPONÍVEIS" */}
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-5 md:p-7 backdrop-blur-md">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Music2 size={18} className="text-red-500" />
                  <h3 className="text-base font-black italic uppercase tracking-wider text-white">
                    Todas as Músicas Prescritas
                  </h3>
                </div>
                <span className="text-xs text-zinc-400 font-bold">
                  {filteredSongs.length} músicas no catálogo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredSongs.map(song => {
                  const isCurrent = currentSong?.id === song.id;
                  const isFav = favorites.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        const parentCat = musicCategories.find(c => c.id === song.categoryId) || musicCategories[0];
                        audioService.playSong(song, parentCat.songs);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                        isCurrent 
                          ? 'bg-red-950/50 border-red-600/50 text-white shadow-inner' 
                          : 'bg-zinc-900/60 border-zinc-800/40 hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 relative">
                          <img
                            src={`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400 font-black' : 'text-white'}`}>
                            {song.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {song.categoryName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          audioService.toggleFavorite(song.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Heart size={16} className={isFav ? 'text-red-500 fill-red-500' : ''} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* PLAYER FLUTUANTE FIXO INFERIOR (O PLAYER DO SPOTIFY)     */}
      {/* ========================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-2xl px-4 md:px-6 py-2.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
          
          {/* Esquerda: Informações da Faixa Atual */}
          <div className="w-full md:w-1/4 flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                onClick={() => audioService.toggleMiniVideo()}
                className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 shadow-md relative cursor-pointer group"
                title="Clique para alternar visualização do vídeo"
              >
                {currentSong ? (
                  <img
                    src={`https://img.youtube.com/vi/${currentSong.id}/mqdefault.jpg`}
                    alt={currentSong.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Disc3 size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={14} className="text-white" />
                </div>
                {isPlaying && (
                  <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-600 animate-ping" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentSong ? currentSong.title : 'Selecione uma faixa'}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {currentSong ? (currentSong.artist || 'ABFIT Music') : 'Pronto para treinar'}
                </p>
              </div>
            </div>

            {currentSong && (
              <button
                onClick={() => audioService.toggleFavorite(currentSong.id)}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                title="Favoritar"
              >
                <Heart 
                  size={18} 
                  className={favorites.includes(currentSong.id) ? 'text-red-500 fill-red-500' : ''} 
                />
              </button>
            )}
          </div>

          {/* Centro: Controles de Reprodução + Barra de Progresso */}
          <div className="w-full md:w-2/4 flex flex-col items-center">
            <div className="flex items-center gap-5 mb-1.5">
              {/* Botão Aleatório */}
              <button
                onClick={() => audioService.toggleShuffle()}
                className={`p-1.5 rounded-full transition-colors relative cursor-pointer ${
                  shuffle ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Aleatório"
              >
                <Shuffle size={16} />
                {shuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500" />}
              </button>

              {/* Faixa Anterior */}
              <button
                onClick={() => audioService.handlePrevious()}
                className="text-zinc-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
                title="Anterior"
              >
                <SkipBack size={20} />
              </button>

              {/* Botão Play / Pause (Redondo Branco no estilo Spotify) */}
              <button
                onClick={() => audioService.togglePlay()}
                className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? (
                  <Pause size={20} className="fill-black" />
                ) : (
                  <Play size={20} className="fill-black translate-x-0.5" />
                )}
              </button>

              {/* Próxima Faixa */}
              <button
                onClick={() => audioService.handleNext()}
                className="text-zinc-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
                title="Próxima"
              >
                <SkipForward size={20} />
              </button>

              {/* Repetir */}
              <button
                onClick={() => audioService.toggleRepeat()}
                className={`p-1.5 rounded-full transition-colors relative cursor-pointer ${
                  repeat ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Repetir"
              >
                <Repeat size={16} />
                {repeat && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500" />}
              </button>
            </div>

            {/* Barra de Progresso com Tempo */}
            <div className="w-full max-w-md flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <span className="w-8 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 180}
                value={currentTime}
                onChange={(e) => audioService.seekTo(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-zinc-800 accent-red-600 rounded-lg cursor-pointer hover:h-1.5 transition-all"
              />
              <span className="w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Direita: Volume & Mini Vídeo */}
          <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
            <button
              onClick={() => audioService.toggleMiniVideo()}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showMiniVideo ? 'text-red-500 bg-red-950/40' : 'text-zinc-400 hover:text-white'
              }`}
              title="Mini Player de Vídeo"
            >
              <Tv size={18} />
            </button>

            <button 
              onClick={() => audioService.toggleMute()}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Silenciar"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => audioService.setVolume(parseInt(e.target.value, 10))}
              className="w-20 h-1 bg-zinc-800 accent-red-600 rounded-lg cursor-pointer hover:h-1.5 transition-all"
            />
          </div>

        </div>
      </footer>
    </div>
  );
};

export default MusicPlayer;
