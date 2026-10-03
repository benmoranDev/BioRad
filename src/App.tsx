import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Course,
  Lesson,
  TaskPendency,
  StudentGradeRecord,
  Certificate,
  EmailNotification,
  SupabaseConfig,
  Language,
  ThemeMode
} from './types';
import { storageService } from './services/storage';
import { SideNavBar } from './components/layout/SideNavBar';
import { TopNavBar } from './components/layout/TopNavBar';
import { DashboardView } from './components/views/DashboardView';
import { GradesView } from './components/views/GradesView';
import { ClassroomView } from './components/views/ClassroomView';
import { TeacherGradesView } from './components/views/TeacherGradesView';
import { PendenciasView } from './components/views/PendenciasView';
import { CertificatesView } from './components/views/CertificatesView';
import { AdminManagementView } from './components/views/AdminManagementView';
import { FinanceiroView } from './components/views/FinanceiroView';
import { PaymentCheckoutView } from './components/views/PaymentCheckoutView';
import { CursosLivresView } from './components/views/CursosLivresView';
import { SettingsView } from './components/views/SettingsView';
import { StudentRegistrationView } from './components/views/StudentRegistrationView';
import { SimulatorModal } from './components/views/SimulatorModal';
import { SubmissionModal } from './components/modals/SubmissionModal';
import { LabSupportModal } from './components/modals/LabSupportModal';
import { SplashScreen } from './components/auth/SplashScreen';
import { LoginScreen } from './components/auth/LoginScreen';

export default function App() {
  // Splash and Authentication States
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [authSession, setAuthSession] = useState<{ isAuthenticated: boolean; user: User | null }>(() =>
    storageService.getAuthSession()
  );

  // Global States
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [courses, setCourses] = useState<Course[]>(() => storageService.getCourses());
  const [lessons, setLessons] = useState<Lesson[]>(() => storageService.getLessons());
  const [tasks, setTasks] = useState<TaskPendency[]>(() => storageService.getTasks());
  const [studentGrades, setStudentGrades] = useState<StudentGradeRecord[]>(() => storageService.getStudentGrades());
  const [certificates, setCertificates] = useState<Certificate[]>(() => storageService.getCertificates());
  const [notifications, setNotifications] = useState<EmailNotification[]>(() => storageService.getNotifications());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => storageService.getSupabaseConfig());
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [theme, setTheme] = useState<ThemeMode>(() => storageService.getTheme());

  // UI Flow States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isViewLoading, setIsViewLoading] = useState<boolean>(true);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson>(lessons[3] || lessons[0]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isLabSupportOpen, setIsLabSupportOpen] = useState<boolean>(false);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<TaskPendency | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('biorad_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('biorad_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Initial mount loading state simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsViewLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigateTab = (tab: string) => {
    if (tab === currentTab) return;
    setIsViewLoading(true);
    setCurrentTab(tab);
    setTimeout(() => {
      setIsViewLoading(false);
    }, 280);
  };

  // Sync with document element theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync with storage and theme events
  useEffect(() => {
    const handleStorageChange = () => {
      const currentSession = storageService.getAuthSession();
      setAuthSession(currentSession);
      if (currentSession.isAuthenticated && currentSession.user) {
        setCurrentUser(currentSession.user);
      }
      setCourses(storageService.getCourses(currentSession.user || undefined));
      setLessons(storageService.getLessons());
      setTasks(storageService.getTasks());
      setStudentGrades(storageService.getStudentGrades());
      setCertificates(storageService.getCertificates());
      setNotifications(storageService.getNotifications());
      setSupabaseConfig(storageService.getSupabaseConfig());
      setLanguage(storageService.getLanguage());
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      const newTheme = customEvent.detail || storageService.getTheme();
      setTheme(newTheme);
    };

    window.addEventListener('radbio_state_changed', handleStorageChange);
    window.addEventListener('radbio_theme_changed', handleThemeChange);
    return () => {
      window.removeEventListener('radbio_state_changed', handleStorageChange);
      window.removeEventListener('radbio_theme_changed', handleThemeChange);
    };
  }, []);

  // Supabase Realtime Listener for cloud updates
  useEffect(() => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) return;

    let unsubscribe: (() => void) | undefined;
    import('./services/supabaseClient')
      .then(({ supabaseService }) => {
        unsubscribe = supabaseService.subscribeToRealtime((table, payload) => {
          if (table === 'radbio_notifications' && payload.new?.data) {
            storageService.addNotification(payload.new.data);
          }
        });
      })
      .catch(() => {});

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

  const handleLoginSuccess = (user: User) => {
    storageService.setAuthSession({ isAuthenticated: true, user });
    setAuthSession({ isAuthenticated: true, user });
    setCurrentUser(user);
    setCourses(storageService.getCourses(user));
    showToast(`Bem-vindo à Biorad Cursos, ${user.name}!`);
  };

  const handleLogout = () => {
    storageService.logout();
    setAuthSession({ isAuthenticated: false, user: null });
    showToast('Sessão encerrada com sucesso.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    storageService.setTheme(nextTheme);
    showToast(nextTheme === 'dark' ? 'Modo Escuro (Liquid Glass) ativado' : 'Modo Claro (Clínico) ativado');
  };

  const handleRoleChange = (newRole: UserRole) => {
    let updatedUser = { ...currentUser, role: newRole };
    if (newRole === 'professor') {
      updatedUser = {
        ...updatedUser,
        name: 'Prof. Dr. Marcus Vinicius',
        email: 'marcus.vinicius@radbio.edu.br',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
        enrollmentId: 'DOC-TC-09',
        specialty: 'Especialista em Tomografia Computadorizada CBR'
      };
      if (currentTab === 'configuracoes' || currentTab === 'admin' || currentTab === 'cadastro_alunos') {
        setCurrentTab('professor_notas');
      }
    } else if (newRole === 'admin') {
      updatedUser = {
        ...updatedUser,
        name: 'Ben Moran',
        email: 'benmoran29dev@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        enrollmentId: 'ADM-BEN-2026',
        specialty: 'Administrador Geral do Sistema & Diretor de Tecnologia RadBio'
      };
    } else {
      updatedUser = {
        ...updatedUser,
        name: 'Lucas Mendonça',
        email: 'lucas.mendonca@radbio.edu.br',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        enrollmentId: '2025-RAD-8841',
        specialty: 'Tecnólogo em Radiologia & Tomografia Computadorizada'
      };
      if (currentTab === 'configuracoes' || currentTab === 'admin' || currentTab === 'cadastro_alunos' || currentTab === 'professor_notas') {
        setCurrentTab('dashboard');
      }
    }
    setCurrentUser(updatedUser);
    storageService.setCurrentUser(updatedUser);
    showToast(`Perfil alterado para ${newRole === 'student' ? 'Aluno (Lucas)' : newRole === 'professor' ? 'Docente (Prof. Marcus)' : 'Administrador Geral (Ben Moran)'}`);
  };

  // RBAC Tab Protection Guard: Restrict sensitive views based on role
  useEffect(() => {
    if (currentUser.role !== 'admin') {
      if (currentTab === 'configuracoes' || currentTab === 'admin' || currentTab === 'cadastro_alunos') {
        setCurrentTab('dashboard');
        showToast('Acesso Restrito: Apenas o Administrador Geral possui permissão para acessar esta área.');
      }
    }
    if (currentUser.role === 'student' && currentTab === 'professor_notas') {
      setCurrentTab('dashboard');
      showToast('Acesso Restrito: Apenas professores e administradores podem auditar notas.');
    }
  }, [currentTab, currentUser.role]);

  const handleTaskSubmitted = (taskId: string, fileName: string) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, status: 'submitted' as const, submittedFile: fileName } : t
    );
    setTasks(updated);
    storageService.setTasks(updated);

    // Auto notification
    storageService.addNotification({
      id: `notif_${Date.now()}`,
      recipientEmail: currentUser.email,
      subject: '[Confirmação de Envio] Trabalho Protocolado no Portal',
      body: `Seu arquivo "${fileName}" foi recebido pelo sistema e protocolado com sucesso na disciplina de Tomografia Computadorizada.`,
      type: 'deadline_warning',
      timestamp: 'Agora mesmo',
      isRead: false,
      status: 'delivered'
    });

    showToast(`Arquivo "${fileName}" enviado com sucesso!`);
  };

  const handlePaymentSuccess = (courseTitle: string) => {
    showToast(`Matrícula confirmada no curso ${courseTitle}! Acesso liberado.`);
    setCurrentTab('aulas');
  };

  const handleIssueCertificate = (courseTitle?: string, hours?: number, targetCourseId?: string) => {
    // HARD ENFORCEMENT: Course lessons must be 100% completed
    const currentLessons = storageService.getLessons();
    const courseId = targetCourseId || 'course_tc_701';
    const relevantLessons = currentLessons.filter(l => !targetCourseId || l.courseId === courseId);
    const scopeLessons = relevantLessons.length > 0 ? relevantLessons : currentLessons;
    const completedLessons = scopeLessons.filter(l => l.isCompleted);
    const totalCount = scopeLessons.length;
    const completedCount = completedLessons.length;
    const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (completionPct < 100) {
      showToast(`BLOQUEADO: É necessário concluir 100% das aulas e vídeos (${completedCount}/${totalCount} concluídas - ${completionPct}%). Assista a todas as aulas para liberar seu certificado.`);
      setCurrentTab('aulas');
      return;
    }

    const workload = hours || 40;
    const title = courseTitle || 'Tomografia Computadorizada Clínica & Operação do Activion 16 (40h)';
    const newCert: Certificate = {
      id: `cert_${Date.now()}`,
      code: `RADBIO-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}-40H`,
      studentName: currentUser.name,
      studentDocument: currentUser.cpf
        ? `CPF: ${currentUser.cpf} • Matrícula: ${currentUser.enrollmentId}`
        : `Matrícula: ${currentUser.enrollmentId}`,
      courseName: title,
      courseId,
      workloadHours: workload,
      completionDate: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      completionPercentage: 100,
      completedLessonsCount: completedCount,
      totalLessonsCount: totalCount,
      instructorName: 'Prof. Dr. Marcus Vinicius',
      instructorRole: 'Especialista em Tomografia CBR & Físico das Radiações',
      finalScore: 9.8,
      sha256Hash: 'a7c98b21e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b',
      qrValidationUrl: 'https://radbio.edu.br/validar/RADBIO-CERT-2026-40H',
      mecLdbCompliance: 'Lei Federal nº 9.394/96 (LDB) art. 42 e Decreto Federal nº 5.154/04',
      authenticatedBy: 'Conselho Consultivo Acadêmico RadBio & Bacen Cert'
    };
    storageService.addCertificate(newCert);
    setCertificates(storageService.getCertificates());
    showToast(`Parabéns! Requisito de 100% atendido. Certificado Oficial de ${workload} Horas emitido com sucesso!`);
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  // Filter courses or lessons for students (only enrolled courses) vs admin/professors (all)
  const userEnrolledCourses = currentUser.role === 'admin' || currentUser.role === 'professor'
    ? courses
    : courses.filter(c => storageService.isUserEnrolledInCourse(c.id, currentUser));

  const displayCourses = searchTerm
    ? userEnrolledCourses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()))
    : userEnrolledCourses;

  const displayLessons = currentUser.role === 'admin' || currentUser.role === 'professor'
    ? lessons
    : lessons.filter(l => storageService.isUserEnrolledInCourse(l.courseId, currentUser) || l.isFreePreview);

  const isDark = theme === 'dark';

  // 1. Initial Medical SplashScreen Flow
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // 2. Authentication Flow: If not authenticated, render LoginScreen
  if (!authSession.isAuthenticated || !authSession.user) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div
      className={`min-h-screen font-['Inter'] relative transition-colors duration-200 ${
        isDark
          ? 'bg-[#090d16] text-[#dfe2ef] selection:bg-[#4cd7f6]/20 selection:text-[#4cd7f6]'
          : 'bg-[#f1f5f9] text-[#0f172a] selection:bg-cyan-200 selection:text-cyan-900'
      }`}
    >
      {/* Background Decorative Glow Orbs */}
      {isDark ? (
        <>
          <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#06b6d4]/10 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="fixed top-1/3 -right-40 w-96 h-96 bg-[#10b981]/10 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-[160px] pointer-events-none z-0" />
        </>
      ) : (
        <>
          <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-200/40 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="fixed top-1/3 -right-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-[160px] pointer-events-none z-0" />
        </>
      )}

      {/* Side Navigation Bar */}
      <SideNavBar
        currentTab={currentTab}
        onSelectTab={handleNavigateTab}
        userRole={currentUser.role}
        pendingCount={pendingCount}
        theme={theme}
        onOpenLabSupport={() => setIsLabSupportOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen relative z-10">
        {/* Top Header Bar */}
        <TopNavBar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          notifications={notifications}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLogout={handleLogout}
          onNavigateToTab={handleNavigateTab}
          isSupabaseConnected={supabaseConfig.isConnected}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onSelectNotification={notif => {
            storageService.markNotificationAsRead(notif.id);
            if (notif.type === 'grade_published') handleNavigateTab('boletim');
            else if (notif.type === 'certificate_issued') handleNavigateTab('certificados');
            else if (notif.type === 'deadline_warning') handleNavigateTab('pendencias');
            else if (notif.type === 'payment_confirmed') handleNavigateTab('aulas');
          }}
        />

        {/* View Switcher with Smooth Fade-in Transitions */}
        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-72'}`}>
          <div key={currentTab} className="animate-view-fade-in w-full">
            {currentTab === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                courses={displayCourses}
                tasks={tasks}
                theme={theme}
                isLoading={isViewLoading}
                recentGrades={[
                  { id: '1', title: 'Relatório #04: Reconstrução MPR e Angiotomografia', course: 'Tomografia Computadorizada Avançada', instructor: 'Prof. Dr. Aris Thorne', grade: 9.8, statusText: 'Aprovado A+', date: 'Hoje' },
                  { id: '2', title: 'Artigo Crítico: Ressonância com Difusão em Neuroimagem', course: 'Ressonância Magnética Estrutural', instructor: 'Prof. Dr. Carlos Vane', grade: 9.0, statusText: 'Aprovado A', date: 'Ontem' },
                  { id: '3', title: 'Auditoria de Dosimetria e Controle de Qualidade DR', course: 'Radiologia Digital e Posicionamento', instructor: 'Dra. Sofia Albarracín', grade: 8.2, statusText: 'Aprovado B+', date: 'Há 3 dias' }
                ]}
                onNavigateTab={handleNavigateTab}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onOpenSubmissionModal={task => setSelectedTaskForSubmission(task)}
              />
            )}

            {currentTab === 'aulas' && (
              <ClassroomView
                lessons={displayLessons}
                courses={displayCourses}
                activeLesson={activeLesson}
                onSelectLesson={setActiveLesson}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                currentUser={currentUser}
                onNavigateTab={handleNavigateTab}
                onIssueCertificate={handleIssueCertificate}
                theme={theme}
                isLoading={isViewLoading}
              />
            )}

            {currentTab === 'boletim' && (
              <GradesView
                courses={courses}
                studentName={currentUser.name}
                enrollmentId={currentUser.enrollmentId}
                currentUser={currentUser}
                onShowToast={showToast}
                onRequestReview={() => showToast('Solicitação de revisão enviada para a banca docente.')}
                onValidateAuthenticity={() => handleNavigateTab('certificados')}
                theme={theme}
              />
            )}

            {currentTab === 'pendencias' && (
              <PendenciasView
                tasks={tasks}
                onOpenSubmissionModal={task => setSelectedTaskForSubmission(task)}
                onTasksUpdated={setTasks}
                theme={theme}
              />
            )}

            {currentTab === 'professor_notas' && (
              <TeacherGradesView
                grades={studentGrades}
                onUpdateGrades={setStudentGrades}
                onShowSuccessToast={showToast}
                theme={theme}
              />
            )}

            {currentTab === 'cursos_livres' && (
              <CursosLivresView
                onSelectCourseForEnrollment={courseId => {
                  setSelectedCourseForEnrollment(courseId);
                  handleNavigateTab('pagamentos');
                }}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onNavigateTab={handleNavigateTab}
                userRole={currentUser.role}
                theme={theme}
              />
            )}

            {currentTab === 'certificados' && (
              <CertificatesView
                certificates={certificates}
                lessons={lessons}
                onIssueCertificate={handleIssueCertificate}
                theme={theme}
              />
            )}

            {currentTab === 'pagamentos' && (
              <PaymentCheckoutView
                onPaymentSuccess={handlePaymentSuccess}
                onNavigateTab={handleNavigateTab}
                selectedCourseId={selectedCourseForEnrollment}
                theme={theme}
              />
            )}

            {currentTab === 'admin' && (
              currentUser.role === 'admin' ? (
                <AdminManagementView
                  courses={courses}
                  notifications={notifications}
                  theme={theme}
                  onNavigateTab={handleNavigateTab}
                  onAddCourse={newCourse => {
                    const updated = [newCourse, ...courses];
                    setCourses(updated);
                    storageService.setCourses(updated);
                    showToast(`Curso "${newCourse.title}" publicado com sucesso!`);
                  }}
                  onUpdateCourse={updatedCourse => {
                    const updated = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
                    setCourses(updated);
                    storageService.setCourses(updated);
                    showToast(`Curso "${updatedCourse.title}" atualizado com sucesso!`);
                  }}
                  onDeleteCourse={courseId => {
                    const updated = courses.filter(c => c.id !== courseId);
                    setCourses(updated);
                    storageService.setCourses(updated);
                    showToast(`Curso removido do catálogo institucional.`);
                  }}
                />
              ) : (
                <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl border border-red-500/30 bg-red-500/10">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2">lock</span>
                  <h3 className="text-lg font-bold text-red-400">Acesso Restrito ao Administrador Geral</h3>
                  <p className="text-xs text-slate-400 mt-2">Você está autenticado com um perfil que não possui privilégios de gestão institucional.</p>
                </div>
              )
            )}

            {currentTab === 'financeiro' && (
              currentUser.role === 'admin' ? (
                <FinanceiroView
                  theme={theme}
                  onShowToast={showToast}
                  onNavigateTab={handleNavigateTab}
                />
              ) : (
                <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl border border-red-500/30 bg-red-500/10">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2">lock</span>
                  <h3 className="text-lg font-bold text-red-400">Acesso Restrito ao Administrador Geral</h3>
                  <p className="text-xs text-slate-400 mt-2">Apenas o Administrador possui acesso à auditoria de transações financeiras e estornos.</p>
                </div>
              )
            )}

            {currentTab === 'cadastro_alunos' && (
              currentUser.role === 'admin' ? (
                <StudentRegistrationView theme={theme} onShowSuccessToast={showToast} />
              ) : (
                <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl border border-red-500/30 bg-red-500/10">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2">lock</span>
                  <h3 className="text-lg font-bold text-red-400">Acesso Restrito ao Administrador Geral</h3>
                  <p className="text-xs text-slate-400 mt-2">Apenas a Coordenação e Administração possuem acesso à gestão e cadastro de alunos.</p>
                </div>
              )
            )}

            {currentTab === 'configuracoes' && (
              currentUser.role === 'admin' ? (
                <SettingsView
                  supabaseConfig={supabaseConfig}
                  onUpdateSupabase={setSupabaseConfig}
                  theme={theme}
                  onToggleTheme={t => {
                    setTheme(t);
                    storageService.setTheme(t);
                  }}
                  language={language}
                  onSelectLanguage={l => {
                    setLanguage(l);
                    storageService.setLanguage(l);
                  }}
                  onShowSuccessToast={showToast}
                />
              ) : (
                <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl border border-red-500/30 bg-red-500/10">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2">database_locked</span>
                  <h3 className="text-lg font-bold text-red-400">Acesso Restrito: Banco de Dados Supabase</h3>
                  <p className="text-xs text-slate-400 mt-2">Apenas o Administrador Geral (Ben Moran) possui acesso a credenciais, sincronização e scripts de banco de dados.</p>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      <SubmissionModal
        task={selectedTaskForSubmission}
        onClose={() => setSelectedTaskForSubmission(null)}
        onSubmitSuccess={handleTaskSubmitted}
        theme={theme}
      />

      <LabSupportModal
        isOpen={isLabSupportOpen}
        onClose={() => setIsLabSupportOpen(false)}
        onShowSuccessToast={showToast}
      />

      {/* Floating System Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl text-xs flex items-center gap-3 animate-bounce ${
            isDark
              ? 'bg-[#1c1f29] border-[#4cd7f6]/50 text-white'
              : 'bg-white border-cyan-300 text-slate-800'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#4cd7f6]/20 text-[#4cd7f6] flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">notifications_active</span>
          </div>
          <div>
            <span className="font-bold text-[#4cd7f6] block">RadBio Acadêmico</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
