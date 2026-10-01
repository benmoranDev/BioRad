import React, { useState } from 'react';
import { StudentGradeRecord, ThemeMode } from '../../types';
import { excelExportService } from '../../services/excelExport';
import { pdfExportService } from '../../services/pdfExport';
import { storageService } from '../../services/storage';

interface TeacherGradesViewProps {
  grades: StudentGradeRecord[];
  onUpdateGrades: (grades: StudentGradeRecord[]) => void;
  onShowSuccessToast: (msg: string) => void;
  theme?: ThemeMode;
}

export const TeacherGradesView: React.FC<TeacherGradesViewProps> = ({
  grades,
  onUpdateGrades,
  onShowSuccessToast,
  theme = 'dark'
}) => {
  const [localGrades, setLocalGrades] = useState<StudentGradeRecord[]>(grades);
  const [selectedClass, setSelectedClass] = useState('TC-402: Tomografia Computadorizada Avançada');
  const [statusFilter, setStatusFilter] = useState<'all' | 'risk' | 'review'>('all');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isDark = theme === 'dark';

  const handleGradeChange = (id: string, field: 'gradeN1' | 'gradeN2' | 'gradePractice', value: number) => {
    const val = Math.max(0, Math.min(10, value));
    const updated = localGrades.map(row => {
      if (row.id === id) {
        const nextRow = { ...row, [field]: val };
        // Weighted formula: N1*0.3 + N2*0.4 + Practice*0.3
        const avg = parseFloat((nextRow.gradeN1 * 0.3 + nextRow.gradeN2 * 0.4 + nextRow.gradePractice * 0.3).toFixed(1));
        const status = avg >= 7 ? 'approved' : avg >= 6 ? 'review' : 'risk';
        return {
          ...nextRow,
          calculatedAverage: avg,
          status: status as 'approved' | 'review' | 'risk'
        };
      }
      return row;
    });

    setLocalGrades(updated);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = () => {
    storageService.setStudentGrades(localGrades);
    onUpdateGrades(localGrades);
    setHasUnsavedChanges(false);
    onShowSuccessToast('Rascunho de notas salvo no banco de dados local com sucesso.');
  };

  const handlePublishGrades = () => {
    storageService.setStudentGrades(localGrades);
    onUpdateGrades(localGrades);
    setHasUnsavedChanges(false);
    setShowPublishModal(false);

    // Trigger auto email notification
    storageService.addNotification({
      id: `notif_${Date.now()}`,
      recipientEmail: 'turma.tc402@radbio.edu.br',
      subject: `[Notas Publicadas] Pauta Final da Turma ${selectedClass}`,
      body: 'O Professor Dr. Marcus Vinicius publicou e homologou as notas oficiais de Tomografia Computadorizada. O boletim já reflete a média recalculada.',
      type: 'grade_published',
      timestamp: 'Agora mesmo',
      isRead: false,
      status: 'delivered'
    });

    onShowSuccessToast('Notas publicadas no Portal do Aluno com notificação por e-mail disparada!');
  };

  const handleExportExcel = () => {
    excelExportService.exportGradesToExcel(localGrades, selectedClass);
  };

  const handleExportPdf = () => {
    pdfExportService.exportClassSheetPdf(localGrades, selectedClass);
  };

  const filteredGrades = localGrades.filter(g => {
    if (statusFilter === 'risk') return g.calculatedAverage < 6.0;
    if (statusFilter === 'review') return g.status === 'review';
    return true;
  });

  const classAvg = (localGrades.reduce((acc, curr) => acc + curr.calculatedAverage, 0) / localGrades.length).toFixed(1);
  const atRiskCount = localGrades.filter(g => g.calculatedAverage < 6.0).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-7 pb-28">
      {/* Header & Breadcrumb */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#869397] mb-1 font-mono">
            <span>RadBio Acadêmico</span>
            <span>&gt;</span>
            <span className="text-cyan-500">Corpo Docente</span>
            <span>&gt;</span>
            <span className={isDark ? 'text-white' : 'text-slate-800'}>Pauta de Avaliação</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Lançamento de Notas &amp; Gestão de Turmas
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Ponderação de notas N1 (30%), N2 (40%) e Prática de TC (30%) com cálculo em tempo real e avisos automáticos aos alunos.
          </p>
        </div>

        {/* Action Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className={`px-4 py-2 rounded-full border text-xs outline-none ${
              isDark
                ? 'bg-[#141f38]/70 border-white/10 text-white focus:border-[#4cd7f6]'
                : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
            }`}
          >
            <option value="TC-402: Tomografia Computadorizada Avançada">TC-402: Tomografia Computadorizada Avançada</option>
            <option value="RAD-601: Exames Contrastados & Farmacologia">RAD-601: Exames Contrastados & Farmacologia</option>
            <option value="RAD-720: Centro Cirúrgico & Arco em C">RAD-720: Centro Cirúrgico & Arco em C</option>
            <option value="RAD-802: Ressonância Magnética e Neuro">RAD-802: Ressonância Magnética e Neuro</option>
            <option value="RAD-304: Radiologia Digital">RAD-304: Radiologia Digital</option>
          </select>

          <div className={`flex items-center border rounded-full p-1 text-xs ${
            isDark ? 'bg-[#141f38]/70 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] font-bold' : 'bg-cyan-600 text-white font-bold'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({localGrades.length})
            </button>
            <button
              onClick={() => setStatusFilter('risk')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                statusFilter === 'risk'
                  ? 'bg-amber-500/20 text-amber-500 font-bold'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Risco ({atRiskCount})
            </button>
          </div>
        </div>
      </section>

      {/* Class Metrics Bento (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`p-6 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
            <span>Média Geral da Turma</span>
            <span className="material-symbols-outlined text-cyan-600">analytics</span>
          </div>
          <div className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] my-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {classAvg} <span className="text-sm font-normal text-gray-400">/ 10.0</span>
          </div>
          <div className="text-xs text-emerald-500 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-xs">trending_up</span> Desempenho Estável (+0.2)
          </div>
        </div>

        <div className={`p-6 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
            <span>Alunos em Risco (&lt; 6.0)</span>
            <span className="material-symbols-outlined text-amber-500">warning</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-500 font-['Plus_Jakarta_Sans'] my-2">
            {atRiskCount} <span className="text-sm font-normal text-gray-400">alunos</span>
          </div>
          <div className={`text-xs ${isDark ? 'text-amber-400/80' : 'text-amber-600 font-medium'}`}>
            Notificação de monitoria pronta
          </div>
        </div>

        <div className={`p-6 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
            <span>Taxa de Aproveitamento</span>
            <span className="material-symbols-outlined text-emerald-500">verified</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans'] my-2">
            {(((localGrades.length - atRiskCount) / localGrades.length) * 100).toFixed(0)}%
          </div>
          <div className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
            {localGrades.length - atRiskCount} alunos aptos para certificação
          </div>
        </div>

        <div className={`p-6 rounded-[28px] backdrop-blur-2xl border shadow-xl flex flex-col justify-between ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
            <span>Exportações Acadêmicas</span>
            <span className="material-symbols-outlined text-cyan-600">file_download</span>
          </div>
          <div className="flex items-center gap-2 my-2">
            <button
              onClick={handleExportExcel}
              className="flex-1 py-2 px-3 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">table_view</span>
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex-1 py-2 px-3 rounded-full bg-cyan-500/20 text-cyan-600 text-xs font-bold border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span>PDF</span>
            </button>
          </div>
          <div className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Pauta oficial homologada</div>
        </div>
      </section>

      {/* Interactive Gradebook Table */}
      <section className={`rounded-[32px] overflow-hidden backdrop-blur-2xl border shadow-xl ${
        isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'border-white/10 bg-[#181b25]/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <h3 className={`text-base font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pauta da Turma: {selectedClass}
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Edite as notas diretamente nos campos numéricos para recalcular a média instantaneamente.
            </p>
          </div>
          <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
            isDark ? 'bg-[#0a0e17]/80 text-[#4cd7f6] border-white/5' : 'bg-white text-cyan-700 border-slate-200'
          }`}>
            Fórmula: (N1 × 0.3) + (N2 × 0.4) + (Prática TC × 0.3)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`uppercase tracking-wider border-b font-semibold ${
                isDark ? 'bg-[#0a0e17]/80 text-[#869397] border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-3.5 px-5">Estudante</th>
                <th className="py-3.5 px-4 font-mono">Matrícula</th>
                <th className="py-3.5 px-3 text-center">N1 (Teoria)</th>
                <th className="py-3.5 px-3 text-center">N2 (Protocolos)</th>
                <th className="py-3.5 px-3 text-center">Prática TC</th>
                <th className="py-3.5 px-4 text-center">Média Calculada</th>
                <th className="py-3.5 px-4 text-center">Situação</th>
                <th className="py-3.5 px-5">Parecer do Professor</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
              {filteredGrades.map(student => (
                <tr
                  key={student.id}
                  className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
                >
                  {/* Nome e Foto */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.studentAvatar}
                        alt={student.studentName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-500/30"
                      />
                      <div>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {student.studentName}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                          {student.studentEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Matrícula */}
                  <td className={`py-3.5 px-4 font-mono ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
                    {student.enrollmentId}
                  </td>
                  {/* N1 input */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={student.gradeN1}
                      onChange={e => handleGradeChange(student.id, 'gradeN1', parseFloat(e.target.value) || 0)}
                      className={`w-14 p-1 text-center font-mono font-bold rounded-lg border outline-none ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-[#4cd7f6]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      }`}
                    />
                  </td>
                  {/* N2 input */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={student.gradeN2}
                      onChange={e => handleGradeChange(student.id, 'gradeN2', parseFloat(e.target.value) || 0)}
                      className={`w-14 p-1 text-center font-mono font-bold rounded-lg border outline-none ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-[#4cd7f6]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      }`}
                    />
                  </td>
                  {/* Pratica input */}
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={student.gradePractice}
                      onChange={e => handleGradeChange(student.id, 'gradePractice', parseFloat(e.target.value) || 0)}
                      className={`w-14 p-1 text-center font-mono font-bold rounded-lg border outline-none ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-emerald-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </td>
                  {/* Média */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                    <span
                      className={
                        student.calculatedAverage >= 7.0
                          ? 'text-emerald-500'
                          : student.calculatedAverage >= 6.0
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }
                    >
                      {student.calculatedAverage.toFixed(1)}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        student.calculatedAverage >= 7.0
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : student.calculatedAverage >= 6.0
                          ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          : 'bg-red-500/15 text-red-500 border border-red-500/30'
                      }`}
                    >
                      {student.calculatedAverage >= 7.0 ? 'Aprovado' : student.calculatedAverage >= 6.0 ? 'Em Revisão' : 'Risco Crítico'}
                    </span>
                  </td>
                  {/* Parecer */}
                  <td className={`py-3.5 px-5 max-w-xs truncate text-[11px] ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    {student.feedback}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating Bottom Glass Actions Bar */}
      <div className={`fixed bottom-4 left-4 right-4 lg:left-72 max-w-5xl mx-auto z-30 p-4 rounded-2xl backdrop-blur-2xl border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-[#181b25]/90 border-cyan-500/30' : 'bg-white/95 border-cyan-400 shadow-cyan-900/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${hasUnsavedChanges ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
          <span className={`text-xs ${isDark ? 'text-[#bcc9cd]' : 'text-slate-700'}`}>
            {hasUnsavedChanges
              ? 'Existem alterações de notas não salvas no banco de dados.'
              : 'Todas as notas estão salvas e sincronizadas.'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveDraft}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-[#090d16] font-bold text-xs shadow-lg shadow-[#06b6d4]/30 hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">publish</span>
            <span>Publicar Notas no Portal</span>
          </button>
        </div>
      </div>

      {/* Confirmation Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#1c1f29] border-[#4cd7f6]/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600">
              <span className="material-symbols-outlined text-3xl">send</span>
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                Confirmar Publicação de Notas
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
                Esta ação atualizará imediatamente o boletim oficial de todos os alunos matriculados na turma{' '}
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedClass}</strong> e disparará as notificações automáticas por e-mail.
              </p>
            </div>
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-[#0a0e17]/80 border-white/5 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div>Total de alunos: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{localGrades.length}</strong></div>
              <div>Média geral recalculada: <strong className="text-cyan-600">{classAvg}</strong></div>
              <div>Alunos em risco com notificação de monitoria: <strong className="text-amber-500">{atRiskCount}</strong></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className={`px-4 py-2 rounded-xl text-xs cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handlePublishGrades}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#4edea3] text-[#090d16] font-bold text-xs shadow-lg shadow-[#06b6d4]/30 cursor-pointer hover:opacity-95"
              >
                Confirmar &amp; Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
