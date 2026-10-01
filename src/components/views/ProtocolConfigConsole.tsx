import React, { useState, useMemo } from 'react';
import {
  SCAN_PROTOCOLS,
  ActivionScanProtocol,
  RawDataReconstructionPlan
} from '../../data/canonConsoleScreensData';
import { RealActivionCase } from '../../data/canonActivionData';
import { DicomSliceData, playCanonAudioCue } from '../../utils/dicomEngine';

interface ProtocolConfigConsoleProps {
  selectedCase: RealActivionCase;
  activeProtocol: ActivionScanProtocol;
  onApplyProtocol: (protocol: ActivionScanProtocol, protocolKey: string) => void;
  onStartScanWithProtocol: (protocol: ActivionScanProtocol) => void;
  onClose: () => void;
}

export interface CustomEditableProtocol {
  protocolCode: string;
  protocolName: string;
  bodyRegion: 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'VASCULAR' | 'CARDIAC' | 'EXTREMITIES';
  patientPosition: 'Head First Supine (HFS)' | 'Feet First Supine (FFS)' | 'Head First Prone (HFP)';
  scanType: 'Helical' | 'Sequential' | 'Dynamic' | 'ECG-Gated Helical';
  // Radiological tube parameters
  scanKv: '80kV' | '100kV' | '120kV' | '135kV' | '140kV';
  exposureMode: 'SUREExposure 3D (AEC)' | 'Manual mAs';
  scanMa: number; // mA value (10 - 600)
  targetNoiseSd: number; // SD 7.5 to 17.5
  rotationTimeSec: number; // 0.275, 0.35, 0.50, 0.75, 1.00, 1.50
  // Geometry & Detectors
  collimationType: '16 x 0.5mm' | '32 x 0.5mm' | '64 x 0.5mm' | '80 x 0.5mm' | '160 x 0.5mm';
  sliceThicknessMm: number; // 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0
  reconIntervalMm: number; // slice spacing
  pitchFactor: number; // 0.625 to 1.500
  gantryTiltDeg: number; // -30 to +30
  sFovSize: 'Small (240mm)' | 'Medium (320mm)' | 'Large (400mm)' | 'Extra-Large (500mm)';
  dFovMm: number; // 120 to 500
  scanLengthMm: number; // 100 to 800 mm
  // Convolution & Denoising
  filterKernel: string;
  iterativeDenoising: 'FBP (Standard Back-Projection)' | 'AIDR 3D Mild' | 'AIDR 3D Standard' | 'AIDR 3D Strong' | 'AiCE Deep Learning Reconstruction';
  matrixSize: '512 x 512' | '1024 x 1024 (Ultra High-Res)';
  // Contrast & Bolus
  contrastInjected: boolean;
  contrastVolumeMl: number;
  injectionFlowMlS: number;
  salineChaserMl: number;
  sureStartTriggerVessel: string;
  sureStartTriggerHu: number;
  sureStartScanDelaySec: number;
  contrastPhases: Array<{ name: string; delaySec: number; active: boolean }>;
  // AutoVoice
  voicePrompt: string;
  clinicalNotes: string;
}

export const ProtocolConfigConsole: React.FC<ProtocolConfigConsoleProps> = ({
  selectedCase,
  activeProtocol,
  onApplyProtocol,
  onStartScanWithProtocol,
  onClose
}) => {
  // Region filter & selected protocol key
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'VASCULAR' | 'CARDIAC' | 'EXTREMITIES'>('ALL');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('head_routine');
  const [activeConfigTab, setActiveConfigTab] = useState<'exposure' | 'geometry' | 'reconstruction' | 'contrast' | 'dosimetry'>('exposure');

  // Interactive Editable Protocol State
  const [config, setConfig] = useState<CustomEditableProtocol>(() => {
    const p = activeProtocol;
    const kv = (p.scanKv as any) || '120kV';
    return {
      protocolCode: p.protocolCode || 'CANON-CUSTOM-01',
      protocolName: p.protocolName || 'PROTOCOLO PERSONALIZADO CANON AQUILION',
      bodyRegion: p.bodyRegion || 'HEAD',
      patientPosition: p.patientPosition || 'Head First Supine (HFS)',
      scanType: p.scanType || 'Helical',
      scanKv: kv === '135kV' ? '135kV' : kv === '100kV' ? '100kV' : kv === '80kV' ? '80kV' : '120kV',
      exposureMode: 'SUREExposure 3D (AEC)',
      scanMa: 250,
      targetNoiseSd: 10.0,
      rotationTimeSec: 0.5,
      collimationType: (p.sliceCollimation as any) || '16 x 0.5mm',
      sliceThicknessMm: 0.5,
      reconIntervalMm: 0.5,
      pitchFactor: 0.813,
      gantryTiltDeg: 0,
      sFovSize: 'Medium (320mm)',
      dFovMm: 240,
      scanLengthMm: 260,
      filterKernel: p.filterKernel || 'FC13 (Brain Soft)',
      iterativeDenoising: 'AIDR 3D Standard',
      matrixSize: '512 x 512',
      contrastInjected: !!p.contrastInjected,
      contrastVolumeMl: p.contrastProtocol ? parseInt(p.contrastProtocol.volume) || 90 : 90,
      injectionFlowMlS: p.contrastProtocol ? parseFloat(p.contrastProtocol.flow) || 4.0 : 4.0,
      salineChaserMl: 30,
      sureStartTriggerVessel: p.contrastProtocol?.triggerVessel || 'Aorta Torácica',
      sureStartTriggerHu: p.contrastProtocol?.triggerHu || 140,
      sureStartScanDelaySec: 4,
      contrastPhases: [
        { name: 'Sem Contraste (Nativa)', delaySec: 0, active: true },
        { name: 'Fase Arterial Precoce', delaySec: 15, active: p.contrastInjected },
        { name: 'Fase Portal Venosa', delaySec: 65, active: p.contrastInjected },
        { name: 'Fase de Equilíbrio / Tardia', delaySec: 180, active: false }
      ],
      voicePrompt: p.voicePrompt || 'Atenção: respire fundo e prenda a respiração!',
      clinicalNotes: p.clinicalIndication || 'Configuração técnica especializada do exame de tomografia computadorizada.'
    };
  });

  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  // Load a Predefined Preset
  const handleLoadPreset = (key: string) => {
    const proto = SCAN_PROTOCOLS[key];
    if (!proto) return;
    playCanonAudioCue('click');
    setSelectedPresetKey(key);

    const kv = (proto.scanKv as any) || '120kV';
    setConfig(prev => ({
      ...prev,
      protocolCode: proto.protocolCode,
      protocolName: proto.protocolName,
      bodyRegion: proto.bodyRegion,
      patientPosition: proto.patientPosition,
      scanType: proto.scanType,
      scanKv: kv === '135kV' ? '135kV' : kv === '100kV' ? '100kV' : kv === '80kV' ? '80kV' : '120kV',
      collimationType: (proto.sliceCollimation as any) || '16 x 0.5mm',
      filterKernel: proto.filterKernel,
      contrastInjected: proto.contrastInjected,
      voicePrompt: proto.voicePrompt,
      clinicalNotes: proto.clinicalIndication,
      sureStartTriggerHu: proto.contrastProtocol?.triggerHu || 140,
      sureStartTriggerVessel: proto.contrastProtocol?.triggerVessel || 'Aorta'
    }));

    setSaveAlert(`Preset "${proto.protocolName.slice(0, 30)}..." carregado com sucesso!`);
    setTimeout(() => setSaveAlert(null), 3000);
  };

  // Real-time Physics & Dosimetry Calculations (ICRP-103 & ALARA Model)
  const technicalCalculations = useMemo(() => {
    // 1. Effective mAs calculation
    const effectiveMas = config.exposureMode === 'SUREExposure 3D (AEC)'
      ? Math.round((config.scanMa * config.rotationTimeSec) / config.pitchFactor * (10 / config.targetNoiseSd))
      : Math.round((config.scanMa * config.rotationTimeSec) / config.pitchFactor);

    // 2. Beam Collimation width (mm)
    const collimationWidthMm = config.collimationType.includes('160')
      ? 80
      : config.collimationType.includes('80')
      ? 40
      : config.collimationType.includes('64')
      ? 32
      : config.collimationType.includes('32')
      ? 16
      : 8;

    // 3. Table Feed speed per rotation (mm/rot) and per second (mm/s)
    const tableFeedMmRot = (collimationWidthMm * config.pitchFactor).toFixed(1);
    const tableSpeedMmSec = (parseFloat(tableFeedMmRot) / config.rotationTimeSec).toFixed(1);

    // 4. Estimated Scan Time (seconds)
    const scanTimeSec = (config.scanLengthMm / parseFloat(tableSpeedMmSec)).toFixed(1);

    // 5. Computed Tomography Dose Index Volume (CTDIvol in mGy)
    const kvpFactor = config.scanKv === '140kV' ? 1.45 : config.scanKv === '135kV' ? 1.35 : config.scanKv === '100kV' ? 0.68 : config.scanKv === '80kV' ? 0.42 : 1.0;
    const denoisingFactor = config.iterativeDenoising.includes('AiCE')
      ? 0.45
      : config.iterativeDenoising.includes('Strong')
      ? 0.55
      : config.iterativeDenoising.includes('Standard')
      ? 0.70
      : config.iterativeDenoising.includes('Mild')
      ? 0.85
      : 1.0;

    let baseCtdi = config.bodyRegion === 'HEAD' ? 45.0 : config.bodyRegion === 'CHEST' ? 12.0 : config.bodyRegion === 'ABDOMEN' ? 16.0 : 18.0;
    const calculatedCtdiVol = Math.max(1.5, Math.round((baseCtdi * kvpFactor * (effectiveMas / 220) * denoisingFactor) * 10) / 10);

    // 6. Dose Length Product (DLP in mGy*cm)
    const calculatedDlp = Math.round((calculatedCtdiVol * config.scanLengthMm) / 10);

    // 7. Effective Dose (E in mSv) using ICRP-103 region conversion factors (k)
    const kFactor = config.bodyRegion === 'HEAD'
      ? 0.0021
      : config.bodyRegion === 'CHEST'
      ? 0.014
      : config.bodyRegion === 'ABDOMEN'
      ? 0.015
      : config.bodyRegion === 'SPINE'
      ? 0.016
      : config.bodyRegion === 'CARDIAC'
      ? 0.026
      : config.bodyRegion === 'VASCULAR'
      ? 0.017
      : 0.001;

    const calculatedEffectiveDoseMsv = (calculatedDlp * kFactor).toFixed(2);

    // 8. Image Noise Index (SD in HU)
    const predictedNoiseHu = (
      (12.0 / Math.sqrt(effectiveMas / 100)) *
      (1 / kvpFactor) *
      (config.sliceThicknessMm < 1.0 ? 1.4 : config.sliceThicknessMm < 2.0 ? 1.15 : 0.85) *
      (config.filterKernel.includes('Bone') || config.filterKernel.includes('Sharp') || config.filterKernel.includes('FC30') ? 1.75 : 1.0) *
      denoisingFactor
    ).toFixed(1);

    // 9. Total Reconstructed Axial Slices Count
    const totalSlices = Math.round(config.scanLengthMm / config.reconIntervalMm);

    // 10. ALARA Safety Level
    let doseSafetyLevel: 'OPTIMIZED' | 'CAUTION' | 'HIGH_EXPOSURE' = 'OPTIMIZED';
    if (parseFloat(calculatedEffectiveDoseMsv) > (config.bodyRegion === 'HEAD' ? 3.0 : config.bodyRegion === 'CHEST' ? 8.0 : 15.0)) {
      doseSafetyLevel = 'HIGH_EXPOSURE';
    } else if (parseFloat(calculatedEffectiveDoseMsv) > (config.bodyRegion === 'HEAD' ? 2.2 : config.bodyRegion === 'CHEST' ? 5.5 : 10.0)) {
      doseSafetyLevel = 'CAUTION';
    }

    return {
      effectiveMas,
      collimationWidthMm,
      tableFeedMmRot,
      tableSpeedMmSec,
      scanTimeSec,
      calculatedCtdiVol,
      calculatedDlp,
      calculatedEffectiveDoseMsv,
      predictedNoiseHu,
      totalSlices,
      doseSafetyLevel
    };
  }, [config]);

  // Apply Changes to Live CT Scanner Engine
  const handleApplyToSystem = () => {
    playCanonAudioCue('success');

    const updatedProtocol: ActivionScanProtocol = {
      protocolCode: config.protocolCode,
      protocolName: config.protocolName,
      bodyRegion: config.bodyRegion,
      patientPosition: config.patientPosition,
      scoutType: 'Dual Scano (AP + LAT)',
      scoutLength: `${config.scanLengthMm + 60}mm`,
      scoutKv: '120kV',
      scoutMa: '30mA',
      scanType: config.scanType,
      scanKv: config.scanKv as any,
      scanMa: config.exposureMode === 'SUREExposure 3D (AEC)'
        ? `${config.scanMa}mA (SUREExposure 3D SD:${config.targetNoiseSd})`
        : `${config.scanMa}mAs (Manual)`,
      rotationTime: `${config.rotationTimeSec}s`,
      sliceCollimation: config.collimationType,
      pitch: `HP ${config.pitchFactor.toFixed(3)}`,
      tableSpeed: `${technicalCalculations.tableFeedMmRot} mm/rot`,
      scanRange: { start: `+${Math.round(config.scanLengthMm / 2)}mm`, end: `-${Math.round(config.scanLengthMm / 2)}mm` },
      gantryTilt: `${config.gantryTiltDeg}°`,
      fovSize: config.sFovSize as any,
      voicePrompt: config.voicePrompt,
      contrastInjected: config.contrastInjected,
      contrastProtocol: config.contrastInjected ? {
        volume: `${config.contrastVolumeMl} mL`,
        flow: `${config.injectionFlowMlS} mL/s`,
        delay: `${config.sureStartScanDelaySec}s`,
        triggerHu: config.sureStartTriggerHu,
        triggerVessel: config.sureStartTriggerVessel
      } : undefined,
      filterKernel: `${config.filterKernel} + ${config.iterativeDenoising}`,
      doseEstimate: {
        ctdiVol: technicalCalculations.calculatedCtdiVol,
        dlp: technicalCalculations.calculatedDlp
      },
      clinicalIndication: config.clinicalNotes
    };

    onApplyProtocol(updatedProtocol, selectedPresetKey);
    setSaveAlert(`Configurações de Protocolo [${config.protocolCode}] aplicadas com sucesso no console do tomógrafo!`);
    setTimeout(() => setSaveAlert(null), 4000);
  };

  // Direct Start Scan with configured parameters
  const handleStartScanDirectly = () => {
    handleApplyToSystem();
    const updatedProtocol: ActivionScanProtocol = {
      protocolCode: config.protocolCode,
      protocolName: config.protocolName,
      bodyRegion: config.bodyRegion,
      patientPosition: config.patientPosition,
      scoutType: 'Dual Scano (AP + LAT)',
      scoutLength: `${config.scanLengthMm + 60}mm`,
      scoutKv: '120kV',
      scoutMa: '30mA',
      scanType: config.scanType,
      scanKv: config.scanKv as any,
      scanMa: `${config.scanMa}mA (SUREExposure)`,
      rotationTime: `${config.rotationTimeSec}s`,
      sliceCollimation: config.collimationType,
      pitch: `HP ${config.pitchFactor.toFixed(3)}`,
      tableSpeed: `${technicalCalculations.tableFeedMmRot} mm/rot`,
      scanRange: { start: `+${Math.round(config.scanLengthMm / 2)}mm`, end: `-${Math.round(config.scanLengthMm / 2)}mm` },
      gantryTilt: `${config.gantryTiltDeg}°`,
      fovSize: config.sFovSize as any,
      voicePrompt: config.voicePrompt,
      contrastInjected: config.contrastInjected,
      contrastProtocol: config.contrastInjected ? {
        volume: `${config.contrastVolumeMl} mL`,
        flow: `${config.injectionFlowMlS} mL/s`,
        delay: `${config.sureStartScanDelaySec}s`,
        triggerHu: config.sureStartTriggerHu,
        triggerVessel: config.sureStartTriggerVessel
      } : undefined,
      filterKernel: config.filterKernel,
      doseEstimate: {
        ctdiVol: technicalCalculations.calculatedCtdiVol,
        dlp: technicalCalculations.calculatedDlp
      },
      clinicalIndication: config.clinicalNotes
    };
    onStartScanWithProtocol(updatedProtocol);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1b1f2b] text-gray-200 select-none font-sans overflow-hidden border-2 border-[#12151d] shadow-2xl">
      {/* ===================== CANON e-PROTOCOL HEADER ===================== */}
      <header className="h-12 bg-gradient-to-r from-[#252b3b] via-[#2f374a] to-[#252b3b] border-b-2 border-[#151924] px-3 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-[#12151e] border border-[#3e485e] text-cyan-300 font-black text-xs font-mono tracking-wider shadow-inner">
              e-PROTOCOL
            </span>
            <div className="leading-none font-mono">
              <div className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                <span>CANON AQUILION PROTOCOL SUITE</span>
                <span className="text-[10px] text-cyan-400 font-normal">| GESTÃO DE PARÂMETROS TÉCNICOS</span>
              </div>
              <div className="text-[9px] text-gray-400">CALIBRAÇÃO DE EXPOSIÇÃO, COLIMAÇÃO & DOSIMETRIA</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#434e68] font-mono text-[10px]">
            <span className="text-gray-400">Protocolo Ativo:</span>
            <strong className="text-cyan-300 font-bold bg-[#141822] px-2 py-0.5 rounded-sm border border-[#3e485e]">
              {config.protocolCode}
            </strong>
            <span className="text-gray-400">Região:</span>
            <span className="text-white font-bold">{config.bodyRegion}</span>
          </div>
        </div>

        {/* Live Dosimetry Summary Pills */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <div className="bg-[#141822] px-2.5 py-1 rounded-sm border border-[#3e485e] flex items-center gap-2 shadow-inner">
            <span className="text-gray-400">CTDIvol:</span>
            <strong className="text-amber-400 font-black text-xs">{technicalCalculations.calculatedCtdiVol} mGy</strong>
          </div>
          <div className="bg-[#141822] px-2.5 py-1 rounded-sm border border-[#3e485e] flex items-center gap-2 shadow-inner">
            <span className="text-gray-400">Dose Efetiva:</span>
            <strong className="text-cyan-300 font-black text-xs">{technicalCalculations.calculatedEffectiveDoseMsv} mSv</strong>
          </div>
          {/* Super Visible Close Button */}
          <button
            onClick={onClose}
            className="shrink-0 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white border-2 border-red-400 font-sans text-[11px] font-black flex items-center gap-1 shadow-[0_0_14px_rgba(239,68,68,0.7)] hover:shadow-[0_0_20px_rgba(239,68,68,0.9)] transition-all cursor-pointer z-40"
            title="Fechar / Voltar ao Visualizador"
          >
            <span className="material-symbols-outlined text-base font-bold leading-none">close</span>
            <span className="leading-none tracking-wider">FECHAR</span>
          </button>
        </div>
      </header>

      {/* Save Notification Banner */}
      {saveAlert && (
        <div className="bg-emerald-950 border-b border-emerald-500 text-emerald-200 px-4 py-1 text-xs font-mono font-bold flex items-center justify-between animate-fade-in z-30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{saveAlert}</span>
          </div>
          <button onClick={() => setSaveAlert(null)} className="text-emerald-400 hover:text-white text-xs">
            &times;
          </button>
        </div>
      )}

      {/* ===================== MAIN CONFIGURATION BODY (2-PANEL LAYOUT) ===================== */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2.5 bg-[#080a0f] overflow-hidden min-h-0">
        
        {/* ==================== LEFT PANEL: TEMPLATES & NAVIGATION (3.5 Cols) ==================== */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-2 bg-[#121620] border border-[#2d3748] rounded-xl p-3 overflow-y-auto font-mono text-[11px] shadow-inner">
          {/* Anatomical Region Filter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold">
              <span>FILTRO ANATÔMICO INSTITUCIONAL:</span>
              <span className="text-amber-400">Padrão ALARA</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'HEAD', label: 'Crânio' },
                { id: 'CHEST', label: 'Tórax' },
                { id: 'ABDOMEN', label: 'Abdômen' },
                { id: 'SPINE', label: 'Coluna' },
                { id: 'VASCULAR', label: 'Angio' },
                { id: 'CARDIAC', label: 'Cardio' },
                { id: 'EXTREMITIES', label: 'Membros' }
              ].map(reg => (
                <button
                  key={reg.id}
                  onClick={() => {
                    playCanonAudioCue('click');
                    setSelectedRegion(reg.id as any);
                  }}
                  className={`py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                    selectedRegion === reg.id
                      ? 'bg-[#b38600] text-slate-950 border-[#ffd043] shadow-sm font-black'
                      : 'bg-[#181e2b] text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Master Protocols List */}
          <div className="space-y-1.5 flex-1">
            <label className="text-gray-400 text-[10px] font-bold block">MODELOS DE PROTOCOLO CANON:</label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {Object.entries(SCAN_PROTOCOLS)
                .filter(([_, p]) => selectedRegion === 'ALL' || p.bodyRegion === selectedRegion)
                .map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => handleLoadPreset(key)}
                    className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedPresetKey === key
                        ? 'bg-amber-950/60 border-amber-400/80 text-amber-200 ring-1 ring-amber-400/50 shadow-sm'
                        : 'bg-[#181e2c] border-gray-800 text-gray-300 hover:bg-[#202738] hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-amber-400">{p.protocolCode}</span>
                      <span className="text-gray-400">{p.scanKv} • {p.sliceCollimation}</span>
                    </div>
                    <div className="font-bold text-[10px] text-white truncate mt-0.5">
                      {p.protocolName}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Quick Real-Time Physics Simulator Card */}
          <div className="bg-[#0a0d14] rounded-lg border border-gray-800 p-2.5 space-y-1.5">
            <div className="text-amber-400 font-bold text-[10px] flex items-center justify-between border-b border-gray-800 pb-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">science</span>
                <span>FÍSICA DE AQUISIÇÃO & SINAL/RUÍDO</span>
              </span>
              <span className="text-cyan-300">{technicalCalculations.tableSpeedMmSec} mm/s</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div>
                <span className="text-gray-400 block">mAs Efetivo:</span>
                <strong className="text-white text-xs">{technicalCalculations.effectiveMas} mAs</strong>
              </div>
              <div>
                <span className="text-gray-400 block">Ruído Previsto:</span>
                <strong className="text-cyan-300 text-xs">SD ± {technicalCalculations.predictedNoiseHu} HU</strong>
              </div>
              <div>
                <span className="text-gray-400 block">Avanço por Rotação:</span>
                <strong className="text-emerald-300">{technicalCalculations.tableFeedMmRot} mm/rot</strong>
              </div>
              <div>
                <span className="text-gray-400 block">Tempo Varredura:</span>
                <strong className="text-white">{technicalCalculations.scanTimeSec} segundos</strong>
              </div>
              <div>
                <span className="text-gray-400 block">Total de Cortes:</span>
                <strong className="text-amber-300">{technicalCalculations.totalSlices} cortes</strong>
              </div>
              <div>
                <span className="text-gray-400 block">Conformidade ALARA:</span>
                <strong className={
                  technicalCalculations.doseSafetyLevel === 'OPTIMIZED'
                    ? 'text-emerald-400'
                    : technicalCalculations.doseSafetyLevel === 'CAUTION'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }>
                  {technicalCalculations.doseSafetyLevel === 'OPTIMIZED' ? 'Excelente' : technicalCalculations.doseSafetyLevel === 'CAUTION' ? 'Atenção' : 'Dose Alta'}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons in Left Panel */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={handleApplyToSystem}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>APLICAR PROTOCOLO NO SIMULADOR</span>
            </button>

            <button
              onClick={handleStartScanDirectly}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-sm">radar</span>
              <span>CARREGAR & IR PARA SCANNER (SCAN)</span>
            </button>
          </div>
        </section>

        {/* ==================== RIGHT PANEL: DETAILED TABBED PARAMETER MATRIX (8.5 Cols) ==================== */}
        <section className="col-span-12 lg:col-span-8 flex flex-col bg-[#10141e] border border-[#2d3748] rounded-xl overflow-hidden font-mono text-[11px] shadow-inner">
          
          {/* Sub-Tabs Navigation Bar */}
          <div className="h-10 bg-[#161c28] border-b border-gray-800 px-3 flex items-center justify-between shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1">
              {[
                { id: 'exposure', label: '1. Tubo, kVp & mAs', icon: 'bolt' },
                { id: 'geometry', label: '2. Colimação & Espessura', icon: 'layers' },
                { id: 'reconstruction', label: '3. Filtros & AIDR 3D', icon: 'blur_on' },
                { id: 'contrast', label: '4. Contraste & SUREStart', icon: 'vaccines' },
                { id: 'dosimetry', label: '5. Dosimetria ICRP', icon: 'speed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playCanonAudioCue('click');
                    setActiveConfigTab(tab.id as any);
                  }}
                  className={`px-3 py-1 rounded-t-lg text-[10px] font-bold flex items-center gap-1.5 border-t border-x transition-all cursor-pointer ${
                    activeConfigTab === tab.id
                      ? 'bg-[#10141e] text-amber-300 border-[#4a5568] border-b-transparent shadow-sm'
                      : 'bg-transparent text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="text-[9px] text-gray-400 hidden sm:block">
              Canon Activion/Aquilion Architecture
            </div>
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* ================= TAB 1: RADIOLOGICAL EXPOSURE (kVp, mAs, AEC) ================= */}
            {activeConfigTab === 'exposure' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">electric_bolt</span>
                      <span>TENSÃO DO TUBO DE RAIOS-X (kVp)</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                      Penetração & Contraste
                    </span>
                  </div>

                  <p className="text-gray-300 text-[10px]">
                    O <strong>kVp</strong> determina a energia média do feixe e o poder de penetração. Menor kVp (80-100) potencializa o realce do iodo (efeito fotoelétrico perto do K-edge de 33.2 keV). Maior kVp (120-135) reduz ruído e artefatos em pacientes hiperestênicos.
                  </p>

                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {(['80kV', '100kV', '120kV', '135kV', '140kV'] as const).map(kv => (
                      <button
                        key={kv}
                        onClick={() => {
                          playCanonAudioCue('click');
                          setConfig(prev => ({ ...prev, scanKv: kv }));
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          config.scanKv === kv
                            ? 'bg-amber-950/80 border-amber-400 text-amber-200 font-black shadow-md ring-2 ring-amber-400/40'
                            : 'bg-[#1a202c] border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-xs font-black">{kv}</div>
                        <div className="text-[8px] text-gray-400 mt-0.5">
                          {kv === '80kV' ? 'Pediátrico / Angio' : kv === '100kV' ? 'Baixa Dose' : kv === '120kV' ? 'Padrão Adulto' : 'Hiperestênico'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tube Current & Exposure Control */}
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-cyan-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">tune</span>
                      <span>CORRENTE DO TUBO & CONTROLE DE DOSE (mA / mAs)</span>
                    </span>
                    <div className="flex gap-1">
                      {(['SUREExposure 3D (AEC)', 'Manual mAs'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            playCanonAudioCue('click');
                            setConfig(prev => ({ ...prev, exposureMode: mode }));
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                            config.exposureMode === mode
                              ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                              : 'bg-[#1e2536] text-gray-400 border-gray-700'
                          }`}
                        >
                          {mode === 'SUREExposure 3D (AEC)' ? 'SUREExposure 3D' : 'Manual'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.exposureMode === 'SUREExposure 3D (AEC)' ? (
                    <div className="space-y-3 bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/30">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-cyan-300 font-bold">Índice de Ruído Alvo (Noise Standard Deviation - SD):</span>
                        <strong className="text-amber-300 text-sm font-black">SD {config.targetNoiseSd.toFixed(1)} HU</strong>
                      </div>
                      <input
                        type="range"
                        min="7.5"
                        max="17.5"
                        step="0.5"
                        value={config.targetNoiseSd}
                        onChange={e => setConfig(prev => ({ ...prev, targetNoiseSd: Number(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                      />
                      <div className="flex justify-between text-[8px] text-gray-400">
                        <span>SD 7.5 (Superfino / Crânio)</span>
                        <span>SD 10.0 (Rotina Padrão)</span>
                        <span>SD 12.5 (Tórax)</span>
                        <span>SD 17.5 (Ultrabaixa Dose / Screening)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[#111622] p-3 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-300">Corrente Fixa Manual (mA):</span>
                        <strong className="text-cyan-300 text-sm font-black">{config.scanMa} mA ({technicalCalculations.effectiveMas} mAs Efetivo)</strong>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="600"
                        step="10"
                        value={config.scanMa}
                        onChange={e => setConfig(prev => ({ ...prev, scanMa: Number(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                      />
                    </div>
                  )}

                  {/* Rotation Speed & Scan Type */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-gray-400 text-[9px] block mb-1">Tempo de Rotação do Gantry:</label>
                      <select
                        value={config.rotationTimeSec}
                        onChange={e => setConfig(prev => ({ ...prev, rotationTimeSec: Number(e.target.value) }))}
                        className="w-full bg-[#1e2536] border border-gray-700 rounded-lg px-2 py-1.5 text-white font-bold text-xs cursor-pointer"
                      >
                        <option value={0.275}>0.275s (Cardíaco / Ultra-Rápido)</option>
                        <option value={0.35}>0.35s (Coronárias / Pediatria)</option>
                        <option value={0.50}>0.50s (Padrão Helical Canon)</option>
                        <option value={0.75}>0.75s (Alta Resolução Óssea)</option>
                        <option value={1.00}>1.00s (Crânio Fino / Baixo Ruído)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 text-[9px] block mb-1">Modo de Varredura:</label>
                      <select
                        value={config.scanType}
                        onChange={e => setConfig(prev => ({ ...prev, scanType: e.target.value as any }))}
                        className="w-full bg-[#1e2536] border border-gray-700 rounded-lg px-2 py-1.5 text-white font-bold text-xs cursor-pointer"
                      >
                        <option value="Helical">Helicoidal Contínuo (Helical)</option>
                        <option value="Sequential">Axial Passo a Passo (Step & Shoot)</option>
                        <option value="Dynamic">Dinâmico / Perfusão (Volume Dynamic)</option>
                        <option value="ECG-Gated Helical">Sincronizado ECG (Cardio Helical)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: GEOMETRY & COLLIMATION (SLICE THICKNESS & PITCH) ================= */}
            {activeConfigTab === 'geometry' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">straighten</span>
                      <span>COLIMAÇÃO DE DETECTORES & ESPESSURA DE CORTE</span>
                    </span>
                    <span className="text-[9px] text-cyan-300 font-bold">
                      {technicalCalculations.collimationWidthMm} mm Feixe Total
                    </span>
                  </div>

                  {/* Detector Collimation */}
                  <div>
                    <label className="text-gray-400 text-[9px] block mb-1">Configuração da Fileira de Detectores:</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['16 x 0.5mm', '32 x 0.5mm', '64 x 0.5mm', '80 x 0.5mm', '160 x 0.5mm'] as const).map(col => (
                        <button
                          key={col}
                          onClick={() => {
                            playCanonAudioCue('click');
                            setConfig(prev => ({ ...prev, collimationType: col }));
                          }}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            config.collimationType === col
                              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 font-black shadow-md ring-2 ring-emerald-400/40'
                              : 'bg-[#1a202c] border-gray-700 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold">{col}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slice Thickness Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-emerald-300 font-bold">Espessura de Corte Nominal:</span>
                        <strong className="text-white text-xs">{config.sliceThicknessMm.toFixed(2)} mm</strong>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[0.5, 1.0, 2.0, 5.0].map(th => (
                          <button
                            key={th}
                            onClick={() => {
                              playCanonAudioCue('click');
                              setConfig(prev => ({ ...prev, sliceThicknessMm: th, reconIntervalMm: th }));
                            }}
                            className={`py-1 text-[9px] font-bold rounded border cursor-pointer ${
                              config.sliceThicknessMm === th
                                ? 'bg-emerald-600 text-white border-emerald-300'
                                : 'bg-[#1e2536] text-gray-300 border-gray-700'
                            }`}
                          >
                            {th}mm
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-cyan-300 font-bold">Intervalo de Reconstrução:</span>
                        <strong className="text-white text-xs">{config.reconIntervalMm.toFixed(2)} mm</strong>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: 'Contíguo', val: config.sliceThicknessMm },
                          { label: '50% Overlap', val: config.sliceThicknessMm * 0.5 },
                          { label: 'Espaçado', val: config.sliceThicknessMm * 1.5 }
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              playCanonAudioCue('click');
                              setConfig(prev => ({ ...prev, reconIntervalMm: Math.round(item.val * 100) / 100 }));
                            }}
                            className={`py-1 text-[8px] font-bold rounded border cursor-pointer ${
                              config.reconIntervalMm === Math.round(item.val * 100) / 100
                                ? 'bg-cyan-600 text-white border-cyan-300'
                                : 'bg-[#1e2536] text-gray-300 border-gray-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Helical Pitch & Scan Length */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-300 font-bold">Fator de Pitch Helicoidal:</span>
                        <strong className="text-amber-300">{config.pitchFactor.toFixed(3)}</strong>
                      </div>
                      <input
                        type="range"
                        min="0.625"
                        max="1.500"
                        step="0.062"
                        value={config.pitchFactor}
                        onChange={e => setConfig(prev => ({ ...prev, pitchFactor: Number(e.target.value) }))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                      />
                      <div className="flex justify-between text-[8px] text-gray-400">
                        <span>0.625 (Sobreposição/Dose Alta)</span>
                        <span>0.813 (Canon Padrão)</span>
                        <span>1.500 (Rápido/Baixa Dose)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-300 font-bold">Comprimento de Varredura (Z):</span>
                        <strong className="text-cyan-300">{config.scanLengthMm} mm ({technicalCalculations.totalSlices} cortes)</strong>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="800"
                        step="10"
                        value={config.scanLengthMm}
                        onChange={e => setConfig(prev => ({ ...prev, scanLengthMm: Number(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Fields of View (sFOV & dFOV) */}
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-400 text-[9px] block mb-1">Scan FOV (sFOV):</label>
                    <select
                      value={config.sFovSize}
                      onChange={e => setConfig(prev => ({ ...prev, sFovSize: e.target.value as any }))}
                      className="w-full bg-[#1e2536] border border-gray-700 rounded px-2 py-1 text-white font-bold text-xs"
                    >
                      <option value="Small (240mm)">Small (240mm - Crânio)</option>
                      <option value="Medium (320mm)">Medium (320mm - Tórax)</option>
                      <option value="Large (400mm)">Large (400mm - Abdômen)</option>
                      <option value="Extra-Large (500mm)">Extra-Large (500mm - Obesos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-[9px] block mb-1">Display FOV (dFOV):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={120}
                        max={500}
                        value={config.dFovMm}
                        onChange={e => setConfig(prev => ({ ...prev, dFovMm: Number(e.target.value) }))}
                        className="w-full bg-[#1e2536] border border-gray-700 rounded px-2 py-1 text-cyan-300 font-bold text-xs font-mono"
                      />
                      <span className="text-gray-400 text-[9px]">mm</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-[9px] block mb-1">Gantry Tilt (°):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={-30}
                        max={30}
                        value={config.gantryTiltDeg}
                        onChange={e => setConfig(prev => ({ ...prev, gantryTiltDeg: Number(e.target.value) }))}
                        className="w-full bg-[#1e2536] border border-gray-700 rounded px-2 py-1 text-emerald-300 font-bold text-xs font-mono"
                      />
                      <span className="text-gray-400 text-[9px]">graus</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 3: CONVOLUTION KERNELS & AIDR 3D DENOISING ================= */}
            {activeConfigTab === 'reconstruction' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-purple-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">filter_vintage</span>
                      <span>FILTROS DE CONVOLUÇÃO (KERNELS DE RECONSTRUÇÃO CANON)</span>
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">Filtros Matemáticos FBP</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { code: 'FC01', name: 'FC01 (Standard Soft)', desc: 'Partes Moles Geral, Baixo Ruído' },
                      { code: 'FC03', name: 'FC03 (Abdomen Smooth)', desc: 'Fígado e Pâncreas' },
                      { code: 'FC07', name: 'FC07 (Lung Sharp / HRCT)', desc: 'Parênquima Pulmonar e Interstício' },
                      { code: 'FC13', name: 'FC13 (Brain Soft)', desc: 'Encéfalo / Subst. Branca e Cinzenta' },
                      { code: 'FC30', name: 'FC30 (Bone High-Res)', desc: 'Cortical Óssea e Fraturas' },
                      { code: 'FC52', name: 'FC52 (Inner Ear HRCT)', desc: 'Mastóide e Ouvido Médio' },
                      { code: 'FC81', name: 'FC81 (Angio High Detail)', desc: 'Realce de Paredes Vasculares' }
                    ].map(kernel => (
                      <button
                        key={kernel.code}
                        onClick={() => {
                          playCanonAudioCue('click');
                          setConfig(prev => ({ ...prev, filterKernel: kernel.name }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          config.filterKernel.includes(kernel.code)
                            ? 'bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/50 shadow-md font-bold'
                            : 'bg-[#1a202c] border-gray-800 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-purple-300 font-bold text-[10px]">{kernel.code}</div>
                        <div className="text-white text-[10px] truncate">{kernel.name}</div>
                        <div className="text-[8px] text-gray-400 mt-0.5 truncate">{kernel.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Iterative Denoising (AIDR 3D & AiCE Deep Learning) */}
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                      <span>ALGORITMO DE REDUÇÃO DE DOSE ITERATIVO & IA</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Redução de Dose até 75%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'FBP (Standard Back-Projection)', name: 'FBP Tradicional (Filtered Back-Projection)', red: '0% Redução', desc: 'Reconstrução padrão analítica sem denoising.' },
                      { id: 'AIDR 3D Mild', name: 'AIDR 3D Mild', red: '30% Redução', desc: 'Filtro iterativo suave, preserva textura nativa.' },
                      { id: 'AIDR 3D Standard', name: 'AIDR 3D Standard (Padrão Ouro)', red: '50% Redução', desc: 'Equilíbrio perfeito de ruído e resolução espacial.' },
                      { id: 'AIDR 3D Strong', name: 'AIDR 3D Strong (Ultra-Low Dose)', red: '65% Redução', desc: 'Máxima redução de ruído para protocolos pediátricos.' },
                      { id: 'AiCE Deep Learning Reconstruction', name: 'AiCE Deep Learning Reconstruction', red: '75% Redução', desc: 'Rede neural convolucional treinada com Ultra-High Res CT.' }
                    ].map(alg => (
                      <button
                        key={alg.id}
                        onClick={() => {
                          playCanonAudioCue('click');
                          setConfig(prev => ({ ...prev, iterativeDenoising: alg.id as any }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          config.iterativeDenoising === alg.id
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50 shadow-md font-bold'
                            : 'bg-[#1a202c] border-gray-800 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-emerald-300 font-bold">{alg.name}</span>
                          <span className="px-1 bg-emerald-900 text-emerald-200 rounded text-[8px]">{alg.red}</span>
                        </div>
                        <div className="text-[8px] text-gray-400 mt-1 leading-tight">{alg.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: CONTRAST MEDIA & SURESTART BOLUS TRACKING ================= */}
            {activeConfigTab === 'contrast' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#151a26] p-3 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-cyan-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">vaccines</span>
                      <span>PROTOCOLO DE INJEÇÃO DE MEIO DE CONTRASTE IODADO</span>
                    </span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, contrastInjected: !prev.contrastInjected }))}
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                        config.contrastInjected
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-[#1e2536] text-gray-400 border-gray-700'
                      }`}
                    >
                      {config.contrastInjected ? 'CONTRASTE ATIVADO' : 'EXAME NATIVO (SEM CONTRASTE)'}
                    </button>
                  </div>

                  {config.contrastInjected && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-gray-400 text-[9px] block">Volume de Iodo (mL):</label>
                          <input
                            type="number"
                            min={20}
                            max={160}
                            step={5}
                            value={config.contrastVolumeMl}
                            onChange={e => setConfig(prev => ({ ...prev, contrastVolumeMl: Number(e.target.value) }))}
                            className="w-full bg-[#1e2536] border border-gray-700 rounded px-2 py-1 text-cyan-300 font-bold text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-gray-400 text-[9px] block">Fluxo da Injetora (mL/s):</label>
                          <input
                            type="number"
                            min={1.0}
                            max={6.0}
                            step={0.5}
                            value={config.injectionFlowMlS}
                            onChange={e => setConfig(prev => ({ ...prev, injectionFlowMlS: Number(e.target.value) }))}
                            className="w-full bg-[#1e2536] border border-gray-700 rounded px-2 py-1 text-cyan-300 font-bold text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-gray-400 text-[9px] block">Flush Soro Fisiológico (mL):</label>
                          <input
                            type="number"
                            min={10}
                            max={60}
                            step={5}
                            value={config.salineChaserMl}
                            onChange={e => setConfig(prev => ({ ...prev, salineChaserMl: Number(e.target.value) }))}
                            className="w-full bg-[#1e2536] border border-gray-700 rounded px-2 py-1 text-emerald-300 font-bold text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* SUREStart Bolus Tracking Setup */}
                      <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/40 space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold border-b border-cyan-500/30 pb-1">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">radar</span>
                            <span>SUREStart (BOLUS TRACKING AUTOMÁTICO)</span>
                          </span>
                          <span className="text-amber-300 font-bold">{config.sureStartTriggerHu} HU Limiar</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-[10px]">
                          <div>
                            <label className="text-gray-400 text-[9px] block mb-1">Vaso Monitorado (ROI):</label>
                            <select
                              value={config.sureStartTriggerVessel}
                              onChange={e => setConfig(prev => ({ ...prev, sureStartTriggerVessel: e.target.value }))}
                              className="w-full bg-[#18202e] border border-cyan-500/50 rounded px-2 py-1 text-white text-[10px]"
                            >
                              <option value="Aorta Torácica Ascendente">Aorta Torácica Ascendente</option>
                              <option value="Aorta Torácica Descendente">Aorta Torácica Descendente</option>
                              <option value="Tronco da Artéria Pulmonar">Tronco da Artéria Pulmonar (TEP)</option>
                              <option value="Bulbo Carotídeo / Artéria Carótida">Bulbo Carotídeo (Neuro)</option>
                              <option value="Aorta Abdominal Supracelíaca">Aorta Abdominal Supracelíaca</option>
                              <option value="Artéria Femoral Comum">Artéria Femoral Comum</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-gray-400 text-[9px] block mb-1">Limiar de Disparo (Trigger HU):</label>
                            <input
                              type="number"
                              min={80}
                              max={250}
                              step={10}
                              value={config.sureStartTriggerHu}
                              onChange={e => setConfig(prev => ({ ...prev, sureStartTriggerHu: Number(e.target.value) }))}
                              className="w-full bg-[#18202e] border border-cyan-500/50 rounded px-2 py-1 text-amber-300 font-bold text-[10px]"
                            />
                          </div>

                          <div>
                            <label className="text-gray-400 text-[9px] block mb-1">Scan Delay Pós-Gatilho (s):</label>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={config.sureStartScanDelaySec}
                              onChange={e => setConfig(prev => ({ ...prev, sureStartScanDelaySec: Number(e.target.value) }))}
                              className="w-full bg-[#18202e] border border-cyan-500/50 rounded px-2 py-1 text-white font-bold text-[10px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 5: ICRP DOSIMETRY CALCULATOR & DRL COMPLIANCE ================= */}
            {activeConfigTab === 'dosimetry' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#151a26] p-4 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-amber-400 font-bold text-xs border-b border-gray-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">speed</span>
                      <span>RELATÓRIO DOSIMÉTRICO RADIOLÓGICO (ICRP-103 / EURATOM)</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                      Princípio ALARA
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-black/60 border border-gray-800 space-y-1">
                      <div className="text-gray-400 text-[9px]">CTDIvol (Índice Volumétrico):</div>
                      <div className="text-2xl font-black text-amber-400 font-mono">
                        {technicalCalculations.calculatedCtdiVol} <span className="text-xs font-normal">mGy</span>
                      </div>
                      <div className="text-[8px] text-gray-500">Normal DRL: 50mGy (Crânio) / 15mGy (Tórax)</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-gray-800 space-y-1">
                      <div className="text-gray-400 text-[9px]">DLP Total (Dose-Comprimento):</div>
                      <div className="text-2xl font-black text-emerald-400 font-mono">
                        {technicalCalculations.calculatedDlp} <span className="text-xs font-normal">mGy·cm</span>
                      </div>
                      <div className="text-[8px] text-gray-500">Varredura de {config.scanLengthMm} mm</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-gray-800 space-y-1">
                      <div className="text-gray-400 text-[9px]">Dose Efetiva no Paciente:</div>
                      <div className="text-2xl font-black text-cyan-300 font-mono">
                        {technicalCalculations.calculatedEffectiveDoseMsv} <span className="text-xs font-normal">mSv</span>
                      </div>
                      <div className="text-[8px] text-gray-500">Fator k = {(technicalCalculations.calculatedDlp > 0 ? (parseFloat(technicalCalculations.calculatedEffectiveDoseMsv) / technicalCalculations.calculatedDlp).toFixed(4) : '0.0021')} mSv/(mGy·cm)</div>
                    </div>
                  </div>

                  {/* Safety & Pedagogical ALARA Guide */}
                  <div className="p-3 rounded-xl bg-[#0d121c] border border-gray-800 text-[10px] space-y-1 text-gray-300">
                    <strong className="text-white block">💡 Dica Docente Biorad de Otimização de Dose:</strong>
                    <p>
                      Para reduzir a dose em até <strong>50%</strong> mantendo o diagnóstico seguro em pacientes jovens ou acompanhamentos oncológicos:
                      utilize <strong>100 kVp</strong> em vez de 120 kVp, ajuste o <strong>AIDR 3D para Strong</strong> ou <strong>AiCE Deep Learning</strong> e aumente o <strong>Pitch</strong> para <strong>1.25</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Bar inside Right Panel */}
          <footer className="h-12 bg-[#161c28] border-t border-gray-800 px-4 flex items-center justify-between shrink-0 font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status do Protocolo:</span>
              <span className="text-emerald-400 font-bold">VERIFICADO & COMPATÍVEL</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  handleLoadPreset(selectedPresetKey);
                }}
                className="px-3 py-1 bg-[#202738] hover:bg-[#2c364c] text-gray-300 font-bold rounded border border-gray-700 cursor-pointer"
              >
                Restaurar Padrão
              </button>

              <button
                onClick={handleApplyToSystem}
                className="px-4 py-1.5 bg-[#b38600] hover:bg-[#cca300] text-slate-950 font-black rounded-lg border border-[#ffd043] cursor-pointer shadow-md"
              >
                Salvar & Aplicar
              </button>
            </div>
          </footer>
        </section>

      </div>
    </div>
  );
};
