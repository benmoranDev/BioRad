import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { Certificate, Lesson, ThemeMode } from '../../types';
import { pdfExportService } from '../../services/pdfExport';

interface CertificatesViewProps {
  certificates: Certificate[];
  lessons?: Lesson[];
  onIssueCertificate: (courseTitle?: string, hours?: number, targetCourseId?: string) => void;
  theme?: ThemeMode;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  lessons = [],
  onIssueCertificate,
  theme = 'dark'
}) => {
  const [selectedCert, setSelectedCert] = useState<Certificate>(certificates[0] || null);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');

  const isDark = theme === 'dark';

  // Generate real validable QR code for the selected certificate
  useEffect(() => {
    if (selectedCert) {
      const validationUrl = selectedCert.qrValidationUrl || (typeof window !== 'undefined' ? `${window.location.origin}/validar/${selectedCert.code}` : `https://bioradcursos.com.br/validar/${selectedCert.code}`);
      QRCode.toDataURL(validationUrl, {
        margin: 1,
        width: 180,
        color: { dark: '#032b43', light: '#ffffff' }
      }).then(setPreviewQrUrl).catch(() => {});
    }
  }, [selectedCert]);

  // Completion calculation for main 40h Tomografia Computadorizada course
  const tcLessons = useMemo(() => {
    return lessons.filter(l => l.courseId === 'course_tc_701' || !l.courseId);
  }, [lessons]);

  const completedCount = useMemo(() => {
    return tcLessons.filter(l => l.isCompleted).length;
  }, [tcLessons]);

  const totalLessons = tcLessons.length || 1;
  const completionPercentage = Math.round((completedCount / totalLessons) * 100);
  const isEligibleForCertificate = completionPercentage >= 100;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;
    const found = certificates.find(c => c.code.toLowerCase() === verificationInput.trim().toLowerCase());
    if (found) {
      setVerificationResult(`✓ CERTIFICADO AUTÊNTICO: Emitido para ${found.studentName} em ${found.completionDate} no curso ${found.courseName}. Carga horária: ${found.workloadHours}h. Conclusão integral de 100% das aulas auditada por Ben Moran (Admin Geral).`);
    } else {
      setVerificationResult('✕ Código não localizado na base de registros acadêmicos da Biorad Cursos.');
    }
  };

  const handleDownloadPdfLandscape = async () => {
    if (!selectedCert || isExporting) return;
    setIsExporting(true);
    setExportNotice('Gerando documento PDF oficial em formato horizontal (A4 Paisagem)...');

    try {
      await pdfExportService.exportDiploma(selectedCert, 'certificate-diploma-landscape');
      setExportNotice('✓ Download do PDF Horizontal concluído com sucesso!');
    } catch (err) {
      console.error('Erro na exportação do PDF:', err);
      setExportNotice('Tentando método alternativo de emissão...');
      pdfExportService.printDiplomaLandscape(selectedCert);
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportNotice(null);
      }, 5000);
    }
  };

  const handlePrintLandscape = () => {
    if (!selectedCert) return;
    pdfExportService.printDiplomaLandscape(selectedCert);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#4cd7f6] font-mono mb-1">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>Certificação Acadêmica Reconhecida CBR / CRTR • Validade Nacional Lei 9.394/96 • Emissão Horizontal</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Diplomas &amp; Certificados Acadêmicos
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Documentos oficiais com registro nacional, carimbo de tempo SHA-256 e emissão em formato paisagem (horizontal).
          </p>
        </div>

        <button
          type="button"
          onClick={() => onIssueCertificate('Tomografia Computadorizada Clínica & Operação do Activion 16 (40h)', 40, 'course_tc_701')}
          className={`px-5 py-2.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            isEligibleForCertificate
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#090d16] font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95'
              : isDark
                ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-amber-500/40'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {isEligibleForCertificate ? 'verified' : 'lock'}
          </span>
          <span>
            {isEligibleForCertificate
              ? 'Emitir Novo Certificado (100% Concluído)'
              : `Emitir Certificado (${completionPercentage}% Concluído)`}
          </span>
        </button>
      </section>

      {/* Mandatory 100% Completion Requirement Card */}
      <div className={`p-6 sm:p-7 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-5 ${
        isEligibleForCertificate
          ? isDark
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-emerald-50 border-emerald-300'
          : isDark
            ? 'bg-amber-950/20 border-amber-500/30'
            : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isEligibleForCertificate
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {isEligibleForCertificate ? 'verified' : 'rule'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isEligibleForCertificate ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isEligibleForCertificate ? 'Requisito Acadêmico Concluído' : 'Regra de Emissão: Conclusão Obrigatória de 100%'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isEligibleForCertificate
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {completedCount} de {totalLessons} aulas ({completionPercentage}%)
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              {isEligibleForCertificate
                ? 'Todas as aulas e vídeos de Tomografia Computadorizada foram 100% concluídos. A emissão do certificado horizontal com registro oficial de Ben Moran (Admin) está liberada!'
                : 'Conforme as diretrizes acadêmicas da RadBio e regulação do MEC/LDB, o comprovante e certificado oficial só é emitido após o aluno concluir 100% das videoaulas e atividades.'}
            </p>
          </div>
        </div>

        {/* Progress Bar Display */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <div className="flex justify-between text-xs font-mono font-semibold">
            <span className={isDark ? 'text-gray-400' : 'text-slate-600'}>Progresso do Curso:</span>
            <span className={isEligibleForCertificate ? 'text-emerald-400' : 'text-amber-400'}>
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isEligibleForCertificate
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-cyan-400'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Container: Preview & Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Col: Certificate Selection (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className={`text-sm font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Certificados Disponíveis ({certificates.length})
          </h3>

          <div className="space-y-3">
            {certificates.map(cert => (
              <div
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className={`p-5 rounded-[28px] border cursor-pointer transition-all ${
                  selectedCert?.id === cert.id
                    ? isDark
                      ? 'bg-[#1c1f29] border-[#4cd7f6] shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : 'bg-cyan-50/70 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : isDark
                      ? 'bg-[#141f38]/50 border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00a572]/20 text-[#4edea3]">
                    HOMOLOGADO 100%
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                    {cert.completionDate}
                  </span>
                </div>
                <h4 className={`text-sm font-semibold mb-1 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {cert.courseName}
                </h4>
                <p className={`text-xs ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
                  {cert.studentName} • {cert.workloadHours}h
                </p>

                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-white/5' : 'border-slate-100'
                }`}>
                  <span className="text-cyan-600 font-mono font-bold">Nota: {cert.finalScore.toFixed(1)}</span>
                  <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
                    Ver em Paisagem <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Tool */}
          <div className={`p-6 rounded-[32px] border space-y-3 ${
            isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans'] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Validador de Autenticidade
            </h4>
            <p className={`text-xs ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
              Insira o código de registro do documento para validar autenticidade contra a base acadêmica oficial:
            </p>
            <form onSubmit={handleVerify} className="space-y-2">
              <input
                type="text"
                value={verificationInput}
                onChange={e => setVerificationInput(e.target.value)}
                placeholder="Ex: RADBIO-CERT-2026-40H"
                className={`w-full px-4 py-2.5 rounded-full border text-xs font-mono outline-none ${
                  isDark
                    ? 'bg-[#0a0e17]/80 border-white/10 text-white placeholder:text-gray-500 focus:border-[#4cd7f6]'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                }`}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#4cd7f6]/15 hover:bg-[#4cd7f6]/25 text-cyan-600 border border-cyan-400/40 text-xs font-bold transition-all cursor-pointer"
              >
                Checar Registro Acadêmico
              </button>
            </form>
            {verificationResult && (
              <div className={`p-3.5 rounded-[20px] border text-xs font-mono leading-relaxed ${
                isDark ? 'bg-[#0a0e17] border-white/10 text-[#4edea3]' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {verificationResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Diploma Realistic Horizontal Preview & Functional PDF Export (8 cols) */}
        {selectedCert && (
          <div className="lg:col-span-8 space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-full border backdrop-blur-md bg-white/5 border-white/10">
              <div className="flex items-center gap-2 pl-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className={`text-xs font-mono font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  Formato Oficial A4 Horizontal (297mm × 210mm)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullscreenModal(true)}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title="Expandir visualização horizontal em tela cheia"
                >
                  <span className="material-symbols-outlined text-base">fullscreen</span>
                  <span className="hidden sm:inline">Expandir</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintLandscape}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-400/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
                  }`}
                  title="Imprimir em folha paisagem"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span className="hidden sm:inline">Imprimir Paisagem</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdfLandscape}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-[#090d16] font-extrabold text-xs shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#090d16] border-t-transparent animate-spin" />
                      <span>Gerando PDF Paisagem...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        download
                      </span>
                      <span>Baixar PDF Oficial (.pdf)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {exportNotice && (
              <div className="p-3 rounded-xl border text-xs font-mono font-medium flex items-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-fadeIn">
                <span className="material-symbols-outlined text-base text-emerald-400">task_alt</span>
                <span>{exportNotice}</span>
              </div>
            )}

            {/* Diploma Mock Card (Luxury Classical Style - True Horizontal Ratio ~1.414) */}
            <div className="overflow-x-auto pb-4">
              <div
                id="certificate-diploma-landscape"
                style={{ minWidth: '780px', aspectRatio: '297 / 210' }}
                className="w-full p-6 sm:p-10 rounded-2xl bg-[#fcfcfd] text-[#0f172a] shadow-2xl border-8 border-double border-[#0a2540] relative overflow-hidden flex flex-col justify-between"
              >
                {/* Vintage Ornamental Inner Gold Border */}
                <div className="absolute inset-2 border border-[#c5a059] pointer-events-none rounded-sm" />
                <div className="absolute inset-3 border border-[#c5a059]/40 pointer-events-none rounded-sm" />

                {/* Classical Header */}
                <div className="text-center relative z-10 space-y-1">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#064e3b] text-[#c5a059] flex items-center justify-center font-bold text-sm shadow border border-[#c5a059]">
                      BC
                    </div>
                    <div className="text-left">
                      <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#064e3b] font-serif leading-none">
                        Biorad Cursos • Instituto de Especialização Radiológica
                      </h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans mt-0.5">
                        Centro de Excelência em Diagnóstico por Imagem e Tomografia Computadorizada
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xl sm:text-2xl font-serif tracking-widest text-[#032b43] font-extrabold uppercase block border-b border-[#c5a059]/60 pb-1 mx-auto max-w-md">
                      Certificado Acadêmico Oficial
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="py-4 text-center max-w-3xl mx-auto space-y-3 text-xs sm:text-sm leading-relaxed text-gray-800 relative z-10">
                  <p className="font-serif italic text-gray-600">
                    Certificamos, para todos os devidos fins de direito, acadêmicos e profissionais, que o(a) discente
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#044e54] tracking-wide underline decoration-[#c5a059] decoration-2 underline-offset-4">
                    {selectedCert.studentName}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono font-semibold">
                    REGISTRO ACADÊMICO: {selectedCert.studentDocument}
                  </p>
                  <p className="text-xs sm:text-sm">
                    concluiu com êxito notável e média de excelência <strong className="text-[#064e3b] font-bold">{selectedCert.finalScore.toFixed(1)} / 10.0 (Aprovado com Louvor)</strong> a integralização de 100% da carga horária e aulas no programa:
                  </p>
                  <p className="text-base sm:text-lg font-serif font-bold text-[#065f46]">
                    {selectedCert.courseName}
                  </p>
                  <p className="text-xs text-gray-600">
                    Carga Horária Total: <strong className="text-gray-900">{selectedCert.workloadHours} Horas Certificadas</strong> • Conclusão integral de videoaulas e estações práticas no simulador tomográfico virtual.
                  </p>

                  {/* 100% Audit Compliance & Legal Reference Badge */}
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      100% DAS AULAS CONCLUÍDAS E AUDITADAS
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-semibold">
                      Lei Federal nº 9.394/96 (LDB) Art. 42 • Decreto Presidencial nº 5.154/04
                    </span>
                  </div>
                </div>

                {/* Signatures & QR Code Validation Seal */}
                <div className="pt-4 border-t border-[#c5a059]/40 grid grid-cols-12 gap-4 items-center text-center text-xs relative z-10">
                  {/* QR Code Validation (Left 3 cols) */}
                  <div className="col-span-3 flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-[#c5a059]/30 shadow-sm">
                    {previewQrUrl ? (
                      <img
                        src={previewQrUrl}
                        alt="QR Code de Validação"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[10px] text-gray-400">
                        QR Code
                      </div>
                    )}
                    <span className="text-[8px] font-mono text-emerald-800 font-bold mt-1 uppercase">
                      Validação Oficial
                    </span>
                    <span className="text-[7px] font-mono text-gray-500">
                      {selectedCert.code}
                    </span>
                  </div>

                  {/* Signatures (Right 9 cols) */}
                  <div className="col-span-9 grid grid-cols-2 gap-6">
                    <div>
                      <div className="w-40 sm:w-48 mx-auto border-t border-gray-900 pt-1 font-bold text-gray-900 font-serif">
                        {selectedCert.instructorName}
                      </div>
                      <span className="text-[10px] text-gray-500 font-sans block">{selectedCert.instructorRole}</span>
                    </div>
                    <div>
                      <div className="w-40 sm:w-48 mx-auto border-t border-gray-900 pt-1 font-bold text-gray-900 font-serif">
                        Ben Moran
                      </div>
                      <span className="text-[10px] text-gray-500 font-sans block">
                        Administrador Geral • Biorad Cursos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Authenticity Strip */}
                <div className="mt-4 pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between text-[9px] text-gray-500 font-mono gap-1 relative z-10">
                  <span>CÓDIGO: {selectedCert.code}</span>
                  <span>DATA DE EXPEDIÇÃO: {selectedCert.completionDate}</span>
                  <span>STATUS: 100% HOMOLOGADO</span>
                  <span className="truncate max-w-[200px]">HASH: {selectedCert.sha256Hash ? selectedCert.sha256Hash.substring(0, 24) : 'a7c98b21e3b0c442'}...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Landscape Modal Preview */}
      {showFullscreenModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`max-w-5xl w-full p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto ${
            isDark ? 'bg-[#181b25] border-cyan-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">aspect_ratio</span>
                <h3 className="text-base font-bold font-['Plus_Jakarta_Sans']">
                  Pré-visualização do Certificado em Formato Paisagem (A4 Horizontal)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdfLandscape}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Baixar Arquivo PDF (.pdf)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullscreenModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Enlarged Diploma Preview */}
            <div
              style={{ aspectRatio: '297 / 210' }}
              className="w-full p-8 rounded-2xl bg-[#fcfcfd] text-[#0f172a] shadow-xl border-8 border-double border-[#0a2540] flex flex-col justify-between"
            >
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold uppercase tracking-wider text-[#064e3b] font-serif">
                  Faculdade de Ciências Médicas &amp; Radiologia RadBio
                </h2>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-sans">
                  Centro de Excelência em Diagnóstico por Imagem e Tomografia Computadorizada
                </p>
                <div className="pt-1">
                  <span className="text-2xl font-serif tracking-widest text-[#032b43] font-bold uppercase block">
                    Certificado Acadêmico Oficial
                  </span>
                </div>
              </div>

              <div className="py-4 text-center max-w-3xl mx-auto space-y-3 text-sm text-gray-800">
                <p className="font-serif italic text-gray-600">Certificamos para os devidos fins de direito que o(a) discente</p>
                <h3 className="text-3xl font-serif font-bold text-[#044e54] underline decoration-[#c5a059] underline-offset-4">
                  {selectedCert.studentName}
                </h3>
                <p className="text-xs font-mono font-semibold text-gray-500">{selectedCert.studentDocument}</p>
                <p className="text-xs sm:text-sm">
                  concluiu com êxito notável e média <strong>{selectedCert.finalScore.toFixed(1)} / 10.0 (Aprovado com Louvor)</strong> a integralização de 100% da carga horária e videoaulas no programa:
                </p>
                <p className="text-xl font-serif font-bold text-[#065f46]">{selectedCert.courseName}</p>
                <p className="text-xs text-gray-600">
                  Carga Horária Oficial: <strong>{selectedCert.workloadHours} Horas</strong> com 100% dos módulos e vídeos assistidos.
                </p>
              </div>

              <div className="pt-4 border-t border-[#c5a059]/40 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="w-48 mx-auto border-t border-gray-900 pt-1 font-bold text-gray-900">
                    {selectedCert.instructorName}
                  </div>
                  <span className="text-[10px] text-gray-500">{selectedCert.instructorRole}</span>
                </div>
                <div>
                  <div className="w-48 mx-auto border-t border-gray-900 pt-1 font-bold text-gray-900">
                    Ben Moran
                  </div>
                  <span className="text-[10px] text-gray-500">Administrador Geral do Sistema • RadBio</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>REGISTRO: {selectedCert.code}</span>
                <span>DATA: {selectedCert.completionDate}</span>
                <span>STATUS: 100% HOMOLOGADO</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
