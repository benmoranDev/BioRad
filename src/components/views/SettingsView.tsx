import React, { useState, useEffect } from 'react';
import { SupabaseConfig, ThemeMode, Language, SmtpConfig } from '../../types';
import { storageService, DEFAULT_SMTP_CONFIG } from '../../services/storage';
import { emailService } from '../../services/emailService';
import {
  supabaseService,
  getSupabaseSqlSchema,
  normalizeSupabaseUrl,
  normalizeSupabaseKey,
  ConnectionTestResult,
  SupabaseSyncStats,
  REQUIRED_TABLES
} from '../../services/supabaseClient';

interface SettingsViewProps {
  supabaseConfig: SupabaseConfig;
  onUpdateSupabase: (cfg: SupabaseConfig) => void;
  theme: ThemeMode;
  onToggleTheme: (t: ThemeMode) => void;
  language: Language;
  onSelectLanguage: (l: Language) => void;
  onShowSuccessToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  supabaseConfig,
  onUpdateSupabase,
  theme,
  onToggleTheme,
  language,
  onSelectLanguage,
  onShowSuccessToast
}) => {
  const [url, setUrl] = useState(supabaseConfig.url || 'https://cqijrrybqhukcuqksfjr.supabase.co');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || 'sb_publishable_UO_nT6jH8ml1lgUOU6MgTg_Ld15FrPH');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [syncStats, setSyncStats] = useState<SupabaseSyncStats | null>(null);
  const [syncStatus, setSyncStatus] = useState(supabaseConfig.lastSync || 'Conectado ao Supabase (BioRad Cursos)');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedCredentialsMessage, setSavedCredentialsMessage] = useState(false);
  const [activeTabWizard, setActiveTabWizard] = useState<'credentials' | 'schema' | 'sync'>('credentials');

  // Contagens locais dos registros acadêmicos
  const [localStats, setLocalStats] = useState({
    users: 0,
    courses: 0,
    cursosLivres: 0,
    lessons: 0,
    tasks: 0,
    grades: 0,
    certificates: 0,
    notifications: 0,
    payments: 0
  });

  // SMTP Configuration State
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => storageService.getSmtpConfig());
  const [smtpHost, setSmtpHost] = useState(smtpConfig.host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(smtpConfig.port || 587);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(smtpConfig.secure ?? true);
  const [smtpUser, setSmtpUser] = useState(smtpConfig.user || 'matriculas@radbio.edu.br');
  const [smtpPass, setSmtpPass] = useState(smtpConfig.pass || '');
  const [smtpFromName, setSmtpFromName] = useState(smtpConfig.fromName || 'Biorad Cursos Acadêmico');
  const [smtpFromEmail, setSmtpFromEmail] = useState(smtpConfig.fromEmail || 'matriculas@radbio.edu.br');
  const [smtpReplyTo, setSmtpReplyTo] = useState(smtpConfig.replyTo || 'suporte@radbio.edu.br');
  const [smtpActive, setSmtpActive] = useState<boolean>(smtpConfig.isActive ?? true);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testRecipient, setTestRecipient] = useState('benmoran29dev@gmail.com');
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [smtpSavedMessage, setSmtpSavedMessage] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(smtpConfig.providerPreset || 'custom');

  const applySmtpPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
      setSmtpSecure(true);
      setSmtpFromName('Biorad Cursos • Secretaria Acadêmica');
    } else if (presetKey === 'sendgrid') {
      setSmtpHost('smtp.sendgrid.net');
      setSmtpPort(587);
      setSmtpSecure(true);
      setSmtpUser('apikey');
      setSmtpFromName('Biorad Cursos • Notificações');
    } else if (presetKey === 'ses') {
      setSmtpHost('email-smtp.us-east-1.amazonaws.com');
      setSmtpPort(587);
      setSmtpSecure(true);
      setSmtpFromName('Biorad Cursos • AWS SES');
    } else if (presetKey === 'mailgun') {
      setSmtpHost('smtp.mailgun.org');
      setSmtpPort(587);
      setSmtpSecure(true);
      setSmtpFromName('Biorad Cursos • Mailgun');
    } else if (presetKey === 'hostinger') {
      setSmtpHost('smtp.hostinger.com');
      setSmtpPort(465);
      setSmtpSecure(true);
      setSmtpFromName('Biorad Cursos • Domínio Próprio');
    }
  };

  const handleSaveSmtp = () => {
    const updated: SmtpConfig = {
      ...smtpConfig,
      host: smtpHost.trim(),
      port: Number(smtpPort) || 587,
      secure: smtpSecure,
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      fromName: smtpFromName.trim(),
      fromEmail: smtpFromEmail.trim(),
      replyTo: smtpReplyTo.trim(),
      isActive: smtpActive,
      providerPreset: activePreset as any
    };
    setSmtpConfig(updated);
    storageService.saveSmtpConfig(updated);
    setSmtpSavedMessage(true);
    setTimeout(() => setSmtpSavedMessage(false), 3000);
    onShowSuccessToast('✓ Credenciais do Servidor SMTP salvas com sucesso!');
  };

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    const currentConfig: SmtpConfig = {
      ...smtpConfig,
      host: smtpHost.trim(),
      port: Number(smtpPort) || 587,
      secure: smtpSecure,
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      fromName: smtpFromName.trim(),
      fromEmail: smtpFromEmail.trim(),
      replyTo: smtpReplyTo.trim(),
      isActive: smtpActive,
      providerPreset: activePreset as any
    };

    try {
      const res = await emailService.testSmtpConnection(currentConfig, testRecipient.trim());
      setSmtpTestResult(res);
      if (res.success) {
        onShowSuccessToast('✓ Teste SMTP concluído com sucesso!');
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err?.message || 'Falha ao conectar ao servidor SMTP.'
      });
    } finally {
      setIsTestingSmtp(false);
      refreshLocalStats();
    }
  };

  const refreshLocalStats = () => {
    setLocalStats({
      users: storageService.getRegisteredUsers().length,
      courses: storageService.getCourses().length,
      cursosLivres: storageService.getCursosLivres().length,
      lessons: storageService.getLessons().length,
      tasks: storageService.getTasks().length,
      grades: storageService.getStudentGrades().length,
      certificates: storageService.getCertificates().length,
      notifications: storageService.getNotifications().length,
      payments: storageService.getPaymentTransactions().length
    });
  };

  useEffect(() => {
    refreshLocalStats();
  }, []);

  // Sincroniza estado inicial se mudar externamente
  useEffect(() => {
    if (supabaseConfig.url) {
      setUrl(supabaseConfig.url);
    } else {
      setUrl('https://cqijrrybqhukcuqksfjr.supabase.co');
    }
    if (supabaseConfig.anonKey) {
      setAnonKey(supabaseConfig.anonKey);
    } else {
      setAnonKey('sb_publishable_UO_nT6jH8ml1lgUOU6MgTg_Ld15FrPH');
    }
  }, [supabaseConfig]);

  const handleSaveCredentials = () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = normalizeSupabaseKey(anonKey);
    setUrl(cleanUrl);
    setAnonKey(cleanKey);

    const updated: SupabaseConfig = {
      url: cleanUrl,
      anonKey: cleanKey,
      isConnected: supabaseConfig.isConnected && cleanUrl === supabaseConfig.url,
      lastSync: cleanUrl ? 'Credenciais salvas no navegador' : 'Aguardando configuração'
    };

    onUpdateSupabase(updated);
    storageService.setSupabaseConfig(updated);
    setSavedCredentialsMessage(true);
    setTimeout(() => setSavedCredentialsMessage(false), 3000);
    onShowSuccessToast('✓ Credenciais do Supabase salvas com sucesso!');
  };

  const handleTestConnection = async () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = normalizeSupabaseKey(anonKey);
    setUrl(cleanUrl);
    setAnonKey(cleanKey);

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL do Projeto e a Chave Anônima antes de testar a conexão.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await supabaseService.testConnection(cleanUrl, cleanKey);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      const updated: SupabaseConfig = {
        url: cleanUrl,
        anonKey: cleanKey,
        isConnected: true,
        lastSync: `Conexão testada com sucesso às ${new Date().toLocaleTimeString('pt-BR')} (Latência: ${result.latencyMs}ms)`
      };
      setSyncStatus(updated.lastSync!);
      onUpdateSupabase(updated);
      storageService.setSupabaseConfig(updated);

      if (result.isSchemaReady) {
        onShowSuccessToast(`✓ Supabase Conectado! Todas as 9 tabelas estão prontas (${result.latencyMs}ms).`);
      } else {
        onShowSuccessToast(`✓ Conexão autenticada! Agora execute o Script SQL no Supabase.`);
      }
    } else {
      const updated: SupabaseConfig = {
        ...supabaseConfig,
        url: cleanUrl,
        anonKey: cleanKey,
        isConnected: false,
        lastSync: 'Falha na conexão com Supabase'
      };
      onUpdateSupabase(updated);
      storageService.setSupabaseConfig(updated);
    }
  };

  const handlePushToSupabase = async () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = normalizeSupabaseKey(anonKey);

    if (!cleanUrl || !cleanKey) {
      alert('Por favor, informe a URL do seu Supabase e a Chave Anon antes de sincronizar.');
      return;
    }

    // Salva as credenciais antes do push
    const currentCfg: SupabaseConfig = {
      url: cleanUrl,
      anonKey: cleanKey,
      isConnected: supabaseConfig.isConnected,
      lastSync: supabaseConfig.lastSync
    };
    storageService.setSupabaseConfig(currentCfg);
    onUpdateSupabase(currentCfg);

    setIsPushing(true);
    setSyncStatus('Enviando dados locais para o Supabase...');

    const res = await supabaseService.syncAllToSupabase();
    setIsPushing(false);

    if (res.success) {
      if (res.stats) {
        setSyncStats(res.stats);
      }
      const syncTimeMsg = `Último envio para o Supabase às ${new Date().toLocaleTimeString('pt-BR')}`;
      setSyncStatus(syncTimeMsg);
      onShowSuccessToast('✓ Todos os dados acadêmicos foram sincronizados no Supabase!');
    } else {
      setSyncStatus('Erro na sincronização');
      alert(res.message);
    }
    refreshLocalStats();
  };

  const handlePullFromSupabase = async () => {
    if (!window.confirm('Baixar os dados do Supabase irá mesclar e atualizar os dados do navegador com o banco em nuvem. Deseja prosseguir?')) {
      return;
    }

    setIsPulling(true);
    setSyncStatus('Baixando dados do Supabase Cloud...');

    const res = await supabaseService.syncAllFromSupabase();
    setIsPulling(false);

    if (res.success) {
      const syncTimeMsg = `Dados importados do Supabase às ${new Date().toLocaleTimeString('pt-BR')}`;
      setSyncStatus(syncTimeMsg);
      refreshLocalStats();
      onShowSuccessToast('✓ Dados acadêmicos atualizados a partir do Supabase!');
    } else {
      setSyncStatus('Falha ao baixar dados');
      alert(res.message);
    }
  };

  const [isSyncingAuth, setIsSyncingAuth] = useState(false);

  const handleSyncAuthUsers = async () => {
    setIsSyncingAuth(true);
    try {
      const res = await supabaseService.syncUsersToSupabaseAuth();
      setIsSyncingAuth(false);
      onShowSuccessToast(res.message);
    } catch (err: any) {
      setIsSyncingAuth(false);
      alert('Erro ao sincronizar usuários com Supabase Auth: ' + (err?.message || String(err)));
    }
  };

  const handleCopySql = () => {
    const sql = getSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    onShowSuccessToast('Script SQL copiado para a área de transferência!');
  };

  const tablesList = [
    { name: 'radbio_users', label: 'Usuários & Alunos', count: localStats.users, icon: 'group' },
    { name: 'radbio_courses', label: 'Cursos Regulares', count: localStats.courses, icon: 'school' },
    { name: 'radbio_cursos_livres', label: 'Cursos Livres 40h', count: localStats.cursosLivres, icon: 'workspace_premium' },
    { name: 'radbio_lessons', label: 'Aulas & Simulador', count: localStats.lessons, icon: 'smart_display' },
    { name: 'radbio_tasks', label: 'Casos DICOM & Tarefas', count: localStats.tasks, icon: 'assignment' },
    { name: 'radbio_grades', label: 'Notas do Boletim', count: localStats.grades, icon: 'fact_check' },
    { name: 'radbio_certificates', label: 'Certificados Emitidos', count: localStats.certificates, icon: 'verified' },
    { name: 'radbio_notifications', label: 'Notificações', count: localStats.notifications, icon: 'notifications' },
    { name: 'radbio_payments', label: 'Matrículas & PIX', count: localStats.payments, icon: 'payments' }
  ];

  const hasConfig = Boolean(url && anonKey);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 text-xs text-[#4cd7f6] font-mono mb-1">
          <span className="material-symbols-outlined text-sm">tune</span>
          <span>Configurações &amp; Integração Supabase PostgreSQL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
          Painel de Integração &amp; Banco de Dados
        </h1>
        <p className="text-xs sm:text-sm text-[#bcc9cd] mt-0.5">
          Conecte sua conta do Supabase para persistir alunos, notas, aulas gravadas, certificados e pagamentos PIX com sincronização em tempo real.
        </p>
      </section>

      {/* Main Supabase Integration Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#141f38]/60 backdrop-blur-2xl border border-[#4cd7f6]/30 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#3ecf8e]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Connection Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3ecf8e] via-[#00c984] to-[#00a572] p-0.5 flex items-center justify-center shadow-lg shadow-[#3ecf8e]/25">
              <div className="w-full h-full bg-[#0a0e17] rounded-[14px] flex items-center justify-center text-[#3ecf8e]">
                <span className="material-symbols-outlined text-3xl font-bold">database</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
                  Banco de Dados Supabase Cloud
                </h3>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                  supabaseConfig.isConnected
                    ? 'bg-[#00a572]/20 text-[#4edea3] border-[#4edea3]/40 shadow-sm shadow-[#4edea3]/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfig.isConnected ? 'bg-[#4edea3] animate-pulse' : 'bg-amber-400'}`} />
                  {supabaseConfig.isConnected ? 'CONECTADO & SINCRONIZADO' : 'AGUARDANDO CONFIGURAÇÃO'}
                </span>
              </div>
              <p className="text-xs text-[#bcc9cd] mt-0.5">
                PostgreSQL hospedado com suporte a Row Level Security (RLS) e publicação Realtime.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[#4cd7f6] border border-[#4cd7f6]/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">code</span>
              <span>Script SQL</span>
            </button>

            <button
              type="button"
              disabled={isPulling || !hasConfig}
              onClick={handlePullFromSupabase}
              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={!hasConfig ? 'Informe a URL e Chave primeiro' : 'Baixar dados da nuvem'}
            >
              <span className={`material-symbols-outlined text-base ${isPulling ? 'animate-spin' : ''}`}>cloud_download</span>
              <span>{isPulling ? 'Baixando...' : 'Baixar Nuvem (Pull)'}</span>
            </button>

            <button
              type="button"
              disabled={isPushing || !hasConfig}
              onClick={handlePushToSupabase}
              className="px-5 py-2.5 rounded-full bg-[#3ecf8e]/15 hover:bg-[#3ecf8e]/25 text-[#3ecf8e] border border-[#3ecf8e]/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title={!hasConfig ? 'Informe a URL e Chave primeiro' : 'Enviar todos os dados para o Supabase'}
            >
              <span className={`material-symbols-outlined text-base ${isPushing ? 'animate-spin' : ''}`}>cloud_upload</span>
              <span>{isPushing ? 'Enviando...' : 'Subir Tudo (Push)'}</span>
            </button>
          </div>
        </div>

        {/* 3-Step Wizard Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTabWizard('credentials')}
            className={`p-4 rounded-[24px] border text-left transition-all cursor-pointer ${
              activeTabWizard === 'credentials'
                ? 'bg-[#1e293b] border-[#4cd7f6] shadow-md shadow-[#4cd7f6]/10'
                : 'bg-[#0a0e17]/50 border-white/10 hover:border-white/20 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#4cd7f6]/20 text-[#4cd7f6] font-mono text-xs font-bold flex items-center justify-center">1</span>
              <span className="font-bold text-white text-xs">Credenciais do Projeto</span>
            </div>
            <p className="text-[11px] text-[#bcc9cd]">Project URL &amp; Chave Anon</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabWizard('schema')}
            className={`p-4 rounded-[24px] border text-left transition-all cursor-pointer ${
              activeTabWizard === 'schema'
                ? 'bg-[#1e293b] border-[#4cd7f6] shadow-md shadow-[#4cd7f6]/10'
                : 'bg-[#0a0e17]/50 border-white/10 hover:border-white/20 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#3ecf8e]/20 text-[#3ecf8e] font-mono text-xs font-bold flex items-center justify-center">2</span>
              <span className="font-bold text-white text-xs">Criar Tabelas (SQL)</span>
            </div>
            <p className="text-[11px] text-[#bcc9cd]">9 tabelas acadêmicas &amp; RLS</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabWizard('sync')}
            className={`p-4 rounded-[24px] border text-left transition-all cursor-pointer ${
              activeTabWizard === 'sync'
                ? 'bg-[#1e293b] border-[#4cd7f6] shadow-md shadow-[#4cd7f6]/10'
                : 'bg-[#0a0e17]/50 border-white/10 hover:border-white/20 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">3</span>
              <span className="font-bold text-white text-xs">Testar &amp; Sincronizar</span>
            </div>
            <p className="text-[11px] text-[#bcc9cd]">Handshake &amp; Envio em Nuvem</p>
          </button>
        </div>

        {/* Wizard Step 1: Credentials */}
        {activeTabWizard === 'credentials' && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#0a0e17]/60 border border-[#4cd7f6]/20 text-xs text-gray-300 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#4cd7f6] text-lg shrink-0 mt-0.5">info</span>
              <div className="flex-1">
                <p className="font-semibold text-white">Como obter suas credenciais na tela do Supabase:</p>
                <div className="text-[11px] text-[#bcc9cd] mt-1 space-y-1 leading-relaxed">
                  <p>
                    1. <strong>URL do Projeto:</strong> Pelo seu painel com Reference ID <code className="text-[#4cd7f6] bg-black/40 px-1.5 py-0.5 rounded">cqijrrybqhukcuqksfjr</code>, a sua URL é:
                    <button
                      type="button"
                      onClick={() => {
                        setUrl('https://cqijrrybqhukcuqksfjr.supabase.co');
                        onShowSuccessToast('✓ URL preenchida: https://cqijrrybqhukcuqksfjr.supabase.co');
                      }}
                      className="ml-2 px-2 py-0.5 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] hover:bg-[#4cd7f6]/30 font-mono text-[10px] font-bold border border-[#4cd7f6]/40 cursor-pointer"
                    >
                      Preencher URL: cqijrrybqhukcuqksfjr.supabase.co
                    </button>
                  </p>
                  <p>
                    2. <strong>Onde pegar a Chave Anon (API Key):</strong> No menu lateral esquerdo do Supabase onde você está (sob <em>Project Settings</em>), clique em <strong className="text-white">Data API</strong> (ou <em>API</em>).
                  </p>
                  <p>
                    3. Na seção <strong className="text-white">Project API keys</strong>, copie a chave marcada como <span className="text-[#3ecf8e] font-semibold font-mono">anon public</span> (começa com <code className="text-gray-300">eyJhbGciOi...</code>) e cole no campo abaixo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* URL */}
              <div>
                <label className="text-gray-300 block mb-1.5 font-semibold flex items-center justify-between">
                  <span>Supabase Project URL</span>
                  <span className="text-[10px] text-[#4cd7f6] font-mono">Ex: https://xyzcompany.supabase.co</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onBlur={() => setUrl(normalizeSupabaseUrl(url))}
                    placeholder="https://seu-projeto.supabase.co"
                    className="w-full p-3 pl-9 rounded-xl bg-[#0a0e17]/90 border border-white/15 text-white font-mono focus:border-[#4cd7f6] outline-none text-xs"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-3 text-gray-500 text-base">link</span>
                </div>
              </div>

              {/* Key */}
              <div>
                <label className="text-gray-300 block mb-1.5 font-semibold flex items-center justify-between">
                  <span>Supabase Public Anon Key (Chave Anônima)</span>
                  <span className="text-[10px] text-gray-400 font-mono">Project Settings &gt; API</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={anonKey}
                    onChange={e => setAnonKey(e.target.value)}
                    onBlur={() => setAnonKey(normalizeSupabaseKey(anonKey))}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-3 pl-9 pr-10 rounded-xl bg-[#0a0e17]/90 border border-white/15 text-white font-mono focus:border-[#4cd7f6] outline-none text-xs"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-3 text-gray-500 text-base">key</span>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-3 text-gray-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showKey ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#869397] font-mono flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">storage</span>
                <span>As credenciais são salvas com segurança no seu navegador.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-[#4edea3]">save</span>
                  <span>{savedCredentialsMessage ? '✓ Salvo com Sucesso!' : 'Salvar Credenciais'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSaveCredentials();
                    setActiveTabWizard('schema');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] text-[#090d16] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Avançar para Passo 2</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Step 2: Schema & Tables */}
        {activeTabWizard === 'schema' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#0a0e17]/80 border border-[#3ecf8e]/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#3ecf8e] text-xl">schema</span>
                  <h4 className="text-sm font-bold text-white">Inicialização das 9 Tabelas Acadêmicas</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3.5 py-1.5 rounded-xl bg-[#3ecf8e]/20 hover:bg-[#3ecf8e]/30 text-[#3ecf8e] border border-[#3ecf8e]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">{copiedSql ? 'check' : 'content_copy'}</span>
                    <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSqlModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#4cd7f6] border border-[#4cd7f6]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>Visualizar Código Completo</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#bcc9cd] space-y-1.5">
                <p>O sistema RadBio requer 9 tabelas no PostgreSQL com suporte a JSONB para alta velocidade e flexibilidade de relatórios:</p>
                <div className="p-2.5 rounded-xl bg-black/40 font-mono text-[11px] text-[#4cd7f6] space-y-1">
                  <div>1. Copie o script SQL clicando no botão verde <strong>"Copiar Script SQL"</strong> acima.</div>
                  <div>2. Abra o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#3ecf8e] underline">SQL Editor do Supabase</a> no seu painel.</div>
                  <div>3. Cole o código e clique no botão verde <strong>RUN</strong> no canto inferior direito do editor do Supabase.</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTabWizard('credentials')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Voltar para Passo 1</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabWizard('sync')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-[#090d16] font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Avançar para Passo 3 (Testar &amp; Sincronizar)</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Wizard Step 3: Test & Sync */}
        {activeTabWizard === 'sync' && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0a0e17]/80 border border-white/10">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">network_check</span>
                  <span>Verificação de Conexão com Supabase</span>
                </div>
                <div className="text-[11px] text-[#869397] font-mono">
                  {syncStatus}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#22d3ee] hover:to-[#06b6d4] text-[#090d16] font-bold text-xs shadow-lg shadow-[#06b6d4]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isTesting ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                      <span>Testando Handshake...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">wifi_tethering</span>
                      <span>Testar Conexão Supabase</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isPushing}
                  onClick={handlePushToSupabase}
                  className="px-4 py-2.5 rounded-xl bg-[#3ecf8e]/20 hover:bg-[#3ecf8e]/30 text-[#3ecf8e] border border-[#3ecf8e]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${isPushing ? 'animate-spin' : ''}`}>cloud_upload</span>
                  <span>Enviar Dados (Push)</span>
                </button>
              </div>
            </div>

            {/* Connection Result Diagnostic Box */}
            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs font-mono transition-all ${
                testResult.success
                  ? 'bg-[#0a0e17]/95 border-[#4edea3]/50 text-[#4edea3]'
                  : 'bg-[#0a0e17]/95 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                    {testResult.success ? 'check_circle' : 'error'}
                  </span>
                  <div className="space-y-1.5 w-full">
                    <div className="font-semibold text-sm">{testResult.message}</div>
                    {testResult.latencyMs !== undefined && (
                      <div className="text-[11px] opacity-80">Latência do Handshake: {testResult.latencyMs}ms</div>
                    )}
                    {testResult.missingTables && testResult.missingTables.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          <span>Tabelas Pendentes de Criação no Supabase:</span>
                        </div>
                        <p className="text-[10px] text-gray-300">
                          {testResult.missingTables.join(', ')}
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowSqlModal(true)}
                            className="px-3 py-1 rounded-lg bg-[#3ecf8e] text-black font-bold text-[10px] hover:bg-[#4edea3] cursor-pointer"
                          >
                            Abrir Script SQL para Criar no Supabase
                          </button>
                        </div>
                      </div>
                    )}
                    {testResult.errorDetails && (
                      <div className="text-[10px] text-rose-400/90 pt-1 border-t border-rose-500/20">
                        Detalhes do Erro: {testResult.errorDetails}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync Stats Feedback */}
        {syncStats && (
          <div className="p-3.5 rounded-2xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-xs text-[#4edea3] flex items-center justify-between flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">cloud_done</span>
              <span>Última Sincronização Concluída às {syncStats.lastSyncedAt}:</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white">
              <span>{syncStats.usersCount} Alunos</span>
              <span>•</span>
              <span>{syncStats.coursesCount} Cursos</span>
              <span>•</span>
              <span>{syncStats.gradesCount} Notas</span>
              <span>•</span>
              <span>{syncStats.paymentsCount} Pagamentos</span>
            </div>
          </div>
        )}

        {/* Supabase Authentication Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-[#141f38] border border-emerald-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <span className="material-symbols-outlined text-2xl">manage_accounts</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Supabase Authentication (auth.users)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Conectado
                  </span>
                </h4>
                <p className="text-xs text-slate-300">
                  Gerencie os usuários e alunos registrados diretamente no painel <strong>Authentication &gt; Users</strong> do Supabase.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSyncingAuth}
              onClick={handleSyncAuthUsers}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3ecf8e] to-[#06b6d4] text-[#090d16] font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 disabled:opacity-50 shrink-0"
            >
              <span className={`material-symbols-outlined text-base ${isSyncingAuth ? 'animate-spin' : ''}`}>
                {isSyncingAuth ? 'sync' : 'cloud_upload'}
              </span>
              <span>{isSyncingAuth ? 'Sincronizando Auth...' : 'Sincronizar Usuários no Supabase Auth'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Ao clicar, todos os perfis acadêmicos e alunos cadastrados são registrados no serviço de autenticação do Supabase. Novos cadastros na tela de login/matrícula também são adicionados automaticamente.
          </p>
        </div>

        {/* Tables & Records Overview Grid */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4cd7f6] font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">table_chart</span>
              <span>Coleções Acadêmicas Mapeadas (9 Tabelas)</span>
            </h4>
            <span className="text-[11px] text-gray-400 font-mono">
              PostgreSQL JSONB / Supabase
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
            {tablesList.map(table => (
              <div
                key={table.name}
                className="p-3 rounded-xl bg-[#0a0e17]/60 border border-white/10 hover:border-[#4cd7f6]/40 flex items-center justify-between text-xs transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base shrink-0 group-hover:scale-110 transition-transform">
                    {table.icon}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-white truncate text-[11px]">{table.label}</div>
                    <div className="text-[9px] font-mono text-gray-400 truncate">{table.name}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#4cd7f6] font-mono font-bold text-[10px]">
                    {table.count} {table.count === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Troubleshooting Guide Accordion */}
        <div className="pt-3 border-t border-white/5 text-xs text-gray-300">
          <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-400 text-sm">help</span>
            <span>Solução de Dúvidas Comuns com Supabase:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-[#bcc9cd]">
            <div className="p-3 rounded-xl bg-[#0a0e17]/40 border border-white/5 space-y-1">
              <strong className="text-amber-300 block">1. Erro de Conexão ou URL Inválida?</strong>
              <p>Confira se o link começa com <code>https://</code> e termina com <code>.supabase.co</code> sem espaços ou caracteres adicionais.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0a0e17]/40 border border-white/5 space-y-1">
              <strong className="text-amber-300 block">2. Erro de Tabela Não Encontrada?</strong>
              <p>Clique no botão <strong>"Script SQL"</strong>, copie o código e execute no menu <strong>SQL Editor</strong> do painel do Supabase com o botão RUN.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0a0e17]/40 border border-white/5 space-y-1">
              <strong className="text-amber-300 block">3. Chave Anônima (anonKey)?</strong>
              <p>Copie a chave pública com tag <code>anon</code> <code>public</code> em Project Settings &gt; API no Supabase (não utilize a service_role).</p>
            </div>
          </div>
        </div>
      </section>

      {/* SQL Migration Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-[#4cd7f6]/40 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">database</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                    Script SQL de Inicialização do Supabase
                  </h3>
                  <p className="text-xs text-gray-400">
                    Cria todas as 9 tabelas acadêmicas, índices JSONB e políticas de segurança RLS.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="p-3.5 rounded-2xl bg-[#0a0e17] border border-[#4cd7f6]/20 text-xs text-gray-300 space-y-1.5">
              <div className="font-bold text-[#4cd7f6] flex items-center gap-1.5 font-mono">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                <span>Instruções Rápidas (30 segundos):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-[#bcc9cd]">
                <li>Acesse o seu dashboard no <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#3ecf8e] underline font-bold">Supabase Dashboard</a> e clique no seu projeto.</li>
                <li>No menu lateral esquerdo, clique no ícone <strong>SQL Editor</strong> e depois em <strong>New Query</strong>.</li>
                <li>Clique no botão verde <strong>"Copiar Script SQL Completo"</strong> abaixo, cole na tela do editor do Supabase e clique no botão <strong>RUN</strong>.</li>
              </ol>
            </div>

            {/* Code container */}
            <div className="flex-1 overflow-auto rounded-xl bg-[#060911] border border-white/10 p-4 font-mono text-[11px] text-[#38bdf8] relative max-h-[360px]">
              <pre className="whitespace-pre">{getSupabaseSqlSchema()}</pre>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3ecf8e] to-[#00a572] hover:from-[#4edea3] hover:to-[#3ecf8e] text-[#061e14] font-bold text-xs shadow-lg shadow-[#3ecf8e]/30 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedSql ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSql ? 'Copiado com Sucesso!' : 'Copiar Script SQL Completo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main SMTP & Custom Domain Email Configuration Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#141f38]/60 backdrop-blur-2xl border border-amber-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header / Connection Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <div className="w-full h-full bg-[#0a0e17] rounded-[14px] flex items-center justify-center text-amber-400">
                <span className="material-symbols-outlined text-3xl font-bold">mail</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
                  Servidor de E-mail SMTP &amp; Domínio Próprio
                </h3>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                  smtpConfig.lastTestStatus === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${smtpConfig.lastTestStatus === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {smtpConfig.lastTestStatus === 'success' ? 'SMTP AUTENTICADO & ATIVO' : 'CONFIGURAÇÃO PRONTA'}
                </span>
              </div>
              <p className="text-xs text-[#bcc9cd] mt-0.5">
                Configure as credenciais do seu servidor de e-mail corporativo para disparar confirmações de matrícula, pagamentos e avisos de expiração com o domínio da sua instituição.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSmtp}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>Salvar Credenciais SMTP</span>
            </button>
          </div>
        </div>

        {/* 1-Click Presets */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-cyan-400">tune</span>
            Provedores Rápidos em 1-Clique:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'gmail', name: 'Google Workspace', desc: 'smtp.gmail.com:587', icon: 'mark_email_read' },
              { id: 'sendgrid', name: 'SendGrid API', desc: 'smtp.sendgrid.net:587', icon: 'send' },
              { id: 'ses', name: 'Amazon SES', desc: 'email-smtp:587', icon: 'cloud' },
              { id: 'mailgun', name: 'Mailgun', desc: 'smtp.mailgun.org:587', icon: 'forward_to_inbox' },
              { id: 'hostinger', name: 'Domínio / cPanel', desc: 'mail.seudominio:465', icon: 'domain' }
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applySmtpPreset(preset.id)}
                className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                  activePreset === preset.id
                    ? 'bg-[#1e293b] border-amber-400 text-white shadow-md shadow-amber-400/10 font-bold'
                    : 'bg-[#0a0e17]/50 border-white/10 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-amber-400">
                  <span className="material-symbols-outlined text-base">{preset.icon}</span>
                  <span className="font-bold truncate text-[11px]">{preset.name}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono truncate">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Host SMTP */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Servidor SMTP (Host) *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                dns
              </span>
              <input
                type="text"
                value={smtpHost}
                onChange={e => setSmtpHost(e.target.value)}
                placeholder="ex: smtp.gmail.com ou mail.radbio.edu.br"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Port & Secure */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Porta *
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={e => setSmtpPort(Number(e.target.value))}
                placeholder="587"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Segurança
              </label>
              <select
                value={smtpSecure ? 'ssl' : 'tls'}
                onChange={e => setSmtpSecure(e.target.value === 'ssl')}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white text-xs focus:border-amber-400 outline-none cursor-pointer"
              >
                <option value="tls">STARTTLS (587)</option>
                <option value="ssl">SSL / TLS (465)</option>
              </select>
            </div>
          </div>

          {/* Usuário / E-mail */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Usuário / E-mail de Autenticação *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                account_circle
              </span>
              <input
                type="text"
                value={smtpUser}
                onChange={e => setSmtpUser(e.target.value)}
                placeholder="matriculas@radbio.edu.br"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Senha / Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Senha / Senha de App *
              </label>
              <button
                type="button"
                onClick={() => setShowSmtpPass(!showSmtpPass)}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                {showSmtpPass ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                key
              </span>
              <input
                type={showSmtpPass ? 'text' : 'password'}
                value={smtpPass}
                onChange={e => setSmtpPass(e.target.value)}
                placeholder="Senha de aplicativo ou API Key"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Nome do Remetente */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Nome do Remetente (From Name)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                badge
              </span>
              <input
                type="text"
                value={smtpFromName}
                onChange={e => setSmtpFromName(e.target.value)}
                placeholder="Biorad Cursos • Secretaria Acadêmica"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white text-xs focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* E-mail de Envio (From) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              E-mail de Envio (From Email)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                alternate_email
              </span>
              <input
                type="email"
                value={smtpFromEmail}
                onChange={e => setSmtpFromEmail(e.target.value)}
                placeholder="nao-responder@radbio.edu.br"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 text-white font-mono text-xs focus:border-amber-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live SMTP Connection Testing Box */}
        <div className="p-5 rounded-2xl bg-[#0a0e17]/90 border border-white/10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-lg">science</span>
              <span className="text-xs font-bold text-white">Validador de Entrega SMTP em Tempo Real</span>
            </div>
            {smtpConfig.lastTestedAt && (
              <span className="text-[10px] text-gray-400 font-mono">
                Último teste realizado: {smtpConfig.lastTestedAt}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                forward_to_inbox
              </span>
              <input
                type="email"
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                placeholder="Digite o e-mail para receber o teste (ex: benmoran29dev@gmail.com)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono text-xs focus:border-cyan-400 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isTestingSmtp}
              onClick={handleTestSmtpConnection}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#10b981] text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTestingSmtp ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Testando SMTP...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Enviar E-mail de Teste</span>
                </>
              )}
            </button>
          </div>

          {smtpTestResult && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
              smtpTestResult.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}>
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                {smtpTestResult.success ? 'check_circle' : 'error'}
              </span>
              <div>
                <p className="font-semibold">{smtpTestResult.message}</p>
                {smtpTestResult.success && (
                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    ✓ As mensagens de confirmação de matrícula com a regra de expiração de 2 meses agora serão enviadas via seu domínio próprio.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {smtpSavedMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check</span>
            <span>Credenciais SMTP salvas no armazenamento local com sucesso!</span>
          </div>
        )}
      </section>

      {/* Visual Theme & Language */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Card */}
        <div className="p-6 rounded-3xl bg-[#141f38]/50 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-xl">palette</span>
            <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
              Modo Visual da Interface
            </h3>
          </div>
          <p className="text-xs text-[#bcc9cd]">
            Alterne entre o tema escuro exclusivo Liquid Glass e o modo radiológico de alto contraste.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onToggleTheme('dark')}
              className={`p-4 rounded-2xl border text-left text-xs transition-all ${
                theme === 'dark'
                  ? 'bg-[#1c1f29] border-[#4cd7f6] text-white shadow-lg shadow-[#4cd7f6]/15 font-bold'
                  : 'bg-[#0a0e17]/50 border-white/10 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-lg text-[#4cd7f6]">dark_mode</span>
                {theme === 'dark' && <span className="text-[#4cd7f6]">✓ Ativo</span>}
              </div>
              <div className="font-semibold text-white">Dark Mode (Liquid Glass)</div>
              <div className="text-[10px] text-gray-400 mt-1">Otimizado para laudos e salas escuras de tomografia.</div>
            </button>

            <button
              onClick={() => onToggleTheme('light')}
              className={`p-4 rounded-2xl border text-left text-xs transition-all ${
                theme === 'light'
                  ? 'bg-white/10 border-white text-white font-bold'
                  : 'bg-[#0a0e17]/50 border-white/10 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-lg text-amber-300">light_mode</span>
                {theme === 'light' && <span className="text-amber-300">✓ Ativo</span>}
              </div>
              <div className="font-semibold text-white">Claro (Clínico)</div>
              <div className="text-[10px] text-gray-400 mt-1">Alto contraste para ambientes ambulatoriais diurnos.</div>
            </button>
          </div>
        </div>

        {/* Language Card */}
        <div className="p-6 rounded-3xl bg-[#141f38]/50 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#4edea3] text-xl">translate</span>
            <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
              Idioma do Sistema Acadêmico
            </h3>
          </div>
          <p className="text-xs text-[#bcc9cd]">
            Plataforma 100% em língua portuguesa, estruturada conforme as normas do CBR, CRTR/CONTER e MEC.
          </p>

          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-[#1c1f29] border border-[#4edea3]/40 text-white flex items-center justify-between shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  PT
                </div>
                <div>
                  <div className="font-bold text-sm">Português (Brasil)</div>
                  <div className="text-[10px] text-gray-400 font-mono">Padrão Oficial LDB / CBR / CRTR / ANVISA</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✓ Padrão Único
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Production & Data Management: Backup & Restore */}
      <section className="p-6 rounded-3xl bg-[#141f38]/50 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-cyan-400 text-xl">settings_backup_restore</span>
          <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
            Backup &amp; Manutenção de Dados da Produção
          </h3>
        </div>
        <p className="text-xs text-[#bcc9cd]">
          Exporte um snapshot de segurança com todos os alunos, notas, certificados e aulas em JSON ou restaure em qualquer computador / hospedagem.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={() => {
              const json = storageService.exportDatabaseBackup();
              const blob = new Blob([json], { type: 'application/json' });
              const urlBlob = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = urlBlob;
              a.download = `radbio_backup_${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(urlBlob);
              onShowSuccessToast('Backup completo em JSON exportado com sucesso!');
            }}
            className="p-3.5 rounded-2xl bg-[#0a0e17]/70 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-cyan-500/10"
          >
            <span className="material-symbols-outlined text-cyan-400 text-lg">download</span>
            <span>Baixar Backup (JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="p-3.5 rounded-2xl bg-[#0a0e17]/70 border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-emerald-500/10 text-center">
            <span className="material-symbols-outlined text-emerald-400 text-lg">upload_file</span>
            <span>Restaurar Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = evt => {
                    const content = evt.target?.result as string;
                    if (content) {
                      const ok = storageService.restoreDatabaseBackup(content);
                      if (ok) {
                        onShowSuccessToast('Banco restaurado com sucesso a partir do backup!');
                      } else {
                        onShowSuccessToast('Erro ao importar arquivo de backup.');
                      }
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>

          {/* Factory Reset */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja realmente restaurar os dados iniciais padrão da plataforma?')) {
                storageService.resetToDefaultData();
                refreshLocalStats();
                onShowSuccessToast('Dados acadêmicos restaurados para os valores padrão de fábrica.');
              }
            }}
            className="p-3.5 rounded-2xl bg-[#0a0e17]/70 border border-rose-500/30 hover:border-rose-400 text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-rose-500/10"
          >
            <span className="material-symbols-outlined text-rose-400 text-lg">restart_alt</span>
            <span>Restaurar Padrões de Fábrica</span>
          </button>
        </div>
      </section>
    </div>
  );
};
