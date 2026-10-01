import React, { useState, useEffect } from 'react';
import { Lesson, LessonResource, LessonQuizQuestion, ThemeMode, Course } from '../../types';
import { parseVideoUrl, formatDuration, parseTimeStringToSeconds } from '../../utils/videoHelper';

interface InstructorContentModalProps {
  lessons: Lesson[];
  courses?: Course[];
  activeLesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onSaveLesson: (updated: Lesson) => void;
  onAddNewLesson: (newLesson: Lesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  selectedCourseId?: string;
  theme?: ThemeMode;
}

export const InstructorContentModal: React.FC<InstructorContentModalProps> = ({
  lessons,
  courses = [],
  activeLesson,
  isOpen,
  onClose,
  onSaveLesson,
  onAddNewLesson,
  onDeleteLesson,
  selectedCourseId,
  theme = 'dark'
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'video' | 'resources' | 'quiz'>('video');
  const [targetCourseId, setTargetCourseId] = useState<string>(
    selectedCourseId || activeLesson.courseId || (courses[0]?.id || 'course_tc_701')
  );

  // Filter lessons belonging to the selected course
  const courseLessons = lessons.filter(l => l.courseId === targetCourseId);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => {
    const matching = courseLessons.find(l => l.id === activeLesson.id);
    if (matching) return matching.id;
    return courseLessons[0]?.id || activeLesson.id;
  });

  const currentLesson = lessons.find(l => l.id === selectedLessonId) || activeLesson;

  // Video Form State
  const [title, setTitle] = useState(currentLesson.title);
  const [description, setDescription] = useState(currentLesson.description);
  const [durationMinutes, setDurationMinutes] = useState(currentLesson.durationMinutes);
  const [videoUrl, setVideoUrl] = useState(currentLesson.videoUrl);
  const [ctWindowType, setCtWindowType] = useState(currentLesson.ctWindowType || 'pulmonary');
  const [markers, setMarkers] = useState(currentLesson.markers || []);

  // New Marker state
  const [newMarkerTime, setNewMarkerTime] = useState('02:00');
  const [newMarkerLabel, setNewMarkerLabel] = useState('');

  // Resource Form State
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [resourceType, setResourceType] = useState<LessonResource['type']>('pdf');
  const [resourceSize, setResourceSize] = useState('5.4 MB');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourcePreview, setResourcePreview] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Quiz Form State
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [quizCorrectIdx, setQuizCorrectIdx] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState('');

  // Synchronize when targetCourseId changes
  useEffect(() => {
    const matching = lessons.filter(l => l.courseId === targetCourseId);
    if (matching.length > 0 && !matching.some(l => l.id === selectedLessonId)) {
      handleSelectLesson(matching[0].id);
    }
  }, [targetCourseId, lessons]);

  // When switching selected lesson
  const handleSelectLesson = (id: string) => {
    setSelectedLessonId(id);
    const target = lessons.find(l => l.id === id);
    if (target) {
      setTitle(target.title);
      setDescription(target.description);
      setDurationMinutes(target.durationMinutes);
      setVideoUrl(target.videoUrl);
      setCtWindowType(target.ctWindowType || 'pulmonary');
      setMarkers(target.markers || []);
    }
  };

  // Video Presets
  const videoPresets = [
    { label: 'Google Drive Vídeo Aula TC Tórax', url: 'https://drive.google.com/file/d/1B7x_y-0vF3d3qQ5R7pW2Z1yX0A/preview' },
    { label: 'Google Drive Angiotomografia & Contraste', url: 'https://drive.google.com/file/d/1Z8x_y-1vG4e4rR6S8qX3A2zY1B/preview' },
    { label: 'Vídeo MP4 TC Tórax & Janela Pulmonar', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    { label: 'Vídeo MP4 Angiotomografia & Contraste', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
    { label: 'Vídeo MP4 Reconstruções MPR & 3D', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { label: 'YouTube: Aula TC Avançada', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
  ];

  const handleAddMarker = () => {
    if (!newMarkerLabel.trim()) return;
    const timeSec = parseTimeStringToSeconds(newMarkerTime);
    const updatedMarkers = [...markers, { timeSeconds: timeSec, label: newMarkerLabel.trim() }]
      .sort((a, b) => a.timeSeconds - b.timeSeconds);
    setMarkers(updatedMarkers);
    setNewMarkerLabel('');
  };

  const handleRemoveMarker = (index: number) => {
    setMarkers(markers.filter((_, i) => i !== index));
  };

  const handleSaveVideoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Lesson = {
      ...currentLesson,
      courseId: targetCourseId,
      title,
      description,
      durationMinutes: Number(durationMinutes) || 45,
      videoUrl,
      ctWindowType,
      markers
    };
    onSaveLesson(updated);
    setUploadSuccessMsg('✓ Alterações da aula salvas com sucesso!');
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  const handleCreateNewLesson = () => {
    const nextChapter = courseLessons.length + 1;
    const currentCourse = courses.find(c => c.id === targetCourseId);
    const newLesson: Lesson = {
      id: `les_${Date.now()}`,
      courseId: targetCourseId,
      chapterNumber: nextChapter,
      title: `Capítulo 0${nextChapter}: Fundamentos e Protocolos • ${currentCourse?.title || 'Radiologia'}`,
      description: 'Aula com foco em aquisição tomográfica, reconstruções axiais/coronais e análise diagnóstica.',
      durationMinutes: 45,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      videoSource: 'direct_mp4',
      isCompleted: false,
      ctWindowType: 'pulmonary',
      markers: [
        { timeSeconds: 60, label: 'Introdução e Posicionamento' },
        { timeSeconds: 600, label: 'Aquisição de Volumetria' },
        { timeSeconds: 1500, label: 'Análise de Casos Clínicos' }
      ],
      resources: [],
      quizQuestions: []
    };
    onAddNewLesson(newLesson);
    handleSelectLesson(newLesson.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResourceTitle(file.name.replace(/\.[^/.]+$/, ''));
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setResourceSize(`${sizeMb} MB`);
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setResourceType('pdf');
      else if (ext === 'dcm' || ext === 'zip') setResourceType('case_study');
      else if (ext === 'xls' || ext === 'xlsx') setResourceType('spreadsheet');
      else setResourceType('protocol');

      // Create a local blob URL for instant preview/download
      const objectUrl = URL.createObjectURL(file);
      setResourceUrl(objectUrl);
      setResourceDesc(`Arquivo anexado: ${file.name} (${sizeMb} MB)`);
    }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim()) return;
    const newRes: LessonResource = {
      id: `res_${Date.now()}`,
      lessonId: currentLesson.id,
      title: resourceTitle.trim(),
      description: resourceDesc.trim() || 'Material complementar anexado exclusivamente para este curso.',
      type: resourceType,
      fileSize: resourceSize,
      url: resourceUrl || undefined,
      dateAdded: 'Hoje',
      authorName: 'Prof. Dr. Marcus Vinicius',
      previewContent: resourcePreview.trim() || `# ${resourceTitle}\n\nMaterial oficial disponibilizado pelo corpo docente do curso.\nContém diretrizes clínicas, tabelas de dosimetria e parâmetros para reconstrução tomográfica.`
    };

    const updated: Lesson = {
      ...currentLesson,
      resources: [...(currentLesson.resources || []), newRes]
    };

    onSaveLesson(updated);
    setResourceTitle('');
    setResourceDesc('');
    setResourceUrl('');
    setResourcePreview('');
    setUploadSuccessMsg('✓ Novo material didático anexado à aula!');
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  const handleRemoveResource = (resourceId: string) => {
    const updated: Lesson = {
      ...currentLesson,
      resources: (currentLesson.resources || []).filter(r => r.id !== resourceId)
    };
    onSaveLesson(updated);
  };

  const handleAddQuizQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizQuestion.trim() || quizOptions.some(o => !o.trim())) return;

    const newQ: LessonQuizQuestion = {
      id: `quiz_${Date.now()}`,
      lessonId: currentLesson.id,
      question: quizQuestion.trim(),
      options: quizOptions.map(o => o.trim()),
      correctAnswerIndex: quizCorrectIdx,
      explanation: quizExplanation.trim() || 'Explicação pedagógica elaborada pelo professor titular.'
    };

    const updated: Lesson = {
      ...currentLesson,
      quizQuestions: [...(currentLesson.quizQuestions || []), newQ]
    };

    onSaveLesson(updated);
    setQuizQuestion('');
    setQuizOptions(['', '', '', '']);
    setQuizExplanation('');
    setUploadSuccessMsg('✓ Questão de fixação adicionada!');
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  const handleRemoveQuizQuestion = (qId: string) => {
    const updated: Lesson = {
      ...currentLesson,
      quizQuestions: (currentLesson.quizQuestions || []).filter(q => q.id !== qId)
    };
    onSaveLesson(updated);
  };

  const parsedVideo = parseVideoUrl(videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`max-w-4xl w-full max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
        isDark ? 'bg-[#181b25] border-[#4cd7f6]/40 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'border-white/10 bg-[#141f38]/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <span className="material-symbols-outlined text-2xl">video_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-500 font-bold">
                  Biorad Cursos • Studio do Professor
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Gestão de Aulas &amp; Materiais
                </span>
              </div>
              <h2 className="text-lg font-bold font-['Plus_Jakarta_Sans']">
                Upload de Vídeos &amp; Anexos por Curso
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewLesson}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
              <span>Adicionar Nova Aula</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Course & Lesson Target Selector */}
        <div className={`px-5 py-3 border-b space-y-2.5 ${
          isDark ? 'bg-[#0e111a] border-white/10' : 'bg-slate-100 border-slate-200'
        }`}>
          {/* Target Course Dropdown */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>
              Curso Alvo:
            </span>
            <select
              value={targetCourseId}
              onChange={e => setTargetCourseId(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#181b25] border-cyan-500/40 text-white focus:border-cyan-400'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 shadow-sm'
              }`}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code ? `[${c.code}] ` : ''}{c.title}
                </option>
              ))}
            </select>

            <span className="text-[11px] text-gray-400 font-mono">
              ({courseLessons.length} {courseLessons.length === 1 ? 'aula cadastrada' : 'aulas cadastradas'})
            </span>
          </div>

          {/* Lesson Selector horizontal strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className={`font-semibold shrink-0 text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Aulas deste Curso:
            </span>
            {courseLessons.length === 0 ? (
              <span className="text-amber-400 text-xs italic">
                Nenhuma aula cadastrada ainda neste curso. Clique em "+ Adicionar Nova Aula" acima.
              </span>
            ) : (
              courseLessons.map(les => (
                <button
                  key={les.id}
                  type="button"
                  onClick={() => handleSelectLesson(les.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                    les.id === currentLesson.id
                      ? isDark
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold shadow-sm'
                        : 'bg-cyan-700 text-white font-bold shadow-sm'
                      : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  Cap. {les.chapterNumber}: {les.title.slice(0, 24)}...
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-5 pt-3 border-b flex items-center gap-6 text-xs ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`pb-3 font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'text-cyan-500 border-b-2 border-cyan-500 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">play_circle</span>
            <span>Vídeo da Aula &amp; Capítulos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`pb-3 font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'resources'
                ? 'text-cyan-500 border-b-2 border-cyan-500 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">folder_open</span>
            <span>Materiais &amp; Anexos do Curso ({currentLesson.resources?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`pb-3 font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'text-cyan-500 border-b-2 border-cyan-500 font-bold'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">quiz</span>
            <span>Perguntas de Fixação ({currentLesson.quizQuestions?.length || 0})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {uploadSuccessMsg && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: VIDEO CONFIGURATION */}
          {activeTab === 'video' && (
            <form onSubmit={handleSaveVideoSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Título da Aula:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                    placeholder="Ex: Capítulo 01: Janelamento Pulmonar em TC Multislice"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Duração (minutos):</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Janela TC / HU:</label>
                    <select
                      value={ctWindowType}
                      onChange={e => setCtWindowType(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="pulmonary">Pulmonar (WW 1500 / WL -600)</option>
                      <option value="mediastinum">Mediastino (WW 350 / WL 40)</option>
                      <option value="bone">Óssea (WW 2000 / WL 400)</option>
                      <option value="brain">Craniana (WW 80 / WL 35)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Descrição e Objetivos de Aprendizagem:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Descreva os tópicos abordados nesta aula..."
                />
              </div>

              {/* Video URL & Presets */}
              <div className="space-y-2 p-4 rounded-2xl border bg-black/20 border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">link</span>
                    <span>Link do Vídeo (MP4, YouTube, Vimeo, Google Drive, Loom, Cloudflare):</span>
                  </label>
                  <span className="text-[10px] font-mono text-gray-400">
                    Formato: {parsedVideo.type.toUpperCase()}
                  </span>
                </div>

                <input
                  type="text"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none border ${
                    isDark ? 'bg-[#0a0e17] border-cyan-500/40 text-[#4cd7f6]' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Cole aqui o link do Google Drive (ex: https://drive.google.com/file/d/ID/view?usp=sharing) ou MP4/YouTube..."
                />

                {/* Google Drive Helper Box */}
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2 text-[11px] text-cyan-300">
                  <span className="material-symbols-outlined text-base shrink-0 text-cyan-400 mt-0.5">info</span>
                  <div className="space-y-0.5">
                    <p className="font-bold">Como vincular vídeos hospedados no Google Drive:</p>
                    <p className="text-gray-300 text-[10px] leading-relaxed">
                      1. No seu Google Drive, clique com o botão direito no vídeo e escolha <strong>Compartilhar</strong>.<br />
                      2. Em Acesso Geral, selecione <strong>"Qualquer pessoa com o link"</strong> (Leitor).<br />
                      3. Copie o link e cole diretamente no campo acima. O sistema converte automaticamente para streaming em alta resolução!
                    </p>
                  </div>
                </div>

                {/* Video Presets */}
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1.5">
                    Vídeos de Demonstração (Clique para aplicar):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {videoPresets.map((vp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVideoUrl(vp.url)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 border border-white/10 cursor-pointer"
                      >
                        {vp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chapter Markers */}
              <div className="space-y-2 p-4 rounded-2xl border bg-black/20 border-white/10">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">timer</span>
                  <span>Marcadores de Capítulos (Timestamps Interativos):</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMarkerTime}
                    onChange={e => setNewMarkerTime(e.target.value)}
                    className={`w-24 px-3 py-2 rounded-xl text-xs font-mono outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                    }`}
                    placeholder="05:30"
                  />
                  <input
                    type="text"
                    value={newMarkerLabel}
                    onChange={e => setNewMarkerLabel(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                    }`}
                    placeholder="Ex: Início do Protocolo de Contraste Arterial"
                  />
                  <button
                    type="button"
                    onClick={handleAddMarker}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5 mt-2">
                  {markers.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#0a0e17]/80 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px]">
                          {formatDuration(m.timeSeconds)}
                        </span>
                        <span className="text-gray-300">{m.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMarker(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                {onDeleteLesson && courseLessons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Deseja realmente excluir a aula "${currentLesson.title}"?`)) {
                        onDeleteLesson(currentLesson.id);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                  >
                    Excluir esta Aula
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Salvar Configurações do Vídeo
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: RESOURCES & DOWNLOADABLES SPECIFIC TO THIS COURSE/LESSON */}
          {activeTab === 'resources' && (
            <div className="space-y-5">
              {/* Form to attach new resource */}
              <form onSubmit={handleAddResource} className="p-4 rounded-2xl border bg-black/20 border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">upload_file</span>
                    <span>Anexar Novo Arquivo / Material para este Curso:</span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Vinculado a: Cap. {currentLesson.chapterNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">Título do Material:</label>
                    <input
                      type="text"
                      value={resourceTitle}
                      onChange={e => setResourceTitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                      }`}
                      placeholder="Ex: Protocolo Completo de Angiotomografia Coronariana PDF"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Tipo de Documento:</label>
                    <select
                      value={resourceType}
                      onChange={e => setResourceType(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                      }`}
                    >
                      <option value="pdf">Apostila / Guia PDF</option>
                      <option value="protocol">Protocolo Técnico de Exame</option>
                      <option value="case_study">Casos Clínicos &amp; DICOM (.dcm)</option>
                      <option value="article">Artigo Científico / Diretriz</option>
                      <option value="spreadsheet">Planilha de Dosimetria</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Tamanho Estimado:</label>
                    <input
                      type="text"
                      value={resourceSize}
                      onChange={e => setResourceSize(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                      }`}
                      placeholder="Ex: 8.4 MB"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Upload de Arquivo Local:</label>
                    <label className="w-full px-3 py-2 rounded-xl text-xs border border-dashed border-cyan-400/40 hover:border-cyan-400 flex items-center justify-center gap-2 cursor-pointer bg-cyan-500/10 text-cyan-300 transition-all text-center">
                      <span className="material-symbols-outlined text-base">cloud_upload</span>
                      <span>Selecionar Arquivo do Computador</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Link Externo / URL de Download (Opcional):</label>
                  <input
                    type="text"
                    value={resourceUrl}
                    onChange={e => setResourceUrl(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                    }`}
                    placeholder="https://drive.google.com/... ou https://seuservidor.com/arquivo.pdf"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Resumo / Conteúdo de Pré-visualização:</label>
                  <textarea
                    rows={3}
                    value={resourcePreview}
                    onChange={e => setResourcePreview(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border font-mono ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                    }`}
                    placeholder="Conteúdo textual, notas clínicas ou pontos-chave que aparecem no leitor do aluno..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Salvar e Anexar Material Didático
                </button>
              </form>

              {/* List of current attached resources */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Materiais Anexados a esta Aula ({currentLesson.resources?.length || 0}):
                </h4>
                {(!currentLesson.resources || currentLesson.resources.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center border border-dashed rounded-2xl border-white/10">
                    Nenhum material didático anexado a esta aula ainda. Use o formulário acima para enviar apostilas, protocolos ou casos DICOM.
                  </p>
                ) : (
                  currentLesson.resources.map(res => (
                    <div
                      key={res.id}
                      className="p-3 rounded-2xl bg-[#0a0e17]/80 border border-white/10 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-lg">
                            {res.type === 'pdf' ? 'picture_as_pdf' : res.type === 'protocol' ? 'assignment' : 'biotech'}
                          </span>
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-white truncate">{res.title}</div>
                          <div className="text-[10px] text-gray-400 font-mono truncate">
                            {res.fileSize || '3.2 MB'} • {res.type.toUpperCase()} • Postado por {res.authorName || 'Corpo Docente'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveResource(res.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ & KNOWLEDGE CHECK */}
          {activeTab === 'quiz' && (
            <div className="space-y-5">
              <form onSubmit={handleAddQuizQuestion} className="p-4 rounded-2xl border bg-black/20 border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">quiz</span>
                  <span>Nova Pergunta de Fixação:</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Enunciado da Questão:</label>
                  <input
                    type="text"
                    value={quizQuestion}
                    onChange={e => setQuizQuestion(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                    }`}
                    placeholder="Ex: Qual o valor médio de atenuação Hounsfield (HU) do sangue coagulado?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Alternativas (Marque a correta):</label>
                  {quizOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={quizCorrectIdx === i}
                        onChange={() => setQuizCorrectIdx(i)}
                        className="accent-cyan-500 w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const updated = [...quizOptions];
                          updated[i] = e.target.value;
                          setQuizOptions(updated);
                        }}
                        className={`flex-1 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                        }`}
                        placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Explicação / Justificativa Pedagógica:</label>
                  <input
                    type="text"
                    value={quizExplanation}
                    onChange={e => setQuizExplanation(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-white border-slate-300'
                    }`}
                    placeholder="Ex: O sangue coagulado apresenta densidade elevada entre +55 e +75 HU..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Adicionar Pergunta ao Questionário
                </button>
              </form>

              {/* List of quiz questions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Perguntas Cadastradas ({currentLesson.quizQuestions?.length || 0}):
                </h4>
                {(!currentLesson.quizQuestions || currentLesson.quizQuestions.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 text-center border border-dashed rounded-2xl border-white/10">
                    Nenhuma pergunta cadastrada para esta aula.
                  </p>
                ) : (
                  currentLesson.quizQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl bg-[#0a0e17]/80 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{q.question}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuizQuestion(q.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded-lg border text-[11px] ${
                              oIdx === q.correctAnswerIndex
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-white/5 border-white/5 text-gray-400'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}) {opt} {oIdx === q.correctAnswerIndex && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
