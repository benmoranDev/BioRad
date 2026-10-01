export interface GlossaryTerm {
  id: string;
  term: string;
  abbreviation?: string;
  category: 'EXPOSURE' | 'GEOMETRY' | 'DOSIMETRY' | 'RECONSTRUCTION' | 'HARDWARE' | 'CONTRAST';
  categoryLabel: string;
  shortDefinition: string;
  detailedExplanation: string;
  formula?: string;
  clinicalImpact: string;
  practicalTip: string;
  canonEquivalent?: string;
  units?: string;
}

export const RADIOLOGY_GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'kvp',
    term: 'Quilovoltagem de Pico',
    abbreviation: 'kVp',
    category: 'EXPOSURE',
    categoryLabel: 'Parâmetros de Exposição',
    units: 'kV (Quilovolt)',
    shortDefinition: 'Tensão elétrica máxima aplicada entre o cátodo e o ânodo do tubo de Raios-X, determinando a energia cinética dos elétrons e o poder de penetração dos fótons.',
    detailedExplanation: 'O kVp dita a qualidade e a dureza do feixe de radiação. Valores menores (ex: 80-100 kV) aumentam o efeito fotoelétrico e elevam o contraste tecidual e o realce do iodo, sendo ideais para angiotomografia e pediatria. Valores maiores (120-135 kV) aumentam a penetração em pacientes obesos e reduzem artefatos de endurecimento do feixe.',
    formula: 'Dose \\propto (kVp)^2',
    clinicalImpact: 'Reduzir de 120 kVp para 80-100 kVp em estudos vasculares com contraste pode diminuir a dose em até 40-60% enquanto aumenta significativamente o contraste nos vasos opacificados.',
    practicalTip: 'Em tomografia pediátrica ou angiotomografia, prefira 80-100 kVp; em crânio com ossos densos ou pelve volumosa, use 120-135 kVp para evitar ruído e artefatos em faixas.',
    canonEquivalent: 'Seleção direta na console (80kV, 100kV, 120kV, 135kV) acoplada ao SUREExposure 3D.'
  },
  {
    id: 'mas',
    term: 'Miliamperagem-segundo (Carga do Tubo)',
    abbreviation: 'mAs / mA',
    category: 'EXPOSURE',
    categoryLabel: 'Parâmetros de Exposição',
    units: 'mAs (Miliamperes × segundos)',
    shortDefinition: 'Produto da corrente elétrica do tubo (mA) pelo tempo de exposição (segundos), definindo a quantidade total de fótons de Raios-X emitidos.',
    detailedExplanation: 'O mAs determina a quantidade de radiação que atinge os detectores. A relação entre mAs e dose é estritamente linear (dobrar o mAs dobra a dose absorvida). O ruído quântico da imagem é inversamente proporcional à raiz quadrada do mAs.',
    formula: 'mAs = mA \\times t_{rot} \\quad | \\quad Ruído \\propto \\frac{1}{\\sqrt{mAs}}',
    clinicalImpact: 'Ajustar o mAs em conformidade com o princípio ALARA garante imagens diagnósticas sem exposição excessiva e desnecessária ao paciente.',
    practicalTip: 'Utilize sistemas de modulação automática de corrente de tubo (SUREExposure 3D / AEC) para modular o mAs nos eixos X, Y e Z conforme a atenuação da anatomia.',
    canonEquivalent: 'SUREExposure 3D (Modulação Automática com Desvio Padrão Alvo - SD).'
  },
  {
    id: 'fov',
    term: 'Field of View (Campo de Visão)',
    abbreviation: 'FOV (S-FOV / D-FOV)',
    category: 'GEOMETRY',
    categoryLabel: 'Geometria e Imagem',
    units: 'mm (Milímetros)',
    shortDefinition: 'Diâmetro circular da área anatômica selecionada para varredura (Scan FOV) ou reconstruída para visualização diagnóstica (Display FOV).',
    detailedExplanation: 'O Scan FOV (S-FOV) define a calibração física dos detectores e o feixe de varredura. O Display FOV (D-FOV) é a região de interesse reconstruída na matriz de pixels. Para uma mesma matriz, reduzir o D-FOV reduz o tamanho do pixel e aumenta a resolução espacial.',
    formula: 'Tamanho\\,do\\,Pixel = \\frac{D\\text{-}FOV}{\\text{Matriz}}',
    clinicalImpact: 'Para estruturas milimétricas (ex: mastoides, rochedos, sela túrcica), usar um D-FOV pequeno (ex: 120-160mm) garante resolução submétrica (pixel < 0.3mm).',
    practicalTip: 'Nunca corte bordas anatômicas importantes no D-FOV. Mantenha o D-FOV ajustado estritamente à anatomia de interesse para maximizar a nitidez.',
    canonEquivalent: 'D-FOV configurável de 180mm (Small) a 500mm (LL) nos protocolos de aquisição.'
  },
  {
    id: 'matriz',
    term: 'Matriz de Reconstrução',
    abbreviation: 'Matrix (512² / 1024²)',
    category: 'GEOMETRY',
    categoryLabel: 'Geometria e Imagem',
    units: 'Pixels (ex: 512 × 512)',
    shortDefinition: 'Grid bidimensional formado por linhas e colunas de pixels no qual a imagem tomográfica digital é reconstruída e armazenada.',
    detailedExplanation: 'O padrão ouro em tomografia computadorizada clínica é a matriz de 512 × 512 pixels (262.144 pixels por corte). Sistemas de alta resolução (HRCT) oferecem matrizes de 1024 × 1024 para aumento de resolução espacial em ossos temporais e pulmão.',
    formula: 'Resolução\\,Espacial \\propto \\text{Dimensão da Matriz}',
    clinicalImpact: 'Matrizes maiores proporcionam bordas ósseas e interfaces de alta densidade mais nítidas, com maior consumo de armazenamento e processamento.',
    practicalTip: 'A matriz 512×512 é ideal para rotinas abdominais e neurológicas; 1024×1024 é recomendada para pesquisas de microfraturas ou estêncil de ouvidos internos.',
    canonEquivalent: 'Recon Matrix 512×512 padrão ou 1024×1024 High-Resolution Recon no Vitrea.'
  },
  {
    id: 'mpr',
    term: 'Reconstrução Multiplanar',
    abbreviation: 'MPR (Multiplanar Reconstruction)',
    category: 'RECONSTRUCTION',
    categoryLabel: 'Reconstrução e Algoritmos',
    units: 'Planos 2D (Axial, Coronal, Sagital, Oblíquo)',
    shortDefinition: 'Técnica de pós-processamento que remonta os dados volumétricos 3D em qualquer plano anatômico ortogonal ou oblíquo a partir de cortes isotrópicos.',
    detailedExplanation: 'A partir de uma aquisição helicoidal com cortes volumétricos finos e sobreposição, o MPR gera visualizações nos eixos Sagital (perfil), Coronal (frontal), Oblíquo e Curvo (panorâmica dental ou vascular) sem nova exposição do paciente.',
    formula: 'Voxel\\,Isotrópico: \\Delta x = \\Delta y = \\Delta z',
    clinicalImpact: 'Fundamental para avaliação de fraturas vertebrais, apendicite, embolia pulmonar e planejamento cirúrgico ortopédico e vascular.',
    practicalTip: 'Para obter reconstruções MPR sem artefatos em escada, assegure que a espessura de corte reconstruída seja menor ou igual a 1.0mm com intervalo de reconstrução de 50%.',
    canonEquivalent: 'Console MPR 3D Integrada com navegação em tempo real nos 4 quadrantes.'
  },
  {
    id: 'pitch',
    term: 'Pitch (Fator de Passo Helical)',
    abbreviation: 'Pitch Factor',
    category: 'EXPOSURE',
    categoryLabel: 'Parâmetros de Exposição',
    units: 'Adimensional (ex: 0.625 a 1.500)',
    shortDefinition: 'Razão matemática entre o avanço linear da mesa de exame por rotação de 360° do gantry e a largura total do feixe colimado de Raios-X.',
    detailedExplanation: 'Pitch = 1.0: não há sobreposição nem espaçamento entre espirais adjacentes. Pitch < 1.0 (sobreposição de feixes): melhora a resolução longitudinal no eixo Z e reduz ruído, porém eleva a dose. Pitch > 1.0 (feixe esticado): reduz o tempo de varredura e a dose.',
    formula: 'Pitch = \\frac{\\text{Avanço da mesa por rotação (mm)}}{\\text{Colimação total do feixe (mm)}}',
    clinicalImpact: 'Pitch elevado (> 1.2) é essencial em pacientes dispneicos ou pediátricos para cobrir o tórax em menos de 2 segundos.',
    practicalTip: 'Para crânio e coluna de alta precisão utilize pitch baixo (0.625 a 0.813); para politrauma e tórax rápido, utilize pitch alto (1.2 a 1.5).',
    canonEquivalent: 'Pitches Canon: HP11.0 (0.688), HP15.0 (0.938), HP23.0 (1.438).'
  },
  {
    id: 'ctdivol',
    term: 'CTDIvol (Índice de Dose Ponderado em TC)',
    abbreviation: 'CTDIvol',
    category: 'DOSIMETRY',
    categoryLabel: 'Dosimetria e ALARA',
    units: 'mGy (Miligray)',
    shortDefinition: 'Média padronizada da dose absorvida ao longo do volume de varredura, medida em fantomas cilíndricos de PMMA de 16cm (cabeça) ou 32cm (corpo).',
    detailedExplanation: 'O CTDIvol sintetiza a intensidade de dose média dentro da fatia irradiada considerando a modulação pelo pitch. É o parâmetro legal de controle de qualidade e dosimetria exigido pelas diretrizes da ICRP, EURATOM e ANVISA.',
    formula: 'CTDI_{vol} = \\frac{CTDI_w}{\\text{Pitch}} = \\frac{\\frac{1}{3}CTDI_{center} + \\frac{2}{3}CTDI_{periph}}{\\text{Pitch}}',
    clinicalImpact: 'Permite comparar protocolos de diferentes equipamentos e monitorar se o exame está dentro dos Níveis de Referência Diagnóstica (DRLs).',
    practicalTip: 'Monitore o CTDIvol antes de disparar o feixe: Crânio adulto típico ~45-60 mGy; Abdômen adulto ~10-18 mGy; Tórax baixa dose ~3-6 mGy.',
    canonEquivalent: 'Exibido em tempo real no canto da console e no relatório estruturado DICOM SR.'
  },
  {
    id: 'dlp',
    term: 'DLP (Produto Dose-Comprimento)',
    abbreviation: 'DLP',
    category: 'DOSIMETRY',
    categoryLabel: 'Dosimetria e ALARA',
    units: 'mGy · cm (Miligray-centímetro)',
    shortDefinition: 'Medida da energia total de radiação absorvida pelo paciente durante toda a extensão longitudinal (comprimento) da varredura.',
    detailedExplanation: 'Enquanto o CTDIvol expressa a intensidade da dose em uma seção transversal, o DLP integra essa dose ao longo de todo o comprimento anatômico escaneado (L em cm). É o valor base para o cálculo da Dose Efetiva em mSv.',
    formula: 'DLP = CTDI_{vol} \\times L\\,(\\text{comprimento em cm})',
    clinicalImpact: 'Reduzir a extensão do planejamento de varredura (não irradiar áreas fora da suspeita clínica) diminui o DLP linearmente.',
    practicalTip: 'Planeje os limites cranial e caudal estritamente no topograma scout para evitar escanear pescoço ou pelve desnecessariamente.',
    canonEquivalent: 'DLP Total e Parcial calculado dinamicamente na barra superior da console.'
  },
  {
    id: 'dose_efetiva',
    term: 'Dose Efetiva (Risco Radiológico Estocástico)',
    abbreviation: 'E (mSv)',
    category: 'DOSIMETRY',
    categoryLabel: 'Dosimetria e ALARA',
    units: 'mSv (Milissievert)',
    shortDefinition: 'Estimativa do risco biológico estocástico global de indução de neoplasias ou efeitos genéticos no corpo humano após a exposição à radiação.',
    detailedExplanation: 'Calculada multiplicando-se o DLP pelo coeficiente de conversão tecidual ponderado ($k$) estabelecido pela ICRP para a região anatômica (ex: $k_{\\text{crânio}} = 0.0021$, $k_{\\text{tórax}} = 0.014$, $k_{\\text{abdômen}} = 0.015$).',
    formula: 'E\\,(\\text{mSv}) = DLP\\,(\\text{mGy}\\cdot\\text{cm}) \\times k_{\\text{região}}',
    clinicalImpact: 'Permite correlacionar o risco de um exame de TC com a radiação de fundo natural anual do planeta (~2.4 a 3.0 mSv/ano).',
    practicalTip: 'Mantenha os exames sempre abaixo dos limites aceitáveis: Tórax ~4-7 mSv; Abdome ~6-10 mSv; Crânio ~1.5-2.5 mSv.',
    canonEquivalent: 'Dose Efetiva calculada automaticamente nos painéis de dosimetria EURATOM / ALARA.'
  },
  {
    id: 'kernel',
    term: 'Filtro de Convolução (Kernel de Reconstrução)',
    abbreviation: 'Recon Filter Kernel',
    category: 'RECONSTRUCTION',
    categoryLabel: 'Reconstrução e Algoritmos',
    units: 'Algoritmo Matemático (ex: FC01, FC13, FC30, FC52)',
    shortDefinition: 'Algoritmo de retroprojeção filtrada (FBP) aplicado aos dados brutos para realçar ou suavizar frequências espaciais específicas.',
    detailedExplanation: 'Filtros suaves (ex: FC13 Soft / Brain) atenuam frequências altas, reduzindo o ruído para diferenciar pequenas variações de contraste em tecidos moles (ex: substância branca vs cinzenta). Filtros duros (ex: FC30 Bone, FC07 Lung) realçam bordas em estruturas de alto contraste.',
    formula: 'Imagem = \\mathcal{F}^{-1}\\{\\mathcal{F}(\\text{Projeções}) \\times \\text{Kernel}\\}',
    clinicalImpact: 'Utilizar um filtro inadequado (ex: avaliar parênquima cerebral em filtro ósseo) destrói a visualização de contrastes de partes moles devido ao ruído excessivo.',
    practicalTip: 'Sempre reconstrua séries duplas em politrauma: FC13 (partes moles/órgãos) e FC30 (janela óssea de alta nitidez).',
    canonEquivalent: 'Kernels Canon: FC01 (Standard), FC07 (Lung), FC13 (Brain), FC30 (Bone), FC52 (Inner Ear HR).'
  },
  {
    id: 'iterative',
    term: 'Reconstrução Iterativa & Inteligência Artificial',
    abbreviation: 'AIDR 3D / AiCE',
    category: 'RECONSTRUCTION',
    categoryLabel: 'Reconstrução e Algoritmos',
    units: 'Níveis: Standard, Strong, Deep Learning',
    shortDefinition: 'Algoritmo de computação estatística e aprendizado profundo que modela a física do feixe e a óptica dos detectores para suprimir ruído sem borrar bordas.',
    detailedExplanation: 'Diferente da retroprojeção tradicional (FBP), a reconstrução iterativa cria sucessivas estimativas da imagem, compara-as com os dados brutos e subtrai o ruído quântico e eletrônico de forma inteligente, possibilitando reduções de dose de 50% a 75%.',
    formula: '\\text{Redução de Dose} \\approx 50\\% \\text{ a } 75\\% \\text{ mantendo SNR}',
    clinicalImpact: 'Viabiliza protocolos de ultrabaixa dose (Sub-mSv CT) em pediatria, rastreamento pulmonar e colonoscopia virtual.',
    practicalTip: 'Mantenha o AIDR 3D ou AiCE sempre ativo no protocolo padrão para permitir redução simultânea do mAs sem penalizar a qualidade.',
    canonEquivalent: 'AIDR 3D (Adaptive Iterative Dose Reduction) e AiCE (Advanced Intelligent Clear-IQ Engine).'
  },
  {
    id: 'hounsfield',
    term: 'Unidade Hounsfield & Janelamento (WW / WL)',
    abbreviation: 'HU (Hounsfield Unit) / WW / WL',
    category: 'GEOMETRY',
    categoryLabel: 'Geometria e Imagem',
    units: 'HU (Escala de -1024 a +3071)',
    shortDefinition: 'Escala quantitativa universal de radiodensidade da TC e o mecanismo de ajuste de largura de janela (WW) e nível central (WL) para visualização.',
    detailedExplanation: 'Definida por Sir Godfrey Hounsfield: Ar = -1000 HU, Água pura = 0 HU, Gordura = -50 a -100 HU, Sangue agudo = +60 a +80 HU, Osso cortical = +1000 a +2000 HU. O WW dita o contraste (faixa de tons de cinza) e o WL define o brilho central.',
    formula: 'HU = 1000 \\times \\frac{\\mu_{\\text{tecido}} - \\mu_{\\text{água}}}{\\mu_{\\text{água}}}',
    clinicalImpact: 'Permite identificar sangue agudo em AVC hemorrágico (+70 HU), esteatose hepática (< 40 HU) e cálculos renais densos (> 400 HU).',
    practicalTip: 'Crânio: WL 35 / WW 80; Pulmão: WL -600 / WW 1500; Osso: WL 400 / WW 2000; Abdômen: WL 40 / WW 350.',
    canonEquivalent: 'Janelas rápidas: W1 (Brain), W2 (Bone), W3 (Abdomen), W4 (Lung) no console Vitrea.'
  },
  {
    id: 'surestart',
    term: 'SUREStart & Bolus Tracking Automático',
    abbreviation: 'Bolus Tracking / SUREStart',
    category: 'CONTRAST',
    categoryLabel: 'Contraste e Injeção',
    units: 'HU (Limiar de Disparo, ex: 140 HU)',
    shortDefinition: 'Sistema de monitoramento dinâmico em tempo real da chegada do meio de contraste em um vaso sanguíneo sentinela de referência.',
    detailedExplanation: 'O tomógrafo realiza disparos repetidos de baixíssima dose (1 corte/segundo) sobre uma ROI posicionada no vaso (ex: Aorta Ascendente ou Pulmonar). Quando a densidade média ultrapassa o limiar pré-definido (ex: 140-160 HU), o escaneamento helicoidal é disparado automaticamente.',
    formula: '\\text{Disparo ao atingir: } HU_{\\text{ROI}} \\ge HU_{\\text{Threshold}}',
    clinicalImpact: 'Garante pico de opacificação arterial perfeito em angiotomografias de coronárias, aorta e carótidas, eliminando a dependência do tempo de circulação individual.',
    practicalTip: 'Coloque a ROI no centro da luz vascular sem tocar em placas parietais densas ou calcificações que possam causar disparo precoce.',
    canonEquivalent: 'SUREStart com gráfico dinâmico em tempo real e curva de realce na console Canon.'
  },
  {
    id: 'colimacao',
    term: 'Colimação de Detectores & Largura de Feixe',
    abbreviation: 'Detector Collimation (N × T)',
    category: 'HARDWARE',
    categoryLabel: 'Hardware e Tomógrafo',
    units: 'mm (ex: 16 × 0.5mm, 80 × 0.5mm, 160 × 0.5mm)',
    shortDefinition: 'Configuração da matriz de detectores que define o número de canais de dados (N) e a espessura física de cada elemento detector (T em mm).',
    detailedExplanation: 'A colimação determina a cobertura volumétrica total por rotação do gantry ($Z_{\\text{coverage}} = N \\times T$). Detectores de 0.5mm proporcionam resolução espacial isotrópica perfeita em qualquer plano ortogonal.',
    formula: '\\text{Largura Total do Feixe} = N_{\\text{canais}} \\times T_{\\text{espessura}}',
    clinicalImpact: 'Uma colimação de 160 × 0.5mm cobre 80mm por rotação, permitindo escanear o coração ou cérebro completo em uma única rotação de 0.275s.',
    practicalTip: 'Para estudos de rotina use a maior cobertura de detectores para diminuir o tempo de exame e o risco de artefatos de respiração.',
    canonEquivalent: 'Detectores PUREViSION de 160 canais com elementos semicondutores de 0.5mm.'
  },
  {
    id: 'gantry_slipring',
    term: 'Gantry Bore & Tecnologia Slip-Ring',
    abbreviation: 'Gantry Slip-Ring (780mm)',
    category: 'HARDWARE',
    categoryLabel: 'Hardware e Tomógrafo',
    units: 'RPM / mm (Abertura de 780mm, até 220 RPM)',
    shortDefinition: 'Estrutura mecânica anelar que abriga o rotor giratório com o tubo de Raios-X e detectores, acoplada a anéis coletores sem fios para rotação contínua.',
    detailedExplanation: 'A tecnologia Slip-Ring (anéis deslizantes) substituiu os cabos enroláveis nos anos 1980, permitindo que o rotor gire continuamente em rotações ultra-rápidas (até 0.275s por volta = 218.2 RPM), submetendo os componentes a forças centrífugas de até 13.5 G.',
    formula: 'RPM = \\frac{60}{t_{\\text{rotação}}} \\quad | \\quad F_c = \\frac{m \\cdot v^2}{r}',
    clinicalImpact: 'Garante aquisições ultrarrápidas compatíveis com batimentos cardíacos (Cardio CT) e abertura ampla de 78cm para pacientes bariátricos e biópsias.',
    practicalTip: 'Monitore o balanceamento do rotor e o indicador de temperatura do anodo térmico (TubeHU%) antes de sequências pesadas.',
    canonEquivalent: 'Gantry Aquilion com 78cm de bore, tilt de ±30° e anel luminoso SUREStatus Halo.'
  }
];
