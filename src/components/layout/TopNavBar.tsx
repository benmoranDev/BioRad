import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, UserRole, EmailNotification, ThemeMode } from '../../types';
import { storageService } from '../../services/storage';

interface TopNavBarProps {
  currentUser: User;
  onRoleChange?: (role: UserRole) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSimulator: () => void;
  notifications: EmailNotification[];
  onOpenMobileMenu: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSelectNotification: (notif: EmailNotification) => void;
  onLogout?: () => void;
  onNavigateToTab?: (tab: string) => void;
  isSupabaseConnected?: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentUser,
  onRoleChange,
  theme,
  onToggleTheme,
  onOpenSimulator,
  notifications,
  onOpenMobileMenu,
  searchTerm,
  onSearchChange,
  onSelectNotification,
  onLogout,
  onNavigateToTab,
  isSupabaseConnected = false,
  isSidebarCollapsed = false,
  onToggleSidebar
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<'all' | 'courses' | 'tasks' | 'certificates'>('all');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isDark = theme === 'dark';

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search aggregations across courses, tasks and certificates
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return { courses: [], tasks: [], certificates: [], total: 0 };

    // 1. Search Courses & Free Courses
    const allCourses = [...storageService.getCourses(), ...storageService.getCursosLivres()];
    const uniqueCourses = Array.from(new Map(allCourses.map(c => [c.id || c.title, c])).values());
    const matchedCourses = uniqueCourses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.instructor && c.instructor.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );

    // 2. Search Tasks & DICOM assignments
    const allTasks = storageService.getTasks();
    const matchedTasks = allTasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.courseTitle && t.courseTitle.toLowerCase().includes(q)) ||
      (t.format && t.format.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );

    // 3. Search Certificates
    const allCerts = storageService.getCertificates();
    const matchedCerts = allCerts.filter(crt =>
      (crt.courseName && crt.courseName.toLowerCase().includes(q)) ||
      (crt.studentName && crt.studentName.toLowerCase().includes(q)) ||
      (crt.code && crt.code.toLowerCase().includes(q)) ||
      (crt.authenticatedBy && crt.authenticatedBy.toLowerCase().includes(q)) ||
      (crt.instructorName && crt.instructorName.toLowerCase().includes(q))
    );

    return {
      courses: matchedCourses,
      tasks: matchedTasks,
      certificates: matchedCerts,
      total: matchedCourses.length + matchedTasks.length + matchedCerts.length
    };
  }, [searchTerm]);

  return (
    <header className={`sticky top-0 right-0 z-30 w-full p-2 sm:p-3 lg:px-6 lg:pt-3 lg:pb-1.5 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-6' : 'lg:pl-72'}`}>
      <div
        className={`w-full mx-auto px-3.5 sm:px-5 h-14 sm:h-16 rounded-full backdrop-blur-2xl border transition-all duration-300 flex items-center justify-between shadow-xl gap-2 sm:gap-3 ${
          isDark
            ? 'bg-[#141b2d]/90 border-white/15 shadow-black/50 ring-1 ring-white/10'
            : 'bg-white/95 border-slate-200 shadow-slate-200/80 ring-1 ring-slate-200/60'
        }`}
      >
        {/* Left Side: Mobile Menu Button & Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xs md:max-w-md">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full lg:hidden transition-all cursor-pointer border flex items-center justify-center shrink-0 ${
              isDark
                ? 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
            aria-label="Abrir Menu"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">menu</span>
          </button>

          {/* Desktop Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`hidden lg:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all cursor-pointer border items-center justify-center shrink-0 ${
                isDark
                  ? isSidebarCollapsed
                    ? 'text-[#4cd7f6] bg-[#4cd7f6]/15 hover:bg-[#4cd7f6]/25 border-[#4cd7f6]/40 shadow-sm shadow-[#4cd7f6]/20'
                    : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                  : isSidebarCollapsed
                    ? 'text-cyan-800 bg-cyan-100 hover:bg-cyan-200 border-cyan-300 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
              title={isSidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
              aria-label={isSidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">
                {isSidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
          )}

          {/* Global Search Input & Live Results Dropdown */}
          <div ref={searchContainerRef} className="relative w-full">
            <span
              className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-base sm:text-lg pointer-events-none transition-colors ${
                isSearchFocused ? 'text-[#4cd7f6]' : isDark ? 'text-[#869397]' : 'text-slate-400'
              }`}
            >
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={e => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                }
              }}
              placeholder="Busca global: cursos, tarefas, certificados..."
              className={`w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-8 !rounded-full text-xs sm:text-sm outline-none transition-all ${
                isDark
                  ? 'bg-[#0a0e17]/80 border border-white/15 text-[#dfe2ef] placeholder:text-[#869397] focus:border-[#4cd7f6] focus:ring-2 focus:ring-[#4cd7f6]/20'
                  : 'bg-slate-100 border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-600/15'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                title="Limpar busca"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}

            {/* Floating Global Search Live Results Dropdown */}
            {isSearchFocused && searchTerm.trim().length > 0 && (
              <div
                className={`absolute left-0 top-full mt-2 w-full min-w-[320px] sm:min-w-[440px] md:min-w-[500px] max-h-[460px] overflow-y-auto rounded-[28px] border shadow-2xl backdrop-blur-2xl z-50 p-4 space-y-3 animate-fade-in ${
                  isDark
                    ? 'bg-[#10182b]/95 border-cyan-500/40 text-white shadow-black/70 ring-1 ring-cyan-500/20'
                    : 'bg-white/95 border-cyan-300 text-slate-800 shadow-slate-300/80 ring-1 ring-cyan-200'
                }`}
              >
                {/* Search Header & Category Filters */}
                <div className="flex items-center justify-between border-b pb-2.5 border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-base">travel_explore</span>
                    <span className="text-xs font-bold font-['Plus_Jakarta_Sans']">Busca Global Biorad</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {searchResults.total} resultado(s)
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'all', label: 'Tudo', count: searchResults.total },
                      { id: 'courses', label: 'Cursos', count: searchResults.courses.length },
                      { id: 'tasks', label: 'Tarefas', count: searchResults.tasks.length },
                      { id: 'certificates', label: 'Certificados', count: searchResults.certificates.length }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSearchCategoryFilter(f.id as any)}
                        className={`px-2 py-0.5 !rounded-full text-[10px] font-semibold transition-all cursor-pointer border ${
                          searchCategoryFilter === f.id
                            ? 'bg-[#4cd7f6] text-slate-950 border-[#4cd7f6] font-bold shadow-sm'
                            : isDark
                              ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                      >
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Results Groups */}
                {searchResults.total === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <span className="material-symbols-outlined text-3xl text-gray-500">search_off</span>
                    <p className="text-xs text-gray-400">
                      Nenhum resultado encontrado para <strong className="text-white">"{searchTerm}"</strong>.
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Tente buscar por termos como "Tomografia", "Angio", "DICOM", "Laudo", "40h" ou códigos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 1. COURSES RESULTS */}
                    {(searchCategoryFilter === 'all' || searchCategoryFilter === 'courses') && searchResults.courses.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1 tracking-wider px-1">
                          <span className="material-symbols-outlined text-xs">school</span>
                          <span>Cursos &amp; Disciplinas ({searchResults.courses.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.courses.map(course => (
                            <div
                              key={course.id || course.title}
                              onClick={() => {
                                if (onNavigateToTab) onNavigateToTab('cursos_livres');
                                setIsSearchFocused(false);
                              }}
                              className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                isDark ? 'bg-white/5 hover:bg-cyan-500/15 border-white/5 hover:border-cyan-400/40' : 'bg-slate-50 hover:bg-cyan-50 border-slate-200 hover:border-cyan-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-sm">menu_book</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{course.title}</span>
                                    {course.code && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                                        {course.code}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate">
                                    {course.category} • {course.instructor || 'Biorad Docência'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-cyan-400 shrink-0 font-semibold flex items-center gap-0.5">
                                <span>Ver Curso</span>
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. TASKS & DICOM RESULTS */}
                    {(searchCategoryFilter === 'all' || searchCategoryFilter === 'tasks') && searchResults.tasks.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 tracking-wider px-1">
                          <span className="material-symbols-outlined text-xs">assignment</span>
                          <span>Tarefas &amp; Casos DICOM ({searchResults.tasks.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.tasks.map(task => (
                            <div
                              key={task.id}
                              onClick={() => {
                                if (onNavigateToTab) onNavigateToTab('pendencias');
                                setIsSearchFocused(false);
                              }}
                              className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                isDark ? 'bg-white/5 hover:bg-amber-500/15 border-white/5 hover:border-amber-400/40' : 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{task.title}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 uppercase">
                                      {task.format}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate">
                                    {task.courseTitle} • Prazo: {task.deadlineDate}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-amber-400 shrink-0 font-semibold flex items-center gap-0.5">
                                <span>Entregar</span>
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. CERTIFICATES RESULTS */}
                    {(searchCategoryFilter === 'all' || searchCategoryFilter === 'certificates') && searchResults.certificates.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 tracking-wider px-1">
                          <span className="material-symbols-outlined text-xs">workspace_premium</span>
                          <span>Certificados Homologados ({searchResults.certificates.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {searchResults.certificates.map(cert => (
                            <div
                              key={cert.id}
                              onClick={() => {
                                if (onNavigateToTab) onNavigateToTab('certificados');
                                setIsSearchFocused(false);
                              }}
                              className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                isDark ? 'bg-white/5 hover:bg-emerald-500/15 border-white/5 hover:border-emerald-400/40' : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-sm">verified</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{cert.courseName}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                      {cert.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate">
                                    Aluno: {cert.studentName} • {cert.workloadHours}h Certificadas
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-semibold flex items-center gap-0.5">
                                <span>Ver Certificado</span>
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Brand Context (Desktop) */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <span
            className={`text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}
          >
            Biorad Cursos
          </span>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
              isDark
                ? 'bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
            }`}
          >
            Cursos 40h
          </span>
        </div>

        {/* Right Side: Role, Theme, Simulator CTA, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* User Role Pill Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm whitespace-nowrap shrink-0 ${
              currentUser.role === 'student'
                ? isDark
                  ? 'bg-cyan-500/15 border-cyan-400/30 text-[#4cd7f6]'
                  : 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : currentUser.role === 'professor'
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : isDark
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser.role === 'student'
                  ? 'bg-[#4cd7f6] animate-pulse'
                  : currentUser.role === 'professor'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-bold text-[11px]">
              {currentUser.role === 'student'
                ? 'Aluno'
                : currentUser.role === 'professor'
                ? 'Professor'
                : 'Admin'}
            </span>
          </div>

          {/* Supabase Status Indicator (Admin only) */}
          {currentUser.role === 'admin' ? (
            onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('configuracoes')}
                title={isSupabaseConnected ? 'Supabase Conectado' : 'Supabase Desconectado'}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 h-9 sm:h-10 !rounded-full text-xs font-semibold transition-all cursor-pointer border shadow-sm whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-95 ${
                  isSupabaseConnected
                    ? isDark
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-950/30'
                      : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800 shadow-emerald-100'
                    : isDark
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                }`}
              >
                <span className="material-symbols-outlined text-base text-emerald-500">database</span>
                <span className="hidden md:inline font-bold">
                  {isSupabaseConnected ? 'Supabase Ativo' : 'Configurar DB'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </button>
            )
          ) : (
            <div
              title="Portal Conectado"
              className={`hidden lg:flex items-center gap-1.5 px-3 h-9 sm:h-10 !rounded-full text-[11px] font-medium border opacity-80 whitespace-nowrap shrink-0 ${
                isSupabaseConnected
                  ? isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              <span className="material-symbols-outlined text-sm">cloud_done</span>
              <span>Online</span>
            </div>
          )}

          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            className={`w-9 h-9 sm:w-10 sm:h-10 !rounded-full transition-all flex items-center justify-center cursor-pointer border shadow-sm shrink-0 hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#1c2333] border-white/15 text-amber-300 hover:text-amber-200 hover:bg-[#252d40]'
                : 'bg-white hover:bg-slate-100 border-slate-200/90 text-indigo-600 shadow-slate-200/80'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Virtual CT Lab Simulator Button */}
          <button
            type="button"
            onClick={onOpenSimulator}
            title="Abrir Simulador Canon Activion 16"
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 h-9 sm:h-10 !rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-95 ${
              isDark
                ? 'bg-gradient-to-r from-[#06b6d4]/20 to-[#10b981]/20 hover:from-[#06b6d4]/30 hover:to-[#10b981]/30 border-cyan-400/40 text-cyan-300 shadow-cyan-950/30'
                : 'bg-cyan-50/90 hover:bg-cyan-100 border-cyan-300 text-cyan-800 shadow-cyan-100/50'
            }`}
          >
            <span className="material-symbols-outlined text-base text-cyan-500">precision_manufacturing</span>
            <span className="hidden sm:inline font-bold">Simulador TC</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-9 h-9 sm:w-10 sm:h-10 !rounded-full transition-all relative cursor-pointer border shadow-sm flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 ${
                isDark
                  ? 'bg-[#1c2333] border-white/15 text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#252d40]'
                  : 'bg-white hover:bg-slate-100 border-slate-200/90 text-slate-600 hover:text-cyan-700 shadow-slate-200/80'
              }`}
              title="Notificações e Avisos"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div
                className={`absolute right-0 mt-3 w-80 md:w-96 rounded-[32px] shadow-2xl p-4 z-50 border backdrop-blur-2xl animate-fade-in ${
                  isDark ? 'bg-[#141c2e]/95 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-slate-300'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/15 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-lg">mail</span>
                    <h4 className="text-sm font-bold">Notificações Acadêmicas</h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#4edea3] bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {unreadCount} novas
                  </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onSelectNotification(n);
                        setShowNotifications(false);
                      }}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                        !n.isRead
                          ? isDark ? 'bg-[#1c273e] border-[#4cd7f6]/40 text-white shadow-md' : 'bg-cyan-50/80 border-cyan-200 text-slate-900'
                          : isDark ? 'bg-[#0a0e17]/50 border-white/5 text-gray-300 hover:bg-white/5' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className={`truncate flex-1 ${isDark ? 'text-[#4cd7f6]' : 'text-cyan-700'}`}>{n.subject}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-2 shrink-0">{n.timestamp}</span>
                      </div>
                      <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{n.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Capsule */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-1 sm:pr-3 !rounded-full transition-all cursor-pointer border shadow-sm shrink-0 hover:scale-[1.02] active:scale-95 ${
                isDark
                  ? 'bg-[#1c2333] border-white/15 hover:border-cyan-400/40 shadow-black/40'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-cyan-400 shadow-slate-200/80'
              }`}
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-cyan-400/40 ring-2 ring-cyan-400/20"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
              </div>
              <div className="text-left hidden sm:block">
                <p
                  className={`text-xs font-bold leading-tight truncate max-w-[100px] ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {currentUser.name}
                </p>
                <p className={`text-[9px] font-semibold uppercase tracking-wide leading-none ${
                  currentUser.role === 'student'
                    ? 'text-cyan-400'
                    : currentUser.role === 'professor'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {currentUser.role === 'student' ? 'Aluno' : currentUser.role === 'professor' ? 'Professor' : 'Admin'}
                </p>
              </div>
              <span className="material-symbols-outlined text-xs text-gray-400 hidden sm:inline">
                expand_more
              </span>
            </button>

            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-3 w-72 rounded-[32px] shadow-2xl p-4 z-50 text-xs border backdrop-blur-2xl animate-fade-in ${
                  isDark ? 'bg-[#141c2e]/95 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-slate-300'
                }`}
              >
                <div className="px-2 py-2 border-b border-slate-200/15 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate">{currentUser.name}</p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {currentUser.role === 'student' ? 'Aluno' : currentUser.role === 'professor' ? 'Professor' : 'Admin'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] font-mono mt-0.5">{currentUser.enrollmentId}</p>
                  <p className="text-[11px] text-[#4cd7f6] truncate">{currentUser.email}</p>
                </div>

                <div className="space-y-1.5 py-1 text-xs">
                  <div className="px-2 py-1 flex items-center justify-between text-slate-400">
                    <span>Especialidade:</span>
                    <span className="font-semibold text-slate-200 text-right truncate max-w-[130px]">{currentUser.specialty || 'Radiologia'}</span>
                  </div>
                  <div className="px-2 py-1 flex items-center justify-between text-slate-400">
                    <span>Acesso:</span>
                    <span className="font-semibold text-emerald-400 uppercase text-[11px]">
                      {currentUser.role === 'student' ? 'Discente' : currentUser.role === 'professor' ? 'Docente' : 'Administrador'}
                    </span>
                  </div>
                </div>

                {/* Atalhos Rápidos da Conta */}
                {onNavigateToTab && (
                  <div className="pt-2 mt-2 border-t border-slate-200/10 space-y-1">
                    {currentUser.role === 'student' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('aulas');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-cyan-400">play_lesson</span>
                          <span>Minhas Aulas &amp; Simulador</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('certificados');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-emerald-400">workspace_premium</span>
                          <span>Meus Certificados</span>
                        </button>
                      </>
                    )}

                    {currentUser.role === 'professor' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('professor_notas');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-emerald-400">fact_check</span>
                          <span>Lançamento de Notas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('aulas');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-cyan-400">biotech</span>
                          <span>Gestão de Conteúdo</span>
                        </button>
                      </>
                    )}

                    {currentUser.role === 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('admin');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-amber-400">admin_panel_settings</span>
                          <span>Painel Administrativo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('cadastro_alunos');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-cyan-400">how_to_reg</span>
                          <span>Gestão de Alunos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToTab('configuracoes');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm text-purple-400">database</span>
                          <span>Configurações &amp; Backup</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {onLogout && (
                  <div className="pt-2 mt-2 border-t border-slate-200/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-full hover:bg-red-500/15 text-red-400 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>Encerrar Sessão / Sair</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
