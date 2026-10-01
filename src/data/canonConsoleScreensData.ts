export interface ActivionScanProtocol {
  protocolCode: string;
  protocolName: string;
  bodyRegion: 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'VASCULAR' | 'CARDIAC' | 'EXTREMITIES';
  patientPosition: 'Head First Supine (HFS)' | 'Feet First Supine (FFS)' | 'Head First Prone (HFP)';
  scoutType: 'Dual Scano (AP + LAT)' | 'LAT Scano 250mm' | 'AP Scano 450mm' | 'AP Scano 500mm';
  scoutLength: string; // e.g. "350mm"
  scoutKv: string;
  scoutMa: string;
  scanType: 'Helical' | 'Sequential' | 'Dynamic' | 'ECG-Gated Helical';
  scanKv: '80kV' | '100kV' | '120kV' | '135kV';
  scanMa: string; // e.g. "220mAs" or "SUREExposure 3D Auto"
  rotationTime: string; // "0.5s", "0.75s", "1.0s"
  sliceCollimation: string; // "16 x 0.5mm", "16 x 1.0mm"
  pitch: string; // "HP 11.0", "HP 15.0", "0.813"
  tableSpeed: string; // "13.75 mm/rot"
  scanRange: { start: string; end: string }; // e.g. "C1 Foramen" to "Vertex"
  gantryTilt: string; // "0°", "15°", "-10°"
  fovSize: 'Small (180mm)' | 'Medium (240mm)' | 'Large (320mm)' | 'LL (400mm)';
  voicePrompt: string; // "Respire fundo e prenda a respiração", "Não engula", "Permaneça imóvel"
  contrastInjected: boolean;
  contrastProtocol?: {
    volume: string;
    flow: string;
    delay: string;
    triggerHu: number;
    triggerVessel: string;
  };
  filterKernel: string; // "FC13 Brain", "FC07 Lung", "FC30 Bone", "FC01 Standard"
  doseEstimate: {
    ctdiVol: number; // mGy
    dlp: number; // mGy*cm
  };
  clinicalIndication: string;
}

export interface Activion3DParameters {
  renderMode: 'Volume Rendering (VR)' | 'Shaded Surface Display (SSD)' | 'MIP Angio' | 'Virtual Endoscopy';
  colorMap: 'Bone & Vessel Contrast' | 'Soft Tissue / Muscle' | 'Airways (Bronchogram)' | 'Bone High Opacity';
  windowLevel: number;
  windowWidth: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoom: number;
  cutPlaneActive: boolean;
  cutPlaneDepth: number; // %
}

export interface ActivionFilmingSheet {
  sheetFormat: '3 x 4 (12 Img)' | '4 x 5 (20 Img)' | '2 x 3 (6 Img)' | '1 x 1 (Single Full)';
  filmSize: '14 x 17 in' | '11 x 14 in' | '8 x 10 in';
  copies: number;
  selectedSeries: string;
  startSlice: number;
  endSlice: number;
  interval: number;
  totalFilms: number;
  targetPrinter: string;
}

export interface RawDataReconstructionPlan {
  reconMatrix: '512 x 512' | '1024 x 1024 High-Res';
  filterKernel: 'FC01 (Standard Soft)' | 'FC07 (Lung Sharp)' | 'FC13 (Brain Soft)' | 'FC30 (Bone High-Freq)' | 'FC52 (Inner Ear/HRCT)';
  iterativeDenoising: 'AIDR 3D Standard' | 'AIDR 3D Strong' | 'AiCE Deep Learning';
  sliceThickness: '0.5mm' | '0.7mm' | '1.0mm' | '2.0mm' | '5.0mm';
  sliceInterval: '0.5mm' | '0.7mm' | '1.0mm' | '2.0mm' | '5.0mm';
  fovDiameter: string; // "240mm"
}

export const SCAN_PROTOCOLS: Record<string, ActivionScanProtocol> = {
  head_emergency: {
    protocolCode: 'CANON-EMERG-CRN-01',
    protocolName: 'TC DE CRÂNIO (PROTOCOLO EMERGÊNCIA / AVC HIPERAGUDO / POLITRAUMA)',
    bodyRegion: 'HEAD',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'Dual Scano (AP + LAT)',
    scoutLength: '250mm Lat/AP',
    scoutKv: '120kV',
    scoutMa: '30mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '300mAs (SUREExposure 3D Low-Noise / Ultra-Fast)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 11.0 (0.688)',
    tableSpeed: '11.0 mm/rot',
    scanRange: { start: 'Forame Magno / C1', end: 'Vértex Craniano' },
    gantryTilt: '0° (Correção Digital MPR)',
    fovSize: 'Medium (240mm)',
    voicePrompt: 'Atenção: Permaneça perfeitamente imóvel. Aquisição rápida de emergência em andamento.',
    contrastInjected: false,
    filterKernel: 'FC13 (Brain Soft) + FC30 (Bone Trauma) + AIDR 3D Strong',
    doseEstimate: { ctdiVol: 52.0, dlp: 720 },
    clinicalIndication: 'Protocolo institucional de AVC Hiperagudo (< 4.5h), traumatismo crânio-encefálico (TCE grave/moderado), hemorragia intracraniana aguda, hematoma subdural/epidural e exclusão rápida de sangramento pré-trombólise.'
  },
  head_routine: {
    protocolCode: 'CANON-CRN-01',
    protocolName: 'CRÂNIO ROTINA HELICAL (Trauma / AVC / Cefaleia)',
    bodyRegion: 'HEAD',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'LAT Scano 250mm',
    scoutLength: '250mm Lat',
    scoutKv: '120kV',
    scoutMa: '30mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '250mAs (SUREExposure 3D)',
    rotationTime: '0.75s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 11.0 (0.688)',
    tableSpeed: '11.0 mm/rot',
    scanRange: { start: 'Forame Magno / Base', end: 'Vértex Craniano' },
    gantryTilt: '15° (Linha Órbito-Meatal OM)',
    fovSize: 'Medium (240mm)',
    voicePrompt: 'Mantenha a cabeça perfeitamente imóvel durante a varredura.',
    contrastInjected: false,
    filterKernel: 'FC13 (Brain Soft) + FC30 (Bone)',
    doseEstimate: { ctdiVol: 48.5, dlp: 680 },
    clinicalIndication: 'Investigação de trauma crânio-encefálico, hemorragia subaracnóidea, AVC isquêmico/hemorrágico e cefaleia súbita.'
  },
  head_angio: {
    protocolCode: 'CANON-ANGIO-01',
    protocolName: 'ANGIO-TC DE CRÂNIO E CARÓTIDAS (SUREStart Willis)',
    bodyRegion: 'VASCULAR',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'Dual Scano (AP + LAT)',
    scoutLength: '350mm AP/LAT',
    scoutKv: '120kV',
    scoutMa: '40mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '300mAs',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 15.0 (0.938)',
    tableSpeed: '18.75 mm/rot',
    scanRange: { start: 'Arco Aórtico C7', end: 'Vértex (Polígono de Willis)' },
    gantryTilt: '0°',
    fovSize: 'Medium (240mm)',
    voicePrompt: 'Não engula a saliva e não se mova durante a injeção.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '60 mL Iopamiron 370 + 30 mL Salina',
      flow: '4.5 mL/s',
      delay: 'SUREStart 140 HU no Arco Aórtico',
      triggerHu: 140,
      triggerVessel: 'Arco Aórtico / Carótida Comum'
    },
    filterKernel: 'FC01 (Vascular Sharp) + MIP Angio',
    doseEstimate: { ctdiVol: 22.4, dlp: 520 },
    clinicalIndication: 'Aneurisma intracraniano, estenose carotídea, oclusão de grandes vasos (AVC isquêmico hiperagudo) e malformações arteriovenosas (MAV).'
  },
  mastoid_hrct: {
    protocolCode: 'CANON-EAR-02',
    protocolName: 'MASTÓIDES / OSSO TEMPORAL (Ultra HRCT 0.5mm)',
    bodyRegion: 'HEAD',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'LAT Scano 250mm',
    scoutLength: '180mm Lat',
    scoutKv: '120kV',
    scoutMa: '30mA',
    scanType: 'Sequential',
    scanKv: '120kV',
    scanMa: '200mAs',
    rotationTime: '1.0s',
    sliceCollimation: '16 x 0.5mm',
    pitch: '1.0 (Sequencial Isométrica)',
    tableSpeed: '8.0 mm/rot',
    scanRange: { start: 'Canal Auditivo Externo', end: 'Ápice Petroso' },
    gantryTilt: '0°',
    fovSize: 'Small (180mm)',
    voicePrompt: 'Permaneça perfeitamente imóvel.',
    contrastInjected: false,
    filterKernel: 'FC52 (Ultra Sharp Bone Matrix)',
    doseEstimate: { ctdiVol: 35.0, dlp: 390 },
    clinicalIndication: 'Colesteatoma, otite média crônica, fratura de rochedo, implante coclear e otosclerose com cadeia ossicular.'
  },
  sinuses_face: {
    protocolCode: 'CANON-FACE-01',
    protocolName: 'SEIOS DA FACE / FACE 3D (Trauma e Sinusite)',
    bodyRegion: 'HEAD',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'LAT Scano 250mm',
    scoutLength: '220mm Lat',
    scoutKv: '120kV',
    scoutMa: '30mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '160mAs (Low Dose)',
    rotationTime: '0.75s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 11.0',
    tableSpeed: '11.0 mm/rot',
    scanRange: { start: 'Palato Duro / Mandíbula', end: 'Seio Frontal' },
    gantryTilt: '0° (Reconstrução MPR)',
    fovSize: 'Small (180mm)',
    voicePrompt: 'Mantenha os olhos fechados e a cabeça imóvel.',
    contrastInjected: false,
    filterKernel: 'FC30 (Bone) + FC13 (Soft Tissue)',
    doseEstimate: { ctdiVol: 12.8, dlp: 210 },
    clinicalIndication: 'Sinusopatia crônica, polipose nasossinusal, desvio septal, fraturas maxilofaciais (Le Fort) e planejamento cirúrgico funcional (FESS).'
  },
  cervical_spine: {
    protocolCode: 'CANON-COL-01',
    protocolName: 'COLUNA CERVICAL TRAUMA (C1 a T1 Helical)',
    bodyRegion: 'SPINE',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'LAT Scano 250mm',
    scoutLength: '280mm Lat',
    scoutKv: '120kV',
    scoutMa: '40mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '260mAs (SUREExposure 3D)',
    rotationTime: '0.75s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 11.0',
    tableSpeed: '11.0 mm/rot',
    scanRange: { start: 'Clívus / C1 Atlas', end: 'Corpo Vertebral T2' },
    gantryTilt: '0°',
    fovSize: 'Small (180mm)',
    voicePrompt: 'Não engula e não se mexa.',
    contrastInjected: false,
    filterKernel: 'FC30 (Bone 0.5mm) + FC13 (Disc Soft)',
    doseEstimate: { ctdiVol: 28.5, dlp: 460 },
    clinicalIndication: 'Fraturas vertebrais por mecanismo de chicote, luxação atlanto-axial, compressão medular e hérnia discal cervical.'
  },
  lumbar_spine: {
    protocolCode: 'CANON-COL-02',
    protocolName: 'COLUNA LOMBOSSACRA (L1 a S1 Discopatia)',
    bodyRegion: 'SPINE',
    patientPosition: 'Feet First Supine (FFS)',
    scoutType: 'LAT Scano 250mm',
    scoutLength: '350mm Lat',
    scoutKv: '135kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '135kV',
    scanMa: '300mAs (SUREExposure 3D)',
    rotationTime: '0.75s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 11.0',
    tableSpeed: '11.0 mm/rot',
    scanRange: { start: 'Platô Superior L1', end: 'Segmento S2' },
    gantryTilt: '0° (Planejamento Gantry Tilt Automático)',
    fovSize: 'Medium (240mm)',
    voicePrompt: 'Respire normalmente sem movimentar o abdome.',
    contrastInjected: false,
    filterKernel: 'FC30 (Bone) + FC01 (Soft)',
    doseEstimate: { ctdiVol: 24.2, dlp: 540 },
    clinicalIndication: 'Lombociatalgia, hérnia de disco lombar (L4-L5, L5-S1), espondilolistese, estenose do canal vertebral e pós-operatório com parafusos pediculares.'
  },
  chest_hrct: {
    protocolCode: 'CANON-TX-HRCT-01',
    protocolName: 'TC DE TÓRAX (ALTA RESOLUÇÃO / HRCT PARÊNQUIMA PULMONAR)',
    bodyRegion: 'CHEST',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 450mm',
    scoutLength: '450mm AP',
    scoutKv: '120kV',
    scoutMa: '40mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '150mAs (SUREExposure 3D Low-Dose Intersticial)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm (Recon 0.5mm / Incremento 0.5mm)',
    pitch: 'HP 15.0 (0.938) - Apneia Única < 4.5s',
    tableSpeed: '20.0 mm/rot',
    scanRange: { start: 'Ápices Pulmonares (1cm acima das clavículas)', end: 'Seios Recessos Costofrênicos' },
    gantryTilt: '0°',
    fovSize: 'Large (320mm)',
    voicePrompt: 'Atenção: Respire fundo... prenda a respiração!',
    contrastInjected: false,
    filterKernel: 'FC07 (Lung High-Res Kernel) + FC01 (Mediastino)',
    doseEstimate: { ctdiVol: 8.2, dlp: 265 },
    clinicalIndication: 'Avaliação detalhada do interstício pulmonar, fibrose pulmonar idiopática (UIP/NSIP), enfisema centrolobular/panacinar, bronquiectasias de tração, faveolamento subpleural e padrão em vidro fosco.'
  },
  chest_angio: {
    protocolCode: 'CANON-TX-04',
    protocolName: 'ANGIO-TC DE TÓRAX PARA TEP (SUREStart Pulmonar)',
    bodyRegion: 'CHEST',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 450mm',
    scoutLength: '450mm AP',
    scoutKv: '120kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '240mAs (SUREExposure 3D)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 15.0',
    tableSpeed: '20.0 mm/rot',
    scanRange: { start: 'Ápices Pulmonares', end: 'Cúpulas Diafragmáticas' },
    gantryTilt: '0°',
    fovSize: 'Large (320mm)',
    voicePrompt: 'Atenção: respire fundo e prenda a respiração.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '75 mL Iohexol 350 + 40 mL Salina',
      flow: '4.5 mL/s',
      delay: 'SUREStart 120 HU no Tronco Pulmonar',
      triggerHu: 120,
      triggerVessel: 'Tronco da Artéria Pulmonar'
    },
    filterKernel: 'FC01 (Vascular Mediastino) + FC07 (Lung)',
    doseEstimate: { ctdiVol: 11.2, dlp: 340 },
    clinicalIndication: 'Suspeita clínica de tromboembolismo pulmonar (TEP agudo), falha de enchimento arterial e hipertensão pulmonar.'
  },
  abdomen_contrast: {
    protocolCode: 'CANON-ABD-CONT-01',
    protocolName: 'TC DE ABDÔMEN TOTAL (CONTRASTE / ARTERIAL 35s & PORTAL 70s)',
    bodyRegion: 'ABDOMEN',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 500mm',
    scoutLength: '500mm AP',
    scoutKv: '120kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '240mAs (SUREExposure 3D Modulação por Voxel)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm (Recon 1.0mm)',
    pitch: 'HP 15.0 (0.938)',
    tableSpeed: '20.0 mm/rot',
    scanRange: { start: 'Cúpulas Diafragmáticas (T10)', end: 'Sínfise Púbica / Base da Pelve' },
    gantryTilt: '0°',
    fovSize: 'LL (400mm)',
    voicePrompt: 'Atenção: Respire fundo... segure o ar durante a passagem do contraste.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '110 mL Iopamiron 370 + 40 mL Flush Salina',
      flow: '3.5 a 4.0 mL/s',
      delay: 'Fase Arterial: 30-35s (SUREStart 140 HU Aorta) | Fase Portal: 65-70s | Fase Tardia: 180s',
      triggerHu: 140,
      triggerVessel: 'Aorta Abdominal / Tronco Celíaco'
    },
    filterKernel: 'FC01 (Abdominal Standard Soft Tissue) + AIDR 3D',
    doseEstimate: { ctdiVol: 13.8, dlp: 650 },
    clinicalIndication: 'Avaliação multifásica de órgãos parenquimatosos (fígado, baço, pâncreas, adrenais, rins), vascularização arterial/portal mesentérica, estadiamento oncológico, abdome agudo inflamatório (apendicite, diverticulite) e trauma abdominal.'
  },
  abdomen_routine: {
    protocolCode: 'CANON-ABD-01',
    protocolName: 'ABDOME TOTAL E PELVE ROTINA (Portal 70s)',
    bodyRegion: 'ABDOMEN',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 500mm',
    scoutLength: '500mm AP',
    scoutKv: '120kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '220mAs (SUREExposure 3D)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 15.0',
    tableSpeed: '20.0 mm/rot',
    scanRange: { start: 'Cúpulas Diafragmáticas (T10)', end: 'Sínfise Púbica' },
    gantryTilt: '0°',
    fovSize: 'LL (400mm)',
    voicePrompt: 'Respire fundo e prenda a respiração.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '100 mL Iopamiron 370 + 30 mL Salina',
      flow: '3.0 mL/s',
      delay: 'Fase Portal Fixa (70 segundos)',
      triggerHu: 120,
      triggerVessel: 'Fase Portal Parenquimatosa'
    },
    filterKernel: 'FC01 (Standard Soft Tissue)',
    doseEstimate: { ctdiVol: 13.5, dlp: 620 },
    clinicalIndication: 'Dor abdominal aguda, apendicite, diverticulite, colecistite, estadiamento oncológico e linfadenopatia.'
  },
  abdomen_tri: {
    protocolCode: 'CANON-ABD-02',
    protocolName: 'ABDOME TOTAL TRIFÁSICO HEPÁTICO (Sem + Arterial + Portal + Tardio)',
    bodyRegion: 'ABDOMEN',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 500mm',
    scoutLength: '500mm AP',
    scoutKv: '120kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '240mAs (SUREExposure 3D)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 15.0',
    tableSpeed: '20.0 mm/rot',
    scanRange: { start: 'Cúpulas Diafragmáticas', end: 'Cristas Ilíacas / Sínfise' },
    gantryTilt: '0°',
    fovSize: 'LL (400mm)',
    voicePrompt: 'Atenção: respire fundo e prenda a respiração.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '120 mL Iopamiron 370 + 40 mL Salina',
      flow: '4.0 mL/s',
      delay: 'SUREStart Aorta + 35s (Arterial), 70s (Portal), 180s (Tardio)',
      triggerHu: 140,
      triggerVessel: 'Aorta Abdominal Tronco Celíaco'
    },
    filterKernel: 'FC01 (Abdominal Standard)',
    doseEstimate: { ctdiVol: 28.6, dlp: 1240 },
    clinicalIndication: 'Caracterização de nódulos hepáticos (Hepatocarcinoma CHC, Hemangioma, Hiperplasia Nodular Focal HNF), metástases e lesões pancreáticas.'
  },
  uro_tc: {
    protocolCode: 'CANON-URO-01',
    protocolName: 'UROTOMOGRAFIA (Uro-TC Excretora para Vias Urinárias)',
    bodyRegion: 'ABDOMEN',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 500mm',
    scoutLength: '500mm AP',
    scoutKv: '120kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '200mAs',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 15.0',
    tableSpeed: '20.0 mm/rot',
    scanRange: { start: 'Pólos Renais Superiores (T11)', end: 'Base da Bexiga' },
    gantryTilt: '0°',
    fovSize: 'LL (400mm)',
    voicePrompt: 'Respire fundo e segure o ar.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '100 mL Iopamiron 370',
      flow: '3.0 mL/s',
      delay: 'Fase Sem Contraste + Fase Nefrográfica (100s) + Fase Excretora (10 min)',
      triggerHu: 120,
      triggerVessel: 'Parenquimatoso Renal'
    },
    filterKernel: 'FC01 + Reconstrução Coronal MIP 3D',
    doseEstimate: { ctdiVol: 18.2, dlp: 890 },
    clinicalIndication: 'Hematúria macroscópica, carcinoma urotelial, litíase ureteral (cálculos) e estenose de junção ureteropiélica (JUP).'
  },
  calcium_score: {
    protocolCode: 'CANON-CARD-01',
    protocolName: 'ESCORE DE CÁLCIO CORONARIANO (ECG-Gated Agatston)',
    bodyRegion: 'CARDIAC',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 450mm',
    scoutLength: '300mm AP',
    scoutKv: '120kV',
    scoutMa: '30mA',
    scanType: 'ECG-Gated Helical',
    scanKv: '120kV',
    scanMa: '220mAs (Sincronizado ECG R-R 75%)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm (Recon 3.0mm)',
    pitch: '0.2 (Gated Prospectivo)',
    tableSpeed: '6.0 mm/rot',
    scanRange: { start: 'Carina / Tronco Pulmonar', end: 'Ápice Cardíaco' },
    gantryTilt: '0°',
    fovSize: 'Medium (240mm)',
    voicePrompt: 'Atenção: respire fundo, solte todo o ar e prenda.',
    contrastInjected: false,
    filterKernel: 'FC01 Standard Cardiac Filter',
    doseEstimate: { ctdiVol: 6.5, dlp: 95 },
    clinicalIndication: 'Estratificação de risco cardiovascular em pacientes assintomáticos, quantificação de placa calcificada nas artérias coronárias (DA, CX, CD).'
  },
  aorta_total: {
    protocolCode: 'CANON-VAS-02',
    protocolName: 'ANGIO-TC DE AORTA TOTAL (Toracoabdominal com Dissecção)',
    bodyRegion: 'VASCULAR',
    patientPosition: 'Head First Supine (HFS)',
    scoutType: 'AP Scano 500mm',
    scoutLength: '700mm AP',
    scoutKv: '120kV',
    scoutMa: '50mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '280mAs (SUREExposure 3D)',
    rotationTime: '0.5s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 15.0',
    tableSpeed: '22.0 mm/rot',
    scanRange: { start: 'Ápices Torácicos (Subclávias)', end: 'Bifurcação Femoral Comum' },
    gantryTilt: '0°',
    fovSize: 'LL (400mm)',
    voicePrompt: 'Respire fundo e não se mexa durante a injeção rápida.',
    contrastInjected: true,
    contrastProtocol: {
      volume: '110 mL Iopamiron 370 + 40 mL Salina',
      flow: '5.0 mL/s',
      delay: 'SUREStart 150 HU na Aorta Torácica Descendente',
      triggerHu: 150,
      triggerVessel: 'Aorta Torácica Descendente'
    },
    filterKernel: 'FC01 + Angio MIP 3D + Curved MPR',
    doseEstimate: { ctdiVol: 19.5, dlp: 1180 },
    clinicalIndication: 'Aneurisma de aorta toracoabdominal, dissecção aguda de aorta (Stanford A/B), planejamento de endoprótese vascular e úlcera aórtica penetrante.'
  },
  knee_joint: {
    protocolCode: 'CANON-MSK-01',
    protocolName: 'JOELHO / ARTICULAÇÃO 3D (Fratura e Artro-TC)',
    bodyRegion: 'EXTREMITIES',
    patientPosition: 'Feet First Supine (FFS)',
    scoutType: 'Dual Scano (AP + LAT)',
    scoutLength: '250mm AP/LAT',
    scoutKv: '120kV',
    scoutMa: '30mA',
    scanType: 'Helical',
    scanKv: '120kV',
    scanMa: '180mAs',
    rotationTime: '0.75s',
    sliceCollimation: '16 x 0.5mm',
    pitch: 'HP 11.0',
    tableSpeed: '11.0 mm/rot',
    scanRange: { start: '10cm acima da patela', end: 'Tuberosidade Anterior da Tíbia' },
    gantryTilt: '0°',
    fovSize: 'Small (180mm)',
    voicePrompt: 'Mantenha a perna relaxada e imóvel.',
    contrastInjected: false,
    filterKernel: 'FC30 (Bone Ultra Sharp) + FC13 (Soft)',
    doseEstimate: { ctdiVol: 8.5, dlp: 140 },
    clinicalIndication: 'Fratura de platô tibial (Schatzker), lesão osteocondral, corpos livres intra-articulares e avaliação de alinhamento patelofemoral.'
  }
};

