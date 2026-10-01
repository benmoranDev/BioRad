import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CANON_ACTIVION_CASES, RealActivionCase } from '../../data/canonActivionData';
import {
  SCAN_PROTOCOLS,
  ActivionScanProtocol
} from '../../data/canonConsoleScreensData';
import {
  DicomSliceData,
  renderDicomSliceToCanvas,
  playCanonAudioCue
} from '../../utils/dicomEngine';
import { CtGantrySimulator } from './CtGantrySimulator';
import { RadiologyGlossaryModal } from '../modals/RadiologyGlossaryModal';

interface CanonScanConsoleProps {
  selectedCase: RealActivionCase;
  onSelectCase: (c: RealActivionCase) => void;
  activeProtocol: ActivionScanProtocol;
  onSelectProtocol: (protocol: ActivionScanProtocol, protocolKey: string) => void;
  dicomSlices: DicomSliceData[];
  onCompleteScanToMpr: (slices: DicomSliceData[]) => void;
  onNavigateMode: (mode: 'MPR' | '3D' | 'Filming' | 'RawData' | 'Clinical') => void;
  onClose: () => void;
}

interface CanonProtocolEntry {
  id: string;
  name: string;
  code: string;
  subType: string;
  organ: string;
  region: 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'EXTREMITIES' | 'VASCULAR';
  group: 'Group A' | 'Group B' | 'Group C';
  patientType: 'Adult' | 'Child' | 'Trauma';
  hasContrast: boolean; // true = C/C, false = S/C
  contrastType: string;
  iconType: 'brain' | 'ear' | 'face' | 'chest' | 'abdomen' | 'spine' | 'trauma' | 'vascular' | 'cardiac';
  kv: string;
  mas: string;
  rotationSec: string;
  sliceThickness: string;
  filterKernel: string;
  collimation: string;
  pitch: string;
}

export const CanonScanConsole: React.FC<CanonScanConsoleProps> = ({
  selectedCase,
  onSelectCase,
  activeProtocol,
  onSelectProtocol,
  dicomSlices,
  onCompleteScanToMpr,
  onNavigateMode,
  onClose
}) => {
  // Patient Registration Form State (Matching Top-Center Panel)
  const [patientId, setPatientId] = useState<string>('7462');
  const [firstName, setFirstName] = useState<string>('PEDRO LUCCA');
  const [middleName, setMiddleName] = useState<string>('FERNANDES');
  const [lastName, setLastName] = useState<string>('MILITAO');
  const [dob, setDob] = useState<string>('19.01.2023');
  const [age, setAge] = useState<string>('0Y');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [weightKg, setWeightKg] = useState<string>('12');
  const [commentText, setCommentText] = useState<string>('TC CRÂNIO PEDIÁTRICO');
  const [contrastOption, setContrastOption] = useState<string>('Sem Contraste');
  const [organSelected, setOrganSelected] = useState<string>('Crânio');

  // Bottom Panel Body Map & Protocol Selection State
  const [patientCategory, setPatientCategory] = useState<'Adult' | 'Child' | 'Trauma'>('Child');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'EXTREMITIES' | 'VASCULAR'>('HEAD');
  const [selectedProtocolGroup, setSelectedProtocolGroup] = useState<'Group A' | 'Group B' | 'Group C'>('Group A');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('cranio_sc_child');

  // Multi-Step Workflow
  const [scanWorkflowStep, setScanWorkflowStep] = useState<'plan' | 'surestart' | 'exposure' | 'completed'>('plan');

  // Viewport Switcher: Scout Topogram, 3D Gantry Physics Simulator, Live Axial Reconstruction
  const [activeMonitorView, setActiveMonitorView] = useState<'SCOUT' | 'GANTRY' | 'LIVE_AXIAL'>('SCOUT');

  // Plan Range Box & Gantry Telemetry
  const [planStartMm, setPlanStartMm] = useState<number>(140);
  const [planEndMm, setPlanEndMm] = useState<number>(-120);
  const [fovDiameterMm, setFovDiameterMm] = useState<number>(240);
  const [tablePositionZ, setTablePositionZ] = useState<number>(-150.0);
  const [tableHeightMm, setTableHeightMm] = useState<number>(820.0);
  const [gantryTiltAngle, setGantryTiltAngle] = useState<number>(0);
  const [isLaserOn, setIsLaserOn] = useState<boolean>(true);

  // Technical Exposure Parameters
  const [scanKv, setScanKv] = useState<string>('120kV');
  const [scanMas, setScanMas] = useState<string>('130mAs');
  const [rotationSpeedSec, setRotationSpeedSec] = useState<string>('0.75s');
  const [sliceThicknessMm, setSliceThicknessMm] = useState<string>('5.0mm');
  const [collimation, setCollimation] = useState<string>('1.0x16');
  const [pitchFactor, setPitchFactor] = useState<string>('HP11.0');
  const [reconFilterKernel, setReconFilterKernel] = useState<string>('FC48');
  const [tubeHeatPercent, setTubeHeatPercent] = useState<number>(29);
  const [exposureProgressPct, setExposureProgressPct] = useState<number>(0);
  const [reconstructedSliceCount, setReconstructedSliceCount] = useState<number>(0);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);
  const [glossaryTermId, setGlossaryTermId] = useState<string>('kvp');

  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const exposureTimerRef = useRef<any>(null);

  // Rotation RPM Calculations
  const rotationSeconds = parseFloat(rotationSpeedSec.replace('s', '')) || 0.75;
  const currentRpm = Math.round((60 / rotationSeconds) * 10) / 10;

  // Sync with selectedCase if changed
  useEffect(() => {
    if (selectedCase) {
      setPatientId(selectedCase.patientId || '7462');
      const parts = selectedCase.patientName.split(' ');
      setFirstName(parts[0] || 'PEDRO');
      setMiddleName(parts[1] || 'LUCCA');
      setLastName(parts.slice(2).join(' ') || 'FERNANDES MILITAO');
    }
  }, [selectedCase]);

  // Comprehensive Protocol Database (Organ, S/C, C/C, Groups)
  const canonProtocols: CanonProtocolEntry[] = useMemo(() => [
    // ================= CRÂNIO / HEAD =================
    // Sem Contraste (S/C)
    { id: 'cranio_sc_child', name: 'CRÂNIO ROTINA PEDIÁTRICO (S/C)', code: '432', subType: 'SS/HF S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Child', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'brain', kv: '120kV', mas: '130mAs', rotationSec: '0.75s', sliceThickness: '5.0mm', filterKernel: 'FC48', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'cranio_sc_adult', name: 'CRÂNIO ROTINA ADULTO (S/C)', code: '101', subType: 'SS/HF S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'brain', kv: '120kV', mas: '240mAs', rotationSec: '0.75s', sliceThickness: '5.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'cranio_fossa_post_sc', name: 'CRÂNIO FOSSA POSTERIOR HR (S/C)', code: '102', subType: 'HE/HR S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'brain', kv: '120kV', mas: '280mAs', rotationSec: '0.75s', sliceThickness: '2.0mm', filterKernel: 'FC13', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'cranio_trauma_sc', name: 'CRÂNIO URGÊNCIA / TRAUMA (S/C)', code: '901', subType: 'HE/FAST S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Trauma', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'trauma', kv: '120kV', mas: '280mAs', rotationSec: '0.35s', sliceThickness: '1.0mm', filterKernel: 'FC30', collimation: '1.0x16', pitch: 'HP15.0' },
    { id: 'cranio_avc_isquemia_sc', name: 'CRÂNIO AVC HIPERAGUDO (S/C)', code: '104', subType: 'SS/FAST S', organ: 'Crânio', region: 'HEAD', group: 'Group B', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'brain', kv: '120kV', mas: '260mAs', rotationSec: '0.50s', sliceThickness: '4.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },

    // Com Contraste (C/C)
    { id: 'cranio_cc_venoso', name: 'CRÂNIO COM CONTRASTE VENOSO (C/C)', code: '451', subType: 'SS/HF S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'brain', kv: '120kV', mas: '220mAs', rotationSec: '0.75s', sliceThickness: '3.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'cranio_dupla_fase_cc', name: 'CRÂNIO DUPLA FASE (PRÉ + PÓS C/C)', code: '452', subType: 'HE/STD S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Bifásico (Pré + Pós Contraste C/C)', iconType: 'brain', kv: '120kV', mas: '200mAs', rotationSec: '0.75s', sliceThickness: '3.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'angio_arterial_cranio', name: 'ANGIO-TC ARTERIAL CRÂNIO (WILLIS C/C)', code: '453', subType: 'HE/HR S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Angio-TC com Contraste', iconType: 'vascular', kv: '100kV', mas: '250mAs', rotationSec: '0.35s', sliceThickness: '0.5mm', filterKernel: 'FC08', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'venografia_dural_cc', name: 'VENOGRAFIA TC DE SEIOS DURAIS (C/C)', code: '454', subType: 'HE/STD S', organ: 'Crânio', region: 'HEAD', group: 'Group B', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'vascular', kv: '120kV', mas: '200mAs', rotationSec: '0.50s', sliceThickness: '1.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'cranio_ped_cc', name: 'CRÂNIO PEDIÁTRICO COM CONTRASTE (C/C)', code: '434', subType: 'SS/HF S', organ: 'Crânio', region: 'HEAD', group: 'Group A', patientType: 'Child', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'brain', kv: '100kV', mas: '120mAs', rotationSec: '0.50s', sliceThickness: '3.0mm', filterKernel: 'FC48', collimation: '1.0x16', pitch: 'HP11.0' },

    // ================= MASTÓIDES / OUVIDOS =================
    { id: 'mastoides_sc_child', name: 'MASTOIDES ALTA RESOLUÇÃO (S/C)', code: '435', subType: 'SS/HF S', organ: 'Mastóides / Ouvidos', region: 'HEAD', group: 'Group A', patientType: 'Child', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'ear', kv: '120kV', mas: '180mAs', rotationSec: '0.75s', sliceThickness: '1.0mm', filterKernel: 'FC30', collimation: '0.5x16', pitch: 'HP15.0' },
    { id: 'mastoides_sc_adult', name: 'MASTOIDES / ROCHEDOS HRCT (S/C)', code: '102', subType: 'HE/HR S', organ: 'Mastóides / Ouvidos', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'ear', kv: '120kV', mas: '280mAs', rotationSec: '1.00s', sliceThickness: '0.5mm', filterKernel: 'FC52', collimation: '0.5x16', pitch: 'HP15.0' },
    { id: 'mastoides_cc_neurinoma', name: 'MASTOIDES E CONDUTOS COM CONTRASTE (C/C)', code: '437', subType: 'HE/HR S', organ: 'Mastóides / Ouvidos', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'ear', kv: '120kV', mas: '240mAs', rotationSec: '0.75s', sliceThickness: '0.7mm', filterKernel: 'FC13', collimation: '0.5x16', pitch: 'HP11.0' },

    // ================= SEIOS DA FACE =================
    { id: 'seios_face_sc_child', name: 'SEIOS DA FACE AXIAL/CORONAL (S/C)', code: '436', subType: 'SS/HF S', organ: 'Seios da Face', region: 'HEAD', group: 'Group A', patientType: 'Child', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'face', kv: '120kV', mas: '120mAs', rotationSec: '0.50s', sliceThickness: '2.0mm', filterKernel: 'FC30', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'seios_face_sc_adult', name: 'SEIOS DA FACE ROTINA (S/C)', code: '103', subType: 'SS/HF S', organ: 'Seios da Face', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'face', kv: '120kV', mas: '180mAs', rotationSec: '0.50s', sliceThickness: '1.5mm', filterKernel: 'FC30', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'seios_face_cc_orbitas', name: 'SEIOS DA FACE E ÓRBITAS COM CONTRASTE (C/C)', code: '439', subType: 'HE/STD S', organ: 'Seios da Face', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'face', kv: '120kV', mas: '200mAs', rotationSec: '0.50s', sliceThickness: '1.5mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },

    // ================= PESCOÇO / CERVICAL =================
    { id: 'pescoco_cc_partes_moles', name: 'PESCOÇO COM CONTRASTE (PARTES MOLES C/C)', code: '461', subType: 'HE/STD S', organ: 'Pescoço / Cervical', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'face', kv: '120kV', mas: '220mAs', rotationSec: '0.50s', sliceThickness: '2.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'angio_carotidas_cc', name: 'ANGIO-TC DE CARÓTIDAS E VERTEBRAIS (C/C)', code: '462', subType: 'HE/HR S', organ: 'Pescoço / Cervical', region: 'HEAD', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Angio-TC com Contraste', iconType: 'vascular', kv: '100kV', mas: '220mAs', rotationSec: '0.35s', sliceThickness: '0.5mm', filterKernel: 'FC08', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'pescoco_sc', name: 'PESCOÇO SEM CONTRASTE (S/C)', code: '463', subType: 'HE/STD S', organ: 'Pescoço / Cervical', region: 'HEAD', group: 'Group B', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'face', kv: '120kV', mas: '180mAs', rotationSec: '0.50s', sliceThickness: '3.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },

    // ================= TÓRAX / CHEST =================
    { id: 'torax_hrct_sc', name: 'TÓRAX DE ALTA RESOLUÇÃO HRCT (S/C)', code: '501', subType: 'HE/HR S', organ: 'Tórax', region: 'CHEST', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'chest', kv: '120kV', mas: '150mAs', rotationSec: '0.35s', sliceThickness: '1.0mm', filterKernel: 'FC07', collimation: '1.0x16', pitch: 'HP15.0' },
    { id: 'torax_low_dose_sc', name: 'TÓRAX BAIXA DOSE RASTREAMENTO (S/C)', code: '504', subType: 'HE/FAST S', organ: 'Tórax', region: 'CHEST', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'chest', kv: '100kV', mas: '40mAs', rotationSec: '0.35s', sliceThickness: '1.0mm', filterKernel: 'FC07', collimation: '1.0x16', pitch: 'HP15.0' },
    { id: 'torax_cc_rotina', name: 'TÓRAX ROTINA COM CONTRASTE (C/C)', code: '502', subType: 'HE/STD S', organ: 'Tórax', region: 'CHEST', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'chest', kv: '120kV', mas: '180mAs', rotationSec: '0.50s', sliceThickness: '1.5mm', filterKernel: 'FC07', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'angio_torax_tep', name: 'ANGIO-TC DE TÓRAX / PROTOCOLO TEP (C/C)', code: '503', subType: 'HE/HR S', organ: 'Tórax', region: 'CHEST', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Angio-TC com Contraste', iconType: 'vascular', kv: '100kV', mas: '240mAs', rotationSec: '0.35s', sliceThickness: '0.5mm', filterKernel: 'FC08', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'angio_coronarias_ecg', name: 'ANGIO-TC DE CORONÁRIAS ECG-GATED (C/C)', code: '505', subType: 'ECG/GATED S', organ: 'Tórax', region: 'CHEST', group: 'Group B', patientType: 'Adult', hasContrast: true, contrastType: 'Angio-TC com Contraste', iconType: 'cardiac', kv: '100kV', mas: '320mAs', rotationSec: '0.275s', sliceThickness: '0.5mm', filterKernel: 'FC08', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'torax_abdome_estadiamento', name: 'TÓRAX + ABDÔMEN TOTAL ESTADIAMENTO (C/C)', code: '506', subType: 'HE/STD S', organ: 'Tórax', region: 'CHEST', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'chest', kv: '120kV', mas: '220mAs', rotationSec: '0.50s', sliceThickness: '2.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP15.0' },
    { id: 'torax_ped_sc', name: 'TÓRAX BAIXA DOSE PEDIÁTRICO (S/C)', code: '441', subType: 'HE/HR S', organ: 'Tórax', region: 'CHEST', group: 'Group A', patientType: 'Child', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'chest', kv: '80kV', mas: '60mAs', rotationSec: '0.35s', sliceThickness: '1.0mm', filterKernel: 'FC07', collimation: '1.0x16', pitch: 'HP15.0' },

    // ================= ABDÔMEN E PELVE =================
    { id: 'abdome_calculo_sc', name: 'ABDÔMEN TOTAL SEM CONTRASTE (S/C - CÁLCULO)', code: '601', subType: 'HE/STD S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'abdomen', kv: '120kV', mas: '160mAs', rotationSec: '0.50s', sliceThickness: '2.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP15.0' },
    { id: 'abdome_cc_portal', name: 'ABDÔMEN TOTAL COM CONTRASTE (FASE PORTAL C/C)', code: '602', subType: 'HE/STD S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'abdomen', kv: '120kV', mas: '220mAs', rotationSec: '0.50s', sliceThickness: '2.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'abdome_trifasico_cc', name: 'ABDÔMEN TRIFÁSICO HEPÁTICO (ARTERIAL+PORTAL+TARDIA C/C)', code: '603', subType: 'HE/MULTI S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Trifásico (Arterial + Portal + Tardia C/C)', iconType: 'abdomen', kv: '120kV', mas: '240mAs', rotationSec: '0.50s', sliceThickness: '1.5mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'angio_aorta_abd_cc', name: 'ANGIO-TC DE AORTA ABDOMINAL E ILÍACAS (C/C)', code: '604', subType: 'HE/HR S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Angio-TC com Contraste', iconType: 'vascular', kv: '100kV', mas: '250mAs', rotationSec: '0.35s', sliceThickness: '0.7mm', filterKernel: 'FC08', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'uro_tc_cc', name: 'URO-TC COM CONTRASTE E FASE EXCRETORA (C/C)', code: '605', subType: 'HE/MULTI S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group B', patientType: 'Adult', hasContrast: true, contrastType: 'Trifásico (Arterial + Portal + Tardia C/C)', iconType: 'abdomen', kv: '120kV', mas: '200mAs', rotationSec: '0.50s', sliceThickness: '1.5mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'enterotomografia_cc', name: 'ENTEROTOMOGRAFIA COM DUPLO CONTRASTE (ORAL+IV C/C)', code: '606', subType: 'HE/STD S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group B', patientType: 'Adult', hasContrast: true, contrastType: 'Duplo Contraste (Oral + IV)', iconType: 'abdomen', kv: '120kV', mas: '220mAs', rotationSec: '0.50s', sliceThickness: '2.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },
    { id: 'abdome_ped_sc', name: 'ABDÔMEN TOTAL PEDIÁTRICO (S/C)', code: '442', subType: 'HE/STD S', organ: 'Abdômen e Pelve', region: 'ABDOMEN', group: 'Group A', patientType: 'Child', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'abdomen', kv: '100kV', mas: '90mAs', rotationSec: '0.50s', sliceThickness: '3.0mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },

    // ================= COLUNA =================
    { id: 'coluna_lombar_sc', name: 'COLUNA LOMBOSSACRA HR (S/C)', code: '130', subType: 'HE/HR S', organ: 'Coluna', region: 'SPINE', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'spine', kv: '135kV', mas: '300mAs', rotationSec: '0.75s', sliceThickness: '1.0mm', filterKernel: 'FC30', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'coluna_cervical_sc', name: 'COLUNA CERVICAL ALTA DEFINIÇÃO (S/C)', code: '131', subType: 'HE/HR S', organ: 'Coluna', region: 'SPINE', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'spine', kv: '120kV', mas: '250mAs', rotationSec: '0.75s', sliceThickness: '1.0mm', filterKernel: 'FC30', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'coluna_cc_tumor_discite', name: 'COLUNA COM CONTRASTE (C/C - TUMOR/DISCITE)', code: '702', subType: 'HE/STD S', organ: 'Coluna', region: 'SPINE', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'spine', kv: '120kV', mas: '240mAs', rotationSec: '0.75s', sliceThickness: '1.5mm', filterKernel: 'FC13', collimation: '1.0x16', pitch: 'HP11.0' },

    // ================= MEMBROS / EXTREMIDADES =================
    { id: 'membros_hrct_sc', name: 'MEMBROS E ARTICULAÇÕES HRCT (S/C)', code: '801', subType: 'HE/HR S', organ: 'Membros / Extremidades', region: 'EXTREMITIES', group: 'Group A', patientType: 'Adult', hasContrast: false, contrastType: 'Sem Contraste', iconType: 'trauma', kv: '120kV', mas: '200mAs', rotationSec: '0.50s', sliceThickness: '0.5mm', filterKernel: 'FC30', collimation: '0.5x16', pitch: 'HP11.0' },
    { id: 'artro_tc_cc', name: 'ARTRO-TC COM CONTRASTE INTRA-ARTICULAR (C/C)', code: '802', subType: 'HE/HR S', organ: 'Membros / Extremidades', region: 'EXTREMITIES', group: 'Group A', patientType: 'Adult', hasContrast: true, contrastType: 'Com Contraste Venoso (C/C)', iconType: 'trauma', kv: '120kV', mas: '220mAs', rotationSec: '0.50s', sliceThickness: '0.5mm', filterKernel: 'FC30', collimation: '0.5x16', pitch: 'HP11.0' }
  ], []);

  // Filter protocols strictly matching Organ, Contrast selection, Group, and Patient Category
  const displayedProtocols = useMemo(() => {
    return canonProtocols.filter(p => {
      // 1. Match Organ
      const matchesOrgan = p.organ.toLowerCase().includes(organSelected.toLowerCase()) ||
                            organSelected.toLowerCase().includes(p.organ.toLowerCase()) ||
                            organSelected === 'Todos';

      // 2. Match Contrast
      const isContrastRequested = contrastOption !== 'Sem Contraste' && !contrastOption.toLowerCase().includes('sem contraste') && !contrastOption.toLowerCase().includes('nativo');
      const matchesContrast = contrastOption === 'Todos' || (isContrastRequested ? p.hasContrast : !p.hasContrast);

      // 3. Match Group
      const matchesGroup = p.group === selectedProtocolGroup;

      return matchesOrgan && matchesContrast && matchesGroup;
    });
  }, [canonProtocols, organSelected, contrastOption, selectedProtocolGroup]);

  // Fallback if no exact match in that specific group, show all for that organ
  const fallbackProtocols = useMemo(() => {
    if (displayedProtocols.length > 0) return displayedProtocols;
    return canonProtocols.filter(p => {
      return p.organ.toLowerCase().includes(organSelected.toLowerCase()) ||
             organSelected.toLowerCase().includes(p.organ.toLowerCase());
    });
  }, [displayedProtocols, canonProtocols, organSelected]);

  // Handle Organ Change from dropdown
  const handleOrganChange = (newOrgan: string) => {
    setOrganSelected(newOrgan);
    // Map organ to body region
    if (newOrgan.includes('Crânio') || newOrgan.includes('Mastóides') || newOrgan.includes('Seios') || newOrgan.includes('Pescoço')) {
      setSelectedBodyRegion('HEAD');
    } else if (newOrgan.includes('Tórax')) {
      setSelectedBodyRegion('CHEST');
    } else if (newOrgan.includes('Abdômen')) {
      setSelectedBodyRegion('ABDOMEN');
    } else if (newOrgan.includes('Coluna')) {
      setSelectedBodyRegion('SPINE');
    } else if (newOrgan.includes('Membros')) {
      setSelectedBodyRegion('EXTREMITIES');
    }
  };

  // Handle Body Region Click from Body Map
  const handleBodyRegionClick = (region: 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'EXTREMITIES') => {
    playCanonAudioCue('click');
    setSelectedBodyRegion(region);
    if (region === 'HEAD') setOrganSelected('Crânio');
    if (region === 'CHEST') setOrganSelected('Tórax');
    if (region === 'ABDOMEN') setOrganSelected('Abdômen e Pelve');
    if (region === 'SPINE') setOrganSelected('Coluna');
    if (region === 'EXTREMITIES') setOrganSelected('Membros / Extremidades');
  };

  // Select a protocol from matrix
  const handleSelectProtocolItem = (proto: CanonProtocolEntry) => {
    playCanonAudioCue('click');
    setSelectedProtocolId(proto.id);
    setScanKv(proto.kv);
    setScanMas(proto.mas);
    setRotationSpeedSec(proto.rotationSec);
    setSliceThicknessMm(proto.sliceThickness);
    setReconFilterKernel(proto.filterKernel);
    setCollimation(proto.collimation);
    setPitchFactor(proto.pitch);
    setOrganSelected(proto.organ);
    setContrastOption(proto.hasContrast ? 'Com Contraste Venoso (C/C)' : 'Sem Contraste');

    const matched = Object.values(SCAN_PROTOCOLS).find(p => p.bodyRegion === proto.region);
    if (matched) {
      onSelectProtocol(matched, proto.id);
    }
  };

  // Load Emergency Patient Preset
  const handleEmergencyClick = () => {
    playCanonAudioCue('click');
    setPatientId('EMERG-' + Math.floor(1000 + Math.random() * 9000));
    setFirstName('PACIENTE');
    setMiddleName('EMERGENCIA');
    setLastName('TRAUMA');
    setAge('34Y');
    setSex('Male');
    setWeightKg('75');
    setCommentText('POLITRAUMA GRAVE - SALA VERMELHA');
    setPatientCategory('Trauma');
    setOrganSelected('Crânio');
    setContrastOption('Sem Contraste');
    setSelectedBodyRegion('HEAD');
    const traumaProto = canonProtocols.find(p => p.id === 'cranio_trauma_sc');
    if (traumaProto) handleSelectProtocolItem(traumaProto);
  };

  // Execute Helical Exposure
  const handleStartScan = () => {
    if (isEmergencyStopped) return;
    playCanonAudioCue('exposure_start');
    setScanWorkflowStep('exposure');
    setActiveMonitorView('LIVE_AXIAL');
    setExposureProgressPct(0);
    setReconstructedSliceCount(0);
    setTubeHeatPercent(prev => Math.min(95, prev + 8));

    const totalScanSlices = Math.max(24, dicomSlices.length || 32);
    let currentPct = 0;
    let sliceCounter = 0;

    exposureTimerRef.current = setInterval(() => {
      currentPct += 5;
      sliceCounter = Math.min(totalScanSlices, Math.floor((currentPct / 100) * totalScanSlices));

      setExposureProgressPct(currentPct);
      setReconstructedSliceCount(sliceCounter);
      setTablePositionZ(prev => prev + 3.8);

      if (dicomSlices[sliceCounter - 1] && liveCanvasRef.current) {
        const slice = dicomSlices[sliceCounter - 1];
        renderDicomSliceToCanvas(slice, liveCanvasRef.current, slice.windowWidth, slice.windowCenter, false);
      }

      if (currentPct >= 100) {
        clearInterval(exposureTimerRef.current);
        setScanWorkflowStep('completed');
        playCanonAudioCue('exposure_end');
      }
    }, 160);
  };

  // Helper renderer for custom CT icons in protocol list
  const renderProtocolIcon = (type: string) => {
    switch (type) {
      case 'brain':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-cyan-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-cyan-300">neurology</span>
          </div>
        );
      case 'ear':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-amber-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-amber-300">hearing</span>
          </div>
        );
      case 'face':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-purple-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-purple-300">face</span>
          </div>
        );
      case 'chest':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-blue-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-blue-300">pulmonology</span>
          </div>
        );
      case 'abdomen':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-emerald-300">body_system</span>
          </div>
        );
      case 'spine':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-amber-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-amber-300">accessibility_new</span>
          </div>
        );
      case 'vascular':
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-red-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-red-400">vaccines</span>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded bg-[#1b1e2c] border border-gray-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-sm text-emerald-300">radiology</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#424860] text-gray-100 select-none font-sans overflow-hidden border-2 border-[#1a1c26] shadow-2xl">
      
      {/* ===================== TOP ROW: 3 MAIN PANELS (MACHINE / REGISTRATION / TOPOGRAM) ===================== */}
      <div className="flex-1 grid grid-cols-12 gap-1.5 p-1.5 bg-[#3b4156] min-h-0 overflow-hidden">
        
        {/* ==================== 1. TOP-LEFT PANEL: MACHINE & SYSTEM STATUS ==================== */}
        <div className="col-span-12 lg:col-span-3 bg-[#4c546e] rounded-md border border-[#646e8f] p-1.5 flex flex-col justify-between text-xs shadow-md font-sans">
          
          {/* Header row with Aquilion logo & timestamp */}
          <div className="flex items-center justify-between border-b border-[#5e6789] pb-1">
            <div className="flex items-center gap-1.5">
              <span className="italic font-serif font-black text-sm text-white tracking-wider drop-shadow-sm">Aquilion</span>
              <span className="text-[10px] text-gray-300 font-mono">Jan 19 10:04 2023</span>
            </div>
            <div className="px-1.5 py-0.5 rounded-full bg-[#2a3045] text-cyan-300 font-mono text-[9px] border border-cyan-500/40 shadow-inner">
              Im:30800 /Img:27500
            </div>
          </div>

          {/* Gantry & Table Telemetry Indicators */}
          <div className="grid grid-cols-3 gap-1 my-1 text-[10px] font-mono">
            <div className="bg-[#24293c] p-1 rounded border border-[#525c7e] text-center shadow-inner">
              <div className="text-gray-400 text-[8px] flex items-center justify-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">table_restaurant</span>
                <span>Mesa</span>
              </div>
              <strong className="text-white text-xs">{tablePositionZ.toFixed(0)}</strong>
            </div>
            <div className="bg-[#24293c] p-1 rounded border border-[#525c7e] text-center shadow-inner">
              <div className="text-gray-400 text-[8px] flex items-center justify-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">rotate_90_degrees_ccw</span>
                <span>Tilt</span>
              </div>
              <strong className="text-emerald-400 text-xs">41 -5</strong>
            </div>
            <div className="bg-[#24293c] p-1 rounded border border-[#525c7e] text-center shadow-inner">
              <div className="text-gray-400 text-[8px] flex items-center justify-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]">height</span>
                <span>Altura</span>
              </div>
              <strong className="text-white text-xs">105.0</strong>
            </div>
          </div>

          {/* Tube Heat Storage Bar */}
          <div className="bg-[#24293c] p-1.5 rounded border border-[#525c7e] space-y-0.5 shadow-inner">
            <div className="flex justify-between text-[9px] text-gray-200 font-mono font-bold">
              <span>TubeHU(LP)</span>
              <span className={tubeHeatPercent > 75 ? 'text-red-400 font-black' : 'text-cyan-400'}>{tubeHeatPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#121520] rounded-full overflow-hidden border border-gray-700">
              <div
                className={`h-full transition-all duration-300 ${
                  tubeHeatPercent > 75 ? 'bg-red-500' : tubeHeatPercent > 50 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                }`}
                style={{ width: `${tubeHeatPercent}%` }}
              />
            </div>
          </div>

          {/* 4 Large Action Buttons (Scan, AutoView, Raw Data, Utility) */}
          <div className="grid grid-cols-3 gap-1 my-1">
            <button
              onClick={() => playCanonAudioCue('click')}
              className="h-10 rounded-md bg-gradient-to-b from-[#f0c030] via-[#d49e15] to-[#a67800] text-slate-950 font-black text-[10px] border-2 border-[#ffe066] flex flex-col items-center justify-center shadow-md cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm leading-none">radar</span>
              <span>Scan</span>
            </button>
            <button
              onClick={() => onNavigateMode('MPR')}
              className="h-10 rounded-md bg-gradient-to-b from-[#5c6585] to-[#3a415a] hover:brightness-110 text-gray-100 font-bold text-[10px] border border-[#747e9e] flex flex-col items-center justify-center cursor-pointer shadow transition-all"
            >
              <span className="material-symbols-outlined text-sm leading-none">preview</span>
              <span>AutoView</span>
            </button>
            <button
              onClick={() => onNavigateMode('RawData')}
              className="h-10 rounded-md bg-gradient-to-b from-[#5c6585] to-[#3a415a] hover:brightness-110 text-gray-100 font-bold text-[10px] border border-[#747e9e] flex flex-col items-center justify-center cursor-pointer shadow transition-all"
            >
              <span className="material-symbols-outlined text-sm leading-none">database</span>
              <span>Raw Data</span>
            </button>
          </div>

          {/* Utility Drawer Strip */}
          <button
            onClick={() => {
              playCanonAudioCue('click');
              setShowGlossaryModal(true);
            }}
            className="w-full py-1 bg-[#32384e] hover:bg-[#3d4560] rounded-md border border-[#5e688a] text-[9px] text-gray-200 font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-colors"
            title="Abrir Glossário e Parâmetros Técnicos Canon"
          >
            <span className="material-symbols-outlined text-xs text-amber-300">menu_book</span>
            <span>Utility (Glossário & Física TC)</span>
          </button>

          {/* Lower Circular/Pill System Action Buttons */}
          <div className="grid grid-cols-4 gap-1 mt-1 pt-1 border-t border-[#5e6789]">
            <button
              onClick={() => onNavigateMode('Clinical')}
              className="p-1 rounded bg-[#32384e] hover:bg-[#434b68] text-gray-200 text-[8px] flex flex-col items-center justify-center border border-[#525c7e] cursor-pointer shadow-sm"
              title="Browser de Exames / Histórico"
            >
              <span className="material-symbols-outlined text-xs text-amber-300">folder_open</span>
              <span>Browser</span>
            </button>
            <button
              onClick={() => onNavigateMode('Filming')}
              className="p-1 rounded bg-[#32384e] hover:bg-[#434b68] text-gray-200 text-[8px] flex flex-col items-center justify-center border border-[#525c7e] cursor-pointer shadow-sm"
              title="Câmera Laser DICOM Print"
            >
              <span className="material-symbols-outlined text-xs text-cyan-300">print</span>
              <span>Filming</span>
            </button>
            <button
              onClick={() => onNavigateMode('3D')}
              className="p-1 rounded bg-[#32384e] hover:bg-[#434b68] text-purple-300 text-[8px] flex flex-col items-center justify-center border border-[#525c7e] cursor-pointer shadow-sm"
              title="Volume Rendering 3D"
            >
              <span className="material-symbols-outlined text-xs">view_in_ar</span>
              <span>3D Vitrea</span>
            </button>
            <button
              onClick={() => {
                playCanonAudioCue('click');
                setTablePositionZ(-150);
                setTubeHeatPercent(28);
              }}
              className="p-1 rounded bg-[#32384e] hover:bg-[#434b68] text-cyan-300 text-[8px] flex flex-col items-center justify-center border border-cyan-500/50 cursor-pointer shadow-sm"
              title="Reset de Mesa e Posição"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ==================== 2. TOP-CENTER PANEL: PATIENT REGISTRATION FORM ==================== */}
        <div className="col-span-12 lg:col-span-4 bg-[#4c546e] rounded-md border border-[#646e8f] p-2 flex flex-col justify-between shadow-md text-xs font-sans">
          
          <div className="space-y-1">
            {/* Row 1: ID & Info button */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[10px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                ID
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  className="w-full bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-cyan-300 font-mono font-bold text-xs shadow-inner"
                />
              </div>
              <button
                onClick={() => playCanonAudioCue('click')}
                className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] hover:brightness-110 text-white font-bold text-[10px] border border-[#7682aa] cursor-pointer shadow-sm"
              >
                Info.
              </button>
            </div>

            {/* Row 2: First Name */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[10px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                First
              </span>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="flex-1 bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-white font-mono font-bold text-xs shadow-inner uppercase"
              />
            </div>

            {/* Row 3: Middle Name */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[10px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                Middle
              </span>
              <input
                type="text"
                value={middleName}
                onChange={e => setMiddleName(e.target.value)}
                className="flex-1 bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-white font-mono font-bold text-xs shadow-inner uppercase"
              />
            </div>

            {/* Row 4: Lastname */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[10px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                Lastname
              </span>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="flex-1 bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-white font-mono font-bold text-xs shadow-inner uppercase"
              />
            </div>

            {/* Row 5: DOB & Age */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1">
                <span className="w-12 px-1 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                  DOB
                </span>
                <input
                  type="text"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  placeholder="dd.mm.yyyy"
                  className="w-full bg-[#171a26] border border-[#485272] rounded px-1.5 py-0.5 text-white font-mono text-xs shadow-inner"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-10 px-1 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                  Age
                </span>
                <input
                  type="text"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full bg-[#171a26] border border-[#485272] rounded px-1.5 py-0.5 text-white font-mono text-xs shadow-inner"
                />
              </div>
            </div>

            {/* Row 6: Sex & Weight */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1">
                <span className="w-12 px-1 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                  Sex
                </span>
                <div className="relative w-full">
                  <select
                    value={sex}
                    onChange={e => setSex(e.target.value as any)}
                    className="w-full bg-[#171a26] border border-[#485272] rounded px-1.5 py-0.5 text-white font-mono text-xs appearance-none cursor-pointer shadow-inner pr-4"
                  >
                    <option value="Male">M (Male)</option>
                    <option value="Female">F (Female)</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-gray-400">▼</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-10 px-1 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                  Weight
                </span>
                <div className="flex items-center w-full">
                  <input
                    type="text"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full bg-[#171a26] border border-[#485272] rounded-l px-1.5 py-0.5 text-white font-mono text-xs shadow-inner"
                  />
                  <span className="bg-[#383f58] border border-l-0 border-[#485272] px-1 py-0.5 text-[9px] text-gray-300 rounded-r">
                    kg
                  </span>
                </div>
              </div>
            </div>

            {/* Row 7: Comment */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                Comment
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="w-full bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-gray-200 font-mono text-xs shadow-inner pr-4"
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-gray-400">▼</span>
              </div>
            </div>

            {/* Row 8: Contrast (Dynamic Protocol Trigger) */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                Contrast
              </span>
              <div className="relative flex-1">
                <select
                  value={contrastOption}
                  onChange={e => {
                    playCanonAudioCue('click');
                    setContrastOption(e.target.value);
                  }}
                  className="w-full bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-cyan-300 font-mono text-xs appearance-none cursor-pointer shadow-inner pr-4 font-bold"
                >
                  <option value="Sem Contraste">Nativo (Sem Contraste) [S/C]</option>
                  <option value="Com Contraste Venoso (C/C)">Com Contraste Venoso [C/C]</option>
                  <option value="Bifásico (Pré + Pós Contraste C/C)">Bifásico (Pré + Pós Contraste C/C)</option>
                  <option value="Trifásico (Arterial + Portal + Tardia C/C)">Trifásico (Arterial + Portal + Tardia C/C)</option>
                  <option value="Angio-TC com Contraste">Angio-TC com Contraste [C/C]</option>
                  <option value="Duplo Contraste (Oral + IV)">Duplo Contraste (Oral + IV C/C)</option>
                  <option value="Todos">Todos os Exames (S/C e C/C)</option>
                </select>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-gray-400">▼</span>
              </div>
            </div>

            {/* Row 9: Organ (Dynamic Protocol Trigger) */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#626c91] to-[#4c5475] text-white text-[9px] font-bold text-center shrink-0 border border-[#7682aa] shadow-sm">
                Organ
              </span>
              <div className="relative flex-1">
                <select
                  value={organSelected}
                  onChange={e => {
                    playCanonAudioCue('click');
                    handleOrganChange(e.target.value);
                  }}
                  className="w-full bg-[#171a26] border border-[#485272] rounded px-2 py-0.5 text-amber-300 font-mono font-bold text-xs shadow-inner pr-4 cursor-pointer"
                >
                  <option value="Crânio">Crânio (Encéfalo)</option>
                  <option value="Mastóides / Ouvidos">Mastóides / Ouvidos (Rochedos)</option>
                  <option value="Seios da Face">Seios da Face (Face/Órbitas)</option>
                  <option value="Pescoço / Cervical">Pescoço / Cervical (Partes Moles)</option>
                  <option value="Tórax">Tórax (Pulmão/Mediastino/Coração)</option>
                  <option value="Abdômen e Pelve">Abdômen e Pelve (Fígado/Rins/Pelve)</option>
                  <option value="Coluna">Coluna (Cervical/Dorsal/Lombar)</option>
                  <option value="Membros / Extremidades">Membros / Extremidades (Articulações)</option>
                  <option value="Todos">Todos os Órgãos</option>
                </select>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-gray-400">▼</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons (Appoint., Exposure record, Detail, Clear, Emergency) */}
          <div className="grid grid-cols-5 gap-1 mt-2 pt-1.5 border-t border-[#5e688a] font-sans">
            <button
              onClick={() => playCanonAudioCue('click')}
              className="py-1 rounded bg-[#383f58] hover:bg-[#4a5374] text-white font-bold text-[9px] border border-[#5d688e] cursor-pointer shadow-sm active:scale-95"
            >
              Appoint.
            </button>
            <button
              onClick={() => playCanonAudioCue('click')}
              className="py-1 rounded bg-[#383f58] hover:bg-[#4a5374] text-white font-bold text-[9px] border border-[#5d688e] cursor-pointer shadow-sm active:scale-95"
            >
              Exposure
            </button>
            <button
              onClick={() => playCanonAudioCue('click')}
              className="py-1 rounded bg-[#383f58] hover:bg-[#4a5374] text-white font-bold text-[9px] border border-[#5d688e] cursor-pointer shadow-sm active:scale-95"
            >
              Detail
            </button>
            <button
              onClick={() => {
                playCanonAudioCue('click');
                setFirstName('');
                setMiddleName('');
                setLastName('');
                setCommentText('');
              }}
              className="py-1 rounded bg-[#383f58] hover:bg-[#4a5374] text-white font-bold text-[9px] border border-[#5d688e] cursor-pointer shadow-sm active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={handleEmergencyClick}
              className="py-1 rounded bg-red-600 hover:bg-red-500 text-white font-black text-[9px] border border-red-400 cursor-pointer shadow-md active:scale-95 animate-pulse"
              title="Carregar Caso de Emergência / Politrauma Imediato"
            >
              Emergency
            </button>
          </div>
        </div>

        {/* ==================== 3. TOP-RIGHT PANEL: DICOM / TOPOGRAM MONITOR ==================== */}
        <div className="col-span-12 lg:col-span-5 bg-black rounded-md border-2 border-[#1c1f2b] relative flex flex-col justify-between overflow-hidden shadow-2xl">
          
          {/* Top-Right Monitor Header / Mode Selector Tabs */}
          <div className="absolute top-1 left-2 z-20 flex items-center gap-1 bg-black/80 p-0.5 rounded border border-gray-800 font-mono text-[9px]">
            <button
              onClick={() => setActiveMonitorView('SCOUT')}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                activeMonitorView === 'SCOUT' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Topograma
            </button>
            <button
              onClick={() => setActiveMonitorView('GANTRY')}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                activeMonitorView === 'GANTRY' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Gantry 3D ({currentRpm} RPM)
            </button>
            <button
              onClick={() => setActiveMonitorView('LIVE_AXIAL')}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                activeMonitorView === 'LIVE_AXIAL' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Corte Axial
            </button>
          </div>

          {/* Close & Glossario Buttons on Top-Right Corner */}
          <div className="absolute top-1 right-2 z-30 flex items-center gap-1.5">
            <button
              onClick={() => {
                playCanonAudioCue('click');
                setShowGlossaryModal(true);
              }}
              className="px-2 py-0.5 rounded bg-[#1f2738] hover:bg-[#2c3850] text-cyan-300 font-bold text-[10px] border border-cyan-500/50 flex items-center gap-1 shadow cursor-pointer active:scale-95"
              title="Abrir Glossário Técnico de TC"
            >
              <span className="material-symbols-outlined text-xs">menu_book</span>
              <span>Glossário</span>
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] border border-red-400 flex items-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.7)] cursor-pointer active:scale-95"
              title="Fechar Console"
            >
              <span className="material-symbols-outlined text-xs font-bold leading-none">close</span>
              <span>FECHAR</span>
            </button>
          </div>

          {/* Main Visualizer Area */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center p-1">
            {/* View 1: Scout Topogram Image with Exact Canon Annotations */}
            {activeMonitorView === 'SCOUT' && (
              <div className="relative w-full h-full flex items-center justify-center bg-[#000000]">
                <img
                  src={selectedCase.images.sagittal}
                  alt="Canon Scout Topogram"
                  className="h-full w-auto object-contain filter contrast-125 opacity-90"
                />

                {/* Plan Box Overlay */}
                <div
                  className="absolute inset-x-12 border-2 border-dashed border-emerald-400 bg-emerald-500/10 pointer-events-none transition-all duration-150 flex flex-col justify-between"
                  style={{
                    top: `${Math.max(10, Math.min(45, 50 - (planStartMm / 300) * 40))}%`,
                    bottom: `${Math.max(10, Math.min(45, 50 + (planEndMm / 300) * 40))}%`
                  }}
                >
                  <div className="bg-emerald-950/90 text-emerald-300 font-mono text-[8px] font-bold px-1.5 py-0.2 border-b border-emerald-400 flex justify-between">
                    <span>START: +{planStartMm}mm</span>
                    <span>FOV: {fovDiameterMm}mm</span>
                  </div>
                  <div className="bg-emerald-950/90 text-emerald-300 font-mono text-[8px] font-bold px-1.5 py-0.2 border-t border-emerald-400 flex justify-between">
                    <span>END: {planEndMm}mm</span>
                    <span>160 Canais</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Animated CtGantrySimulator */}
            {activeMonitorView === 'GANTRY' && (
              <div className="w-full h-full">
                <CtGantrySimulator
                  isScanning={scanWorkflowStep === 'exposure'}
                  rotationSpeedSec={rotationSpeedSec}
                  tablePositionZ={tablePositionZ}
                  tableHeightMm={tableHeightMm}
                  gantryTiltAngle={gantryTiltAngle}
                  isLaserOn={isLaserOn}
                  exposureProgressPct={exposureProgressPct}
                  pitch={0.813}
                  kvp={scanKv}
                  ma={parseInt(scanMas) || 130}
                  currentSlice={reconstructedSliceCount}
                  totalSlices={dicomSlices.length || 32}
                  className="w-full h-full border-0 rounded-none"
                />
              </div>
            )}

            {/* View 3: Live Axial Canvas */}
            {activeMonitorView === 'LIVE_AXIAL' && (
              <div className="w-full h-full flex items-center justify-center bg-black relative">
                <canvas ref={liveCanvasRef} className="max-w-full max-h-full object-contain" />
                {scanWorkflowStep === 'exposure' && (
                  <div className="absolute bottom-2 inset-x-2 bg-black/80 p-1 rounded border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold flex justify-between">
                    <span>CORTES RECONSTRUÍDOS: {reconstructedSliceCount}</span>
                    <span className="animate-pulse text-amber-400">RAIO-X: {exposureProgressPct}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Exact Canon DICOM Metadata Text Overlays */}
            {/* Top-Left Yellow Annotations */}
            <div className="absolute top-7 left-3 z-10 font-mono text-[10px] text-yellow-300 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
              <div>348.283</div>
              <div>M ({fovDiameterMm}.00)</div>
              <div>{patientId}</div>
              <div>170.0mm</div>
              <div>+0.00</div>
            </div>

            {/* Top-Right Yellow/White Patient & Tube Annotations */}
            <div className="absolute top-7 right-3 z-10 font-mono text-[10px] text-right text-yellow-300 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
              <div className="font-bold text-white tracking-tight">{firstName} {middleName} {lastName}</div>
              <div className="text-gray-300">2023.01.19 10:00:01.861</div>
              <div>{scanKv} {scanMas}</div>
              <div>{rotationSpeedSec}/{sliceThicknessMm}/{collimation}</div>
              <div className="text-cyan-300">{pitchFactor}</div>
            </div>

            {/* Lateral Scale Bar & Orientation Markers */}
            <div className="absolute right-1 inset-y-16 w-3 flex flex-col justify-between items-center text-[8px] font-mono text-yellow-300 pointer-events-none">
              <span className="w-2 h-0.5 bg-yellow-300" />
              <span className="w-1 h-0.5 bg-yellow-300" />
              <span className="w-2 h-0.5 bg-yellow-300" />
              <span className="w-1 h-0.5 bg-yellow-300" />
              <span className="w-2 h-0.5 bg-yellow-300" />
            </div>

            <div className="absolute left-2 top-1/2 -translate-y-1/2 font-mono font-black text-yellow-300 text-xs pointer-events-none">
              R
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black text-yellow-300 text-xs pointer-events-none">
              L
            </div>

            {/* Bottom-Left Annotations */}
            <div className="absolute bottom-2 left-3 z-10 font-mono text-[9px] text-yellow-300 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
              <div>WL: -60</div>
              <div>WW: 150</div>
              <div className="text-white font-bold">Aquilion Lightning</div>
              <div>P</div>
            </div>

            {/* Bottom-Right Annotations */}
            <div className="absolute bottom-2 right-3 z-10 font-mono text-[9px] text-right text-yellow-300 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
              <div className="text-cyan-300 font-bold">SUREHybrid</div>
              <div>INTERP-3/{reconFilterKernel}/ORG/S</div>
              <div className="text-white font-bold">CLINIMAGEM PASSOS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== BOTTOM ROW: BODY MAP & PROTOCOL SELECTION MATRIX ===================== */}
      <div className="h-64 bg-[#424860] border-t-2 border-[#2b3042] p-1.5 grid grid-cols-12 gap-1.5 shrink-0 text-xs font-sans">
        
        {/* ==================== 1. BOTTOM-LEFT: ADULT / CHILD / TRAUMA & BODY SILHOUETTE ==================== */}
        <div className="col-span-12 md:col-span-4 bg-[#4c546e] rounded-md border border-[#646e8f] p-1.5 flex flex-col justify-between shadow-md">
          
          {/* Patient Category Tabs (Adult / Child / Trauma) */}
          <div className="grid grid-cols-3 gap-1 mb-1">
            {(['Adult', 'Child', 'Trauma'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  playCanonAudioCue('click');
                  setPatientCategory(cat);
                }}
                className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  patientCategory === cat
                    ? 'bg-gradient-to-r from-[#6e7aa4] to-[#556087] text-white border-cyan-400 shadow-md font-black'
                    : 'bg-[#292f44] text-gray-300 border-[#434d6e] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Interactive Anatomical Body Map Stage Matching Photograph */}
          <div className="flex-1 bg-[#23293d] rounded border border-[#485376] relative flex items-center justify-between p-1.5 overflow-hidden shadow-inner">
            
            {/* Quick selectors on left side with Human Pictograms */}
            <div className="flex flex-col gap-1.5 z-10">
              <button
                onClick={() => handleBodyRegionClick('HEAD')}
                className={`p-1 rounded border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  selectedBodyRegion === 'HEAD'
                    ? 'bg-[#3b476e] text-cyan-300 border-cyan-400 shadow'
                    : 'bg-[#2a3045] text-gray-300 border-[#475276]'
                }`}
                title="Whole Body Selection"
              >
                <span className="material-symbols-outlined text-base">person</span>
                <span className="text-[7px] font-bold">Whole</span>
              </button>

              <button
                onClick={() => handleBodyRegionClick('CHEST')}
                className={`p-1 rounded border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  selectedBodyRegion === 'CHEST'
                    ? 'bg-[#3b476e] text-cyan-300 border-cyan-400 shadow'
                    : 'bg-[#2a3045] text-gray-300 border-[#475276]'
                }`}
                title="Chest - Pelvis Selection"
              >
                <span className="material-symbols-outlined text-base">body_system</span>
                <span className="text-[7px] font-bold leading-none text-center">Chest<br/>-Pelvis</span>
              </button>
            </div>

            {/* Clickable Graphic Body Map Silhouette with Rectangular Glowing Overlays */}
            <div className="relative flex-1 h-full flex items-center justify-center">
              <div className="relative w-28 h-full flex flex-col items-center justify-center py-1">
                
                {/* 1. Head / Cranial Box */}
                <button
                  onClick={() => handleBodyRegionClick('HEAD')}
                  className={`w-20 h-14 rounded border-2 transition-all flex flex-col items-center justify-center cursor-pointer z-10 ${
                    selectedBodyRegion === 'HEAD'
                      ? 'bg-blue-500/40 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : 'bg-blue-600/15 border-blue-400/40 hover:bg-blue-500/30'
                  }`}
                  title="Selecionar Região: Crânio / Cabeça"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-300/40 border border-blue-200 mb-0.5" />
                  <span className="text-[7px] font-bold text-white tracking-tighter">CRÂNIO</span>
                </button>

                {/* 2. Chest / Thorax Box */}
                <button
                  onClick={() => handleBodyRegionClick('CHEST')}
                  className={`w-24 h-10 border-2 mt-0.5 transition-all flex items-center justify-center cursor-pointer z-10 ${
                    selectedBodyRegion === 'CHEST'
                      ? 'bg-blue-500/40 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : 'bg-blue-600/15 border-blue-400/40 hover:bg-blue-500/30'
                  }`}
                  title="Selecionar Região: Tórax"
                >
                  <span className="text-[7px] font-bold text-white tracking-tighter">TÓRAX</span>
                </button>

                {/* 3. Abdomen / Pelvis Box */}
                <button
                  onClick={() => handleBodyRegionClick('ABDOMEN')}
                  className={`w-24 h-12 border-2 mt-0.5 rounded-b-md transition-all flex items-center justify-center cursor-pointer z-10 ${
                    selectedBodyRegion === 'ABDOMEN'
                      ? 'bg-blue-500/40 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : 'bg-blue-600/15 border-blue-400/40 hover:bg-blue-500/30'
                  }`}
                  title="Selecionar Região: Abdômen e Pelve"
                >
                  <span className="text-[7px] font-bold text-white tracking-tighter">ABDÔMEN / PELVE</span>
                </button>

                {/* Lateral Arm/Extremity Selection Box on Right */}
                <button
                  onClick={() => handleBodyRegionClick('EXTREMITIES')}
                  className={`absolute right-0 top-12 w-6 h-20 border-2 transition-all flex items-center justify-center cursor-pointer ${
                    selectedBodyRegion === 'EXTREMITIES'
                      ? 'bg-blue-500/40 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                      : 'bg-blue-600/15 border-blue-400/40 hover:bg-blue-500/30'
                  }`}
                  title="Membros / Extremidades"
                >
                  <span className="text-[6px] font-bold text-white -rotate-90">ARM</span>
                </button>
              </div>
            </div>

            {/* Region Label Badge */}
            <div className="flex flex-col items-center gap-1 z-10">
              <span className="text-[8px] text-gray-300 font-bold">ÓRGÃO / REGIÃO:</span>
              <span className="px-2 py-0.5 rounded bg-[#1b2030] text-amber-300 font-mono font-black text-[10px] border border-amber-500/50 shadow truncate max-w-[90px]">
                {organSelected}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== 2. BOTTOM-RIGHT: PROTOCOL GROUP SELECTION MATRIX ==================== */}
        <div className="col-span-12 md:col-span-8 bg-[#4c546e] rounded-md border border-[#646e8f] p-1.5 flex flex-col justify-between shadow-md">
          
          {/* Protocol Group Tabs (Group A, Group B, Group C) + Protocol Type Legend */}
          <div className="flex items-center justify-between border-b border-[#5e6789] pb-1">
            <div className="flex items-center gap-1">
              {(['Group A', 'Group B', 'Group C'] as const).map(grp => (
                <button
                  key={grp}
                  onClick={() => {
                    playCanonAudioCue('click');
                    setSelectedProtocolGroup(grp);
                  }}
                  className={`px-3 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedProtocolGroup === grp
                      ? 'bg-gradient-to-r from-[#6e7aa4] to-[#556087] text-white border-cyan-400 shadow font-black'
                      : 'bg-[#292f44] text-gray-300 border-[#434d6e] hover:text-white'
                  }`}
                >
                  {grp}
                </button>
              ))}
              <span className="text-[9px] text-cyan-300 font-bold ml-2 font-mono bg-[#1b2030] px-2 py-0.5 rounded border border-cyan-500/30">
                {organSelected} • {contrastOption.includes('Sem') ? 'Sem Contraste (S/C)' : 'Com Contraste (C/C)'}
              </span>
            </div>

            {/* Legend as shown in top right of bottom panel */}
            <div className="hidden sm:flex items-center gap-3 text-[9px] font-mono text-gray-200">
              <span className="flex items-center gap-1">
                <span className="text-cyan-400">▲</span> Default Protocol
              </span>
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">◆</span> User Protocol
              </span>
              <span className="flex items-center gap-1">
                <span className="text-gray-300">●</span> Service Protocol
              </span>
            </div>
          </div>

          {/* Exact Canon Protocol Rows Table Matching Photograph with 2 Columns */}
          <div className="flex-1 my-1 overflow-y-auto space-y-1 font-mono text-xs pr-1">
            {fallbackProtocols.map(proto => (
              <div
                key={proto.id}
                onClick={() => handleSelectProtocolItem(proto)}
                className={`grid grid-cols-12 gap-1 items-center p-1 rounded border transition-all cursor-pointer ${
                  selectedProtocolId === proto.id
                    ? 'bg-gradient-to-r from-[#5a6792] via-[#48537a] to-[#384160] text-white border-cyan-300 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-[#2b3147] hover:bg-[#343b56] text-gray-200 border-[#454e6f]'
                }`}
              >
                {/* Column 1: Protocol Slot (Icon, Name, Code, Subtype, Contrast Tag) */}
                <div className="col-span-8 flex items-center justify-between gap-2 border-r border-[#4f597d] pr-2">
                  <div className="flex items-center gap-2 truncate">
                    {renderProtocolIcon(proto.iconType)}
                    <span className="font-bold tracking-tight text-[11px] truncate text-white">
                      {proto.name}
                    </span>
                    {proto.hasContrast ? (
                      <span className="px-1 py-0.2 rounded bg-purple-900/80 text-purple-200 text-[8px] font-black border border-purple-400">
                        C/C
                      </span>
                    ) : (
                      <span className="px-1 py-0.2 rounded bg-gray-800 text-gray-300 text-[8px] font-black border border-gray-600">
                        S/C
                      </span>
                    )}
                  </div>
                  <div className="text-right text-[10px] text-gray-300 shrink-0">
                    <span className="font-bold text-white">{proto.code}</span>
                    <span className="ml-2 text-gray-400">{proto.subType}</span>
                  </div>
                </div>

                {/* Column 2: Secondary Protocol Slot / Parameters */}
                <div className="col-span-4 flex items-center justify-between text-[10px] pl-1 font-bold">
                  <span className="text-amber-300">{proto.kv}</span>
                  <span className="text-white">{proto.mas}</span>
                  <span className="text-cyan-300">{proto.rotationSec}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Execution Bar (ScanPlan, eXam, Repeat, Stop, Start Scan Button) */}
          <div className="flex items-center justify-between pt-1 border-t border-[#5e6789] font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-300 font-bold">ScanPlan:</span>
              <span className="px-2 py-0.5 rounded bg-[#1e2335] text-cyan-300 font-bold border border-[#485272] shadow-inner">
                {organSelected} ({scanKv} / {scanMas} / {contrastOption.includes('Sem') ? 'S/C' : 'C/C'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playCanonAudioCue('click');
                  setIsEmergencyStopped(true);
                  if (exposureTimerRef.current) clearInterval(exposureTimerRef.current);
                }}
                className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-700 text-red-200 border border-red-500 font-bold cursor-pointer shadow active:scale-95"
              >
                STOP
              </button>

              {/* Start Scan Glowing Button */}
              <button
                onClick={handleStartScan}
                disabled={scanWorkflowStep === 'exposure'}
                className={`px-4 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95 ${
                  scanWorkflowStep === 'exposure'
                    ? 'bg-amber-500 text-black animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 text-slate-950 border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {scanWorkflowStep === 'exposure' ? 'motion_mode' : 'play_circle'}
                </span>
                <span>{scanWorkflowStep === 'exposure' ? 'EMISSÃO ATIVA...' : 'START SCAN (DISPARO)'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Radiology Technical Glossary Modal */}
      <RadiologyGlossaryModal
        isOpen={showGlossaryModal}
        onClose={() => setShowGlossaryModal(false)}
        initialTermId={glossaryTermId}
      />

    </div>
  );
};
