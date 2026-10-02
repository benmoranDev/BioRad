import React, { useState, useMemo, useEffect } from 'react';
import { PaymentTransaction, ThemeMode, User, CursoLivre } from '../../types';
import { storageService } from '../../services/storage';
import { formatCpf } from '../../utils/cpfValidator';
import { pdfExportService } from '../../services/pdfExport';
import { emailService } from '../../services/emailService';

interface StudentPaymentsDashboardProps {
  theme?: ThemeMode;
  isStudentView?: boolean;
}

export const StudentPaymentsDashboard: React.FC<StudentPaymentsDashboardProps> = ({
  theme = 'dark',
  isStudentView = false
}) => {
  const isDark = theme === 'dark';
  const currentUser = storageService.getCurrentUser();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => storageService.getPaymentTransactions());
  const [cursosLivres] = useState<CursoLivre[]>(() => storageService.getCursosLivres());
  const [registeredUsers] = useState<User[]>(() => storageService.getRegisteredUsers());

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'pix' | 'credit'>('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Quick action states
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [receiptModalTx, setReceiptModalTx] = useState<PaymentTransaction | null>(null);

  // New Manual Enrollment Modal State (Admin)
  const [showNewEnrollModal, setShowNewEnrollModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newCourseId, setNewCourseId] = useState(cursosLivres[0]?.id || '');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'pix' | 'credit'>('pix');
  const [newInstallments, setNewInstallments] = useState(1);

  // Refresh transactions from storage
  const refreshData = () => {
    setTransactions(storageService.getPaymentTransactions());
  };

  useEffect(() => {
    const handleStateChange = () => refreshData();
    window.addEventListener('radbio_state_changed', handleStateChange);
    return () => window.removeEventListener('radbio_state_changed', handleStateChange);
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // If student view, only show their own transactions
      if (isStudentView && tx.studentEmail.toLowerCase() !== currentUser.email.toLowerCase() && tx.studentName.toLowerCase() !== currentUser.name.toLowerCase()) {
        return false;
      }

      // Method filter
      if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) return false;

      // Course filter
      if (courseFilter !== 'all' && tx.courseId !== courseFilter) return false;

      // Text query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tx.studentName.toLowerCase().includes(q);
        const matchesEmail = tx.studentEmail.toLowerCase().includes(q);
        const matchesCpf = tx.studentCpf?.toLowerCase().includes(q) || false;
        const matchesCourse = tx.courseTitle.toLowerCase().includes(q);
        const matchesCode = tx.transactionCode.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCpf && !matchesCourse && !matchesCode) return false;
      }

      return true;
    });
  }, [transactions, isStudentView, currentUser, methodFilter, courseFilter, searchQuery]);

  // Financial KPI Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pixRevenue = 0;
    let creditRevenue = 0;
    let countPix = 0;
    let countCredit = 0;

    transactions.forEach(tx => {
      totalRevenue += tx.amount || 0;
      if (tx.paymentMethod === 'pix') {
        pixRevenue += tx.amount || 0;
        countPix++;
      } else {
        creditRevenue += tx.amount || 0;
        countCredit++;
      }
    });

    return {
      totalRevenue,
      pixRevenue,
      creditRevenue,
      countPix,
      countCredit,
      totalCount: transactions.length
    };
  }, [transactions]);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 4000);
  };

  // Re-send Email Confirmation
  const handleResendConfirmationEmail = (tx: PaymentTransaction) => {
    const studentUser = registeredUsers.find(u => u.email.toLowerCase() === tx.studentEmail.toLowerCase()) || {
      id: 'u_student',
      name: tx.studentName,
      email: tx.studentEmail,
      role: 'student' as const,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      enrollmentId: '2026-RAD-8842',
      specialty: 'Tomografia Computadorizada',
      gpa: 4.0,
      completedHours: 40,
      totalRequiredHours: 180,
      attendanceRate: 100,
      status: 'regular'
    };

    emailService.sendEnrollmentConfirmation(tx, studentUser, 60);
    showToast(`✓ Comprovante e credenciais reenviados para ${tx.studentEmail}!`);
  };

  // Create manual enrollment (Admin)
  const handleCreateManualEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = registeredUsers.find(u => u.id === newStudentId) || registeredUsers[0];
    const course = cursosLivres.find(c => c.id === newCourseId) || cursosLivres[0];

    if (!student || !course) {
      showToast('Selecione um aluno e um curso válido.');
      return;
    }

    const amount = course.price || 149.00;
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);

    const tx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      transactionCode: newPaymentMethod === 'pix'
        ? `PIX-OK-${Date.now().toString().slice(-8)}`
        : `CARD-${newInstallments}X-${Date.now().toString().slice(-8)}`,
      courseId: course.id,
      courseTitle: course.title,
      studentName: student.name,
      studentEmail: student.email,
      studentCpf: student.cpf || '123.456.789-00',
      amount,
      paymentMethod: newPaymentMethod,
      installments: newPaymentMethod === 'credit' ? newInstallments : 1,
      cardBrand: newPaymentMethod === 'credit' ? 'mastercard' : undefined,
      cardLast4: newPaymentMethod === 'credit' ? '4890' : undefined,
      pixEndToEndId: newPaymentMethod === 'pix' ? `E90239556${now.getFullYear()}${Date.now().toString().slice(-8)}` : undefined,
      status: 'completed',
      createdAt: nowStr,
      paidAt: nowStr,
      certificateWorkloadHours: 40,
      accessPeriodDays: 60,
      enrolledAt: nowStr
    };

    storageService.enrollInCursoLivre(course.id, tx);
    showToast(`✓ Pagamento confirmado e matrícula homologada para ${student.name}!`);
    setShowNewEnrollModal(false);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {activeToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{activeToast}</span>
        </div>
      )}

      {/* Financial KPIs Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Faturamento Total */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Faturamento Total (Pagamentos OK)</span>
            <span className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            <strong className="text-emerald-400">{metrics.totalCount}</strong> matrículas aprovadas no sistema
          </p>
        </div>

        {/* KPI 2: PIX À Vista */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">PIX Instantâneo À Vista</span>
            <span className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-teal-300">
            R$ {metrics.pixRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            <strong className="text-teal-300">{metrics.countPix}</strong> pagamentos via QR Code Bacen
          </p>
        </div>

        {/* KPI 3: Cartão de Crédito Parcelado */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Cartão de Crédito Mercado Pago (Até 6x)</span>
            <span className="w-9 h-9 rounded-2xl bg-[#009ee3]/20 text-[#009ee3] border border-[#009ee3]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">credit_card</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300">
            R$ {metrics.creditRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            <strong className="text-cyan-300">{metrics.countCredit}</strong> compras parceladas em até 6x
          </p>
        </div>

        {/* KPI 4: Taxa de Aprovação */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Status de Compensação</span>
            <span className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified</span>
            </span>
          </div>
          <div className="text-2xl font-black font-['Plus_Jakarta_Sans'] text-emerald-400 flex items-center gap-1.5">
            <span>100% OK</span>
          </div>
          <p className="text-[11px] text-purple-300 mt-1 font-semibold">
            Liberação imediata da sala de aula e simulador
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className={`p-6 sm:p-7 rounded-[36px] border shadow-2xl backdrop-blur-2xl space-y-6 ${
        isDark ? 'bg-[#141f38]/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header & New Enrollment Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <span className="material-symbols-outlined text-lg">point_of_sale</span>
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold font-['Plus_Jakarta_Sans']">
                {isStudentView ? 'Meus Pagamentos & Comprovantes de Matrícula' : 'Dashboard de Pagamentos OK & Matrículas dos Alunos'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Controle financeiro com suporte a <strong>PIX Instantâneo À Vista</strong> e <strong>Cartão de Crédito em até 12x</strong> com emissão de comprovante oficial.
            </p>
          </div>

          {!isStudentView && (
            <button
              type="button"
              onClick={() => setShowNewEnrollModal(true)}
              className="px-5 py-2.5 !rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-base">add_card</span>
              <span>Homologar Pagamento Manual</span>
            </button>
          )}
        </div>

        {/* Filters Bar */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por aluno, e-mail, CPF, protocolo ou curso..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            {/* Method Filter */}
            <div>
              <select
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value as any)}
                className={`w-full p-2 rounded-xl text-xs border outline-none cursor-pointer ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todas as Formas de Pagamento</option>
                <option value="pix">PIX Instantâneo À Vista</option>
                <option value="credit">Cartão de Crédito (Parcelado)</option>
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <select
                value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
                className={`w-full p-2 rounded-xl text-xs border outline-none cursor-pointer ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todas as Disciplinas ({cursosLivres.length})</option>
                {cursosLivres.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-[#0a0e17]/80 border-white/10 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <th className="py-3.5 px-4">Discente / Aluno</th>
                <th className="py-3.5 px-4">Curso / Disciplina</th>
                <th className="py-3.5 px-4">Forma de Pagamento</th>
                <th className="py-3.5 px-4">Valor Pago</th>
                <th className="py-3.5 px-4">Data &amp; Hora</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-gray-500">payments</span>
                    <p className="text-xs">Nenhum pagamento localizado para os filtros informados.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isPix = tx.paymentMethod === 'pix';
                  const inst = tx.installments || 1;

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isDark ? '' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                            {tx.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{tx.studentName}</p>
                            <p className="text-[10px] text-gray-400 truncate">{tx.studentEmail}</p>
                            {tx.studentCpf && (
                              <p className="text-[10px] font-mono text-cyan-400">{formatCpf(tx.studentCpf)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-semibold text-white truncate leading-snug">{tx.courseTitle}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-gray-400">
                          Protocolo: <strong className="text-cyan-300">{tx.transactionCode}</strong>
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isPix ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">bolt</span>
                            <span>PIX À Vista</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">credit_card</span>
                            <span>Cartão ({inst}x de R$ {(tx.amount / inst).toFixed(2)})</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-sm">
                          R$ {tx.amount.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-gray-400">40h Certificadas</span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-gray-300">
                        {tx.paidAt || tx.createdAt}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Pagamento OK
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Export Official PDF */}
                          <button
                            type="button"
                            onClick={() => pdfExportService.exportComprovante(tx)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-white/15"
                            title="Baixar comprovante em PDF Paisagem"
                          >
                            <span className="material-symbols-outlined text-sm text-cyan-400">download</span>
                            <span>PDF</span>
                          </button>

                          {/* View Digital Receipt */}
                          <button
                            type="button"
                            onClick={() => setReceiptModalTx(tx)}
                            className="p-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
                            title="Ver recibo digital com autenticação"
                          >
                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                          </button>

                          {/* Re-send Email */}
                          {!isStudentView && (
                            <button
                              type="button"
                              onClick={() => handleResendConfirmationEmail(tx)}
                              className="p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all cursor-pointer"
                              title="Reenviar e-mail de confirmação"
                            >
                              <span className="material-symbols-outlined text-sm">mail</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: RECIBO DIGITAL COM AUTENTICAÇÃO ================= */}
      {receiptModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`max-w-md w-full p-6 sm:p-7 rounded-[32px] border shadow-2xl space-y-4 text-left ${
            isDark ? 'bg-[#141b2d] border-emerald-500/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">verified</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Comprovante Oficial de Matrícula
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Protocolo:</span>
                <span className="text-cyan-400 font-bold">{receiptModalTx.transactionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Curso:</span>
                <span className="text-white truncate max-w-[200px]">{receiptModalTx.courseTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Forma:</span>
                <span className="text-emerald-300 font-bold uppercase">
                  {receiptModalTx.paymentMethod === 'pix' ? 'PIX À Vista' : `Cartão de Crédito (${receiptModalTx.installments || 1}x)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valor Pago:</span>
                <span className="text-white font-bold">R$ {receiptModalTx.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Data/Hora:</span>
                <span className="text-gray-300">{receiptModalTx.paidAt || receiptModalTx.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Discente:</span>
                <span className="text-white">{receiptModalTx.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPF:</span>
                <span className="text-gray-300">{formatCpf(receiptModalTx.studentCpf || '')}</span>
              </div>
              {receiptModalTx.pixEndToEndId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">EndToEndId BACEN:</span>
                  <span className="text-[10px] text-cyan-300 truncate max-w-[170px]">{receiptModalTx.pixEndToEndId}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Autenticação digital bancária processada pelo Instituto Biorad Cursos S/A • CNPJ: 45.892.110/0001-34.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => pdfExportService.exportComprovante(receiptModalTx)}
                className="w-1/2 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/20"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Baixar PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="w-1/2 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
              >
                Fechar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: HOMOLOGAR PAGAMENTO MANUAL (ADMIN) ================= */}
      {showNewEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <form
            onSubmit={handleCreateManualEnrollment}
            className={`max-w-md w-full p-6 sm:p-7 rounded-[32px] border shadow-2xl space-y-4 my-8 ${
              isDark ? 'bg-[#141b2d] border-cyan-400/40 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">add_card</span>
                <h3 className="text-sm font-extrabold font-['Plus_Jakarta_Sans']">
                  Homologar Matrícula / Pagamento Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewEnrollModal(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Select Student */}
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1">Selecionar Aluno:</label>
              <select
                value={newStudentId}
                onChange={e => setNewStudentId(e.target.value)}
                required
                className={`w-full p-2.5 rounded-xl text-xs border outline-none cursor-pointer ${
                  isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="">Selecione um discente cadastrado...</option>
                {registeredUsers.filter(u => u.role === 'student').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Course */}
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1">Curso / Disciplina:</label>
              <select
                value={newCourseId}
                onChange={e => setNewCourseId(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border outline-none cursor-pointer ${
                  isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                {cursosLivres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} (R$ {c.price?.toFixed(2) || '149.00'})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Method */}
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1">Forma de Pagamento:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewPaymentMethod('pix')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    newPaymentMethod === 'pix'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-white/5 text-gray-300 border border-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>PIX À Vista</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewPaymentMethod('credit')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    newPaymentMethod === 'credit'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-white/5 text-gray-300 border border-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">credit_card</span>
                  <span>Cartão de Crédito</span>
                </button>
              </div>
            </div>

            {/* If Credit Card, Select Installments */}
            {newPaymentMethod === 'credit' && (
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1">Parcelas Mercado Pago (até 6x):</label>
                <select
                  value={newInstallments}
                  onChange={e => setNewInstallments(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none cursor-pointer ${
                    isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num === 1 ? '1x à vista sem juros' : `${num}x no Mercado Pago sem juros`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewEnrollModal(false)}
                className="w-1/2 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs hover:scale-[1.02] cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Homologar Pagamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
