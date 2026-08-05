
import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare, Smartphone, MoreVertical, Box, ExternalLink, CheckCircle } from 'lucide-react';

export function InstallPrompt({ onClose }: { onClose: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

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
    }
  };

  if (isStandalone) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto">
       <div className="bg-zinc-900 border border-red-600/30 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 relative shadow-2xl animate-in slide-in-from-bottom-10 my-auto">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-800 rounded-full"><X size={20}/></button>
          
          <div className="flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-black rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 mb-4">
                <Smartphone size={32} className="text-white" />
             </div>
             
             <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-white mb-1">Instalar Aplicativo ABFIT</h3>
             <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed px-2 mb-6">
                Use o <strong className="text-white">ABFIT</strong> como aplicativo nativo em tela cheia no seu celular.
             </p>

             {/* TABS PWA vs APK */}
             <div className="flex bg-black/60 p-1 rounded-2xl w-full border border-white/10 mb-6">
                <button
                  onClick={() => setActiveTab('pwa')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'pwa' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Smartphone size={14} /> Instalação Direta (PWA)
                </button>
                <button
                  onClick={() => setActiveTab('apk')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'apk' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Box size={14} /> Gerar APK (.apk)
                </button>
             </div>

             {activeTab === 'pwa' && (
               <div className="w-full flex flex-col items-center gap-4">
                 {/* BOTÃO INSTALAÇÃO AUTOMÁTICA (CHROME/EDGE) */}
                 {deferredPrompt && (
                    <button onClick={handleInstallClick} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-colors shadow-lg flex items-center justify-center gap-2">
                       <Download size={18} /> Instalar no Celular Agora
                    </button>
                 )}

                 {/* INSTRUÇÕES IOS */}
                 {platform === 'ios' && (
                    <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 text-left space-y-3">
                        <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px] text-red-500">1</span> Toque no botão Compartilhar <Share size={14} className="text-blue-500 inline" /></p>
                        <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px] text-red-500">2</span> Selecione <span className="font-bold text-white flex items-center gap-1">Adicionar à Tela de Início <PlusSquare size={12}/></span></p>
                    </div>
                 )}

                 {/* INSTRUÇÕES MANUAIS ANDROID (CASO O BROWSER NÃO SUPORTE PROMPT DIRETO) */}
                 {!deferredPrompt && platform !== 'ios' && (
                    <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 text-left space-y-3">
                        <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px] text-red-500">1</span> Toque nos 3 pontinhos do menu do Chrome <MoreVertical size={14} className="text-zinc-400 inline" /></p>
                        <p className="text-xs text-zinc-300 flex items-center gap-3"><span className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px] text-red-500">2</span> Selecione <span className="font-bold text-white">"Instalar aplicativo"</span> ou <span className="font-bold text-white">"Adicionar à tela inicial"</span></p>
                        <div className="p-3 bg-red-950/40 border border-red-600/30 rounded-xl text-[11px] text-zinc-300 leading-snug">
                          <CheckCircle size={14} className="text-red-500 inline mr-1" />
                          O app será instalado na gaveta de apps do seu Android com ícone próprio e execução em Tela Cheia (Standalone), exatamente como um APK!
                        </div>
                    </div>
                 )}
               </div>
             )}

             {activeTab === 'apk' && (
               <div className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 text-left space-y-3 text-xs text-zinc-300">
                 <p className="font-bold text-white uppercase tracking-wide text-xs">Como compilar um pacote .APK oficial:</p>
                 <ol className="space-y-2 list-decimal list-inside text-zinc-300">
                   <li>Acesse o site gratuito <strong className="text-white">pwabuilder.com</strong> (da Microsoft).</li>
                   <li>Cole a URL pública do seu app ABFIT.</li>
                   <li>Clique em <strong className="text-white">"Build My PWA"</strong> -&gt; <strong className="text-white">"Android APK"</strong>.</li>
                   <li>Faça o download do arquivo <strong className="text-red-500">.apk</strong> pronto para instalar no Android ou enviar para a Google Play Store!</li>
                 </ol>
                 <a
                   href="https://www.pwabuilder.com"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="mt-3 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors border border-white/10"
                 >
                   Abrir PWABuilder <ExternalLink size={14} />
                 </a>
               </div>
             )}
          </div>
       </div>
    </div>
  );
}

