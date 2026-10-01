import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Course, User, ThemeMode } from '../../types';

interface AcademicProgressWidgetProps {
  courses: Course[];
  currentUser: User;
  theme?: ThemeMode;
  onNavigateTab: (tab: string) => void;
  onOpenSimulator?: () => void;
}

const COLOR_PALETTE = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6'  // Teal
];

export const AcademicProgressWidget: React.FC<AcademicProgressWidgetProps> = ({
  courses,
  currentUser,
  theme = 'dark',
  onNavigateTab
}) => {
  const isDark = theme === 'dark';
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
  const [activeCourseHover, setActiveCourseHover] = useState<any | null>(null);

  // Calculate Overall Progress Metrics
  const {
    averageProgress,
    completedCoursesCount,
    inProgressCoursesCount,
    chartData,
    pieData,
    highestProgressCourse
  } = useMemo(() => {
    if (!courses || courses.length === 0) {
      return {
        averageProgress: 0,
        completedCoursesCount: 0,
        inProgressCoursesCount: 0,
        chartData: [],
        pieData: [],
        highestProgressCourse: null
      };
    }

    const totalProgress = courses.reduce((acc, c) => acc + (c.progress || 0), 0);
    const avg = Math.round(totalProgress / courses.length);
    const completed = courses.filter(c => c.progress >= 100).length;
    const inProgress = courses.filter(c => c.progress < 100).length;

    // Data formatted for BarChart
    const formattedBarData = courses.map((c, index) => {
      // Clean short name for Axis
      const shortName = c.code || c.title.slice(0, 16) + '...';
      return {
        id: c.id,
        name: shortName,
        fullName: c.title,
        code: c.code,
        category: c.category,
        progress: c.progress || 0,
        grade: c.grade || 0,
        credits: c.credits || 40,
        currentModule: c.currentModule || 1,
        totalModules: c.totalModules || 4,
        instructor: c.instructor,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length]
      };
    });

    // Data formatted for Donut Chart
    const formattedPieData = courses.map((c, index) => ({
      name: c.title.length > 24 ? c.title.slice(0, 24) + '...' : c.title,
      fullName: c.title,
      code: c.code,
      value: c.progress || 5, // minimum slice size for visual clarity
      actualProgress: c.progress || 0,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length]
    }));

    const sorted = [...courses].sort((a, b) => (b.progress || 0) - (a.progress || 0));

    return {
      averageProgress: avg,
      completedCoursesCount: completed,
      inProgressCoursesCount: inProgress,
      chartData: formattedBarData,
      pieData: formattedPieData,
      highestProgressCourse: sorted[0] || null
    };
  }, [courses]);

  return (
    <section
      aria-label="Progresso Acadêmico dos Cursos"
      className={`p-6 sm:p-7 rounded-[36px] backdrop-blur-2xl border shadow-xl transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#141f38]/70 via-[#131722]/80 to-[#101420]/90 border-white/10 shadow-black/50 ring-1 ring-cyan-500/20'
          : 'bg-gradient-to-br from-white via-cyan-50/30 to-sky-50/50 border-slate-200/90 shadow-sm text-slate-800 ring-1 ring-cyan-500/15'
      }`}
    >
      {/* Background soft ambient blur */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Toggle */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-400/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">donut_large</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-wider">
              Painel de Desempenho &amp; Evolução
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Tempo Real
            </span>
          </div>
          <h2 className={`text-lg sm:text-xl font-extrabold font-['Plus_Jakarta_Sans'] mt-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Progresso Acadêmico das Disciplinas Ativas
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Acompanhe o percentual de conclusão, módulos assistidos e estimativa para certificação.
          </p>
        </div>

        {/* Chart View Switcher and Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className={`p-1 rounded-full border flex items-center gap-1 ${
            isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">bar_chart</span>
              <span>Barras</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">pie_chart</span>
              <span>Anel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('certificados')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="Ver certificados liberados e pendentes"
          >
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>Certificados</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Stats Banner + Interactive Chart */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
        
        {/* Left Side: Summary Cards & Badges (4 Cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Main Average Progress Card */}
          <div className={`p-4 sm:p-5 rounded-3xl border relative overflow-hidden ${
            isDark
              ? 'bg-black/40 border-white/10 shadow-inner'
              : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                Média Geral de Conclusão
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {courses.length} Disciplinas
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                {averageProgress}%
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Status: Regular
              </span>
            </div>

            {/* Global progress bar */}
            <div className="space-y-1">
              <div className={`w-full rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div
                  className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${averageProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-0.5">
                <span>0% Início</span>
                <span>Meta Semestral: 100%</span>
              </div>
            </div>
          </div>

          {/* Quick Breakdown Badges */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">
                Em Andamento
              </span>
              <strong className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] text-cyan-400">
                {inProgressCoursesCount}
              </strong>
              <span className="text-[10px] text-gray-400 block">Cursos ativos</span>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">
                Concluídos 100%
              </span>
              <strong className="text-xl font-extrabold font-['Plus_Jakarta_Sans'] text-emerald-400">
                {completedCoursesCount}
              </strong>
              <span className="text-[10px] text-gray-400 block">Prontos p/ Certificado</span>
            </div>
          </div>

          {/* Course Highlight */}
          {highestProgressCourse && (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'
            }`}>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">auto_awesome</span>
                  <span>Curso Mais Avançado</span>
                </div>
                <strong className={`block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {highestProgressCourse.title}
                </strong>
                <span className="text-[11px] text-gray-400">
                  Módulo {highestProgressCourse.currentModule} de {highestProgressCourse.totalModules}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-emerald-400 text-base">
                  {highestProgressCourse.progress}%
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('aulas')}
                  className="block text-[10px] text-cyan-400 hover:underline font-bold mt-0.5 cursor-pointer"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Visual Chart (8 Cols) */}
        <div className="lg:col-span-8">
          <div className={`p-4 sm:p-5 rounded-3xl border min-h-[300px] flex flex-col justify-between ${
            isDark ? 'bg-[#0a0e17]/70 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            
            {/* Chart Header details */}
            <div className="flex items-center justify-between text-xs pb-2">
              <span className="text-gray-400 font-mono text-[11px]">
                {chartType === 'bar' ? 'Conclusão por Disciplina (%)' : 'Distribuição de Carga Horária & Evolução'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                Passe o mouse sobre as barras para detalhes
              </span>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-64 sm:h-72">
              {chartType === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 15, right: 10, left: -15, bottom: 25 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? '#6b7280' : '#94a3b8'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#374151' : '#e2e8f0' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke={isDark ? '#6b7280' : '#94a3b8'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#374151' : '#e2e8f0' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-3.5 rounded-2xl border shadow-xl font-sans text-xs space-y-1.5 z-50 ${
                              isDark ? 'bg-[#181d2a] border-cyan-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                                  {data.code}
                                </span>
                                <span className="text-emerald-400 font-mono font-bold text-xs">
                                  {data.progress}% Concluído
                                </span>
                              </div>
                              <strong className="block text-xs font-bold line-clamp-2 max-w-[220px]">
                                {data.fullName}
                              </strong>
                              <div className="text-[11px] text-gray-400 space-y-0.5 pt-1 border-t border-white/10">
                                <div>Docente: <span className="text-gray-200">{data.instructor}</span></div>
                                <div>Módulo Atual: <span className="text-cyan-300">{data.currentModule} de {data.totalModules}</span></div>
                                <div>Média Parcial: <span className="text-emerald-300 font-mono">{data.grade.toFixed(1)}</span></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={activeCourseHover ? (activeCourseHover.id === entry.id ? 1 : 0.4) : 0.9}
                          onMouseEnter={() => setActiveCourseHover(entry)}
                          onMouseLeave={() => setActiveCourseHover(null)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="w-full sm:w-1/2 h-56 sm:h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className={`p-3 rounded-xl border shadow-xl text-xs space-y-1 ${
                                  isDark ? 'bg-[#181d2a] border-cyan-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}>
                                  <div className="font-bold text-cyan-400">{data.code}</div>
                                  <div className="text-[11px] text-gray-200">{data.fullName}</div>
                                  <div className="font-mono text-emerald-400 font-bold text-xs pt-1">
                                    {data.actualProgress}% Concluído
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`pie-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered average text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black font-['Plus_Jakarta_Sans'] text-white">
                        {averageProgress}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">
                        Média Geral
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="w-full sm:w-1/2 space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                    {courses.map((course, idx) => (
                      <div
                        key={course.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                          />
                          <span className="truncate text-[11px] font-semibold text-gray-300">
                            {course.code || course.title}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400 shrink-0 text-[11px]">
                          {course.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Chart Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                <span className="material-symbols-outlined text-sm text-cyan-400">info</span>
                <span>Para emissão do certificado, atinja no mínimo <strong>75%</strong> de conclusão e média &ge; 7.0.</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('aulas')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>Acessar Todas as Aulas</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
