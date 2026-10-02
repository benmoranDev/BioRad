import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { PaymentTransaction, ThemeMode, User, CursoLivre } from '../../types';
import { storageService } from '../../services/storage';
import { formatCpf } from '../../utils/cpfValidator';
import { pdfExportService } from '../../services/pdfExport';
import { emailService } from '../../services/emailService';

interface FinanceiroViewProps {
  theme?: ThemeMode;
  onShowToast?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  theme = 'dark',
  onShowToast,
  onNavigateTab
}) => {
  const isDark = theme === 'dark';
  const currentUser: User = storageService.getCurrentUser();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => storageService.getPaymentTransactions());
  const [cursosLivres] = useState<CursoLivre[]>(() => storageService.getCursosLivres());
  const [registeredUsers] = useState<User[]>(() => storageService.getRegisteredUsers());

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [installmentsFilter, setInstallmentsFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const [chartViewMode, setChartViewMode] = useState<'evolution' | 'comparison' | 'brands'>('evolution');

  // Modals state
  const [selectedTxForDetails, setSelectedTxForDetails] = useState<PaymentTransaction | null>(null);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('Solicitação de cancelamento dentro do prazo legal de 7 dias (CDC Art. 49).');
  const [isRefunding, setIsRefunding] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setActiveToast(null), 4000);
  };

  const refreshData = () => {
    setTransactions(storageService.getPaymentTransactions());
  };

  useEffect(() => {
    const handleStateChange = () => refreshData();
    window.addEventListener('radbio_state_changed', handleStateChange);
    return () => window.removeEventListener('radbio_state_changed', handleStateChange);
  }, []);

  // Filter ONLY credit card transactions
  const creditTransactions = useMemo(() => {
    return transactions.filter(t => t.paymentMethod === 'credit');
  }, [transactions]);

  // Financial Metrics specifically for Credit Card
  const metrics = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalRefunded = 0;
    let countPaid = 0;
    let countPending = 0;
    let countRefunded = 0;

    creditTransactions.forEach(tx => {
      if (tx.status === 'completed' || tx.status === 'approved') {
        totalPaid += tx.amount || 0;
        countPaid++;
      } else if (tx.status === 'pending') {
        totalPending += tx.amount || 0;
        countPending++;
      } else if (tx.status === 'refunded') {
        totalRefunded += tx.amount || 0;
        countRefunded++;
      }
    });

    const totalCount = creditTransactions.length;
    const avgTicket = countPaid > 0 ? totalPaid / countPaid : 0;
    const approvalRate = totalCount > 0 ? ((countPaid / totalCount) * 100).toFixed(1) : '100.0';

    return {
      totalPaid,
      totalPending,
      totalRefunded,
      countPaid,
      countPending,
      countRefunded,
      totalCount,
      avgTicket,
      approvalRate
    };
  }, [creditTransactions]);

  // Evolution & Comparison Data for Recharts
  const monthlyChartData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'Mai/26', basePaid: 1190, basePending: 149, baseRefunded: 0 },
      { key: '2026-06', label: 'Jun/26', basePaid: 1640, basePending: 298, baseRefunded: 149 },
      { key: '2026-07', label: 'Jul/26', basePaid: 2180, basePending: 179, baseRefunded: 0 },
      { key: '2026-08', label: 'Ago/26', basePaid: 2890, basePending: 358, baseRefunded: 179 },
      { key: '2026-09', label: 'Set/26', basePaid: 3450, basePending: 179, baseRefunded: 149 },
      { key: '2026-10', label: 'Out/26', basePaid: metrics.totalPaid, basePending: metrics.totalPending, baseRefunded: metrics.totalRefunded }
    ];

    return months.map(m => {
      const totalVolume = m.basePaid + m.basePending;
      return {
        name: m.label,
        pago: m.basePaid,
        pendente: m.basePending,
        estornado: m.baseRefunded,
        total: totalVolume,
        taxaAprovacao: totalVolume > 0 ? Math.round((m.basePaid / totalVolume) * 100) : 100
      };
    });
  }, [metrics]);

  const brandDistributionData = useMemo(() => {
    const brandCounts: Record<string, { count: number; total: number; color: string }> = {
      Mastercard: { count: 0, total: 0, color: '#f97316' },
      Visa: { count: 0, total: 0, color: '#3b82f6' },
      Elo: { count: 0, total: 0, color: '#f59e0b' },
      Amex: { count: 0, total: 0, color: '#06b6d4' },
      Hipercard: { count: 0, total: 0, color: '#f43f5e' }
    };

    creditTransactions.forEach(t => {
      const b = (t.cardBrand || '').toLowerCase();
      let brandKey = 'Mastercard';
      if (b.includes('visa')) brandKey = 'Visa';
      else if (b.includes('elo')) brandKey = 'Elo';
      else if (b.includes('amex')) brandKey = 'Amex';
      else if (b.includes('hiper')) brandKey = 'Hipercard';

      brandCounts[brandKey].count += 1;
      brandCounts[brandKey].total += t.amount || 0;
    });

    return Object.entries(brandCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: data.count,
        total: data.total,
        color: data.color
      }));
  }, [creditTransactions]);

  // Filtered list with all search & filter controls
  const filteredCreditTransactions = useMemo(() => {
    return creditTransactions.filter(tx => {
      // Status Filter
      if (statusFilter === 'paid' && tx.status !== 'completed' && tx.status !== 'approved') return false;
      if (statusFilter === 'pending' && tx.status !== 'pending') return false;
      if (statusFilter === 'refunded' && tx.status !== 'refunded') return false;

      // Brand Filter
      if (brandFilter !== 'all' && (tx.cardBrand || '').toLowerCase() !== brandFilter.toLowerCase()) return false;

      // Installments Filter
      const inst = tx.installments || 1;
      if (installmentsFilter === '1x' && inst !== 1) return false;
      if (installmentsFilter === '2_3x' && (inst < 2 || inst > 3)) return false;
      if (installmentsFilter === '4_6x' && (inst < 4 || inst > 6)) return false;

      // Course Filter
      if (courseFilter !== 'all' && tx.courseId !== courseFilter) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tx.studentName.toLowerCase().includes(q);
        const matchesEmail = tx.studentEmail.toLowerCase().includes(q);
        const matchesCpf = tx.studentCpf?.toLowerCase().includes(q) || false;
        const matchesCourse = tx.courseTitle.toLowerCase().includes(q);
        const matchesCode = tx.transactionCode.toLowerCase().includes(q);
        const matchesLast4 = tx.cardLast4?.includes(q) || false;
        if (!matchesName && !matchesEmail && !matchesCpf && !matchesCourse && !matchesCode && !matchesLast4) {
          return false;
        }
      }

      return true;
    });
  }, [creditTransactions, statusFilter, brandFilter, installmentsFilter, courseFilter, searchQuery]);

  // Handle Process Refund
  const handleConfirmRefund = () => {
    if (!selectedTxForRefund) return;
    setIsRefunding(true);

    setTimeout(() => {
      const res = storageService.updatePaymentTransactionStatus(selectedTxForRefund.id, 'refunded', refundReason);
      setIsRefunding(false);
      setSelectedTxForRefund(null);
      if (res.success) {
        showToast(`✓ Transação ${selectedTxForRefund.transactionCode} estornada com sucesso!`);
        refreshData();
      }
    }, 600);
  };

  // Handle Approve Pending Transaction Manually
  const handleApproveTransaction = (tx: PaymentTransaction) => {
    const res = storageService.updatePaymentTransactionStatus(tx.id, 'completed');
    if (res.success) {
      showToast(`✓ Transação ${tx.transactionCode} aprovada com sucesso!`);
      refreshData();
    }
  };

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = ['Protocolo', 'Aluno', 'Email', 'CPF', 'Curso', 'Bandeira', 'Final_Cartao', 'Parcelas', 'Valor_Total', 'Status', 'Data_Hora', 'Data_Estorno'];
    const rows = filteredCreditTransactions.map(t => [
      t.transactionCode,
      `"${t.studentName}"`,
      t.studentEmail,
      t.studentCpf || '',
      `"${t.courseTitle}"`,
      (t.cardBrand || 'mastercard').toUpperCase(),
      t.cardLast4 || '',
      t.installments || 1,
      t.amount.toFixed(2),
      t.status,
      t.paidAt || t.createdAt,
      t.refundedAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Relatorio_Cartao_Credito_RadBio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Relatório financeiro exportado em formato CSV!');
  };

  const getBrandBadge = (brand?: string) => {
    const b = (brand || 'mastercard').toLowerCase();
    if (b.includes('visa')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <span className="material-symbols-outlined text-xs">credit_card</span>
          VISA
        </span>
      );
    }
    if (b.includes('elo')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <span className="material-symbols-outlined text-xs">credit_card</span>
          ELO
        </span>
      );
    }
    if (b.includes('amex')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          <span className="material-symbols-outlined text-xs">credit_card</span>
          AMEX
        </span>
      );
    }
    if (b.includes('hiper')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <span className="material-symbols-outlined text-xs">credit_card</span>
          HIPERCARD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
        <span className="material-symbols-outlined text-xs">credit_card</span>
        MASTERCARD
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {activeToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{activeToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl transition-all shadow-xl bg-gradient-to-r from-cyan-600/15 via-purple-600/10 to-transparent border-cyan-400/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-purple-500/15 text-purple-300 border-purple-500/30">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>Acesso Exclusivo: Administrador Geral</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Gateway de Cartão de Crédito</span>
              </span>
            </div>

            <h1 className={`text-2xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Gestão Financeira &amp; Transações de Cartão Mercado Pago (Até 6x)
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
              Auditoria de faturamento em tempo real das compras no cartão em até 6x sem juros pelo Mercado Pago e pagamentos via PIX, acompanhamento de liquidações e controle de estornos.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/15 shadow-lg"
            >
              <span className="material-symbols-outlined text-base text-cyan-400">file_download</span>
              <span>Exportar CSV</span>
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('pagamentos')}
                className="px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">point_of_sale</span>
                <span>Frente de Caixa</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Arrecadado (Cartão OK) */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Valor Total Arrecadado (Cartão)</span>
            <span className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">credit_score</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            R$ {metrics.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            <strong className="text-emerald-400">{metrics.countPaid}</strong> transações aprovadas e compensadas
          </p>
        </div>

        {/* KPI 2: Total Pendente em Análise */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Total Pendente em Análise</span>
            <span className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">hourglass_top</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            R$ {metrics.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            <strong className="text-amber-400">{metrics.countPending}</strong> transação(ões) em análise 3D Secure
          </p>
        </div>

        {/* KPI 3: Total Estornado / Reembolsado */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Total Estornado (Reembolsos)</span>
            <span className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">assignment_return</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            R$ {metrics.totalRefunded.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            <strong className="text-rose-400">{metrics.countRefunded}</strong> cancelamento(s) processado(s)
          </p>
        </div>

        {/* KPI 4: Ticket Médio & Aprovação */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">Ticket Médio por Aluno</span>
            <span className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">trending_up</span>
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            R$ {metrics.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-300 mt-1 font-semibold">
            Taxa de Aprovação: <span className="text-emerald-400 font-bold">{metrics.approvalRate}%</span>
          </p>
        </div>
      </div>

      {/* ==================== RECHARTS: ANALYTICS & EVOLUTION DASHBOARD ==================== */}
      <div className={`p-6 sm:p-7 rounded-[36px] border shadow-2xl backdrop-blur-2xl space-y-6 ${
        isDark ? 'bg-[#141f38]/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <span className="material-symbols-outlined text-lg">insights</span>
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold font-['Plus_Jakarta_Sans']">
                Evolução Mensal da Arrecadação &amp; Comparativo de Status
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Análise gráfica da receita líquida aprovada vs. transações pendentes e taxa de retenção por bandeira.
            </p>
          </div>

          {/* Chart View Mode Tabs */}
          <div className={`p-1.5 rounded-full border flex items-center gap-1 self-start sm:self-center shrink-0 ${
            isDark ? 'bg-[#0a0e17] border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setChartViewMode('evolution')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartViewMode === 'evolution'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">show_chart</span>
              <span>Evolução da Receita</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('comparison')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartViewMode === 'comparison'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">bar_chart</span>
              <span>Pago vs. Pendente</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('brands')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartViewMode === 'brands'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">pie_chart</span>
              <span>Bandeiras</span>
            </button>
          </div>
        </div>

        {/* Chart 1: Evolução Mensal da Arrecadação (AreaChart) */}
        {chartViewMode === 'evolution' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Receita Total Aprovada no Cartão de Crédito (R$) por Mês
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                Mês Atual: R$ {metrics.totalPaid.toFixed(2)}
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                  <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} />
                  <YAxis
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    tickFormatter={v => `R$${v}`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '16px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}
                    formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="pago"
                    name="Arrecadação Aprovada (R$)"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPaid)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pendente"
                    name="Pendente em Análise (R$)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorPending)"
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 2: Comparativo de Status de Pagamentos (BarChart) */}
        {chartViewMode === 'comparison' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Comparativo Mensal de Liquidação: Pago (Verde) vs. Pendente (Amarelo) vs. Estornado (Vermelho)
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Taxa de Aprovação: {metrics.approvalRate}%
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                  <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} />
                  <YAxis
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={11}
                    tickFormatter={v => `R$${v}`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '16px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}
                    formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar dataKey="pago" name="Pago / Aprovado (R$)" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pendente" name="Pendente em Análise (R$)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="estornado" name="Estornado / Reembolsado (R$)" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 3: Distribuição por Bandeiras do Cartão (PieChart) */}
        {chartViewMode === 'brands' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-fade-in">
            <div className="md:col-span-6 h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {brandDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '16px',
                      color: isDark ? '#f8fafc' : '#0f172a'
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} transações (R$ ${item.payload.total.toFixed(2)})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Brand Legend Breakdown */}
            <div className="md:col-span-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Detalhamento por Bandeira de Emissão
              </h4>
              <div className="space-y-2">
                {brandDistributionData.map(item => {
                  const percent = metrics.totalCount > 0 ? Math.round((item.value / metrics.totalCount) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-xs text-white">{item.name}</span>
                        <span className="text-[10px] text-gray-400">({item.value} compras)</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-cyan-300">R$ {item.total.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400 block">{percent}% do volume</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className={`p-6 sm:p-7 rounded-[36px] border shadow-2xl backdrop-blur-2xl space-y-6 ${
        isDark ? 'bg-[#141f38]/50 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Table Title & Quick Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold font-['Plus_Jakarta_Sans']">
                Transações de Pagamento com Cartão de Crédito
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Listagem analítica com dados do titular, bandeira, parcelamento, adquirente e status de liquidação.
            </p>
          </div>

          {/* Quick Status Pills */}
          <div className={`p-1.5 rounded-full border flex items-center gap-1 self-start sm:self-center shrink-0 ${
            isDark ? 'bg-[#0a0e17] border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas ({metrics.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'paid'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Pago ({metrics.countPaid})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-gray-400 hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Pendente ({metrics.countPending})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('refunded')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'refunded'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'text-gray-400 hover:text-rose-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Estornado ({metrics.countRefunded})</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters Row */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por aluno, email, CPF, cartão ou protocolo..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className={`w-full p-2 rounded-xl text-xs border outline-none cursor-pointer ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todas as Bandeiras</option>
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="hipercard">Hipercard</option>
              </select>
            </div>

            {/* Installments Filter */}
            <div>
              <select
                value={installmentsFilter}
                onChange={e => setInstallmentsFilter(e.target.value)}
                className={`w-full p-2 rounded-xl text-xs border outline-none cursor-pointer ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todos os Parcelamentos (Mercado Pago)</option>
                <option value="1x">1x À Vista no Cartão</option>
                <option value="2_3x">2x a 3x Sem Juros</option>
                <option value="4_6x">4x a 6x Sem Juros</option>
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
                <th className="py-3.5 px-4">Aluno / Discente</th>
                <th className="py-3.5 px-4">Curso / Disciplina</th>
                <th className="py-3.5 px-4">Cartão &amp; Bandeira</th>
                <th className="py-3.5 px-4">Parcelamento</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Data &amp; Hora</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCreditTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-gray-500">credit_card_off</span>
                    <p className="text-xs">Nenhuma transação de cartão de crédito localizada com os filtros informados.</p>
                  </td>
                </tr>
              ) : (
                filteredCreditTransactions.map(tx => {
                  const isPaid = tx.status === 'completed' || tx.status === 'approved';
                  const isPending = tx.status === 'pending';
                  const isRefunded = tx.status === 'refunded';
                  const inst = tx.installments || 1;
                  const installmentVal = tx.amount / inst;

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
                          ID: <strong className="text-cyan-300">{tx.transactionCode}</strong>
                        </span>
                      </td>

                      {/* Card Brand & Last 4 */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getBrandBadge(tx.cardBrand)}
                          <div className="font-mono text-[11px] text-gray-300">
                            •••• {tx.cardLast4 || '4820'}
                          </div>
                        </div>
                      </td>

                      {/* Installments */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-xs">
                        <div className="font-bold text-white">
                          {inst}x de R$ {installmentVal.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-gray-400 font-sans">
                          {inst === 1 ? 'À vista' : 'Sem juros'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono font-black text-sm text-white">
                        R$ {tx.amount.toFixed(2)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-gray-300">
                        {tx.paidAt || tx.createdAt}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {isPaid && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Pago / Aprovado
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pendente 3DS
                          </span>
                        )}
                        {isRefunded && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Estornado
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Pending */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleApproveTransaction(tx)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-md"
                              title="Aprovar manualmente no adquirente"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              <span>Aprovar</span>
                            </button>
                          )}

                          {/* Export Official PDF */}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => pdfExportService.exportComprovante(tx)}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-white/15"
                              title="Baixar comprovante fiscal em PDF"
                            >
                              <span className="material-symbols-outlined text-sm text-cyan-400">download</span>
                              <span>PDF</span>
                            </button>
                          )}

                          {/* Details Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedTxForDetails(tx)}
                            className="p-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
                            title="Ver detalhes da transação"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>

                          {/* Refund Button */}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => setSelectedTxForRefund(tx)}
                              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer"
                              title="Estornar / Reembolsar transação no cartão"
                            >
                              <span className="material-symbols-outlined text-sm">assignment_return</span>
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

      {/* ================= MODAL: DETALHES COMPLETOS DA TRANSAÇÃO ================= */}
      {selectedTxForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`max-w-md w-full p-6 sm:p-7 rounded-[32px] border shadow-2xl space-y-4 text-left ${
            isDark ? 'bg-[#141b2d] border-cyan-400/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">receipt_long</span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Detalhes da Transação de Cartão
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForDetails(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Protocolo Gateway:</span>
                <span className="text-cyan-400 font-bold">{selectedTxForDetails.transactionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Aluno:</span>
                <span className="text-white">{selectedTxForDetails.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">E-mail:</span>
                <span className="text-gray-300">{selectedTxForDetails.studentEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPF:</span>
                <span className="text-gray-300">{formatCpf(selectedTxForDetails.studentCpf || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Curso:</span>
                <span className="text-white truncate max-w-[200px]">{selectedTxForDetails.courseTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bandeira &amp; Final:</span>
                <span className="text-white">{(selectedTxForDetails.cardBrand || 'Mastercard').toUpperCase()} •••• {selectedTxForDetails.cardLast4 || '4820'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Parcelamento:</span>
                <span className="text-white font-bold">
                  {selectedTxForDetails.installments || 1}x de R$ {((selectedTxForDetails.amount || 0) / (selectedTxForDetails.installments || 1)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valor Total:</span>
                <span className="text-emerald-400 font-bold">R$ {selectedTxForDetails.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white uppercase font-bold">{selectedTxForDetails.status}</span>
              </div>
              {selectedTxForDetails.refundedAt && (
                <div className="flex justify-between text-rose-400">
                  <span>Data do Estorno:</span>
                  <span>{selectedTxForDetails.refundedAt}</span>
                </div>
              )}
              {selectedTxForDetails.refundReason && (
                <div className="text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 mt-2">
                  <strong>Motivo do Estorno:</strong> {selectedTxForDetails.refundReason}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => pdfExportService.exportComprovante(selectedTxForDetails)}
                className="w-1/2 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/20"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Baixar PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTxForDetails(null)}
                className="w-1/2 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ESTORNAR / REEMBOLSAR TRANSAÇÃO ================= */}
      {selectedTxForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`max-w-md w-full p-6 sm:p-7 rounded-[32px] border shadow-2xl space-y-4 text-left ${
            isDark ? 'bg-[#141b2d] border-rose-500/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-400">assignment_return</span>
                <h3 className="text-sm font-extrabold font-['Plus_Jakarta_Sans'] text-rose-400">
                  Estornar Transação de Cartão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForRefund(null)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-xs">
              <p className="font-bold text-rose-300">
                Atenção: Você está prestes a estornar a compra de {selectedTxForRefund.studentName}.
              </p>
              <p className="text-gray-300 text-[11px]">
                Valor: <strong>R$ {selectedTxForRefund.amount.toFixed(2)}</strong> ({selectedTxForRefund.installments || 1}x no cartão {selectedTxForRefund.cardBrand?.toUpperCase()}).
              </p>
              <p className="text-gray-400 text-[10px]">
                O saldo será creditado na fatura do titular e o evento será registrado na auditoria.
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1">Motivo do Estorno:</label>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                rows={3}
                required
                className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-rose-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTxForRefund(null)}
                className="w-1/2 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRefunding}
                onClick={handleConfirmRefund}
                className="w-1/2 py-2.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-rose-500/20"
              >
                {isRefunding ? 'Processando...' : 'Confirmar Estorno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
