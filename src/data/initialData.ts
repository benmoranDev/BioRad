import { User, Course, Lesson, TaskPendency, StudentGradeRecord, RecentGradeItem, Certificate, EmailNotification, PaymentPlan, SupabaseConfig } from '../types';

export const adminUserBen: User = {
  id: 'usr_admin_ben',
  name: 'Ben Moran',
  email: 'benmoran29dev@gmail.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  enrollmentId: 'ADM-BEN-2026',
  specialty: 'Administrador Geral do Sistema & Diretor de Tecnologia Biorad Cursos',
  gpa: 4.0,
  completedHours: 500,
  totalRequiredHours: 500,
  attendanceRate: 100,
  status: 'honor',
  password: '123'
};

export const studentLucas: User = {
  id: 'usr_student_01',
  name: 'Lucas Mendonça',
  email: 'lucas.mendonca@radbio.edu.br',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  enrollmentId: '2025-RAD-8841',
  specialty: 'Tecnólogo em Radiologia & Tomografia Computadorizada',
  courseName: 'Tecnólogo em Radiologia & Tomografia Computadorizada',
  shift: 'EAD 100% Online Flexível',
  cpf: '049.882.109-44',
  phone: '(11) 98765-4321',
  gpa: 3.92,
  completedHours: 142,
  totalRequiredHours: 180,
  attendanceRate: 94,
  status: 'regular',
  password: '123'
};

export const initialCurrentUser: User = adminUserBen;

export const demoAccounts: User[] = [
  adminUserBen,
  studentLucas,
  {
    id: 'usr_prof_01',
    name: 'Prof. Dr. Marcus Vinicius',
    email: 'marcus.vinicius@radbio.edu.br',
    role: 'professor',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    enrollmentId: 'DOC-TC-09',
    specialty: 'Especialista em Tomografia Computadorizada CBR',
    gpa: 4.0,
    completedHours: 320,
    totalRequiredHours: 320,
    attendanceRate: 99,
    status: 'honor',
    password: '123'
  },
  {
    id: 'usr_admin_01',
    name: 'Dra. Helena Vasconcelos',
    email: 'helena.vasconcelos@radbio.edu.br',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    enrollmentId: 'ADM-01',
    specialty: 'Coordenação Acadêmica Geral',
    gpa: 4.0,
    completedHours: 400,
    totalRequiredHours: 400,
    attendanceRate: 100,
    status: 'honor',
    password: '123'
  }
];

export const initialCourses: Course[] = [
  {
    id: 'course_tc_701',
    code: 'RAD-701',
    title: 'Tomografia Computadorizada Avançada & Protocolos Multislice',
    description: 'Aquisição helicoidal multidetectores (64 a 320 canais), janelamento (Hounsfield Units), angiotomografia e contraste iodado não iônico.',
    credits: 4,
    instructor: 'Prof. Dr. Aris Thorne',
    instructorTitle: 'Médico Radiologista & Físico das Radiações (CBR/CRTR)',
    instructorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    category: 'Tomografia Computadorizada',
    progress: 78,
    currentModule: 6,
    totalModules: 8,
    grade: 9.2,
    status: 'active',
    nextDeadline: '28/Fev',
    nextDeliveryTitle: 'Trabalho de TC de Tórax: Detecção de Nódulos e Enfisema',
    coverImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    price: 489.00
  },
  {
    id: 'course_rm_802',
    code: 'RAD-802',
    title: 'Ressonância Magnética & Neuroimagem Estrutural',
    description: 'Sequências T1, T2, FLAIR, DWI difusão e espectroscopia. Identificação de isquemia precoce, patologias da substância branca e artefatos de suscetibilidade.',
    credits: 3,
    instructor: 'Prof. Dr. Carlos Vane',
    instructorTitle: 'Especialista em Neuro-Radiologia Diagnóstica',
    instructorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=250&q=80',
    category: 'Ressonância Magnética',
    progress: 66,
    currentModule: 8,
    totalModules: 12,
    grade: 8.7,
    status: 'active',
    nextDeadline: '04/Mar',
    nextDeliveryTitle: 'Apresentação: Protocolos de Difusão em AVC Isquêmico',
    coverImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    price: 520.00
  },
  {
    id: 'course_rx_304',
    code: 'RAD-304',
    title: 'Radiologia Digital, Posicionamento e Física das Radiações',
    description: 'Física da produção de raios-X, geometria de projeção, radioproteção ocupacional e controle de qualidade de detectores digitais DR/CR.',
    credits: 4,
    instructor: 'Dra. Sofia Albarracín',
    instructorTitle: 'Doutora em Engenharia Biomédica e Dosimetria',
    instructorAvatar: 'https://images.unsplash.com/photo-1594824813581-2292f7b88937?auto=format&fit=crop&w=250&q=80',
    category: 'Radiologia Geral',
    progress: 91,
    currentModule: 10,
    totalModules: 11,
    grade: 8.9,
    status: 'active',
    nextDeadline: '09/Mar',
    nextDeliveryTitle: 'Relatório Técnico: Curva de Resposta e Ruído em Detectores DR',
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    price: 360.00
  },
  {
    id: 'course_prot_510',
    code: 'RAD-510',
    title: 'Radioproteção Hospitalar & Legislação Sanitária (RDC 330)',
    description: 'Normas CNEN e Anvisa RDC 330/2019, princípio ALARA, cálculo de blindagem de barita e monitoramento dosimétrico individual.',
    credits: 3,
    instructor: 'Prof. Cláudio Silveira',
    instructorTitle: 'Supervisor de Radioproteção Qualificado CNEN-RT',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    category: 'Radioproteção',
    progress: 100,
    currentModule: 6,
    totalModules: 6,
    grade: 9.6,
    status: 'completed',
    coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    price: 399.00
  },
  {
    id: 'course_contrastados_601',
    code: 'RAD-601',
    title: 'Exames Contrastados & Farmacologia dos Meios de Contraste',
    description: 'Estudo aprofundado de contraste iodado (iônico vs não-iônico), gadolínio e bário. Reações adversas, nefropatia induzida por contraste, extravasamento, bomba injetora e protocolos de Urografia, EED, Enema Opaco e Fistulografia.',
    credits: 4,
    instructor: 'Dra. Camila Albuquerque',
    instructorTitle: 'Especialista em Imagenologia Contrastada & Emergências',
    instructorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=250&q=80',
    category: 'Exames Contrastados',
    progress: 82,
    currentModule: 7,
    totalModules: 8,
    grade: 9.4,
    status: 'active',
    nextDeadline: '15/Mar',
    nextDeliveryTitle: 'Protocolo Clínico: Manejo de Choque Anafilactoide por Contraste Iodado',
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    price: 440.00
  },
  {
    id: 'course_rec_715',
    code: 'RAD-715',
    title: 'Reconstruções 3D Avançadas, MPR, MIP & Padrão DICOM 3.0',
    description: 'Pós-processamento de matrizes volumétricas: MPR ortogonal e curvo, MIP vascular, MinIP de vias aéreas, 3D Volume Rendering, segmentação cirúrgica e manipulação de arquivos .dcm de 16 bits.',
    credits: 4,
    instructor: 'Dra. Helena Vasconcelos',
    instructorTitle: 'Doutora em Radiologia Computacional & Imagem Médica',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    category: 'Reconstruções 3D Avançadas',
    progress: 88,
    currentModule: 4,
    totalModules: 5,
    grade: 9.8,
    status: 'active',
    nextDeadline: '22/Mar',
    nextDeliveryTitle: 'Projeto de Segmentação 3D para Impressão Pré-Cirúrgica',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    price: 450.00
  },
  {
    id: 'course_cirurgico_720',
    code: 'RAD-720',
    title: 'Radiologia em Centro Cirúrgico & Arco Cirúrgico (C-Arm)',
    description: 'Atuação do tecnólogo no bloco cirúrgico: arco em C, escopia intraoperatória em ortopedia, cirurgia vascular (endopróteses), neurocirurgia, esterilização de campo, paramentação cirúrgica e radioproteção da equipe.',
    credits: 4,
    instructor: 'Prof. Rafael Medeiros',
    instructorTitle: 'Tecnólogo Especialista em Imagem Cirúrgica e Intervencionismo',
    instructorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    category: 'Centro Cirúrgico',
    progress: 74,
    currentModule: 5,
    totalModules: 7,
    grade: 9.0,
    status: 'active',
    nextDeadline: '18/Mar',
    nextDeliveryTitle: 'Guia de Angulação do Arco Cirúrgico em Fixação de Fêmur e Pelve',
    coverImage: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    price: 465.00
  }
];

export const initialLessons: Lesson[] = [
  {
    id: 'les_01',
    courseId: 'course_tc_701',
    chapterNumber: 1,
    title: 'Fundamentos de Tomografia: Aquisição Axial vs. Helicoidal Multislice',
    description: 'Princípios matemáticos de reconstrução Radon, matriz 512x512, pitch e formação do vóxel isotrópico.',
    durationMinutes: 45,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    isCompleted: true,
    testScore: 98,
    markers: [
      { timeSeconds: 120, label: 'Tubo de Raios-X e Detector em Arco' },
      { timeSeconds: 600, label: 'Cálculo de Pitch e Espessura de Corte' },
      { timeSeconds: 1500, label: 'Reconstrução Iterativa e Redução de Dose' }
    ],
    ctWindowType: 'bone',
    resources: [
      {
        id: 'res_01',
        lessonId: 'les_01',
        title: 'Apostila Oficial: Princípios da Tomografia Computadorizada Multislice',
        description: 'Capítulo 1 completo com diagramas do Gantry, rotação contínua e colimação pré e pós-paciente.',
        type: 'pdf',
        fileSize: '14.2 MB',
        dateAdded: '15/Jan/2026',
        authorName: 'Prof. Dr. Marcus Vinicius',
        previewContent: 'Sumário Teórico:\n1. Histórico: Da invenção de Godfrey Hounsfield aos tomógrafos multislice de 128 cortes.\n2. Geometria do Feixe de Raios-X e detectores de estado sólido (cerâmicos).\n3. O conceito de Pitch = Deslocamento da mesa por rotação de 360° / Colimação do feixe.\n4. Relação Pitch > 1 (aquisição rápida, menor dose, menor resolução axial) vs Pitch < 1 (sobreposição de dados, alta resolução, maior dose).\n5. Reconstrução de Projeções Filtradas (FBP) e Algoritmos Iterativos modernos (ASiR, MBIR, AIDR 3D).'
      },
      {
        id: 'res_02',
        lessonId: 'les_01',
        title: 'Tabela Rápida de Parâmetros Técnicos (kVp, mAs e Pitch)',
        description: 'Guia de bolso plastificado para parametrização no console de aquisição clínica.',
        type: 'protocol',
        fileSize: '2.8 MB',
        dateAdded: '18/Jan/2026',
        authorName: 'Coordenação Acadêmica RadBio',
        previewContent: 'Parâmetros Recomendados por Biotipo:\n- Crânio Adulto: 120 kVp / 250-300 mAs / Pitch 0.7-0.9 / Corte 1mm a 2mm.\n- Tórax Alta Resolução: 120 kVp / 80-120 mAs com modulação de corrente automática (Smart/Care Dose) / Pitch 1.0-1.2 / Corte 0.625mm.\n- Abdômen Total: 120 kVp / 160-220 mAs / Pitch 0.9-1.0 / Corte 1.25mm.'
      },
      {
        id: 'res_03',
        lessonId: 'les_01',
        title: 'Podcast RadBio Ep. 01: Vóxel Isotrópico na Prática',
        description: 'Áudio explicativo de 15 minutos com o Professor Marcus debatendo a importância do vóxel cúbico para cortes coronais e sagitais sem perda de nitidez.',
        type: 'podcast',
        fileSize: '18.0 MB',
        dateAdded: '20/Jan/2026',
        authorName: 'Prof. Dr. Marcus Vinicius'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_01',
        lessonId: 'les_01',
        question: 'O que ocorre quando o operador seleciona um fator Pitch estritamente maior que 1 (Pitch > 1.0) em uma aquisição helicoidal?',
        options: [
          'A velocidade da mesa diminui e o paciente recebe o dobro da dose de radiação.',
          'Há lacunas na hélice com redução do tempo de exame e diminuição da dose de radiação no paciente.',
          'O feixe de raios-X para de girar e a imagem passa a ser adquirida de modo exclusivamente sequencial.',
          'A resolução espacial no eixo Z é dobrada devido à sobreposição total dos cortes.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Correto! Pitch > 1 significa que o avanço da mesa a cada 360° é maior que a largura do feixe colimado. Isso encurta o tempo total de varredura e reduz a dose (CTDIvol), sendo crucial em pacientes pediátricos ou com dispneia.'
      },
      {
        id: 'quiz_02',
        lessonId: 'les_01',
        question: 'Qual é a principal vantagem do Vóxel Isotrópico em tomografia computadorizada multislice?',
        options: [
          'Possibilita reconstruções multiplanares (coronal, sagital e oblíquo) com a mesma resolução geométrica da aquisição axial original, sem efeito de degrau ou distorção.',
          'Permite eliminar totalmente o uso do tubo de raios-X.',
          'Torna desnecessário o uso de bombas injetoras de contraste iodado em qualquer exame vascular.',
          'Garante que a imagem seja visualizada sem qualquer filtro de atenuação ou janelamento.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Exato! Um vóxel isotrópico possui dimensões idênticas em X, Y e Z (ex: 0.5 x 0.5 x 0.5 mm), permitindo reconstruções 3D MPR e VR perfeitamente nítidas em qualquer plano.'
      }
    ]
  },
  {
    id: 'les_02',
    courseId: 'course_tc_701',
    chapterNumber: 2,
    title: 'Escala Hounsfield (HU) e Janelamento Ósseo, Pulmonar e de Partes Moles',
    description: 'Controle de Window Width (WW) e Window Level (WL). Calibração e diferenciação entre ar (-1000 HU), água (0 HU) e osso cortical (+1000 HU).',
    durationMinutes: 52,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    isCompleted: true,
    testScore: 95,
    markers: [
      { timeSeconds: 180, label: 'Definição Matemática do Coeficiente de Atenuação' },
      { timeSeconds: 840, label: 'Janela de Parênquima Pulmonar (WW 1500 / WL -600)' },
      { timeSeconds: 1800, label: 'Janela de Mediastino e Diferenciação Vascular' }
    ],
    ctWindowType: 'pulmonary',
    resources: [
      {
        id: 'res_04',
        lessonId: 'les_02',
        title: 'Tabela de Unidades Hounsfield (HU) para Estruturas Humanas',
        description: 'Compilado de valores normais de HU: gordura (-100 HU), água (0 HU), sangue fluido (30-45 HU), músculo (40-50 HU) e contraste iodado (>200 HU).',
        type: 'spreadsheet',
        fileSize: '1.9 MB',
        dateAdded: '24/Jan/2026',
        authorName: 'Prof. Dr. Marcus Vinicius',
        previewContent: 'Escala Oficial de HU:\n- Ar atmosférico: -1000 HU\n- Pulmão insuflado: -850 a -600 HU\n- Tecido Adiposo / Gordura: -120 a -60 HU\n- Água Pura: 0 HU\n- Líquor Cefalorraquidiano: +5 a +15 HU\n- Sangue Descoagulado: +35 a +45 HU\n- Hematoma Agudo Coagulado: +60 a +80 HU\n- Parênquima Hepático: +55 a +65 HU\n- Osso Esponjoso: +200 a +400 HU\n- Osso Cortical Compacto: +800 a +1500 HU'
      },
      {
        id: 'res_05',
        lessonId: 'les_02',
        title: 'Atlas Ilustrado de Janelas Tomográficas em Tórax e Crânio',
        description: 'Imagens lado a lado demonstrando como a mesma matriz é filtrada para avaliação pulmonar, partes moles e janela óssea.',
        type: 'case_study',
        fileSize: '31.5 MB',
        dateAdded: '28/Jan/2026',
        authorName: 'Dra. Sofia Albarracín'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_03',
        lessonId: 'les_02',
        question: 'Para a análise minuciosa de bronquiectasias e enfisema no parênquima pulmonar, qual a combinação padrão de Window Width (WW) e Window Level (WL)?',
        options: [
          'WW: 400 HU / WL: +40 HU (Janela de Mediastino/Partes Moles)',
          'WW: 1500 a 1600 HU / WL: -600 a -700 HU (Janela Pulmonar)',
          'WW: 2500 HU / WL: +450 HU (Janela Óssea)',
          'WW: 80 HU / WL: +35 HU (Janela de Crânio Encéfalo)'
        ],
        correctAnswerIndex: 1,
        explanation: 'Perfeito! O pulmão possui densidades predominantemente aéreas (-600 HU), necessitando de uma largura de janela ampla (WW 1500) centrada em valor negativo (WL -600) para contrastar a trama brônquica contra os alvéolos.'
      }
    ]
  },
  {
    id: 'les_03',
    courseId: 'course_tc_701',
    chapterNumber: 3,
    title: 'Protocolos de Injeção de Contraste Iodado e Reações Adversas',
    description: 'Cálculo de vazão de bomba injetora (3 a 5 mL/s), tempos de fase arterial, portal e equilíbrio tardio.',
    durationMinutes: 48,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    isCompleted: true,
    testScore: 92,
    markers: [
      { timeSeconds: 240, label: 'Osmolaridade de Contrastes Não Iônicos' },
      { timeSeconds: 960, label: 'Bolus Tracking e SmartPrep na Aorta Abdominal' },
      { timeSeconds: 1920, label: 'Conduta de Emergência em Reações Anafilactoides' }
    ],
    ctWindowType: 'mediastinum',
    resources: [
      {
        id: 'res_06',
        lessonId: 'les_03',
        title: 'Manual de Segurança e Conduta em Reações Adversas a Meios de Contraste',
        description: 'Diretriz oficial do Colégio Brasileiro de Radiologia (CBR) com fluxograma de atendimento para reações leves, moderadas e graves.',
        type: 'protocol',
        fileSize: '6.4 MB',
        dateAdded: '03/Fev/2026',
        authorName: 'Prof. Cláudio Silveira',
        previewContent: 'Fluxograma de Urgência no Serviço de Tomografia:\n1. Urticária leve / prurido limitado: Observação clínica, controle de sinais vitais, compressas frias e anti-histamínico se necessário.\n2. Broncoespasmo / Estridor laringeo: Oxigênio sob máscara (6-10 L/min), salbutamol spray inalatório e preparo de Adrenalina 1:1.000.\n3. Choque Anafilactoide / Colapso: Chamar equipe médica imediatamente, Adrenalina 1:1.000 IM 0,3-0,5 mg no vasto lateral da coxa, reposição volêmica rápida com Ringer Lactato e elevação de membros.'
      },
      {
        id: 'res_07',
        lessonId: 'les_03',
        title: 'Artigo Científico: Timing de Injeção e Bolus Tracking em TC Hepática',
        description: 'Publicação de referência sobre a caracterização de hepatocarcinomas em fase arterial tardia (35s) e wash-out portal.',
        type: 'article',
        fileSize: '3.1 MB',
        dateAdded: '05/Fev/2026',
        authorName: 'Prof. Dr. Marcus Vinicius'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_04',
        lessonId: 'les_03',
        question: 'Qual o tempo aproximado de delay (atraso) recomendado para a Fase Portal Venosa em um estudo tomográfico de abdômen total?',
        options: [
          '15 a 20 segundos após início da injeção.',
          '65 a 75 segundos após início da injeção.',
          '5 a 10 minutos após início da injeção.',
          'Imediatamente ao término da infusão rápida sem qualquer delay.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Correto! A fase portal venosa atinge seu pico entre 65 e 75 segundos, garantindo a opacificação homogênea do parênquima hepático e facilitando a detecção de lesões hipovasculares como metástases.'
      }
    ]
  },
  {
    id: 'les_04',
    courseId: 'course_tc_701',
    chapterNumber: 4,
    title: 'Angiotomografia Coronariana & Reconstrução 3D MPR / VR',
    description: 'Sincronização com ECG (gating prospectivo/retrospectivo), escore de cálcio Agatston e pós-processamento multiplanar.',
    durationMinutes: 58,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    isCompleted: false,
    currentPlaybackPercent: 42,
    markers: [
      { timeSeconds: 200, label: 'Aquisição com Batimento Controlado (<65 bpm)' },
      { timeSeconds: 850, label: 'Reconstrução Curva das Artérias Coronárias' },
      { timeSeconds: 1458, label: 'Volume Rendering (VR) e Detecção de Estenoses' },
      { timeSeconds: 2600, label: 'Exportação e Arquivamento de Exames de TC' }
    ],
    ctWindowType: 'brain',
    resources: [
      {
        id: 'res_08',
        lessonId: 'les_04',
        title: 'Guia Prático: Pós-Processamento MPR e CPR de Artérias Coronárias',
        description: 'Passo a passo com telas do console para alinhamento da Descendente Anterior (DA), Circunflexa (Cx) e Coronária Direita (CD).',
        type: 'pdf',
        fileSize: '16.8 MB',
        dateAdded: '12/Fev/2026',
        authorName: 'Prof. Dr. Marcus Vinicius',
        previewContent: 'Rotina de Pós-Processamento Coronariano:\n1. Seleção da fase diastólica com menor artefato de movimento (geralmente 70-75% do intervalo R-R do ECG).\n2. Geração do Curved Multiplanar Reformation (CPR) ao longo da linha média da artéria coronária.\n3. Análise da luz do vaso em corte perpendicular verdadeiro para graduação de estenose luminal (CAD-RADS).\n4. Renderização Volumétrica 3D (Volume Rendering - VR) para visualização global da anatomia cardíaca e pontes de safena/mamária.'
      },
      {
        id: 'res_09',
        lessonId: 'les_04',
        title: 'Planilha de Classificação CAD-RADS 2.0 e Escore de Cálcio Agatston',
        description: 'Tabela de referência para cálculo rápido de estenose coronariana e conduta clínica preconizada pela SCCT.',
        type: 'spreadsheet',
        fileSize: '2.4 MB',
        dateAdded: '14/Fev/2026',
        authorName: 'Prof. Dr. Aris Thorne'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_05',
        lessonId: 'les_04',
        question: 'Qual a frequência cardíaca alvo ideal para a realização de Angiotomografia de Coronárias com gating prospectivo (menor dose de radiação)?',
        options: [
          'Acima de 100 batimentos por minuto (bpm).',
          'Abaixo de 60 a 65 batimentos por minuto (bpm) com ritmo sinusal regular.',
          'Não há restrição de frequência, qualquer arritmia severa pode ser ignorada.',
          'Exclusivamente em pacientes com marca-passo cardíaco artificial programado em 90 bpm.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Exato! Frequências cardíacas inferiores a 65 bpm aumentam a duração da diástole cardíaca, período em que o coração permanece relativamente imóvel, permitindo cortes nítidos sem artefatos de movimento cinético.'
      }
    ]
  },
  {
    id: 'les_05',
    courseId: 'course_contrastados_601',
    chapterNumber: 1,
    title: 'Meios de Contraste Iodados: Iônicos, Não-Iônicos e Reações Adversas',
    description: 'Osmolalidade, viscosidade, barreira hematoencefálica e perfil de segurança. Fatores de risco para Nefropatia Induzida por Contraste (NIC) e dosagem de creatinina/Taxa de Filtração Glomerular (eGFR).',
    durationMinutes: 58,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    isCompleted: true,
    testScore: 96,
    markers: [
      { timeSeconds: 150, label: 'Estrutura Molecular do Monômero Não-Iônico' },
      { timeSeconds: 780, label: 'Prevenção de Nefropatia: Hidratação com SF 0.9%' },
      { timeSeconds: 1620, label: 'Kit de Emergência e Administração de Adrenalina 1:1000' }
    ],
    ctWindowType: 'mediastinum',
    resources: [
      {
        id: 'res_contrast_01',
        lessonId: 'les_05',
        title: 'Manual de Meios de Contraste: Classificação e Condutas Clínicas',
        description: 'Diretrizes completas de contraste iodado e gadolínio, reações leves (urticária), moderadas (broncoespasmo) e graves (choque anafilactoide).',
        type: 'pdf',
        fileSize: '12.4 MB',
        dateAdded: '15/Jan/2026',
        authorName: 'Dra. Camila Albuquerque',
        previewContent: 'Guia Rápido de Emergência com Contraste:\n1. Reações Leves: Náuseas, calor facial, poucas placas de urticária -> Suporte, observação e anti-histamínico oral se necessário.\n2. Reações Moderadas: Broncoespasmo com sibilos, edema facial sem estridor -> Oxigênio por máscara (6-10 L/min), salbutamol spray, hidrocortisona EV.\n3. Reações Graves: Choque anafilactoide, hipotensão severa (PAS < 80 mmHg), estridor laríngeo -> Chamar time de emergência médica, Adrenalina 0.3 a 0.5 mg IM (1:1000) no vasto lateral da coxa, reposição rápida de Ringer Lactato ou SF 0.9% EV.'
      },
      {
        id: 'res_contrast_02',
        lessonId: 'les_05',
        title: 'Checklist Pré-Contraste: Filtração Glomerular (eGFR) e Alergias',
        description: 'Formulário padrão de triagem do paciente antes da injeção no setor de TC e Hemodinâmica.',
        type: 'protocol',
        fileSize: '1.7 MB',
        dateAdded: '18/Jan/2026',
        authorName: 'Coordenação RadBio'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_contrast_01',
        lessonId: 'les_05',
        title: 'Reações Adversas a Contraste',
        question: 'Qual é a conduta farmacológica prioritária de primeira linha no caso de reação anafilactoide grave com hipotensão e broncoespasmo após injeção de contraste iodado?',
        options: [
          'Administrar Adrenalina (Epinefrina) 1:1000 por via intramuscular no músculo vasto lateral da coxa.',
          'Oferecer um copo de água mineral fria com açúcar ao paciente.',
          'Aplicar apenas pomada de hidrocortisona sobre o antebraço.',
          'Aguardar 2 horas em repouso absoluto sem qualquer medicação.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Correto! A adrenalina por via intramuscular (1:1000, 0.3 a 0.5 mg no vasto lateral) é a medicação salvadora de primeira linha, revertendo rapidamente a vasodilatação, hipotensão e o broncoespasmo severo.'
      },
      {
        id: 'quiz_contrast_02',
        lessonId: 'les_05',
        title: 'Segurança Renal',
        question: 'Em relação à Nefropatia Induzida por Contraste (NIC), qual a medida preventiva isolada com maior evidência científica comprovada?',
        options: [
          'Hidratação endovenosa com solução isotônica (Soro Fisiológico 0.9% ou Bicarbonato) antes e após o procedimento.',
          'Uso de contraste iônico de altíssima osmolalidade.',
          'Administração de anti-inflamatórios não-esteroidais em doses altas.',
          'Restrição hídrica severa 24 horas antes do exame.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Exato! A expansão volêmica com soro fisiológico 0.9% promove diluição do contraste no túbulo renal, aumentando o fluxo urinário e reduzindo a toxicidade tubular direta e a vasoconstrição medular renal.'
      }
    ]
  },
  {
    id: 'les_06',
    courseId: 'course_cirurgico_720',
    chapterNumber: 1,
    title: 'Operação do Arco Cirúrgico (C-Arm) e Escopia em Traumatologia Ortopédica',
    description: 'Paramentação, campos estéreis, posicionamento do intensificador de imagem, incidências AP e Perfil verdadeiro de quadril/fêmur, controle de pedal e colimação.',
    durationMinutes: 50,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    isCompleted: false,
    testScore: 92,
    markers: [
      { timeSeconds: 180, label: 'Zonas Estéreis e Capa Plástica Protetora do C-Arm' },
      { timeSeconds: 840, label: 'Posicionamento para Fratura de Colo de Fêmur (AP e Axial)' },
      { timeSeconds: 1560, label: 'Modo Pulsado e Redução de Dose para o Cirurgião e Equipe' }
    ],
    ctWindowType: 'bone',
    resources: [
      {
        id: 'res_cirurgico_01',
        lessonId: 'les_06',
        title: 'Manual Prático: Operação do Intensificador de Imagem e Arco Cirúrgico',
        description: 'Técnicas de rotação orbital, angulação cefálica/podálica e movimentos transversais no bloco cirúrgico.',
        type: 'pdf',
        fileSize: '15.6 MB',
        dateAdded: '20/Jan/2026',
        authorName: 'Prof. Rafael Medeiros',
        previewContent: 'Regras de Ouro no Centro Cirúrgico:\n1. Tubo de Raios-X SEMPRE posicionado sob a mesa cirúrgica quando possível, e o Intensificador/Detector plano acima do paciente. Isso reduz drasticamente a radiação espalhada direcionada aos olhos e tireoide do cirurgião e instrumentador.\n2. Uso obrigatório do modo de Escopia Pulsada (ex: 7.5 ou 15 pulsos/segundo) em vez de escopia contínua, economizando até 70% da dose de radiação.\n3. Colimação estrita da área de interesse: melhora o contraste da imagem ortopédica e diminui o volume irradiado.\n4. Jamais encostar em campos azuis estéreis ou na mesa de instrumentais sem estar devidamente paramentado com avental cirúrgico e luvas estéreis.'
      },
      {
        id: 'res_cirurgico_02',
        lessonId: 'les_06',
        title: 'Protocolo de Blindagem e Paramentação com Aventais Plumbíferos',
        description: 'Checklist de integridade de aventais de chumbo (0.5 mm Pb equivalente) e protetores de tireoide na sala cirúrgica.',
        type: 'protocol',
        fileSize: '2.1 MB',
        dateAdded: '22/Jan/2026',
        authorName: 'Coordenação RadBio'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_cirurgico_01',
        lessonId: 'les_06',
        title: 'Posicionamento do Arco em C',
        question: 'Durante uma cirurgia ortopédica com uso do Arco Cirúrgico (C-Arm), qual é a posição recomendada do tubo emissor de raios-X em relação ao paciente para minimizar a radiação espalhada recebida pela equipe cirúrgica?',
        options: [
          'Tubo posicionado abaixo da mesa cirúrgica, com o intensificador/detector posicionado acima do paciente.',
          'Tubo posicionado acima do paciente apontando diretamente para o rosto da equipe.',
          'Tubo em rotação contínua sem colimação.',
          'Posicionamento horizontal fixo colado à cabeça do anestesiologista.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Exato! O tubo de raios-X sob a mesa direciona a maior parte da radiação retroespalhada para o chão e membros inferiores (protegidos pela saia de chumbo da mesa e aventais), protegendo a tireoide e o cristalino dos profissionais.'
      }
    ]
  },
  {
    id: 'les_07',
    courseId: 'course_tc_701',
    chapterNumber: 5,
    title: 'Tomografia de Abdômen Total: Fases Contratadas Pré, Arterial, Portal e Tardia',
    description: 'Cinética de impregnação do parênquima hepático, esplênico e renal. Diagnóstico diferencial de Hemangiomas, Hiperplasia Nodular Focal (HNF), Carcinoma Hepatocelular (CHC) e lavagem (washout).',
    durationMinutes: 62,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoSource: 'direct_mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    isCompleted: false,
    testScore: 94,
    markers: [
      { timeSeconds: 120, label: 'Fase Sem Contraste: Cálculo Renal e Esteatose' },
      { timeSeconds: 720, label: 'Fase Arterial Precoce vs. Tardia (30-35s)' },
      { timeSeconds: 1500, label: 'Fase Portal (65-75s) e Fase de Equilíbrio/Tardia (3-5 min)' }
    ],
    ctWindowType: 'mediastinum',
    resources: [
      {
        id: 'res_tc_abd_01',
        lessonId: 'les_07',
        title: 'Protocolo de Injeção em TC Abdominal Multifásica',
        description: 'Tempos de atraso (scan delay), volume de contraste (1.5 mL/kg) e taxa de fluxo de injeção na bomba (3.0 a 4.5 mL/s).',
        type: 'protocol',
        fileSize: '5.2 MB',
        dateAdded: '25/Jan/2026',
        authorName: 'Prof. Dr. Aris Thorne'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_tc_abd_01',
        lessonId: 'les_07',
        title: 'Fases da Tomografia Hepática',
        question: 'Em que janela temporal pós-injeção de contraste iodado ocorre tipicamente a Fase Portal em uma TC de abdômen?',
        options: [
          'Aproximadamente 65 a 75 segundos após o início da injeção.',
          'Em menos de 10 segundos antes do contraste atingir a aorta.',
          'Apenas 24 horas após o procedimento.',
          'Aos 45 minutos em repouso absoluto.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Correto! A fase portal (venosa) ocorre por volta de 65-75 segundos, quando a veia porta perfunde de forma homogênea todo o parênquima hepático saudável, gerando o pico de realce para detecção de metástases hipovasculares.'
      }
    ]
  }
];

export const initialTasks: TaskPendency[] = [
  {
    id: 'task_01',
    courseId: 'course_tc_701',
    courseTitle: 'Tomografia Computadorizada Avançada',
    title: 'Trabalho Prático: TC de Tórax em Alta Resolução (HRCT)',
    description: 'Análise de opacidades em vidro fosco, consolidações e espessamento septal interlobular em paciente pós-infeccioso.',
    type: 'relatorio',
    deadlineDate: '28/02/2026',
    daysRemaining: 3,
    format: 'Relatório em PDF + Análise de Cortes',
    status: 'pending'
  },
  {
    id: 'task_02',
    courseId: 'course_rm_802',
    courseTitle: 'Ressonância Magnética & Neuroimagem',
    title: 'Apresentação Oral: Vetores e Gradientes em Imagens por Difusão (DWI)',
    description: 'Seminário em grupo de 15 minutos com estudo de caso de acidente vascular encefálico isquêmico hiperagudo.',
    type: 'slides',
    deadlineDate: '04/03/2026',
    daysRemaining: 7,
    format: 'Slides PPTX / PDF',
    status: 'pending'
  },
  {
    id: 'task_03',
    courseId: 'course_rx_304',
    courseTitle: 'Radiologia Digital e Posicionamento',
    title: 'Relatório Prático: Análise de Dosimetria e Ruído SNR em Detectores DR',
    description: 'Processamento de matrizes de imagens radiológicas brutas e cálculo da relação sinal-ruído (SNR) e contraste-ruído (CNR).',
    type: 'relatorio',
    deadlineDate: '09/03/2026',
    daysRemaining: 12,
    format: 'Jupyter Notebook / PDF',
    status: 'pending'
  },
  {
    id: 'task_04',
    courseId: 'course_tc_701',
    courseTitle: 'Tomografia Computadorizada Avançada',
    title: 'Checklist de Biossegurança e Cateterização para Injetora de TC',
    description: 'Verificação dos calibres de Jelco 18G/20G, teste de fluxo com soro fisiológico e termo de consentimento livre e esclarecido.',
    type: 'estagio',
    deadlineDate: '15/03/2026',
    daysRemaining: 18,
    format: 'Ficha de Estágio Assinada',
    status: 'pending'
  },
  {
    id: 'task_05',
    courseId: 'course_contrastados_601',
    courseTitle: 'Exames Contrastados & Farmacologia',
    title: 'Protocolo de Emergência: Manejo de Choque Anafilactoide por Contraste',
    description: 'Elaboração do fluxograma de atendimento para extravasamento e anafilaxia com algoritmo de dosagem de adrenalina e hidrocortisona.',
    type: 'relatorio',
    deadlineDate: '15/03/2026',
    daysRemaining: 18,
    format: 'Fluxograma Clínico em PDF',
    status: 'pending'
  },
  {
    id: 'task_06',
    courseId: 'course_cirurgico_720',
    courseTitle: 'Radiologia em Centro Cirúrgico & Arco em C',
    title: 'Estudo de Caso: Angulação do C-Arm em Fixação de Colo de Fêmur',
    description: 'Relatório descritivo com fotos de posicionamento ortopédico nos eixos AP e axial verdadeiro, minimizando exposição da equipe.',
    type: 'estagio',
    deadlineDate: '18/03/2026',
    daysRemaining: 21,
    format: 'Relatório de Centro Cirúrgico + Ficha de Estágio',
    status: 'pending'
  }
];

export const initialStudentGrades: StudentGradeRecord[] = [
  {
    id: 'rec_01',
    studentId: 'std_01',
    studentName: 'Clara Mendonça',
    studentEmail: 'clara.m@radbio.edu.br',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    enrollmentId: 'BIO-88201',
    attendance: 96,
    gradeN1: 8.0,
    gradeN2: 8.5,
    gradePractice: 9.0,
    calculatedAverage: 8.5,
    feedback: 'Excelente domínio em reconstruções curvas de angiotomografia e precisão no cálculo de Hounsfield Units.',
    status: 'approved'
  },
  {
    id: 'rec_02',
    studentId: 'std_02',
    studentName: 'Lucas Vane',
    studentEmail: 'lucas.v@radbio.edu.br',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    enrollmentId: 'BIO-88204',
    attendance: 74,
    gradeN1: 5.0,
    gradeN2: 5.5,
    gradePractice: 6.0,
    calculatedAverage: 5.5,
    feedback: 'Dificuldade na identificação de artefatos de endurecimento de feixe metálico em quadril e dosimetria.',
    status: 'risk'
  },
  {
    id: 'rec_03',
    studentId: 'std_03',
    studentName: 'Beatriz Lima',
    studentEmail: 'beatriz.l@radbio.edu.br',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    enrollmentId: 'BIO-88219',
    attendance: 92,
    gradeN1: 7.5,
    gradeN2: 7.8,
    gradePractice: 8.0,
    calculatedAverage: 7.8,
    feedback: 'Boa execução dos protocolos de abdômen total com três fases contrastadas e tempo de delay correto.',
    status: 'approved'
  },
  {
    id: 'rec_04',
    studentId: 'std_04',
    studentName: 'Gabriel Sato',
    studentEmail: 'gabriel.s@radbio.edu.br',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    enrollmentId: 'BIO-88222',
    attendance: 100,
    gradeN1: 9.5,
    gradeN2: 9.8,
    gradePractice: 10.0,
    calculatedAverage: 9.8,
    feedback: 'Desempenho de excelência internacional. Protocolo de perfusão cerebral em TC realizado de forma impecável.',
    status: 'approved'
  },
  {
    id: 'rec_05',
    studentId: 'std_05',
    studentName: 'Sofia Alencar',
    studentEmail: 'sofia.a@radbio.edu.br',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    enrollmentId: 'BIO-88235',
    attendance: 78,
    gradeN1: 5.8,
    gradeN2: 5.9,
    gradePractice: 6.0,
    calculatedAverage: 5.9,
    feedback: 'Abaixo da média na prova teórica sobre efeito Compton e atenuação fotoelétrica. Monitoria recomendada.',
    status: 'risk'
  }
];

export const initialRecentGrades: RecentGradeItem[] = [
  {
    id: 'rg_01',
    title: 'Relatório #04: Reconstrução MPR e Angiotomografia',
    course: 'Tomografia Computadorizada Avançada',
    instructor: 'Prof. Dr. Aris Thorne',
    grade: 9.8,
    statusText: 'Aprovado A+',
    date: 'Hoje'
  },
  {
    id: 'rg_02',
    title: 'Artigo Crítico: Ressonância com Difusão em Neuroimagem',
    course: 'Ressonância Magnética Estrutural',
    instructor: 'Prof. Dr. Carlos Vane',
    grade: 9.0,
    statusText: 'Aprovado A',
    date: 'Ontem'
  },
  {
    id: 'rg_03',
    title: 'Auditoria de Dosimetria e Controle de Qualidade DR',
    course: 'Radiologia Digital e Posicionamento',
    instructor: 'Dra. Sofia Albarracín',
    grade: 8.2,
    statusText: 'Aprovado B+',
    date: 'Há 3 dias'
  }
];

export const initialCertificates: Certificate[] = [
  {
    id: 'cert_rad_01',
    code: 'RADBIO-CERT-2025-9941-TC',
    studentName: 'Lucas Mendonça',
    studentDocument: 'CPF 049.882.109-44 • Matrícula 2023-BIO-8841',
    courseName: 'Programa Avançado de Tomografia Computadorizada & Reconstruções 3D',
    workloadHours: 180,
    completionDate: '22 de Setembro de 2026',
    instructorName: 'Prof. Dr. Aris Thorne',
    instructorRole: 'Coordenador Acadêmico & Especialista CBR Titular',
    finalScore: 9.4,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    qrValidationUrl: 'https://radbio.edu.br/validar/RADBIO-CERT-2025-9941-TC'
  }
];

export const initialEmailNotifications: EmailNotification[] = [
  {
    id: 'notif_01',
    recipientEmail: 'lucas.mendonca@radbio.edu.br',
    subject: '[Biorad Cursos] Nova Nota Publicada: Reconstrução MPR e Angiotomografia (Nota: 9.8)',
    body: 'Prezado Lucas, a nota do seu relatório prático sobre Angiotomografia Coronariana foi publicada pelo Prof. Dr. Aris Thorne. O parecer já se encontra disponível no seu boletim.',
    type: 'grade_published',
    timestamp: 'Hoje às 14:32',
    isRead: false,
    status: 'delivered'
  },
  {
    id: 'notif_02',
    recipientEmail: 'lucas.mendonca@radbio.edu.br',
    subject: '[Alerta de Prazo] Submissão de Trabalho de TC de Tórax encerra em 3 dias',
    body: 'Lembrete automático: A data limite para entrega do trabalho prático de tomografia computadorizada de alta resolução é 28/Fev às 23h59.',
    type: 'deadline_warning',
    timestamp: 'Hoje às 09:15',
    isRead: false,
    status: 'delivered'
  },
  {
    id: 'notif_03',
    recipientEmail: 'lucas.mendonca@radbio.edu.br',
    subject: '[Certificado Pronto] Seu Diploma de Radioproteção Hospitalar está disponível para download',
    body: 'Parabéns! Você concluiu com louvor o módulo de Radioproteção com média 9.6. Seu documento assinado digitalmente já pode ser baixado em PDF.',
    type: 'certificate_issued',
    timestamp: 'Ontem às 18:40',
    isRead: true,
    status: 'delivered'
  }
];

export const initialPaymentPlans: PaymentPlan[] = [
  {
    id: 'plan_tc_starter',
    courseId: 'course_tc_701',
    title: 'Especialização em Tomografia Multislice',
    price: 489.00,
    installments: 12,
    features: [
      'Acesso completo aos 8 módulos gravados em 4K',
      'Simulador interativo de janelas Hounsfield (HU)',
      'Casos práticos em ambiente virtual de aprendizagem',
      'Certificado de conclusão com registro de 180 horas',
      'Aulas ao vivo semanais com Dr. Aris Thorne'
    ]
  },
  {
    id: 'plan_master_vip',
    courseId: 'all',
    title: 'Passaporte Radiologia & Neuroimagem Integral',
    price: 980.00,
    installments: 12,
    isPopular: true,
    features: [
      'Acesso a TODOS os cursos (TC, RM, Raio-X Digital e Radioproteção)',
      'Emissão ilimitada de diplomas e certificados em PDF assinado',
      'Suporte prioritário na bancada do simulador de TC',
      'Mentoria individual de elaboração de relatórios técnicos',
      'Liberação instantânea com confirmação de pagamento Pix/Cartão'
    ]
  }
];

export const defaultSupabaseConfig: SupabaseConfig = {
  url: 'https://cqijrrybqhukcuqksfjr.supabase.co',
  anonKey: 'sb_publishable_UO_nT6jH8ml1lgUOU6MgTg_Ld15FrPH',
  isConnected: true,
  lastSync: 'Conectado ao Supabase (BioRad Cursos)'
};
