import React, { useState, useMemo } from 'react';
import { ThemeMode } from '../../types';

export interface ActivityEvent {
  id: string;
  type: 'enrollment' | 'lesson_completed' | 'task_submitted' | 'grade_released' | 'certificate_issued';
  title: string;
  description: string;
  userName: string;
  userRole: string;
  userAvatar?: string;
  courseTitle: string;
  timeAgo: string;
  targetTab?: string;
  details?: string;
}

interface RecentActivitiesFeedProps {
  theme?: ThemeMode;
  onNavigateTab?: (tab: string) => void;
}

const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act_1',
    type: 'enrollment',
    title: 'Nova Matrícula Confirmada',
    description: 'Matrícula efetuada via PIX no curso livre de Tomografia Computadorizada Clínica 40h.',
    userName: 'Mariana Costa Sampaio',
    userRole: 'Aluno(a)',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    courseTitle: 'TC Multislice 40h',
    timeAgo: 'Agora mesmo',
    targetTab: 'pagamentos',
    details: 'Acesso liberado por 60 dias'
  },
  {
    id: 'act_2',
    type: 'lesson_completed',
    title: 'Módulo de Aulas Concluído',
    description: 'Concluiu a videoaula "Parâmetros Físicos e Redução de Dose ALARA" com 100% de aproveitamento no quiz.',
    userName: 'Beatriz Ramos Ferreira',
    userRole: 'Aluno(a)',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    courseTitle: 'Radioproteção & Dosimetria',
    timeAgo: 'Há 4 min',
    targetTab: 'aulas',
    details: 'Quiz 10/10'
  },
  {
    id: 'act_3',
    type: 'task_submitted',
    title: 'Envio de Caso DICOM',
    description: 'Enviou o laudo prático do caso "AngioTC de Artérias Coronárias e Escore de Cálcio" para homologação.',
    userName: 'Lucas Silveira Mendes',
    userRole: 'Aluno(a)',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    courseTitle: 'Angiotomografia & 3D',
    timeAgo: 'Há 14 min',
    targetTab: 'pendencias',
    details: 'Arquivo .DCM anexado'
  },
  {
    id: 'act_4',
    type: 'grade_released',
    title: 'Notas Homologadas pelo Docente',
    description: 'Prof. Dr. Marcus Vinicius publicou as médias da Estação de Janelamento Tomográfico Hounsfield.',
    userName: 'Prof. Dr. Marcus Vinicius',
    userRole: 'Docente Titular',
    userAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80',
    courseTitle: 'TC em Neurologia & AVC',
    timeAgo: 'Há 32 min',
    targetTab: 'boletim',
    details: 'Média da Turma: 9.2'
  },
  {
    id: 'act_5',
    type: 'certificate_issued',
    title: 'Certificado 40h Homologado',
    description: 'Emissão oficial de certificado de conclusão de 40 horas com registro de autenticidade ICP-Brasil e MEC/LDB.',
    userName: 'Carlos Eduardo Nogueira',
    userRole: 'Aluno(a)',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    courseTitle: 'Reconstruções 3D MPR e MIP',
    timeAgo: 'Há 1 hora',
    targetTab: 'certificados',
    details: 'Código: CBR-2026-883'
  },
  {
    id: 'act_6',
    type: 'enrollment',
    title: 'Nova Matrícula no Portal',
    description: 'Matrícula confirmada no Curso de Tomografia Computadorizada em Urgência e Trauma.',
    userName: 'Camila Albuquerque',
    userRole: 'Aluno(a)',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    courseTitle: 'TC em Urgência & Trauma',
    timeAgo: 'Há 2 horas',
    targetTab: 'cursos_livres',
    details: 'Simulador Liberado'
  }
];

export const RecentActivitiesFeed: React.FC<RecentActivitiesFeedProps> = ({
  theme = 'dark',
  onNavigateTab
}) => {
  const isDark = theme === 'dark';
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);

  const filteredActivities = useMemo(() => {
    if (selectedFilter === 'all') return activities;
    return activities.filter(a => a.type === selectedFilter);
  }, [activities, selectedFilter]);

  const getTypeBadge = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'enrollment':
        return {
          icon: 'how_to_reg',
          label: 'Matrícula',
          bg: isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
          iconColor: 'text-emerald-400'
        };
      case 'lesson_completed':
        return {
          icon: 'smart_display',
          label: 'Aula Concluída',
          bg: isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-800',
          iconColor: 'text-cyan-400'
        };
      case 'task_submitted':
        return {
          icon: 'upload_file',
          label: 'Trabalho Enviado',
          bg: isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800',
          iconColor: 'text-amber-400'
        };
      case 'grade_released':
        return {
          icon: 'fact_check',
          label: 'Nota Lançada',
          bg: isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-800',
          iconColor: 'text-purple-400'
        };
      case 'certificate_issued':
        return {
          icon: 'workspace_premium',
          label: 'Certificado 40h',
          bg: isDark ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900',
          iconColor: 'text-amber-400'
        };
      default:
        return {
          icon: 'notifications',
          label: 'Atividade',
          bg: isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800',
          iconColor: 'text-cyan-400'
        };
    }
  };

  return (
    <div
      className={`p-6 sm:p-7 rounded-[36px] backdrop-blur-2xl border shadow-xl space-y-5 transition-all ${
        isDark ? 'bg-[#141f38]/60 border-white/10 text-white shadow-black/40' : 'bg-white border-slate-200/90 shadow-sm text-slate-800'
      }`}
    >
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <span className="material-symbols-outlined text-xl">dynamic_feed</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold font-['Plus_Jakarta_Sans']">
                Atividades Recentes
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 !rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Tempo Real
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Eventos acadêmicos, matrículas, aulas assistidas e homologações em tempo real.
            </p>
          </div>
        </div>

        {/* Quick Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'enrollment', label: 'Matrículas' },
            { id: 'lesson_completed', label: 'Aulas' },
            { id: 'task_submitted', label: 'Trabalhos' },
            { id: 'certificate_issued', label: 'Certificados' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1 text-[11px] font-bold !rounded-full transition-all cursor-pointer whitespace-nowrap border ${
                selectedFilter === tab.id
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-cyan-100 text-cyan-900 border-cyan-300 shadow-sm'
                  : isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredActivities.map((act) => {
          const badge = getTypeBadge(act.type);
          return (
            <div
              key={act.id}
              className={`p-4 rounded-3xl border transition-all duration-300 hover:scale-[1.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                isDark
                  ? 'bg-[#0b111e]/70 hover:bg-[#0f172a] border-white/5 hover:border-white/15'
                  : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Left Item Content */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* User Avatar with Type Overlay Badge */}
                <div className="relative shrink-0 mt-0.5">
                  <img
                    src={act.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={act.userName}
                    className="w-10 h-10 rounded-full object-cover border border-white/15 shadow-md"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 ${badge.bg}`}>
                    <span className="material-symbols-outlined text-xs">{badge.icon}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                      <span className="material-symbols-outlined text-xs">{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-xs font-bold truncate text-white">
                      {act.userName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      • {act.courseTitle}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    {act.description}
                  </p>

                  {act.details && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        {act.details}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Timestamp and Action */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-gray-500">schedule</span>
                  <span>{act.timeAgo}</span>
                </span>

                {act.targetTab && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(act.targetTab!)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors hover:underline"
                  >
                    <span>Ver detalhes</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
