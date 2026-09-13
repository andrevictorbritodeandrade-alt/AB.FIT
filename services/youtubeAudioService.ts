// =========================================================
// ABFIT YOUTUBE AUDIO & MEDIA SERVICE
// =========================================================
import { Song, MusicCategory, musicCategories } from '../data/musicData';

type StateListener = (state: AudioPlayerState) => void;

export interface AudioPlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: boolean;
  favorites: string[];
  selectedCategory: MusicCategory | null;
  showMiniVideo: boolean;
  playbackKey: number; // Força recarregamento instantâneo se necessário
}

class YouTubeAudioService {
  private timer: any = null;
  private listeners: Set<StateListener> = new Set();
  private ytPlayer: any = null;

  private state: AudioPlayerState = {
    currentSong: musicCategories[0]?.songs[0] || null,
    queue: musicCategories[0]?.songs || [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 90,
    isMuted: false,
    shuffle: false,
    repeat: false,
    favorites: [],
    selectedCategory: null,
    showMiniVideo: false,
    playbackKey: Date.now(),
  };

  constructor() {
    this.loadFavorites();
    if (typeof window !== 'undefined') {
      this.setupMessageListener();
      this.initYouTubeApiScript();
    }
  }

  private initYouTubeApiScript() {
    if (typeof window === 'undefined') return;
    if (!(window as any).YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }

  public attachYouTubePlayer(elementId: string) {
    if (typeof window === 'undefined') return;

    const init = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        try {
          const el = document.getElementById(elementId);
          if (!el) return;

          this.ytPlayer = new (window as any).YT.Player(elementId, {
            events: {
              onReady: (event: any) => {
                if (this.state.volume !== undefined) {
                  try { event.target.setVolume(this.state.volume); } catch (e) {}
                }
                if (this.state.isMuted) {
                  try { event.target.mute(); } catch (e) {}
                }
                this.updateTimeAndDuration();
              },
              onStateChange: (event: any) => {
                // 0 = Ended, 1 = Playing, 2 = Paused, 3 = Buffering
                if (event.data === 0) {
                  this.handleNext();
                } else if (event.data === 1) {
                  this.updateState({ isPlaying: true });
                  this.startProgressTimer();
                  this.updateTimeAndDuration();
                } else if (event.data === 2) {
                  this.updateState({ isPlaying: false });
                  this.stopProgressTimer();
                } else if (event.data === 3) {
                  this.updateTimeAndDuration();
                }
              }
            }
          });
        } catch (e) {
          console.warn('[ABFIT Music] Error initializing YT.Player:', e);
        }
      }
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      const prevOnReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prevOnReady === 'function') prevOnReady();
        init();
      };
      this.initYouTubeApiScript();
    } else {
      init();
    }
  }

  private loadFavorites() {
    try {
      const saved = localStorage.getItem('abfit-music-favorites');
      if (saved) {
        this.state.favorites = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ABFIT Music] Erro ao carregar favoritos:', e);
    }
  }

  private saveFavorites() {
    try {
      localStorage.setItem('abfit-music-favorites', JSON.stringify(this.state.favorites));
    } catch (e) {
      console.warn('[ABFIT Music] Erro ao salvar favoritos:', e);
    }
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.event === 'onStateChange') {
            // 0 = Ended, 1 = Playing, 2 = Paused, 3 = Buffering
            if (data.info === 0) {
              this.handleNext();
            } else if (data.info === 1) {
              this.updateState({ isPlaying: true });
              this.startProgressTimer();
            } else if (data.info === 2) {
              this.updateState({ isPlaying: false });
              this.stopProgressTimer();
            }
          } else if (data.event === 'infoDelivery' && data.info) {
            const updates: Partial<AudioPlayerState> = {};
            if (typeof data.info.currentTime === 'number') {
              updates.currentTime = Math.floor(data.info.currentTime);
            }
            if (typeof data.info.duration === 'number' && data.info.duration > 0) {
              updates.duration = Math.floor(data.info.duration);
            }
            if (Object.keys(updates).length > 0) {
              this.updateState(updates);
            }
          }
        }
      } catch (e) {
        // Ignora mensagens que não sejam do player
      }
    });
  }

  private sendIframeCommand(func: string, args: any[] = []) {
    try {
      const iframe = document.getElementById('abfit-main-youtube-frame') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      }
    } catch (e) {
      console.warn('[ABFIT Music] Command send error:', e);
    }
  }

  private updateTimeAndDuration() {
    if (this.ytPlayer && typeof this.ytPlayer.getDuration === 'function') {
      try {
        const dur = this.ytPlayer.getDuration();
        const cur = this.ytPlayer.getCurrentTime();
        const updates: Partial<AudioPlayerState> = {};

        if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
          updates.duration = Math.floor(dur);
        }
        if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
          updates.currentTime = Math.floor(cur);
        }

        if (Object.keys(updates).length > 0) {
          this.updateState(updates);
        }
      } catch (e) {}
    }
  }

  private startProgressTimer() {
    this.stopProgressTimer();
    this.timer = setInterval(() => {
      if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
        this.updateTimeAndDuration();
      } else {
        this.sendIframeCommand('getCurrentTime');
        this.sendIframeCommand('getDuration');
        // Incremento suave sem cap arbitrário em 180s
        if (this.state.isPlaying) {
          const nextTime = this.state.currentTime + 1;
          const maxDur = this.state.duration > 0 ? this.state.duration : 3600;
          this.updateState({
            currentTime: Math.min(nextTime, maxDur)
          });
        }
      }
    }, 1000);
  }

  private stopProgressTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateState(partial: Partial<AudioPlayerState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AudioPlayerState {
    return this.state;
  }

  public setSelectedCategory(category: MusicCategory | null) {
    this.updateState({ selectedCategory: category });
  }

  public toggleMiniVideo() {
    this.updateState({ showMiniVideo: !this.state.showMiniVideo });
  }

  public playSong(song: Song, newQueue?: Song[]) {
    const queue = newQueue || (this.state.queue.length > 0 ? this.state.queue : [song]);
    const isDifferent = this.state.currentSong?.id !== song.id;

    this.updateState({
      currentSong: song,
      queue,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      playbackKey: isDifferent ? Date.now() : this.state.playbackKey,
    });

    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function' && isDifferent) {
      try {
        this.ytPlayer.loadVideoById(song.id);
        if (this.state.volume !== undefined) {
          try { this.ytPlayer.setVolume(this.state.volume); } catch (e) {}
        }
      } catch (e) {}
    }

    this.startProgressTimer();

    // Envia comando para iniciar
    setTimeout(() => {
      if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
        try { this.ytPlayer.playVideo(); } catch (e) {}
      }
      this.sendIframeCommand('playVideo');
      this.sendIframeCommand('setVolume', [this.state.volume]);
      if (this.state.isMuted) {
        if (this.ytPlayer && typeof this.ytPlayer.mute === 'function') {
          try { this.ytPlayer.mute(); } catch (e) {}
        }
        this.sendIframeCommand('mute');
      } else {
        if (this.ytPlayer && typeof this.ytPlayer.unMute === 'function') {
          try { this.ytPlayer.unMute(); } catch (e) {}
        }
        this.sendIframeCommand('unMute');
      }
    }, 150);
  }

  public playCategory(category: MusicCategory) {
    this.updateState({ selectedCategory: category });
    if (category.songs.length > 0) {
      this.playSong(category.songs[0], category.songs);
    }
  }

  public playFavorites() {
    const allSongs = musicCategories.flatMap((c) => c.songs);
    const favSongs = allSongs.filter((s) => this.state.favorites.includes(s.id));
    if (favSongs.length > 0) {
      const favCategory: MusicCategory = {
        id: 'favoritos',
        name: 'Músicas Curtidas',
        description: 'Sua seleção pessoal de faixas favoritas para treinar.',
        color: '#dc2626',
        gradient: 'from-purple-900 via-red-900 to-zinc-950',
        songs: favSongs,
      };
      this.updateState({ selectedCategory: favCategory });
      this.playSong(favSongs[0], favSongs);
    }
  }

  public togglePlay() {
    if (!this.state.currentSong) {
      if (this.state.queue.length > 0) {
        this.playSong(this.state.queue[0]);
        return;
      }
      if (musicCategories.length > 0) {
        this.playCategory(musicCategories[0]);
        return;
      }
    }

    if (this.state.isPlaying) {
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try { this.ytPlayer.pauseVideo(); } catch (e) {}
      }
      this.sendIframeCommand('pauseVideo');
      this.updateState({ isPlaying: false });
      this.stopProgressTimer();
    } else {
      if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
        try { this.ytPlayer.playVideo(); } catch (e) {}
      }
      this.sendIframeCommand('playVideo');
      this.updateState({ isPlaying: true });
      this.startProgressTimer();
    }
  }

  public handleNext() {
    const { queue, currentSong, shuffle, repeat } = this.state;
    if (queue.length === 0) return;

    if (repeat && currentSong) {
      this.playSong(currentSong);
      return;
    }

    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    if (shuffle) {
      let nextIdx = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && nextIdx === currentIndex) {
        nextIdx = (nextIdx + 1) % queue.length;
      }
      this.playSong(queue[nextIdx]);
    } else {
      const nextIdx = (currentIndex + 1) % queue.length;
      this.playSong(queue[nextIdx]);
    }
  }

  public handlePrevious() {
    const { queue, currentSong, shuffle, currentTime } = this.state;
    if (queue.length === 0) return;

    if (currentTime > 4) {
      this.seekTo(0);
      return;
    }

    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    if (shuffle) {
      let prevIdx = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && prevIdx === currentIndex) {
        prevIdx = (prevIdx - 1 + queue.length) % queue.length;
      }
      this.playSong(queue[prevIdx]);
    } else {
      const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
      this.playSong(queue[prevIdx]);
    }
  }

  public seekTo(seconds: number) {
    const targetSec = Math.floor(seconds);
    this.updateState({ currentTime: targetSec });
    if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try { this.ytPlayer.seekTo(targetSec, true); } catch (e) {}
    }
    this.sendIframeCommand('seekTo', [targetSec, true]);
  }

  public setVolume(vol: number) {
    const isMuted = vol === 0;
    this.updateState({ volume: vol, isMuted });
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try { this.ytPlayer.setVolume(vol); } catch (e) {}
    }
    this.sendIframeCommand('setVolume', [vol]);
    if (isMuted) {
      if (this.ytPlayer && typeof this.ytPlayer.mute === 'function') {
        try { this.ytPlayer.mute(); } catch (e) {}
      }
      this.sendIframeCommand('mute');
    } else {
      if (this.ytPlayer && typeof this.ytPlayer.unMute === 'function') {
        try { this.ytPlayer.unMute(); } catch (e) {}
      }
      this.sendIframeCommand('unMute');
    }
  }

  public toggleMute() {
    const newMuted = !this.state.isMuted;
    this.updateState({ isMuted: newMuted });
    if (newMuted) {
      if (this.ytPlayer && typeof this.ytPlayer.mute === 'function') {
        try { this.ytPlayer.mute(); } catch (e) {}
      }
      this.sendIframeCommand('mute');
    } else {
      if (this.ytPlayer && typeof this.ytPlayer.unMute === 'function') {
        try { this.ytPlayer.unMute(); } catch (e) {}
      }
      this.sendIframeCommand('unMute');
      if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
        try { this.ytPlayer.setVolume(this.state.volume || 80); } catch (e) {}
      }
      this.sendIframeCommand('setVolume', [this.state.volume || 80]);
    }
  }

  public toggleShuffle() {
    this.updateState({ shuffle: !this.state.shuffle });
  }

  public toggleRepeat() {
    this.updateState({ repeat: !this.state.repeat });
  }

  public toggleFavorite(songId: string) {
    const exists = this.state.favorites.includes(songId);
    const updated = exists
      ? this.state.favorites.filter((id) => id !== songId)
      : [...this.state.favorites, songId];
    this.updateState({ favorites: updated });
    this.saveFavorites();
  }
}

export const audioService = new YouTubeAudioService();
