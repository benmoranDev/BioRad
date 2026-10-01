import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lesson, LessonResource, LessonNote, ThemeMode, User, Course } from '../../types';
import { storageService } from '../../services/storage';
import { parseVideoUrl, formatDuration } from '../../utils/videoHelper';
import { InstructorContentModal } from './InstructorContentModal';
import { ResourceViewerModal } from './ResourceViewerModal';
import { ClassroomSkeleton } from '../skeletons/ClassroomSkeleton';
import { checkUserAccessValidity } from '../../utils/accessControl';

interface ClassroomViewProps {
  lessons: Lesson[];
  courses?: Course[];
  onOpenSimulator: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  activeLesson: Lesson;
  currentUser?: User;
  onNavigateTab?: (tab: string) => void;
  onIssueCertificate?: (courseTitle?: string, hours?: number, targetCourseId?: string) => void;
  theme?: ThemeMode;
  isLoading?: boolean;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  lessons,
  courses = [],
  onOpenSimulator,
  onSelectLesson,
  activeLesson,
  currentUser,
  onNavigateTab,
  onIssueCertificate,
  theme = 'dark',
  isLoading = false
}) => {
  if (isLoading) {
    return <ClassroomSkeleton theme={theme} />;
  }

  const isDark = theme === 'dark';
  const isTeacherOrAdmin = currentUser?.role === 'professor' || currentUser?.role === 'admin';
  const accessValidity = checkUserAccessValidity(currentUser);

  // Block lessons access if student's 2-month period is expired
  if (currentUser?.role === 'student' && accessValidity.isExpired) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in my-6">
        <div className={`p-8 sm:p-12 rounded-[36px] border text-center space-y-6 shadow-2xl backdrop-blur-2xl ${
          isDark ? 'bg-[#141b2e]/90 border-red-500/40 text-white' : 'bg-white border-red-300 text-slate-900 shadow-xl'
        }`}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 shadow-xl shadow-red-500/20">
            <span className="material-symbols-outlined text-4xl">lock_clock</span>
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
              Período de Acesso Expirado (2 Meses)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Plus_Jakarta_Sans']">
              Acesso às Aulas Bloqueado
            </h1>
            <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              O seu período de <strong>60 dias (2 meses)</strong> contratado para acesso à sala de aula virtual e ao simulador Canon Activion 16 encerrou em <strong>{accessValidity.expiresAtFormatted}</strong>.
            </p>
          </div>

          {/* Expiration Details Card */}
          <div className={`p-5 rounded-2xl border text-left max-w-md mx-auto text-xs space-y-2.5 font-mono ${
            isDark ? 'bg-[#0b101c] border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center border-b pb-2 border-white/10">
              <span className="text-gray-400">STATUS DA MATRÍCULA:</span>
              <span className="text-red-400 font-bold uppercase">Expirada</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2 border-white/10">
              <span className="text-gray-400">DATA DE EXPIRAÇÃO:</span>
              <span className="text-amber-400 font-bold">{accessValidity.expiresAtFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">RENOVAÇÃO DO CURSO:</span>
              <span className="text-cyan-400 font-bold">PIX / Cartão Liberado</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.('pagamentos')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-red-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">cached</span>
              <span>Renovar Matrícula / Curso</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.('dashboard')}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Course state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return activeLesson.courseId || courses[0]?.id || 'course_tc_701';
  });

  // Filter lessons belonging to active course
  const courseLessons = useMemo(() => {
    const filtered = lessons.filter(l => l.courseId === selectedCourseId);
    if (filtered.length === 0) {
      // If none explicitly matched, return lessons that match activeLesson or general
      return lessons;
    }
    return filtered;
  }, [lessons, selectedCourseId]);

  // Active course object
  const currentCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || {
      id: selectedCourseId,
      code: 'TC-701',
      title: 'Tomografia Computadorizada Clínica & Activion 16',
      description: 'Especialização prática com simulador e protocolos avançados.',
      credits: 40,
      instructor: 'Prof. Dr. Marcus Vinicius',
      instructorTitle: 'Especialista em Tomografia CBR',
      category: 'Tomografia Computadorizada',
      progress: 80,
      currentModule: 4,
      totalModules: 8,
      grade: 9.8,
      status: 'active' as const
    };
  }, [courses, selectedCourseId]);

  // Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(activeLesson.durationMinutes * 60 || 2700);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Tabs & Panels
  const [activeTab, setActiveTab] = useState<'ementa' | 'downloads' | 'notes' | 'quiz'>('ementa');
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'roadmap'>('roadmap');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  // Modals
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [selectedResourceForView, setSelectedResourceForView] = useState<LessonResource | null>(null);

  // Student Notes with Timestamps
  const [noteText, setNoteText] = useState('');
  const [studentNotes, setStudentNotes] = useState<LessonNote[]>(() => activeLesson.studentNotes || []);

  // Quiz State
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(activeLesson.testScore || null);

  // Chat / Dúvidas
  const [chatInput, setChatInput] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'c1',
      sender: 'Lucas Andrade',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      time: '14:15',
      timeOffset: '08:20',
      text: 'Professor, na fase portal da tomografia de abdômen total, qual o tempo de delay ideal após iniciar a injeção do contraste iodado?'
    },
    {
      id: 'c2',
      isTutor: true,
      sender: 'Prof. Dr. Marcus Vinicius',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=100&q=80',
      time: '14:17',
      text: 'Excelente pergunta, Lucas! O tempo de delay preconizado para a fase portal venosa é rigorosamente entre 65 e 75 segundos. Isso garante a opacificação homogênea do parênquima hepático e veia porta.'
    }
  ]);

  // Video parsing
  const parsedVideo = parseVideoUrl(activeLesson.videoUrl);

  // Synchronize when activeLesson changes
  useEffect(() => {
    if (activeLesson.courseId && activeLesson.courseId !== selectedCourseId) {
      setSelectedCourseId(activeLesson.courseId);
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(activeLesson.durationMinutes * 60 || 2700);
    setStudentNotes(activeLesson.studentNotes || []);
    setUserQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(activeLesson.testScore || null);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [activeLesson.id]);

  // When course selector changes
  const handleCourseChange = (newCourseId: string) => {
    setSelectedCourseId(newCourseId);
    const matching = lessons.filter(l => l.courseId === newCourseId);
    if (matching.length > 0) {
      onSelectLesson(matching[0]);
    }
  };

  // Video Event Handlers
  const togglePlayPause = () => {
    if (parsedVideo.type === 'html5' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      if (!isPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    handleSeek(newTime);
  };

  const handleSkip = (delta: number) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + delta));
    handleSeek(nextTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const handleToggleFullscreen = () => {
    const container = document.getElementById('lesson-player-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Lesson Completion Toggle
  const handleToggleComplete = () => {
    const updatedLesson: Lesson = {
      ...activeLesson,
      isCompleted: !activeLesson.isCompleted,
      testScore: !activeLesson.isCompleted ? (activeLesson.testScore || 95) : activeLesson.testScore
    };
    storageService.updateLesson(updatedLesson);
    onSelectLesson(updatedLesson);

    // Recalculate completed count
    const allCourseLessons = lessons.filter(l => l.courseId === activeLesson.courseId || !l.courseId);
    const completed = allCourseLessons.filter(l => l.id === updatedLesson.id ? updatedLesson.isCompleted : l.isCompleted).length;
    if (completed >= allCourseLessons.length && onIssueCertificate) {
      onIssueCertificate(currentCourse.title, currentCourse.credits || 40, currentCourse.id);
    }
  };

  // Navigation between lessons
  const currentIndex = courseLessons.findIndex(l => l.id === activeLesson.id);
  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  // Add Note at Current Timestamp
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote: LessonNote = {
      id: `note_${Date.now()}`,
      lessonId: activeLesson.id,
      timeSeconds: Math.floor(currentTime),
      content: noteText.trim(),
      createdAt: 'Agora'
    };

    const updatedNotes = [newNote, ...studentNotes];
    setStudentNotes(updatedNotes);
    setNoteText('');

    const updatedLesson: Lesson = {
      ...activeLesson,
      studentNotes: updatedNotes
    };
    storageService.updateLesson(updatedLesson);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = studentNotes.filter(n => n.id !== noteId);
    setStudentNotes(updatedNotes);
    const updatedLesson: Lesson = {
      ...activeLesson,
      studentNotes: updatedNotes
    };
    storageService.updateLesson(updatedLesson);
  };

  // Quiz submission
  const handleAnswerSelect = (questionId: string, optionIdx: number) => {
    setUserQuizAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const questions = activeLesson.quizQuestions || [];
    if (questions.length === 0) return;

    let correctCount = 0;
    questions.forEach(q => {
      if (userQuizAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const calculatedPct = Math.round((correctCount / questions.length) * 100);
    setQuizScore(calculatedPct);
    setQuizSubmitted(true);

    const updatedLesson: Lesson = {
      ...activeLesson,
      testScore: calculatedPct,
      isCompleted: calculatedPct >= 70 ? true : activeLesson.isCompleted
    };
    storageService.updateLesson(updatedLesson);
  };

  // Send Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `c_${Date.now()}`,
      sender: currentUser?.name || 'Lucas Mendonça (Aluno)',
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      time: 'Agora',
      timeOffset: formatDuration(currentTime),
      text: chatInput.trim()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  // Resources filtering
  const allResources = activeLesson.resources || [];
  const filteredResources = allResources.filter(res => {
    if (resourceFilter === 'all') return true;
    return res.type === resourceFilter;
  });

  const completedCount = courseLessons.filter(l => l.isCompleted).length;
  const totalCount = courseLessons.length || 1;
  const courseProgressPct = Math.round((completedCount / totalCount) * 100);
  const playbackPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1760px] mx-auto space-y-6">
      {/* 1. COURSE SELECTOR & INSTRUCTOR MANAGEMENT HEADER */}
      <section className={`p-5 sm:p-7 rounded-[36px] border shadow-xl backdrop-blur-2xl transition-all ${
        isDark
          ? 'bg-gradient-to-r from-[#141f38]/90 via-[#18233a] to-[#0f172a] border-cyan-500/30'
          : 'bg-gradient-to-r from-cyan-50/90 via-white to-emerald-50/80 border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Course Selector Dropdown & Info */}
          <div className="flex items-center gap-3.5 flex-wrap min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0 flex items-center justify-center">
              <div className={`w-full h-full rounded-full flex items-center justify-center ${isDark ? 'bg-[#090d16]' : 'bg-white'}`}>
                <span className="material-symbols-outlined text-2xl text-cyan-400">
                  biotech
                </span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-500 font-bold">
                  Biorad Cursos • Sala de Aula Virtual
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                  courseProgressPct >= 100
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {courseProgressPct >= 100 ? '100% Concluído • Certificado Disponível' : `${courseProgressPct}% do Curso Concluído`}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  <span>{currentCourse.expiresAt ? `Acesso até ${currentCourse.expiresAt} (2 Meses)` : 'Acesso por 2 Meses (60 Dias)'}</span>
                </span>
              </div>

              {/* Course Switcher Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                  Curso em Reprodução:
                </span>
                <select
                  value={selectedCourseId}
                  onChange={e => handleCourseChange(e.target.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold outline-none border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#0a0e17] border-cyan-500/50 text-white focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 shadow-sm'
                  }`}
                >
                  {courses.length > 0 ? (
                    courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `[${c.code}] ` : ''}{c.title}
                      </option>
                    ))
                  ) : (
                    <option value="course_tc_701">Tomografia Computadorizada Clínica &amp; Activion 16</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Open Simulator Button */}
            <button
              type="button"
              onClick={onOpenSimulator}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                isDark
                  ? 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-400'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
              }`}
              title="Abrir Simulador Canon Activion 16"
            >
              <span className="material-symbols-outlined text-base">precision_manufacturing</span>
              <span>Simulador TC</span>
            </button>

            {/* Teacher Studio Button */}
            {isTeacherOrAdmin && (
              <button
                type="button"
                onClick={() => setIsInstructorModalOpen(true)}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:opacity-95 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-base">tune</span>
                <span>Gerenciar Vídeos &amp; Anexos</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. MAIN PLAYER & CONTENT GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Video Player & Tabs (8 cols) */}
        <section className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          {/* Interactive Video Player Container */}
          <div
            id="lesson-player-container"
            className="relative rounded-[36px] overflow-hidden bg-[#0a0e17] border border-white/15 shadow-[0_12px_45px_-5px_rgba(0,0,0,0.8)] ring-1 ring-[#4cd7f6]/25 group"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4cd7f6]/60 to-transparent z-20" />

            {/* Video Canvas / Player */}
            <div className="relative w-full aspect-video bg-[#000000] overflow-hidden flex items-center justify-center">
              {/* HTML5 Direct Video */}
              {parsedVideo.type === 'html5' && (
                <video
                  ref={videoRef}
                  src={parsedVideo.originalUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlayPause}
                  className="w-full h-full object-contain cursor-pointer"
                  playsInline
                />
              )}

              {/* Google Drive Video Stream */}
              {parsedVideo.type === 'gdrive' && (
                <iframe
                  src={parsedVideo.embedUrl}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              )}

              {/* YouTube Embed */}
              {parsedVideo.type === 'youtube' && (
                <iframe
                  src={parsedVideo.embedUrl}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}

              {/* Vimeo Embed */}
              {parsedVideo.type === 'vimeo' && (
                <iframe
                  src={parsedVideo.embedUrl}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* Loom Embed */}
              {parsedVideo.type === 'loom' && (
                <iframe
                  src={parsedVideo.embedUrl}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* Cloudflare Stream */}
              {parsedVideo.type === 'cloudflare' && (
                <iframe
                  src={parsedVideo.embedUrl}
                  title={activeLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              )}

              {/* Top HUD */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none z-10">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0e17]/85 backdrop-blur-md border border-white/20 text-[#4cd7f6] text-xs font-semibold shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse shadow-[0_0_8px_#4cd7f6]" />
                  {parsedVideo.type === 'gdrive'
                    ? 'GOOGLE DRIVE • STREAMING 4K'
                    : parsedVideo.type === 'youtube'
                      ? 'YOUTUBE • STREAMING HD'
                      : parsedVideo.type === 'vimeo'
                        ? 'VIMEO • STREAMING'
                        : 'AULA DIGITAL • 4K'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#0a0e17]/85 backdrop-blur-md border border-white/20 text-[#bcc9cd] text-xs font-mono shadow-lg">
                  CAPÍTULO 0{activeLesson.chapterNumber} • {activeLesson.ctWindowType?.toUpperCase() || 'PULMONAR'}
                </span>
              </div>

              {/* Completion badge */}
              {activeLesson.isCompleted && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 font-bold text-xs shadow-lg backdrop-blur-md pointer-events-none">
                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                  <span>Concluída</span>
                </div>
              )}

              {/* Central Play/Pause button for HTML5 video */}
              {parsedVideo.type === 'html5' && (
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className={`absolute w-16 h-16 rounded-full bg-[#4cd7f6]/25 hover:bg-[#4cd7f6]/40 backdrop-blur-md border border-[#4cd7f6]/50 text-[#4cd7f6] flex items-center justify-center transition-all duration-300 shadow-[0_0_35px_rgba(6,182,212,0.5)] cursor-pointer z-10 ${
                    isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100 scale-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              )}

              {/* Floating Player Controls Bar */}
              {parsedVideo.type === 'html5' && (
                <div className="absolute inset-x-3 sm:inset-x-4 bottom-3 sm:bottom-4 p-2.5 sm:p-3 rounded-2xl bg-[#141824]/90 backdrop-blur-xl border border-white/15 shadow-2xl z-20 transition-all duration-300">
                  {/* Timeline with Markers */}
                  <div
                    onClick={handleProgressBarClick}
                    className="relative w-full mb-2.5 sm:mb-3 h-3 flex items-center cursor-pointer group/timeline select-none"
                  >
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#06b6d4] to-[#4cd7f6] shadow-[0_0_12px_#4cd7f6] transition-all"
                        style={{ width: `${playbackPercent}%` }}
                      />
                    </div>

                    {activeLesson.markers?.map((marker, idx) => {
                      const markerPercent = duration > 0 ? (marker.timeSeconds / duration) * 100 : 0;
                      if (markerPercent < 0 || markerPercent > 100) return null;
                      return (
                        <div
                          key={idx}
                          onClick={e => {
                            e.stopPropagation();
                            handleSeek(marker.timeSeconds);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white ring-2 ring-[#06b6d4] hover:scale-150 hover:bg-[#4cd7f6] transition-all cursor-pointer z-10 group/marker"
                          style={{ left: `${markerPercent}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[#0a0e17] text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-lg">
                            {formatDuration(marker.timeSeconds)} - {marker.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className="p-1 rounded-lg text-[#4cd7f6] hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSkip(-10)}
                        className="p-1 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Voltar 10s"
                      >
                        <span className="material-symbols-outlined text-lg">replay_10</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkip(10)}
                        className="p-1 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Avançar 10s"
                      >
                        <span className="material-symbols-outlined text-lg">forward_10</span>
                      </button>

                      {/* Volume */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={handleToggleMute}
                          className="p-1 rounded-lg text-gray-300 hover:text-white cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                          </span>
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>

                      {/* Timers */}
                      <span className="font-mono text-[11px] text-gray-300 ml-2">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Speed */}
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 font-mono text-[10px]">
                        {[1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => handleSpeedChange(speed)}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${
                              playbackSpeed === speed ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>

                      {/* Fullscreen */}
                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="p-1 rounded-lg text-gray-300 hover:text-white cursor-pointer"
                        title="Tela Cheia"
                      >
                        <span className="material-symbols-outlined text-xl">fullscreen</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Title & Quick Controls Bar */}
            <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t ${
              isDark ? 'border-white/10 bg-[#0f1422]' : 'border-slate-200 bg-white'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    Capítulo 0{activeLesson.chapterNumber}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {activeLesson.durationMinutes} minutos de prática clínica
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans'] mt-0.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {activeLesson.title}
                </h2>
              </div>

              {/* Previous / Next / Complete buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {prevLesson && (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(prevLesson)}
                    className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span className="hidden sm:inline">Aula Anterior</span>
                  </button>
                )}

                {/* Mark Completed Button */}
                <button
                  type="button"
                  onClick={handleToggleComplete}
                  className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    activeLesson.isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {activeLesson.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{activeLesson.isCompleted ? 'Concluída' : 'Marcar como Concluída'}</span>
                </button>

                {nextLesson && (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(nextLesson)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <span className="hidden sm:inline">Próxima Aula</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Tabs (Ementa, Downloads, Notes, Quiz) */}
          <div className={`p-6 sm:p-7 rounded-[36px] border shadow-xl backdrop-blur-2xl transition-all ${
            isDark ? 'bg-[#141c2e]/80 border-white/10' : 'bg-white border-slate-200 shadow-slate-200'
          }`}>
            {/* Tabs Row */}
            <div className="flex items-center gap-2 sm:gap-3 border-b border-white/10 pb-4 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ementa')}
                className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'ementa'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">description</span>
                <span>Ementa &amp; Objetivos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('downloads')}
                className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'downloads'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">folder_open</span>
                <span>Material &amp; Anexos ({allResources.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">edit_note</span>
                <span>Minhas Anotações ({studentNotes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'quiz'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">quiz</span>
                <span>Questionário ({activeLesson.quizQuestions?.length || 0})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: EMENTA */}
            {activeTab === 'ementa' && (
              <div className="pt-6 space-y-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <h3 className={`text-base font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Descrição da Aula
                  </h3>
                  <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    {activeLesson.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className={`p-4 rounded-2xl border space-y-1.5 ${
                    isDark ? 'bg-[#0a0e17]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-base">person</span>
                      <span>Corpo Docente Responsável</span>
                    </div>
                    <p className="font-semibold text-sm">{currentCourse.instructor}</p>
                    <p className="text-[11px] text-gray-400">{currentCourse.instructorTitle}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-1.5 ${
                    isDark ? 'bg-[#0a0e17]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-base">science</span>
                      <span>Janelamento Radiológico (Hounsfield)</span>
                    </div>
                    <p className="font-semibold text-sm uppercase">Janela {activeLesson.ctWindowType || 'Pulmonar'}</p>
                    <p className="text-[11px] text-gray-400">Otimizado para análise de densidades anatômicas finas.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: DOWNLOADS & ANEXOS */}
            {activeTab === 'downloads' && (
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className={`text-base font-bold font-['Plus_Jakarta_Sans'] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Materiais &amp; Anexos do Curso
                  </h3>
                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {['all', 'pdf', 'protocol', 'case_study'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setResourceFilter(f)}
                        className={`px-2.5 py-1 rounded-xl cursor-pointer ${
                          resourceFilter === f
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {f === 'all' ? 'Todos' : f === 'pdf' ? 'PDFs' : f === 'protocol' ? 'Protocolos' : 'Casos TC'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredResources.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-3xl border-white/15 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-gray-400">folder_off</span>
                    <p className="text-xs text-gray-400">
                      Nenhum arquivo anexado para este filtro. O professor pode anexar PDFs e protocolos específicos a qualquer momento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredResources.map(res => (
                      <div
                        key={res.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                          isDark ? 'bg-[#0a0e17]/70 border-white/10 hover:border-cyan-400/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">
                              {res.type === 'pdf' ? 'picture_as_pdf' : res.type === 'protocol' ? 'assignment' : 'biotech'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs truncate leading-snug">{res.title}</h4>
                            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{res.description}</p>
                            <span className="inline-block mt-1 text-[10px] font-mono text-cyan-400">
                              {res.fileSize || '4.2 MB'} • {res.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setSelectedResourceForView(res)}
                            className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                              isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Ler Online</span>
                          </button>

                          <a
                            href={res.url || '#'}
                            download={res.title}
                            onClick={e => {
                              if (!res.url) {
                                e.preventDefault();
                                setSelectedResourceForView(res);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Baixar</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: ANOTAÇÕES */}
            {activeTab === 'notes' && (
              <div className="pt-6 space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-400">
                      Nova Anotação Sincronizada com o Vídeo:
                    </label>
                    <span className="text-[11px] font-mono text-gray-400">
                      Timestamp: {formatDuration(currentTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder={`Escreva sua nota sobre o minuto ${formatDuration(currentTime)}...`}
                      className={`flex-1 px-4 py-2.5 rounded-2xl text-xs outline-none border ${
                        isDark ? 'bg-[#0a0e17] border-white/10 text-white focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                    >
                      Salvar Nota
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-2">
                  {studentNotes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center p-4">
                      Você ainda não salvou anotações para esta aula. Digite acima para registrar pontos importantes.
                    </p>
                  ) : (
                    studentNotes.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs gap-3 ${
                          isDark ? 'bg-[#0a0e17]/80 border-white/10' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleSeek(n.timeSeconds)}
                            className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] cursor-pointer hover:bg-cyan-500/30"
                            title="Pular para este segundo no vídeo"
                          >
                            ▶ {formatDuration(n.timeSeconds)}
                          </button>
                          <span className="text-gray-200">{n.content}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: QUIZ */}
            {activeTab === 'quiz' && (
              <div className="pt-6 space-y-4">
                {(!activeLesson.quizQuestions || activeLesson.quizQuestions.length === 0) ? (
                  <p className="text-xs text-gray-400 italic text-center p-6 border border-dashed rounded-2xl border-white/10">
                    Nenhum questionário anexado para este capítulo.
                  </p>
                ) : (
                  <form onSubmit={handleSubmitQuiz} className="space-y-4">
                    {activeLesson.quizQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border space-y-3 ${
                          isDark ? 'bg-[#0a0e17]/80 border-white/10' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs">
                            {idx + 1}
                          </span>
                          <span>{q.question}</span>
                        </div>

                        <div className="space-y-1.5 pl-8">
                          {q.options.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                                userQuizAnswers[q.id] === oIdx
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                                  : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${q.id}`}
                                checked={userQuizAnswers[q.id] === oIdx}
                                onChange={() => handleAnswerSelect(q.id, oIdx)}
                                className="accent-cyan-500"
                              />
                              <span>{String.fromCharCode(65 + oIdx)}) {opt}</span>
                            </label>
                          ))}
                        </div>

                        {quizSubmitted && (
                          <div className={`p-2.5 rounded-xl text-xs font-mono pl-8 ${
                            userQuizAnswers[q.id] === q.correctAnswerIndex
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            <strong>{userQuizAnswers[q.id] === q.correctAnswerIndex ? '✓ Correto!' : '✕ Incorreto.'}</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                      {quizScore !== null && (
                        <div className="text-xs font-bold font-mono text-emerald-400">
                          Pontuação Obtida: {quizScore}% {quizScore >= 70 ? '• Aprovado com Louvor' : '• Tente Novamente'}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                      >
                        Enviar Respostas para Correção
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Roadmap & Chat (4 cols) */}
        <section className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* Roadmap & Chat Container */}
          <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-2xl flex flex-col flex-1 ${
            isDark ? 'bg-[#141c2e]/80 border-white/10' : 'bg-white border-slate-200 shadow-slate-200'
          }`}>
            {/* Panel Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setRightPanelTab('roadmap')}
                className={`flex-1 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelTab === 'roadmap'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">format_list_numbered</span>
                <span>Roteiro do Curso ({courseLessons.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('chat')}
                className={`flex-1 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelTab === 'chat'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' : 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">forum</span>
                <span>Dúvidas &amp; Chat</span>
              </button>
            </div>

            {/* ROADMAP PANEL */}
            {rightPanelTab === 'roadmap' && (
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[640px] pr-1">
                {courseLessons.map(les => {
                  const isCurrent = les.id === activeLesson.id;
                  return (
                    <div
                      key={les.id}
                      onClick={() => onSelectLesson(les)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isCurrent
                          ? isDark
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                            : 'bg-cyan-50 border-cyan-400 text-slate-900 shadow-sm'
                          : isDark
                            ? 'bg-[#0a0e17]/60 border-white/5 text-gray-300 hover:bg-white/5'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          les.isCompleted
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : isCurrent
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-white/10 text-gray-400'
                        }`}>
                          {les.isCompleted ? '✓' : `0${les.chapterNumber}`}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-xs leading-snug line-clamp-2">{les.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-400">
                            <span>{les.durationMinutes} min</span>
                            <span>•</span>
                            <span>{les.resources?.length || 0} materiais</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-400 text-slate-950">
                            Assistindo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CHAT PANEL */}
            {rightPanelTab === 'chat' && (
              <div className="flex flex-col flex-1 h-full min-h-[480px]">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[460px]">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1 ${
                        msg.isTutor
                          ? isDark ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-emerald-50 border-emerald-200'
                          : isDark ? 'bg-[#0a0e17]/80 border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${msg.isTutor ? 'text-emerald-400' : 'text-cyan-400'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{msg.time}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="pt-3 border-t border-white/10 mt-auto flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Envie sua dúvida ao professor..."
                    className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-[#0a0e17] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MODALS */}
      <InstructorContentModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        lessons={lessons}
        courses={courses}
        activeLesson={activeLesson}
        selectedCourseId={selectedCourseId}
        onSaveLesson={updated => {
          storageService.updateLesson(updated);
          if (updated.id === activeLesson.id) {
            onSelectLesson(updated);
          }
        }}
        onAddNewLesson={newLes => {
          storageService.addLesson(newLes);
          onSelectLesson(newLes);
        }}
        onDeleteLesson={lesId => {
          storageService.deleteLesson(lesId);
        }}
        theme={theme}
      />

      <ResourceViewerModal
        isOpen={!!selectedResourceForView}
        onClose={() => setSelectedResourceForView(null)}
        resource={selectedResourceForView}
        theme={theme}
      />
    </div>
  );
};
