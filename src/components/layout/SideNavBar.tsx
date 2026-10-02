import React from 'react';
import { UserRole, ThemeMode } from '../../types';

interface SideNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  pendingCount: number;
  theme: ThemeMode;
  onOpenLabSupport: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingCount,
  theme,
  onOpenLabSupport,
  isOpenMobile,
  onCloseMobile,
  onLogout,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const isDark = theme === 'dark';

  const navItems = [
    // Aluno (Student): Aulas, Boletim de Notas, Trabalhos/Pendências, Simulador TC e Diplomas
    { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', roles: ['student', 'professor', 'admin'] },
    { id: 'cursos_livres', label: 'Cursos Livres (40h)', icon: 'school', roles: ['student', 'professor', 'admin'] },
    { id: 'aulas', label: 'Minhas Aulas & TC', icon: 'biotech', roles: ['student'] },
    { id: 'boletim', label: 'Meu Boletim', icon: 'assignment_turned_in', roles: ['student'] },
    { id: 'pendencias', label: 'Meus Trabalhos', icon: 'pending_actions', badge: pendingCount > 0 ? pendingCount : undefined, roles: ['student'] },
    { id: 'certificados', label: 'Meus Certificados', icon: 'workspace_premium', roles: ['student'] },
    { id: 'pagamentos', label: 'Matrícula Pix & Cartão', icon: 'credit_card', roles: ['student', 'professor', 'admin'] },

    // Professor (Docente): Lançamento de Notas, Homologação, Visão das Aulas e Diário
    { id: 'professor_notas', label: 'Lançamento de Notas', icon: 'fact_check', roles: ['professor'] },
    { id: 'aulas', label: 'Conteúdo de Aulas', icon: 'biotech', roles: ['professor'] },
    { id: 'pendencias', label: 'Correção de Trabalhos', icon: 'pending_actions', roles: ['professor'] },

    // Admin (Administração Geral & TI - Acesso Exclusivo):
    { id: 'admin', label: 'Painel Administrativo', icon: 'admin_panel_settings', roles: ['admin'] },
    { id: 'financeiro', label: 'Financeiro (Cartão)', icon: 'payments', roles: ['admin'] },
    { id: 'cadastro_alunos', label: 'Cadastro de Alunos', icon: 'how_to_reg', roles: ['admin'] },
    { id: 'aulas', label: 'Gestão de Aulas & TC', icon: 'biotech', roles: ['admin'] },
    { id: 'professor_notas', label: 'Auditoria de Notas', icon: 'fact_check', roles: ['admin'] },
    { id: 'certificados', label: 'Gestão de Certificados', icon: 'workspace_premium', roles: ['admin'] },
    // Configurações & Banco Supabase (EXCLUSIVO: Somente o Administrador tem acesso!)
    { id: 'configuracoes', label: 'Banco Supabase & Ajustes', icon: 'database', roles: ['admin'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen lg:h-[calc(100vh-1.5rem)] lg:my-3 lg:ml-3 w-64 z-40 backdrop-blur-2xl border shadow-2xl flex flex-col justify-between p-4 transition-all duration-300 rounded-r-[32px] lg:rounded-[36px] ${
          isDark
            ? 'bg-[#181b25]/95 border-white/10 shadow-black/60 text-[#dfe2ef] ring-1 ring-white/5'
            : 'bg-white/95 border-slate-200 shadow-slate-300/60 text-slate-800 ring-1 ring-slate-200/50'
        } ${
          isOpenMobile
            ? 'translate-x-0'
            : isCollapsed
              ? '-translate-x-full pointer-events-none'
              : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#10b981] p-0.5 shadow-lg shadow-cyan-500/25 flex items-center justify-center">
                <div
                  className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                    isDark ? 'bg-[#0a0e17]/90' : 'bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-cyan-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    biotech
                  </span>
                </div>
              </div>
              <div>
                <div
                  className={`text-lg font-bold tracking-tight flex items-center gap-1.5 font-['Plus_Jakarta_Sans'] ${
                    isDark ? 'text-[#4cd7f6]' : 'text-cyan-800'
                  }`}
                >
                  Biorad Cursos
                </div>
                <span
                  className={`text-[10px] font-mono tracking-wider uppercase font-semibold ${
                    isDark ? 'text-[#bcc9cd]/80' : 'text-slate-400'
                  }`}
                >
                  Radiologia &amp; TC
                </span>
              </div>
            </div>

            {/* Desktop collapse toggle button */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Ocultar barra lateral"
                aria-label="Ocultar barra lateral"
                className={`hidden lg:flex w-8 h-8 rounded-full items-center justify-center transition-all cursor-pointer ${
                  isDark
                    ? 'text-gray-400 hover:text-[#4cd7f6] hover:bg-white/10'
                    : 'text-slate-400 hover:text-cyan-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">first_page</span>
              </button>
            )}

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className={`w-8 h-8 rounded-full flex items-center justify-center lg:hidden ${isDark ? 'text-gray-400 hover:text-white bg-white/5' : 'text-slate-400 hover:text-slate-800 bg-slate-100'}`}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Navegação Principal" className="space-y-1.5">
            {filteredItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm transition-all duration-200 text-left font-medium ${
                    isActive
                      ? isDark
                        ? 'bg-[#1c1f29] text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-md shadow-[#4cd7f6]/10'
                        : 'bg-cyan-50 text-cyan-900 border border-cyan-300 shadow-sm font-semibold'
                      : isDark
                        ? 'text-[#bcc9cd] hover:text-[#dfe2ef] hover:bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive
                        ? isDark ? 'text-[#4cd7f6]' : 'text-cyan-700'
                        : isDark ? 'text-[#869397]' : 'text-slate-400'
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-[#4cd7f6] shadow-[0_0_8px_#4cd7f6]' : 'bg-cyan-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / CTA & Secondary Tabs */}
        <div
          className={`pt-3 border-t space-y-2 mt-2 shrink-0 ${
            isDark ? 'border-[#3d494c]/30' : 'border-slate-200'
          }`}
        >
          <div
            className={`px-3.5 py-3 rounded-[24px] border backdrop-blur-md ${
              isDark ? 'bg-[#262a34]/40 border-[#3d494c]/30' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] flex items-center gap-1.5 font-semibold ${
                  isDark ? 'text-[#4edea3]' : 'text-emerald-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Monitoria Online
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#bcc9cd]' : 'text-slate-500'}`}>
                Ativa
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenLabSupport}
              className={`w-full py-2 px-3.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                isDark
                  ? 'text-[#4cd7f6] bg-[#4cd7f6]/10 hover:bg-[#4cd7f6]/20 border-[#4cd7f6]/30'
                  : 'text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border-cyan-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              Tirar Dúvida com Tutor
            </button>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`w-full py-2 px-3.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                isDark
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sair do Portal</span>
            </button>
          )}

          <div
            className={`flex flex-col gap-0.5 text-xs ${
              isDark ? 'text-[#869397]' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between px-2 text-[11px]">
              <span>Portal Acadêmico</span>
              <span className={`font-mono font-medium ${isDark ? 'text-[#4edea3]' : 'text-emerald-600'}`}>Turma 2026.1</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
