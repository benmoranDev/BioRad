import React, { useState, useEffect } from 'react';
import { TaskPendency, ThemeMode } from '../../types';

interface UrgentDeadlinesReminderProps {
  tasks: TaskPendency[];
  theme?: ThemeMode;
  onOpenSubmissionModal: (task: TaskPendency) => void;
  onNavigateTab: (tab: string) => void;
}

export const UrgentDeadlinesReminder: React.FC<UrgentDeadlinesReminderProps> = ({
  tasks,
  theme = 'dark',
  onOpenSubmissionModal,
  onNavigateTab
}) => {
  const isDark = theme === 'dark';
  const [isDismissed, setIsDismissed] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>('default');
  const [pushToastMessage, setPushToastMessage] = useState<string | null>(null);

  // Filter pending tasks expiring in less than 24h (daysRemaining <= 1)
  const urgentTasks = tasks.filter(t => t.status === 'pending' && t.daysRemaining <= 1);
  const primaryUrgentTask = urgentTasks[0];

  // Check browser Notification support & permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermissionStatus(Notification.permission);
    }
  }, []);

  // Trigger browser push notification if permission granted and tasks are urgent
  useEffect(() => {
    if (urgentTasks.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notifKey = `biorad_push_${primaryUrgentTask.id}_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(notifKey)) {
          new Notification('🚨 Lembrete de Prazo Crítico Biorad', {
            body: `O trabalho "${primaryUrgentTask.title}" (${primaryUrgentTask.courseTitle}) expira em menos de 24 horas! Envie seu laudo no simulador.`,
            icon: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=150&q=80',
            tag: primaryUrgentTask.id
          });
          sessionStorage.setItem(notifKey, 'sent');
        }
      } catch {
        // Ignore if push notification blocked by environment
      }
    }
  }, [urgentTasks, primaryUrgentTask]);

  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushToastMessage('Seu navegador não suporta Web Push Notifications.');
      setTimeout(() => setPushToastMessage(null), 4000);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermissionStatus(permission);
      if (permission === 'granted') {
        setPushToastMessage('✓ Push Notifications ativadas! Você receberá alertas de prazos no navegador.');
        if (primaryUrgentTask) {
          new Notification('🚨 Alertas Biorad Ativados', {
            body: `Lembrete: "${primaryUrgentTask.title}" vence hoje!`,
            icon: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=150&q=80'
          });
        }
      } else {
        setPushToastMessage('Permissão de notificações não concedida no navegador.');
      }
      setTimeout(() => setPushToastMessage(null), 4500);
    } catch {
      setPushToastMessage('Permissão de notificações gerenciada pelo sistema.');
      setTimeout(() => setPushToastMessage(null), 4000);
    }
  };

  if (urgentTasks.length === 0 || isDismissed) {
    return null;
  }

  return (
    <>
      {/* 1. TOP URGENT DASHBOARD BANNER */}
      <section
        aria-label="Aviso de Prazos Urgentes"
        className="relative overflow-hidden rounded-[32px] p-5 sm:p-6 border bg-gradient-to-r from-amber-500/20 via-amber-950/40 to-red-500/20 border-amber-500/40 text-amber-100 shadow-2xl backdrop-blur-2xl ring-2 ring-amber-500/30 animate-fade-in"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-2xl">alarm_on</span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/30 text-amber-300 border border-amber-400/40">
                  Prazo Crítico • Menos de 24 Horas
                </span>
                <span className="text-xs text-amber-300 font-semibold font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  {urgentTasks.length} {urgentTasks.length === 1 ? 'trabalho pendente' : 'trabalhos pendentes'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {primaryUrgentTask.title}
              </h3>
              <p className="text-xs text-amber-200/90 line-clamp-2">
                Disciplina: <strong>{primaryUrgentTask.courseTitle}</strong> • Formato: <span className="font-mono font-bold uppercase">{primaryUrgentTask.format}</span> • Encerramento: <strong>Hoje às 23:59h</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenSubmissionModal(primaryUrgentTask)}
              className="px-5 py-2.5 !rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-amber-300/40"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Enviar Trabalho Agora</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('pendencias')}
              className={`px-4 py-2.5 !rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
              }`}
            >
              <span>Ver Todos ({urgentTasks.length})</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>

            {pushPermissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-3.5 py-2.5 !rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Receber lembretes no navegador"
              >
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                <span className="hidden sm:inline">Ativar Push</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. FLOATING PUSH REMINDER POP-UP (BOTTOM-RIGHT) */}
      <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-view-fade-in">
        <div className={`p-4 sm:p-5 rounded-[28px] border shadow-2xl backdrop-blur-2xl transition-all ${
          isDark
            ? 'bg-[#10182b]/95 border-amber-500/40 text-white shadow-black/80 ring-1 ring-amber-500/30'
            : 'bg-white/95 border-amber-300 text-slate-900 shadow-slate-400/80 ring-1 ring-amber-200'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-base">
                <span className="material-symbols-outlined text-lg animate-pulse">timer</span>
              </span>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Lembrete de Prazo Crítico</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </h4>
                <p className="text-[10px] text-amber-400 font-mono">Expira em menos de 24h</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-gray-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
              title="Fechar lembrete"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <p className="text-xs font-semibold mb-1 text-white line-clamp-2">
            {primaryUrgentTask.title}
          </p>
          <p className="text-[11px] text-gray-400 mb-3">
            {primaryUrgentTask.courseTitle} • Entrega até hoje às 23:59h.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenSubmissionModal(primaryUrgentTask);
                setIsDismissed(true);
              }}
              className="flex-1 py-2 px-3 !rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              <span>Enviar Agora</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="px-3 py-2 !rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer"
            >
              Lembrar mais tarde
            </button>
          </div>
        </div>
      </div>

      {/* Push Status Toast Feedback */}
      {pushToastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xl backdrop-blur-2xl">
          <span className="material-symbols-outlined text-base">notifications_active</span>
          <span>{pushToastMessage}</span>
        </div>
      )}
    </>
  );
};
