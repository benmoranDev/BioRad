import React, { useState, useMemo } from 'react';
import { AuditLog, ThemeMode, User } from '../../types';
import { storageService } from '../../services/storage';

interface AuditLogsManagerProps {
  theme?: ThemeMode;
}

export const AuditLogsManager: React.FC<AuditLogsManagerProps> = ({
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [logs, setLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());
  const users = useMemo<User[]>(() => storageService.getRegisteredUsers(), []);

  // Filter States
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Toast feedback state
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. User Filter
      if (selectedUser !== 'all' && log.userId !== selectedUser && log.userEmail !== selectedUser) {
        return false;
      }

      // 2. Action Filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'all' && log.status !== selectedStatus) {
        return false;
      }

      // 4. Date Range Filter
      if (startDate) {
        const logDate = log.dateIso || log.timestamp.slice(0, 10);
        if (logDate < startDate) return false;
      }
      if (endDate) {
        const logDate = log.dateIso || log.timestamp.slice(0, 10);
        if (logDate > endDate) return false;
      }

      // 5. Search Query Filter (text matching description, user, IP, resource)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = log.userName.toLowerCase().includes(q);
        const matchesEmail = log.userEmail.toLowerCase().includes(q);
        const matchesDesc = log.description.toLowerCase().includes(q);
        const matchesIp = log.ipAddress?.toLowerCase().includes(q) || false;
        const matchesResource = log.targetResource?.toLowerCase().includes(q) || false;
        const matchesTitle = log.actionTitle.toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesDesc && !matchesIp && !matchesResource && !matchesTitle) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedUser, selectedAction, selectedStatus, startDate, endDate, searchQuery]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogs, validCurrentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSelectedUser('all');
    setSelectedAction('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Export filtered logs as JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `radbio_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setActionToast(`✓ Exportados ${filteredLogs.length} logs de auditoria em formato JSON!`);
    setTimeout(() => setActionToast(null), 4000);
  };

  // Export filtered logs as CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Data/Hora', 'Usuário', 'E-mail', 'Perfil', 'Ação', 'Descrição', 'IP', 'Dispositivo', 'Recurso'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userEmail}"`,
      `"${l.userRole}"`,
      `"${l.actionTitle}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`,
      `"${l.device || ''}"`,
      `"${l.targetResource || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `radbio_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setActionToast(`✓ Relatório CSV gerado com ${filteredLogs.length} registros!`);
    setTimeout(() => setActionToast(null), 4000);
  };

  // Quick action badge formatter
  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'login':
        return {
          icon: 'login',
          label: 'Login / Acesso',
          bg: isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-800 border-cyan-200'
        };
      case 'logout':
        return {
          icon: 'logout',
          label: 'Logout',
          bg: isDark ? 'bg-slate-500/15 text-slate-300 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200'
        };
      case 'lesson_completed':
        return {
          icon: 'smart_display',
          label: 'Aula Concluída',
          bg: isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200'
        };
      case 'certificate_issued':
        return {
          icon: 'workspace_premium',
          label: 'Certificado 40h',
          bg: isDark ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-amber-50 text-amber-900 border-amber-200'
        };
      case 'task_submitted':
        return {
          icon: 'upload_file',
          label: 'Trabalho / DICOM',
          bg: isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200'
        };
      case 'payment_processed':
        return {
          icon: 'payments',
          label: 'Matrícula PIX',
          bg: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'user_created':
        return {
          icon: 'person_add',
          label: 'Novo Usuário',
          bg: isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
        };
      case 'course_updated':
        return {
          icon: 'edit_note',
          label: 'Gestão Curricular',
          bg: isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-800 border-rose-200'
        };
      default:
        return {
          icon: 'info',
          label: 'Atividade',
          bg: isDark ? 'bg-white/10 text-white border-white/10' : 'bg-slate-100 text-slate-800 border-slate-200'
        };
    }
  };

  // Quick stats
  const totalLogins = logs.filter(l => l.action === 'login').length;
  const totalLessons = logs.filter(l => l.action === 'lesson_completed').length;
  const totalCerts = logs.filter(l => l.action === 'certificate_issued').length;
  const totalTasks = logs.filter(l => l.action === 'task_submitted').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {actionToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{actionToast}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">Acessos &amp; Logins</span>
            <span className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-base">login</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']">{totalLogins}</div>
          <p className="text-[11px] text-cyan-400 mt-1 font-semibold">Autenticações monitoradas</p>
        </div>

        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">Aulas &amp; Quizzes Concluídos</span>
            <span className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <span className="material-symbols-outlined text-base">smart_display</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']">{totalLessons}</div>
          <p className="text-[11px] text-teal-400 mt-1 font-semibold">Integralização de 100%</p>
        </div>

        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">Certificados 40h Homologados</span>
            <span className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <span className="material-symbols-outlined text-base">workspace_premium</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']">{totalCerts}</div>
          <p className="text-[11px] text-amber-400 mt-1 font-semibold">Com validação QR Code</p>
        </div>

        <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg ${
          isDark ? 'bg-[#141f38]/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">Casos &amp; Laudos DICOM</span>
            <span className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <span className="material-symbols-outlined text-base">upload_file</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold font-['Plus_Jakarta_Sans']">{totalTasks}</div>
          <p className="text-[11px] text-purple-400 mt-1 font-semibold">Submissões no simulador</p>
        </div>
      </div>

      {/* Main Audit Logs Container */}
      <div className={`p-6 sm:p-7 rounded-[36px] border shadow-2xl backdrop-blur-2xl space-y-6 ${
        isDark ? 'bg-[#141f38]/50 border-white/10 text-white' : 'bg-white border-slate-200 shadow-md text-slate-900'
      }`}>
        {/* Header & Export Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <span className="material-symbols-outlined text-lg">policy</span>
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold font-['Plus_Jakarta_Sans']">
                Logs de Auditoria &amp; Rastreabilidade Acadêmica
              </h2>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {filteredLogs.length} de {logs.length} eventos
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Registro contínuo e imutável de logins, aulas assistidas, avaliações enviadas e certificados expedidos conforme diretrizes do MEC e LGPD.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 !rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar registros filtrados em planilha CSV"
            >
              <span className="material-symbols-outlined text-sm">table_view</span>
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="px-4 py-2 !rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar arquivo JSON estruturado"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Exportar JSON</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">filter_alt</span>
              <span>Filtros de Auditoria</span>
            </span>
            {(selectedUser !== 'all' || selectedAction !== 'all' || startDate || endDate || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Filter by User */}
            <div>
              <label className="block mb-1 text-gray-400 font-semibold">Filtrar por Usuário</label>
              <select
                value={selectedUser}
                onChange={e => {
                  setSelectedUser(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-2.5 rounded-2xl border outline-none cursor-pointer transition-all ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todos os Usuários ({users.length})</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'student' ? 'Aluno' : u.role === 'professor' ? 'Docente' : 'Admin'})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Action Type */}
            <div>
              <label className="block mb-1 text-gray-400 font-semibold">Tipo de Atividade</label>
              <select
                value={selectedAction}
                onChange={e => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-2.5 rounded-2xl border outline-none cursor-pointer transition-all ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Todas as Atividades</option>
                <option value="login">Logins &amp; Acessos</option>
                <option value="lesson_completed">Conclusão de Aulas</option>
                <option value="certificate_issued">Emissão de Certificados 40h</option>
                <option value="task_submitted">Envio de Casos &amp; Trabalhos</option>
                <option value="payment_processed">Matrículas &amp; Pagamentos PIX</option>
                <option value="user_created">Cadastro de Usuários</option>
                <option value="course_updated">Gestão Curricular</option>
              </select>
            </div>

            {/* Date Range: Start Date */}
            <div>
              <label className="block mb-1 text-gray-400 font-semibold">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-2.5 rounded-2xl border outline-none ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            {/* Date Range: End Date */}
            <div>
              <label className="block mb-1 text-gray-400 font-semibold">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-2.5 rounded-2xl border outline-none ${
                  isDark ? 'bg-[#141b2d] border-white/10 text-white focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Search bar within filters */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por descrição, IP (ex: 189.120), recurso acadêmico, e-mail..."
              className={`w-full pl-10 pr-4 py-2.5 !rounded-full text-xs border outline-none ${
                isDark ? 'bg-[#141b2d] border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-[#0a0e17]/80 border-white/10 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Atividade Registrada</th>
                <th className="py-3.5 px-4">Detalhes do Evento</th>
                <th className="py-3.5 px-4">IP &amp; Dispositivo</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-gray-500">search_off</span>
                    <p className="text-xs">Nenhum registro de auditoria corresponde aos filtros aplicados.</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 cursor-pointer"
                    >
                      Redefinir Filtros
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isDark ? '' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-cyan-400">schedule</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 min-w-[170px]">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                            {log.userName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{log.userName}</p>
                            <p className="text-[10px] text-gray-400 truncate">{log.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-max ${badge.bg}`}>
                          <span className="material-symbols-outlined text-xs">{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Event Details */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-white leading-snug">{log.actionTitle}</p>
                        <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">{log.description}</p>
                        {log.targetResource && (
                          <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-cyan-300">
                            {log.targetResource}
                          </span>
                        )}
                      </td>

                      {/* IP & Device */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[10px] text-gray-400">
                        <div>
                          <span className="font-bold text-gray-300">{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 truncate max-w-[140px]">
                          {log.device || 'Navegador Web'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Auditado
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              Exibindo <strong className="text-white">{filteredLogs.length === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1}</strong> a{' '}
              <strong className="text-white">{Math.min(validCurrentPage * itemsPerPage, filteredLogs.length)}</strong> de{' '}
              <strong className="text-white">{filteredLogs.length}</strong> eventos
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">Por página:</span>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`p-1.5 rounded-xl border text-xs outline-none cursor-pointer ${
                  isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 cursor-pointer"
              title="Primeira página"
            >
              <span className="material-symbols-outlined text-sm">first_page</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 font-bold cursor-pointer"
            >
              Anterior
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, validCurrentPage - 3),
                Math.min(totalPages, validCurrentPage + 2)
              ).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    validCurrentPage === page
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 font-bold cursor-pointer"
            >
              Próxima
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 cursor-pointer"
              title="Última página"
            >
              <span className="material-symbols-outlined text-sm">last_page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
