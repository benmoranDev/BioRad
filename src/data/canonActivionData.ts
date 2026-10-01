export interface ActivionViewport {
  plane: 'coronal' | 'sagittal' | 'axial' | '3d';
  title: string;
  image: string;
  sliceText: string;
  windowInfo: string;
  patientInfo: string;
  boxColor: string; // green, orange, cyan reference lines
}

export interface RealActivionCase {
  id: string;
  caseCode: string;
  patientName: string;
  patientId: string;
  protocolName: string;
  studyDateTime: string;
  kv: string;
  ma: string;
  rotTime: string;
  hp: string;
  thickness: string;
  ww: number;
  wl: number;
  totalImages: number;
  currentSlice: number;
  findingDescription: string;
  educationalNotes: string;
  images: {
    coronal: string;
    sagittal: string;
    axial: string;
    boneAxial?: string;
  };
}

export const CANON_ACTIVION_CASES: RealActivionCase[] = [
  {
    id: 'case_cranio_emergencia',
    caseCode: 'Cod. TC04 (EMERGÊNCIA)',
    patientName: 'SILVA, MARCOS ANTÔNIO (SALA VERMELHA)',
    patientId: 'EMERG-9941',
    protocolName: 'TC DE CRÂNIO (PROT. EMERGÊNCIA / AVC HIPERAGUDO)',
    studyDateTime: '2024.11.02 03:17:45.120',
    kv: '120kV',
    ma: '300mAs',
    rotTime: '0.5s/0.5mm',
    hp: 'HP11.0',
    thickness: '0.5mm',
    ww: 88,
    wl: 40,
    totalImages: 24,
    currentSlice: 12,
    findingDescription: 'TC de Crânio Protocolo Emergência realizada em modo Helical ultra-rápido (0.5s) com 120kV e 300mAs. Ausência de sinais de hemorragia intra ou extra-axial aguda (descarte de hematoma subdural e epidural). Sulcos corticais e cisternas da base pérvios sem apagamento precoce. Janela óssea íntegra sem traços de fratura na calota.',
    educationalNotes: 'No padrão Canon Aquilion para protocolo de emergência, a rotação ultra-rápida de 0.5s combinada com 120kV e 300mAs minimiza artefatos de movimentação em pacientes críticos/agitados, garantindo alta relação sinal-ruído para identificar sinais precoces de isquemia e exclusão de sangramento para trombólise.',
    images: {
      coronal: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
      sagittal: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      axial: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      boneAxial: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    id: 'case_abdomen_contraste',
    caseCode: 'Cod. TC06 (ABDÔMEN CONTRASTE)',
    patientName: 'SOUZA, RODRIGO MENDONÇA',
    patientId: 'ABD-5519',
    protocolName: 'TC DE ABDÔMEN TOTAL (CONTRASTE / ARTERIAL & PORTAL)',
    studyDateTime: '2024.11.08 15:20:33.410',
    kv: '120kV',
    ma: '240mAs',
    rotTime: '0.5s/0.5mm',
    hp: 'HP15.0',
    thickness: '1.0mm',
    ww: 320,
    wl: 45,
    totalImages: 24,
    currentSlice: 12,
    findingDescription: 'TC de Abdômen Total com contraste iodado endovenoso em fases arterial (35s) e portal (70s). Fígado com atenuação homogênea na fase portal, sem lesões hipervasculares suspeitas. Baço, pâncreas, adrenais e rins anatômicos. Ausência de linfonodomegalias ou líquido livre peritoneal.',
    educationalNotes: 'No padrão Canon Aquilion para abdômen com contraste, o delay arterial de 30-35s e portal de 65-70s (120kV / 240mAs) assegura diferenciação ótima de parênquima e vasos portomesentéricos. Janelamento de rotina em WL:45 / WW:320.',
    images: {
      coronal: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
      sagittal: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      axial: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      boneAxial: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    id: 'case_torax_hrct',
    caseCode: 'Cod. TC05 (HRCT PULMÃO)',
    patientName: 'ALMEIDA, BEATRIZ NOGUEIRA',
    patientId: 'PULMO-7732',
    protocolName: 'TC DE TÓRAX (ALTA RESOLUÇÃO / HRCT PARÊNQUIMA)',
    studyDateTime: '2024.10.14 11:45:10.880',
    kv: '120kV',
    ma: '150mAs',
    rotTime: '0.5s/0.5mm',
    hp: 'HP15.0',
    thickness: '0.5mm',
    ww: 1500,
    wl: -600,
    totalImages: 24,
    currentSlice: 12,
    findingDescription: 'TC de Tórax em Alta Resolução (HRCT) sem contraste com janela pulmonar (WW:1500, WL:-600). Preservação da arquitetura vascular e bronquiolar, sem evidências de faveolamento subpleural, espessamento de septos interlobulares ou aprisionamento aéreo.',
    educationalNotes: 'No padrão Canon Aquilion para HRCT de parênquima pulmonar, a janela opera em WL=-600 / WW=1500, combinada com filtro FC07 de alta frequência e colimação 16x0.5mm. O pitch HP15.0 permite cobrir todo o tórax em menos de 5 segundos, eliminando artefatos de respiração.',
    images: {
      coronal: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      sagittal: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
      axial: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      boneAxial: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    id: 'case_karina_cranio',
    caseCode: 'Cod. TC01',
    patientName: 'KARINA MEIRELES FERREIRA SA',
    patientId: '40678',
    protocolName: 'TC CRANIO ULTRA-FAST 0.5mm Activion16',
    studyDateTime: '2024.04.11 14:29:24.777',
    kv: '120kV',
    ma: '180mAs',
    rotTime: '1.0s/0.5mm',
    hp: 'HP11.0',
    thickness: '0.7mm',
    ww: 88,
    wl: 40,
    totalImages: 20278,
    currentSlice: 736,
    findingDescription: 'Tomografia Computadorizada de Crânio em cortes multiplanares (Axial, Coronal e Sagital) demonstrando diferenciação de substância branca e cinzenta, sistema ventricular supratentorial simétrico e estruturas ósseas da calota craniana preservadas sem desvios de linha média.',
    educationalNotes: 'No console Canon Activion 16, a janela de crânio padrão opera em WL=40 / WW=88 com espessura de corte reconstruída em 0.7mm e avanço de mesa HP11.0. As linhas de referência coloridas (verde, vermelho e ciano) representam a projeção espacial dos cortes nos outros 2 planos ortogonais.',
    images: {
      coronal: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
      sagittal: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      axial: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      boneAxial: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    id: 'case_torax_tep',
    caseCode: 'Cod. TC02',
    patientName: 'FERREIRA, CARLOS EDUARDO',
    patientId: '42109',
    protocolName: 'ANGIO-TC TORAX TEP SURESTART Activion16',
    studyDateTime: '2024.08.19 09:14:02.112',
    kv: '120kV',
    ma: '220mAs',
    rotTime: '0.75s/0.5mm',
    hp: 'HP15.0',
    thickness: '1.0mm',
    ww: 1500,
    wl: -600,
    totalImages: 14500,
    currentSlice: 412,
    findingDescription: 'Angiotomografia do tórax com contraste iodado sincronizado no tronco da artéria pulmonar evidenciando parênquima pulmonar com padrão de atenuação preservado e janela de mediastino identificando realce de grandes vasos.',
    educationalNotes: 'Para avaliação pulmonar no Activion 16, alternar a tecla Tool1/Tool2 entre janela pulmonar (WW 1500 / WL -600) e janela de mediastino (WW 400 / WL 40). O modo Batch MPR permite exportar séries contínuas para o PACS.',
    images: {
      coronal: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      sagittal: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      axial: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    id: 'case_abdomen_chc',
    caseCode: 'Cod. TC03',
    patientName: 'ALBUQUERQUE, HELENA B.',
    patientId: '43811',
    protocolName: 'TC ABDOMEN TOTAL MULTIFASICO Activion16',
    studyDateTime: '2024.10.05 16:45:19.450',
    kv: '120kV',
    ma: '240mAs',
    rotTime: '0.75s/0.5mm',
    hp: 'HP13.5',
    thickness: '1.25mm',
    ww: 280,
    wl: 65,
    totalImages: 18200,
    currentSlice: 890,
    findingDescription: 'TC abdominal contrastada multifásica com estudo detalhado do parênquima hepático, baço, rins e grandes vasos retroperitoneais com realce arterial homogêneo e fase portal venosa.',
    educationalNotes: 'Utilize a ferramenta Measure / ROI na paleta Tool1 para mensuração de atenuação em Unidades Hounsfield (HU) nas fases pré-contraste, arterial e portal.',
    images: {
      coronal: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      sagittal: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
      axial: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    }
  }
];
