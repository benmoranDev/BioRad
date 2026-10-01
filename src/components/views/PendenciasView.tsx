import React, { useState } from 'react';
import { TaskPendency, ThemeMode } from '../../types';
import { storageService } from '../../services/storage';

interface PendenciasViewProps {
  tasks: TaskPendency[];
  onOpenSubmissionModal: (task: TaskPendency) => void;
  onTasksUpdated: (tasks: TaskPendency[]) => void;
  theme?: ThemeMode;
}

export const PendenciasView: React.FC<PendenciasViewProps> = ({
  tasks,
  onOpenSubmissionModal,
  onTasksUpdated,
  theme = 'dark'
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const isDark = theme === 'dark';

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'submitted') return t.status === 'submitted';
    return true;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const handleMarkSubmitted = (task: TaskPendency) => {
    const updated = tasks.map(t =>
      t.id === task.id ? { ...t, status: 'submitted' as const, submittedFile: `Trabalho_${task.type}_Entregue.pdf` } : t
    );
    storageService.setTasks(updated);
    onTasksUpdated(updated);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-7">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4cd7f6] font-mono mb-1">
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            <span>Fluxo Acadêmico &amp; Atividades de Radiologia</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Central de Trabalhos &amp; Prazos
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Gerenciamento consolidado de relatórios de bancada, estudos de caso de tomografia, seminários e exercícios práticos.
          </p>
        </div>

        <div className={`flex items-center gap-1.5 rounded-full p-1.5 text-xs border ${
          isDark ? 'bg-[#141f38]/70 border-white/10' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              filter === 'all'
                ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] font-bold' : 'bg-cyan-600 text-white font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-500 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              filter === 'submitted'
                ? 'bg-emerald-500/20 text-emerald-600 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Entregues ({tasks.length - pendingCount})
          </button>
        </div>
      </section>

      {/* Grid of Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTasks.map(task => {
          const isUrgent = task.daysRemaining <= 3 && task.status === 'pending';
          return (
            <div
              key={task.id}
              className={`p-6 rounded-[32px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between transition-all ${
                isDark
                  ? isUrgent
                    ? 'bg-gradient-to-br from-amber-500/10 via-[#141f38]/60 to-[#141f38]/80 border-amber-500/40 hover:border-amber-400'
                    : 'bg-[#141f38]/50 border-white/10 hover:border-[#4cd7f6]/30'
                  : isUrgent
                    ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? 'text-[#4cd7f6] bg-[#4cd7f6]/10 border-[#4cd7f6]/20'
                      : 'text-cyan-700 bg-cyan-50 border-cyan-200 font-semibold'
                  }`}>
                    {task.courseTitle}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 ${
                      task.status === 'submitted'
                        ? isDark
                          ? 'bg-[#00a572]/15 text-[#4edea3] border border-[#4edea3]/30'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isUrgent
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isDark
                          ? 'bg-white/5 text-gray-300 border border-white/10'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        task.status === 'submitted'
                          ? 'bg-emerald-500'
                          : isUrgent
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    />
                    {task.status === 'submitted'
                      ? 'Entregue para Correção'
                      : `Prazo: ${task.deadlineDate} (${task.daysRemaining} dias)`}
                  </span>
                </div>

                <h3 className={`text-base font-bold mb-2 font-['Plus_Jakarta_Sans'] ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {task.title}
                </h3>
                <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
                  {task.description}
                </p>

                <div className={`p-4 rounded-[24px] border space-y-1.5 text-xs mb-4 ${
                  isDark
                    ? 'bg-[#0a0e17]/60 border-white/5 text-[#869397]'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex justify-between">
                    <span>Tipo de Atividade:</span>
                    <span className={`font-mono uppercase font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {task.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formato Exigido:</span>
                    <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {task.format}
                    </span>
                  </div>
                  {task.submittedFile && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Arquivo Anexo:</span>
                      <span className="font-mono">{task.submittedFile}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex items-center justify-between pt-3 border-t ${
                isDark ? 'border-white/5 text-[#869397]' : 'border-slate-100 text-slate-500'
              } text-xs`}>
                <span>
                  {task.status === 'submitted' ? 'Aguardando parecer docente' : 'Submissão acadêmica ativa'}
                </span>

                {task.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkSubmitted(task)}
                      className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Envio Rápido
                    </button>
                    <button
                      onClick={() => onOpenSubmissionModal(task)}
                      className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-[#090d16] font-bold text-xs shadow-md shadow-[#06b6d4]/30 hover:shadow-[#06b6d4]/50 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      <span>Enviar Trabalho</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Protocolado com Sucesso
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
