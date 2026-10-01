export type UserRole = 'student' | 'professor' | 'admin';

export type Language = 'pt' | 'en' | 'es';

export type ThemeMode = 'dark' | 'light';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  enrollmentId: string;
  specialty: string;
  gpa: number;
  completedHours: number;
  totalRequiredHours: number;
  attendanceRate: number;
  status: 'regular' | 'warning' | 'honor' | 'expired';
  password?: string; // Stored securely in client storage for portal login
  cpf?: string;
  phone?: string;
  courseName?: string;
  shift?: string;
  createdAt?: string;
  enrolledAt?: string;
  expiresAt?: string;
  accessPeriodDays?: number;
  isAccessExpired?: boolean;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
  loginTimestamp?: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  instructor: string;
  instructorTitle: string;
  instructorAvatar?: string;
  category:
    | 'Radioproteção'
    | 'Tomografia Computadorizada'
    | 'Reconstruções 3D Avançadas'
    | 'Exames Contrastados'
    | 'Centro Cirúrgico'
    | 'Ressonância Magnética'
    | 'Radiologia Geral'
    | 'Medicina Nuclear'
    | string;
  progress: number;
  currentModule: number;
  totalModules: number;
  grade: number;
  status: 'active' | 'completed' | 'upcoming';
  nextDeadline?: string;
  nextDeliveryTitle?: string;
  coverImage?: string;
  price?: number;
  enrolledAt?: string;
  expiresAt?: string;
  accessPeriodDays?: number;
}

export interface LessonResource {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  type: 'pdf' | 'protocol' | 'case_study' | 'article' | 'podcast' | 'spreadsheet';
  fileSize?: string;
  url?: string;
  dateAdded: string;
  authorName?: string;
  previewContent?: string;
}

export interface LessonQuizQuestion {
  id: string;
  lessonId: string;
  title?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LessonNote {
  id: string;
  lessonId: string;
  timeSeconds: number;
  content: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  chapterNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  videoSource?: 'youtube' | 'vimeo' | 'direct_mp4' | 'live';
  thumbnailUrl?: string;
  isCompleted: boolean;
  testScore?: number;
  currentPlaybackPercent?: number;
  markers: { timeSeconds: number; label: string }[];
  ctWindowType?: 'pulmonary' | 'bone' | 'mediastinum' | 'brain';
  resources?: LessonResource[];
  quizQuestions?: LessonQuizQuestion[];
  studentNotes?: LessonNote[];
}

export interface TaskPendency {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  type: 'relatorio' | 'laudo_tc' | 'slides' | 'prova' | 'estagio';
  deadlineDate: string;
  daysRemaining: number;
  format: string;
  status: 'pending' | 'submitted' | 'reviewed';
  score?: number;
  submittedFile?: string;
}

export interface StudentGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  enrollmentId: string;
  attendance: number;
  gradeN1: number;
  gradeN2: number;
  gradePractice: number;
  calculatedAverage: number;
  feedback?: string;
  status: 'approved' | 'review' | 'risk';
}

export interface RecentGradeItem {
  id: string;
  title: string;
  course: string;
  instructor: string;
  grade: number;
  statusText: string;
  date: string;
}

export interface Certificate {
  id: string;
  code: string;
  studentName: string;
  studentDocument: string;
  courseName: string;
  courseId?: string;
  workloadHours: number;
  completionDate: string;
  completionPercentage?: number; // Must be 100%
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  instructorName: string;
  instructorRole: string;
  finalScore: number;
  sha256Hash: string;
  qrValidationUrl: string;
  mecLdbCompliance?: string;
  authenticatedBy?: string;
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  type: 'grade_published' | 'deadline_warning' | 'certificate_issued' | 'payment_confirmed';
  timestamp: string;
  isRead: boolean;
  status: 'sent' | 'delivered';
  transactionCode?: string;
  courseTitle?: string;
  expiresAt?: string;
}

export interface PaymentPlan {
  id: string;
  courseId: string;
  title: string;
  price: number;
  installments: number;
  features: string[];
  isPopular?: boolean;
}

export interface CursoLivreModule {
  id: string;
  moduleNumber: number;
  title: string;
  workloadHours: number; // e.g. 10h per module
  description: string;
  topics: string[];
  hasSimulatorPractice?: boolean;
  simulatorProtocolName?: string;
  hasDicomViewer?: boolean;
}

export interface CursoLivre {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  category:
    | 'Radioproteção'
    | 'Tomografia Computadorizada'
    | 'Reconstruções 3D Avançadas'
    | 'Exames Contrastados'
    | 'Centro Cirúrgico'
    | string;
  workloadHours: number; // 40h standard
  price: number;
  originalPrice: number;
  installments: number;
  rating: number;
  reviewCount: number;
  enrolledStudentsCount: number;
  instructor: string;
  instructorTitle: string;
  instructorAvatar: string;
  coverImage: string;
  description: string;
  targetAudience: string;
  objectives: string[];
  legalCompliance: string; // MEC / Lei 9.394/96
  modules: CursoLivreModule[];
  isEnrolled?: boolean;
  progressPercent?: number;
  hasActivionSimulator: boolean;
  hasRealDicomCases: boolean;
  featured?: boolean;
  enrolledAt?: string;
  expiresAt?: string;
  accessPeriodDays?: number;
}

export interface PaymentTransaction {
  id: string;
  transactionCode: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentEmail: string;
  studentCpf?: string;
  amount: number;
  paymentMethod: 'pix' | 'credit';
  installments?: number;
  cardBrand?: string;
  cardLast4?: string;
  pixQrCodeString?: string;
  pixEndToEndId?: string;
  status: 'pending' | 'approved' | 'completed';
  createdAt: string;
  paidAt?: string;
  certificateWorkloadHours: number; // 40h
  accessPeriodDays?: number; // 60 days standard
  expiresAt?: string;
  enrolledAt?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSync?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isActive: boolean;
  providerPreset?: 'gmail' | 'sendgrid' | 'ses' | 'mailgun' | 'custom';
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'idle';
  lastTestMessage?: string;
}

export interface AuditLog {
  id: string;
  action: 'login' | 'logout' | 'lesson_completed' | 'certificate_issued' | 'task_submitted' | 'payment_processed' | 'user_created' | 'course_updated';
  actionTitle: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  ipAddress?: string;
  device?: string;
  timestamp: string;
  dateIso: string;
  targetResource?: string;
  status: 'success' | 'warning' | 'info' | 'error';
  metadata?: Record<string, any>;
}

