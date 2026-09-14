import React from 'react';
import { 
  Bell, X, Check, CheckCheck, CheckCircle2, Dumbbell, 
  Activity, Calendar, MessageCircle, ChevronRight, Info, Sparkles 
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToView?: (view: string) => void;
  coachPhone?: string;
}

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToView,
  coachPhone = '5521994527694'
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'RENEWAL':
        return <Dumbbell className="text-orange-500 shrink-0" size={20} />;
      case 'SYSTEM':
        return <Activity className="text-emerald-500 shrink-0" size={20} />;
      default:
        return <Bell className="text-red-500 shrink-0" size={20} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] max-w-lg w-full max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black italic uppercase text-white tracking-wide">
                  Central de Notificações
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-600 text-white tracking-widest">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                Alertas de treinos, séries e avaliações
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action sub-bar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="px-6 py-2.5 bg-zinc-900/20 border-b border-zinc-800/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {unreadCount} pendente{unreadCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1.5 text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors cursor-pointer"
            >
              <CheckCheck size={14} />
              Marcar todas como lidas
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase italic text-white tracking-wide">
                  Tudo em Dia!
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Você não possui notificações pendentes. Seus treinos e avaliações estão em dia.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => {
              const isAssessmentRelated = notif.title.toLowerCase().includes('avaliação') || notif.message.toLowerCase().includes('avaliação');
              const isWorkoutRelated = notif.title.toLowerCase().includes('treino') || notif.title.toLowerCase().includes('renovação') || notif.message.toLowerCase().includes('sessões');

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all relative ${
                    notif.read 
                      ? 'bg-zinc-900/30 border-zinc-800/60 opacity-70' 
                      : 'bg-zinc-900/80 border-red-600/30 shadow-lg shadow-black/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 mt-0.5">
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black uppercase italic text-white tracking-wide flex items-center gap-1.5">
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse shrink-0" />
                          )}
                          <span className="truncate">{notif.title}</span>
                        </h4>
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                          {notif.date}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {isAssessmentRelated && (
                          <a
                            href={`https://wa.me/${coachPhone}?text=${encodeURIComponent('Olá Professor! Gostaria de agendar minha avaliação física no ABFIT.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/40"
                          >
                            <MessageCircle size={12} />
                            Agendar no WhatsApp
                          </a>
                        )}

                        {isAssessmentRelated && onNavigateToView && (
                          <button
                            onClick={() => {
                              onMarkAsRead(notif.id);
                              onClose();
                              onNavigateToView('STUDENT_ASSESSMENT');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-black uppercase tracking-wider transition-colors"
                          >
                            Ver Avaliações
                            <ChevronRight size={12} />
                          </button>
                        )}

                        {isWorkoutRelated && onNavigateToView && (
                          <button
                            onClick={() => {
                              onMarkAsRead(notif.id);
                              onClose();
                              onNavigateToView('WORKOUTS');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider transition-colors shadow-md shadow-red-900/40"
                          >
                            Ver Meus Treinos
                            <ChevronRight size={12} />
                          </button>
                        )}

                        {!notif.read && (
                          <button
                            onClick={() => onMarkAsRead(notif.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors border border-zinc-800 ml-auto"
                          >
                            <Check size={12} />
                            Lida
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            ABFIT • Assessoria em Treinamentos Físicos
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
