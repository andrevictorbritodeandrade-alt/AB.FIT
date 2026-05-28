
import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare, Smartphone, MoreVertical } from 'lucide-react';

export function InstallPrompt({ onClose }: { onClose: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(checkStandalone);

    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isDesktop = !/android|iphone|ipad|ipod/.test(userAgent);

    if (isIos) {
        setPlatform('ios');
    } else if (isDesktop) {
        setPlatform('desktop');
    }

    // Listener para o evento de instalação (Chrome/Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isIos) setPlatform(isDesktop ? 'desktop' : 'android');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      // Se não houver prompt automático (ex: Firefox ou Safari), não faz nada aqui, a UI deve mostrar instruções manuais.
    }
  };

  if (isStandalone) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-4 animate-in fade-in duration-500">
       <div className="bg-zinc-900 border border-red-600/30 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl animate-in slide-in-from-bottom-10">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-800 rounded-full"><X size={20}/></button>
          
          <div className="flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-black rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 mb-6">
                <Smartphone size={40} className="text-white" />
             </div>
             
             <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Instalar App ABFIT</h3>
             <p className="text-sm text-zinc-400 font-medium leading-relaxed px-4 mb-8">
                Instale o <strong className="text-white">ABFIT</strong> para performance máxima, acesso offline e modo Tela Cheia Nativo.
             </p>

             {/* INSTRUÇÕES IOS */}
             {platform === 'ios' && (
                <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 text-left space-y-3">
                    <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px]">1</span> Toque em Compartilhar <Share size={14} className="text-blue-500 inline" /></p>
                    <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px]">2</span> Role e selecione <span className="font-bold text-white flex items-center gap-1">Adicionar à Tela de Início <PlusSquare size={12}/></span></p>
                </div>
             )}

             {/* BOTÃO INSTALAÇÃO AUTOMÁTICA (CHROME/EDGE) */}
             {deferredPrompt && (
                <button onClick={handleInstallClick} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-colors shadow-lg flex items-center justify-center gap-2">
                   <Download size={18} /> Instalar Agora
                </button>
             )}

             {/* INSTRUÇÕES MANUAIS ANDROID (CASO O BROWSER NÃO SUPORTE AUTOMÁTICO) */}
             {!deferredPrompt && platform === 'android' && (
                <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 text-left space-y-3">
                    <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px]">1</span> Toque no Menu do Navegador <MoreVertical size={14} className="text-zinc-400 inline" /></p>
                    <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px]">2</span> Selecione <span className="font-bold text-white">Instalar Aplicativo</span> ou <span className="font-bold text-white">Adicionar à Tela Inicial</span></p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}
