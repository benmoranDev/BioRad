import React, { useState, useEffect } from 'react';
import { CursoLivre, ThemeMode, UserRole, CursoLivreModule } from '../../types';
import { storageService } from '../../services/storage';

interface CursosLivresViewProps {
  onSelectCourseForEnrollment: (courseId: string) => void;
  onOpenSimulator: () => void;
  onNavigateTab: (tab: string) => void;
  userRole?: UserRole;
  theme?: ThemeMode;
}

export const CursosLivresView: React.FC<CursosLivresViewProps> = ({
  onSelectCourseForEnrollment,
  onOpenSimulator,
  onNavigateTab,
  userRole = 'student',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [cursos, setCursos] = useState<CursoLivre[]>(() => storageService.getCursosLivres());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEnrolledOnly, setFilterEnrolledOnly] = useState<boolean>(false);
  const [detailModalCourse, setDetailModalCourse] = useState<CursoLivre | null>(null);

  // Management Modal (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Tomografia Computadorizada');
  const [formPrice, setFormPrice] = useState('169.00');
  const [formOriginalPrice, setFormOriginalPrice] = useState('320.00');
  const [formInstructor, setFormInstructor] = useState('Prof. Dr. Marcus Vinicius');
  const [formInstructorTitle, setFormInstructorTitle] = useState('Especialista em Tomografia Computadorizada CBR & Físico Médico');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetAudience, setFormTargetAudience] = useState('Estudantes e profissionais de Radiologia, Biomedicina, Medicina e Enfermagem.');
  const [formLegalCompliance, setFormLegalCompliance] = useState('Curso Livre de Capacitação Profissional regulamentado pela Lei nº 9.394/1996 (LDB) Art. 42 e Decreto nº 5.154/2004.');
  const [formObjectivesText, setFormObjectivesText] = useState('Dominar aquisições tomográficas de 16 canais\nInterpretar janelamento de Hounsfield Units\nOperar protocolos no simulador Canon Activion 16');
  const [formCoverImage, setFormCoverImage] = useState('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80');
  const [formSimulatorToggle, setFormSimulatorToggle] = useState(true);
  const [formDicomToggle, setFormDicomToggle] = useState(true);

  // Modules form state (4 modules x 10h standard)
  const [formModules, setFormModules] = useState<CursoLivreModule[]>([
    {
      id: 'mod_1',
      moduleNumber: 1,
      title: 'Módulo 1: Fundamentos & Princípios Físicos de TC (10h)',
      workloadHours: 10,
      description: 'Formação de imagem seccional, matriz de atenuação, colimação e detectores de estado sólido.',
      topics: ['Geração de Raios-X', 'Voxel Anisotrópico', 'Filtros de Reconstrução', 'Algoritmo AIDR 3D']
    },
    {
      id: 'mod_2',
      moduleNumber: 2,
      title: 'Módulo 2: Protocolos Clínicos & Prática de Varredura (10h)',
      workloadHours: 10,
      description: 'Posicionamento do paciente, scout view, janelamentos e densitometria de Hounsfield Units.',
      topics: ['Posicionamento Anatômico', 'Scout View', 'Escala HU', 'Janela de Partes Moles']
    },
    {
      id: 'mod_3',
      moduleNumber: 3,
      title: 'Módulo 3: Casos no Simulador Canon Activion 16 (10h)',
      workloadHours: 10,
      description: 'Treinamento prático direto no console virtual com varredura de cortes axiais e contraste.',
      topics: ['Console Virtual', 'Injeção de Contraste', 'Reconstrução MPR', 'Artefatos de Movimento']
    },
    {
      id: 'mod_4',
      moduleNumber: 4,
      title: 'Módulo 4: Pós-Processamento 3D & Certificação Oficial (10h)',
      workloadHours: 10,
      description: 'Reconstrução tridimensional, elaboração de relatório técnico e avaliação para certificação de 40h.',
      topics: ['3D Volume Rendering', 'MIP / MinIP', 'Relatório Técnico', 'Prova de Certificação 40h']
    }
  ]);

  // Sync state on change
  const handleReload = () => {
    setCursos(storageService.getCursosLivres());
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setCursos(storageService.getCursosLivres());
    };
    window.addEventListener('radbio_state_changed', handleStorageChange);
    return () => window.removeEventListener('radbio_state_changed', handleStorageChange);
  }, []);

  // Categories list
  const categories = [
    { id: 'all', label: 'Todos os 5 Cursos (40h)' },
    { id: 'Radioproteção', label: 'Radioproteção' },
    { id: 'Tomografia Computadorizada', label: 'Tomografia Computadorizada' },
    { id: 'Reconstruções 3D Avançadas', label: 'Reconstruções 3D Avançadas' },
    { id: 'Exames Contrastados', label: 'Exames Contrastados' },
    { id: 'Centro Cirúrgico', label: 'Centro Cirúrgico' }
  ];

  // Filtering
  const filteredCourses = cursos.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (filterEnrolledOnly && !c.isEnrolled) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchSub = c.subtitle.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchInst = c.instructor.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchCode && !matchDesc && !matchInst) return false;
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingCourseId(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormCategory('Tomografia Computadorizada');
    setFormPrice('169.00');
    setFormOriginalPrice('320.00');
    setFormInstructor('Prof. Dr. Marcus Vinicius');
    setFormInstructorTitle('Especialista em Tomografia Computadorizada CBR & Físico Médico');
    setFormDescription('Curso livre com 40 horas de carga horária para capacitação e aperfeiçoamento prático com simulador virtual Canon Activion 16.');
    setFormTargetAudience('Estudantes e profissionais de Radiologia, Biomedicina, Medicina e Enfermagem.');
    setFormLegalCompliance('Curso Livre de Formação Profissional regulamentado pela Lei nº 9.394/1996 (LDB) Art. 42 e Decreto nº 5.154/2004.');
    setFormObjectivesText('Dominar parâmetros de aquisição tomográfica\nOperar o console Canon Activion 16\nInterpretar janelamentos em Hounsfield Units');
    setFormCoverImage('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80');
    setFormSimulatorToggle(true);
    setFormDicomToggle(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: CursoLivre) => {
    setEditingCourseId(course.id);
    setFormTitle(course.title);
    setFormSubtitle(course.subtitle);
    setFormCategory(course.category);
    setFormPrice(course.price.toString());
    setFormOriginalPrice((course.originalPrice || course.price * 2).toString());
    setFormInstructor(course.instructor);
    setFormInstructorTitle(course.instructorTitle || '');
    setFormDescription(course.description);
    setFormTargetAudience(course.targetAudience);
    setFormLegalCompliance(course.legalCompliance);
    setFormObjectivesText(course.objectives.join('\n'));
    setFormCoverImage(course.coverImage);
    setFormSimulatorToggle(course.hasActivionSimulator);
    setFormDicomToggle(course.hasRealDicomCases);
    setFormModules(course.modules);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja remover o curso "${title}"?`)) {
      const updated = cursos.filter(c => c.id !== courseId);
      storageService.setCursosLivres(updated);
      setCursos(updated);
    }
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedPrice = parseFloat(formPrice) || 149.0;
    const parsedOriginalPrice = parseFloat(formOriginalPrice) || parsedPrice * 2;
    const objectivesArray = formObjectivesText
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    if (editingCourseId) {
      // Edit existing
      const updated = cursos.map(c => {
        if (c.id === editingCourseId) {
          return {
            ...c,
            title: formTitle.trim(),
            subtitle: formSubtitle.trim(),
            category: formCategory,
            price: parsedPrice,
            originalPrice: parsedOriginalPrice,
            instructor: formInstructor.trim(),
            instructorTitle: formInstructorTitle.trim(),
            description: formDescription.trim(),
            targetAudience: formTargetAudience.trim(),
            legalCompliance: formLegalCompliance.trim(),
            objectives: objectivesArray.length > 0 ? objectivesArray : c.objectives,
            coverImage: formCoverImage.trim() || c.coverImage,
            hasActivionSimulator: formSimulatorToggle,
            hasRealDicomCases: formDicomToggle,
            modules: formModules
          };
        }
        return c;
      });
      storageService.setCursosLivres(updated);
      setCursos(updated);
    } else {
      // Create new
      const newCourse: CursoLivre = {
        id: `cl_${Date.now()}`,
        code: `CL-TC-${Math.floor(4000 + Math.random() * 999)}`,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || 'Capacitação Prática em Tomografia Computadorizada',
        category: formCategory,
        workloadHours: 40,
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        installments: 12,
        rating: 5.0,
        reviewCount: 1,
        enrolledStudentsCount: 0,
        instructor: formInstructor.trim() || 'Prof. Dr. Marcus Vinicius',
        instructorTitle: formInstructorTitle.trim() || 'Especialista em Tomografia Computadorizada CBR',
        instructorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
        coverImage: formCoverImage.trim() || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
        description: formDescription.trim() || 'Curso livre com 40 horas de carga horária para capacitação e aperfeiçoamento com simulador.',
        targetAudience: formTargetAudience.trim() || 'Estudantes e profissionais de Radiologia e Biomedicina.',
        objectives: objectivesArray.length > 0 ? objectivesArray : ['Compreender protocolos práticos', 'Operar o console Canon Activion 16', 'Reconstruir imagens seccionais'],
        legalCompliance: formLegalCompliance.trim() || 'Curso Livre em conformidade com a Lei nº 9.394/96 Art. 42 e Decreto nº 5.154/04.',
        hasActivionSimulator: formSimulatorToggle,
        hasRealDicomCases: formDicomToggle,
        featured: false,
        isEnrolled: false,
        modules: formModules
      };
      storageService.addCursoLivre(newCourse);
      setCursos(storageService.getCursosLivres());
    }

    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto space-y-8">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-[36px] border p-6 sm:p-8 backdrop-blur-2xl transition-all shadow-xl bg-gradient-to-r from-[#06b6d4]/10 via-[#10b981]/5 to-transparent border-[#4cd7f6]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold border bg-[#06b6d4]/15 text-[#4cd7f6] border-[#4cd7f6]/30">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Educação Continuada • Cursos Livres de 40 Horas Reconhecidos</span>
            </div>
            <h1 className={`text-2xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Cursos Livres com Certificação de 40 Horas
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
              Cursos de capacitação e especialização prática em tomografia computadorizada multislice, urgência, angiotomografia, escore de cálcio, oncologia, pediatria e dosimetria. Regulamentados pela <strong>Lei nº 9.394/1996 (LDB)</strong> e <strong>Decreto nº 5.154/2004</strong>. Válidos para horas complementares (ACO), progressão funcional e concursos públicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(userRole === 'admin' || userRole === 'professor') && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-[#090d16] font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Adicionar Novo Curso (40h)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('pagamentos')}
              className={`px-5 py-2.5 rounded-full border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-cyan-400 border-cyan-400/40'
                  : 'bg-white hover:bg-slate-50 text-cyan-700 border-cyan-300 shadow-sm'
              }`}
            >
              <span className="material-symbols-outlined text-base">payments</span>
              <span>Central Pix &amp; Cartão</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 sm:p-5 rounded-[28px] border ${isDark ? 'bg-[#141b2d]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[11px] font-semibold text-gray-400">Total de Cursos Ativos</div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-0.5">{cursos.length} Especializações</div>
          <div className="text-[10px] text-emerald-400 mt-1">40 Horas Acadêmicas cada</div>
        </div>

        <div className={`p-4 sm:p-5 rounded-[28px] border ${isDark ? 'bg-[#141b2d]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[11px] font-semibold text-gray-400">Total de Horas de Formação</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">{cursos.length * 40} Horas</div>
          <div className="text-[10px] text-gray-400 mt-1">Lei 9.394/96 &amp; Dec. 5.154/04</div>
        </div>

        <div className={`p-4 sm:p-5 rounded-[28px] border ${isDark ? 'bg-[#141b2d]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[11px] font-semibold text-gray-400">Simulador Canon Activion 16</div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-0.5">100% Integrado</div>
          <div className="text-[10px] text-cyan-400 mt-1">Estações práticas em todos os cursos</div>
        </div>

        <div className={`p-4 sm:p-5 rounded-[28px] border ${isDark ? 'bg-[#141b2d]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-[11px] font-semibold text-gray-400">Satisfação dos Alunos</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
            <span>4.96</span>
            <span className="material-symbols-outlined text-lg text-amber-400">star</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">+4.200 avaliações verificadas</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Categories pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-[#090d16] shadow-md shadow-cyan-500/25'
                    : isDark
                      ? 'bg-[#181b25]/80 text-gray-300 hover:text-white border border-white/5 hover:border-white/20'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search and toggle enrolled */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-gray-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar curso de 40h..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-full text-xs border outline-none w-56 sm:w-64 ${
                  isDark
                    ? 'bg-[#141824] border-white/10 text-white placeholder-gray-500 focus:border-cyan-400'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-cyan-500'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => setFilterEnrolledOnly(!filterEnrolledOnly)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                filterEnrolledOnly
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : isDark
                    ? 'bg-[#141824] border-white/10 text-gray-400'
                    : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {filterEnrolledOnly ? 'check_circle' : 'school'}
              </span>
              <span>Já Matriculados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <div
            key={course.id}
            className={`rounded-[36px] border overflow-hidden backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
              course.isEnrolled
                ? isDark
                  ? 'bg-[#151d2f]/80 border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : 'bg-white border-emerald-400 shadow-md ring-1 ring-emerald-400/20'
                : isDark
                  ? 'bg-[#181b25]/80 border-white/10 hover:border-cyan-400/40'
                  : 'bg-white border-slate-200 hover:border-cyan-500 shadow-sm'
            }`}
          >
            {/* Top Image & Badges */}
            <div className="relative h-48 overflow-hidden bg-slate-900">
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover opacity-85 transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent" />

              {/* Workload 40h Badge */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-cyan-500 text-[#090d16] shadow-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">timer</span>
                  40 HORAS
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/40">
                  MEC / LDB 9.394
                </span>
              </div>

              {/* Admin / Professor Edit button */}
              {(userRole === 'admin' || userRole === 'professor') && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenEditModal(course);
                    }}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-cyan-500 hover:text-[#090d16] text-white transition-all cursor-pointer backdrop-blur-md"
                    title="Editar Curso"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteCourse(course.id, course.title);
                    }}
                    className="p-1.5 rounded-full bg-black/70 hover:bg-red-500 hover:text-white text-red-400 transition-all cursor-pointer backdrop-blur-md"
                    title="Excluir Curso"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              )}

              {/* Rating & Review (if not admin) */}
              {userRole === 'student' && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-amber-400">star</span>
                  <span>{course.rating}</span>
                  <span className="text-gray-400 text-[9px]">({course.reviewCount})</span>
                </div>
              )}

              {/* Category label bottom left */}
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#4cd7f6] border border-[#4cd7f6]/30">
                  {course.category}
                </span>
              </div>
            </div>

            {/* Course Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-[10px] font-mono text-gray-400 font-semibold mb-1">
                  {course.code} • 4 MÓDULOS DE 10 HORAS
                </div>
                <h3 className={`text-base font-extrabold font-['Plus_Jakarta_Sans'] leading-snug line-clamp-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {course.title}
                </h3>
                <p className={`text-xs mt-1.5 line-clamp-2 ${isDark ? 'text-[#bcc9cd]' : 'text-slate-600'}`}>
                  {course.description}
                </p>
              </div>

              {/* Highlights & Simulator indicator */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/10 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                  <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                  <span className="font-semibold">Simulador Canon Activion 16 Habilitado</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400 text-[11px]">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>Certificado Digital Oficial 40h com QR Code</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300 text-[11px] font-mono">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>
                    {course.isEnrolled
                      ? `Acesso Ativo (2 Meses) ${course.expiresAt ? `• Até ${course.expiresAt}` : ''}`
                      : 'Acesso por 2 Meses (60 Dias)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>{course.instructor}</span>
                </div>
              </div>

              {/* Pricing & Actions */}
              <div className="pt-3 border-t border-slate-200/10 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] text-gray-400 line-through">
                    R$ {course.originalPrice.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-xl font-extrabold text-cyan-400 font-['Plus_Jakarta_Sans']">
                    R$ {course.price.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    ou 12x de R$ {(course.price / course.installments).toFixed(2).replace('.', ',')} no cartão
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDetailModalCourse(course)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer text-center ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Ver Ementa (40h)
                  </button>

                  {course.isEnrolled ? (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('aulas')}
                      className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-[#090d16] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                    >
                      <span className="material-symbols-outlined text-sm">play_circle</span>
                      <span>Acessar Aulas</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectCourseForEnrollment(course.id)}
                      className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:opacity-95 text-[#090d16] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-cyan-500/20"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      <span>Pix / Cartão</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Syllabus Modal (40 Horas Breakdown) */}
      {detailModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`max-w-3xl w-full p-6 sm:p-8 rounded-[36px] border shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#181b25] border-cyan-400/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between gap-4 border-b pb-4 border-slate-200/15">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500 text-[#090d16]">
                    40 HORAS CERTIFICADAS
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {detailModalCourse.code}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-['Plus_Jakarta_Sans']">
                  {detailModalCourse.title}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                  {detailModalCourse.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalCourse(null)}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Legal compliance notice box */}
            <div className={`p-4 sm:p-5 rounded-[24px] border text-xs leading-relaxed ${
              isDark ? 'bg-[#0f1422] border-cyan-400/20 text-gray-300' : 'bg-cyan-50/70 border-cyan-200 text-slate-700'
            }`}>
              <strong className="text-cyan-400">Regulamentação e Validade Acadêmica:</strong> {detailModalCourse.legalCompliance}
            </div>

            {/* 2-Month Access Guarantee */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-amber-400 shrink-0">schedule</span>
                <div>
                  <strong className="block text-amber-300 text-xs">Período de Acesso: 2 Meses (60 Dias Corridos)</strong>
                  <span className="text-[11px] text-amber-200/80">
                    Após a confirmação do pagamento, você terá 60 dias para assistir às aulas, usar o simulador Canon e emitir o Certificado Oficial de 40h.
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg shrink-0">
                60 Dias de Acesso
              </span>
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Objetivos de Aprendizagem (40h)
              </h4>
              <ul className="space-y-1.5 text-xs">
                {detailModalCourse.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-400 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modules (4 modules x 10h) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Ementa Programática Dividida em 4 Módulos (10 Horas Cada)
              </h4>
              <div className="space-y-3">
                {detailModalCourse.modules.map(m => (
                  <div
                    key={m.id}
                    className={`p-4 sm:p-5 rounded-[24px] border space-y-2 ${
                      isDark ? 'bg-[#101522] border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-cyan-400">
                        {m.title}
                      </h5>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-extrabold">
                        {m.workloadHours} HORAS
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                      {m.description}
                    </p>
                    {m.simulatorProtocolName && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-xs">precision_manufacturing</span>
                        <span>Protocolo Prático: {m.simulatorProtocolName}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.topics.map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-2.5 py-1 rounded-full ${
                            isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          • {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/15">
              <div>
                <span className="text-xs text-gray-400">Investimento:</span>
                <div className="text-2xl font-extrabold text-cyan-400">
                  R$ {detailModalCourse.price.toFixed(2).replace('.', ',')}
                </div>
                <span className="text-[10px] text-emerald-400">
                  Liberação imediata via Pix ou Cartão em 12x
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDetailModalCourse(null)}
                  className={`px-5 py-2.5 rounded-full border text-xs font-bold cursor-pointer ${
                    isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = detailModalCourse.id;
                    setDetailModalCourse(null);
                    onSelectCourseForEnrollment(id);
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-[#090d16] font-bold text-xs shadow-lg shadow-cyan-500/30 cursor-pointer hover:opacity-95 transition-all"
                >
                  Matricular Agora (Pix ou Cartão)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit 40h Course (Admin / Professor) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSaveCourse}
            className={`max-w-3xl w-full p-6 sm:p-8 rounded-[36px] border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#181b25] border-cyan-400/40 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200/15">
              <div>
                <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                  {editingCourseId ? 'Editar Curso Livre (40 Horas)' : 'Cadastrar Novo Curso Livre (40 Horas)'}
                </h3>
                <p className="text-xs text-gray-400">
                  Formação de 40 horas dividida em 4 módulos de 10h com simulador Activion 16.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block mb-1 font-semibold text-gray-300">Título Oficial do Curso *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="ex: Tomografia Cardíaca & Escore de Cálcio Coronariano"
                  required
                  className={`w-full px-4 py-2.5 rounded-full border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-semibold text-gray-300">Subtítulo / Foco Principal</label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={e => setFormSubtitle(e.target.value)}
                  placeholder="ex: Sincronização por ECG Gating, Artérias Coronárias e Agatston"
                  className={`w-full px-4 py-2.5 rounded-full border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-300">Categoria Médica</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-full border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Radioproteção">Radioproteção</option>
                  <option value="Tomografia Computadorizada">Tomografia Computadorizada</option>
                  <option value="Reconstruções 3D Avançadas">Reconstruções 3D Avançadas</option>
                  <option value="Exames Contrastados">Exames Contrastados</option>
                  <option value="Centro Cirúrgico">Centro Cirúrgico</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-300">Valor da Matrícula (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value)}
                  placeholder="169.00"
                  required
                  className={`w-full px-4 py-2.5 rounded-full border outline-none font-mono ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-300">Professor / Docente Responsável</label>
                <input
                  type="text"
                  value={formInstructor}
                  onChange={e => setFormInstructor(e.target.value)}
                  placeholder="Prof. Dr. Marcus Vinicius"
                  className={`w-full px-4 py-2.5 rounded-full border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-gray-300">Titulação do Docente</label>
                <input
                  type="text"
                  value={formInstructorTitle}
                  onChange={e => setFormInstructorTitle(e.target.value)}
                  placeholder="Especialista em Tomografia Computadorizada CBR"
                  className={`w-full px-4 py-2.5 rounded-full border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-semibold text-gray-300">Descrição Completa</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Descrição minuciosa do curso, competências desenvolvidas e relevância clínica."
                  className={`w-full p-3.5 rounded-[20px] border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-semibold text-gray-300">Objetivos de Aprendizagem (um por linha)</label>
                <textarea
                  rows={3}
                  value={formObjectivesText}
                  onChange={e => setFormObjectivesText(e.target.value)}
                  placeholder="Objetivo 1&#10;Objetivo 2&#10;Objetivo 3"
                  className={`w-full p-3.5 rounded-[20px] border outline-none font-mono ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-semibold text-gray-300">URL da Imagem de Capa</label>
                <input
                  type="url"
                  value={formCoverImage}
                  onChange={e => setFormCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className={`w-full px-4 py-2.5 rounded-full border outline-none ${
                    isDark ? 'bg-[#0e121d] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSimulatorToggle}
                    onChange={e => setFormSimulatorToggle(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span>Habilitar Simulador Canon Activion 16</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDicomToggle}
                    onChange={e => setFormDicomToggle(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span>Casos Reais DICOM Médicos</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/15">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-white/10 text-gray-300 hover:bg-white/5 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-[#090d16] font-bold text-xs shadow-lg shadow-cyan-500/30 cursor-pointer hover:opacity-95"
              >
                {editingCourseId ? 'Salvar Alterações' : 'Publicar Curso (40 Horas)'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
