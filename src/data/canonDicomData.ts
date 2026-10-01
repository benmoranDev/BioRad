export interface DicomSliceData {
  sliceNumber: number;
  instanceNumber: number;
  sliceLocation: number; // in mm (e.g. -120.5 mm)
  sliceThickness: number; // 0.625, 1.0, 2.5 mm
  kvp: number; // 100, 120, 135 kV
  mA: number; // 250, 400 mA
  rotationTime: number; // 0.35s, 0.5s
  reconstructionAlgorithm: 'AiCE Deep Learning' | 'AIDR 3D Enhanced' | 'SUREExposure 3D' | 'SEMAR';
  doseLengthProduct: number; // DLP in mGy*cm
  ctdiVol: number; // mGy
  matrixSize: '512x512' | '1024x1024';
  pitch: number;
  acquisitionDate: string;
  acquisitionTime: string;
}

export interface RealClinicalDicomCase {
  id: string;
  caseCode: string;
  name: string;
  modality: 'CT' | 'XA';
  systemModel: 'Canon Aquilion ONE / Prism Edition' | 'Canon Aquilion PRIME SP' | 'Canon Alphenix Biplane';
  patientId: string;
  patientName: string;
  patientSex: 'M' | 'F';
  patientAge: string;
  patientDOB: string;
  accessionNumber: string;
  studyDate: string;
  studyTime: string;
  seriesDescription: string;
  bodyPartExamined: string;
  protocolName: string;
  totalSlices: number;
  currentSlice: number;
  defaultPreset: 'bone' | 'lung' | 'mediastinum' | 'brain' | 'liver' | 'angio';
  windowWidth: number;
  windowLevel: number;
  contrastMedia: {
    agent: string;
    volumeMl: number;
    flowRate: number; // mL/s
    injectionDelaySec: number;
    scanPhase: 'Pré-Contraste' | 'Fase Arterial Precoce' | 'Fase Arterial Tardia' | 'Fase Portal Venosa' | 'Fase de Equilíbrio';
  };
  clinicalHistory: string;
  keyFindings: string[];
  radiologyReport: string;
  educationalTips: string;
  slices: {
    index: number;
    imageUrl: string;
    previewUrl?: string;
    anatomicalLabels: { x: number; y: number; label: string; huValue: number }[];
  }[];
}

export const CANON_REAL_DICOM_CASES: RealClinicalDicomCase[] = [
  {
    id: 'canon_tc_angio_chest',
    caseCode: 'CANON-AQU-001',
    name: 'Angio-TC de Tórax: TEP & Nódulo Pulmonar',
    modality: 'CT',
    systemModel: 'Canon Aquilion ONE / Prism Edition',
    patientId: '202609-CAN-8841',
    patientName: 'FERREIRA, CARLOS EDUARDO',
    patientSex: 'M',
    patientAge: '54Y',
    patientDOB: '14/11/1971',
    accessionNumber: 'ACC-891041',
    studyDate: '23/09/2026',
    studyTime: '11:42:09',
    seriesDescription: 'THORAX ANGIO + LUNG 0.5mm x 80 AiCE-i',
    bodyPartExamined: 'CHEST',
    protocolName: 'PULMONARY_ANGIO_SURESTART_120KV',
    totalSlices: 48,
    currentSlice: 24,
    defaultPreset: 'lung',
    windowWidth: 1500,
    windowLevel: -600,
    contrastMedia: {
      agent: 'Iohexol (Omnipaque 350 mgI/mL)',
      volumeMl: 65,
      flowRate: 4.5,
      injectionDelaySec: 14,
      scanPhase: 'Fase Arterial Precoce'
    },
    clinicalHistory: 'Paciente com dispneia súbita e dor torácica pleurítica à direita. D-dímero elevado (1850 ng/mL). Tabagista 30 anos-maço.',
    keyFindings: [
      'Falha de enchimento parcial na artéria pulmonar interlobar direita compatível com Tromboembolismo Pulmonar (TEP agudo).',
      'Nódulo sólido espiculado de 8.2 x 7.6 mm no lobo superior direito (LSD), segmento apical.',
      'Sinais discretos de enfisema centrolobular em ápices pulmonares.'
    ],
    radiologyReport: 'CONCLUSÃO: 1. Falha de enchimento compatível com TEP em ramo arterial lobar inferior direito. 2. Nódulo pulmonar indeterminado no LSD categoria Lung-RADS 4A, recomendado PET-CT ou biópsia percutânea.',
    educationalTips: 'Na estação Canon Aquilion, utilize o filtro de convolução FC07/AiCE Body Sharp e acione SUREStart no tronco pulmonar (threshold 100 HU) para sincronização milimétrica do bolus.',
    slices: [
      {
        index: 12,
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 35, y: 30, label: 'Lobo Superior Direito (LSD)', huValue: -780 },
          { x: 65, y: 30, label: 'Lobo Superior Esquerdo (LSE)', huValue: -795 },
          { x: 50, y: 48, label: 'Arco Aórtico', huValue: 340 }
        ]
      },
      {
        index: 24,
        imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 38, y: 44, label: 'Artéria Pulmonar Direita (Falha de Enchimento / TEP)', huValue: 95 },
          { x: 52, y: 40, label: 'Tronco da Artéria Pulmonar Contrastado', huValue: 385 },
          { x: 30, y: 32, label: 'Nódulo Espiculado (8.2 mm)', huValue: 42 },
          { x: 50, y: 72, label: 'Corpo Vertebral T6', huValue: 780 }
        ]
      },
      {
        index: 36,
        imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 45, y: 55, label: 'Ventrículo Direito', huValue: 310 },
          { x: 58, y: 58, label: 'Ventrículo Esquerdo', huValue: 290 },
          { x: 50, y: 70, label: 'Aorta Torácica Descendente', huValue: 360 }
        ]
      }
    ]
  },
  {
    id: 'canon_tc_abdomen_liver',
    caseCode: 'CANON-AQU-002',
    name: 'TC de Abdômen Trifásico: Nódulo Hepático (CHC)',
    modality: 'CT',
    systemModel: 'Canon Aquilion PRIME SP',
    patientId: '202609-CAN-9912',
    patientName: 'ALBUQUERQUE, HELENA B.',
    patientSex: 'F',
    patientAge: '61Y',
    patientDOB: '03/05/1965',
    accessionNumber: 'ACC-912404',
    studyDate: '23/09/2026',
    studyTime: '14:15:33',
    seriesDescription: 'ABDOMEN 4-PHASE LIVER DUAL-ENERGY AIDR3D',
    bodyPartExamined: 'ABDOMEN',
    protocolName: 'LIVER_DYNAMIC_4PHASE_100KV',
    totalSlices: 56,
    currentSlice: 28,
    defaultPreset: 'liver',
    windowWidth: 280,
    windowLevel: 65,
    contrastMedia: {
      agent: 'Iopamidol (Iopamiron 370 mgI/mL)',
      volumeMl: 100,
      flowRate: 3.5,
      injectionDelaySec: 35,
      scanPhase: 'Fase Arterial Tardia'
    },
    clinicalHistory: 'Cirrose por hepatite C crônica em acompanhamento ambulatorial. Alfa-fetoproteína sérica em ascensão (145 ng/mL). Rastreio de hepatocarcinoma.',
    keyFindings: [
      'Fígado com contornos nodulares e sinais de hipertensão portal (esplenomegalia moderada).',
      'Nódulo de 2.8 cm no segmento hepático VIII com hiper-realce precoce na fase arterial e rápida lavagem (washout) na fase portal venosa.',
      'Cápsula tumoral periférica nítida na fase de equilíbrio tardia.'
    ],
    radiologyReport: 'CONCLUSÃO: Lesão hepática sólida hipervascular em segmento VIII com critérios de LI-RADS 5 (definitivamente Carcinoma Hepatocelular). Indicada avaliação para ablação térmica ou ressecção cirúrgica.',
    educationalTips: 'Na interface Canon, observe a janela hepática estreita (WW 280 / WL 65) que otimiza o contraste entre o parênquima hepático normal e nódulos displásicos.',
    slices: [
      {
        index: 18,
        imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 32, y: 48, label: 'Lobo Hepático Direito (Segmento VIII)', huValue: 135 },
          { x: 38, y: 44, label: 'CHC com Washout (Arterial 140 HU / Portal 55 HU)', huValue: 140 },
          { x: 70, y: 52, label: 'Baço (Esplenomegalia)', huValue: 110 },
          { x: 50, y: 62, label: 'Aorta Abdominal', huValue: 360 }
        ]
      },
      {
        index: 28,
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 42, y: 52, label: 'Veia Porta Principal', huValue: 165 },
          { x: 28, y: 60, label: 'Rim Direito', huValue: 180 },
          { x: 72, y: 60, label: 'Rim Esquerdo', huValue: 185 },
          { x: 50, y: 72, label: 'Corpo Vertebral L1', huValue: 650 }
        ]
      }
    ]
  },
  {
    id: 'canon_tc_neuro_stroke',
    caseCode: 'CANON-AQU-003',
    name: 'TC Crânio Urgência: AVC Isquêmico Hiperagudo',
    modality: 'CT',
    systemModel: 'Canon Aquilion ONE / Prism Edition',
    patientId: '202609-CAN-3319',
    patientName: 'SOUZA, MARIA DE LOURDES',
    patientSex: 'F',
    patientAge: '72Y',
    patientDOB: '22/08/1954',
    accessionNumber: 'ACC-773199',
    studyDate: '23/09/2026',
    studyTime: '08:20:11',
    seriesDescription: 'BRAIN NON-CONTRAST 0.5mm ULTRA-FAST',
    bodyPartExamined: 'HEAD',
    protocolName: 'STROKE_CODE_HEAD_120KV_AICE',
    totalSlices: 32,
    currentSlice: 16,
    defaultPreset: 'brain',
    windowWidth: 80,
    windowLevel: 35,
    contrastMedia: {
      agent: 'Nenhum (Protocolo Sem Contraste Pré-Trombólise)',
      volumeMl: 0,
      flowRate: 0,
      injectionDelaySec: 0,
      scanPhase: 'Pré-Contraste'
    },
    clinicalHistory: 'Déficit neurológico súbito há 70 minutos: hemiplegia à esquerda e desvio do olhar conjugado. Escala NIHSS = 17. Código AVC ativado.',
    keyFindings: [
      'TC sem evidência de hemorragia intraparenquimatosa ou subaracnóidea aguda.',
      'Sinal precoce de isquemia: atenuação com perda da diferenciação córtico-subcortical na fita insular direita (Sinal da Fita Insular).',
      'Apagamento dos sulcos corticais na convexidade têmporo-parietal direita.',
      'Escore ASPECTS = 8.'
    ],
    radiologyReport: 'CONCLUSÃO: TC de crânio sem hemorragia, com sinais de isquemia hiperaguda em território da artéria cerebral média direita (ASPECTS 8). Paciente elegível dentro da janela terapêutica para trombólise EV e trombectomia mecânica.',
    educationalTips: 'Na janela cerebral padrão Canon (WW 80 / WL 35), ajuste com mouse para WW 60 / WL 30 para acentuar a perda de contraste córtico-subcortical característica do edema citotóxico.',
    slices: [
      {
        index: 16,
        imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 34, y: 46, label: 'Córtex Insular Direito (Sinal da Fita)', huValue: 24 },
          { x: 66, y: 46, label: 'Córtex Insular Esquerdo Normal', huValue: 36 },
          { x: 44, y: 50, label: 'Núcleo Lentiforme Direito', huValue: 28 },
          { x: 50, y: 50, label: 'III Ventrículo Centrado', huValue: 6 }
        ]
      }
    ]
  },
  {
    id: 'canon_c_arm_vascular',
    caseCode: 'CANON-ALP-004',
    name: 'Centro Cirúrgico: Arco Cirúrgico & Angiografia (C-Arm)',
    modality: 'XA',
    systemModel: 'Canon Alphenix Biplane',
    patientId: '202609-CAN-4158',
    patientName: 'DIAS, SEBASTIÃO MENDES',
    patientSex: 'M',
    patientAge: '68Y',
    patientDOB: '19/02/1958',
    accessionNumber: 'ACC-815499',
    studyDate: '23/09/2026',
    studyTime: '15:50:00',
    seriesDescription: 'FLUORO INTRAOP ROADMAPPING DSA 7.5pps',
    bodyPartExamined: 'LOWER EXTREMITY',
    protocolName: 'FEMORAL_ANGIOPLASTY_LOW_DOSE',
    totalSlices: 20,
    currentSlice: 10,
    defaultPreset: 'bone',
    windowWidth: 2000,
    windowLevel: 450,
    contrastMedia: {
      agent: 'Iodixanol (Visipaque 320 mgI/mL iso-osmolar)',
      volumeMl: 30,
      flowRate: 3.0,
      injectionDelaySec: 0,
      scanPhase: 'Fase Arterial Precoce'
    },
    clinicalHistory: 'Claudicação limitante para 50 metros. Oclusão de artéria femoral superficial direita indicada para angioplastia e implante de stent sob escopia contínua.',
    keyFindings: [
      'Subtração Digital de Angiografia (DSA) demonstra estenose crítica de 95% em terço médio de AFS direita com 4 cm de extensão.',
      'Recarga distal por colaterais geniculares.',
      'Sucesso no implante de stent autoexpansível 6x60mm com restauração de fluxo distal trifásico.'
    ],
    radiologyReport: 'CONCLUSÃO: Angioplastia intraoperatória em arco cirúrgico concluída com sucesso. Sem dissecção residual, perfuração ou trombose aguda. Pulsos distais pedioso e tibial posterior restaurados.',
    educationalTips: 'No arco Alphenix Canon, mantenha a escopia pulsada em 7.5 quadros/s e utilize o colimador automático para reduzir a radiação espalhada para o cirurgião e instrumentador.',
    slices: [
      {
        index: 10,
        imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
        anatomicalLabels: [
          { x: 48, y: 35, label: 'Artéria Femoral Superficial (Stent 6x60mm)', huValue: 420 },
          { x: 38, y: 60, label: 'Diáfise Femoral', huValue: 980 },
          { x: 54, y: 70, label: 'Fluxo Contrastado Run-off Distal', huValue: 310 }
        ]
      }
    ]
  }
];
