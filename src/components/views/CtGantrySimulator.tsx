import React, { useState, useMemo, useEffect } from 'react';
import { playCanonAudioCue } from '../../utils/dicomEngine';

export interface CtGantrySimulatorProps {
  isScanning: boolean;
  rotationSpeedSec: string; // e.g. '0.275s', '0.35s', '0.5s', '0.75s', '1.0s'
  tablePositionZ: number; // in mm
  tableHeightMm?: number; // in mm
  gantryTiltAngle?: number; // -30 to +30 deg
  isLaserOn?: boolean;
  exposureProgressPct?: number;
  pitch?: number;
  kvp?: string;
  ma?: number;
  currentSlice?: number;
  totalSlices?: number;
  onManualMoveTable?: (direction: 'IN' | 'OUT' | 'UP' | 'DOWN', amount: number) => void;
  onSetTilt?: (angle: number) => void;
  onToggleLaser?: () => void;
  className?: string;
}

export const CtGantrySimulator: React.FC<CtGantrySimulatorProps> = ({
  isScanning,
  rotationSpeedSec,
  tablePositionZ,
  tableHeightMm = 820,
  gantryTiltAngle = 0,
  isLaserOn = true,
  exposureProgressPct = 0,
  pitch = 0.813,
  kvp = '120kV',
  ma = 250,
  currentSlice = 0,
  totalSlices = 32,
  onManualMoveTable,
  onSetTilt,
  onToggleLaser,
  className = ''
}) => {
  // Visual Mode: Front Bore, Side Profile with Table, or Dual
  const [viewAngle, setViewAngle] = useState<'FRONT' | 'SIDE' | 'DUAL'>('DUAL');
  const [showRotorCover, setShowRotorCover] = useState<boolean>(false); // Transparency toggle to see inner tube/detector
  const [isTestSpinning, setIsTestSpinning] = useState<boolean>(false);

  // Parse numeric rotation time (seconds per 360° rotation)
  const rotationTimeNumber = useMemo(() => {
    const val = parseFloat(rotationSpeedSec.replace('s', ''));
    return isNaN(val) || val <= 0 ? 0.5 : val;
  }, [rotationSpeedSec]);

  // Canon Calculation: RPM = 60 / rotationTime
  const calculatedRpm = useMemo(() => {
    return Math.round((60 / rotationTimeNumber) * 10) / 10;
  }, [rotationTimeNumber]);

  // Angular speed in degrees per second
  const degPerSec = useMemo(() => {
    return Math.round(360 / rotationTimeNumber);
  }, [rotationTimeNumber]);

  // Centrifugal force at outer rotor ring (r = 0.52m) in G
  const centrifugalGForce = useMemo(() => {
    const omega = (2 * Math.PI) / rotationTimeNumber;
    const r = 0.52; // 52cm rotor radius
    const g = (omega * omega * r) / 9.81;
    return g.toFixed(1);
  }, [rotationTimeNumber]);

  // Table translation speed during helical scan (mm/s)
  const tableSpeedMmSec = useMemo(() => {
    const beamCollimationMm = 80 * 0.5; // 40mm beam width
    const feedPerRot = beamCollimationMm * pitch;
    return (feedPerRot / rotationTimeNumber).toFixed(1);
  }, [pitch, rotationTimeNumber]);

  // Effective Active State
  const activeSpin = isScanning || isTestSpinning;

  // CSS spin duration variable
  const spinDurationCss = `${rotationTimeNumber}s`;

  // Realistic Rotor Status string
  const rotorStatusText = useMemo(() => {
    if (!activeSpin) return 'STANDBY • 0.0 RPM (ROTOR ESTACIONÁRIO)';
    if (isScanning) return `EMISSÃO RAIO-X • ${calculatedRpm} RPM (SLIP-RING ATIVO)`;
    return `TESTE DE ROTAÇÃO • ${calculatedRpm} RPM (ALTA VELOCIDADE)`;
  }, [activeSpin, isScanning, calculatedRpm]);

  return (
    <div className={`flex flex-col bg-[#090c12] border border-[#2c3648] rounded-xl overflow-hidden shadow-2xl font-mono text-gray-200 select-none ${className}`}>
      {/* ===================== TOP TELEMETRY & VIEW CONTROLS HEADER ===================== */}
      <div className="h-10 bg-[#131926] border-b border-[#252f42] px-3 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">motion_mode</span>
            <span>GANTRY & MESA CANON AQUILION (SIMULADOR FÍSICO)</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 font-bold">
            Slip-Ring 78cm Bore
          </span>
        </div>

        {/* View Mode & Cover Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRotorCover(prev => !prev)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
              showRotorCover
                ? 'bg-purple-900/60 text-purple-200 border-purple-400'
                : 'bg-[#1a2233] text-gray-400 border-gray-700 hover:text-white'
            }`}
            title="Alternar carcaça translúcida para ver o tubo de Raio-X e os detectores girando"
          >
            <span className="material-symbols-outlined text-xs">visibility</span>
            <span>{showRotorCover ? 'Interior Aberto' : 'Carcaça Fechada'}</span>
          </button>

          <div className="flex rounded border border-gray-700 overflow-hidden bg-[#182030]">
            {(['DUAL', 'FRONT', 'SIDE'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  playCanonAudioCue('click');
                  setViewAngle(mode);
                }}
                className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  viewAngle === mode
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'DUAL' ? 'Bore + Mesa' : mode === 'FRONT' ? 'Bore Frontal' : 'Perfil Lateral'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== ROTATION RPM & KINEMATICS HUD BANNER ===================== */}
      <div className="bg-[#0e131d] border-b border-[#20293a] px-3 py-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px] items-center">
        {/* Metric 1: Tachometer RPM */}
        <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-cyan-950/40">
            <span
              className={`material-symbols-outlined text-base text-cyan-400 ${
                activeSpin ? 'animate-spin' : ''
              }`}
              style={{
                animationDuration: spinDurationCss
              }}
            >
              sync
            </span>
          </div>
          <div>
            <div className="text-[9px] text-gray-400 leading-tight">VELOCIDADE ROTOR:</div>
            <div className="text-sm font-black text-cyan-300 leading-tight">
              {activeSpin ? `${calculatedRpm} RPM` : '0.0 RPM'}
            </div>
          </div>
        </div>

        {/* Metric 2: 360° Rotation Time */}
        <div className="bg-black/60 p-1.5 rounded-lg border border-amber-500/30">
          <div className="text-[9px] text-gray-400 leading-tight">TEMPO 360°:</div>
          <div className="text-xs font-black text-amber-300 leading-tight">
            {rotationTimeNumber.toFixed(3)} s/rot
          </div>
          <div className="text-[8px] text-gray-500">{degPerSec}°/s</div>
        </div>

        {/* Metric 3: G-Force */}
        <div className="bg-black/60 p-1.5 rounded-lg border border-red-500/30">
          <div className="text-[9px] text-gray-400 leading-tight">FORÇA G (ROTOR):</div>
          <div className="text-xs font-black text-red-400 leading-tight">
            {activeSpin ? `${centrifugalGForce} G` : '1.0 G'}
          </div>
          <div className="text-[8px] text-gray-500">Mancal Magnético</div>
        </div>

        {/* Metric 4: Table Translation Speed */}
        <div className="bg-black/60 p-1.5 rounded-lg border border-emerald-500/30">
          <div className="text-[9px] text-gray-400 leading-tight">AVANÇO DA MESA:</div>
          <div className="text-xs font-black text-emerald-300 leading-tight">
            {activeSpin ? `${tableSpeedMmSec} mm/s` : '0.0 mm/s'}
          </div>
          <div className="text-[8px] text-emerald-500">Pitch: {pitch}</div>
        </div>

        {/* Metric 5: Table Z Position */}
        <div className="bg-black/60 p-1.5 rounded-lg border border-blue-500/30">
          <div className="text-[9px] text-gray-400 leading-tight">POSIÇÃO Z MESA:</div>
          <div className="text-xs font-black text-blue-300 leading-tight">
            {tablePositionZ.toFixed(1)} mm
          </div>
          <div className="text-[8px] text-gray-500">H: {tableHeightMm} mm</div>
        </div>

        {/* Metric 6: Gantry Tilt Angle */}
        <div className="bg-black/60 p-1.5 rounded-lg border border-purple-500/30">
          <div className="text-[9px] text-gray-400 leading-tight">TILT GANTRY:</div>
          <div className="text-xs font-black text-purple-300 leading-tight">
            {gantryTiltAngle > 0 ? `+${gantryTiltAngle}°` : `${gantryTiltAngle}°`}
          </div>
          <div className="text-[8px] text-purple-400">Ângulo Físico</div>
        </div>
      </div>

      {/* ===================== MAIN 3D / 2D KINEMATICS ANIMATION CANVAS ===================== */}
      <div className="flex-1 min-h-[300px] p-3 flex flex-col md:flex-row items-center justify-around gap-4 bg-gradient-to-b from-[#07090e] via-[#0b0e14] to-[#080b10] relative overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* ===================== 1. FRONT APERTURE BORE VIEW ===================== */}
        {(viewAngle === 'DUAL' || viewAngle === 'FRONT') && (
          <div className="relative flex flex-col items-center justify-center p-2">
            <span className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-cyan-400">donut_large</span>
              <span>VISTA FRONTAL DO BORE (780mm)</span>
            </span>

            {/* Physical Gantry Outer Housing */}
            <div
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-[44px] bg-gradient-to-b from-[#e5e9f0] via-[#c4cbd8] to-[#9aa3b5] p-3 shadow-[0_15px_40px_rgba(0,0,0,0.8)] border-4 border-[#7b8699] flex items-center justify-center transition-transform duration-300 ${
                gantryTiltAngle !== 0 ? `rotate-[${gantryTiltAngle}deg]` : ''
              }`}
              style={{
                transform: `rotate(${gantryTiltAngle}deg)`
              }}
            >
              {/* Canon Brand Emblem on Housing Top */}
              <div className="absolute top-2 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black tracking-widest text-[#d91424] font-sans drop-shadow-sm">
                  CANON
                </span>
                <span className="text-[7px] font-bold tracking-tighter text-slate-700">
                  Aquilion PRIME SP
                </span>
              </div>

              {/* SUREStatus Illuminated Halo Ring (Pulsing Cyan / Orange on Exposure) */}
              <div
                className={`absolute inset-4 rounded-full border-4 transition-all duration-300 pointer-events-none ${
                  isScanning
                    ? 'border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.9)] animate-pulse'
                    : activeSpin
                    ? 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.8)]'
                    : 'border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                }`}
              />

              {/* Gantry Inner Bore Tunnel */}
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-[#05070a] border-8 border-[#2d3442] flex items-center justify-center overflow-hidden shadow-inner">
                {/* Degree markings on stator ring */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                    <div
                      key={deg}
                      className="absolute inset-0 flex justify-center"
                      style={{ transform: `rotate(${deg}deg)` }}
                    >
                      <span className="w-0.5 h-2 bg-gray-400 mt-1" />
                    </div>
                  ))}
                </div>

                {/* ================= ROTATING SLIP-RING ROTOR ================= */}
                <div
                  className={`absolute inset-1 rounded-full flex items-center justify-center ${
                    activeSpin ? 'animate-gantry-spin' : ''
                  }`}
                  style={
                    activeSpin
                      ? ({ '--spin-duration': spinDurationCss } as React.CSSProperties)
                      : {}
                  }
                >
                  {/* Rotating X-Ray Tube Assembly (Top position at 0 deg) */}
                  <div className="absolute top-1 flex flex-col items-center">
                    <div className="w-12 h-7 bg-gradient-to-b from-[#2e3748] to-[#1a202c] border border-amber-400/80 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center justify-center relative">
                      <span className="text-[7px] font-black text-amber-300">TUBO RX</span>
                      {/* Anode Target Indicator */}
                      <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    </div>
                    {/* Beam Collimator Nozzle */}
                    <div className="w-6 h-2 bg-gray-700 border-x border-b border-gray-500 rounded-b" />
                  </div>

                  {/* Dynamic X-Ray Fan Beam Projection across the Bore */}
                  {isScanning && (
                    <div className="absolute inset-x-8 top-8 bottom-8 pointer-events-none opacity-60 flex justify-center items-center">
                      <div className="w-full h-full bg-gradient-to-b from-amber-400/50 via-yellow-300/20 to-cyan-400/50 clip-path-fan-beam animate-xray-pulse" />
                    </div>
                  )}

                  {/* Opposite Curved Detector Array (160 slices at 180 deg) */}
                  <div className="absolute bottom-1 flex flex-col items-center">
                    <div className="w-20 h-5 bg-gradient-to-t from-cyan-900 to-cyan-700 border-2 border-cyan-400 rounded-t-xl shadow-[0_0_12px_rgba(6,182,212,0.7)] flex items-center justify-center">
                      <span className="text-[7px] font-black text-white tracking-tight">
                        PUREViSION 160
                      </span>
                    </div>
                  </div>

                  {/* Rotor Balancing Counterweights at 90° and 270° */}
                  <div className="absolute right-1 w-3 h-8 bg-gray-700 border border-gray-600 rounded" />
                  <div className="absolute left-1 w-3 h-8 bg-gray-700 border border-gray-600 rounded" />
                </div>

                {/* Patient Table Cross-Section inside the Bore */}
                <div className="absolute bottom-10 w-28 h-4 bg-gradient-to-b from-[#1c2230] to-[#0f131a] border-t-2 border-cyan-500 rounded-b-xl shadow-lg flex items-center justify-center z-10">
                  <span className="text-[7px] text-cyan-300 font-bold tracking-tighter">
                    MESA FIBRA CARBONO
                  </span>
                </div>

                {/* Laser Alignment Crosshairs */}
                {isLaserOn && (
                  <>
                    <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_6px_#ef4444] z-20 pointer-events-none opacity-80" />
                    <div className="absolute inset-y-0 w-0.5 bg-red-500 shadow-[0_0_6px_#ef4444] z-20 pointer-events-none opacity-80" />
                  </>
                )}

                {/* Center Isocenter Target Marker */}
                <div className="w-3 h-3 rounded-full border border-yellow-400/80 bg-yellow-400/20 z-20 pointer-events-none flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-yellow-400" />
                </div>
              </div>

              {/* Physical Gantry Controls on Housing (Canon buttons replica) */}
              <div className="absolute bottom-3 inset-x-4 flex justify-between text-[8px] text-gray-700 font-bold">
                <span className="bg-white/80 px-1.5 py-0.5 rounded shadow-sm">▲ TILT +</span>
                <span className="bg-white/80 px-1.5 py-0.5 rounded shadow-sm">LASER</span>
                <span className="bg-white/80 px-1.5 py-0.5 rounded shadow-sm">▼ TILT -</span>
              </div>
            </div>

            <div className="mt-2 text-center text-[10px] text-gray-400">
              {rotorStatusText}
            </div>
          </div>
        )}

        {/* ===================== 2. SIDE PROFILE TABLE & TRANSLATION VIEW ===================== */}
        {(viewAngle === 'DUAL' || viewAngle === 'SIDE') && (
          <div className="relative flex-1 flex flex-col items-center justify-center p-2 w-full max-w-[460px]">
            <span className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-400">table_restaurant</span>
              <span>VISTA LATERAL DE AVANÇO HELICAL (EIXO Z)</span>
            </span>

            {/* Side Simulation Stage */}
            <div className="relative w-full h-64 sm:h-72 bg-[#05070c] border border-gray-800 rounded-2xl p-3 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Millimeter Grid along Z axis */}
              <div className="absolute top-2 inset-x-4 h-5 border-b border-gray-700 flex justify-between text-[7px] text-gray-500 font-mono">
                <span>-300mm</span>
                <span>-150mm</span>
                <span>0mm (Isocenter)</span>
                <span>+150mm</span>
                <span>+300mm</span>
              </div>

              {/* Side Gantry Cross-Section Housing */}
              <div
                className="absolute left-6 w-24 h-48 bg-gradient-to-r from-[#cdd4e0] via-[#abb4c7] to-[#7a8599] border-2 border-gray-600 rounded-2xl shadow-2xl flex flex-col items-center justify-between p-2 z-10 transition-transform duration-300"
                style={{
                  transform: `rotate(${gantryTiltAngle}deg)`
                }}
              >
                <span className="text-[8px] font-black text-red-600">CANON</span>
                {/* Bore Tunnel Opening in Side View */}
                <div className="w-full h-24 bg-[#0a0d14] rounded-lg border-2 border-cyan-500/50 shadow-inner flex items-center justify-center relative overflow-hidden">
                  {/* Rotating X-Ray Beam cone radiating vertically */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-amber-400/60 to-amber-500/30 animate-pulse" />
                  )}
                  {isLaserOn && (
                    <div className="absolute inset-y-0 w-0.5 bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  )}
                </div>
                <span className="text-[7px] font-bold text-slate-800">GANTRY SLIP-RING</span>
              </div>

              {/* Moving Patient Table Assembly */}
              <div className="absolute right-4 left-24 h-40 flex flex-col justify-center pointer-events-none">
                {/* Carbon Table Top (Translating horizontally based on tablePositionZ) */}
                <div
                  className="relative h-5 bg-gradient-to-r from-[#242b3d] via-[#3d4963] to-[#1c2230] border-t-2 border-cyan-400 rounded-l-full shadow-lg transition-transform duration-150"
                  style={{
                    transform: `translateX(${Math.max(-90, Math.min(60, (tablePositionZ / 300) * 80))}px)`
                  }}
                >
                  {/* Patient Silhouette Avatar on Table */}
                  <div className="absolute -top-7 left-2 flex items-center gap-1 opacity-80">
                    <span className="w-5 h-5 rounded-full bg-cyan-800 border border-cyan-400 shadow-sm" />
                    <span className="w-24 h-4 bg-cyan-900/80 border border-cyan-500/60 rounded-r-lg" />
                  </div>

                  {/* Translation direction arrow indicator */}
                  {activeSpin && (
                    <div className="absolute right-2 top-0.5 flex items-center gap-0.5 text-cyan-300 text-[8px] font-bold animate-pulse">
                      <span>AVANÇANDO IN</span>
                      <span className="material-symbols-outlined text-[10px]">arrow_back</span>
                    </div>
                  )}
                </div>

                {/* Scissor-Lift Hydraulic Pedestal */}
                <div className="mt-2 w-44 mx-auto h-20 border-l-4 border-r-4 border-gray-600 relative flex items-center justify-center bg-gray-900/40 rounded">
                  <div className="w-32 h-1 bg-gray-500 rotate-25 absolute" />
                  <div className="w-32 h-1 bg-gray-500 -rotate-25 absolute" />
                  <div className="absolute bottom-1 text-[8px] text-gray-500 font-bold">
                    PEDESTAL HIDRÁULICO (H: {tableHeightMm}mm)
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Motion Action Buttons */}
            <div className="mt-2 flex items-center justify-between w-full text-[10px] px-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onManualMoveTable && onManualMoveTable('IN', 20)}
                  className="px-2 py-1 bg-[#1c2436] hover:bg-cyan-700 text-white rounded border border-gray-700 font-bold flex items-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
                  title="Avançar mesa para dentro do gantry (+20mm)"
                >
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  <span>Mesa IN</span>
                </button>
                <button
                  onClick={() => onManualMoveTable && onManualMoveTable('OUT', 20)}
                  className="px-2 py-1 bg-[#1c2436] hover:bg-cyan-700 text-white rounded border border-gray-700 font-bold flex items-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
                  title="Recuar mesa para fora do gantry (-20mm)"
                >
                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                  <span>Mesa OUT</span>
                </button>
              </div>

              {/* Test Spin Toggle */}
              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  setIsTestSpinning(prev => !prev);
                }}
                className={`px-2.5 py-1 rounded font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                  isTestSpinning
                    ? 'bg-red-600 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                    : 'bg-amber-600/30 hover:bg-amber-600 text-amber-200 border-amber-500/50'
                }`}
                title="Testar rotação física do rotor em vazio sem emissão de Raio-X"
              >
                <span className="material-symbols-outlined text-xs">
                  {isTestSpinning ? 'stop' : 'play_arrow'}
                </span>
                <span>{isTestSpinning ? 'Parar Rotor' : 'Girar Rotor (Teste)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== FOOTER PHYSICAL SPECIFICATION ===================== */}
      <div className="bg-[#0b0e14] border-t border-[#1f2738] px-3 py-1.5 flex items-center justify-between text-[9px] text-gray-400">
        <div className="flex items-center gap-3">
          <span>Gantry Aperture: <strong className="text-gray-200">780 mm</strong></span>
          <span>•</span>
          <span>Tubo de Raio-X: <strong className="text-amber-300">Megacool 7.5 MHU</strong></span>
          <span>•</span>
          <span>Detectores: <strong className="text-cyan-300">PUREViSION 160 Canais (0.5mm)</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">● Manutenção: CONFORME</span>
          <span className="text-gray-600">|</span>
          <span>Canon Medical Systems</span>
        </div>
      </div>
    </div>
  );
};
