import React, { useState, useMemo } from 'react';
import { Course, Lesson, ThemeMode, EmailNotification } from '../../types';
import { storageService } from '../../services/storage';
import { formatCpf, isValidCpf } from '../../utils/cpfValidator';
import { InstructorContentModal } from './InstructorContentModal';
import { AuditLogsManager } from '../admin/AuditLogsManager';
import { StudentPaymentsDashboard } from '../dashboard/StudentPaymentsDashboard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface AdminManagementViewProps {
  courses: Course[];
  notifications: EmailNotification[];
  onAddCourse: (newCourse: Course) => void;
  onUpdateCourse?: (updatedCourse: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  theme?: ThemeMode;
  onNavigateTab?: (tab: string) => void;
}

const COVER_PRESETS = [
  {
    label: 'Tomografia Computadorizada Multislice',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'TC de Tórax & Angiotomografia',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Gantry & Sala de Aquisição',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Ressonância Magnética & Neuroimagem',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Workstation & Janelamento PACS',
    url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Radiologia Cirúrgica & Intervencionista',
    url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80'
  }
];

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  courses,
  notifications,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  theme = 'dark',
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'content_matrix' | 'users' | 'analytics' | 'finance' | 'logs'>('courses');
  
  // Modals state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<Course | null>(null);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreBackupError, setRestoreBackupError] = useState<string | null>(null);

  // Backup handlers
  const handleExportInstitutionalBackup = () => {
    try {
      const backupJson = storageService.exportDatabaseBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `radbio_backup_institucional_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupToast('✓ Backup institucional completo gerado e exportado com sucesso!');
      setTimeout(() => setBackupToast(null), 4000);
    } catch {
      setBackupToast('Falha ao exportar backup de dados.');
      setTimeout(() => setBackupToast(null), 4000);
    }
  };

  const handleRestoreInstitutionalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoringBackup(true);
    setRestoreBackupError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = storageService.restoreDatabaseBackup(content);
        if (success) {
          setAllLessons(storageService.getLessons());
          setBackupToast('✓ Base de dados institucional restaurada com sucesso!');
          setTimeout(() => setBackupToast(null), 4000);
          setShowBackupModal(false);
        } else {
          setRestoreBackupError('O arquivo selecionado não contém um formato JSON de backup válido.');
        }
      } catch (err: any) {
        setRestoreBackupError('Erro na leitura do arquivo: ' + (err?.message || 'Arquivo corrompido'));
      } finally {
        setIsRestoringBackup(false);
      }
    };
    reader.readAsText(file);
  };
  
  // Content management modal
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentModalCourseId, setContentModalCourseId] = useState<string>(courses[0]?.id || 'course_tc_701');

  // Lessons list from storage
  const [allLessons, setAllLessons] = useState<Lesson[]>(() => storageService.getLessons());

  // Search & Filters
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newInstructor, setNewInstructor] = useState('Prof. Dr. Marcus Vinicius');
  const [newInstructorTitle, setNewInstructorTitle] = useState('Especialista em Tomografia Computadorizada CBR');
  const [newCategory, setNewCategory] = useState<Course['category']>('Tomografia Computadorizada');
  const [newCredits, setNewCredits] = useState<number>(40);
  const [newPrice, setNewPrice] = useState<number>(149.00);
  const [newDescription, setNewDescription] = useState('Curso técnico prático com simulação de exames em tomógrafo Canon, janelamento Hounsfield e análise de laudos.');
  const [newCoverImage, setNewCoverImage] = useState(COVER_PRESETS[0].url);
  const [newInitialModulesCount, setNewInitialModulesCount] = useState<number>(3);
  const [courseFormError, setCourseFormError] = useState<string | null>(null);

  // Edit Course Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editInstructor, setEditInstructor] = useState('');
  const [editInstructorTitle, setEditInstructorTitle] = useState('');
  const [editCategory, setEditCategory] = useState<Course['category']>('Tomografia Computadorizada');
  const [editCredits, setEditCredits] = useState<number>(40);
  const [editPrice, setEditPrice] = useState<number>(149.00);
  const [editDescription, setEditDescription] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'upcoming'>('active');

  // Dynamic user directory list
  const [usersList, setUsersList] = useState([
    {
      id: 'usr_admin_ben',
      name: 'Ben Moran',
      email: 'benmoran29dev@gmail.com',
      role: 'admin',
      enrollment: 'ADM-BEN-2026',
      details: 'Administrador Geral & Diretor de Tecnologia Biorad Cursos',
      badge: 'Super Admin • Gestor Geral',
      badgeColor: 'amber'
    },
    {
      id: 'u1',
      name: 'Lucas Mendonça',
      email: 'lucas.mendonca@radbio.edu.br',
      role: 'student',
      enrollment: '2025-RAD-8841',
      details: 'Tecnólogo em Radiologia • 5º Período',
      badge: 'Ativo • CR 9.1',
      badgeColor: 'emerald'
    },
    {
      id: 'u2',
      name: 'Prof. Dr. Marcus Vinicius',
      email: 'marcus.vinicius@radbio.edu.br',
      role: 'professor',
      enrollment: 'DOC-TC-09',
      details: 'Especialista em TC CBR • Titular de Imagem',
      badge: 'Corpo Docente',
      badgeColor: 'cyan'
    },
    {
      id: 'u3',
      name: 'Dra. Helena Vasconcelos',
      email: 'helena.vasconcelos@radbio.edu.br',
      role: 'admin',
      enrollment: 'ADM-01',
      details: 'Coordenação Acadêmica Geral',
      badge: 'Coordenação Geral',
      badgeColor: 'amber'
    },
    {
      id: 'u4',
      name: 'Camila Albuquerque',
      email: 'camila.albuquerque@radbio.edu.br',
      role: 'student',
      enrollment: '2025-RAD-8912',
      details: 'Biomédica Imagenologista • Pós-Graduanda',
      badge: 'Ativo • CR 9.4',
      badgeColor: 'emerald'
    }
  ]);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'professor' | 'admin'>('student');
  const [newUserSpecialty, setNewUserSpecialty] = useState('');
  const [userFormError, setUserFormError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Active lesson for modal helper
  const modalActiveLesson = useMemo(() => {
    const courseLessons = allLessons.filter(l => l.courseId === contentModalCourseId);
    return courseLessons[0] || {
      id: `les_${Date.now()}`,
      courseId: contentModalCourseId,
      chapterNumber: 1,
      title: 'Capítulo 01: Introdução e Protocolos',
      description: 'Aula inaugural com conceitos fundamentais.',
      durationMinutes: 45,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      videoSource: 'direct_mp4' as const,
      isCompleted: false,
      ctWindowType: 'pulmonary' as const,
      markers: [{ timeSeconds: 60, label: 'Início da Aula' }],
      resources: [],
      quizQuestions: []
    };
  }, [allLessons, contentModalCourseId]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                          c.code.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                          c.instructor.toLowerCase().includes(courseSearchTerm.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'ALL' || c.category === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [courses, courseSearchTerm, selectedCategoryFilter]);

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set(courses.map(c => c.category).filter(Boolean));
    return Array.from(set);
  }, [courses]);

  // Open Edit Modal
  const handleOpenEditCourse = (course: Course) => {
    setSelectedCourseForEdit(course);
    setEditTitle(course.title);
    setEditCode(course.code);
    setEditInstructor(course.instructor);
    setEditInstructorTitle(course.instructorTitle || 'Especialista em Diagnóstico por Imagem CBR');
    setEditCategory(course.category);
    setEditCredits(course.credits || 40);
    setEditPrice(course.price ?? 149.00);
    setEditDescription(course.description);
    setEditCoverImage(course.coverImage || COVER_PRESETS[0].url);
    setEditStatus(course.status || 'active');
    setShowEditCourseModal(true);
  };

  // Save Edit Course
  const handleSaveEditedCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit || !editTitle.trim() || !editCode.trim()) return;

    const updated: Course = {
      ...selectedCourseForEdit,
      title: editTitle.trim(),
      code: editCode.trim().toUpperCase(),
      instructor: editInstructor.trim(),
      instructorTitle: editInstructorTitle.trim(),
      category: editCategory,
      credits: Number(editCredits) || 40,
      price: Number(editPrice) || 0,
      description: editDescription.trim(),
      coverImage: editCoverImage || selectedCourseForEdit.coverImage,
      status: editStatus
    };

    if (onUpdateCourse) {
      onUpdateCourse(updated);
    } else {
      const nextCourses = courses.map(c => c.id === updated.id ? updated : c);
      storageService.setCourses(nextCourses);
    }

    setShowEditCourseModal(false);
    setSelectedCourseForEdit(null);
  };

  // Confirm Delete Course
  const handleConfirmDeleteCourse = () => {
    if (!courseToDelete) return;
    if (onDeleteCourse) {
      onDeleteCourse(courseToDelete.id);
    } else {
      const nextCourses = courses.filter(c => c.id !== courseToDelete.id);
      storageService.setCourses(nextCourses);
    }
    setShowDeleteCourseModal(false);
    setCourseToDelete(null);
  };

  // Open Content Management Modal for specific course
  const handleOpenContentForCourse = (courseId: string) => {
    setContentModalCourseId(courseId);
    setAllLessons(storageService.getLessons());
    setIsContentModalOpen(true);
  };

  // Create Course Handler
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFormError(null);
    if (!newTitle.trim() || !newCode.trim()) {
      setCourseFormError('Preencha o título e o código do curso.');
      return;
    }

    const courseId = `course_${Date.now()}`;
    const course: Course = {
      id: courseId,
      code: newCode.trim().toUpperCase(),
      title: newTitle.trim(),
      description: newDescription.trim() || 'Curso técnico especializado com ênfase em diagnóstico tomográfico e prática de bancada.',
      credits: Number(newCredits) || 40,
      instructor: newInstructor.trim() || 'Prof. Dr. Marcus Vinicius',
      instructorTitle: newInstructorTitle.trim() || 'Especialista em Tomografia Computadorizada CBR',
      category: newCategory,
      progress: 0,
      currentModule: 1,
      totalModules: newInitialModulesCount,
      grade: 0,
      status: 'active',
      price: Number(newPrice) || 149.00,
      coverImage: newCoverImage || COVER_PRESETS[0].url
    };

    onAddCourse(course);

    // Generate initial structured chapters/lessons for students
    const initialCourseLessons: Lesson[] = [];
    const sampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    ];
    const windowTypes: ('pulmonary' | 'bone' | 'mediastinum' | 'brain')[] = ['pulmonary', 'mediastinum', 'bone', 'brain'];

    for (let i = 1; i <= newInitialModulesCount; i++) {
      const lesId = `les_${Date.now()}_${i}`;
      initialCourseLessons.push({
        id: lesId,
        courseId: courseId,
        chapterNumber: i,
        title: `Capítulo 0${i}: ${i === 1 ? 'Fundamentos & Anatomia Tomográfica' : i === 2 ? 'Protocolos de Aquisição & Contraste' : i === 3 ? 'Reconstruções 3D & Análise de Laudos' : 'Casos Práticos e Discussão'} • ${course.title}`,
        description: `Módulo didático com foco em parâmetros técnicos (kV, mAs, FOV, Pitch), janelamento e casos clínicos de ${course.title}.`,
        durationMinutes: 45 + (i * 5),
        videoUrl: sampleVideos[(i - 1) % sampleVideos.length],
        videoSource: 'direct_mp4',
        isCompleted: false,
        ctWindowType: windowTypes[(i - 1) % windowTypes.length],
        markers: [
          { timeSeconds: 60, label: 'Introdução e Objetivos' },
          { timeSeconds: 600, label: 'Parâmetros Técnicos de Aquisição' },
          { timeSeconds: 1200, label: 'Casos Clínicos e Janelamento' }
        ],
        resources: [
          {
            id: `res_${Date.now()}_${i}_1`,
            lessonId: lesId,
            title: `Apostila Oficial em PDF - Módulo ${i} • ${course.title}`,
            description: 'Material didático oficial em PDF com tabelas anatômicas e referências do CBR.',
            type: 'pdf',
            fileSize: `${(5.2 + i * 0.8).toFixed(1)} MB`,
            dateAdded: 'Hoje',
            authorName: course.instructor,
            previewContent: `# ${course.title} - Módulo ${i}\n\nGuia Oficial de Estudos Biorad Cursos.\nElaborado em conformidade com as diretrizes do Colégio Brasileiro de Radiologia (CBR) e ANVISA.\n\nConteúdo: Parâmetros físicos do tubo de raios-X, dosimetria ALARA (CTDIvol/DLP) e algoritmos iterativos de reconstrução.`
          },
          {
            id: `res_${Date.now()}_${i}_2`,
            lessonId: lesId,
            title: `Protocolo Prático de Workstation Canon Aquilion`,
            description: 'Ficha de bancada com fluxo de trabalho, colimação e reconstrução multiplanar MPR.',
            type: 'protocol',
            fileSize: '3.4 MB',
            dateAdded: 'Hoje',
            authorName: course.instructor
          }
        ],
        quizQuestions: [
          {
            id: `quiz_${Date.now()}_${i}_1`,
            lessonId: lesId,
            question: `Em relação aos parâmetros técnicos de ${course.title}, qual conduta atende ao princípio ALARA?`,
            options: [
              'Otimizar kVp e mAs com modulação automática de dose (SUREExposure 3D) para o menor nível com valor diagnóstico',
              'Aumentar o mAs ao máximo em todos os pacientes independente do biotipo físico',
              'Desativar os filtros de reconstrução iterativa para acelerar a aquisição',
              'Repetir a varredura sem justificativa clínica'
            ],
            correctAnswerIndex: 0,
            explanation: 'O princípio ALARA preconiza obter o diagnóstico preciso com a menor dose possível de radiação ionizante ao paciente.'
          }
        ]
      });
    }

    initialCourseLessons.forEach(l => storageService.addLesson(l));
    setAllLessons(storageService.getLessons());

    setShowAddCourseModal(false);
    setNewTitle('');
    setNewCode('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-7">
      {/* Top Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-500 font-mono mb-1 font-bold">
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            <span>Painel Institucional • Coordenação Acadêmica &amp; Criação de Conteúdos</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Gestão de Cursos &amp; Conteúdos dos Alunos
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
            Crie novos cursos, configure videoaulas, materiais em PDF, quizzes avaliativos e vincule casos do simulador de TC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBackupModal(true)}
            className={`px-4 py-2.5 !rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-sm hover:scale-[1.02] active:scale-95 ${
              isDark
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 shadow-amber-950/30'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 shadow-amber-100'
            }`}
            title="Abrir Central de Backup e Exportação JSON"
          >
            <span className="material-symbols-outlined text-base text-amber-400">settings_backup_restore</span>
            <span>Backup de Dados (JSON)</span>
          </button>

          {onNavigateTab && (
            <>
              <button
                type="button"
                onClick={() => onNavigateTab('cursos_livres')}
                className="px-4 py-2.5 !rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-cyan-500/20 hover:scale-[1.02] active:scale-95"
                title="Ver Catálogo de Cursos Livres 40h"
              >
                <span className="material-symbols-outlined text-base">school</span>
                <span>Catálogo de Cursos</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('aulas')}
                className="px-4 py-2.5 !rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-emerald-500/20 hover:scale-[1.02] active:scale-95"
                title="Abrir Ambiente de Aula do Aluno"
              >
                <span className="material-symbols-outlined text-base">play_circle</span>
                <span>Portal de Aulas</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setCourseFormError(null);
              setNewTitle('');
              setNewCode(`RAD-${Math.floor(100 + Math.random() * 900)}`);
              setShowAddCourseModal(true);
            }}
            className="px-4 py-2.5 !rounded-full bg-gradient-to-r from-[#06b6d4] to-[#4edea3] text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-95 hover:scale-[1.02] active:scale-95 border border-cyan-300/40"
          >
            <span className="material-symbols-outlined text-base font-bold">add_circle</span>
            <span>Criar Novo Curso / Disciplina</span>
          </button>
        </div>
      </section>

      {/* Backup Toast Notification */}
      {backupToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{backupToast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`p-5 rounded-2xl backdrop-blur-xl border shadow-xl ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Cursos &amp; Disciplinas Ativas
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 material-symbols-outlined text-base">school</span>
          </div>
          <div className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {courses.length}
          </div>
          <div className="text-xs text-cyan-400 mt-2 flex items-center gap-1 font-semibold">
            <span>{allLessons.length} aulas e capítulos cadastrados</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl backdrop-blur-xl border shadow-xl ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Alunos Matriculados
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 material-symbols-outlined text-base">group</span>
          </div>
          <div className={`text-3xl font-extrabold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            1.428
          </div>
          <div className="text-xs text-emerald-500 mt-2 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-xs">trending_up</span> 100% de acesso ao simulador Canon
          </div>
        </div>

        <div className={`p-5 rounded-2xl backdrop-blur-xl border shadow-xl ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Materiais &amp; PDFs Disponíveis
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 material-symbols-outlined text-base">description</span>
          </div>
          <div className="text-3xl font-extrabold text-purple-400 font-['Plus_Jakarta_Sans']">
            {allLessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0) + 18}
          </div>
          <div className={`text-xs mt-2 ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>Apostilas, protocolos e casos DICOM</div>
        </div>

        <div className={`p-5 rounded-2xl backdrop-blur-xl border shadow-xl ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${isDark ? 'text-[#869397]' : 'text-slate-500'}`}>
              Quizzes &amp; Questões de Fixação
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 material-symbols-outlined text-base">quiz</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-['Plus_Jakarta_Sans']">
            {allLessons.reduce((acc, l) => acc + (l.quizQuestions?.length || 0), 0) + 24}
          </div>
          <div className="text-xs text-amber-500 mt-2 font-medium">Correção e gabarito automáticos</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex flex-wrap items-center gap-2 border-b pb-2 text-xs ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'courses'
              ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">library_books</span>
          <span>Cursos &amp; Disciplinas ({courses.length})</span>
        </button>

        <button
          onClick={() => {
            setAllLessons(storageService.getLessons());
            setActiveTab('content_matrix');
          }}
          className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'content_matrix'
              ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">account_tree</span>
          <span>Matriz de Aulas &amp; Conteúdos ({allLessons.length} Aulas)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users'
              ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">group</span>
          <span>Gestão de Usuários (Alunos &amp; Docentes)</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">insights</span>
          <span>Relatórios de Desempenho &amp; Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'finance'
              ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>Pagamentos OK &amp; Matrículas</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? isDark ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-sm' : 'bg-cyan-50 text-cyan-700 border border-cyan-300 shadow-sm'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">policy</span>
          <span>Logs de Auditoria &amp; Atividades</span>
        </button>
      </div>

      {/* ==================== TAB 1: COURSES MANAGEMENT ==================== */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                search
              </span>
              <input
                type="text"
                value={courseSearchTerm}
                onChange={e => setCourseSearchTerm(e.target.value)}
                placeholder="Buscar por curso, código ou professor..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none border transition-all ${
                  isDark ? 'bg-[#101624] border-white/10 text-white placeholder-gray-500 focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({courses.length})
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map(course => {
              const courseLessons = allLessons.filter(l => l.courseId === course.id);
              const resourcesCount = courseLessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0);
              const quizCount = courseLessons.reduce((acc, l) => acc + (l.quizQuestions?.length || 0), 0);

              return (
                <div
                  key={course.id}
                  className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                    isDark
                      ? 'bg-gradient-to-b from-[#161f36] to-[#0f1526] border-white/10 hover:border-cyan-500/40 shadow-black/60'
                      : 'bg-white border-slate-200 hover:border-cyan-400 shadow-md'
                  }`}
                >
                  {/* Card Cover */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden group">
                    <img
                      src={course.coverImage || COVER_PRESETS[0].url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1526] via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/90 text-slate-950 font-mono font-black text-[10px] shadow-md backdrop-blur-md">
                        {course.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold backdrop-blur-md">
                        {course.credits}h Certificadas
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${
                        course.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {course.status === 'active' ? 'Ativo no Portal' : 'Em Breve'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="text-[11px] font-bold text-cyan-200 truncate">{course.category}</span>
                      <span className="font-mono font-black text-sm bg-black/70 px-2 py-0.5 rounded-md text-emerald-400 border border-emerald-500/30">
                        {course.price ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className={`text-base font-bold font-['Plus_Jakarta_Sans'] line-clamp-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {course.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${
                        isDark ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {course.description}
                      </p>
                    </div>

                    {/* Stats & Instructor */}
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          <span className="material-symbols-outlined text-sm text-cyan-400">person</span>
                          <span className="truncate max-w-[180px] font-medium">{course.instructor}</span>
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                          {courseLessons.length} Aulas
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 py-1.5 px-2 rounded-xl bg-black/30 text-center font-mono text-[10px] text-gray-400 border border-white/5">
                        <div>
                          <strong className="block text-white text-xs">{courseLessons.length}</strong>
                          <span>Aulas</span>
                        </div>
                        <div>
                          <strong className="block text-cyan-400 text-xs">{resourcesCount}</strong>
                          <span>PDFs/Materiais</span>
                        </div>
                        <div>
                          <strong className="block text-amber-400 text-xs">{quizCount}</strong>
                          <span>Quizzes</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Deck */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenContentForCourse(course.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
                        title="Abrir editor de videoaulas, PDFs, quizzes e casos do simulador"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Gerenciar Aulas &amp; Conteúdo</span>
                      </button>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCourse(course)}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                          title="Editar informações gerais do curso"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          <span>Editar</span>
                        </button>

                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('aulas')}
                            className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="Visualizar este curso como aluno no Portal de Aulas"
                          >
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            <span>Ver Aluno</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setCourseToDelete(course);
                            setShowDeleteCourseModal(true);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Excluir ou desativar disciplina"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CURRICULAR MATRIX & CONTENT TREE ==================== */}
      {activeTab === 'content_matrix' && (
        <div className={`p-6 rounded-[32px] border space-y-6 ${
          isDark ? 'bg-[#141f38]/50 border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h3 className={`text-base font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Matriz Curricular &amp; Estrutura de Capítulos dos Alunos
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Visualize e edite a hierarquia completa de aulas, materiais didáticos, simulador de TC e questionários de fixação.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenContentForCourse(courses[0]?.id || 'course_tc_701')}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Adicionar Nova Aula em Qualquer Curso</span>
            </button>
          </div>

          {/* Courses Hierarchical Accordion / Tree */}
          <div className="space-y-4">
            {courses.map(course => {
              const courseLessons = allLessons.filter(l => l.courseId === course.id);

              return (
                <div
                  key={course.id}
                  className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                    isDark ? 'bg-[#0a0e17]/70 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                        {course.code.slice(0, 4)}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {course.title}
                        </h4>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span>Docente: <strong>{course.instructor}</strong></span>
                          <span>•</span>
                          <span>{course.credits} Horas Certificadas</span>
                          <span>•</span>
                          <span className="text-cyan-400 font-bold">{courseLessons.length} Aulas Ativas</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenContentForCourse(course.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:opacity-90 self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      <span>Gerenciar Conteúdos ({courseLessons.length})</span>
                    </button>
                  </div>

                  {/* Lessons list inside course */}
                  <div className="space-y-2 pt-2">
                    {courseLessons.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-400">
                        Nenhuma aula cadastrada ainda para esta disciplina. Clique em &quot;Gerenciar Conteúdos&quot; para adicionar a primeira videoaula.
                      </div>
                    ) : (
                      courseLessons.map(lesson => (
                        <div
                          key={lesson.id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            isDark ? 'bg-[#151b2a] border-white/5' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-base text-cyan-400">play_circle</span>
                            <div>
                              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                                {lesson.title}
                              </strong>
                              <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                                <span>Duração: {lesson.durationMinutes} min</span>
                                <span>•</span>
                                <span>Janela TC: {lesson.ctWindowType || 'Pulmonar'}</span>
                                <span>•</span>
                                <span className="text-purple-300">
                                  {lesson.resources?.length || 0} Material(is) em PDF
                                </span>
                                <span>•</span>
                                <span className="text-amber-300">
                                  {lesson.quizQuestions?.length || 0} Pergunta(s) Quiz
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenContentForCourse(course.id)}
                              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 text-[11px] font-bold cursor-pointer"
                            >
                              Editar Aula
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: USERS MANAGEMENT ==================== */}
      {activeTab === 'users' && (
        <div className={`p-6 sm:p-7 rounded-[32px] border space-y-4 ${
          isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Diretório de Usuários Ativos ({usersList.length})
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Gerenciamento de alunos, preceptores e coordenadores da plataforma.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Cadastrar Aluno / Usuário</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {usersList.map(u => (
              <div
                key={u.id}
                className={`p-4 rounded-[22px] border flex items-center justify-between ${
                  isDark ? 'bg-[#0a0e17]/60 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                    u.role === 'student' ? 'bg-cyan-500/20 text-cyan-400' :
                    u.role === 'professor' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-400/20 text-amber-400'
                  }`}>
                    {u.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>{u.name}</span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                        u.role === 'student' ? 'bg-cyan-500/10 text-cyan-400' :
                        u.role === 'professor' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {u.role === 'student' ? 'Aluno' : u.role === 'professor' ? 'Docente' : 'Admin'}
                      </span>
                    </div>
                    <div className={`font-mono text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      Matrícula: {u.enrollment} • {u.details}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    u.badgeColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                    u.badgeColor === 'cyan' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-amber-400/15 text-amber-400'
                  }`}>
                    {u.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB: PERFORMANCE & ANALYTICS REPORTS (RECHARTS) ==================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-7 animate-fade-in">
          {/* Header & KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-xl ${
              isDark ? 'bg-[#141f38]/60 border-cyan-500/30' : 'bg-white border-cyan-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-400">Nota Média Geral das Turmas</span>
                <span className="material-symbols-outlined text-cyan-400 text-lg">grade</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">8.92</span>
                <span className="text-xs text-gray-400">/ 10.0</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span>+1.92 pts acima do threshold MEC (7.0)</span>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-xl ${
              isDark ? 'bg-[#141f38]/60 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400">Taxa de Retenção Acadêmica</span>
                <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">95.8%</span>
                <span className="text-xs text-emerald-400 font-bold">Excelente</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">arrow_downward</span>
                <span>Taxa de evasão reduzida para 4.2%</span>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-xl ${
              isDark ? 'bg-[#141f38]/60 border-amber-500/30' : 'bg-white border-amber-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400">Tempo Médio de Conclusão</span>
                <span className="material-symbols-outlined text-amber-400 text-lg">schedule</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">23.4</span>
                <span className="text-xs text-gray-400">dias / curso</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">timer</span>
                <span>100% dentro do prazo de 60 dias (2 meses)</span>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-xl ${
              isDark ? 'bg-[#141f38]/60 border-purple-500/30' : 'bg-white border-purple-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-400">Certificados 40h Emitidos</span>
                <span className="material-symbols-outlined text-purple-400 text-lg">workspace_premium</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">1.184</span>
                <span className="text-xs text-purple-400">homologados</span>
              </div>
              <div className="mt-2 text-[11px] text-purple-300 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">qr_code_2</span>
                <span>Autenticidade ICP-Brasil &amp; LDB</span>
              </div>
            </div>
          </div>

          {/* Row 1: Notas Médias de Turmas & Tempo Médio de Conclusão */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Notas Médias das Turmas */}
            <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl space-y-4 ${
              isDark ? 'bg-[#141f38]/60 border-white/10' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-extrabold font-['Plus_Jakarta_Sans'] flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span className="material-symbols-outlined text-cyan-400">bar_chart</span>
                    <span>Notas Médias por Turma e Disciplina</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Avaliação contínua dos módulos teóricos, quizzes de fixação e bancada DICOM (Escala 0 a 10).
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Meta: ≥ 7.0
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'TC Multislice 40h', notaMedia: 9.1, meta: 7.0, alunos: 412 },
                      { name: 'Radioproteção', notaMedia: 8.8, meta: 7.0, alunos: 320 },
                      { name: 'AngioTC 3D', notaMedia: 8.5, meta: 7.0, alunos: 284 },
                      { name: 'TC em Neuro', notaMedia: 9.3, meta: 7.0, alunos: 245 },
                      { name: 'Reconstrução MPR', notaMedia: 8.9, meta: 7.0, alunos: 167 }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                      ticks={[0, 2, 4, 6, 7, 8, 10]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#06b6d4',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                      formatter={(val: any) => [`${val} / 10.0`, 'Nota Média']}
                    />
                    <ReferenceLine y={7.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Meta: 7.0', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <Bar
                      dataKey="notaMedia"
                      fill="#06b6d4"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tempo Médio de Conclusão */}
            <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl space-y-4 ${
              isDark ? 'bg-[#141f38]/60 border-white/10' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-extrabold font-['Plus_Jakarta_Sans'] flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span className="material-symbols-outlined text-amber-400">timelapse</span>
                    <span>Tempo Médio de Conclusão dos Cursos (Dias)</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Média de dias gastos pelos alunos para emissão do certificado vs. limite de 60 dias (2 meses).
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Limite: 60 Dias
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'TC Multislice', diasMedios: 22, limite: 60 },
                      { name: 'Radioproteção', diasMedios: 14, limite: 60 },
                      { name: 'AngioTC 3D', diasMedios: 28, limite: 60 },
                      { name: 'TC em Neuro', diasMedios: 24, limite: 60 },
                      { name: 'Reconstrução', diasMedios: 19, limite: 60 }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 70]}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#f59e0b',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                      formatter={(val: any) => [`${val} dias`, 'Tempo Médio']}
                    />
                    <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Expiração (60d)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                    <Bar
                      dataKey="diasMedios"
                      fill="#f59e0b"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Taxa de Evasão Histórica e Distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AreaChart: Evolução da Evasão (6 Meses) */}
            <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl space-y-4 ${
              isDark ? 'bg-[#141f38]/60 border-white/10' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-extrabold font-['Plus_Jakarta_Sans'] flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span className="material-symbols-outlined text-emerald-400">trending_down</span>
                    <span>Curva Histórica de Evasão Acadêmica (%)</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Redução contínua da evasão após a implementação do simulador Canon Activion 16.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  -5.0% em 6 Meses
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { mes: 'Jan/26', evasao: 9.2, retencao: 90.8 },
                      { mes: 'Fev/26', evasao: 8.1, retencao: 91.9 },
                      { mes: 'Mar/26', evasao: 6.8, retencao: 93.2 },
                      { mes: 'Abr/26', evasao: 5.5, retencao: 94.5 },
                      { mes: 'Mai/26', evasao: 4.8, retencao: 95.2 },
                      { mes: 'Jun/26', evasao: 4.2, retencao: 95.8 }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEvasao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorRetencao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} domain={[0, 15]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#10b981',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any) => [`${val}%`, 'Taxa de Evasão']}
                    />
                    <Area
                      type="monotone"
                      dataKey="evasao"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEvasao)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Distribuição de Alunos */}
            <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl space-y-4 ${
              isDark ? 'bg-[#141f38]/60 border-white/10' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div>
                <h3 className={`text-base font-extrabold font-['Plus_Jakarta_Sans'] flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span className="material-symbols-outlined text-purple-400">pie_chart</span>
                  <span>Distribuição dos Alunos</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Proporção de concluintes, ativos e evasão.
                </p>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Concluintes (Certificados)', value: 78, fill: '#10b981' },
                        { name: 'Em Andamento Ativo', value: 18, fill: '#06b6d4' },
                        { name: 'Evasão / Inativos', value: 4, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#38bdf8',
                        borderRadius: '14px',
                        fontSize: '11px'
                      }}
                      formatter={(val: any) => [`${val}%`, 'Proporção']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Concluintes (Certificados)
                  </span>
                  <span className="font-bold text-white">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Em Andamento Ativo
                  </span>
                  <span className="font-bold text-white">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Evasão / Inativos
                  </span>
                  <span className="font-bold text-red-400">4.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Performance Matrix Table */}
          <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-2xl space-y-4 ${
            isDark ? 'bg-[#141f38]/60 border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className={`text-base font-extrabold font-['Plus_Jakarta_Sans'] flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span className="material-symbols-outlined text-cyan-400">table_chart</span>
                  <span>Matriz de Desempenho e Retenção por Turma</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Consolidação dos dados acadêmicos, médias e tempo de formatura.
                </p>
              </div>
              <span className="text-xs text-cyan-400 font-mono">
                Dados atualizados em tempo real
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'border-white/10 text-gray-400' : 'border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Disciplina / Curso</th>
                    <th className="py-3 px-3">Docente Titular</th>
                    <th className="py-3 px-3">Alunos</th>
                    <th className="py-3 px-3">Nota Média</th>
                    <th className="py-3 px-3">Taxa de Conclusão</th>
                    <th className="py-3 px-3">Taxa de Evasão</th>
                    <th className="py-3 px-3">Tempo Médio</th>
                    <th className="py-3 px-3 text-right">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { code: 'TC-701', title: 'Tomografia Computadorizada Clínica 40h', instructor: 'Prof. Dr. Marcus Vinicius', students: 412, grade: 9.1, completion: '96.2%', dropout: '3.8%', days: '22 dias', badge: 'Excelente', color: 'emerald' },
                    { code: 'RAD-302', title: 'Radioproteção & Dosimetria em TC', instructor: 'Profa. Dra. Helena Siqueira', students: 320, grade: 8.8, completion: '94.5%', dropout: '4.5%', days: '14 dias', badge: 'Excelente', color: 'emerald' },
                    { code: 'ANGIO-901', title: 'Angiotomografia & Protocolos 3D', instructor: 'Prof. Roberto Alencar', students: 284, grade: 8.5, completion: '91.8%', dropout: '5.2%', days: '28 dias', badge: 'Muito Bom', color: 'cyan' },
                    { code: 'NEURO-402', title: 'TC em Neurologia, AVC & Crânio', instructor: 'Prof. Dr. Marcus Vinicius', students: 245, grade: 9.3, completion: '97.5%', dropout: '2.5%', days: '24 dias', badge: 'Excelente', color: 'emerald' },
                    { code: '3D-505', title: 'Reconstruções 3D MPR, MIP e VR', instructor: 'Profa. Camila Torres', students: 167, grade: 8.9, completion: '95.0%', dropout: '4.0%', days: '19 dias', badge: 'Excelente', color: 'emerald' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">{row.code}</td>
                      <td className="py-3 px-3 font-medium text-white max-w-[200px] truncate">{row.title}</td>
                      <td className="py-3 px-3 text-gray-300">{row.instructor}</td>
                      <td className="py-3 px-3 font-mono">{row.students}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{row.grade}</td>
                      <td className="py-3 px-3 font-mono text-emerald-300">{row.completion}</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{row.dropout}</td>
                      <td className="py-3 px-3 font-mono text-cyan-300">{row.days}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          row.color === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {row.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: STUDENT PAYMENTS & PIX SUBSCRIPTIONS ==================== */}
      {activeTab === 'finance' && (
        <StudentPaymentsDashboard theme={theme} />
      )}

      {/* ==================== TAB 6: AUDIT LOGS & USER ACTIVITIES ==================== */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Main Paginated Audit Logs Manager */}
          <AuditLogsManager theme={theme} />

          {/* Collapsible Email Notification Queue */}
          <div className={`p-6 sm:p-7 rounded-[36px] border space-y-4 ${
            isDark ? 'bg-[#141f38]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">mail</span>
                <h3 className={`text-sm font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Fila de Notificações Transacionais por E-mail (SMTP)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {notifications.length} disparos registrados
              </span>
            </div>

            <div className="space-y-2.5 text-xs max-h-64 overflow-y-auto pr-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-[#0a0e17]/70 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-cyan-400">{n.subject}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-white/10 text-gray-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {n.type}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      Destinatário: {n.recipientEmail}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Entregue
                    </span>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{n.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD COURSE ==================== */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className={`max-w-2xl w-full p-6 sm:p-7 rounded-3xl border shadow-2xl space-y-5 my-8 ${
            isDark ? 'bg-[#181d2a] border-[#4cd7f6]/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">add_box</span>
                  <span>Criar Novo Curso / Disciplina</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Preencha os dados curriculares. Os primeiros módulos e materiais em PDF serão gerados automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {courseFormError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{courseFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Título Completo do Curso *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Angiotomografia &amp; Protocolos Cardiovasculares"
                    required
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Código do Curso *
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="ANGIO-901"
                    required
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Categoria Temática
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Tomografia Computadorizada">Tomografia Computadorizada</option>
                    <option value="Angiotomografia">Angiotomografia</option>
                    <option value="Exames Contrastados">Exames Contrastados</option>
                    <option value="Ressonância Magnética">Ressonância Magnética</option>
                    <option value="Radiologia Geral">Radiologia Geral</option>
                    <option value="Centro Cirúrgico">Centro Cirúrgico</option>
                    <option value="Radioproteção">Radioproteção</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Carga Horária (Certificado)
                  </label>
                  <select
                    value={newCredits}
                    onChange={e => setNewCredits(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={40}>40 Horas Certificadas (Curso Livre)</option>
                    <option value={60}>60 Horas Certificadas</option>
                    <option value={80}>80 Horas Certificadas</option>
                    <option value={120}>120 Horas Certificadas</option>
                    <option value={180}>180 Horas (Especialização)</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Valor de Matrícula (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Docente Responsável
                  </label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={e => setNewInstructor(e.target.value)}
                    placeholder="Prof. Dr. Marcus Vinicius"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Titulação do Docente
                  </label>
                  <input
                    type="text"
                    value={newInstructorTitle}
                    onChange={e => setNewInstructorTitle(e.target.value)}
                    placeholder="Especialista em Tomografia CBR"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Descrição e Ementa do Curso
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Descreva os tópicos abordados, público-alvo e metodologia de ensino..."
                  className={`w-full p-2.5 rounded-xl border outline-none resize-none ${
                    isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Cover Image Presets */}
              <div className="space-y-2">
                <label className={`block font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                  Imagem de Capa (Selecione um preset de alta resolução ou insira uma URL):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COVER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewCoverImage(preset.url)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                        newCoverImage === preset.url
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40'
                          : isDark ? 'bg-[#0a0e17] border-white/10 text-gray-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <span className="text-[10px] leading-tight line-clamp-2">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Modules Creation Count */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-cyan-300 block text-xs">Pré-carregar Módulos Iniciais com Conteúdo</span>
                  <span className="text-[11px] text-gray-400">Gera automaticamente as primeiras aulas com vídeos, apostilas e testes.</span>
                </div>
                <select
                  value={newInitialModulesCount}
                  onChange={e => setNewInitialModulesCount(Number(e.target.value))}
                  className="bg-black/60 border border-cyan-400/40 text-cyan-300 rounded-lg px-3 py-1 font-bold text-xs"
                >
                  <option value={2}>2 Aulas Iniciais</option>
                  <option value={3}>3 Aulas Iniciais</option>
                  <option value={4}>4 Aulas Iniciais</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className={`px-4 py-2 rounded-xl cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer hover:opacity-95"
                >
                  Publicar Curso para os Alunos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT COURSE ==================== */}
      {showEditCourseModal && selectedCourseForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className={`max-w-xl w-full p-6 sm:p-7 rounded-3xl border shadow-2xl space-y-4 my-8 ${
            isDark ? 'bg-[#181d2a] border-cyan-400/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">edit</span>
                <span>Editar Detalhes do Curso: {selectedCourseForEdit.code}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditCourseModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditedCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-gray-300">Título do Curso</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-gray-300">Código</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-300">Carga Horária (Horas)</label>
                  <input
                    type="number"
                    value={editCredits}
                    onChange={e => setEditCredits(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-gray-300">Docente Titular</label>
                  <input
                    type="text"
                    value={editInstructor}
                    onChange={e => setEditInstructor(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-300">Valor (R$)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-300">Descrição</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none resize-none ${
                    isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow cursor-pointer hover:opacity-95"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DELETE COURSE CONFIRMATION ==================== */}
      {showDeleteCourseModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#1c1f29] border-rose-500/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-3 text-rose-400">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-base font-bold font-['Plus_Jakarta_Sans']">Excluir Disciplina</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Você tem certeza de que deseja remover o curso <strong>{courseToDelete.title}</strong> ({courseToDelete.code})?
              Esta ação removerá o curso do catálogo de alunos.
            </p>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteCourseModal(false)}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCourse}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow cursor-pointer"
              >
                Sim, Excluir Curso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD USER / STUDENT ==================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#1c1f29] border-[#4cd7f6]/40 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']">Cadastrar Novo Usuário</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setUserFormError(null);
                if (!newUserName.trim() || !newUserEmail.trim()) {
                  setUserFormError('Nome e E-mail são obrigatórios.');
                  return;
                }
                if (newUserRole === 'student') {
                  if (!newUserCpf.trim()) {
                    setUserFormError('O CPF é obrigatório para cadastro de alunos (necessário para emissão do certificado).');
                    return;
                  }
                  if (!isValidCpf(newUserCpf)) {
                    setUserFormError('O CPF informado é inválido. Digite os 11 dígitos corretos.');
                    return;
                  }
                }
                const enroll = newUserRole === 'student' ? `2026-RAD-${Math.floor(1000 + Math.random() * 9000)}` : newUserRole === 'professor' ? `DOC-TC-${Math.floor(10 + Math.random() * 90)}` : `ADM-${Math.floor(10 + Math.random() * 90)}`;
                const formattedCpf = newUserCpf.trim() ? formatCpf(newUserCpf.trim()) : undefined;
                const newU = {
                  id: `u_${Date.now()}`,
                  name: newUserName.trim(),
                  email: newUserEmail.trim(),
                  role: newUserRole,
                  enrollment: enroll,
                  details: newUserSpecialty || (newUserRole === 'student' ? 'Graduação em Radiologia / Imagenologia' : 'Especialista em Tomografia Computadorizada'),
                  badge: newUserRole === 'student' ? 'Matriculado • Ativo' : newUserRole === 'professor' ? 'Docente Ativo' : 'Administrador',
                  badgeColor: newUserRole === 'student' ? 'emerald' : newUserRole === 'professor' ? 'cyan' : 'amber'
                };
                
                storageService.registerUser({
                  id: newU.id,
                  name: newU.name,
                  email: newU.email,
                  role: newU.role as any,
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
                  enrollmentId: enroll,
                  specialty: newU.details,
                  cpf: formattedCpf,
                  gpa: 4.0,
                  completedHours: 0,
                  totalRequiredHours: 180,
                  attendanceRate: 100,
                  status: 'regular',
                  password: '123'
                });

                setUsersList(prev => [newU, ...prev]);
                setNewUserName('');
                setNewUserEmail('');
                setNewUserCpf('');
                setNewUserSpecialty('');
                setUserFormError(null);
                setShowAddUserModal(false);
              }}
              className="space-y-3 text-xs"
            >
              {userFormError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{userFormError}</span>
                </div>
              )}

              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Ex: Beatriz Lima Ramos"
                  required
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="beatriz.ramos@radbio.edu.br"
                    required
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`flex items-center justify-between mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    <span>CPF {newUserRole === 'student' ? '*' : ''}</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Para o Certificado</span>
                  </label>
                  <input
                    type="text"
                    value={newUserCpf}
                    onChange={e => setNewUserCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required={newUserRole === 'student'}
                    className={`w-full p-2.5 rounded-xl border outline-none font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Perfil de Acesso</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="student">Aluno / Discente (CPF Obrigatório)</option>
                    <option value="professor">Professor / Preceptor</option>
                    <option value="admin">Administrador / Coordenação</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Área / Especialidade</label>
                  <input
                    type="text"
                    value={newUserSpecialty}
                    onChange={e => setNewUserSpecialty(e.target.value)}
                    placeholder="Ex: TC Multislice"
                    className={`w-full p-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={`px-4 py-2 rounded-xl cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold shadow cursor-pointer hover:opacity-95"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: INSTITUTIONAL DATA BACKUP & RESTORE ==================== */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className={`max-w-3xl w-full p-6 sm:p-8 rounded-[36px] border shadow-2xl space-y-6 my-8 transition-all ${
            isDark
              ? 'bg-[#12192c] border-amber-500/40 text-white ring-1 ring-amber-500/20'
              : 'bg-white border-amber-200 text-slate-900 shadow-xl'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <span className="material-symbols-outlined text-2xl">settings_backup_restore</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold font-['Plus_Jakarta_Sans']">
                    Backup &amp; Portabilidade Institucional
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Exporte todas as configurações, cursos 40h, matriz de aulas, boletins de notas e registros de alunos para um arquivo JSON seguro.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {restoreBackupError && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{restoreBackupError}</span>
              </div>
            )}

            {/* Content: 2-Column Grid for Export and Restore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1: Export Backup */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                isDark ? 'bg-[#0a0e17]/80 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>1. Exportar Snapshot Completo</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Gera um arquivo JSON contendo o estado integral do banco acadêmico para armazenamento seguro ou migração de servidor.
                  </p>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Usuários &amp; Alunos:</span>
                      <span className="font-bold text-white font-mono">{storageService.getRegisteredUsers().length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Cursos &amp; Disciplinas:</span>
                      <span className="font-bold text-white font-mono">{courses.length + storageService.getCursosLivres().length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Aulas &amp; Capítulos:</span>
                      <span className="font-bold text-white font-mono">{allLessons.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Notas &amp; Boletins:</span>
                      <span className="font-bold text-white font-mono">{storageService.getStudentGrades().length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Certificados Emitidos:</span>
                      <span className="font-bold text-emerald-400 font-mono">{storageService.getCertificates().length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Faturas &amp; Transações:</span>
                      <span className="font-bold text-cyan-400 font-mono">{storageService.getPaymentTransactions().length}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportInstitutionalBackup}
                  className="w-full py-3 px-4 !rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
                >
                  <span className="material-symbols-outlined text-base">file_download</span>
                  <span>Baixar Arquivo JSON de Backup</span>
                </button>
              </div>

              {/* Column 2: Restore Backup */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                isDark ? 'bg-[#0a0e17]/80 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    <span>2. Restaurar Base de Dados</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Importe um arquivo JSON de backup previamente exportado. Todos os cursos, alunos, notas e certificados serão restabelecidos imediatamente.
                  </p>

                  <div className="p-4 rounded-2xl border border-dashed border-cyan-500/40 bg-cyan-500/5 text-center space-y-2">
                    <span className="material-symbols-outlined text-3xl text-cyan-400">cloud_upload</span>
                    <p className="text-xs text-gray-300 font-semibold">
                      Selecione um arquivo .JSON para restaurar
                    </p>
                    <label className="inline-block mt-2 px-4 py-2 !rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold cursor-pointer transition-all">
                      <span>Procurar Arquivo JSON</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleRestoreInstitutionalBackup}
                        disabled={isRestoringBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-400">security</span>
                  <span>Validação de integridade automática pós-importação</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-400 flex items-center justify-between">
              <span>Compatibilidade: Formato universal JSON estruturado (Padrão Biorad Cursos LDB).</span>
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-1.5 !rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INTEGRATED INSTRUCTOR CONTENT MODAL ==================== */}
      <InstructorContentModal
        isOpen={isContentModalOpen}
        onClose={() => {
          setIsContentModalOpen(false);
          setAllLessons(storageService.getLessons());
        }}
        lessons={allLessons}
        courses={courses}
        activeLesson={modalActiveLesson}
        selectedCourseId={contentModalCourseId}
        onSaveLesson={(updatedLesson) => {
          storageService.updateLesson(updatedLesson);
          setAllLessons(storageService.getLessons());
        }}
        onAddNewLesson={(newLesson) => {
          storageService.addLesson(newLesson);
          setAllLessons(storageService.getLessons());
        }}
        onDeleteLesson={(lessonId) => {
          storageService.deleteLesson(lessonId);
          setAllLessons(storageService.getLessons());
        }}
        theme={theme}
      />
    </div>
  );
};
