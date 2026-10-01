import { StudentGradeRecord, Course } from '../types';

export const excelExportService = {
  exportGradesToExcel(records: StudentGradeRecord[], className: string): void {
    const headers = ['Matrícula', 'Nome do Aluno', 'E-mail', 'Frequência (%)', 'Nota N1 (30%)', 'Nota N2 (40%)', 'Prática Lab TC (30%)', 'Média Final', 'Situação', 'Parecer Docente'];
    
    const rows = records.map(r => [
      `"${r.enrollmentId}"`,
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      r.attendance,
      r.gradeN1.toFixed(1),
      r.gradeN2.toFixed(1),
      r.gradePractice.toFixed(1),
      r.calculatedAverage.toFixed(1),
      `"${r.calculatedAverage >= 7 ? 'Aprovado' : r.calculatedAverage >= 6 ? 'Em Análise' : 'Risco Acadêmico'}"`,
      `"${(r.feedback || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [
      [`"PAUTA OFICIAL DE AVALIAÇÃO - ${className.toUpperCase()}"`],
      [`"Data de Exportação: ${new Date().toLocaleString('pt-BR')}"`],
      [],
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pauta_Notas_${className.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportPerformanceReport(courses: Course[], studentName: string): void {
    const headers = ['Código', 'Disciplina de Radiologia', 'Docente Responsável', 'Créditos', 'Média Parcial', 'Progresso (%)', 'Situação'];
    
    const rows = courses.map(c => [
      `"${c.code}"`,
      `"${c.title}"`,
      `"${c.instructor}"`,
      c.credits,
      c.grade.toFixed(1),
      c.progress,
      `"${c.status === 'completed' ? 'Concluído' : 'Em Andamento'}"`
    ]);

    const csvContent = '\uFEFF' + [
      [`"RELATÓRIO DE DESEMPENHO ACADÊMICO - ${studentName.toUpperCase()}"`],
      [`"Gerado em: ${new Date().toLocaleString('pt-BR')}"`],
      [],
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Desempenho_${studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
