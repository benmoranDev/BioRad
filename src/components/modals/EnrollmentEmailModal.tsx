import React from 'react';
import { EnrollmentEmailData } from '../../utils/emailTemplates';
import { ThemeMode } from '../../types';

interface EnrollmentEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: EnrollmentEmailData | null;
  theme?: ThemeMode;
  onStartCourse?: () => void;
}

export const EnrollmentEmailModal: React.FC<EnrollmentEmailModalProps> = ({
  isOpen,
  onClose,
  emailData,
  theme = 'dark',
  onStartCourse
}) => {
  if (!isOpen || !emailData) return null;
  const isDark = theme === 'dark';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`max-w-2xl w-full max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? 'bg-[#181d2a] border-[#4cd7f6]/40 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Modal Top Bar */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-white/10 bg-[#121724]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <span className="material-symbols-outlined text-xl">mark_email_read</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Comprovante Oficial de Matrícula
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  E-mail Enviado
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold font-['Plus_Jakarta_Sans']">
                Confirmação de Inscrição &amp; Pagamento
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="Imprimir comprovante"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Email Header Simulation */}
        <div className={`px-5 py-3 border-b text-xs space-y-1.5 ${
          isDark ? 'bg-[#0f1422] border-white/5 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong className="text-gray-400">De:</strong> Biorad Cursos &lt;matriculas@radbio.edu.br&gt;
            </div>
            <div className="font-mono text-[11px] text-gray-400">
              {emailData.paidAt}
            </div>
          </div>
          <div>
            <strong className="text-gray-400">Para:</strong> {emailData.recipientName} &lt;{emailData.recipientEmail}&gt;
          </div>
          <div>
            <strong className="text-gray-400">Assunto:</strong> <span className="text-cyan-400 font-bold">{emailData.subject}</span>
          </div>
        </div>

        {/* Email Body Card Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
          
          {/* Institution Header Brand */}
          <div className="text-center pb-4 border-b border-white/10 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 font-mono text-xs font-bold">
              <span className="material-symbols-outlined text-sm">school</span>
              <span>BIORAD CURSOS • PLATAFORMA DE RADIOLOGIA E IMAGEM</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black font-['Plus_Jakarta_Sans'] text-white">
              Sua Matrícula Foi Homologada com Sucesso!
            </h2>
            <p className="text-xs text-gray-400">
              Parabéns, {emailData.recipientName}! Seu pagamento foi confirmado e seu acesso ao curso está 100% liberado.
            </p>
          </div>

          {/* 2-Month Access Deadline Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/40 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <span className="material-symbols-outlined text-xl">schedule</span>
              <span className="text-sm font-['Plus_Jakarta_Sans']">Prazo de Acesso: 2 Meses (60 Dias Corridos)</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Você tem <strong>2 meses ({emailData.accessPeriodDays} dias)</strong> a partir de hoje para concluir todas as videoaulas, praticar no simulador tomográfico Activion 16 e responder aos questionários de fixação.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20 text-xs font-mono">
              <span>Data de Matrícula: <strong>{emailData.enrolledAt}</strong></span>
              <span className="text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-md font-bold">
                Expiração do Acesso: {emailData.expiresAt}
              </span>
            </div>
          </div>

          {/* Transaction Summary Grid */}
          <div className={`p-4 rounded-2xl border space-y-2.5 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
              Resumo da Transação &amp; Matrícula:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Curso Matriculado:</span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{emailData.courseTitle}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Carga Horária Oficial:</span>
                <strong className="text-emerald-400">{emailData.courseWorkload} Horas Certificadas</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Código da Transação:</span>
                <span className="font-mono text-cyan-300 font-bold">{emailData.transactionCode}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Forma de Pagamento:</span>
                <strong className="capitalize">{emailData.paymentMethod === 'pix' ? 'PIX Instantâneo (Bacen SPI)' : 'Cartão de Crédito'}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Valor Pago:</span>
                <strong className="text-emerald-400 font-mono text-sm">R$ {emailData.amount.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Confirmado &amp; Homologado
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Study Guide */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-gray-300 uppercase tracking-wider font-mono">
              Próximos Passos para Seus Estudos:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-gray-300 leading-relaxed">
              <li>Acesse o <strong>Portal de Aulas</strong> e assista aos módulos em alta definição.</li>
              <li>Pratique no <strong>Simulador Virtual Canon Aquilion / Activion 16</strong> com janelamento Hounsfield e protocolos reais.</li>
              <li>Complete as atividades avaliativas e atinja 100% de progresso para emissão do seu <strong>Certificado Oficial de 40h com QR Code e Hash SHA-256</strong>.</li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-300 text-center font-mono">
            {emailData.legalCompliance}
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'border-white/10 bg-[#121724]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="text-[11px] text-gray-400 text-center sm:text-left">
            Uma cópia deste e-mail foi registrada em seu histórico acadêmico.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
            {onStartCourse && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCourse();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer hover:opacity-95"
              >
                Começar a Estudar Agora →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
