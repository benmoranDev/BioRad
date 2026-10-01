import React, { useState, useRef, useEffect } from 'react';
import { CANON_ACTIVION_CASES, RealActivionCase } from '../../data/canonActivionData';
import {
  SCAN_PROTOCOLS,
  ActivionScanProtocol,
  Activion3DParameters,
  ActivionFilmingSheet,
  RawDataReconstructionPlan
} from '../../data/canonConsoleScreensData';
import {
  DicomSliceData,
  renderDicomSliceToCanvas,
  renderOrthogonalCoronalSlice,
  renderOrthogonalSagittalSlice,
  calculateRoiStatistics,
  playCanonAudioCue,
  getHuAtCoordinate,
  parseUploadedDicomFile,
  parseMultipleDicomFiles,
  generateTestDicomSeries,
  generateDicomPart10Blob,
  importDicomImageSet,
  convertImageBlobOrBase64ToDicomSlice,
  ImageSetImportOptions
} from '../../utils/dicomEngine';
import { CanonScanConsole } from './CanonScanConsole';
import { RadiologyGlossaryModal } from '../modals/RadiologyGlossaryModal';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose }) => {
  const [selectedCase, setSelectedCase] = useState<RealActivionCase>(CANON_ACTIVION_CASES[0]);
  const [activeTab, setActiveTab] = useState<'Tool1' | 'Tool2' | 'Application'>('Tool1');
  
  // Top Operation Modes corresponding directly to Canon Activion 16 hardware buttons
  const [topMode, setTopMode] = useState<'MPR' | '3D' | 'Clinical' | 'Scan' | 'Filming' | 'RawData'>('MPR');
  
  // Real DICOM Multi-Slice Dataset State
  const [dicomSlices, setDicomSlices] = useState<DicomSliceData[]>(() => generateTestDicomSeries('head_ct', 256));
  const [isCustomDicomUploaded, setIsCustomDicomUploaded] = useState<boolean>(false);
  const [hoveredHu, setHoveredHu] = useState<{ hu: number; tissue: string; x: number; y: number } | null>(null);
  const [showDicomDirectoryModal, setShowDicomDirectoryModal] = useState<boolean>(false);
  const [showDicomImporterModal, setShowDicomImporterModal] = useState<boolean>(false);
  const [showWindowControlsModal, setShowWindowControlsModal] = useState<boolean>(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);
  const [initialGlossaryTermId, setInitialGlossaryTermId] = useState<string>('kvp');
  const [importerActiveTab, setImporterActiveTab] = useState<'sets' | 'files' | 'base64'>('sets');
  const [importerBase64Input, setImporterBase64Input] = useState<string>('');
  const [importerBodyRegion, setImporterBodyRegion] = useState<'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE'>('HEAD');
  const [importerPatientName, setImporterPatientName] = useState<string>('PACIENTE IMPORTADO DICOM');
  const [importerPatientId, setImporterPatientId] = useState<string>('DCM-7740');
  const [importerIsProcessing, setImporterIsProcessing] = useState<boolean>(false);
  const [stagedImportSlices, setStagedImportSlices] = useState<DicomSliceData[]>([]);
  const [stagedImportInfo, setStagedImportInfo] = useState<{ name: string; count: number; region: string; huRange: string; source: string } | null>(null);
  const [pacsSearchQuery, setPacsSearchQuery] = useState<string>('');
  const [pacsRegionFilter, setPacsRegionFilter] = useState<'ALL' | 'HEAD' | 'CHEST' | 'ABDOMEN' | 'EMERGENCY'>('ALL');
  const [pacsInspectCase, setPacsInspectCase] = useState<RealActivionCase | null>(null);
  const [pacsIsQuerying, setPacsIsQuerying] = useState<boolean>(false);
  const [dicomStatusNotice, setDicomStatusNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importerFileInputRef = useRef<HTMLInputElement>(null);
  const importerPreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Crosshairs in fractional coordinates (0.0 to 1.0)
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

// Measurement & ROI tools state
  interface CaliperMeasurement {
    id: string;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    distanceMm: number;
    distanceCm: number;
    angleDeg: number;
    deltaXmm: number;
    deltaYmm: number;
    meanHu: number;
    minHu: number;
    maxHu: number;
    tissueProfile: string;
    sliceIndex: number;
    viewport: 'axial' | 'coronal' | 'sagittal';
    label: string;
  }

  const [rulerPoints, setRulerPoints] = useState<{
    p1: { x: number; y: number } | null;
    p2: { x: number; y: number } | null;
    liveMouse: { x: number; y: number } | null;
    distanceMm: number | null;
    angleDeg: number | null;
    meanHu: number | null;
    minHu: number | null;
    maxHu: number | null;
    tissueProfile: string | null;
    viewport: 'axial' | 'coronal' | 'sagittal';
  }>({
    p1: null,
    p2: null,
    liveMouse: null,
    distanceMm: null,
    angleDeg: null,
    meanHu: null,
    minHu: null,
    maxHu: null,
    tissueProfile: null,
    viewport: 'axial'
  });
  const [savedMeasurements, setSavedMeasurements] = useState<CaliperMeasurement[]>([]);
  const [roiMetrics, setRoiMetrics] = useState<{
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    meanHu: number;
    sdHu: number;
    minHu: number;
    maxHu: number;
    areaCm2: number;
  } | null>(null);

  // Viewport adjustments for MPR mode
  const [activeViewport, setActiveViewport] = useState<'coronal' | 'sagittal' | 'axial'>('axial');
  const [sliceIndex, setSliceIndex] = useState<number>(16);
  const [ww, setWw] = useState<number>(selectedCase.ww);
  const [wl, setWl] = useState<number>(selectedCase.wl);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<
    'Filming' | 'Filter' | 'ImageSelector' | 'Measure' | 'Annotation' | 'Rotate' | 'ScreenSave' | 'Cursor' | 'Oblique' | 'Reset' | 'BatchMPR' | 'ROI'
  >('Cursor');
  const [projectMode, setProjectMode] = useState<'Average' | 'MIP' | 'MinIP' | 'VR'>('Average');
  const [thicknessOption, setThicknessOption] = useState<'none' | '1.0mm' | '2.0mm' | '5.0mm'>('none');
  const [showClinicalNotes, setShowClinicalNotes] = useState<boolean>(false);
  const [showScoutLines, setShowScoutLines] = useState<boolean>(true);
  const [measureActive, setMeasureActive] = useState<boolean>(false);
  const [invertGrayscale, setInvertGrayscale] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // 3D VR Console State
  const [threeDParams, setThreeDParams] = useState<Activion3DParameters>({
    renderMode: 'Volume Rendering (VR)',
    colorMap: 'Bone & Vessel Contrast',
    windowLevel: 300,
    windowWidth: 700,
    rotationX: 18,
    rotationY: -25,
    rotationZ: 0,
    zoom: 1.1,
    cutPlaneActive: false,
    cutPlaneDepth: 50
  });

  // Scan Protocol & Execution State (Canon Aquilion / Activion Console)
  const [selectedProtocolKey, setSelectedProtocolKey] = useState<string>('head_routine');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'ALL' | 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'VASCULAR' | 'CARDIAC' | 'EXTREMITIES'>('ALL');
  const [activeProtocol, setActiveProtocol] = useState<ActivionScanProtocol>(SCAN_PROTOCOLS.head_routine || Object.values(SCAN_PROTOCOLS)[0]);
  const [scanStep, setScanStep] = useState<'scout_view' | 'plan_box' | 'surestart' | 'scan_running' | 'scan_completed'>('scout_view');
  const [selectedScoutOrientation, setSelectedScoutOrientation] = useState<'AP' | 'LAT'>('LAT');
  const [planStartPct, setPlanStartPct] = useState<number>(18);
  const [planEndPct, setPlanEndPct] = useState<number>(82);
  const [bolusTrackerHu, setBolusTrackerHu] = useState<number>(38);
  const [scoutProgress, setScoutProgress] = useState<number>(100);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [voiceCommand, setVoiceCommand] = useState<string>('Pronto para Aquisição');
  const [xrayTubeHeat, setXrayTubeHeat] = useState<number>(34); // % HU heat storage

  // Filming Camera Console State
  const [filmingSheet, setFilmingSheet] = useState<ActivionFilmingSheet>({
    sheetFormat: '3 x 4 (12 Img)',
    filmSize: '14 x 17 in',
    copies: 2,
    selectedSeries: 'AXIAL BRAIN 0.7mm',
    startSlice: 1,
    endSlice: 24,
    interval: 2,
    totalFilms: 2,
    targetPrinter: 'DRYPIX 7000 (Laser DICOM Print)'
  });
  const [printSuccessAlert, setPrintSuccessAlert] = useState<boolean>(false);

  // Raw-Data Reconstruction Plan State
  const [rawDataPlan, setRawDataPlan] = useState<RawDataReconstructionPlan>({
    reconMatrix: '512 x 512',
    filterKernel: 'FC13 (Brain Soft)',
    iterativeDenoising: 'AIDR 3D Standard',
    sliceThickness: '0.7mm',
    sliceInterval: '0.7mm',
    fovDiameter: '240mm'
  });
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [reconDoneNotice, setReconDoneNotice] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; startWw: number; startWl: number; button?: number }>({
    x: 0,
    y: 0,
    startWw: selectedCase.ww,
    startWl: selectedCase.wl,
    button: 0
  });
  const isDraggingRef = useRef<boolean>(false);

  const handleSelectCase = (c: RealActivionCase) => {
    setSelectedCase(c);
    setSliceIndex(c.currentSlice);
    setWw(c.ww);
    setWl(c.wl);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setRotationAngle(0);
    setShowClinicalNotes(false);

    if (c.id === 'case_cranio_emergencia') {
      setActiveProtocol(SCAN_PROTOCOLS.head_emergency);
      setSelectedProtocolKey('head_emergency');
      setRawDataPlan(prev => ({ ...prev, filterKernel: 'FC13 (Brain Soft)', sliceThickness: '0.5mm' }));
      setDicomSlices(generateTestDicomSeries('head_ct', 256));
      setIsCustomDicomUploaded(false);
      setSliceIndex(16);
    } else if (c.id === 'case_karina_cranio') {
      setActiveProtocol(SCAN_PROTOCOLS.head_routine);
      setSelectedProtocolKey('head_routine');
      setRawDataPlan(prev => ({ ...prev, filterKernel: 'FC13 (Brain Soft)', sliceThickness: '0.7mm' }));
      setDicomSlices(generateTestDicomSeries('head_ct', 256));
      setIsCustomDicomUploaded(false);
      setSliceIndex(16);
    } else if (c.id === 'case_torax_hrct') {
      setActiveProtocol(SCAN_PROTOCOLS.chest_hrct);
      setSelectedProtocolKey('chest_hrct');
      setRawDataPlan(prev => ({ ...prev, filterKernel: 'FC07 (Lung Sharp)', sliceThickness: '0.5mm' }));
      setDicomSlices(generateTestDicomSeries('chest_ct', 256));
      setIsCustomDicomUploaded(false);
      setSliceIndex(16);
    } else if (c.id === 'case_torax_tep') {
      setActiveProtocol(SCAN_PROTOCOLS.chest_angio);
      setSelectedProtocolKey('chest_angio');
      setRawDataPlan(prev => ({ ...prev, filterKernel: 'FC07 (Lung Sharp)', sliceThickness: '1.0mm' }));
      setDicomSlices(generateTestDicomSeries('chest_ct', 256));
      setIsCustomDicomUploaded(false);
      setSliceIndex(16);
    } else if (c.id === 'case_abdomen_contraste') {
      setActiveProtocol(SCAN_PROTOCOLS.abdomen_contrast);
      setSelectedProtocolKey('abdomen_contrast');
      setRawDataPlan(prev => ({ ...prev, filterKernel: 'FC01 (Standard Soft)', sliceThickness: '1.0mm' }));
      setDicomSlices(generateTestDicomSeries('abdomen_ct', 256));
      setIsCustomDicomUploaded(false);
      setSliceIndex(16);
    } else {
      setActiveProtocol(SCAN_PROTOCOLS.abdomen_tri);
      setSelectedProtocolKey('abdomen_tri');
      setRawDataPlan(prev => ({ ...prev, filterKernel: 'FC01 (Standard Soft)', sliceThickness: '1.0mm' }));
      setDicomSlices(generateTestDicomSeries('abdomen_ct', 256));
      setIsCustomDicomUploaded(false);
      setSliceIndex(16);
    }
  };

  const handleSelectProtocol = (protoKey: string) => {
    const proto = SCAN_PROTOCOLS[protoKey];
    if (!proto) return;
    playCanonAudioCue('click');
    setSelectedProtocolKey(protoKey);
    setActiveProtocol(proto);
    setScanStep('scout_view');
    setScanProgress(0);
    setVoiceCommand('Pronto para Aquisição');

    // Adapt scout orientation based on body region
    if (proto.bodyRegion === 'HEAD' || proto.bodyRegion === 'SPINE') {
      setSelectedScoutOrientation('LAT');
    } else {
      setSelectedScoutOrientation('AP');
    }

    // Adapt DICOM synthetic dataset according to anatomical body region
    if (proto.bodyRegion === 'HEAD' || proto.bodyRegion === 'SPINE') {
      setDicomSlices(generateTestDicomSeries('head_ct', 256));
      setWw(88);
      setWl(40);
    } else if (proto.bodyRegion === 'CHEST' || proto.bodyRegion === 'CARDIAC') {
      setDicomSlices(generateTestDicomSeries('chest_ct', 256));
      setWw(proto.contrastInjected ? 600 : 1500);
      setWl(proto.contrastInjected ? 200 : -600);
    } else {
      setDicomSlices(generateTestDicomSeries('abdomen_ct', 256));
      setWw(280);
      setWl(65);
    }

    setDicomStatusNotice({
      message: `📋 Protocolo Canon [${proto.protocolCode}]: ${proto.protocolName} selecionado. Parâmetros carregados!`,
      isError: false
    });
    setTimeout(() => setDicomStatusNotice(null), 4000);
  };

  // Render DICOM slices to HTML5 Canvases in Axial, Coronal and Sagittal Viewports
  useEffect(() => {
    if (topMode !== 'MPR' || dicomSlices.length === 0) return;
    
    // 1. Axial Canvas
    if (axialCanvasRef.current) {
      const currentIdx = Math.min(dicomSlices.length - 1, Math.max(0, sliceIndex - 1));
      const slice = dicomSlices[currentIdx];
      if (slice) {
        renderDicomSliceToCanvas(slice, axialCanvasRef.current, ww, wl, invertGrayscale);
      }
    }

    // 2. Coronal Multi-Planar Orthogonal Canvas
    if (coronalCanvasRef.current) {
      renderOrthogonalCoronalSlice(dicomSlices, crosshairPos.y, coronalCanvasRef.current, ww, wl, invertGrayscale);
    }

    // 3. Sagittal Multi-Planar Orthogonal Canvas
    if (sagittalCanvasRef.current) {
      renderOrthogonalSagittalSlice(dicomSlices, crosshairPos.x, sagittalCanvasRef.current, ww, wl, invertGrayscale);
    }
  }, [topMode, sliceIndex, ww, wl, invertGrayscale, dicomSlices, crosshairPos]);

  // Sample HU Attenuation Profile along a Caliper Line Segment
  const sampleLineAttenuation = (
    slice: DicomSliceData,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { meanHu: number; minHu: number; maxHu: number; tissue: string } => {
    const steps = Math.max(10, Math.round(Math.hypot(x2 - x1, y2 - y1)));
    let sum = 0;
    let min = 9999;
    let max = -9999;
    let count = 0;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = Math.round(x1 + (x2 - x1) * t);
      const py = Math.round(y1 + (y2 - y1) * t);
      if (px >= 0 && px < slice.columns && py >= 0 && py < slice.rows) {
        const idx = py * slice.columns + px;
        const hu = slice.pixelData[idx] * slice.rescaleSlope + slice.rescaleIntercept;
        sum += hu;
        if (hu < min) min = hu;
        if (hu > max) max = hu;
        count++;
      }
    }

    if (count === 0) return { meanHu: 0, minHu: 0, maxHu: 0, tissue: 'Indeterminado' };
    const meanHu = Math.round(sum / count);

    let tissue = 'Partes Moles';
    if (meanHu < -700) tissue = 'Ar / Parênquima Pulmonar';
    else if (meanHu < -30) tissue = 'Tecido Adiposo (Gordura)';
    else if (meanHu >= 0 && meanHu <= 20) tissue = 'Líquido / LCR / Cístico';
    else if (meanHu > 20 && meanHu <= 50) tissue = 'Partes Moles / Parênquima';
    else if (meanHu > 50 && meanHu <= 90) tissue = 'Sangue Agudo / Hematoma';
    else if (meanHu > 90 && meanHu <= 250) tissue = 'Contraste Iodado / Calcificação';
    else if (meanHu > 250) tissue = 'Estrutura Óssea / Cortical';

    return { meanHu, minHu: min === 9999 ? 0 : min, maxHu: max === -9999 ? 0 : max, tissue };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!axialCanvasRef.current || dicomSlices.length === 0) return;
    const currentIdx = Math.min(dicomSlices.length - 1, Math.max(0, sliceIndex - 1));
    const slice = dicomSlices[currentIdx];
    if (!slice) return;

    const rect = axialCanvasRef.current.getBoundingClientRect();
    const scaleX = slice.columns / rect.width;
    const scaleY = slice.rows / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const probe = getHuAtCoordinate(slice, px, py);
    setHoveredHu({ hu: probe.hu, tissue: probe.tissue, x: px, y: py });

    // Live Caliper preview when Point 1 is set and waiting for Point 2
    if (activeTool === 'Measure' && rulerPoints.p1 && !rulerPoints.p2) {
      const pixelSpacingX = slice.pixelSpacing?.[1] || 0.625;
      const pixelSpacingY = slice.pixelSpacing?.[0] || 0.625;
      const dxMm = (px - rulerPoints.p1.x) * pixelSpacingX;
      const dyMm = (py - rulerPoints.p1.y) * pixelSpacingY;
      const dist = Math.hypot(dxMm, dyMm);
      const angle = (Math.atan2(py - rulerPoints.p1.y, px - rulerPoints.p1.x) * 180) / Math.PI;

      setRulerPoints(prev => ({
        ...prev,
        liveMouse: { x: px, y: py },
        distanceMm: Math.round(dist * 10) / 10,
        angleDeg: Math.round(angle * 10) / 10
      }));
    }
  };

  const handleAxialCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!axialCanvasRef.current || dicomSlices.length === 0) return;
    const currentIdx = Math.min(dicomSlices.length - 1, Math.max(0, sliceIndex - 1));
    const slice = dicomSlices[currentIdx];
    if (!slice) return;

    const rect = axialCanvasRef.current.getBoundingClientRect();
    const fracX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const fracY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const px = fracX * slice.columns;
    const py = fracY * slice.rows;

    if (activeTool === 'Cursor' || activeTool === 'Oblique') {
      setCrosshairPos({ x: fracX, y: fracY });
      playCanonAudioCue('click');
    } else if (activeTool === 'Measure') {
      if (!rulerPoints.p1 || (rulerPoints.p1 && rulerPoints.p2)) {
        // First Point Clicked: Start Caliper
        setRulerPoints({
          p1: { x: px, y: py },
          p2: null,
          liveMouse: { x: px, y: py },
          distanceMm: 0,
          angleDeg: 0,
          meanHu: null,
          minHu: null,
          maxHu: null,
          tissueProfile: null,
          viewport: 'axial'
        });
        playCanonAudioCue('beep');
      } else if (rulerPoints.p1 && !rulerPoints.p2) {
        // Second Point Clicked: Confirm & Lock Caliper Measurement
        const pixelSpacingX = slice.pixelSpacing?.[1] || 0.625;
        const pixelSpacingY = slice.pixelSpacing?.[0] || 0.625;
        const dxMm = (px - rulerPoints.p1.x) * pixelSpacingX;
        const dyMm = (py - rulerPoints.p1.y) * pixelSpacingY;
        const dist = Math.hypot(dxMm, dyMm);
        const angle = (Math.atan2(py - rulerPoints.p1.y, px - rulerPoints.p1.x) * 180) / Math.PI;

        const attenuation = sampleLineAttenuation(slice, rulerPoints.p1.x, rulerPoints.p1.y, px, py);
        const distMmRounded = Math.round(dist * 10) / 10;
        const angleDegRounded = Math.round(angle * 10) / 10;

        const newMeasurement: CaliperMeasurement = {
          id: 'caliper_' + Date.now(),
          p1: rulerPoints.p1,
          p2: { x: px, y: py },
          distanceMm: distMmRounded,
          distanceCm: Math.round((distMmRounded / 10) * 100) / 100,
          angleDeg: angleDegRounded,
          deltaXmm: Math.round(Math.abs(dxMm) * 10) / 10,
          deltaYmm: Math.round(Math.abs(dyMm) * 10) / 10,
          meanHu: attenuation.meanHu,
          minHu: attenuation.minHu,
          maxHu: attenuation.maxHu,
          tissueProfile: attenuation.tissue,
          sliceIndex,
          viewport: 'axial',
          label: `D${savedMeasurements.length + 1}`
        };

        setRulerPoints({
          p1: rulerPoints.p1,
          p2: { x: px, y: py },
          liveMouse: null,
          distanceMm: distMmRounded,
          angleDeg: angleDegRounded,
          meanHu: attenuation.meanHu,
          minHu: attenuation.minHu,
          maxHu: attenuation.maxHu,
          tissueProfile: attenuation.tissue,
          viewport: 'axial'
        });

        setSavedMeasurements(prev => [...prev, newMeasurement]);
        playCanonAudioCue('success');

        setDicomStatusNotice({
          message: `📏 Caliper: ${distMmRounded} mm (${(distMmRounded / 10).toFixed(2)} cm) • Média: ${attenuation.meanHu > 0 ? '+' : ''}${attenuation.meanHu} HU (${attenuation.tissue})`,
          isError: false
        });
        setTimeout(() => setDicomStatusNotice(null), 4500);
      }
    } else if (activeTool === 'ROI') {
      // Create a 20px radius ROI around click point and compute HU metrics
      const radiusX = 18;
      const radiusY = 18;
      const stats = calculateRoiStatistics(slice, px, py, radiusX, radiusY);
      setRoiMetrics({
        cx: px,
        cy: py,
        rx: radiusX,
        ry: radiusY,
        meanHu: stats.meanHu,
        sdHu: stats.sdHu,
        minHu: stats.minHu,
        maxHu: stats.maxHu,
        areaCm2: stats.areaCm2
      });
      playCanonAudioCue('success');
    }
  };

  const handleCoronalCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!coronalCanvasRef.current || dicomSlices.length === 0) return;
    const rect = coronalCanvasRef.current.getBoundingClientRect();
    const fracX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const fracZ = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeTool === 'Measure') {
      const firstSlice = dicomSlices[0];
      const spacingX = firstSlice?.pixelSpacing?.[1] || 0.625;
      const spacingZ = firstSlice?.sliceThickness || 1.0;
      const px = fracX * (firstSlice?.columns || 256);
      const pz = fracZ * (dicomSlices.length * 3.5);

      if (!rulerPoints.p1 || (rulerPoints.p1 && rulerPoints.p2)) {
        setRulerPoints({
          p1: { x: px, y: pz },
          p2: null,
          liveMouse: { x: px, y: pz },
          distanceMm: 0,
          angleDeg: 0,
          meanHu: null,
          minHu: null,
          maxHu: null,
          tissueProfile: null,
          viewport: 'coronal'
        });
        playCanonAudioCue('beep');
      } else if (rulerPoints.p1 && !rulerPoints.p2) {
        const dxMm = (px - rulerPoints.p1.x) * spacingX;
        const dzMm = (pz - rulerPoints.p1.y) * spacingZ;
        const dist = Math.hypot(dxMm, dzMm);
        const distMmRounded = Math.round(dist * 10) / 10;

        setRulerPoints({
          p1: rulerPoints.p1,
          p2: { x: px, y: pz },
          liveMouse: null,
          distanceMm: distMmRounded,
          angleDeg: 0,
          meanHu: null,
          minHu: null,
          maxHu: null,
          tissueProfile: 'Multiplanar Coronal',
          viewport: 'coronal'
        });
        playCanonAudioCue('success');
      }
      return;
    }

    // Update Sagittal plane position (X) and Axial slice position (Z)
    setCrosshairPos(prev => ({ ...prev, x: fracX }));
    const newSliceIdx = Math.max(1, Math.min(dicomSlices.length, Math.round((1.0 - fracZ) * (dicomSlices.length - 1)) + 1));
    setSliceIndex(newSliceIdx);
    playCanonAudioCue('click');
  };

  const handleSagittalCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sagittalCanvasRef.current || dicomSlices.length === 0) return;
    const rect = sagittalCanvasRef.current.getBoundingClientRect();
    const fracY = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const fracZ = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (activeTool === 'Measure') {
      const firstSlice = dicomSlices[0];
      const spacingY = firstSlice?.pixelSpacing?.[0] || 0.625;
      const spacingZ = firstSlice?.sliceThickness || 1.0;
      const py = fracY * (firstSlice?.rows || 256);
      const pz = fracZ * (dicomSlices.length * 3.5);

      if (!rulerPoints.p1 || (rulerPoints.p1 && rulerPoints.p2)) {
        setRulerPoints({
          p1: { x: py, y: pz },
          p2: null,
          liveMouse: { x: py, y: pz },
          distanceMm: 0,
          angleDeg: 0,
          meanHu: null,
          minHu: null,
          maxHu: null,
          tissueProfile: null,
          viewport: 'sagittal'
        });
        playCanonAudioCue('beep');
      } else if (rulerPoints.p1 && !rulerPoints.p2) {
        const dyMm = (py - rulerPoints.p1.x) * spacingY;
        const dzMm = (pz - rulerPoints.p1.y) * spacingZ;
        const dist = Math.hypot(dyMm, dzMm);
        const distMmRounded = Math.round(dist * 10) / 10;

        setRulerPoints({
          p1: rulerPoints.p1,
          p2: { x: py, y: pz },
          liveMouse: null,
          distanceMm: distMmRounded,
          angleDeg: 0,
          meanHu: null,
          minHu: null,
          maxHu: null,
          tissueProfile: 'Multiplanar Sagital',
          viewport: 'sagittal'
        });
        playCanonAudioCue('success');
      }
      return;
    }

    // Update Coronal plane position (Y) and Axial slice position (Z)
    setCrosshairPos(prev => ({ ...prev, y: fracY }));
    const newSliceIdx = Math.max(1, Math.min(dicomSlices.length, Math.round((1.0 - fracZ) * (dicomSlices.length - 1)) + 1));
    setSliceIndex(newSliceIdx);
    playCanonAudioCue('click');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      playCanonAudioCue('beep');
      const fileArray = Array.from(files);
      const parsedSeries = await parseMultipleDicomFiles(fileArray);

      setDicomSlices(parsedSeries.slices);
      setIsCustomDicomUploaded(true);
      setSliceIndex(Math.min(parsedSeries.slices.length, Math.max(1, Math.floor(parsedSeries.slices.length / 2))));
      
      const firstSlice = parsedSeries.slices[0];
      setWw(firstSlice.windowWidth || 400);
      setWl(firstSlice.windowCenter || 40);

      // Initialize crosshair at center of the reconstructed volume
      setCrosshairPos({ x: 0.5, y: 0.5 });
      setRulerPoints({
        p1: null,
        p2: null,
        liveMouse: null,
        distanceMm: null,
        angleDeg: null,
        meanHu: null,
        minHu: null,
        maxHu: null,
        tissueProfile: null,
        viewport: 'axial'
      });
      setSavedMeasurements([]);
      setRoiMetrics(null);

      setSelectedCase(prev => ({
        ...prev,
        patientName: parsedSeries.metadata.patientName || 'PACIENTE DICOM REAL',
        patientId: parsedSeries.metadata.patientId || 'DCM-001',
        protocolName: `${parsedSeries.metadata.modality} ${parsedSeries.metadata.seriesDescription || 'SÉRIE DICOM IMPORTADA'}`,
        studyDateTime: parsedSeries.metadata.studyDate || prev.studyDateTime,
        kv: `${parsedSeries.metadata.kvp || '120'}kV`,
        ma: `${parsedSeries.metadata.tubeCurrent || '200'}mAs`,
        thickness: `${firstSlice.sliceThickness || '1.0'}mm`,
        totalImages: parsedSeries.slices.length,
        currentSlice: Math.floor(parsedSeries.slices.length / 2),
        findingDescription: `Série DICOM com ${parsedSeries.slices.length} cortes carregada no reconstrutor MPR Canon. Matriz: ${firstSlice.columns}x${firstSlice.rows}. Planos Coronal e Sagital sintetizados dinamicamente a partir dos voxels 3D.`
      }));

      playCanonAudioCue('success');
      setDicomStatusNotice({
        message: `✅ Reconstrutor MPR Canon: ${parsedSeries.slices.length} cortes DICOM carregados com sucesso! Planos Coronal e Sagital prontos em tempo real.`,
        isError: false
      });
      setShowDicomDirectoryModal(false);
      setTimeout(() => setDicomStatusNotice(null), 6000);
    } catch (err: any) {
      console.error(err);
      setDicomStatusNotice({
        message: `❌ Erro na reconstrução MPR: ${err.message || 'Arquivo corrompido ou sem suporte'}`,
        isError: true
      });
      setTimeout(() => setDicomStatusNotice(null), 6000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadCurrentSliceDicom = () => {
    if (dicomSlices.length === 0) return;
    const currentIdx = Math.min(dicomSlices.length - 1, Math.max(0, sliceIndex - 1));
    const slice = dicomSlices[currentIdx];
    const blob = generateDicomPart10Blob(
      slice,
      selectedCase.patientName,
      selectedCase.patientId,
      new Date().toISOString().slice(0, 10).replace(/-/g, '')
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACTIVION16_${selectedCase.patientId}_SLICE_${sliceIndex}.dcm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDicomStatusNotice({
      message: `📥 Arquivo binário DICOM Parte 10 (.dcm) gerado e baixado! Pronto para abrir no RadiAnt, Horos ou Weasis.`,
      isError: false
    });
    setTimeout(() => setDicomStatusNotice(null), 5000);
  };

  // Stage imported slices and render preview on the importer canvas
  const handleStageImportedDicomSlices = (slices: DicomSliceData[], info: { name: string; count: number; region: string; source: string }) => {
    setStagedImportSlices(slices);
    if (slices.length > 0) {
      const midSlice = slices[Math.floor(slices.length / 2)];
      let minHu = 9999;
      let maxHu = -9999;
      for (let i = 0; i < midSlice.pixelData.length; i++) {
        const hu = midSlice.pixelData[i] * midSlice.rescaleSlope + midSlice.rescaleIntercept;
        if (hu < minHu) minHu = hu;
        if (hu > maxHu) maxHu = hu;
      }
      setStagedImportInfo({
        ...info,
        huRange: `${minHu} HU a +${maxHu} HU`
      });

      setTimeout(() => {
        if (importerPreviewCanvasRef.current) {
          renderDicomSliceToCanvas(midSlice, importerPreviewCanvasRef.current, midSlice.windowWidth, midSlice.windowCenter, false);
        }
      }, 50);
    }
  };

  const handleLoadClinicalSet = async (setKey: 'head_stroke' | 'chest_hrct' | 'abdomen_contrast' | 'spine_bone') => {
    setImporterIsProcessing(true);
    playCanonAudioCue('click');

    try {
      if (setKey === 'head_stroke') {
        const slices = generateTestDicomSeries('head_ct', 256);
        handleStageImportedDicomSlices(slices, {
          name: 'TC Crânio - Protocolo AVC / Trauma Agudo (32 Cortes)',
          count: slices.length,
          region: 'CRÂNIO (HEAD)',
          source: 'Galeria Clínica RadBio'
        });
      } else if (setKey === 'chest_hrct') {
        const slices = generateTestDicomSeries('chest_ct', 256);
        handleStageImportedDicomSlices(slices, {
          name: 'TC Tórax - HRCT Parênquima & Angio Pulmonar (32 Cortes)',
          count: slices.length,
          region: 'TÓRAX (CHEST)',
          source: 'Galeria Clínica RadBio'
        });
      } else if (setKey === 'abdomen_contrast') {
        const slices = generateTestDicomSeries('abdomen_ct', 256);
        handleStageImportedDicomSlices(slices, {
          name: 'TC Abdômen Total - Multifásico Arterial & Portal (32 Cortes)',
          count: slices.length,
          region: 'ABDÔMEN (ABDOMEN)',
          source: 'Galeria Clínica RadBio'
        });
      } else {
        const slices = generateTestDicomSeries('head_ct', 256).map((s, idx) => ({
          ...s,
          windowCenter: 400,
          windowWidth: 1800,
          sliceThickness: 1.0,
          sliceLocation: -60 + idx * 4.0
        }));
        handleStageImportedDicomSlices(slices, {
          name: 'TC Coluna Lombar 3D - Janela Óssea e Canal Vertebral (32 Cortes)',
          count: slices.length,
          region: 'COLUNA (SPINE)',
          source: 'Galeria Clínica RadBio'
        });
      }
      playCanonAudioCue('success');
    } catch (err: any) {
      console.error(err);
      setDicomStatusNotice({
        message: `❌ Erro ao converter set clínico: ${err.message || 'Falha desconhecida'}`,
        isError: true
      });
    } finally {
      setImporterIsProcessing(false);
    }
  };

  const handleImporterFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImporterIsProcessing(true);
    playCanonAudioCue('click');

    try {
      const fileList = Array.from(files);
      const isDicom = fileList.some(f => f.name.toLowerCase().endsWith('.dcm') || f.type.includes('dicom'));

      if (isDicom) {
        const parsed = await parseMultipleDicomFiles(fileList);
        handleStageImportedDicomSlices(parsed.slices, {
          name: `${parsed.metadata.patientName || 'Estudo DICOM Importado'} (${fileList.length} arquivos)`,
          count: parsed.slices.length,
          region: importerBodyRegion,
          source: 'Arquivos DICOM .dcm Locais'
        });
      } else {
        // Standard images (PNG/JPG)
        const result = await importDicomImageSet(fileList, {
          patientName: importerPatientName,
          patientId: importerPatientId,
          bodyRegion: importerBodyRegion,
          targetSize: 256
        });
        handleStageImportedDicomSlices(result.slices, {
          name: `${result.metadata.patientName} (${result.slices.length} cortes convertidos)`,
          count: result.slices.length,
          region: importerBodyRegion,
          source: 'Imagens Locais (PNG/JPG) Convertidas para DICOM 16-Bit'
        });
      }
      playCanonAudioCue('success');
    } catch (err: any) {
      console.error(err);
      setDicomStatusNotice({
        message: `❌ Erro no Importador de Imagens: ${err.message || 'Falha ao processar arquivos'}`,
        isError: true
      });
    } finally {
      setImporterIsProcessing(false);
      if (importerFileInputRef.current) importerFileInputRef.current.value = '';
    }
  };

  const handleImportBase64String = async () => {
    if (!importerBase64Input.trim()) {
      setDicomStatusNotice({
        message: '⚠️ Cole uma string Base64 ou Data URI válida (ex: data:image/png;base64,...)',
        isError: true
      });
      return;
    }

    setImporterIsProcessing(true);
    playCanonAudioCue('click');

    try {
      const cleanInput = importerBase64Input.trim();
      const result = await importDicomImageSet([cleanInput], {
        patientName: importerPatientName,
        patientId: importerPatientId,
        bodyRegion: importerBodyRegion,
        targetSize: 256
      });

      handleStageImportedDicomSlices(result.slices, {
        name: `${importerPatientName} (Base64 / Data URI)`,
        count: result.slices.length,
        region: importerBodyRegion,
        source: 'String Base64 Decodificada em Matriz de Voxels 16-bit'
      });
      playCanonAudioCue('success');
    } catch (err: any) {
      console.error(err);
      setDicomStatusNotice({
        message: `❌ Erro ao decodificar Base64: ${err.message || 'Formato de imagem inválido'}`,
        isError: true
      });
    } finally {
      setImporterIsProcessing(false);
    }
  };

  const handleApplyStagedSlicesToMpr = () => {
    if (stagedImportSlices.length === 0) return;

    setDicomSlices(stagedImportSlices);
    setIsCustomDicomUploaded(true);
    const midIndex = Math.floor(stagedImportSlices.length / 2);
    setSliceIndex(midIndex + 1);

    const first = stagedImportSlices[0];
    setWw(first.windowWidth || 400);
    setWl(first.windowCenter || 40);

    // Update selectedCase virtual representation
    setSelectedCase(prev => ({
      ...prev,
      id: 'case_custom_imported_' + Date.now(),
      patientName: stagedImportInfo?.name || importerPatientName,
      patientId: importerPatientId,
      totalImages: stagedImportSlices.length,
      currentSlice: midIndex + 1,
      thickness: `${first.sliceThickness || 1.0}mm`,
      ww: first.windowWidth || 400,
      wl: first.windowCenter || 40,
      findingDescription: `Série DICOM importada com ${stagedImportSlices.length} cortes volumétricos e matriz 16-bit processada pelo motor MPR Canon.`,
      educationalNotes: `Processamento em tempo real com algoritmo de interpolação ortogonal para planos Coronal e Sagital a partir dos cortes Axiais carregados.`
    }));

    setShowDicomImporterModal(false);
    playCanonAudioCue('success');

    setDicomStatusNotice({
      message: `⚡ [DICOM Importer] ${stagedImportSlices.length} cortes aplicados com sucesso ao motor MPR 3D! Planos Axial, Coronal e Sagital renderizados.`,
      isError: false
    });
    setTimeout(() => setDicomStatusNotice(null), 6000);
  };

  // Clinical Window Presets for CT Diagnostics
  const CLINICAL_WINDOW_PRESETS = [
    { id: 'brain', name: '1. Crânio (Brain)', ww: 88, wl: 40, desc: 'Diferenciação Substância Cinzenta / Branca', icon: 'psychology' },
    { id: 'stroke', name: '2. AVC Isquêmico Agudo', ww: 30, wl: 30, desc: 'Edema citotóxico precoce em janela ultra-estreita', icon: 'emergency' },
    { id: 'blood', name: '3. Sangue / Hematoma', ww: 130, wl: 50, desc: 'Hemorragia aguda subdural / intraparenquimatosa', icon: 'water_drop' },
    { id: 'bone', name: '4. Óssea (Bone)', ww: 2000, wl: 500, desc: 'Cortical, díploe, trabéculas e fraturas', icon: 'skeleton' },
    { id: 'lung', name: '5. Pulmão (Lung)', ww: 1500, wl: -600, desc: 'Parênquima pulmonar, bronquiectasias e nódulos', icon: 'air' },
    { id: 'mediastinum', name: '6. Mediastino / Moles', ww: 350, wl: 40, desc: 'Coração, linfonodos e partes moles', icon: 'favorite' },
    { id: 'abdomen', name: '7. Fígado / Abdômen', ww: 280, wl: 65, desc: 'Parênquima hepático, baço e órgãos abdominais', icon: 'nutrition' },
    { id: 'angio', name: '8. Angiotomografia (CTA)', ww: 600, wl: 200, desc: 'Lúmen arterial e venoso contrastado', icon: 'bloodtype' },
    { id: 'innerear', name: '9. Ouvido / Mastóide', ww: 4000, wl: 700, desc: 'Cadeia ossicular e labirinto membranoso', icon: 'hearing' },
    { id: 'spine', name: '10. Coluna / Canal Medular', ww: 1800, wl: 400, desc: 'Canal vertebral e forames neurais', icon: 'accessibility_new' }
  ];

  // Auto-Window Calculator based on Slice HU Intensity Distribution
  const handleAutoWindowCurrentSlice = () => {
    if (dicomSlices.length === 0) return;
    const curSlice = dicomSlices[Math.min(dicomSlices.length - 1, Math.max(0, sliceIndex - 1))];
    if (!curSlice) return;

    const data = curSlice.pixelData;
    const slope = curSlice.rescaleSlope;
    const intercept = curSlice.rescaleIntercept;

    const sample: number[] = [];
    const step = Math.max(1, Math.floor(data.length / 3000));
    for (let i = 0; i < data.length; i += step) {
      const hu = data[i] * slope + intercept;
      if (hu > -950) { // filter out background air unless chest
        sample.push(hu);
      }
    }

    if (sample.length > 50) {
      sample.sort((a, b) => a - b);
      const p5 = sample[Math.floor(sample.length * 0.05)];
      const p95 = sample[Math.floor(sample.length * 0.95)];
      const autoWw = Math.max(30, Math.round(p95 - p5));
      const autoWl = Math.round((p95 + p5) / 2);
      setWw(autoWw);
      setWl(autoWl);
      playCanonAudioCue('success');
      setDicomStatusNotice({
        message: `✨ Auto-Janelamento calculado: WW=${autoWw} HU | WL=${autoWl} HU (Otimização dinâmica por distribuição de voxels)`,
        isError: false
      });
      setTimeout(() => setDicomStatusNotice(null), 3500);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, viewportName: 'coronal' | 'sagittal' | 'axial') => {
    setActiveViewport(viewportName);
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startWw: ww,
      startWl: wl,
      button: e.button
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (topMode === 'MPR') {
      // Right-click drag OR Filter/Cursor active tool drag triggers dynamic windowing
      if (dragStartRef.current.button === 2 || activeTool === 'Cursor' || activeTool === 'Filter') {
        const nextWw = Math.max(10, Math.min(4000, dragStartRef.current.startWw + dx * 2.5));
        const nextWl = Math.max(-1000, Math.min(1500, dragStartRef.current.startWl - dy * 2.0));
        setWw(Math.round(nextWw));
        setWl(Math.round(nextWl));
      } else if (activeTool === 'Rotate') {
        setRotationAngle(prev => (prev + dx * 0.5) % 360);
      }
    } else if (topMode === '3D') {
      setThreeDParams(prev => ({
        ...prev,
        rotationY: prev.rotationY + dx * 0.4,
        rotationX: prev.rotationX - dy * 0.4
      }));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Keyboard navigation for slice scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setSliceIndex(prev => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        setSliceIndex(prev => Math.min(selectedCase.totalImages, prev + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedCase.totalImages]);

  // Scan simulation timer with authentic SUREStart Bolus Tracker and Canon Voice/Audio cues
  const handleTriggerScan = () => {
    if (activeProtocol.contrastInjected && scanStep !== 'surestart' && scanStep !== 'scan_running') {
      // Step 1: Start SUREStart Bolus Tracking sequence
      setScanStep('surestart');
      setBolusTrackerHu(40);
      setVoiceCommand(`Injeção de Contraste Iniciada (${activeProtocol.contrastProtocol?.flow || '4.0 mL/s'}). Monitorando ${activeProtocol.contrastProtocol?.triggerVessel || 'Vaso Alvo'}...`);
      playCanonAudioCue('beep');

      let hu = 40;
      const targetThreshold = activeProtocol.contrastProtocol?.triggerHu || 140;
      const sureStartInterval = setInterval(() => {
        hu += 25 + Math.floor(Math.random() * 15);
        setBolusTrackerHu(hu);

        if (hu >= targetThreshold) {
          clearInterval(sureStartInterval);
          playCanonAudioCue('breath_hold');
          setVoiceCommand(activeProtocol.voicePrompt || 'Atenção: Respire Fundo e Prenda a Respiração...');
          
          setTimeout(() => {
            playCanonAudioCue('exposure_start');
            setScanStep('scan_running');
            setScanProgress(0);
            setXrayTubeHeat(prev => Math.min(95, prev + 14));

            let current = 0;
            const scanInterval = setInterval(() => {
              current += 10;
              setScanProgress(current);
              if (current >= 100) {
                clearInterval(scanInterval);
                setScanStep('scan_completed');
                setVoiceCommand('Exame Concluído. Pode respirar normalmente.');
                playCanonAudioCue('exposure_end');
                setTimeout(() => playCanonAudioCue('success'), 400);
              }
            }, 300);
          }, 1200);
        }
      }, 400);

      return;
    }

    // Direct Non-Contrast Helical/Sequential Scan
    playCanonAudioCue('breath_hold');
    setScanStep('scan_running');
    setScanProgress(0);
    setVoiceCommand(activeProtocol.voicePrompt || 'Atenção: Respire Fundo e Prenda a Respiração...');
    setXrayTubeHeat(prev => Math.min(95, prev + 12));

    setTimeout(() => {
      playCanonAudioCue('exposure_start');
    }, 1200);

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setScanProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setScanStep('scan_completed');
        setVoiceCommand('Exame Concluído. Pode respirar normalmente.');
        playCanonAudioCue('exposure_end');
        setTimeout(() => playCanonAudioCue('success'), 400);
      }
    }, 320);
  };

  const handleExecuteReconstruction = () => {
    playCanonAudioCue('click');
    setIsReconstructing(true);
    setReconDoneNotice(false);
    setTimeout(() => {
      setIsReconstructing(false);
      setReconDoneNotice(true);
      playCanonAudioCue('success');
    }, 1800);
  };

  const handleSendToPrint = () => {
    playCanonAudioCue('click');
    setPrintSuccessAlert(true);
    setTimeout(() => {
      playCanonAudioCue('beep');
      setPrintSuccessAlert(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 bg-black/95 select-none font-sans text-gray-200">
      {/* Canon Workstation Industrial Machine Chassis (Console de Operação Real) */}
      <div className="relative w-full max-w-[1440px] h-[98vh] max-h-[960px] bg-[#1d222e] rounded-sm border-t-2 border-l-2 border-[#546080] border-b-4 border-r-4 border-[#0c0e14] shadow-[0_0_80px_rgba(0,0,0,0.98)] flex flex-col overflow-hidden text-[11px]">

        {/* ===================== TOP HEADER CONSOLE (Real Operation Workstation) ===================== */}
        <div className="h-9 min-h-[36px] bg-gradient-to-r from-[#292f3f] via-[#32394c] to-[#292f3f] border-b-2 border-[#151821] px-3 flex items-center justify-between shrink-0 text-[#c8d1e0] font-mono text-xs z-30 overflow-x-auto shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            {/* Physical Hardware Status LEDs */}
            <div className="flex items-center gap-1.5 bg-[#141822] px-2 py-0.5 rounded-sm border border-[#3e475e]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" title="System Power OK" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" title="Slip-Ring Communication Active" />
              <span className="text-[8px] font-bold text-gray-400 tracking-wider">CANON CONSOLE</span>
            </div>

            {/* Activion 16 Logo Script */}
            <div className="flex items-center gap-1 font-bold tracking-tight">
              <span className="italic font-serif text-base text-gray-100 font-extrabold tracking-wider drop-shadow-sm">
                Aquilion / Activion
              </span>
              <span className="text-[10px] text-cyan-300 font-sans font-bold bg-[#141d2c] px-1.5 py-0.2 rounded-sm border border-cyan-500/50">
                16
              </span>
            </div>

            <div className="h-4 w-px bg-gray-600" />

            {/* Date Time & Volume Counters */}
            <span className="text-[11px] text-gray-300 font-bold">
              Apr 12 08:23:2024
            </span>

            <div className="flex items-center gap-1.5 text-[10px] bg-[#141822] px-2 py-0.5 rounded-sm border border-[#384156]">
              <span className="text-gray-400 font-medium">Vol.</span>
              <span className="text-cyan-400 font-bold">5800</span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400 font-medium">Img.</span>
              <span className="text-emerald-400 font-bold">{selectedCase.totalImages}</span>
            </div>

            {/* Current Active Mode Tag */}
            <span className="px-2 py-0.5 rounded-sm bg-[#1c2436] text-cyan-300 font-bold border border-cyan-500/40 text-[10px]">
              MODO: {topMode}
            </span>
          </div>

          {/* Machine ID Tag: "Cod. TC01" */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-sm bg-[#11141c] border border-[#3e475e] text-gray-300 font-mono text-xs font-bold tracking-wider shadow-inner">
              {selectedCase.caseCode}
            </span>

            {/* Hidden DICOM File Input (Supports Multi-File Stack Upload) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".dcm,application/dicom"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Hidden Importer File Input (Supports Images PNG/JPG/WebP + DICOM) */}
            <input
              ref={importerFileInputRef}
              type="file"
              multiple
              accept=".dcm,image/png,image/jpeg,image/jpg,image/webp,application/dicom"
              onChange={handleImporterFilesSelected}
              className="hidden"
            />

            {/* Real DICOM Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  setShowDicomImporterModal(true);
                }}
                title="Abrir Importador de Imagens DICOM (Carregar Sets Locais, Base64 e Blobs para o Motor MPR)"
                className="px-2.5 py-0.5 rounded bg-gradient-to-r from-emerald-800/80 to-teal-800/80 hover:brightness-125 border border-emerald-400/60 text-emerald-200 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-xs text-emerald-300">image_search</span>
                <span>Importador DICOM</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Carregar série ou arquivos DICOM (.dcm) do seu computador para o reconstrutor MPR"
                className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-xs">upload_file</span>
                <span>Série .dcm</span>
              </button>

              <button
                onClick={handleDownloadCurrentSliceDicom}
                title="Baixar corte atual como arquivo binário DICOM Parte 10 (.dcm) oficial"
                className="px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                <span>Exportar .dcm</span>
              </button>

              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  setShowDicomDirectoryModal(true);
                }}
                title="Abrir RadBio PACS Workstation (Servidor de Exames DICOM C-FIND/C-MOVE)"
                className="px-2.5 py-0.5 rounded bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:brightness-125 border border-purple-400/60 text-purple-200 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="material-symbols-outlined text-xs text-purple-300">hub</span>
                <span>RadBio PACS</span>
              </button>

              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  setShowWindowControlsModal(true);
                }}
                title="Abrir Painel Avançado de Janelamento Diagnóstico (Ajuste de Contraste WW / WL e Presets)"
                className="px-2.5 py-0.5 rounded bg-gradient-to-r from-amber-900/70 to-orange-900/70 hover:brightness-125 border border-amber-400/60 text-amber-200 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-xs text-amber-300">contrast</span>
                <span>Janela (WL:{wl} / WW:{ww})</span>
              </button>

              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  if (activeTool === 'Measure') {
                    setActiveTool('Cursor');
                    setMeasureActive(false);
                  } else {
                    setActiveTool('Measure');
                    setMeasureActive(true);
                  }
                }}
                title="Ativar/Desativar Ferramenta de Medição de Distância (Caliper Linear em mm)"
                className={`px-2.5 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                  activeTool === 'Measure'
                    ? 'bg-amber-500 text-black border-amber-300 font-extrabold shadow-amber-500/50 ring-2 ring-amber-400/60 animate-pulse'
                    : 'bg-gradient-to-r from-amber-950/70 to-yellow-900/60 hover:brightness-125 border-amber-500/50 text-amber-200'
                }`}
              >
                <span className="material-symbols-outlined text-xs">straighten</span>
                <span>{activeTool === 'Measure' ? 'Régua ATIVA' : 'Régua (mm)'}</span>
                {rulerPoints.distanceMm !== null && (
                  <span className="ml-0.5 px-1 py-0.2 bg-black/80 text-amber-300 rounded font-mono text-[9px] border border-amber-500/40">
                    {rulerPoints.distanceMm}mm
                  </span>
                )}
              </button>
            </div>

            {/* Case Switcher Menu */}
            <select
              value={selectedCase.id}
              onChange={e => {
                const found = CANON_ACTIVION_CASES.find(c => c.id === e.target.value);
                if (found) handleSelectCase(found);
              }}
              className="bg-[#181a23] border border-gray-600 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono cursor-pointer"
            >
              {CANON_ACTIVION_CASES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.patientName} ({c.protocolName.slice(0, 26)})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowClinicalNotes(!showClinicalNotes)}
              className="px-2 py-0.5 rounded-sm bg-[#1c2436] hover:bg-[#28354f] border border-cyan-500/50 text-cyan-300 text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
            >
              Guia Clínico
            </button>

            {/* Radiology Technical Glossary Button */}
            <button
              onClick={() => {
                playCanonAudioCue('click');
                setShowGlossaryModal(true);
              }}
              className="px-2.5 py-0.5 rounded-sm bg-gradient-to-r from-cyan-900/80 to-blue-900/80 hover:brightness-125 border border-cyan-400 text-cyan-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              title="Abrir Glossário Técnico de Termos Radiológicos e Físicos de TC"
            >
              <span className="material-symbols-outlined text-xs text-cyan-300">menu_book</span>
              <span>Glossário TC</span>
            </button>

            {/* Super Visible High-Contrast Close Button in Upper Right */}
            <button
              onClick={onClose}
              title="Fechar Simulador de Tomografia"
              aria-label="Fechar Simulador"
              className="ml-2 shrink-0 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white border-2 border-red-400 font-sans text-[11px] font-black flex items-center gap-1 shadow-[0_0_14px_rgba(239,68,68,0.7)] hover:shadow-[0_0_20px_rgba(239,68,68,0.9)] transition-all cursor-pointer z-40"
            >
              <span className="material-symbols-outlined text-base font-bold leading-none">close</span>
              <span className="leading-none tracking-wider">FECHAR</span>
            </button>
          </div>
        </div>

        {/* Real DICOM Floating Status Notification Banner */}
        {dicomStatusNotice && (
          <div
            className={`px-4 py-1 text-xs font-mono font-bold flex items-center justify-between z-30 transition-all ${
              dicomStatusNotice.isError
                ? 'bg-red-950 border-b border-red-500 text-red-200'
                : 'bg-emerald-950 border-b border-emerald-500 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                {dicomStatusNotice.isError ? 'error' : 'check_circle'}
              </span>
              <span>{dicomStatusNotice.message}</span>
            </div>
            <button
              onClick={() => setDicomStatusNotice(null)}
              className="text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* ===================== MAIN INTERACTION BODY ===================== */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden bg-[#0d0f14]" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

          {/* ----------------- LEFT SIDEBAR: ACTIVION OPERATING SYSTEM MENU (3 Cols) ----------------- */}
          <div className="col-span-3 bg-[#262c3b] border-r-2 border-[#151922] flex flex-col justify-between overflow-y-auto p-2 shadow-inner">
            <div className="space-y-2">

              {/* Status Indicators (0 / 0 / 736) */}
              <div className="grid grid-cols-3 gap-1 bg-[#161a24] p-1 rounded-sm border border-[#3e475e] text-center font-mono text-xs shadow-inner">
                <div className="bg-[#242a38] py-0.5 rounded-sm border border-[#3a445a] text-cyan-300 font-bold">
                  0
                </div>
                <div className="bg-[#242a38] py-0.5 rounded-sm border border-[#3a445a] text-cyan-300 font-bold">
                  0
                </div>
                <div className="bg-[#242a38] py-0.5 rounded-sm border border-cyan-500/50 text-emerald-400 font-extrabold shadow-sm">
                  {sliceIndex}
                </div>
              </div>

              {/* Mode Selection Grid (MPR, 3D, Clinical, Scan, Filming, Raw-Data) - 6 Hardware Modes matching Canon Console */}
              <div className="grid grid-cols-3 gap-1 pt-0.5 font-mono">
                {[
                  { id: 'MPR', label: 'MPR', icon: 'view_quilt' },
                  { id: '3D', label: '3D', icon: 'view_in_ar' },
                  { id: 'Clinical', label: 'Clinical', icon: 'medical_information' },
                  { id: 'Scan', label: 'Scan', icon: 'radar' },
                  { id: 'Filming', label: 'Filming', icon: 'print' },
                  { id: 'RawData', label: 'Raw-Data', icon: 'database' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTopMode(item.id as any)}
                    className={`h-11 rounded-sm border flex flex-col items-center justify-center gap-0.5 font-bold text-[10px] tracking-tight transition-all cursor-pointer ${
                      topMode === item.id
                        ? 'bg-gradient-to-b from-[#e6b422] to-[#b38600] text-slate-950 border-t border-l border-[#ffe066] border-b-2 border-r-2 border-[#594300] shadow-md font-black'
                        : 'bg-gradient-to-b from-[#3d4559] to-[#282d3b] text-[#e0e5f0] border-t border-l border-[#596582] border-b-2 border-r-2 border-[#161a24] hover:brightness-110 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm leading-none">{item.icon}</span>
                    <span className="leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Sub-Panels depending on active Top Mode */}
              {topMode === 'MPR' && (
                <>
                  {/* Utility Sub-Bar with Directory & Auto Load */}
                  <div className="bg-[#1c212d] p-1.5 rounded-sm border border-[#3e475e] flex items-center justify-between shadow-sm">
                    <span className="text-[10px] text-gray-300 font-mono flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-xs text-amber-400">tune</span>
                      Utility
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowDicomDirectoryModal(true)}
                        className="px-2 py-0.5 bg-[#2c3447] hover:bg-[#384259] rounded-sm text-[9px] font-mono border border-gray-600 text-gray-200 cursor-pointer transition-colors shadow-sm"
                      >
                        Directory
                      </button>
                      <button
                        onClick={() => {
                          handleSelectCase(selectedCase);
                          setDicomStatusNotice({
                            message: `Auto Load: ${dicomSlices.length} cortes DICOM recarregados com sucesso no Activion 16!`,
                            isError: false
                          });
                          setTimeout(() => setDicomStatusNotice(null), 3500);
                        }}
                        className="px-2 py-0.5 bg-[#2c3447] hover:bg-[#384259] rounded-sm text-[9px] font-mono border border-gray-600 text-cyan-300 font-bold cursor-pointer transition-colors shadow-sm"
                      >
                        Auto Load
                      </button>
                      <div className="grid grid-cols-2 gap-0.5 ml-1">
                        <span className="px-1 py-0.2 bg-[#10131a] text-[8px] font-mono text-cyan-400 rounded-sm">Cr</span>
                        <span className="px-1 py-0.2 bg-[#10131a] text-[8px] font-mono text-cyan-400 rounded-sm">Sg</span>
                        <span className="px-1 py-0.2 bg-[#10131a] text-[8px] font-mono text-cyan-400 rounded-sm">Ax</span>
                        <span className="px-1 py-0.2 bg-[#10131a] text-[8px] font-mono text-cyan-400 rounded-sm">Ob</span>
                      </div>
                    </div>
                  </div>

                  {/* Projection & Thickness Selectors */}
                  <div className="bg-[#242833] p-2 rounded-lg border border-[#444c5d] space-y-1.5 text-[10px] font-mono shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Project:</span>
                      <select
                        value={projectMode}
                        onChange={e => setProjectMode(e.target.value as any)}
                        className="bg-[#363d4e] border border-gray-600 rounded px-2 py-0.5 text-white font-bold cursor-pointer"
                      >
                        <option value="Average">Average</option>
                        <option value="MIP">MIP</option>
                        <option value="MinIP">MinIP</option>
                        <option value="VR">VR 3D</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Thickness:</span>
                      <select
                        value={thicknessOption}
                        onChange={e => setThicknessOption(e.target.value as any)}
                        className="bg-[#363d4e] border border-gray-600 rounded px-2 py-0.5 text-white font-bold cursor-pointer"
                      >
                        <option value="none">none</option>
                        <option value="1.0mm">1.0mm</option>
                        <option value="2.0mm">2.0mm</option>
                        <option value="5.0mm">5.0mm</option>
                      </select>
                    </div>

                    <button className="w-full mt-1 py-1 rounded bg-gradient-to-b from-[#4a5264] to-[#343b48] border border-gray-600 text-gray-100 font-bold flex items-center justify-center gap-1 hover:brightness-110 shadow-sm">
                      <span className="material-symbols-outlined text-xs">save</span>
                      <span>Image Save</span>
                    </button>
                  </div>

                  {/* Tool1 / Tool2 / Application Tabs */}
                  <div className="flex border-b border-gray-600 text-[10px] font-bold">
                    {(['Tool1', 'Tool2', 'Application'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1 text-center border-t border-x rounded-t transition-all cursor-pointer ${
                          activeTab === tab
                            ? 'bg-[#3e4555] text-amber-400 border-gray-500 font-black shadow-sm'
                            : 'bg-[#252933] text-gray-400 border-transparent hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tool1 Circular Action Grid */}
                  {activeTab === 'Tool1' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 p-2 bg-[#242833] rounded-b-lg border-x border-b border-[#444c5d] shadow-inner">
                        {[
                          { id: 'Filming', label: 'Filming', icon: 'print', color: 'text-cyan-400' },
                          { id: 'Filter', label: 'Filter', icon: 'lens_blur', color: 'text-emerald-400' },
                          { id: 'ImageSelector', label: 'Image selector', icon: 'collections', color: 'text-amber-400' },
                          { id: 'Measure', label: 'Measure', icon: 'straighten', color: 'text-cyan-400' },
                          { id: 'ROI', label: 'ROI (HU)', icon: 'adjust', color: 'text-amber-400' },
                          { id: 'Annotation', label: 'Annotation', icon: 'edit_note', color: 'text-emerald-400' },
                          { id: 'Rotate', label: 'Rotate', icon: 'rotate_right', color: 'text-amber-400' },
                          { id: 'ScreenSave', label: 'Screen Save', icon: 'photo_camera', color: 'text-cyan-400' },
                          { id: 'Cursor', label: 'Cursor', icon: 'arrow_selector_tool', color: 'text-emerald-400' },
                          { id: 'Oblique', label: 'Crosshair', icon: 'crosshair', color: 'text-amber-400' },
                          { id: 'BatchMPR', label: 'Batch MPR', icon: 'layers', color: 'text-cyan-400' },
                          { id: 'Reset', label: 'Reset', icon: 'restart_alt', color: 'text-emerald-400' },
                        ].map(tool => (
                          <button
                            key={tool.id}
                            onClick={() => {
                              playCanonAudioCue('click');
                              if (tool.id === 'Reset') {
                                setWw(selectedCase.ww);
                                setWl(selectedCase.wl);
                                setZoomLevel(1.0);
                                setPanOffset({ x: 0, y: 0 });
                                setRotationAngle(0);
                                setRulerPoints({
                                  p1: null,
                                  p2: null,
                                  liveMouse: null,
                                  distanceMm: null,
                                  angleDeg: null,
                                  meanHu: null,
                                  minHu: null,
                                  maxHu: null,
                                  tissueProfile: null,
                                  viewport: 'axial'
                                });
                                setSavedMeasurements([]);
                                setRoiMetrics(null);
                                setActiveTool('Cursor');
                              } else if (tool.id === 'Filming') {
                                setTopMode('Filming');
                              } else {
                                setActiveTool(tool.id as any);
                                if (tool.id === 'Measure') setMeasureActive(true);
                              }
                            }}
                            className={`h-15 w-15 mx-auto rounded-full border-2 flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                              activeTool === tool.id
                                ? 'bg-gradient-to-b from-[#0284c7] to-[#0369a1] border-cyan-300 text-white font-black shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-400/50'
                                : 'bg-gradient-to-b from-[#3a4150] to-[#252933] border-[#555e71] text-gray-200 hover:border-gray-400 hover:text-white shadow-md'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-base leading-none ${tool.color}`}>
                              {tool.icon}
                            </span>
                            <span className="text-[8px] mt-0.5 leading-tight font-sans text-center">
                              {tool.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Caliper Measurement Guidance & Control Card */}
                      {activeTool === 'Measure' && (
                        <div className="mt-2 p-2 bg-[#1b212d] border border-amber-500/60 rounded-b-lg space-y-1.5 text-[9px] font-mono shadow-inner">
                          <div className="flex items-center justify-between text-amber-300 font-extrabold border-b border-gray-700 pb-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">straighten</span>
                              <span>Caliper Linear de Precisão</span>
                            </span>
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                              mm / cm
                            </span>
                          </div>

                          <div className="text-gray-300 leading-snug">
                            {!rulerPoints.p1 && (
                              <div className="text-yellow-300">
                                👉 <strong>Passo 1:</strong> Clique no início da estrutura para fixar o <strong>Ponto 1</strong>.
                              </div>
                            )}
                            {rulerPoints.p1 && !rulerPoints.p2 && (
                              <div className="text-cyan-300">
                                👉 <strong>Passo 2:</strong> Mova o mouse até o fim da lesão e clique para travar o <strong>Ponto 2</strong>.
                              </div>
                            )}
                            {rulerPoints.p1 && rulerPoints.p2 && (
                              <div className="text-emerald-300 font-bold">
                                ✅ <strong>Medição Fixada:</strong> {rulerPoints.distanceMm} mm ({((rulerPoints.distanceMm || 0)/10).toFixed(2)} cm)
                              </div>
                            )}
                          </div>

                          {rulerPoints.distanceMm !== null && (
                            <div className="bg-black/60 p-1.5 rounded border border-gray-700 space-y-0.5 text-gray-200">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Distância:</span>
                                <strong className="text-amber-300 text-[10px]">
                                  {rulerPoints.distanceMm} mm ({((rulerPoints.distanceMm)/10).toFixed(2)} cm)
                                </strong>
                              </div>
                              {rulerPoints.angleDeg !== null && (
                                <div className="flex justify-between text-gray-400">
                                  <span>Ângulo de Eixo:</span>
                                  <span className="text-white">{rulerPoints.angleDeg}°</span>
                                </div>
                              )}
                              {rulerPoints.meanHu !== null && (
                                <div className="flex justify-between text-gray-400">
                                  <span>Atenuação Média:</span>
                                  <strong className="text-cyan-300">
                                    {rulerPoints.meanHu > 0 ? `+${rulerPoints.meanHu}` : rulerPoints.meanHu} HU
                                  </strong>
                                </div>
                              )}
                              {rulerPoints.tissueProfile && (
                                <div className="text-emerald-400 text-[8px] pt-0.5 border-t border-gray-700 truncate">
                                  Perfil: {rulerPoints.tissueProfile}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-1 pt-1">
                            <button
                              onClick={() => {
                                playCanonAudioCue('click');
                                setRulerPoints({
                                  p1: null,
                                  p2: null,
                                  liveMouse: null,
                                  distanceMm: null,
                                  angleDeg: null,
                                  meanHu: null,
                                  minHu: null,
                                  maxHu: null,
                                  tissueProfile: null,
                                  viewport: 'axial'
                                });
                              }}
                              className="py-1 bg-[#2d3648] hover:bg-[#3d4960] border border-gray-600 rounded text-amber-300 font-bold text-center cursor-pointer"
                            >
                              Nova Medição
                            </button>
                            <button
                              onClick={() => {
                                playCanonAudioCue('click');
                                setActiveTool('Cursor');
                              }}
                              className="py-1 bg-[#202531] hover:bg-[#2d3444] border border-gray-700 rounded text-gray-300 text-center cursor-pointer"
                            >
                              Voltar ao Cursor
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Tool2 Quick Windows & Interactive Contrast Engine */}
                  {activeTab === 'Tool2' && (
                    <div className="p-2.5 bg-[#242833] rounded-b-lg border-x border-b border-[#444c5d] space-y-2.5 text-[10px] font-mono">
                      {/* Window Header & Auto Window Button */}
                      <div className="flex items-center justify-between border-b border-gray-700 pb-1.5">
                        <span className="font-bold text-gray-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-amber-400">contrast</span>
                          <span>Controle de Janelamento</span>
                        </span>
                        <button
                          onClick={handleAutoWindowCurrentSlice}
                          className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white font-bold text-[9px] flex items-center gap-1 cursor-pointer shadow-sm"
                          title="Calcular contraste ideal automaticamente a partir dos voxels do corte atual"
                        >
                          <span className="material-symbols-outlined text-[10px]">auto_fix_high</span>
                          <span>Auto WW/WL</span>
                        </button>
                      </div>

                      {/* Interactive Window Width (WW) Slider & Steppers */}
                      <div className="bg-[#181d27] p-2 rounded-lg border border-gray-700 space-y-1">
                        <div className="flex items-center justify-between text-gray-300 font-bold text-[10px]">
                          <span className="text-cyan-300">Largura (WW):</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={ww}
                              min={10}
                              max={4000}
                              onChange={e => setWw(Math.max(10, Math.min(4000, Number(e.target.value) || 10)))}
                              className="w-14 bg-black/60 border border-cyan-500/60 rounded px-1 py-0.5 text-right text-cyan-300 font-mono text-[10px] font-bold"
                            />
                            <span className="text-gray-400 text-[9px]">HU</span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={10}
                          max={3500}
                          step={5}
                          value={ww}
                          onChange={e => setWw(Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
                        />

                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[-100, -10, +10, +100].map(step => (
                            <button
                              key={step}
                              onClick={() => {
                                playCanonAudioCue('click');
                                setWw(prev => Math.max(10, Math.min(4000, prev + step)));
                              }}
                              className="flex-1 py-0.5 bg-[#2b3342] hover:bg-[#394357] border border-gray-600 rounded text-gray-300 font-bold text-[8px] cursor-pointer"
                            >
                              {step > 0 ? `+${step}` : step}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Window Level (WL) Slider & Steppers */}
                      <div className="bg-[#181d27] p-2 rounded-lg border border-gray-700 space-y-1">
                        <div className="flex items-center justify-between text-gray-300 font-bold text-[10px]">
                          <span className="text-amber-300">Centro / Nível (WL):</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={wl}
                              min={-1000}
                              max={1500}
                              onChange={e => setWl(Math.max(-1000, Math.min(1500, Number(e.target.value) || 0)))}
                              className="w-14 bg-black/60 border border-amber-500/60 rounded px-1 py-0.5 text-right text-amber-300 font-mono text-[10px] font-bold"
                            />
                            <span className="text-gray-400 text-[9px]">HU</span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={-1000}
                          max={1200}
                          step={5}
                          value={wl}
                          onChange={e => setWl(Number(e.target.value))}
                          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
                        />

                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[-100, -10, +10, +100].map(step => (
                            <button
                              key={step}
                              onClick={() => {
                                playCanonAudioCue('click');
                                setWl(prev => Math.max(-1000, Math.min(1500, prev + step)));
                              }}
                              className="flex-1 py-0.5 bg-[#2b3342] hover:bg-[#394357] border border-gray-600 rounded text-gray-300 font-bold text-[8px] cursor-pointer"
                            >
                              {step > 0 ? `+${step}` : step}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Diagnostic Transfer Function & HU Grayscale Gradient */}
                      <div className="bg-black/60 p-2 rounded-lg border border-gray-700/80 space-y-1 text-[9px]">
                        <div className="flex justify-between text-gray-400">
                          <span>Preto (&le; {Math.round(wl - ww / 2)} HU)</span>
                          <span className="text-white font-bold">WL={wl}</span>
                          <span>Branco (&ge; {Math.round(wl + ww / 2)} HU)</span>
                        </div>
                        {/* Visual Grayscale Ramp */}
                        <div className="w-full h-3 rounded bg-gradient-to-r from-black via-gray-500 to-white border border-gray-600" />
                        <div className="text-center text-gray-400 text-[8px]">
                          Faixa Dinâmica Visível: <strong className="text-cyan-300">{Math.round(wl - ww / 2)} HU</strong> até <strong className="text-amber-300">+{Math.round(wl + ww / 2)} HU</strong>
                        </div>
                      </div>

                      {/* 10 Clinical Presets Grid */}
                      <div className="space-y-1">
                        <div className="font-bold text-gray-300 text-[9px] flex items-center justify-between">
                          <span>Presets Diagnósticos:</span>
                          <span className="text-gray-500 text-[8px]">1-Clique</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {CLINICAL_WINDOW_PRESETS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                playCanonAudioCue('click');
                                setWw(preset.ww);
                                setWl(preset.wl);
                              }}
                              className={`p-1.5 rounded border text-left cursor-pointer transition-all ${
                                ww === preset.ww && wl === preset.wl
                                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-sm ring-1 ring-cyan-400/40'
                                  : 'bg-[#32394a] hover:bg-[#3f485c] border-gray-700 text-gray-300'
                              }`}
                              title={preset.desc}
                            >
                              <div className="font-bold truncate text-[9px]">{preset.name}</div>
                              <div className="text-[8px] text-gray-400 font-mono">
                                WW:{preset.ww} WL:{preset.wl}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Tab: SUREStart */}
                  {activeTab === 'Application' && (
                    <div className="p-2 bg-[#242833] rounded-b-lg border-x border-b border-[#444c5d] space-y-2 text-[10px] font-mono">
                      <div className="text-emerald-400 font-bold">SUREStart Tracker: 140 HU</div>
                      <div className="text-gray-400">Threshold de disparo no lúmen aórtico.</div>
                      <button
                        onClick={() => setTopMode('Scan')}
                        className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded cursor-pointer"
                      >
                        Abrir Console de Aquisição (Scan)
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* 3D MODE LEFT CONTROLS */}
              {topMode === '3D' && (
                <div className="bg-[#242833] p-2.5 rounded-lg border border-[#444c5d] space-y-2 text-[10px] font-mono">
                  <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">view_in_ar</span>
                    <span>Parâmetros 3D VR</span>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Color Palette (LUT):</label>
                    <select
                      value={threeDParams.colorMap}
                      onChange={e => setThreeDParams(prev => ({ ...prev, colorMap: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="Bone & Vessel Contrast">Bone & Vessel Contrast</option>
                      <option value="Soft Tissue / Muscle">Soft Tissue / Muscle</option>
                      <option value="Airways (Bronchogram)">Airways (Bronchogram)</option>
                      <option value="Bone High Opacity">Bone High Opacity</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Modo de Render:</label>
                    <select
                      value={threeDParams.renderMode}
                      onChange={e => setThreeDParams(prev => ({ ...prev, renderMode: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="Volume Rendering (VR)">Volume Rendering (VR)</option>
                      <option value="Shaded Surface Display (SSD)">Shaded Surface Display (SSD)</option>
                      <option value="MIP Angio">MIP Angio</option>
                      <option value="Virtual Endoscopy">Virtual Endoscopy</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-gray-700 space-y-1.5">
                    <div className="flex justify-between text-gray-300">
                      <span>Rotação 3D:</span>
                      <span className="text-cyan-300">{threeDParams.rotationY.toFixed(0)}°</span>
                    </div>
                    <button
                      onClick={() => setThreeDParams(prev => ({ ...prev, rotationY: prev.rotationY + 45 }))}
                      className="w-full py-1 bg-[#363d4e] hover:bg-[#454e63] border border-gray-600 rounded text-gray-200 font-bold"
                    >
                      Girar Objeto 3D (+45°)
                    </button>
                    <button
                      onClick={() => setThreeDParams(prev => ({ ...prev, cutPlaneActive: !prev.cutPlaneActive }))}
                      className={`w-full py-1 border rounded font-bold transition-all ${
                        threeDParams.cutPlaneActive
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-[#363d4e] border-gray-600 text-gray-300'
                      }`}
                    >
                      {threeDParams.cutPlaneActive ? 'Plano de Corte ATIVO' : 'Ativar Plano de Corte'}
                    </button>
                  </div>
                </div>
              )}

              {/* SCAN MODE LEFT CONTROLS (Canon Aquilion / Activion Console) */}
              {topMode === 'Scan' && (
                <div className="bg-[#242833] p-2.5 rounded-lg border border-[#444c5d] space-y-2 text-[10px] font-mono">
                  <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">radar</span>
                      <span>Console de Aquisição</span>
                    </div>
                    <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500 text-emerald-300">
                      Canon e-Sure
                    </span>
                  </div>

                  {/* Body Region Filter Buttons */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Região Anatômica:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'ALL', label: 'Todos' },
                        { id: 'HEAD', label: 'Crânio' },
                        { id: 'CHEST', label: 'Tórax' },
                        { id: 'ABDOMEN', label: 'Abdome' },
                        { id: 'SPINE', label: 'Coluna' },
                        { id: 'VASCULAR', label: 'Angio' },
                        { id: 'CARDIAC', label: 'Cálcio' },
                        { id: 'EXTREMITIES', label: 'Membros' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            playCanonAudioCue('click');
                            setSelectedRegionFilter(tab.id as any);
                          }}
                          className={`py-1 px-1 rounded text-[8px] font-bold border transition-colors cursor-pointer text-center ${
                            selectedRegionFilter === tab.id
                              ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                              : 'bg-[#1c202a] text-gray-400 border-gray-700 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Protocol Selector Dropdown */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Protocolo Selecionado:</span>
                    <select
                      value={selectedProtocolKey}
                      onChange={e => handleSelectProtocol(e.target.value)}
                      className="w-full bg-[#181d27] border border-cyan-500/60 rounded px-2 py-1 text-cyan-300 font-bold text-[10px] cursor-pointer"
                    >
                      {Object.entries(SCAN_PROTOCOLS)
                        .filter(([_, p]) => selectedRegionFilter === 'ALL' || p.bodyRegion === selectedRegionFilter)
                        .map(([key, p]) => (
                          <option key={key} value={key}>
                            [{p.protocolCode}] {p.protocolName}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Protocol Technical Telemetry */}
                  <div className="bg-black/60 p-2 rounded border border-gray-700 space-y-1 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Varredura:</span>
                      <strong className="text-cyan-300">{activeProtocol.scanType} • {activeProtocol.scanKv}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">mA / Dose:</span>
                      <strong className="text-amber-300">{activeProtocol.scanMa}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Colimação:</span>
                      <strong className="text-white">{activeProtocol.sliceCollimation}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pitch / Velocidade:</span>
                      <strong className="text-white">{activeProtocol.pitch} • {activeProtocol.tableSpeed}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gantry Tilt:</span>
                      <strong className="text-emerald-300">{activeProtocol.gantryTilt}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Filtro Recon:</span>
                      <strong className="text-purple-300">{activeProtocol.filterKernel}</strong>
                    </div>
                  </div>

                  {/* Contrast Bolus Info (if applicable) */}
                  {activeProtocol.contrastInjected && activeProtocol.contrastProtocol && (
                    <div className="bg-cyan-950/40 p-2 rounded border border-cyan-500/40 text-[9px] space-y-0.5">
                      <div className="text-cyan-300 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">vaccines</span>
                        <span>Protocolo Injetora Automática</span>
                      </div>
                      <div className="text-gray-300">Volume: <strong>{activeProtocol.contrastProtocol.volume}</strong></div>
                      <div className="text-gray-300">Fluxo: <strong>{activeProtocol.contrastProtocol.flow}</strong></div>
                      <div className="text-amber-300">Trigger: <strong>{activeProtocol.contrastProtocol.triggerHu} HU ({activeProtocol.contrastProtocol.triggerVessel})</strong></div>
                    </div>
                  )}

                  {/* Tube Capacity Display */}
                  <div className="bg-black/50 p-2 rounded border border-gray-700 space-y-1">
                    <div className="flex justify-between text-gray-300">
                      <span>Aquecimento do Tubo:</span>
                      <span className={xrayTubeHeat > 80 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {xrayTubeHeat}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${xrayTubeHeat > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${xrayTubeHeat}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-gray-700 space-y-1.5">
                    <button
                      onClick={handleTriggerScan}
                      disabled={scanStep === 'scan_running' || scanStep === 'surestart'}
                      className={`w-full py-2.5 rounded font-black text-xs tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        scanStep === 'scan_running'
                          ? 'bg-amber-600 text-white animate-pulse'
                          : scanStep === 'surestart'
                          ? 'bg-cyan-600 text-white animate-bounce'
                          : 'bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white shadow-red-900/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {scanStep === 'surestart' ? 'hourglass_top' : 'play_arrow'}
                      </span>
                      <span>
                        {scanStep === 'surestart'
                          ? 'SURESTART MONITORANDO...'
                          : scanStep === 'scan_running'
                          ? 'VARRENDO HELICAL...'
                          : 'INICIAR DISPARO RAIO-X'}
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => {
                          playCanonAudioCue('click');
                          setSelectedScoutOrientation(prev => prev === 'AP' ? 'LAT' : 'AP');
                        }}
                        className="py-1 bg-[#363d4e] hover:bg-[#454f65] border border-gray-600 rounded text-cyan-300 font-bold text-[9px] cursor-pointer"
                      >
                        Scout {selectedScoutOrientation === 'AP' ? 'LAT' : 'AP'}
                      </button>

                      <button
                        onClick={() => {
                          playCanonAudioCue('click');
                          setScanStep('scout_view');
                          setScanProgress(0);
                        }}
                        className="py-1 bg-[#363d4e] hover:bg-[#454f65] border border-gray-600 rounded text-gray-200 text-[9px] cursor-pointer"
                      >
                        Reset FOV Box
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FILMING CAMERA LEFT CONTROLS */}
              {topMode === 'Filming' && (
                <div className="bg-[#242833] p-2.5 rounded-lg border border-[#444c5d] space-y-2 text-[10px] font-mono">
                  <div className="text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>Câmera Laser DICOM</span>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Layout do Filme:</label>
                    <select
                      value={filmingSheet.sheetFormat}
                      onChange={e => setFilmingSheet(prev => ({ ...prev, sheetFormat: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="3 x 4 (12 Img)">3 x 4 (12 Imagens)</option>
                      <option value="4 x 5 (20 Img)">4 x 5 (20 Imagens)</option>
                      <option value="2 x 3 (6 Img)">2 x 3 (6 Imagens)</option>
                      <option value="1 x 1 (Single Full)">1 x 1 (1 Imagem Total)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Tamanho da Película:</label>
                    <select
                      value={filmingSheet.filmSize}
                      onChange={e => setFilmingSheet(prev => ({ ...prev, filmSize: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="14 x 17 in">14 x 17 polegadas (Padrão)</option>
                      <option value="11 x 14 in">11 x 14 polegadas</option>
                      <option value="8 x 10 in">8 x 10 polegadas</option>
                    </select>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-gray-700 text-gray-300 space-y-0.5">
                    <div>Impressora: <strong className="text-cyan-300">{filmingSheet.targetPrinter}</strong></div>
                    <div>Cópias: <strong>{filmingSheet.copies}</strong></div>
                    <div>Películas Geradas: <strong>{filmingSheet.totalFilms}</strong></div>
                  </div>

                  <button
                    onClick={handleSendToPrint}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:brightness-110 text-white font-bold rounded flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>IMPRIMIR PELÍCULA</span>
                  </button>

                  {printSuccessAlert && (
                    <div className="p-2 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-center font-bold animate-fade-in">
                      Enviado com Sucesso ao Spooler DICOM!
                    </div>
                  )}
                </div>
              )}

              {/* RAW-DATA RECONSTRUCTION LEFT CONTROLS */}
              {topMode === 'RawData' && (
                <div className="bg-[#242833] p-2.5 rounded-lg border border-[#444c5d] space-y-2 text-[10px] font-mono">
                  <div className="text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">database</span>
                    <span>Reconstrução Raw-Data</span>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Filtro de Convolução (Kernel):</label>
                    <select
                      value={rawDataPlan.filterKernel}
                      onChange={e => setRawDataPlan(prev => ({ ...prev, filterKernel: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="FC13 (Brain Soft)">FC13 (Brain Soft Tissue)</option>
                      <option value="FC07 (Lung Sharp)">FC07 (Lung High-Res Sharp)</option>
                      <option value="FC01 (Standard Soft)">FC01 (Standard Soft Tissue)</option>
                      <option value="FC30 (Bone High-Freq)">FC30 (Bone High-Frequency)</option>
                      <option value="FC52 (Inner Ear/HRCT)">FC52 (Inner Ear / Ultra HRCT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Denoising Iterativo Canon:</label>
                    <select
                      value={rawDataPlan.iterativeDenoising}
                      onChange={e => setRawDataPlan(prev => ({ ...prev, iterativeDenoising: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="AIDR 3D Standard">AIDR 3D Standard</option>
                      <option value="AIDR 3D Strong">AIDR 3D Strong</option>
                      <option value="AiCE Deep Learning">AiCE Deep Learning (Recon)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">Espessura do Corte:</label>
                    <select
                      value={rawDataPlan.sliceThickness}
                      onChange={e => setRawDataPlan(prev => ({ ...prev, sliceThickness: e.target.value as any }))}
                      className="w-full bg-[#363d4e] border border-gray-600 rounded px-2 py-1 text-white font-bold cursor-pointer"
                    >
                      <option value="0.5mm">0.5mm Submilimétrico</option>
                      <option value="0.7mm">0.7mm Padrão Activion</option>
                      <option value="1.0mm">1.0mm</option>
                      <option value="2.0mm">2.0mm</option>
                      <option value="5.0mm">5.0mm Grosso (Triagem)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleExecuteReconstruction}
                    disabled={isReconstructing}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:brightness-110 text-white font-bold rounded flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">memory</span>
                    <span>{isReconstructing ? 'RECONSTRUINDO...' : 'RECONSTRUIR SÉRIE'}</span>
                  </button>

                  {reconDoneNotice && (
                    <div className="p-2 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-center font-bold">
                      Série Concluída com Filtro {rawDataPlan.filterKernel.slice(0, 4)}!
                    </div>
                  )}
                </div>
              )}

              {/* CLINICAL SUMMARY LEFT CONTROLS */}
              {topMode === 'Clinical' && (
                <div className="bg-[#242833] p-2.5 rounded-lg border border-[#444c5d] space-y-2 text-[10px] font-mono">
                  <div className="text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">medical_information</span>
                    <span>Dados Clínicos & Dose</span>
                  </div>

                  <div className="bg-black/50 p-2 rounded border border-gray-700 text-gray-300 space-y-1">
                    <div>CTDIvol Estimado: <strong className="text-amber-400">{activeProtocol.doseEstimate.ctdiVol} mGy</strong></div>
                    <div>DLP Total: <strong className="text-emerald-400">{activeProtocol.doseEstimate.dlp} mGy*cm</strong></div>
                    <div>Proteção: <strong className="text-cyan-300">SUREExposure 3D Ativo</strong></div>
                  </div>

                  <div className="text-[9px] text-gray-400 leading-tight">
                    Os níveis de dose respeitam os Níveis de Referência Diagnóstica (DRL) estabelecidos pelo Colégio Brasileiro de Radiologia (CBR).
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Status Panel */}
            <div className="mt-2 p-2 rounded-lg bg-[#1a1d25] border border-gray-800 text-[10px] font-mono text-gray-400">
              <div className="flex justify-between text-cyan-300 font-bold">
                <span>WL={wl}</span>
                <span>WW={ww}</span>
              </div>
              <div className="text-gray-500 mt-0.5">Activion16 • Canon Medical Systems</div>
            </div>
          </div>

          {/* ----------------- RIGHT AREA: DYNAMIC WORKSTATION VIEW (9 Cols) ----------------- */}
          <div className="col-span-9 bg-black overflow-hidden relative">

            {/* ==================== MODO 1: MPR 2x2 MULTI-VIEWPORT (Original da foto) ==================== */}
            {topMode === 'MPR' && (
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 p-1">

                {/* VIEWPORT 1: CORONAL */}
                <div
                  onClick={() => setActiveViewport('coronal')}
                  onMouseDown={e => handleMouseDown(e, 'coronal')}
                  onContextMenu={e => e.preventDefault()}
                  className={`relative bg-black border ${
                    activeViewport === 'coronal' ? 'border-[#38bdf8] shadow-[inset_0_0_10px_rgba(56,189,248,0.3)]' : 'border-gray-800'
                  } flex items-center justify-center overflow-hidden cursor-crosshair group`}
                >
                  <div className="absolute top-1.5 left-2 z-10 font-mono text-[10px] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none">
                    <div className="font-bold tracking-tight text-gray-100 flex items-center gap-1.5">
                      <span>{selectedCase.patientName}</span>
                      <span className="text-gray-300">{selectedCase.patientId}</span>
                    </div>
                    <div className="text-gray-400 text-[9px]">(239.82)</div>
                    <div className="text-gray-300 text-[9px]">173052 : 3 : 10001</div>
                    <div className="text-amber-300 font-bold text-[9px]">-0.7mm</div>
                  </div>

                  <div className="absolute top-1.5 right-2 z-10 font-mono text-[9px] text-right text-gray-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none leading-tight">
                    <div>{selectedCase.studyDateTime}</div>
                    <div>{selectedCase.kv} {selectedCase.ma}</div>
                    <div>{selectedCase.rotTime}</div>
                    <div className="text-emerald-400 font-bold">{selectedCase.hp}</div>
                  </div>

                  <div className="absolute bottom-2 right-2 w-7 h-7 border-2 border-red-500/90 bg-black/60 flex flex-col items-center justify-center font-mono text-[8px] text-red-400 font-bold z-10 pointer-events-none shadow-md">
                    <span className="text-[7px] text-white">H</span>
                    <span className="text-[7px] text-red-400">COR</span>
                  </div>

                  {/* Dynamic Coronal Canvas Overlay with Fallback */}
                  <canvas
                    ref={coronalCanvasRef}
                    onClick={handleCoronalCanvasClick}
                    className="w-full h-full object-contain select-none cursor-crosshair"
                    style={{
                      display: dicomSlices.length > 0 ? 'block' : 'none',
                      transform: `rotate(${rotationAngle}deg)`
                    }}
                  />
                  {dicomSlices.length === 0 && (
                    <img
                      src={selectedCase.images.coronal}
                      alt="Coronal MPR"
                      style={{
                        filter: `${invertGrayscale ? 'invert(1)' : 'none'} contrast(${Math.max(0.5, 200 / ww)}) brightness(${Math.max(0.6, 1 + wl / 500)})`
                      }}
                      className="w-full h-full object-contain select-none pointer-events-none"
                    />
                  )}

                  {showScoutLines && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Axial Slice Position Marker Line */}
                      <div
                        className="absolute inset-x-2 h-[1.5px] bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]"
                        style={{ top: `${(1.0 - (sliceIndex - 1) / Math.max(1, dicomSlices.length - 1)) * 100}%` }}
                      >
                        <div className="absolute left-1/2 -top-1 w-2 h-2 -translate-x-1/2 border border-[#00e5ff] bg-black/70 rounded-full" />
                      </div>
                      {/* Vertical Sagittal Cut Line */}
                      <div
                        className="absolute inset-y-2 w-[1.5px] bg-[#4edea3]/70 shadow-[0_0_6px_#4edea3]"
                        style={{ left: `${crosshairPos.x * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-2 z-10 font-mono text-[9px] text-gray-300 pointer-events-none leading-tight drop-shadow">
                    <div>WL={wl}</div>
                    <div>WW={ww}</div>
                    <div className="text-cyan-400 font-bold text-[8px]">Canon Coronal MPR</div>
                  </div>
                </div>

                {/* VIEWPORT 2: SAGITTAL */}
                <div
                  onClick={() => setActiveViewport('sagittal')}
                  onMouseDown={e => handleMouseDown(e, 'sagittal')}
                  onContextMenu={e => e.preventDefault()}
                  className={`relative bg-black border ${
                    activeViewport === 'sagittal' ? 'border-[#38bdf8] shadow-[inset_0_0_10px_rgba(56,189,248,0.3)]' : 'border-gray-800'
                  } flex items-center justify-center overflow-hidden cursor-crosshair group`}
                >
                  <div className="absolute top-1.5 left-2 z-10 font-mono text-[10px] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none">
                    <div className="font-bold tracking-tight text-gray-100 flex items-center gap-1.5">
                      <span>{selectedCase.patientName}</span>
                      <span className="text-gray-300">{selectedCase.patientId}</span>
                    </div>
                    <div className="text-gray-400 text-[9px]">(239.82)</div>
                    <div className="text-gray-300 text-[9px]">173052 : 3 : 10001</div>
                    <div className="text-amber-300 font-bold text-[9px]">-0.7mm</div>
                  </div>

                  <div className="absolute top-1.5 right-2 z-10 font-mono text-[9px] text-right text-gray-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none leading-tight">
                    <div>{selectedCase.studyDateTime}</div>
                    <div>{selectedCase.kv} {selectedCase.ma}</div>
                    <div>{selectedCase.rotTime}</div>
                    <div className="text-emerald-400 font-bold">{selectedCase.hp}</div>
                  </div>

                  <div className="absolute bottom-2 right-2 w-7 h-7 border-2 border-emerald-400/90 bg-black/60 flex flex-col items-center justify-center font-mono text-[8px] text-emerald-300 font-bold z-10 pointer-events-none shadow-md">
                    <span className="text-[7px] text-white">H</span>
                    <span className="text-[7px] text-emerald-400">SAG</span>
                  </div>

                  {/* Dynamic Sagittal Canvas Overlay with Fallback */}
                  <canvas
                    ref={sagittalCanvasRef}
                    onClick={handleSagittalCanvasClick}
                    className="w-full h-full object-contain select-none cursor-crosshair"
                    style={{
                      display: dicomSlices.length > 0 ? 'block' : 'none',
                      transform: `rotate(${rotationAngle}deg)`
                    }}
                  />
                  {dicomSlices.length === 0 && (
                    <img
                      src={selectedCase.images.sagittal}
                      alt="Sagittal MPR"
                      style={{
                        filter: `${invertGrayscale ? 'invert(1)' : 'none'} contrast(${Math.max(0.5, 200 / ww)}) brightness(${Math.max(0.6, 1 + wl / 500)})`
                      }}
                      className="w-full h-full object-contain select-none pointer-events-none"
                    />
                  )}

                  {showScoutLines && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Axial Slice Position Marker Line */}
                      <div
                        className="absolute inset-x-2 h-[1.5px] bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]"
                        style={{ top: `${(1.0 - (sliceIndex - 1) / Math.max(1, dicomSlices.length - 1)) * 100}%` }}
                      >
                        <div className="absolute left-1/2 -top-1 w-2 h-2 -translate-x-1/2 border border-[#00e5ff] bg-black/70 rounded-full" />
                      </div>
                      {/* Vertical Coronal Cut Line */}
                      <div
                        className="absolute inset-y-2 w-[1.5px] bg-red-400/70 shadow-[0_0_6px_#f87171]"
                        style={{ left: `${crosshairPos.y * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-2 z-10 font-mono text-[9px] text-gray-300 pointer-events-none leading-tight drop-shadow">
                    <div>WL={wl}</div>
                    <div>WW={ww}</div>
                    <div className="text-emerald-400 font-bold text-[8px]">Canon Sagittal MPR</div>
                  </div>
                </div>

                {/* VIEWPORT 3: AXIAL (Orange Border from photo) */}
                <div
                  onClick={() => setActiveViewport('axial')}
                  onMouseDown={e => handleMouseDown(e, 'axial')}
                  onContextMenu={e => e.preventDefault()}
                  onWheel={e => {
                    e.preventDefault();
                    setSliceIndex(prev => Math.min(dicomSlices.length, Math.max(1, prev + (e.deltaY > 0 ? 1 : -1))));
                  }}
                  className={`relative bg-black border-2 ${
                    activeViewport === 'axial'
                      ? 'border-[#ff9800] shadow-[0_0_20px_rgba(255,152,0,0.35)] ring-1 ring-[#ff9800]/50'
                      : 'border-gray-800'
                  } flex items-center justify-center overflow-hidden cursor-crosshair group`}
                >
                  <div className="absolute top-1.5 left-2 z-10 font-mono text-[10px] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none">
                    <div className="font-bold tracking-tight text-gray-100 flex items-center gap-1.5">
                      <span>{selectedCase.patientName}</span>
                      <span className="text-gray-300">{selectedCase.patientId}</span>
                    </div>
                    <div className="text-gray-400 text-[9px]">(239.82)</div>
                    <div className="text-gray-300 text-[9px]">173052 : 3 : 10001</div>
                    <div className="text-amber-300 font-bold text-[9px]">
                      Loc: {(dicomSlices[Math.min(dicomSlices.length - 1, Math.max(0, sliceIndex - 1))]?.sliceLocation ?? 0).toFixed(1)}mm
                    </div>
                  </div>

                  <div className="absolute top-1.5 right-2 z-10 font-mono text-[9px] text-right text-gray-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none leading-tight">
                    <div>{selectedCase.studyDateTime}</div>
                    <div>{selectedCase.kv} {selectedCase.ma}</div>
                    <div>{selectedCase.rotTime}</div>
                    <div className="text-emerald-400 font-bold">{selectedCase.hp}</div>
                  </div>

                  {/* Real-Time Hounsfield Unit (HU) Probe HUD Badge */}
                  {hoveredHu && (
                    <div className="absolute top-11 left-2 z-20 pointer-events-none bg-black/90 border border-cyan-400/80 px-2 py-1 rounded shadow-xl font-mono text-[10px] flex items-center gap-2 backdrop-blur-sm animate-fade-in">
                      <span className="material-symbols-outlined text-xs text-amber-400">colorize</span>
                      <span className="text-amber-400 font-extrabold text-xs">
                        HU: {hoveredHu.hu > 0 ? `+${hoveredHu.hu}` : hoveredHu.hu}
                      </span>
                      <span className="text-cyan-300 text-[9px] bg-[#1a2333] px-1.5 py-0.5 rounded border border-cyan-500/40">
                        {hoveredHu.tissue}
                      </span>
                    </div>
                  )}

                  {/* Live ROI Statistics Overlay HUD */}
                  {roiMetrics && (
                    <div className="absolute top-11 right-2 z-20 pointer-events-none bg-black/90 border border-amber-400/80 p-2 rounded shadow-xl font-mono text-[10px] space-y-0.5 text-amber-300 backdrop-blur-sm animate-fade-in">
                      <div className="text-white font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-400">adjust</span>
                        <span>CANON ROI 1 STATISTICS</span>
                      </div>
                      <div>Média (Mean): <strong className="text-white">{roiMetrics.meanHu > 0 ? `+${roiMetrics.meanHu}` : roiMetrics.meanHu} HU</strong></div>
                      <div>Desvio Padrão (SD): <strong className="text-white">{roiMetrics.sdHu} HU</strong></div>
                      <div>Min / Max: <strong className="text-white">{roiMetrics.minHu} / {roiMetrics.maxHu} HU</strong></div>
                      <div>Área: <strong className="text-emerald-400">{roiMetrics.areaCm2} cm²</strong></div>
                    </div>
                  )}

                  {/* Clinical Radiology Caliper HUD Overlay */}
                  {(activeTool === 'Measure' || rulerPoints.p1) && (
                    <div className={`absolute z-20 bg-black/90 border border-amber-400/90 rounded-lg p-2.5 shadow-2xl font-mono text-[10px] space-y-1.5 backdrop-blur-md max-w-[250px] animate-fade-in ${
                      roiMetrics ? 'top-36 right-2' : 'top-11 right-2'
                    }`}>
                      <div className="flex items-center justify-between border-b border-gray-700 pb-1">
                        <div className="flex items-center gap-1.5 text-amber-300 font-extrabold text-[10px]">
                          <span className="material-symbols-outlined text-sm">straighten</span>
                          <span>CALIPER DE PRECISÃO (ROI)</span>
                        </div>
                        {rulerPoints.p1 && !rulerPoints.p2 ? (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 text-[8px] font-bold animate-pulse">
                            MEDINDO...
                          </span>
                        ) : rulerPoints.p1 && rulerPoints.p2 ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 text-[8px] font-bold">
                            FIXADO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 text-[8px]">
                            PRONTO
                          </span>
                        )}
                      </div>

                      {!rulerPoints.p1 && (
                        <div className="text-gray-300 text-[9px] leading-tight py-0.5">
                          👆 <strong className="text-amber-300">Clique na imagem</strong> para posicionar o <strong>Ponto 1</strong> de início da lesão ou estrutura.
                        </div>
                      )}

                      {rulerPoints.p1 && !rulerPoints.p2 && (
                        <div className="space-y-1 text-[9px]">
                          <div className="text-cyan-300">
                            📍 Ponto 1: ({Math.round(rulerPoints.p1.x)}, {Math.round(rulerPoints.p1.y)})
                          </div>
                          <div className="text-amber-300 font-bold text-xs">
                            Distância: {rulerPoints.distanceMm ?? 0} mm ({(((rulerPoints.distanceMm ?? 0)) / 10).toFixed(2)} cm)
                          </div>
                          <div className="text-gray-400 text-[8px]">
                            Mova o mouse e clique no <strong>Ponto 2</strong> para travar a medição.
                          </div>
                        </div>
                      )}

                      {rulerPoints.p1 && rulerPoints.p2 && (
                        <div className="space-y-1 text-gray-200">
                          <div className="flex justify-between items-baseline">
                            <span className="text-gray-400">Distância Linear:</span>
                            <strong className="text-amber-300 text-sm font-black">
                              {rulerPoints.distanceMm} mm
                            </strong>
                          </div>
                          <div className="flex justify-between text-[9px]">
                            <span className="text-gray-400">Em Centímetros:</span>
                            <strong className="text-white">{((rulerPoints.distanceMm || 0) / 10).toFixed(2)} cm</strong>
                          </div>
                          {rulerPoints.angleDeg !== null && (
                            <div className="flex justify-between text-[9px]">
                              <span className="text-gray-400">Ângulo de Eixo:</span>
                              <strong className="text-white">{rulerPoints.angleDeg}°</strong>
                            </div>
                          )}
                          {rulerPoints.meanHu !== null && (
                            <div className="bg-[#171d27] p-1.5 rounded border border-gray-700/80 space-y-0.5 text-[9px]">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Atenuação Média:</span>
                                <strong className="text-cyan-300">
                                  {rulerPoints.meanHu > 0 ? `+${rulerPoints.meanHu}` : rulerPoints.meanHu} HU
                                </strong>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>Min / Max:</span>
                                <span className="text-white">{rulerPoints.minHu} / {rulerPoints.maxHu} HU</span>
                              </div>
                              {rulerPoints.tissueProfile && (
                                <div className="text-emerald-400 font-bold text-[8px] pt-0.5 border-t border-gray-700 truncate">
                                  Perfil: {rulerPoints.tissueProfile}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-1 pt-0.5">
                            <button
                              onClick={() => {
                                playCanonAudioCue('click');
                                setRulerPoints({
                                  p1: null,
                                  p2: null,
                                  liveMouse: null,
                                  distanceMm: null,
                                  angleDeg: null,
                                  meanHu: null,
                                  minHu: null,
                                  maxHu: null,
                                  tissueProfile: null,
                                  viewport: 'axial'
                                });
                              }}
                              className="flex-1 py-1 bg-[#283142] hover:bg-[#364257] border border-gray-600 rounded text-amber-300 font-bold text-[8px] cursor-pointer"
                            >
                              Nova Medição
                            </button>
                            {savedMeasurements.length > 0 && (
                              <button
                                onClick={() => {
                                  playCanonAudioCue('click');
                                  setSavedMeasurements([]);
                                  setRulerPoints({
                                    p1: null,
                                    p2: null,
                                    liveMouse: null,
                                    distanceMm: null,
                                    angleDeg: null,
                                    meanHu: null,
                                    minHu: null,
                                    maxHu: null,
                                    tissueProfile: null,
                                    viewport: 'axial'
                                  });
                                }}
                                className="py-1 px-2 bg-red-950 hover:bg-red-900 border border-red-500/60 rounded text-red-200 font-bold text-[8px] cursor-pointer"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 w-7 h-7 border-2 border-[#00e5ff] bg-black/60 flex flex-col items-center justify-center font-mono text-[8px] text-[#00e5ff] font-bold z-10 pointer-events-none shadow-md">
                    <span className="text-[7px] text-white">H</span>
                    <span className="text-[7px] text-[#00e5ff]">AXI</span>
                  </div>

                  <div className="absolute right-3 inset-y-12 w-2 flex flex-col justify-between py-4 pointer-events-none z-10 opacity-70">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-2 h-0.5 bg-gray-400 ml-auto" />
                    ))}
                  </div>

                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="w-3 h-5 border-l-2 border-y-2 border-red-500" />
                  </div>

                  <div
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px) rotate(${rotationAngle}deg)`,
                      transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="w-full h-full flex items-center justify-center relative"
                  >
                    {/* Real DICOM 16-Bit Grayscale HTML5 Canvas */}
                    <canvas
                      ref={axialCanvasRef}
                      onClick={handleAxialCanvasClick}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={() => setHoveredHu(null)}
                      className="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl rounded"
                    />

                    {/* Professional PACS Caliper Distance Overlay */}
                    {(rulerPoints.p1 || savedMeasurements.length > 0) && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 256 256">
                          <defs>
                            <filter id="caliper-shadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.9" />
                            </filter>
                          </defs>

                          {/* Render Previously Saved Calipers for Multi-Axis (RECIST / Volumetric) Measurement */}
                          {savedMeasurements
                            .filter(m => m.viewport === 'axial' && m.sliceIndex === sliceIndex)
                            .map((m, idx) => {
                              const dx = m.p2.x - m.p1.x;
                              const dy = m.p2.y - m.p1.y;
                              const len = Math.hypot(dx, dy);
                              const perpX = len > 0 ? -dy / len : 0;
                              const perpY = len > 0 ? dx / len : 0;
                              const tick = 4;
                              const midX = (m.p1.x + m.p2.x) / 2 + perpX * 7;
                              const midY = (m.p1.y + m.p2.y) / 2 + perpY * 7;
                              return (
                                <g key={m.id} opacity="0.85">
                                  <line
                                    x1={m.p1.x}
                                    y1={m.p1.y}
                                    x2={m.p2.x}
                                    y2={m.p2.y}
                                    stroke="#06b6d4"
                                    strokeWidth="1.5"
                                    strokeDasharray="2,2"
                                  />
                                  <line
                                    x1={m.p1.x - perpX * tick}
                                    y1={m.p1.y - perpY * tick}
                                    x2={m.p1.x + perpX * tick}
                                    y2={m.p1.y + perpY * tick}
                                    stroke="#06b6d4"
                                    strokeWidth="1.5"
                                  />
                                  <line
                                    x1={m.p2.x - perpX * tick}
                                    y1={m.p2.y - perpY * tick}
                                    x2={m.p2.x + perpX * tick}
                                    y2={m.p2.y + perpY * tick}
                                    stroke="#06b6d4"
                                    strokeWidth="1.5"
                                  />
                                  <circle cx={m.p1.x} cy={m.p1.y} r="2" fill="#06b6d4" />
                                  <circle cx={m.p2.x} cy={m.p2.y} r="2" fill="#06b6d4" />
                                  <g transform={`translate(${midX}, ${midY})`}>
                                    <rect x="-22" y="-7" width="44" height="14" rx="2" fill="rgba(0,0,0,0.85)" stroke="#06b6d4" strokeWidth="0.7" />
                                    <text x="0" y="0" fill="#06b6d4" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                                      {m.label}: {m.distanceMm}mm
                                    </text>
                                  </g>
                                </g>
                              );
                            })}

                          {/* Active Locked Caliper Measurement */}
                          {rulerPoints.p1 && rulerPoints.p2 && (
                            <g filter="url(#caliper-shadow)">
                              {(() => {
                                const p1 = rulerPoints.p1;
                                const p2 = rulerPoints.p2;
                                const dx = p2.x - p1.x;
                                const dy = p2.y - p1.y;
                                const len = Math.hypot(dx, dy);
                                const perpX = len > 0 ? -dy / len : 0;
                                const perpY = len > 0 ? dx / len : 0;
                                const tick = 5;
                                const midX = (p1.x + p2.x) / 2 + perpX * 8;
                                const midY = (p1.y + p2.y) / 2 + perpY * 8;
                                return (
                                  <>
                                    <line
                                      x1={p1.x}
                                      y1={p1.y}
                                      x2={p2.x}
                                      y2={p2.y}
                                      stroke="#f59e0b"
                                      strokeWidth="1.8"
                                    />
                                    {/* Perpendicular Caliper End Ticks */}
                                    <line
                                      x1={p1.x - perpX * tick}
                                      y1={p1.y - perpY * tick}
                                      x2={p1.x + perpX * tick}
                                      y2={p1.y + perpY * tick}
                                      stroke="#f59e0b"
                                      strokeWidth="2"
                                    />
                                    <line
                                      x1={p2.x - perpX * tick}
                                      y1={p2.y - perpY * tick}
                                      x2={p2.x + perpX * tick}
                                      y2={p2.y + perpY * tick}
                                      stroke="#f59e0b"
                                      strokeWidth="2"
                                    />
                                    {/* Center Anchor Circles */}
                                    <circle cx={p1.x} cy={p1.y} r="2.5" fill="#f59e0b" stroke="#000" strokeWidth="0.7" />
                                    <circle cx={p2.x} cy={p2.y} r="2.5" fill="#f59e0b" stroke="#000" strokeWidth="0.7" />
                                    {/* Medical Distance Badge */}
                                    <g transform={`translate(${midX}, ${midY})`}>
                                      <rect
                                        x="-30"
                                        y="-9"
                                        width="60"
                                        height="16"
                                        rx="3"
                                        fill="rgba(0, 0, 0, 0.88)"
                                        stroke="#f59e0b"
                                        strokeWidth="1"
                                      />
                                      <text
                                        x="0"
                                        y="0"
                                        fill="#fbbf24"
                                        fontSize="8"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                      >
                                        {rulerPoints.distanceMm} mm
                                      </text>
                                    </g>
                                  </>
                                );
                              })()}
                            </g>
                          )}

                          {/* Live Dynamic Preview Line while drawing (Point 1 set, moving to Point 2) */}
                          {rulerPoints.p1 && !rulerPoints.p2 && rulerPoints.liveMouse && (
                            <g filter="url(#caliper-shadow)">
                              {(() => {
                                const p1 = rulerPoints.p1;
                                const p2 = rulerPoints.liveMouse;
                                const dx = p2.x - p1.x;
                                const dy = p2.y - p1.y;
                                const len = Math.hypot(dx, dy);
                                const perpX = len > 0 ? -dy / len : 0;
                                const perpY = len > 0 ? dx / len : 0;
                                const tick = 4;
                                const midX = (p1.x + p2.x) / 2 + perpX * 7;
                                const midY = (p1.y + p2.y) / 2 + perpY * 7;
                                return (
                                  <>
                                    <line
                                      x1={p1.x}
                                      y1={p1.y}
                                      x2={p2.x}
                                      y2={p2.y}
                                      stroke="#38bdf8"
                                      strokeWidth="1.5"
                                      strokeDasharray="3,3"
                                    />
                                    {/* P1 fixed tick & circle */}
                                    <line
                                      x1={p1.x - perpX * tick}
                                      y1={p1.y - perpY * tick}
                                      x2={p1.x + perpX * tick}
                                      y2={p1.y + perpY * tick}
                                      stroke="#38bdf8"
                                      strokeWidth="1.8"
                                    />
                                    <circle cx={p1.x} cy={p1.y} r="2.5" fill="#38bdf8" stroke="#000" strokeWidth="0.7" />
                                    {/* Live cursor crosshair */}
                                    <circle cx={p2.x} cy={p2.y} r="3" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                                    <line x1={p2.x - 4} y1={p2.y} x2={p2.x + 4} y2={p2.y} stroke="#38bdf8" strokeWidth="1" />
                                    <line x1={p2.x} y1={p2.y - 4} x2={p2.x} y2={p2.y + 4} stroke="#38bdf8" strokeWidth="1" />
                                    {/* Live Distance Pill */}
                                    <g transform={`translate(${midX}, ${midY})`}>
                                      <rect
                                        x="-26"
                                        y="-8"
                                        width="52"
                                        height="15"
                                        rx="3"
                                        fill="rgba(0, 0, 0, 0.85)"
                                        stroke="#38bdf8"
                                        strokeWidth="0.8"
                                      />
                                      <text
                                        x="0"
                                        y="0"
                                        fill="#38bdf8"
                                        fontSize="7.5"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                      >
                                        {rulerPoints.distanceMm ?? 0} mm
                                      </text>
                                    </g>
                                  </>
                                );
                              })()}
                            </g>
                          )}
                        </svg>
                      </div>
                    )}

                    {/* Interactive Ellipse ROI Overlay */}
                    {roiMetrics && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 256 256">
                          <ellipse
                            cx={roiMetrics.cx}
                            cy={roiMetrics.cy}
                            rx={roiMetrics.rx}
                            ry={roiMetrics.ry}
                            fill="rgba(245, 158, 11, 0.15)"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                          />
                          <circle cx={roiMetrics.cx} cy={roiMetrics.cy} r="2" fill="#f59e0b" />
                        </svg>
                      </div>
                    )}

                    {/* Multi-planar Crosshair on Axial */}
                    {showScoutLines && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="absolute inset-x-0 h-px bg-red-500/50"
                          style={{ top: `${crosshairPos.y * 100}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-px bg-emerald-400/50"
                          style={{ left: `${crosshairPos.x * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-1.5 left-2 z-10 font-mono text-[9px] text-gray-200 pointer-events-none leading-tight drop-shadow">
                    <div>WL={wl}</div>
                    <div>WW={ww}</div>
                    <div className="text-cyan-400 font-bold text-[8px]">
                      Corte {sliceIndex}/{dicomSlices.length} • {selectedCase.thickness}
                    </div>
                    <div className="text-gray-400 text-[8px]">Activion16 DICOM Engine</div>
                  </div>
                </div>

                {/* VIEWPORT 4: BONE 3D */}
                <div
                  onClick={() => setActiveViewport('axial')}
                  className="relative bg-black border border-gray-800 flex items-center justify-center overflow-hidden cursor-crosshair group"
                >
                  <div className="absolute top-1.5 left-2 z-10 font-mono text-[10px] leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none">
                    <div className="font-bold tracking-tight text-gray-100 flex items-center gap-1.5">
                      <span>{selectedCase.patientName}</span>
                    </div>
                    <div className="text-cyan-400 font-bold text-[9px]">BONE FILTER 0.5mm</div>
                  </div>

                  <div className="absolute bottom-2 right-2 w-7 h-7 border-2 border-purple-400/80 bg-black/60 flex items-center justify-center font-mono text-[8px] text-purple-300 font-bold z-10 pointer-events-none shadow-md">
                    3D
                  </div>

                  <img
                    src={selectedCase.images.boneAxial || selectedCase.images.axial}
                    alt="3D Bone View"
                    style={{ filter: 'contrast(1.6) brightness(1.2)' }}
                    className="w-full h-full object-contain select-none pointer-events-none opacity-85"
                  />

                  <div className="absolute bottom-1.5 left-2 z-10 font-mono text-[9px] text-gray-300 pointer-events-none leading-tight drop-shadow">
                    <div>WL=500</div>
                    <div>WW=2000</div>
                    <div className="text-gray-400 text-[8px]">Bone High-Res</div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== MODO 2: 3D VOLUME RENDERING SCREEN ==================== */}
            {topMode === '3D' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0d14] via-[#050608] to-black p-4 relative">
                <div className="absolute top-3 left-4 z-10 font-mono text-xs text-cyan-300 bg-black/60 p-2 rounded border border-cyan-500/30">
                  <div className="font-bold text-white text-sm">CANON ACTIVION 16 • 3D VOLUME RENDERING</div>
                  <div>Paciente: {selectedCase.patientName} ({selectedCase.patientId})</div>
                  <div>LUT: {threeDParams.colorMap}</div>
                  <div>Algoritmo: {threeDParams.renderMode}</div>
                </div>

                <div className="absolute top-3 right-4 z-10 font-mono text-xs text-right text-amber-300 bg-black/60 p-2 rounded border border-amber-500/30">
                  <div>Ângulo de Visão: X={threeDParams.rotationX.toFixed(0)}° Y={threeDParams.rotationY.toFixed(0)}°</div>
                  <div>Zoom VR: {(threeDParams.zoom * 100).toFixed(0)}%</div>
                  <div className="text-emerald-400">Shading: Gouraud 3D Iluminado</div>
                </div>

                {/* Simulated 3D Render Canvas */}
                <div
                  style={{
                    transform: `perspective(800px) rotateX(${threeDParams.rotationX}deg) rotateY(${threeDParams.rotationY}deg) scale(${threeDParams.zoom})`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
                  }}
                  className="relative w-96 h-96 sm:w-[480px] sm:h-[480px] rounded-2xl border border-cyan-500/40 bg-black/80 shadow-[0_0_80px_rgba(6,182,212,0.25)] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={selectedCase.images.boneAxial || selectedCase.images.coronal}
                    alt="3D Volume"
                    className="w-full h-full object-cover select-none pointer-events-none mix-blend-screen filter contrast-150 brightness-110 drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                  />

                  {/* Cut Plane Visualizer if enabled */}
                  {threeDParams.cutPlaneActive && (
                    <div className="absolute inset-y-0 right-0 w-1/2 border-l-2 border-red-500 bg-red-500/10 pointer-events-none flex items-center justify-center">
                      <span className="font-mono text-xs text-red-400 font-bold bg-black/80 px-2 py-1 rounded">
                        PLANO DE CORTE ATIVO (50%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center font-mono text-xs text-gray-400">
                  Arraste com o mouse para rotacionar o volume 3D em 360° no espaço cartesiano.
                </div>
              </div>
            )}

            {/* ==================== MODO 3: SCAN & SCOUT VIEW ACQUISITION SCREEN (Canon Aquilion Console) ==================== */}
            {topMode === 'Scan' && (
              <div className="w-full h-full">
                <CanonScanConsole
                  selectedCase={selectedCase}
                  onSelectCase={handleSelectCase}
                  activeProtocol={activeProtocol}
                  onSelectProtocol={(protocol, key) => {
                    setActiveProtocol(protocol);
                    setSelectedProtocolKey(key);
                  }}
                  dicomSlices={dicomSlices}
                  onCompleteScanToMpr={(slices) => {
                    setDicomSlices(slices);
                    setSliceIndex(Math.floor(slices.length / 2) + 1);
                    setTopMode('MPR');
                    setDicomStatusNotice({
                      message: `✅ Varredura Helical Canon concluída! ${slices.length} cortes axiais reconstruídos e carregados no MPR 3D.`,
                      isError: false
                    });
                    setTimeout(() => setDicomStatusNotice(null), 5000);
                  }}
                  onNavigateMode={(mode) => setTopMode(mode)}
                  onClose={onClose}
                />
              </div>
            )}

            {/* ==================== MODO 4: FILMING CAMERA SCREEN (Laser DICOM Film) ==================== */}
            {topMode === 'Filming' && (
              <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-[#0a0c10] overflow-y-auto">
                <div className="text-center mb-2 font-mono">
                  <h4 className="text-white font-bold text-sm">PREVIEW DE IMPRESSÃO EM PELÍCULA RADIOLÓGICA</h4>
                  <p className="text-gray-400 text-xs">
                    Formato: {filmingSheet.sheetFormat} • Película: {filmingSheet.filmSize} • Impressora: {filmingSheet.targetPrinter}
                  </p>
                </div>

                {/* Simulated Physical Black X-Ray Film Sheet with 12 Cut Windows */}
                <div className="w-[520px] h-[640px] bg-black border-4 border-gray-800 rounded-lg shadow-2xl p-3 grid grid-cols-3 grid-rows-4 gap-1.5 relative">
                  {/* Film Header Details */}
                  <div className="absolute top-1 left-3 right-3 flex justify-between font-mono text-[8px] text-gray-400">
                    <span>{selectedCase.patientName} ({selectedCase.patientId})</span>
                    <span>{selectedCase.studyDateTime} • {selectedCase.protocolName.slice(0, 20)}</span>
                    <span>HOSPITAL RADBIO CANON</span>
                  </div>

                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="relative bg-[#0d0f14] border border-gray-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={selectedCase.images.axial}
                        alt={`Slice ${i + 1}`}
                        className="w-full h-full object-cover filter contrast-125"
                      />
                      <span className="absolute bottom-0.5 right-1 font-mono text-[7px] text-gray-400">
                        IMG {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== MODO 5: RAW-DATA RECONSTRUCTION SCREEN ==================== */}
            {topMode === 'RawData' && (
              <div className="w-full h-full p-6 flex flex-col justify-between bg-[#0e1119] font-mono text-xs">
                <div>
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-base mb-1">
                    <span className="material-symbols-outlined">database</span>
                    <span>ESTAÇÃO DE RECONSTRUÇÃO RETROSPECTIVA RAW-DATA (CANON ACTIVION)</span>
                  </div>
                  <p className="text-gray-400">
                    Permite reprocessar os dados brutos armazenados nos detectores com filtros de convolução e algoritmos iterativos avançados.
                  </p>
                </div>

                {/* Reconstruction Matrix Grid */}
                <div className="grid grid-cols-2 gap-4 my-4">
                  <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30 space-y-2">
                    <div className="text-white font-bold text-sm">Dados do Estudo Bruto:</div>
                    <div className="flex justify-between text-gray-400"><span>Paciente:</span> <span className="text-white">{selectedCase.patientName}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Aquisição:</span> <span className="text-white">16 Canais x 0.5mm Helical</span></div>
                    <div className="flex justify-between text-gray-400"><span>Filtro Selecionado:</span> <span className="text-cyan-300 font-bold">{rawDataPlan.filterKernel}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Espessura:</span> <span className="text-amber-300 font-bold">{rawDataPlan.sliceThickness}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Denoising:</span> <span className="text-emerald-400 font-bold">{rawDataPlan.iterativeDenoising}</span></div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-gray-700 flex flex-col justify-center items-center text-center space-y-2">
                    <span className="material-symbols-outlined text-4xl text-purple-400">memory</span>
                    <div className="text-white font-bold">Processador de Reconstrução GPU</div>
                    <div className="text-gray-400 text-[11px]">
                      {isReconstructing ? 'Processando projeções Radon 3D...' : 'Aguardando parâmetros do operador.'}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-purple-200 text-center">
                  Dica: Para o caso de crânio, utilize o filtro <strong>FC13</strong> para diferenciar substância cinzenta e branca, ou <strong>FC30</strong> para fraturas da base do crânio.
                </div>
              </div>
            )}

            {/* ==================== MODO 6: CLINICAL SUMMARY SCREEN ==================== */}
            {topMode === 'Clinical' && (
              <div className="w-full h-full p-6 flex flex-col justify-between bg-[#0e1119] font-mono text-xs">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-base mb-1">
                    <span className="material-symbols-outlined">clinical_notes</span>
                    <span>DOSSIÊ CLÍNICO E LAUDO OFICIAL DO CASO</span>
                  </div>
                  <p className="text-gray-400">
                    Histórico do paciente, protocolo de injeção de contraste e relatório radiológico estruturado.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 my-3">
                  <div className="p-4 rounded-xl bg-black/60 border border-gray-700 space-y-2">
                    <div className="text-white font-bold text-sm">História Clínica:</div>
                    <p className="text-gray-300 leading-relaxed text-[11px]">
                      {selectedCase.findingDescription}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2">
                    <div className="text-cyan-300 font-bold text-sm">Dica Pedagógica do Console Canon:</div>
                    <p className="text-gray-300 leading-relaxed text-[11px]">
                      {selectedCase.educationalNotes}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 text-center">
                  Status do Exame: <strong>ASSINADO ELETRONICAMENTE POR RADIOLOGISTA TITULAR</strong>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ===================== BOTTOM SLICE CONTROL & STATUS STRIP ===================== */}
        <div className="h-8 bg-[#20242e] border-t border-[#3e4554] px-3 flex items-center justify-between text-[11px] font-mono text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Ferramenta:</span>
            <span className="text-cyan-300 font-bold uppercase">{activeTool}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Modo Console:</span>
            <span className="text-amber-400 font-bold uppercase">{topMode}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSliceIndex(prev => Math.max(1, prev - 1))}
              className="px-2 py-0.5 rounded bg-[#2e3442] hover:bg-[#3b4355] text-gray-200 text-[10px] font-bold border border-gray-600 cursor-pointer"
            >
              -1
            </button>
            <input
              type="range"
              min="1"
              max={dicomSlices.length}
              value={sliceIndex}
              onChange={e => setSliceIndex(Number(e.target.value))}
              className="w-48 sm:w-72 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <button
              onClick={() => setSliceIndex(prev => Math.min(dicomSlices.length, prev + 1))}
              className="px-2 py-0.5 rounded bg-[#2e3442] hover:bg-[#3b4355] text-gray-200 text-[10px] font-bold border border-gray-600 cursor-pointer"
            >
              +1
            </button>
            <span className="text-emerald-400 font-bold min-w-[75px] text-center">
              {sliceIndex} / {dicomSlices.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScoutLines(!showScoutLines)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                showScoutLines ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-gray-800 text-gray-500'
              }`}
            >
              Scout Lines
            </button>
          </div>
        </div>

        {/* ===================== CLINICAL GUIDANCE OVERLAY MODAL ===================== */}
        {showClinicalNotes && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-[#232733] border border-[#434b5b] rounded-xl p-5 shadow-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-base">clinical_notes</span>
                  <span>Gabarito Técnico & Diagnóstico Canon Activion 16</span>
                </div>
                <button onClick={() => setShowClinicalNotes(false)} className="text-gray-400 hover:text-white">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div>
                <span className="text-amber-400 font-bold">PACIENTE:</span>{' '}
                <span className="text-white">{selectedCase.patientName} ({selectedCase.patientId})</span>
              </div>

              <div>
                <span className="text-cyan-400 font-bold">PROTOCOLO:</span>{' '}
                <span className="text-gray-300">{selectedCase.protocolName}</span>
              </div>

              <div>
                <span className="text-emerald-400 font-bold">DESCRIÇÃO DOS ACHADOS:</span>
                <p className="text-gray-300 bg-black/50 p-2.5 rounded mt-1 leading-relaxed text-[11px]">
                  {selectedCase.findingDescription}
                </p>
              </div>

              <div>
                <span className="text-purple-400 font-bold">ORIENTAÇÕES PEDAGÓGICAS DA PLATAFORMA CANON:</span>
                <p className="text-gray-300 bg-black/50 p-2.5 rounded mt-1 leading-relaxed text-[11px]">
                  {selectedCase.educationalNotes}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowClinicalNotes(false)}
                  className="px-4 py-1.5 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  Continuar no Simulador
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== RADBIO PACS NETWORK WORKSTATION MODAL ===================== */}
        {showDicomDirectoryModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
            <div className="w-full max-w-5xl bg-[#181b24] border-2 border-[#4b5568] rounded-2xl p-4 sm:p-5 shadow-[0_0_100px_rgba(0,0,0,0.95)] space-y-4 font-mono text-xs my-auto max-h-[92vh] flex flex-col justify-between">
              
              {/* PACS Server Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-700 pb-3 gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400 flex items-center justify-center text-white shadow-lg shrink-0">
                    <span className="material-symbols-outlined text-2xl">hub</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                        RADBIO PACS WORKSTATION v4.8
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold text-[9px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>C-STORE / C-MOVE ONLINE</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Servidor DICOM Central • Node: <strong className="text-purple-300">RADBIO_PACS_01</strong> (192.168.1.100:104) • AE Title: <strong className="text-cyan-300">RADBIO_WORKSTATION</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      playCanonAudioCue('beep');
                      setDicomStatusNotice({
                        message: '📡 DICOM C-ECHO (Ping): Verificação com RADBIO_PACS_01 bem-sucedida! Latência: 8ms (Status: 0x0000 Sucesso).',
                        isError: false
                      });
                      setTimeout(() => setDicomStatusNotice(null), 4000);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#252a37] hover:bg-[#32394a] border border-gray-600 text-cyan-300 font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">network_ping</span>
                    <span>Testar Conexão (C-ECHO)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDicomDirectoryModal(false);
                      setPacsInspectCase(null);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* PACS Search, Query & Category Filter Toolbar */}
              <div className="bg-[#12151c] p-3 rounded-xl border border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={pacsSearchQuery}
                    onChange={e => setPacsSearchQuery(e.target.value)}
                    placeholder="Buscar por Paciente, ID, Protocolo..."
                    className="w-full bg-[#1e2330] border border-gray-600 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-gray-500 text-[11px] focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {[
                    { id: 'ALL', label: 'Todos os Estudos' },
                    { id: 'EMERGENCY', label: '🔴 Sala Vermelha / AVC', badge: true },
                    { id: 'HEAD', label: 'Crânio' },
                    { id: 'CHEST', label: 'Tórax & HRCT' },
                    { id: 'ABDOMEN', label: 'Abdômen & Contraste' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        playCanonAudioCue('click');
                        setPacsRegionFilter(tab.id as any);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        pacsRegionFilter === tab.id
                          ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                          : 'bg-[#1a1e29] text-gray-400 border-gray-700 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      playCanonAudioCue('beep');
                      setPacsIsQuerying(true);
                      setTimeout(() => {
                        setPacsIsQuerying(false);
                        playCanonAudioCue('success');
                      }, 500);
                    }}
                    className="p-1.5 rounded-lg bg-[#252a37] hover:bg-cyan-600 hover:text-white text-cyan-300 border border-gray-600 cursor-pointer"
                    title="Executar DICOM C-FIND Query no Servidor"
                  >
                    <span className={`material-symbols-outlined text-sm ${pacsIsQuerying ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                  </button>
                </div>
              </div>

              {/* Main Worklist Table and DICOM Case Explorer */}
              <div className="flex-1 overflow-y-auto max-h-[44vh] rounded-xl border border-gray-700 bg-[#12141c]">
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead className="bg-[#1b202c] text-gray-300 uppercase text-[9px] sticky top-0 z-10 border-b border-gray-700">
                    <tr>
                      <th className="p-2.5">Status / Prioridade</th>
                      <th className="p-2.5">Paciente & ID</th>
                      <th className="p-2.5">Protocolo & Estudo</th>
                      <th className="p-2.5">Data / Hora</th>
                      <th className="p-2.5">Parâmetros (kV/mAs)</th>
                      <th className="p-2.5">Cortes</th>
                      <th className="p-2.5 text-right">Ação Workstation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {CANON_ACTIVION_CASES
                      .filter(c => {
                        const q = pacsSearchQuery.toLowerCase();
                        const matchText = (
                          c.patientName.toLowerCase().includes(q) ||
                          c.patientId.toLowerCase().includes(q) ||
                          c.protocolName.toLowerCase().includes(q) ||
                          c.findingDescription.toLowerCase().includes(q)
                        );
                        if (!matchText) return false;

                        if (pacsRegionFilter === 'EMERGENCY') {
                          return c.id.includes('emergencia') || c.caseCode.includes('EMERGÊNCIA');
                        }
                        if (pacsRegionFilter === 'HEAD') {
                          return c.id.includes('cranio');
                        }
                        if (pacsRegionFilter === 'CHEST') {
                          return c.id.includes('torax');
                        }
                        if (pacsRegionFilter === 'ABDOMEN') {
                          return c.id.includes('abdomen');
                        }
                        return true;
                      })
                      .map((c) => {
                        const isEmergency = c.id.includes('emergencia') || c.caseCode.includes('EMERGÊNCIA');
                        const isSelected = selectedCase.id === c.id;

                        return (
                          <tr
                            key={c.id}
                            className={`hover:bg-[#1f2533] transition-colors ${
                              isSelected ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400' : ''
                            }`}
                          >
                            {/* Priority Badge */}
                            <td className="p-2.5">
                              {isEmergency ? (
                                <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-black text-[8px] flex items-center gap-1 w-fit animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  <span>URGÊNCIA</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-[8px] w-fit">
                                  ROTINA
                                </span>
                              )}
                            </td>

                            {/* Patient Info */}
                            <td className="p-2.5 font-bold text-white">
                              <div>{c.patientName}</div>
                              <div className="text-[9px] text-gray-400 font-normal">ID: {c.patientId}</div>
                            </td>

                            {/* Protocol */}
                            <td className="p-2.5">
                              <div className="text-cyan-300 font-bold">{c.protocolName}</div>
                              <div className="text-[9px] text-gray-400 line-clamp-1 max-w-xs">{c.findingDescription}</div>
                            </td>

                            {/* Date */}
                            <td className="p-2.5 text-gray-300 text-[10px] whitespace-nowrap">
                              {c.studyDateTime}
                            </td>

                            {/* Tech params */}
                            <td className="p-2.5 text-gray-300 text-[10px]">
                              <span className="text-amber-300 font-bold">{c.kv}</span> / <span className="text-white">{c.ma}</span> • {c.rotTime}
                            </td>

                            {/* Slices */}
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-[#252b3b] text-cyan-300 font-bold text-[9px]">
                                {c.totalImages} Img ({c.thickness})
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-2.5 text-right whitespace-nowrap space-x-1.5">
                              <button
                                onClick={() => {
                                  playCanonAudioCue('click');
                                  setPacsInspectCase(c);
                                }}
                                className="px-2 py-1 bg-[#252a37] hover:bg-[#343b4d] border border-gray-600 rounded text-gray-300 font-bold text-[9px] cursor-pointer"
                                title="Inspecionar Dicionário de Tags DICOM do Estudo"
                              >
                                Metadados DICOM
                              </button>

                              <button
                                onClick={() => {
                                  handleSelectCase(c);
                                  setShowDicomDirectoryModal(false);
                                  playCanonAudioCue('success');
                                  setDicomStatusNotice({
                                    message: `⚡ Estudo DICOM [${c.patientId}] carregado com sucesso no reconstrutor MPR 3D via C-MOVE!`,
                                    isError: false
                                  });
                                  setTimeout(() => setDicomStatusNotice(null), 4000);
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-700 hover:brightness-110 text-white font-black rounded text-[10px] shadow cursor-pointer transition-all inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">play_arrow</span>
                                <span>C-MOVE / Abrir</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* DICOM Tag Metadata Inspector Overlay (if inspecting a case) */}
              {pacsInspectCase && (
                <div className="bg-[#12151d] border border-purple-500/50 rounded-xl p-3 text-[10px] space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-1.5">
                    <div className="text-purple-300 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">data_object</span>
                      <span>INSPEÇÃO DE TAGS DICOM • {pacsInspectCase.patientName} ({pacsInspectCase.patientId})</span>
                    </div>
                    <button
                      onClick={() => setPacsInspectCase(null)}
                      className="text-gray-400 hover:text-white text-xs cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-300">
                    <div>(0008,0060) Modality: <strong className="text-white">CT (Tomografia)</strong></div>
                    <div>(0008,1030) StudyDescription: <strong className="text-cyan-300">{pacsInspectCase.protocolName}</strong></div>
                    <div>(0018,0060) KVP: <strong className="text-amber-300">{pacsInspectCase.kv}</strong></div>
                    <div>(0018,1151) XRayTubeCurrent: <strong className="text-amber-300">{pacsInspectCase.ma}</strong></div>
                    <div>(0018,0050) SliceThickness: <strong className="text-white">{pacsInspectCase.thickness}</strong></div>
                    <div>(0028,1050) WindowCenter (WL): <strong className="text-emerald-300">{pacsInspectCase.wl} HU</strong></div>
                    <div>(0028,1051) WindowWidth (WW): <strong className="text-emerald-300">{pacsInspectCase.ww} HU</strong></div>
                    <div>(0028,0100) BitsAllocated: <strong className="text-white">16 Bits (Grayscale)</strong></div>
                  </div>
                </div>
              )}

              {/* Bottom Hub: Local File Import & C-STORE Transmission */}
              <div className="bg-[#151821] border border-cyan-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-2xl text-emerald-400">upload_file</span>
                  <div>
                    <div className="text-white font-bold text-xs">IMPORTAÇÃO LOCAL & TRANSMISSÃO C-STORE</div>
                    <div className="text-gray-400 text-[10px]">
                      Carregue seus próprios arquivos .dcm de tomografia do seu computador ou exporte o corte atual
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer text-[10px]"
                  >
                    <span className="material-symbols-outlined text-xs">add_photo_alternate</span>
                    <span>Importar .dcm Local</span>
                  </button>

                  <button
                    onClick={handleDownloadCurrentSliceDicom}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:brightness-110 text-white font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer text-[10px]"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>Baixar Corte .dcm</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-2 bg-black/60 rounded-xl border border-gray-700 text-[10px] text-gray-400 flex items-center justify-between shrink-0">
                <div>
                  Conformidade DICOM NEMA PS 3.1-3.20 • SOP Class: 1.2.840.10008.5.1.4.1.1.2 (CT Image Storage)
                </div>
                <button
                  onClick={() => setShowDicomDirectoryModal(false)}
                  className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold cursor-pointer"
                >
                  Voltar ao Console Canon
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ===================== DICOM IMAGE IMPORTER UTILITY MODAL ===================== */}
        {showDicomImporterModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
            <div className="w-full max-w-5xl bg-[#171b26] border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-[0_0_120px_rgba(16,185,129,0.25)] space-y-4 font-mono text-xs my-auto max-h-[92vh] flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-700 pb-3 gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 border border-emerald-400 flex items-center justify-center text-white shadow-lg shrink-0">
                    <span className="material-symbols-outlined text-2xl">image_search</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                        IMPORTADOR DE IMAGENS DICOM & MOTOR DE PIXELS MPR
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 font-bold text-[9px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>PIXEL ENGINE 16-BIT ACTIVE</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Converte imagens locais (Blobs, Base64, Séries de Arquivos) em matrizes 16-bit com Unidades Hounsfield (HU) reais para processamento no reconstrutor MPR Multiplanar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setShowDicomImporterModal(false);
                      setStagedImportSlices([]);
                      setStagedImportInfo(null);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Patient Metadata & Anatomical Region Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#11141c] p-3 rounded-xl border border-gray-700/80 shrink-0">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Nome do Paciente / Estudo</label>
                  <input
                    type="text"
                    value={importerPatientName}
                    onChange={e => setImporterPatientName(e.target.value)}
                    className="w-full bg-[#1b202d] border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                    placeholder="Ex: SILVA, ROBERTO C."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">ID do Paciente / Prontuário</label>
                  <input
                    type="text"
                    value={importerPatientId}
                    onChange={e => setImporterPatientId(e.target.value)}
                    className="w-full bg-[#1b202d] border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                    placeholder="Ex: DCM-8890"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Região Anatômica (Calibração HU)</label>
                  <select
                    value={importerBodyRegion}
                    onChange={e => setImporterBodyRegion(e.target.value as any)}
                    className="w-full bg-[#1b202d] border border-gray-600 rounded-lg px-2.5 py-1.5 text-emerald-300 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer font-bold"
                  >
                    <option value="HEAD">Crânio (Brain WL:40 / WW:88)</option>
                    <option value="CHEST">Tórax (Pulmão WL:-600 / WW:1500)</option>
                    <option value="ABDOMEN">Abdômen (Partes Moles WL:45 / WW:320)</option>
                    <option value="SPINE">Coluna / Osso (Ósseo WL:400 / WW:1800)</option>
                  </select>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 shrink-0">
                {[
                  { id: 'sets', label: '1. Galeria de Sets Clínicos (Blobs Locais)', icon: 'collections' },
                  { id: 'files', label: '2. Importar Arquivos Locais (.dcm / .png / .jpg)', icon: 'upload_file' },
                  { id: 'base64', label: '3. Inserir Base64 / Data URI', icon: 'code' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playCanonAudioCue('click');
                      setImporterActiveTab(tab.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      importerActiveTab === tab.id
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-[#181d28] text-gray-400 border-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content & Staged Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto max-h-[46vh]">
                
                {/* Left Panel: Input Mode */}
                <div className="md:col-span-7 bg-[#12151d] p-3.5 rounded-xl border border-gray-700/80 space-y-3 overflow-y-auto">
                  
                  {/* TAB 1: Clinical Sets */}
                  {importerActiveTab === 'sets' && (
                    <div className="space-y-3">
                      <div className="text-[11px] text-gray-300">
                        Selecione um set anatômico pré-carregado. O importador gera os <strong>Blobs em memória RAM</strong>, calcula a matriz 16-bit com as Unidades Hounsfield e envia diretamente para o Reconstrutor MPR 3D:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Preset 1 */}
                        <div className="bg-[#1a1f2c] border border-gray-700 hover:border-emerald-500 rounded-xl p-3 flex flex-col justify-between space-y-2 transition-all">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[8px] font-bold border border-cyan-800">
                                32 CORTES • 0.5mm
                              </span>
                              <span className="text-emerald-400 text-[9px] font-bold">Crânio / AVC</span>
                            </div>
                            <div className="text-white font-bold text-xs mt-1">TC Crânio Urgência (Trauma)</div>
                            <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                              Diferenciação cinzenta/branca (+38/+31 HU), ventrículos (+8 HU) e hematoma (+82 HU).
                            </div>
                          </div>
                          <button
                            disabled={importerIsProcessing}
                            onClick={() => handleLoadClinicalSet('head_stroke')}
                            className="w-full py-1.5 bg-gradient-to-r from-cyan-700 to-blue-800 hover:brightness-110 text-white font-bold rounded text-[10px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">download</span>
                            <span>Carregar Set de Crânio</span>
                          </button>
                        </div>

                        {/* Preset 2 */}
                        <div className="bg-[#1a1f2c] border border-gray-700 hover:border-emerald-500 rounded-xl p-3 flex flex-col justify-between space-y-2 transition-all">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[8px] font-bold border border-blue-800">
                                32 CORTES • 0.5mm
                              </span>
                              <span className="text-cyan-400 text-[9px] font-bold">Tórax / HRCT</span>
                            </div>
                            <div className="text-white font-bold text-xs mt-1">TC Tórax Alta Resolução (HRCT)</div>
                            <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                              Parênquima pulmonar (-780 HU), trama vascular e artérias pulmonares (+320 HU).
                            </div>
                          </div>
                          <button
                            disabled={importerIsProcessing}
                            onClick={() => handleLoadClinicalSet('chest_hrct')}
                            className="w-full py-1.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:brightness-110 text-white font-bold rounded text-[10px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">download</span>
                            <span>Carregar Set de Tórax</span>
                          </button>
                        </div>

                        {/* Preset 3 */}
                        <div className="bg-[#1a1f2c] border border-gray-700 hover:border-emerald-500 rounded-xl p-3 flex flex-col justify-between space-y-2 transition-all">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[8px] font-bold border border-purple-800">
                                32 CORTES • 1.0mm
                              </span>
                              <span className="text-purple-400 text-[9px] font-bold">Abdômen / Contraste</span>
                            </div>
                            <div className="text-white font-bold text-xs mt-1">TC Abdômen Total Multifásico</div>
                            <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                              Fígado (+72 HU), veia porta (+165 HU), nódulo hipervascular arterial e aorta.
                            </div>
                          </div>
                          <button
                            disabled={importerIsProcessing}
                            onClick={() => handleLoadClinicalSet('abdomen_contrast')}
                            className="w-full py-1.5 bg-gradient-to-r from-purple-700 to-pink-800 hover:brightness-110 text-white font-bold rounded text-[10px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">download</span>
                            <span>Carregar Set de Abdômen</span>
                          </button>
                        </div>

                        {/* Preset 4 */}
                        <div className="bg-[#1a1f2c] border border-gray-700 hover:border-emerald-500 rounded-xl p-3 flex flex-col justify-between space-y-2 transition-all">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[8px] font-bold border border-amber-800">
                                32 CORTES • 1.0mm
                              </span>
                              <span className="text-amber-400 text-[9px] font-bold">Coluna / Janela Óssea</span>
                            </div>
                            <div className="text-white font-bold text-xs mt-1">TC Coluna Lombar 3D</div>
                            <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                              Vertebras lombares (+920 HU), canal medular (+15 HU) e forames neurais.
                            </div>
                          </div>
                          <button
                            disabled={importerIsProcessing}
                            onClick={() => handleLoadClinicalSet('spine_bone')}
                            className="w-full py-1.5 bg-gradient-to-r from-amber-700 to-orange-800 hover:brightness-110 text-white font-bold rounded text-[10px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">download</span>
                            <span>Carregar Set de Coluna</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: File Upload */}
                  {importerActiveTab === 'files' && (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-600 hover:border-emerald-400 rounded-xl p-6 text-center space-y-3 bg-[#171b26] transition-colors cursor-pointer"
                        onClick={() => importerFileInputRef.current?.click()}
                      >
                        <span className="material-symbols-outlined text-4xl text-emerald-400">
                          cloud_upload
                        </span>
                        <div>
                          <div className="text-white font-bold text-xs">Clique para selecionar ou arraste arquivos aqui</div>
                          <div className="text-gray-400 text-[10px] mt-1">
                            Suporta múltiplos arquivos DICOM (<strong>.dcm</strong>) ou imagens convencionais (<strong>.png, .jpg, .webp</strong>)
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-xs">folder_open</span>
                          <span>Procurar Arquivos</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Base64 Input */}
                  {importerActiveTab === 'base64' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold block mb-1">
                          Cole a String Base64 / Data URI (ex: <code>data:image/png;base64,iVBORw0...</code>)
                        </label>
                        <textarea
                          rows={5}
                          value={importerBase64Input}
                          onChange={e => setImporterBase64Input(e.target.value)}
                          placeholder="Cole sua string base64 aqui..."
                          className="w-full bg-[#1b202d] border border-gray-600 rounded-lg p-2 text-white text-[10px] font-mono focus:outline-none focus:border-emerald-400 resize-none"
                        />
                      </div>
                      <button
                        onClick={handleImportBase64String}
                        disabled={importerIsProcessing || !importerBase64Input.trim()}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-xs">transform</span>
                        <span>Converter Base64 para Matriz de Voxels 16-Bit</span>
                      </button>
                    </div>
                  )}

                </div>

                {/* Right Panel: Staged Slice & Voxel Array Inspector */}
                <div className="md:col-span-5 bg-[#12151d] p-3.5 rounded-xl border border-gray-700/80 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-1.5">
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">view_in_ar</span>
                        <span>INSPETOR DE PIXELS PREPARADOS</span>
                      </span>
                      {stagedImportInfo && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[8px] font-bold border border-emerald-600">
                          {stagedImportInfo.count} CORTES
                        </span>
                      )}
                    </div>

                    {/* Preview Canvas */}
                    <div className="w-full aspect-square max-w-[200px] mx-auto bg-black rounded-lg border border-gray-700 overflow-hidden relative flex items-center justify-center">
                      <canvas
                        ref={importerPreviewCanvasRef}
                        className="w-full h-full object-contain"
                      />
                      {!stagedImportInfo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-[10px] p-2 text-center">
                          <span className="material-symbols-outlined text-2xl mb-1">image</span>
                          <span>Nenhum set preparado</span>
                        </div>
                      )}
                    </div>

                    {/* Voxel Stats */}
                    {stagedImportInfo ? (
                      <div className="bg-[#181d28] p-2.5 rounded-lg border border-gray-700/80 text-[10px] space-y-1 text-gray-300">
                        <div>Estudo: <strong className="text-white">{stagedImportInfo.name}</strong></div>
                        <div>Origem: <strong className="text-cyan-300">{stagedImportInfo.source}</strong></div>
                        <div>Faixa HU: <strong className="text-amber-300">{stagedImportInfo.huRange}</strong></div>
                        <div>Matriz: <strong className="text-white">256 x 256 (16-bit Grayscale)</strong></div>
                        <div>Status MPR: <strong className="text-emerald-400">Pronto para Coronal & Sagital</strong></div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-500 text-center py-2">
                        Selecione um set clínico ao lado ou carregue imagens para pré-visualizar a matriz.
                      </div>
                    )}
                  </div>

                  {/* Apply Button */}
                  <button
                    disabled={stagedImportSlices.length === 0}
                    onClick={handleApplyStagedSlicesToMpr}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    <span>⚡ APLICAR AO VISUALIZADOR MPR 3D</span>
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="p-2 bg-black/60 rounded-xl border border-gray-700 text-[10px] text-gray-400 flex items-center justify-between shrink-0">
                <div>
                  Pipeline: Image Buffer $\to$ Canvas Luminance $\to$ HU Voxel Map (Slope 1.0, Intercept -1024) $\to$ Triplanar MPR Engine
                </div>
                <button
                  onClick={() => setShowDicomImporterModal(false)}
                  className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ===================== ADVANCED WINDOWING & CONTRAST MODAL ===================== */}
        {showWindowControlsModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-2xl bg-[#1a1e28] border-2 border-amber-500/60 rounded-2xl p-5 shadow-[0_0_100px_rgba(245,158,11,0.2)] space-y-4 font-mono text-xs my-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 border border-amber-400 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined text-xl">contrast</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                      <span>CALIBRAÇÃO DE JANELAMENTO DIAGNÓSTICO (WW / WL)</span>
                      <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 text-[9px]">
                        DICOM NEMA PS 3.4
                      </span>
                    </h2>
                    <p className="text-[10px] text-gray-400">
                      Ajuste de contraste e brilho para discriminação de densidades teciduais em Tomografia Computadorizada
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowWindowControlsModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Quick Auto-Window & Current Values Summary */}
              <div className="bg-[#12151d] p-3.5 rounded-xl border border-gray-700 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Estado Atual de Janela</div>
                  <div className="text-white text-base font-extrabold flex items-center gap-3 font-mono">
                    <span className="text-cyan-300">WW: {ww} HU</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-300">WL: {wl} HU</span>
                  </div>
                  <div className="text-gray-400 text-[10px]">
                    Faixa de Realce: <strong className="text-emerald-300">{Math.round(wl - ww / 2)} HU</strong> até <strong className="text-emerald-300">+{Math.round(wl + ww / 2)} HU</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoWindowCurrentSlice}
                    className="px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                    <span>Otimizar Contraste (Auto)</span>
                  </button>

                  <button
                    onClick={() => {
                      playCanonAudioCue('click');
                      setWw(selectedCase.ww);
                      setWl(selectedCase.wl);
                    }}
                    className="px-3 py-2 bg-[#2a3040] hover:bg-[#384157] border border-gray-600 text-gray-200 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </div>

              {/* Sliders Area */}
              <div className="space-y-3 bg-[#141720] p-4 rounded-xl border border-gray-700/80">
                {/* WW Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-cyan-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">tune</span>
                      <span>Window Width (WW) - Largura / Escala de Contraste</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={ww}
                        min={10}
                        max={4000}
                        onChange={e => setWw(Math.max(10, Math.min(4000, Number(e.target.value) || 10)))}
                        className="w-16 bg-black border border-cyan-500/60 rounded px-2 py-0.5 text-right text-cyan-300 font-mono text-xs font-bold"
                      />
                      <span className="text-gray-400">HU</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={3500}
                    step={5}
                    value={ww}
                    onChange={e => setWw(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                  />

                  <div className="flex items-center justify-between gap-1 text-[9px]">
                    <span className="text-gray-500">Mais Contraste (10 HU)</span>
                    <div className="flex gap-1">
                      {[-200, -50, -10, +10, +50, +200].map(step => (
                        <button
                          key={step}
                          onClick={() => {
                            playCanonAudioCue('click');
                            setWw(prev => Math.max(10, Math.min(4000, prev + step)));
                          }}
                          className="px-2 py-0.5 bg-[#252b39] hover:bg-[#343d52] border border-gray-600 rounded text-gray-300 font-bold"
                        >
                          {step > 0 ? `+${step}` : step}
                        </button>
                      ))}
                    </div>
                    <span className="text-gray-500">Mais Suave (3500 HU)</span>
                  </div>
                </div>

                {/* WL Slider */}
                <div className="space-y-1.5 pt-2 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">brightness_medium</span>
                      <span>Window Level (WL) - Centro / Ponto de Brilho</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={wl}
                        min={-1000}
                        max={1500}
                        onChange={e => setWl(Math.max(-1000, Math.min(1500, Number(e.target.value) || 0)))}
                        className="w-16 bg-black border border-amber-500/60 rounded px-2 py-0.5 text-right text-amber-300 font-mono text-xs font-bold"
                      />
                      <span className="text-gray-400">HU</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={-1000}
                    max={1200}
                    step={5}
                    value={wl}
                    onChange={e => setWl(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                  />

                  <div className="flex items-center justify-between gap-1 text-[9px]">
                    <span className="text-gray-500">Mais Escuro (-1000 HU Ar)</span>
                    <div className="flex gap-1">
                      {[-200, -50, -10, +10, +50, +200].map(step => (
                        <button
                          key={step}
                          onClick={() => {
                            playCanonAudioCue('click');
                            setWl(prev => Math.max(-1000, Math.min(1500, prev + step)));
                          }}
                          className="px-2 py-0.5 bg-[#252b39] hover:bg-[#343d52] border border-gray-600 rounded text-gray-300 font-bold"
                        >
                          {step > 0 ? `+${step}` : step}
                        </button>
                      ))}
                    </div>
                    <span className="text-gray-500">Mais Claro (+1200 HU Osso)</span>
                  </div>
                </div>

                {/* Gradient Ramp Visualizer */}
                <div className="bg-black p-2.5 rounded-lg border border-gray-700 space-y-1">
                  <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                    <span>Preto (&le; {Math.round(wl - ww / 2)} HU)</span>
                    <span className="text-white font-bold">WL = {wl} HU</span>
                    <span>Branco (&ge; {Math.round(wl + ww / 2)} HU)</span>
                  </div>
                  <div className="w-full h-4 rounded bg-gradient-to-r from-black via-gray-500 to-white border border-gray-600 shadow-inner" />
                </div>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <div className="text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Presets de Janela Médica Homologados:</span>
                  <span className="text-gray-500 text-[10px]">Clique para aplicar instantaneamente</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CLINICAL_WINDOW_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        playCanonAudioCue('click');
                        setWw(preset.ww);
                        setWl(preset.wl);
                      }}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        ww === preset.ww && wl === preset.wl
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 shadow-md font-bold'
                          : 'bg-[#212634] hover:bg-[#2d3447] border-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span className="material-symbols-outlined text-xs text-amber-400">{preset.icon}</span>
                        <span className="truncate">{preset.name.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mt-0.5">
                        WW:{preset.ww} | WL:{preset.wl}
                      </div>
                      <div className="text-[8px] text-gray-500 line-clamp-1 mt-0.5">
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                <div className="text-[10px] text-gray-400">
                  💡 <strong>Dica Pro PACS:</strong> Você também pode segurar o <strong>botão direito do mouse</strong> e arrastar na imagem para ajustar WW/WL interativamente.
                </div>
                <button
                  onClick={() => setShowWindowControlsModal(false)}
                  className="px-5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
                >
                  Concluir Janelamento
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Radiology Technical Glossary Modal */}
        <RadiologyGlossaryModal
          isOpen={showGlossaryModal}
          onClose={() => setShowGlossaryModal(false)}
          initialTermId={initialGlossaryTermId}
        />

      </div>
    </div>
  );
};

