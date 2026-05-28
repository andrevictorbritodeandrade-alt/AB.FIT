
import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Heart, Zap, MapPin, Activity, Clock, Menu, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, HeaderTitle, AppFooter, BackgroundCarousel, FITNESS_IMAGES } from './Layout';
import { WorkoutHistoryEntry } from '../types';

export function WorkoutFeed({ history, onBack, onToggleMenu, isProfessor = false, onAddPost }: { history: WorkoutHistoryEntry[], onBack: () => void, onToggleMenu?: () => void, isProfessor?: boolean, onAddPost?: (post: WorkoutHistoryEntry) => void }) {
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!postText.trim() && !postImage) return;
    
    setIsPosting(true);
    const newPost: WorkoutHistoryEntry = {
      id: Date.now().toString(),
      name: postText.trim() || 'Atualização de Performance',
      duration: '0min',
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now(),
      type: 'POST',
      photoUrl: postImage || undefined,
      text: postText.trim()
    };

    if (onAddPost) {
      onAddPost(newPost);
    }
    
    setPostText('');
    setPostImage(null);
    setIsPosting(false);
  };

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-transparent relative animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          {onToggleMenu && (
            <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
              <Menu size={20}/>
            </button>
          )}
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
            <ArrowLeft size={20}/>
          </button>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text={isProfessor ? "Feed Global ABFIT" : "Meu Feed ABFIT"} />
        </h2>
      </header>

      <div className="max-w-xl mx-auto space-y-10">
        
        {/* Post Creation Area */}
        {!isProfessor && onAddPost && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex flex-col gap-3">
              <textarea 
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Compartilhe seu treino, tempo ou foto..." 
                className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-red-600/50 resize-none min-h-[80px]"
              />
              
              {postImage && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10">
                  <img src={postImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPostImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <ArrowLeft size={14} className="rotate-45" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <ImageIcon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Foto</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                
                <button 
                  onClick={handlePost}
                  disabled={isPosting || (!postText.trim() && !postImage)}
                  className="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publicar
                </button>
              </div>
            </div>
          </Card>
        )}

        {history.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <Camera size={64} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro visual ainda</p>
          </div>
        ) : (
          history.map((post) => (
            <div key={post.id} className="animate-in slide-in-from-bottom-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black italic text-xs border border-white/10 shadow-lg shrink-0">
                  {(post.athleteName || post.name).substring(0, 1)}
                </div>
                <div className="min-w-0">
                  {isProfessor && post.athleteName ? (
                    <>
                      <h4 className="text-[12px] font-black uppercase italic text-red-600 tracking-tight leading-none mb-1">{post.athleteName}</h4>
                      <p className="text-[9px] text-white font-black uppercase italic truncate">{post.name}</p>
                    </>
                  ) : (
                    <h4 className="text-[11px] font-black uppercase italic text-white tracking-tight">{post.name}</h4>
                  )}
                  <p className="text-[8px] text-zinc-500 font-bold uppercase">{post.date} • {post.type === 'RUNNING' ? 'CORRIDA' : post.type === 'POST' ? 'ATUALIZAÇÃO' : 'FORÇA'}</p>
                </div>
              </div>

              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden shadow-2xl">
                {post.text && (
                  <div className="p-6 bg-zinc-900 border-b border-white/5">
                    <p className="text-sm text-white whitespace-pre-wrap">{post.text}</p>
                  </div>
                )}
                
                {post.photoUrl ? (
                  <div className="aspect-square w-full bg-zinc-800 relative">
                    <img src={post.photoUrl} className="w-full h-full object-cover" alt="Workout Selfie" />
                    {post.type !== 'POST' && (
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex gap-4">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-red-500 uppercase">Duração</span>
                            <span className="text-sm font-black italic text-white">{post.duration}</span>
                          </div>
                          {post.runningStats?.distance && (
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black text-red-500 uppercase">Distância</span>
                              <span className="text-sm font-black italic text-white">{post.runningStats.distance}km</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : post.type !== 'POST' ? (
                  <div className="p-6 bg-zinc-900 border-b border-white/5">
                    <div className="flex items-center gap-3 text-red-600 mb-2">
                      <Zap size={16} fill="currentColor" />
                      <span className="text-xs font-black uppercase italic">Missão Cumprida</span>
                    </div>
                    <p className="text-lg font-black italic uppercase text-white leading-none">{post.name}</p>
                    {post.exercises && (
                        <div className="mt-4 space-y-1">
                           {post.exercises.map((ex, i) => (
                              <div key={i} className="flex justify-between text-[10px] text-zinc-400 font-bold">
                                 <span>{ex.name}</span>
                                 <span>{ex.load} {ex.loadUnit || 'Kg'}</span>
                              </div>
                           ))}
                        </div>
                    )}
                    <p className="text-[9px] text-zinc-500 mt-2 font-bold uppercase italic">Treino finalizado com excelência técnica.</p>
                  </div>
                ) : null}

                <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 group">
                      <Heart size={18} className="text-zinc-500 group-hover:text-red-600 transition-colors" />
                      <span className="text-[9px] font-black text-zinc-500">RESPEITO</span>
                    </button>
                  </div>
                  {post.runningStats?.avgHR && (
                     <div className="flex items-center gap-2 text-red-500">
                        <Activity size={14} />
                        <span className="text-[10px] font-black">{post.runningStats.avgHR} BPM</span>
                     </div>
                  )}
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
      <AppFooter />
    </div>
  );
}
