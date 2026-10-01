import { CursoLivre } from '../types';

export const initialCursosLivres: CursoLivre[] = [
  {
    id: 'cl_radioprotecao_40h',
    code: 'CL-RAD-4001',
    title: 'Radioproteção, Dosimetria & Normas Sanitárias RDC 330',
    subtitle: 'Princípio ALARA, Cálculo de CTDIvol, DLP, Dose Efetiva, Blindagens e PGQ',
    category: 'Radioproteção',
    workloadHours: 40,
    price: 139.00,
    originalPrice: 279.00,
    installments: 12,
    rating: 4.97,
    reviewCount: 284,
    enrolledStudentsCount: 940,
    instructor: 'Prof. Cláudio Silveira',
    instructorTitle: 'Supervisor de Radioproteção Qualificado CNEN & Físico Médico',
    instructorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    description: 'Curso livre de 40 horas indispensável para profissionais que operam equipamentos emissores de radiação ionizante. Fornece conhecimento aprofundado da Resolução RDC 330/2019 da ANVISA, normas CNEN-NN-3.01, grandezas dosimétricas (CTDIvol, DLP, mSv), cálculo de espessura de barita e chumbo para blindagens, otimização de dose pelo princípio ALARA e implantação do Programa de Garantia da Qualidade (PGQ).',
    targetAudience: 'Técnicos, tecnólogos, biomédicos, médicos radiologistas, físicos médicos, supervisores de radioproteção e gestores de serviços de diagnóstico por imagem.',
    objectives: [
      'Dominar as diretrizes da RDC 330/2019 da ANVISA e Instruções Normativas correlatas (IN 90 a IN 97)',
      'Calcular e auditar as grandezas dosimétricas em tomografia: CTDIw, CTDIvol (mGy), DLP (mGy.cm) e Dose Efetiva E (mSv)',
      'Aplicar o princípio ALARA na prática diária com modulação de mA (SureExposure) e algoritmos AIDR 3D',
      'Elaborar o Memorial Descritivo de Proteção Radiológica e plano de blindagem de salas de raios-X e TC',
      'Executar testes periódicos de controle de qualidade: exatidão do número de CT (água = 0 HU), ruído, uniformidade e espessura de corte'
    ],
    legalCompliance: 'Curso Livre de Aperfeiçoamento Profissional nos termos da Lei Federal nº 9.394/1996 (LDB) Art. 42 e Decreto Presidencial nº 5.154/2004. Certificado oficial de 40 horas válido em todo o território nacional para horas complementares (ACO), prova de títulos e evolução funcional.',
    hasActivionSimulator: true,
    hasRealDicomCases: false,
    featured: true,
    isEnrolled: false,
    modules: [
      {
        id: 'mod_rad_01',
        moduleNumber: 1,
        title: 'Módulo 1: Física das Radiações & Efeitos Biológicos Estocásticos e Determinísticos (10h)',
        workloadHours: 10,
        description: 'Interação da radiação com o tecido biológico, radiólise da água, quebras de DNA celular, dose absorvida (Gray) e dose equivalente (Sievert).',
        topics: [
          'Espectro eletromagnético e produção de radiação ionizante (Bremsstrahlung e Característica)',
          'Efeitos biológicos: mutações estocásticas vs danos teciduais determinísticos (eritema, catarata)',
          'Radiossensibilidade tecidual conforme a Lei de Bergonie-Tribondeau e fatores de ponderação wT',
          'Níveis de Referência para Diagnóstico (NRDs) nacionais e internacionais',
          'Simulação no console: Avaliação da influência do kVp e mAs na dose e ruído da imagem'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Parametrização Física & Auditoria de Ruído'
      },
      {
        id: 'mod_rad_02',
        moduleNumber: 2,
        title: 'Módulo 2: Grandezas Dosimétricas em TC: CTDIvol, DLP e Estimativa de Dose Efetiva (10h)',
        workloadHours: 10,
        description: 'Medição prática de CTDI com fantom de PMMA de 16cm e 32cm, câmara de ionização tipo lápis e fatores k de conversão.',
        topics: [
          'Conceituação matemática de CTDI100, CTDIw e CTDIvol ponderado pelo Pitch',
          'Produto Dose-Comprimento (DLP = CTDIvol x comprimento da varredura em cm)',
          'Fatores de conversão k (ICRP 103) para cálculo de dose efetiva em crânio, tórax, abdome e pelve',
          'Campanhas mundiais Image Gently (Pediatria) e Image Wisely (Adultos)',
          'Prática: Análise e auditoria de relatórios dosimétricos gerados pelo console'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Cálculo de Dose Efetiva em PMMA Virtual'
      },
      {
        id: 'mod_rad_03',
        moduleNumber: 3,
        title: 'Módulo 3: Tecnologias de Redução de Dose: Reconstrução Iterativa AIDR 3D & Modulação mA (10h)',
        workloadHours: 10,
        description: 'Funcionamento dos algoritmos iterativos estatísticos para redução de até 75% da dose com preservação diagnóstica do contraste.',
        topics: [
          'Limitações da retroprojeção filtrada (FBP) em regimes de baixa dosagem',
          'Reconstrução iterativa estatística (AIDR 3D Canon) e modelos baseados em IA',
          'Modulação tridimensional da corrente do tubo de raios-X (SureExposure 3D)',
          'Uso de protetores radiológicos de bismuto em órgãos críticos (olhos, tireoide, mamas)',
          'Simulação de varredura comparativa com e sem ativação do módulo AIDR 3D'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Simulação AIDR 3D com Corte de Dose'
      },
      {
        id: 'mod_rad_04',
        moduleNumber: 4,
        title: 'Módulo 4: Legislação Sanitária RDC 330/2019 ANVISA & Programa de Qualidade (10h)',
        workloadHours: 10,
        description: 'Requisitos legais para funcionamento de serviços de radiologia, testes de controle de qualidade periódicos e avaliação final de 40h.',
        topics: [
          'Estrutura regulatória da RDC 330/2019 e Instruções Normativas correlatas',
          'Dosimetria individual dos trabalhadores (TLD/OSL) e níveis de investigação ocupacional',
          'Testes diários e mensais de exatidão de Hounsfield Units, ruído e homogeneidade',
          'Checklist para fiscalização sanitária municipal, estadual e ANVISA',
          'Prova teórica final e emissão do Certificado Oficial de 40 horas com fé pública'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Auditoria Sanitária & Teste de CQ no Fantom'
      }
    ]
  },
  {
    id: 'cl_tc_activion_40h',
    code: 'CL-TC-4002',
    title: 'Tomografia Computadorizada Clínica & Operação do Activion 16',
    subtitle: 'Formação Completa em Aquisições Helicoidais, Janelamento HU e Casos Clínicos',
    category: 'Tomografia Computadorizada',
    workloadHours: 40,
    price: 149.00,
    originalPrice: 299.00,
    installments: 12,
    rating: 4.96,
    reviewCount: 342,
    enrolledStudentsCount: 1280,
    instructor: 'Prof. Dr. Marcus Vinicius',
    instructorTitle: 'Especialista em Tomografia Computadorizada CBR & Físico Médico',
    instructorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    description: 'Curso livre de 40 horas voltado para técnicos, tecnólogos e biomédicos que buscam domínio prático da operação do tomógrafo multislice Canon Activion 16. O aluno aprenderá parâmetros físicos (kVp, mA, Pitch, Espessura), reconstrução em Hounsfield Units, varredura de crânio, tórax, abdome e manejo de emergências no console virtual.',
    targetAudience: 'Estudantes e profissionais de Radiologia, Biomedicina, Medicina e Enfermagem que atuam ou pretendem atuar em Centros de Diagnóstico por Imagem e Tomografia Computadorizada.',
    objectives: [
      'Dominar os princípios físicos da formação de imagem tomográfica multislice (16 canais)',
      'Configurar parâmetros de aquisição no console Canon Activion 16 (Scout, FOV, Pitch, AIDR 3D)',
      'Identificar anatomia seccional normal e patológica em crânio, tórax e abdome total',
      'Realizar janelamentos diagnósticos (WW e WL) de parênquima cerebral, osso, pulmão e mediastino',
      'Interpretar densitometria por Hounsfield Units (HU) em hematomas, cistos, calcificações e ar'
    ],
    legalCompliance: 'Curso Livre de Capacitação Profissional regulamentado pela Lei nº 9.394/1996 (LDB) Art. 42 e Decreto Presidencial nº 5.154/2004. Certificado de 40 horas válido em todo o Brasil para horas complementares (ACO), progressão de carreira e prova de títulos.',
    hasActivionSimulator: true,
    hasRealDicomCases: true,
    featured: true,
    isEnrolled: true,
    progressPercent: 70,
    modules: [
      {
        id: 'mod_tc_01',
        moduleNumber: 1,
        title: 'Módulo 1: Física da Tomografia Multislice & Hardware Canon Activion (10h)',
        workloadHours: 10,
        description: 'Tubo de raios-X Megacool de 4.0 MHU, gerador de alta frequência, colimação pré e pós-paciente, detectores de estado sólido cerâmicos e geometria de rotação de 0.5s.',
        topics: [
          'Geração de raios-X em tomógrafos de 16 canais',
          'Colimação, Pitch e velocidade de avanço da mesa',
          'Efeito Heel e filtração bowtie (filtro em gravata)',
          'Matriz de aquisição 512x512, voxel anisotrópico vs isotrópico',
          'Algoritmos de reconstrução: FBP (Filtered Back Projection) e AIDR 3D'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Configuração de Hardware & Calibração do Activion 16',
        hasDicomViewer: false
      },
      {
        id: 'mod_tc_02',
        moduleNumber: 2,
        title: 'Módulo 2: Protocolo de Crânio & Urgência Neurológica no Console Virtual (10h)',
        workloadHours: 10,
        description: 'Posicionamento da linha órbito-meatal (OM), scout digital 250mm, janelas de crânio (+35/+80 HU), osso (+400/+2500 HU) e hematoma subdural hiperdenso (+78 HU).',
        topics: [
          'Linha infra-órbito-meatal e inclinação do gantry (Gantry Tilt)',
          'Aquisição axial vs helicoidal em crânio de urgência',
          'Janelamento para detecção precoce de AVC isquêmico (Janela de AVC)',
          'Diferenciação de sangue hiperdenso, edema hipodenso e calcificações fisiológicas',
          'Prática no simulador: Varredura de 24 cortes axiais de crânio com sonda de HU'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Protocolo de Crânio Urgência (0.7 mm)',
        hasDicomViewer: true
      },
      {
        id: 'mod_tc_03',
        moduleNumber: 3,
        title: 'Módulo 3: TC de Tórax de Alta Resolução (HRCT) & Abdome Total (10h)',
        workloadHours: 10,
        description: 'Avaliação de parênquima pulmonar com espessura fina (1.0 mm), padrão de vidro fosco, consolidações e janelamento de partes moles com contraste iodado.',
        topics: [
          'Protocolo HRCT inspiratório e expiratório',
          'Janela pulmonar (WW 1500 / WL -600 HU) e mediastinal (WW 350 / WL 40 HU)',
          'Protocolo de abdome total: fases pré-contraste, arterial, portal e de equilíbrio',
          'Prevenção de reações adversas e extravasamento de contraste iodado',
          'Estudo de nódulos pulmonares e bronquiectasias no viewer DICOM'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'HRCT Pulmonar & Abdome Bifásico',
        hasDicomViewer: true
      },
      {
        id: 'mod_tc_04',
        moduleNumber: 4,
        title: 'Módulo 4: Pós-processamento MPR, 3D VR & Avaliação Final de 40 Horas (10h)',
        workloadHours: 10,
        description: 'Reconstruções nos planos coronal e sagital, projeção de intensidade máxima (MIP) para vasculatura e prova prática no simulador Canon Activion 16.',
        topics: [
          'Reconstrução Multiplanar (MPR) oblíqua e ortogonal',
          'Curved MPR para avaliação de estruturas tubulares e cólon',
          '3D Volume Rendering (VR) com opacidade e iluminação virtual',
          'Exportação de arquivos padrão DICOM 3.0 para PACS e laudos',
          'Avaliação teórica e prova de simulação prática para emissão do certificado de 40h'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Estação de Trabalho MPR / 3D VR & Prova de Certificação',
        hasDicomViewer: true
      }
    ]
  },
  {
    id: 'cl_reconstrucao_3d_40h',
    code: 'CL-REC-4003',
    title: 'Reconstruções 3D Avançadas, MPR, MIP e Estações DICOM Médicas',
    subtitle: 'Manipulação de Matrizes Volumétricas, Interpolação de Voxels, MinIP e Volume Rendering',
    category: 'Reconstruções 3D Avançadas',
    workloadHours: 40,
    price: 169.00,
    originalPrice: 320.00,
    installments: 12,
    rating: 4.98,
    reviewCount: 198,
    enrolledStudentsCount: 560,
    instructor: 'Dra. Helena Vasconcelos',
    instructorTitle: 'Doutora em Radiologia Computacional & Imagem Médica',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    description: 'Curso livre de 40 horas focado no pós-processamento digital de imagens tomográficas e de ressonância. Aborda a arquitetura do padrão DICOM 3.0, reconstruções multiplanadas ortogonais e curvas (Curved MPR) para coluna vertebral e arcada dentária, projeções de intensidade máxima (MIP) para vasos e mínima (MinIP) para vias aéreas, e renderização volumétrica tridimensional (3D VR) com sombreamento realista para planejamento cirúrgico.',
    targetAudience: 'Estudantes e graduados em Radiologia, Biomedicina, Medicina e Engenharia Biomédica que desejam dominar estações de trabalho PACS e softwares como RadiAnt, Horos, Weasis e OsiriX.',
    objectives: [
      'Interpretar cabeçalhos DICOM (metadados de espessura, pixel spacing, rescale intercept e slope)',
      'Executar reconstruções MPR simultâneas em eixos axiais, coronais, sagitais e oblíquos',
      'Gerar mapas MIP vasculares de alta definição para estenoses e aneurismas',
      'Aplicar MinIP para diagnóstico precoce de enfisema pulmonar e bronquiolite',
      'Configurar paletas de cores (LUTs), opacidade e corte virtual no 3D Volume Rendering'
    ],
    legalCompliance: 'Curso Livre de Capacitação Profissional regulamentado pela Lei nº 9.394/1996 Art. 42 e Decreto nº 5.154/2004. Certificado de 40 horas válido para créditos acadêmicos e comprovação de especialização.',
    hasActivionSimulator: true,
    hasRealDicomCases: true,
    featured: true,
    isEnrolled: false,
    modules: [
      {
        id: 'mod_rec_01',
        moduleNumber: 1,
        title: 'Módulo 1: Estrutura do Padrão DICOM 3.0 & Resolução Espacial (10h)',
        workloadHours: 10,
        description: 'Matrizes de imagem médica, profundidade de 16 bits (4.096 níveis de cinza), tags DICOM essenciais e conversão de escala matemática.',
        topics: [
          'Histórico e comitê internacional DICOM / NEMA',
          'Voxel isotrópico vs anisotrópico e impacto na fidelidade do pós-processamento',
          'Fórmula de Hounsfield: HU = (PixelValue x RescaleSlope) + RescaleIntercept',
          'Anonimização de exames para conformidade com a LGPD em saúde',
          'Prática: Análise de metadados em arquivos .dcm no visualizador DICOM web'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Inspeção de Tags DICOM & Anonimização'
      },
      {
        id: 'mod_rec_02',
        moduleNumber: 2,
        title: 'Módulo 2: Reconstrução Multiplanar (MPR) Ortogonal & Curvilínea (10h)',
        workloadHours: 10,
        description: 'Navegação tridimensional sincrônica, espessura de corte variável (Slab) e traçado de linhas curvas ao longo de estruturas anatômicas complexas.',
        topics: [
          'MPR ortogonal (Axial, Sagital e Coronal) com sincronização em cruz anatômica',
          'Curved Planar Reformation (CPR) para coluna lombar e medula espinhal',
          'Reconstrução para implantodontia (Dental CT / Panorâmica e cortes paraxiais)',
          'Correção de artefatos de endurecimento de feixe metálico (Metal Artifact Reduction - MAR)',
          'Simulação de MPR em cortes tomográficos com medição milimétrica de lesões'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Estação de Trabalho MPR Curvilínea'
      },
      {
        id: 'mod_rec_03',
        moduleNumber: 3,
        title: 'Módulo 3: Projeções MIP, MinIP & Ray Summing (10h)',
        workloadHours: 10,
        description: 'Algoritmos de projeção de intensidade máxima e mínima para contraste vascular e avaliação de aprisionamento aéreo pulmonar.',
        topics: [
          'MIP fino vs MIP espesso para trajeto das artérias cerebrais e carótidas',
          'MinIP para parênquima pulmonar: identificação de padrão em mosaico e bronquiectasias',
          'Average Intensity Projection (AIP) para cálculo de dose em radioterapia',
          'Integração de janelamento com filtros de atenuação',
          'Estudo de casos reais com angiotomografias de crânio e tórax'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'MIP Vascular & MinIP de Vias Aéreas'
      },
      {
        id: 'mod_rec_04',
        moduleNumber: 4,
        title: 'Módulo 4: 3D Volume Rendering, Segmentação Cirúrgica & Certificação (10h)',
        workloadHours: 10,
        description: 'Criação de modelos anatômicos 3D realistas, segmentação óssea e vascular, bisturi virtual e avaliação final para certificação de 40h.',
        topics: [
          'Volume Rendering (VR) vs Surface Shaded Display (SSD)',
          'Criação de Color Look-Up Tables (LUTs) customizadas para ossos, músculos e vasos contrastados',
          'Uso do bisturi virtual (Scalpel / Cut Tool) para isolamento de fraturas',
          'Exportação de malhas 3D (.STL / .OBJ) para prototipagem e impressão 3D médica',
          'Avaliação teórica e prática com emissão do Certificado Oficial de 40 Horas'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Renderização 3D VR & Exportação Cirúrgica'
      }
    ]
  },
  {
    id: 'cl_exames_contrastados_40h',
    code: 'CL-CONT-4004',
    title: 'Exames Contrastados, Farmacologia dos Meios de Contraste & Injetoras',
    subtitle: 'Contraste Iodado, Bário e Gadolínio, Bolus Tracking, Nefrotoxicidade e Reações Adversas',
    category: 'Exames Contrastados',
    workloadHours: 40,
    price: 159.00,
    originalPrice: 310.00,
    installments: 12,
    rating: 4.97,
    reviewCount: 220,
    enrolledStudentsCount: 710,
    instructor: 'Dra. Sofia Albarracín',
    instructorTitle: 'Doutora em Imagenologia Médica & Especialista em Meios de Contraste',
    instructorAvatar: 'https://images.unsplash.com/photo-1594824813581-2292f7b88937?auto=format&fit=crop&w=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
    description: 'Curso livre de 40 horas dedicado à aplicação segura e eficaz dos meios de contraste em diagnóstico por imagem (Tomografia Computadorizada, Ressonância Magnética e Radiologia Geral). Aborda a físico-química dos agentes iodados iônicos e não iônicos, sulfato de bário e quelatos de gadolínio, uso de injetoras automáticas de bomba dupla, monitoramento de bólus em tempo real (Bolus Tracking), prevenção de lesão renal aguda e manejo de reações anafilactoides com kit de emergência.',
    targetAudience: 'Tecnólogos em radiologia, biomédicos imagenologistas, enfermeiros de hemodinâmica/radiologia e médicos radiologistas.',
    objectives: [
      'Classificar os meios de contraste por osmolaridade, viscosidade, carga iônica e via de administração',
      'Configurar a bomba injetora de contraste de cabeça dupla (vazão de 3.0 a 6.0 mL/s e flush de salina)',
      'Programar o monitoramento automático de atenuação (SureStart / Bolus Tracking) com ROI vascular',
      'Calcular o clearance de creatinina (Taxa de Filtração Glomerular Estimada - TFGe) para prevenção de NIC',
      'Manejar intercorrências: extravasamento subcutâneo, urticária, broncoespasmo e choque anafilático'
    ],
    legalCompliance: 'Curso Livre de Formação Continuada (Lei Federal nº 9.394/1996 Art. 42 e Decreto nº 5.154/2004). Certificado de 40 horas com reconhecimento acadêmico e validade nacional.',
    hasActivionSimulator: true,
    hasRealDicomCases: true,
    featured: true,
    isEnrolled: false,
    modules: [
      {
        id: 'mod_cont_01',
        moduleNumber: 1,
        title: 'Módulo 1: Físico-Química & Farmacologia dos Contrastes Iodados e Bário (10h)',
        workloadHours: 10,
        description: 'Estrutura molecular do anel benzênico tri-iodado, agentes monoméricos não iônicos (Iopamiron, Omnipaque, Ultravist), agentes iso-osmolares (Visipaque) e suspensão de bário.',
        topics: [
          'História e evolução dos contrastes radiológicos',
          'Relação entre osmolaridade, viscosidade e temperatura (aquecimento a 37°C)',
          'Sulfato de bário: indicações e contraindicações estritas (suspeita de perfuração gastrointestinal)',
          'Contrastes orais neutros (Manitol a 2,5% e água) em enterotomografia',
          'Prática no simulador: Parametrização de volume de contraste por peso corporal'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Cálculo de Bólus & Farmacologia dos Contrastes'
      },
      {
        id: 'mod_cont_02',
        moduleNumber: 2,
        title: 'Módulo 2: Operação de Injetoras Automáticas & Sincronização por Bolus Tracking (10h)',
        workloadHours: 10,
        description: 'Injetoras de bomba dupla, cateteres de alto fluxo (Gelco 18G/20G), teste com soro e disparo automático de varredura por ROI.',
        topics: [
          'Programação de fluxo (mL/s), pressão máxima (PSI) e atraso de varredura (Scan Delay)',
          'Importância do flush de salina: otimização da coluna de contraste e economia de dose',
          'Test Bolus (curva tempo-atenuação) vs Bolus Tracking dinâmico em tempo real',
          'Posicionamento de ROI no tronco pulmonar (TEP) e na aorta ascendente',
          'Simulação no console: Execução de protocolo vascular contrastado'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Angio-TC com Bolus Tracking e Injetora Dupla'
      },
      {
        id: 'mod_cont_03',
        moduleNumber: 3,
        title: 'Módulo 3: Protocolos Multifásicos de Abdome & Exames Digestivos/Urológicos (10h)',
        workloadHours: 10,
        description: 'Fases pré-contraste, arterial precoce/tardia, portal e excretora/equilíbrio em órgãos abdominais.',
        topics: [
          'Dinâmica vascular do fígado: wash-in arterial e wash-out portal em nódulos',
          'TC de pâncreas: fase parenquimatosa pancreática (40-45s)',
          'Urotomografia: fase nefrográfica (100s) e fase excretora com reconstrução 3D do trato urinário',
          'Exames radiológicos contrastados: EED, Enema Opaco e Histerossalpingografia',
          'Estudo de casos com visualizador DICOM de abdome multifásico'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Abdome Multifásico em 4 Fases Contrastadas'
      },
      {
        id: 'mod_cont_04',
        moduleNumber: 4,
        title: 'Módulo 4: Segurança do Paciente, Reações Adversas, Extravasamento & Prova 40h (10h)',
        workloadHours: 10,
        description: 'Protocolos de prevenção de nefrotoxicidade, conduta em extravasamento de contraste, drogas de emergência e certificação final de 40h.',
        topics: [
          'Avaliação de função renal (TFGe < 30 mL/min/1.73m²) e hidratação preventiva',
          'Classificação das reações anafilactoides: leves, moderadas e graves',
          'Algoritmo de atendimento de emergência na sala de tomografia (Adrenalina, Anti-histamínicos, Corticoides)',
          'Manejo de extravasamento de grandes volumes (> 50 mL): compressas, elevação e acompanhamento cirúrgico',
          'Avaliação teórica e emissão do Certificado Oficial de 40 horas com validação digital'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Simulação de Emergência & Certificação Final 40h'
      }
    ]
  },
  {
    id: 'cl_centro_cirurgico_40h',
    code: 'CL-CIR-4005',
    title: 'Radiologia em Centro Cirúrgico, Arco Cirúrgico em C & Fluoroscopia',
    subtitle: 'Operação de C-Arm Intraoperatório, Ortopedia, Neurocirurgia, Vascular e Assepsia Estrita',
    category: 'Centro Cirúrgico',
    workloadHours: 40,
    price: 179.00,
    originalPrice: 350.00,
    installments: 12,
    rating: 4.99,
    reviewCount: 175,
    enrolledStudentsCount: 490,
    instructor: 'Prof. Dr. Roberto Mansur',
    instructorTitle: 'Especialista em Imagem Intraoperatória & Cirurgia Guiada',
    instructorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    description: 'Curso livre de 40 horas especializado na atuação do profissional de imagem dentro do bloco cirúrgico estéril. Aborda a operação do equipamento de fluoroscopia móvel (Arco Cirúrgico em C / C-Arm), comandos de movimentação espacial (orbital, angular, elevação, translação e wig-wag), protocolos de assepsia, paramentação cirúrgica estéril, controle do tempo de pedal de escopia, roadmapping digital em cirurgias vasculares e posicionamento em cirurgias ortopédicas e neurológicas de coluna.',
    targetAudience: 'Técnicos e tecnólogos em radiologia, biomédicos, residentes de ortopedia, neurocirurgia e cirurgia vascular.',
    objectives: [
      'Operar com precisão os 5 eixos de movimentação do Arco Cirúrgico em C sem violar o campo estéril',
      'Dominar as normas de assepsia cirúrgica, paramentação com capote estéril e colocação de capas plásticas no intensificador',
      'Executar escopia pulsada com controle de dose (mGy/min) para proteção de toda a equipe cirúrgica',
      'Posicionar incidências de alta precisão em osteossínteses ortopédicas (haste intramedular, prótese de quadril) e coluna vertebral',
      'Utilizar a técnica de subtração digital intraoperatória (Roadmapping) em procedimentos endovasculares'
    ],
    legalCompliance: 'Curso Livre de Capacitação e Formação Continuada (Lei nº 9.394/1996 Art. 42 e Decreto nº 5.154/2004). Carga horária de 40 horas válida nacionalmente para prova de títulos e concursos.',
    hasActivionSimulator: true,
    hasRealDicomCases: true,
    featured: true,
    isEnrolled: false,
    modules: [
      {
        id: 'mod_cir_01',
        moduleNumber: 1,
        title: 'Módulo 1: Arquitetura do Bloco Cirúrgico, Rotinas e Assepsia Estrita (10h)',
        workloadHours: 10,
        description: 'Zonas do centro cirúrgico (não restrita, semirrestrita e restrita), fluxo de ar com pressão positiva, paramentação, escovação e conduta estéril.',
        topics: [
          'Zoneamento e controle microbiológico no centro cirúrgico hospitalar',
          'Técnicas de escovação das mãos com clorexidina degermante e paramentação estéril',
          'Delimitação do campo cirúrgico e técnica correta de envelopamento do Arco em C com capas estéreis',
          'Comunicação efetiva com o cirurgião principal, instrumentador e anestesista',
          'Simulação de entrada em sala e posicionamento do equipamento'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Protocolo de Assepsia & Envelopamento do C-Arm'
      },
      {
        id: 'mod_cir_02',
        moduleNumber: 2,
        title: 'Módulo 2: Mecânica e Movimentação Espacial do Arco Cirúrgico em C (10h)',
        workloadHours: 10,
        description: 'Controle de freios mecânicos e elétricos: movimento orbital (0° a 115°), angular (+/- 15°), rotação do gantry, elevação vertical e translação horizontal.',
        topics: [
          'Geometria do intensificador de imagem vs detector de painel plano (Flat Panel)',
          'Eixo orbital: obtenção rápida de incidências anteroposterior (AP), perfil estrito e oblíquas',
          'Movimento wig-wag para alinhamento fino sem mover a base do equipamento',
          'Posicionamento correto do tubo de raios-X embaixo da mesa cirúrgica para redução da radiação espalhada',
          'Prática: Simulação de comandos de movimentação em cirurgia de coluna'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Operação dos 5 Eixos Espaciais do Arco em C'
      },
      {
        id: 'mod_cir_03',
        moduleNumber: 3,
        title: 'Módulo 3: Aplicações em Ortopedia, Neurocirurgia & Cirurgia Vascular (10h)',
        workloadHours: 10,
        description: 'Guiamento intraoperatório para parafusos pediculares de coluna, fixação de fraturas de fêmur e subtração angiográfica digital.',
        topics: [
          'Artroplastia de quadril e fixação de colo do fêmur: incidências de Lauenstein e axial',
          'Artrodese de coluna lombossacra: visualização do trajeto pedicular em perfil contínuo',
          'Cirurgia vascular periférica: subtração digital (DSA) e técnica de Roadmapping dinâmico',
          'Colangiografia intraoperatória em colecistectomias',
          'Estudo de casos fluoroscópicos intraoperatórios em viewer médico'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Fluoroscopia em Osteossíntese & Coluna Vertebral'
      },
      {
        id: 'mod_cir_04',
        moduleNumber: 4,
        title: 'Módulo 4: Radioproteção Cirúrgica, Escopia Pulsada & Certificação Final (10h)',
        workloadHours: 10,
        description: 'Controle de radiação na sala de operações, uso de fluoroscopia pulsada de baixo mAs, aventais plumbíferos com protetor de tireoide e exame final.',
        topics: [
          'Princípio do inverso do quadrado da distância na sala cirúrgica',
          'Uso obrigatório de vestimentas plumbíferas de 0,5mm Pb e dosímetro de punho/lapela',
          'Fluoroscopia pulsada (4 a 8 pulsos/s) e recurso Last Image Hold (LIH) para zerar radiação desnecessária',
          'Auditoria do tempo acumulado de escopia no monitor cirúrgico',
          'Prova teórica final e emissão do Certificado Oficial de 40 horas com fé pública'
        ],
        hasSimulatorPractice: true,
        simulatorProtocolName: 'Simulação de Escopia Pulsada & Prova de 40h'
      }
    ]
  }
];
