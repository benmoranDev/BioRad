import React, { useState } from 'react';
import { Course, ThemeMode } from '../../types';
import { pdfExportService } from '../../services/pdfExport';

interface GradesViewProps {
  courses: Course[];
  studentName: string;
  enrollmentId: string;
  onRequestReview: () => void;
  onValidateAuthenticity: () => void;
  theme?: ThemeMode;
}

export const GradesView: React.FC<GradesViewProps> = ({
  courses,
  studentName,
  enrollmentId,
  onRequestReview,
  onValidateAuthenticity,
  theme = 'dark'
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>('row-tc');
  const isDark = theme === 'dark';

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleExportPdf = () => {
    pdfExportService.exportTranscript(courses, studentName, enrollmentId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Hero Context Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isDark
                ? 'bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/25'
                : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
            }`}>
              Período Letivo Vigente
            </span>
            <span className={`text-xs flex items-center gap-1 font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-[14px]">event_upcoming</span>
              Semestre Acadêmico 2026.1
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Boletim &amp; Histórico Acadêmico
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Acompanhamento consolidado de proficiência em Tomografia Computadorizada, relatórios práticos e frequência do estudante.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRequestReview}
            className={`px-4 py-2.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] text-[#dfe2ef] border-white/10 hover:border-[#4cd7f6]/40'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-cyan-600 text-lg">fact_check</span>
            <span>Solicitar Revisão de Avaliação</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-5 py-2.5 rounded-full text-[#090d16] font-bold text-xs bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:shadow-[0_0_24px_rgba(6,182,212,0.6)] shadow-lg shadow-[#06b6d4]/30 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span>Exportar Histórico Escolar (PDF Oficial)</span>
          </button>
        </div>
      </section>

      {/* Bento Overview Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Coeficiente de Rendimento (CR) */}
        <div className={`p-5 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between transition-all duration-300 ${
          isDark
            ? 'bg-[#141f38]/50 border-white/10 hover:border-[#4cd7f6]/40'
            : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Coeficiente de Rendimento (CR)</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 text-[#4cd7f6]' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
            }`}>
              <span className="material-symbols-outlined text-lg">grade</span>
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-[#4cd7f6]' : 'text-cyan-700'}`}>
              9.1
            </span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center">
              <span className="material-symbols-outlined text-base">trending_up</span> +0.3 vs 2025.2
            </span>
          </div>
          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-white/5 text-[#bcc9cd]' : 'border-slate-100 text-slate-600'
          }`}>
            <span>Escala GPA: 3.92 / 4.0</span>
            <span className="text-cyan-600 font-mono font-medium">Top 2% Turma</span>
          </div>
        </div>

        {/* Card 2: Frequência Global */}
        <div className={`p-5 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between transition-all duration-300 ${
          isDark
            ? 'bg-[#141f38]/50 border-white/10 hover:border-[#4edea3]/40'
            : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Frequência Global Teoria/Prática</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-[#4edea3]/10 border border-[#4edea3]/20 text-[#4edea3]' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <span className="material-symbols-outlined text-lg">schedule</span>
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-[#4edea3]' : 'text-emerald-700'}`}>
              94%
            </span>
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Mínimo Req. 75%</span>
          </div>
          <div className={`mt-4 pt-3 border-t space-y-1.5 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#262a34]' : 'bg-slate-100'}`}>
              <div className="bg-gradient-to-r from-[#00a572] to-[#4edea3] h-full rounded-full" style={{ width: '94%' }} />
            </div>
            <div className={`flex justify-between items-center text-[10px] ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              <span>228 hrs assistidas</span>
              <span>14 hrs justificadas</span>
            </div>
          </div>
        </div>

        {/* Card 3: Progresso de Créditos */}
        <div className={`p-5 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between transition-all duration-300 ${
          isDark
            ? 'bg-[#141f38]/50 border-white/10 hover:border-[#b395ff]/40'
            : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Progresso Curricular</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-[#b395ff]/10 border border-[#b395ff]/20 text-[#b395ff]' : 'bg-purple-50 border border-purple-200 text-purple-700'
            }`}>
              <span className="material-symbols-outlined text-lg">auto_stories</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              42
            </span>
            <span className={`text-lg ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>/ 60 Créditos</span>
          </div>
          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-white/5' : 'border-slate-100'
          }`}>
            <span className={isDark ? 'text-[#869397]' : 'text-slate-500'}>70% da Formação</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
              isDark ? 'bg-[#262a34] text-[#4cd7f6]' : 'bg-cyan-50 text-cyan-800'
            }`}>
              +18 em curso
            </span>
          </div>
        </div>

        {/* Card 4: Vínculo Institucional */}
        <div className={`p-5 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between transition-all duration-300 ${
          isDark
            ? 'bg-[#141f38]/50 border-white/10 hover:border-[#4edea3]/40'
            : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Vínculo com a Faculdade</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3]' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              <span className="text-base text-emerald-600 font-bold">Matrícula Regular</span>
            </div>
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Sem Pendências Acadêmicas</span>
          </div>
          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-white/5 text-[#869397]' : 'border-slate-100 text-slate-500'
          }`}>
            <span>Matrícula: {enrollmentId}</span>
            <span className="text-emerald-600 font-mono font-semibold">Turma 2026.1</span>
          </div>
        </div>
      </section>

      {/* Comparative Performance & Bancada Audit */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evolução Comparativa de Desempenho */}
        <div className={`lg:col-span-2 p-6 sm:p-7 rounded-[36px] backdrop-blur-2xl border shadow-xl space-y-6 ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600 text-xl">insights</span>
                <h2 className={`text-lg font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Desempenho por Modalidade Avaliativa
                </h2>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                Correlação entre provas teóricas, relatórios de simulador e seminários práticos de radiologia.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#06b6d4]" />
                <span className={isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}>Teóricas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className={isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}>Prática TC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span className={isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}>Seminários</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Modalidade 1 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Prática em Simulador de TC e Exercícios Anatômicos
                  </span>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-600 rounded font-semibold border border-emerald-500/30">
                    Destaque
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-600 font-bold">9.6 / 10.0</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
                isDark ? 'bg-[#262a34] border-white/5' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full" style={{ width: '96%' }} />
              </div>
              <div className={`flex justify-between text-[10px] mt-1 font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                <span>Janelamento e Atenuação em Unidades Hounsfield</span>
                <span>12/12 trabalhos com nota máxima em Radioproteção</span>
              </div>
            </div>

            {/* Modalidade 2 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Física das Radiações &amp; Princípios de Aquisição
                </span>
                <span className="text-xs font-mono text-cyan-600 font-bold">8.9 / 10.0</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
                isDark ? 'bg-[#262a34] border-white/5' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: '89%' }} />
              </div>
              <div className={`flex justify-between text-[10px] mt-1 font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                <span>Interação da Radiação e Efeito Compton/Fotoelétrico</span>
                <span>Média departamental: 7.4</span>
              </div>
            </div>

            {/* Modalidade 3 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Seminários &amp; Discussão de Casos Clínicos
                </span>
                <span className="text-xs font-mono text-purple-600 font-bold">9.2 / 10.0</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
                isDark ? 'bg-[#262a34] border-white/5' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" style={{ width: '92%' }} />
              </div>
              <div className={`flex justify-between text-[10px] mt-1 font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                <span>Terminologia Médica Radiológica</span>
                <span>Avaliação por pares nota A+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Auditoria de Bancada & Imagem */}
        <div className={`p-6 rounded-2xl backdrop-blur-2xl border shadow-xl flex flex-col justify-between ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-base font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Oficinas Práticas de Tomografia
              </span>
              <span className="material-symbols-outlined text-cyan-600 text-xl">biotech</span>
            </div>
            <p className={`text-xs mb-4 ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Status de validação dos treinamentos de janelamento, reconstrução MPR e dosimetria.
            </p>

            <div className="space-y-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Aquisição Helicoidal 64 Canais
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                      Aproveitamento Prático: 98.4%
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-600 font-bold">10.0</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Contraste Iodado e Fases de Delay
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                      Fase Arterial, Portal e Equilíbrio
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-600 font-bold">9.5</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Reconstrução MPR &amp; Volume Rendering (VR)
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                      Planos Axial, Coronal e Sagital
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-600 font-bold">9.2</span>
              </div>
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-white/5 text-[#869397]' : 'border-slate-100 text-slate-500'
          }`}>
            <span>Professor Responsável:</span>
            <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Dr. Marcus Mendonça • CRTR
            </span>
          </div>
        </div>
      </section>

      {/* Grades Table */}
      <section className={`rounded-2xl overflow-hidden backdrop-blur-2xl border shadow-xl ${
        isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'border-white/10 bg-[#181b25]/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600 text-2xl">table_chart</span>
              <h3 className={`text-lg font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Notas Detalhadas por Disciplina
              </h3>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Clique em qualquer matéria para expandir os critérios e o parecer do professor.
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-[#1c1f29] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <span className={isDark ? 'text-[#869397]' : 'text-slate-500'}>Fórmula da Média:</span>
            <span className="font-mono text-cyan-600 font-bold">(N1×3 + N2×4 + Prática TC×3) / 10</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-semibold uppercase tracking-wider border-b ${
                isDark
                  ? 'bg-[#0a0e17]/80 text-[#869397] border-white/10'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-4 px-6">Disciplina</th>
                <th className="py-4 px-4">Docente Responsável</th>
                <th className="py-4 px-3 text-center">N1</th>
                <th className="py-4 px-3 text-center">N2</th>
                <th className="py-4 px-3 text-center">Prática TC</th>
                <th className="py-4 px-4 text-center">Média Final</th>
                <th className="py-4 px-4 text-center">Frequência</th>
                <th className="py-4 px-4 text-center">Situação</th>
                <th className="py-4 px-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
              {courses.map(course => {
                const isExpanded = expandedRow === course.id;
                return (
                  <React.Fragment key={course.id}>
                    <tr
                      onClick={() => toggleRow(course.id)}
                      className={`transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-[#4cd7f6]/5' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isDark ? 'bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 text-[#4cd7f6]' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                          }`}>
                            <span className="material-symbols-outlined text-lg">school</span>
                          </div>
                          <div>
                            <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {course.title}
                            </div>
                            <div className={`text-[10px] font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                              {course.code} • {course.credits} Créditos
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-4 px-4 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>{course.instructor}</td>
                      <td className={`py-4 px-3 text-center font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>9.2</td>
                      <td className={`py-4 px-3 text-center font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>8.8</td>
                      <td className="py-4 px-3 text-center font-mono text-emerald-600 font-bold">9.7</td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-sm text-cyan-600">
                        {course.grade.toFixed(1)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>96%</span>
                        <span className={`block text-[10px] ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>32/34 presenças</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                          isDark
                            ? 'bg-[#00a572]/15 text-[#4edea3] border border-[#4edea3]/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aprovado
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button className={`p-1 rounded-lg ${isDark ? 'text-[#869397] hover:text-cyan-400' : 'text-slate-400 hover:text-slate-800'}`}>
                          <span className={`material-symbols-outlined transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className={isDark ? 'bg-[#0a0e17]/80 border-y border-[#4cd7f6]/30' : 'bg-slate-50/80 border-y border-cyan-300'}>
                        <td colSpan={9} className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className={`p-4 rounded-xl border space-y-2 ${
                              isDark ? 'bg-[#090d16]/70 border-white/5 text-[#bcc9cd]' : 'bg-white border-slate-200 text-slate-700'
                            }`}>
                              <span className="text-xs font-bold text-cyan-600 block mb-2 font-mono uppercase">
                                Composição Analítica da Nota
                              </span>
                              <div className="space-y-1 text-xs font-mono">
                                <div className="flex justify-between">
                                  <span>Prova Teórica de Aquisição (N1):</span>
                                  <span className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>9.2</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Protocolo e Fases de Exame (N2):</span>
                                  <span className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>8.8</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Reconstrução MPR &amp; Prática TC:</span>
                                  <span className="text-emerald-600 font-bold">9.7</span>
                                </div>
                                <div className={`flex justify-between border-t pt-1 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                  <span>Assiduidade em Laboratório:</span>
                                  <span className="text-cyan-600 font-bold">100%</span>
                                </div>
                              </div>
                            </div>

                            <div className={`md:col-span-2 p-4 rounded-xl border flex flex-col justify-between ${
                              isDark ? 'bg-[#090d16]/70 border-white/5' : 'bg-white border-slate-200'
                            }`}>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Parecer do Professor da Turma
                                  </span>
                                  <span className={`text-[10px] font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                                    {course.instructor} • 2026
                                  </span>
                                </div>
                                <p className={`text-xs leading-relaxed italic ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
                                  "O aluno demonstrou excelente entendimento na identificação anatômica em cortes seccionais e domínio no ajuste de janelas em unidades Hounsfield para diferenciar densidades pulmonares e mediastinais."
                                </p>
                              </div>
                              <div className="mt-3 flex items-center gap-3">
                                <button
                                  onClick={handleExportPdf}
                                  className="text-xs text-cyan-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">download</span>
                                  Baixar Histórico em PDF
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Regulatory Legend */}
        <div className={`p-4 border-t flex flex-col md:flex-row items-center justify-between text-xs gap-3 ${
          isDark ? 'bg-[#0a0e17]/50 border-white/5 text-[#869397]' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Média de Aprovação: ≥ 7.0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Exame Final: 4.0 a 6.9
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Frequência Mínima Exigida: 75%
            </span>
          </div>
          <div className={`font-mono text-[11px] ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            RadBio Academic • Turma de Radiologia 2026.1
          </div>
        </div>
      </section>

      {/* Digital Authenticity Guarantee */}
      <div className={`p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${
        isDark ? 'bg-[#141f38]/50 border-[#4cd7f6]/20' : 'bg-white border-cyan-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6]' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
          }`}>
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
          </div>
          <div>
            <h4 className={`text-sm font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Garantia de Autenticidade Acadêmica RadBio
            </h4>
            <p className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-600'}`}>
              Este boletim possui registro de notas institucional e chancela da coordenação do curso de radiologia.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onValidateAuthenticity}
          className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            isDark
              ? 'bg-white/[0.04] hover:bg-white/[0.08] text-[#4cd7f6] border-[#4cd7f6]/30'
              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">qr_code_scanner</span>
          <span>Validar Registro</span>
        </button>
      </div>
    </div>
  );
};
