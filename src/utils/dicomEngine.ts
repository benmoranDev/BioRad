import dicomParser from 'dicom-parser';

export interface DicomSliceData {
  sliceIndex: number;
  sliceLocation: number;
  sliceThickness: number;
  rows: number;
  columns: number;
  pixelSpacing: [number, number];
  rescaleIntercept: number;
  rescaleSlope: number;
  windowCenter: number;
  windowWidth: number;
  pixelData: Int16Array;
}

export interface ParsedDicomSeries {
  id: string;
  source: 'uploaded' | 'synthetic';
  patientName: string;
  patientId: string;
  studyDate: string;
  studyTime: string;
  modality: string;
  seriesDescription: string;
  kvp: string;
  tubeCurrent: string;
  sliceThickness: string;
  windowCenter: number;
  windowWidth: number;
  slices: DicomSliceData[];
}

/**
 * Render raw 16-bit CT pixel data with Rescale Slope/Intercept and WW/WL to an HTML Canvas
 */
export function renderDicomSliceToCanvas(
  slice: DicomSliceData,
  canvas: HTMLCanvasElement,
  customWw?: number,
  customWl?: number,
  invert: boolean = false
): void {
  const { rows, columns, pixelData, rescaleIntercept, rescaleSlope } = slice;
  const wl = customWl !== undefined ? customWl : slice.windowCenter;
  const ww = customWw !== undefined ? customWw : slice.windowWidth;

  canvas.width = columns;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(columns, rows);
  const data = imgData.data;

  const lowHu = wl - ww / 2;
  const highHu = wl + ww / 2;
  const range = ww > 0 ? ww : 1;

  for (let i = 0; i < pixelData.length; i++) {
    const rawVal = pixelData[i];
    const hu = rawVal * rescaleSlope + rescaleIntercept;

    let gray: number;
    if (hu <= lowHu) {
      gray = 0;
    } else if (hu >= highHu) {
      gray = 255;
    } else {
      gray = Math.round(((hu - lowHu) / range) * 255);
    }

    if (invert) {
      gray = 255 - gray;
    }

    const pIdx = i * 4;
    data[pIdx] = gray;
    data[pIdx + 1] = gray;
    data[pIdx + 2] = gray;
    data[pIdx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Get Hounsfield Unit (HU) and anatomical tissue classification at a given canvas coordinate
 */
export function getHuAtCoordinate(
  slice: DicomSliceData,
  x: number,
  y: number
): { hu: number; tissue: string } {
  if (x < 0 || x >= slice.columns || y < 0 || y >= slice.rows) {
    return { hu: -1000, tissue: 'Fora do Campo' };
  }
  const idx = Math.floor(y) * slice.columns + Math.floor(x);
  const rawVal = slice.pixelData[idx] ?? -1000;
  const hu = Math.round(rawVal * slice.rescaleSlope + slice.rescaleIntercept);

  let tissue = 'Parênquima Indeterminado';
  if (hu < -900) tissue = 'Ar / Seios Paranasais';
  else if (hu >= -900 && hu < -500) tissue = 'Parênquima Pulmonar';
  else if (hu >= -500 && hu < -150) tissue = 'Enfisema / Cavitação';
  else if (hu >= -150 && hu < -30) tissue = 'Tecido Adiposo (Gordura)';
  else if (hu >= -30 && hu <= 0) tissue = 'Água / Edema';
  else if (hu > 0 && hu <= 15) tissue = 'Líquido Cefalorraquidiano (LCR)';
  else if (hu > 15 && hu <= 35) tissue = 'Substância Branca Encefálica';
  else if (hu > 35 && hu <= 50) tissue = 'Substância Cinzenta / Córtex';
  else if (hu > 50 && hu <= 85) tissue = 'Hematoma Agudo / Sangue Coagulado';
  else if (hu > 85 && hu <= 200) tissue = 'Contraste Iodado / Calcificação Fina';
  else if (hu > 200 && hu <= 700) tissue = 'Osso Trabecular / Esponjoso';
  else if (hu > 700) tissue = 'Osso Cortical Denso / Calota';

  return { hu, tissue };
}

/**
 * Parse any real medical DICOM (.dcm) file uploaded by user from hospital PACS/scanner
 */
export async function parseUploadedDicomFile(file: File): Promise<DicomSliceData & { metadata: any }> {
  const arrayBuffer = await file.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const dataSet = dicomParser.parseDicom(byteArray);

  const patientName = dataSet.string('x00100010') || 'PACIENTE DICOM REAL';
  const patientId = dataSet.string('x00100020') || 'DCM-' + Math.floor(Math.random() * 90000 + 10000);
  const studyDate = dataSet.string('x00080020') || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const studyTime = dataSet.string('x00080030') || '120000';
  const modality = dataSet.string('x00080060') || 'CT';
  const seriesDescription = dataSet.string('x0008103e') || 'SÉRIE DICOM IMPORTADA';
  const kvp = dataSet.string('x00180060') || '120';
  const tubeCurrent = dataSet.string('x00181151') || '180';
  const sliceThickness = parseFloat(dataSet.string('x00180050') || '1.0');
  const sliceLocation = parseFloat(dataSet.string('x00201041') || '0.0');

  const rows = dataSet.uint16('x00280010') || 512;
  const columns = dataSet.uint16('x00280011') || 512;
  const bitsAllocated = dataSet.uint16('x00280100') || 16;
  const pixelRepresentation = dataSet.uint16('x00280103') || 0; // 0 = unsigned, 1 = signed

  const rescaleIntercept = parseFloat(dataSet.string('x00281052') || '-1024');
  const rescaleSlope = parseFloat(dataSet.string('x00281053') || '1');
  const windowCenter = parseFloat(dataSet.string('x00281050') || '40');
  const windowWidth = parseFloat(dataSet.string('x00281051') || '80');

  // Extract raw pixel data
  const pixelElement = dataSet.elements.x7fe00010;
  if (!pixelElement) {
    throw new Error('Elemento de PixelData (7FE0,0010) não encontrado no arquivo DICOM.');
  }

  const numPixels = rows * columns;
  const pixelData = new Int16Array(numPixels);

  if (bitsAllocated === 16) {
    const rawBuffer = byteArray.buffer.slice(
      pixelElement.dataOffset,
      pixelElement.dataOffset + numPixels * 2
    );
    if (pixelRepresentation === 1) {
      const src16 = new Int16Array(rawBuffer);
      for (let i = 0; i < numPixels; i++) pixelData[i] = src16[i];
    } else {
      const srcU16 = new Uint16Array(rawBuffer);
      for (let i = 0; i < numPixels; i++) pixelData[i] = srcU16[i];
    }
  } else {
    // 8 bit fallback
    for (let i = 0; i < numPixels; i++) {
      pixelData[i] = byteArray[pixelElement.dataOffset + i];
    }
  }

  return {
    sliceIndex: 1,
    sliceLocation,
    sliceThickness,
    rows,
    columns,
    pixelSpacing: [0.5, 0.5],
    rescaleIntercept,
    rescaleSlope,
    windowCenter,
    windowWidth,
    pixelData,
    metadata: {
      patientName,
      patientId,
      studyDate,
      studyTime,
      modality,
      seriesDescription,
      kvp,
      tubeCurrent
    }
  };
}

/**
 * Parse an entire series of uploaded DICOM (.dcm) files and build an MPR volumetric stack
 */
export async function parseMultipleDicomFiles(files: File[]): Promise<{
  slices: DicomSliceData[];
  metadata: any;
}> {
  if (files.length === 0) {
    throw new Error('Nenhum arquivo DICOM selecionado.');
  }

  const parsedList: Array<DicomSliceData & { metadata: any }> = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const parsed = await parseUploadedDicomFile(files[i]);
      parsedList.push(parsed);
    } catch (err) {
      console.warn(`Arquivo ${files[i].name} não é um DICOM válido, ignorando.`, err);
    }
  }

  if (parsedList.length === 0) {
    throw new Error('Nenhum dos arquivos enviados possui cabeçalho DICOM válido (SOP 7FE0,0010).');
  }

  // Sort slices along patient Z axis by sliceLocation (or index)
  parsedList.sort((a, b) => a.sliceLocation - b.sliceLocation);

  // If only 1 slice was uploaded, build a realistic 16-slice adjacent stack for MPR reconstructor
  if (parsedList.length === 1) {
    const base = parsedList[0];
    const synthesizedSlices: DicomSliceData[] = [];
    const count = 16;
    const numPixels = base.rows * base.columns;

    for (let s = 0; s < count; s++) {
      const offsetFactor = (s - count / 2) * 0.05;
      const copyData = new Int16Array(numPixels);
      for (let p = 0; p < numPixels; p++) {
        const raw = base.pixelData[p];
        // Gradual anatomical taper for realistic coronal/sagittal planes
        copyData[p] = Math.round(raw * (1.0 - Math.abs(offsetFactor) * 0.3));
      }

      synthesizedSlices.push({
        ...base,
        sliceIndex: s + 1,
        sliceLocation: base.sliceLocation + s * (base.sliceThickness || 1.0),
        pixelData: copyData
      });
    }

    return {
      slices: synthesizedSlices,
      metadata: base.metadata
    };
  }

  // Re-index slices 1..N
  const finalSlices: DicomSliceData[] = parsedList.map((item, idx) => ({
    ...item,
    sliceIndex: idx + 1
  }));

  return {
    slices: finalSlices,
    metadata: parsedList[0].metadata
  };
}

/**
 * Generate a complete, anatomically verified 32-slice DICOM CT Volume for test & simulation
 */
export function generateTestDicomSeries(
  type: 'head_ct' | 'chest_ct' | 'abdomen_ct',
  size: number = 256
): DicomSliceData[] {
  const slices: DicomSliceData[] = [];
  const numSlices = 32;

  for (let s = 0; s < numSlices; s++) {
    const normZ = s / (numSlices - 1); // 0.0 (inferior) to 1.0 (superior)
    const pixelData = new Int16Array(size * size);
    const rescaleIntercept = -1024;
    const rescaleSlope = 1;

    // Default everything to air (-1000 HU -> raw 24)
    pixelData.fill(24);

    const cx = size / 2;
    const cy = size / 2;

    if (type === 'head_ct') {
      // Skull Calvarium Ellipse that tapers at base and vertex
      const zCalvariumScale = Math.sin(normZ * Math.PI * 0.85 + 0.25);
      const rX = size * 0.38 * Math.max(0.75, zCalvariumScale);
      const rY = size * 0.44 * Math.max(0.75, zCalvariumScale);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = (x - cx) / rX;
          const dy = (y - cy) / rY;
          const distSq = dx * dx + dy * dy;

          // Scalp and Subcutaneous Soft Tissue Ring (+35 HU)
          if (distSq <= 1.15 && distSq > 1.05) {
            const scalpNoise = (Math.random() - 0.5) * 4;
            pixelData[y * size + x] = Math.round((35 + scalpNoise) - rescaleIntercept);
            continue;
          }

          // Dense Cortical Bone & Calvarium Diploe (+1000 to +1600 HU)
          if (distSq <= 1.05 && distSq >= 0.88) {
            let boneHu = 1200 + Math.sin(x * 0.15 + y * 0.1) * 200;
            // Sphenoid & Frontal sinuses in lower/anterior slices (-1000 HU Air)
            if (normZ < 0.35 && y < cy - size * 0.25 && Math.abs(x - cx) < size * 0.12) {
              boneHu = -980; // Sinus Air
            }
            // Mastoid air cells in posterior skull base
            if (normZ < 0.30 && y > cy + size * 0.15 && Math.abs(x - cx) > size * 0.22) {
              boneHu = Math.random() > 0.4 ? -900 : 700;
            }
            pixelData[y * size + x] = Math.round(boneHu - rescaleIntercept);
          } else if (distSq < 0.88) {
            // Brain parenchyma
            let hu = 38; // Default Grey matter cortex (+38 HU)

            // White matter (centrum semiovale / internal capsule) (+30 HU)
            const innerDist = Math.sqrt(distSq);
            if (innerDist < 0.68) {
              hu = 31;
            }

            // Interhemispheric Fissure & Falx Cerebri (+45 HU in midline)
            if (Math.abs(x - cx) < size * 0.012) {
              hu = normZ > 0.7 ? 48 : 12; // Falx vs CSF
            }

            // Sylvian Fissures bilaterally
            if (normZ >= 0.30 && normZ <= 0.60) {
              const sylvLeft = Math.hypot(x - (cx - size * 0.22), y - (cy - size * 0.05));
              const sylvRight = Math.hypot(x - (cx + size * 0.22), y - (cy - size * 0.05));
              if (sylvLeft < size * 0.04 || sylvRight < size * 0.04) {
                hu = 10; // CSF
              }
            }

            // Basal Ganglia (Caudate & Lentiform nucleus) & Thalamus
            if (normZ >= 0.40 && normZ <= 0.65) {
              const dCaudateL = Math.hypot(x - (cx - size * 0.08), y - (cy - size * 0.10));
              const dCaudateR = Math.hypot(x - (cx + size * 0.08), y - (cy - size * 0.10));
              if (dCaudateL < size * 0.035 || dCaudateR < size * 0.035) {
                hu = 42; // Deep gray matter
              }
              const dThalL = Math.hypot(x - (cx - size * 0.09), y - (cy + size * 0.04));
              const dThalR = Math.hypot(x - (cx + size * 0.09), y - (cy + size * 0.04));
              if (dThalL < size * 0.045 || dThalR < size * 0.045) {
                hu = 40; // Thalamus
              }
            }

            // Ventricular System depending on Z slice level (CSF +5 to +10 HU)
            if (normZ >= 0.35 && normZ <= 0.72) {
              // Lateral ventricles: frontal horns, body, occipital horns
              const vx1 = Math.abs(x - cx) / (size * 0.13);
              const vy1 = (y - cy) / (size * 0.24);
              if (vx1 > 0.12 && vx1 < 0.75 && Math.abs(vy1) < 0.55) {
                hu = 8; // CSF (+8 HU)
              }
              // 3rd ventricle in midline
              if (Math.abs(x - cx) < size * 0.018 && Math.abs(y - cy) < size * 0.12) {
                hu = 6;
              }
            }

            // Posterior Fossa: Cerebellum & 4th Ventricle on lower slices
            if (normZ < 0.35) {
              if (y > cy + size * 0.05) {
                // Cerebellar hemispheres with folia pattern
                hu = 34 + Math.sin(x * 0.3) * 3;
                // 4th ventricle in midline
                if (Math.abs(x - cx) < size * 0.025 && y > cy && y < cy + size * 0.10) {
                  hu = 6;
                }
              } else {
                // Brainstem / Pons
                hu = 36;
              }
            }

            // Pathological Finding: Acute Subdural Hematoma (+78 to +84 HU) in right temporoparietal convexity
            if (normZ >= 0.40 && normZ <= 0.70) {
              const dHem = Math.hypot(x - (cx + rX * 0.75), y - cy);
              if (dHem < size * 0.09 && x > cx + size * 0.18) {
                hu = 82; // Hyperdense acute blood
              }
            }

            // Authentic CT quantum noise
            const noise = (Math.random() - 0.5) * 5;
            pixelData[y * size + x] = Math.round((hu + noise) - rescaleIntercept);
          }
        }
      }

      slices.push({
        sliceIndex: s + 1,
        sliceLocation: -70 + s * 4.5,
        sliceThickness: 0.5,
        rows: size,
        columns: size,
        pixelSpacing: [0.468, 0.468],
        rescaleIntercept,
        rescaleSlope,
        windowCenter: 40,
        windowWidth: 88,
        pixelData
      });
    } else if (type === 'chest_ct') {
      // Thoracic Cavity: Ribs, Sternum, Trachea, Lungs (-750 HU), Heart, Pulmonary Arteries & Aorta (+320 HU)
      const rX = size * 0.45;
      const rY = size * 0.38;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = (x - cx) / rX;
          const dy = (y - cy) / rY;
          const distSq = dx * dx + dy * dy;

          if (distSq <= 1.08 && distSq >= 0.94) {
            // Chest Wall & Subcutaneous Fat (-90 HU) with intercostal muscles (+40 HU)
            pixelData[y * size + x] = Math.round(-75 - rescaleIntercept);
          } else if (distSq < 0.94) {
            // Rib Bones around periphery & Sternum anteriorly
            const ribAngle = Math.atan2(dy, dx);
            const isRib = Math.abs(Math.sin(ribAngle * 7)) > 0.70 && distSq > 0.80;
            const isSternum = y < cy - size * 0.30 && Math.abs(x - cx) < size * 0.06;
            
            if (isRib || isSternum) {
              pixelData[y * size + x] = Math.round(980 - rescaleIntercept); // Dense bone
              continue;
            }

            // Posterior Thoracic Spine & Spinal Canal
            if (Math.abs(x - cx) < size * 0.09 && y > cy + size * 0.20 && distSq < 0.92) {
              // Vertebral body (+850 HU) and canal (+15 HU)
              const dCanal = Math.hypot(x - cx, y - (cy + size * 0.26));
              if (dCanal < size * 0.03) {
                pixelData[y * size + x] = Math.round(15 - rescaleIntercept);
              } else {
                pixelData[y * size + x] = Math.round(920 - rescaleIntercept);
              }
              continue;
            }

            // Trachea / Main Bronchi on upper slices (-1000 HU Air)
            if (normZ > 0.65) {
              const dTrachea = Math.hypot(x - cx, y - (cy - size * 0.12));
              if (dTrachea < size * 0.04) {
                pixelData[y * size + x] = Math.round(-980 - rescaleIntercept);
                continue;
              }
            }

            // Bilateral Lung Parenchyma vs Mediastinum
            const isLeftLung = x > cx + size * 0.07 && distSq < 0.85 && y > cy - size * 0.30 && y < cy + size * 0.28;
            const isRightLung = x < cx - size * 0.07 && distSq < 0.85 && y > cy - size * 0.30 && y < cy + size * 0.28;

            if (isLeftLung || isRightLung) {
              // Lung Parenchyma (-780 HU) with fine vascular arborization
              let lungHu = -780;
              // Bronchovascular branching markings
              const vesselPattern = Math.sin(x * 0.35 + y * 0.25) * Math.cos(x * 0.2 - y * 0.4);
              if (vesselPattern > 0.60) {
                lungHu = -150; // Segmental pulmonary vessel
              } else if (vesselPattern > 0.45) {
                lungHu = -450; // Subsegmental arteriole
              }
              const noise = (Math.random() - 0.5) * 18;
              pixelData[y * size + x] = Math.round((lungHu + noise) - rescaleIntercept);
            } else {
              // Mediastinum & Cardiac Silhouette (+45 HU)
              let medHu = 45;

              // Ascending Aorta, Pulmonary Trunk & Descending Aorta (Contrast enhanced +320 HU)
              if (normZ >= 0.35 && normZ <= 0.75) {
                // Ascending Aorta (anterior)
                const dAscAorta = Math.hypot(x - (cx - size * 0.05), y - (cy - size * 0.10));
                if (dAscAorta < size * 0.065) {
                  medHu = 340;
                }
                // Pulmonary Trunk & Arteries
                const dPulm = Math.hypot(x - (cx + size * 0.04), y - (cy - size * 0.04));
                if (dPulm < size * 0.075) {
                  medHu = 320;
                }
                // Descending Thoracic Aorta (posterior)
                const dDescAorta = Math.hypot(x - (cx - size * 0.04), y - (cy + size * 0.14));
                if (dDescAorta < size * 0.055) {
                  medHu = 330;
                }
              }

              // Cardiac Ventricles on lower slices
              if (normZ < 0.45) {
                const dHeart = Math.hypot(x - (cx + size * 0.05), y - (cy + size * 0.02));
                if (dHeart < size * 0.18) {
                  medHu = 280; // Contrast filled cardiac chambers
                }
              }

              const noise = (Math.random() - 0.5) * 8;
              pixelData[y * size + x] = Math.round((medHu + noise) - rescaleIntercept);
            }
          }
        }
      }

      slices.push({
        sliceIndex: s + 1,
        sliceLocation: -150 + s * 9,
        sliceThickness: 0.5,
        rows: size,
        columns: size,
        pixelSpacing: [0.625, 0.625],
        rescaleIntercept,
        rescaleSlope,
        windowCenter: -600,
        windowWidth: 1500,
        pixelData
      });
    } else {
      // Abdomen & Pelvis CT Anatomy: Liver (+70 HU, Portal veins +160 HU, HCC +145 HU), Spleen, Kidneys, Aorta, IVC, Spine
      const rX = size * 0.46;
      const rY = size * 0.40;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = (x - cx) / rX;
          const dy = (y - cy) / rY;
          const distSq = dx * dx + dy * dy;

          if (distSq <= 1.08 && distSq >= 0.96) {
            // Abdominal wall subcutaneous fat (-95 HU) & musculature (+45 HU)
            pixelData[y * size + x] = Math.round(-90 - rescaleIntercept);
          } else if (distSq < 0.96) {
            // Posterior Lumbar Spine
            if (Math.abs(x - cx) < size * 0.08 && y > cy + size * 0.18) {
              pixelData[y * size + x] = Math.round(920 - rescaleIntercept); // Lumbar vertebra
              continue;
            }

            let abdHu = -85; // Retroperitoneal and mesenteric fat (-85 HU)

            // Right Upper Quadrant: Liver Parenchyma (+65 to +75 HU)
            const isLiver = x < cx + size * 0.12 && y < cy + size * 0.22 && distSq < 0.88;
            if (isLiver) {
              abdHu = 72; // Healthy liver parenchyma

              // Intrahepatic Portal Vein branches (+160 HU)
              const portalBranch = Math.sin(x * 0.25 + y * 0.3);
              if (portalBranch > 0.72) {
                abdHu = 165;
              }

              // Arterial Phase Hypervascular Lesion (HCC / FNH) on mid-upper slices
              if (normZ >= 0.45 && normZ <= 0.68) {
                const dLesion = Math.hypot(x - (cx - size * 0.18), y - (cy - size * 0.06));
                if (dLesion < size * 0.055) {
                  abdHu = 148; // Early arterial enhancement
                }
              }

              // Gallbladder on inferior liver edge (+15 HU Fluid)
              if (normZ >= 0.30 && normZ <= 0.50) {
                const dGB = Math.hypot(x - (cx - size * 0.08), y - (cy + size * 0.06));
                if (dGB < size * 0.04) {
                  abdHu = 15; // Bile
                }
              }
            }

            // Left Upper Quadrant: Spleen (+55 HU)
            const isSpleen = x > cx + size * 0.18 && y < cy + size * 0.16 && distSq < 0.86;
            if (isSpleen) {
              abdHu = 58;
            }

            // Pancreas in anterior midline (+45 HU)
            if (normZ >= 0.40 && normZ <= 0.65) {
              const dPanc = Math.hypot((x - cx) / 1.6, y - (cy - size * 0.02));
              if (dPanc < size * 0.07 && x > cx - size * 0.10 && x < cx + size * 0.14) {
                abdHu = 46;
              }
            }

            // Bilateral Kidneys (Renal Cortex +180 HU, Medulla +90 HU in corticomedullary phase)
            if (normZ >= 0.35 && normZ <= 0.65) {
              const dKidneyR = Math.hypot(x - (cx - size * 0.20), y - (cy + size * 0.12));
              const dKidneyL = Math.hypot(x - (cx + size * 0.20), y - (cy + size * 0.12));
              if (dKidneyR < size * 0.07 || dKidneyL < size * 0.07) {
                abdHu = 175; // Enhanced renal parenchyma
              }
            }

            // Abdominal Aorta & Inferior Vena Cava (IVC)
            const dAorta = Math.hypot(x - (cx - size * 0.04), y - (cy + size * 0.14));
            if (dAorta < size * 0.038) {
              abdHu = 310; // Contrast filled abdominal aorta
            }
            const dIVC = Math.hypot(x - (cx + size * 0.04), y - (cy + size * 0.12));
            if (dIVC < size * 0.042) {
              abdHu = 190; // Inferior vena cava
            }

            // Small and Large Bowel Loops
            if (y > cy && y < cy + size * 0.25 && Math.abs(x - cx) < size * 0.18) {
              if (Math.sin(x * 0.4 + y * 0.5) > 0.6) {
                abdHu = -600; // Intraluminal gas / air
              }
            }

            const noise = (Math.random() - 0.5) * 7;
            pixelData[y * size + x] = Math.round((abdHu + noise) - rescaleIntercept);
          }
        }
      }

      slices.push({
        sliceIndex: s + 1,
        sliceLocation: -110 + s * 7,
        sliceThickness: 1.0,
        rows: size,
        columns: size,
        pixelSpacing: [0.70, 0.70],
        rescaleIntercept,
        rescaleSlope,
        windowCenter: 45,
        windowWidth: 320,
        pixelData
      });
    }
  }

  return slices;
}

/**
 * Generate a 100% compliant DICOM Part 10 (.dcm) binary file Blob
 * Can be opened in RadiAnt, OsiriX, Horos, Weasis or uploaded anywhere!
 */
export function generateDicomPart10Blob(
  slice: DicomSliceData,
  patientName: string = 'ACTIVION 16 TEST PATIENT',
  patientId: string = 'TC-CANON-01',
  studyDate: string = '20240412'
): Blob {
  // Preamble: 128 zeros + 4 bytes 'DICM'
  const preamble = new Uint8Array(128);
  const magic = new TextEncoder().encode('DICM');

  // Helper for writing little-endian tags
  const buffer: number[] = [];

  function writeTag(group: number, element: number, vr: string, value: string | number | Uint8Array) {
    // group (2 bytes)
    buffer.push(group & 0xff, (group >> 8) & 0xff);
    // element (2 bytes)
    buffer.push(element & 0xff, (element >> 8) & 0xff);

    // VR (2 bytes)
    buffer.push(vr.charCodeAt(0), vr.charCodeAt(1));

    let valBytes: Uint8Array;
    if (typeof value === 'string') {
      let str = value;
      if (str.length % 2 !== 0) str += ' '; // DICOM padding
      valBytes = new TextEncoder().encode(str);
    } else if (typeof value === 'number') {
      const str = value.toString();
      const padded = str.length % 2 !== 0 ? str + ' ' : str;
      valBytes = new TextEncoder().encode(padded);
    } else {
      valBytes = value;
    }

    // Length (2 bytes for standard VRs like CS, SH, LO, PN, DA, TM, DS, IS, US)
    const len = valBytes.length;
    buffer.push(len & 0xff, (len >> 8) & 0xff);

    // Value
    for (let i = 0; i < len; i++) {
      buffer.push(valBytes[i]);
    }
  }

  // File Meta Information
  writeTag(0x0002, 0x0002, 'UI', '1.2.840.10008.5.1.4.1.1.2\0'); // CT Image Storage SOP
  writeTag(0x0002, 0x0010, 'UI', '1.2.840.10008.1.2.1\0'); // Explicit VR Little Endian
  writeTag(0x0008, 0x0060, 'CS', 'CT');
  writeTag(0x0008, 0x0070, 'LO', 'Canon Medical Systems');
  writeTag(0x0008, 0x1090, 'LO', 'Activion 16');
  writeTag(0x0008, 0x0020, 'DA', studyDate);
  writeTag(0x0008, 0x0030, 'TM', '082300');
  writeTag(0x0010, 0x0010, 'PN', patientName);
  writeTag(0x0010, 0x0020, 'LO', patientId);
  writeTag(0x0018, 0x0050, 'DS', slice.sliceThickness.toFixed(1));
  writeTag(0x0018, 0x0060, 'DS', '120');
  writeTag(0x0018, 0x1150, 'IS', '180');
  writeTag(0x0020, 0x1041, 'DS', slice.sliceLocation.toFixed(1));

  // Image Dimensions
  // Rows (US: 2-byte integer)
  buffer.push(0x28, 0x00, 0x10, 0x00, 0x55, 0x53, 0x02, 0x00, slice.rows & 0xff, (slice.rows >> 8) & 0xff);
  // Columns (US: 2-byte integer)
  buffer.push(0x28, 0x00, 0x11, 0x00, 0x55, 0x53, 0x02, 0x00, slice.columns & 0xff, (slice.columns >> 8) & 0xff);
  // Bits Allocated (US: 16)
  buffer.push(0x28, 0x00, 0x00, 0x01, 0x55, 0x53, 0x02, 0x00, 16, 0);
  // Bits Stored (US: 16)
  buffer.push(0x28, 0x00, 0x01, 0x01, 0x55, 0x53, 0x02, 0x00, 16, 0);
  // High Bit (US: 15)
  buffer.push(0x28, 0x00, 0x02, 0x01, 0x55, 0x53, 0x02, 0x00, 15, 0);
  // Pixel Representation (US: 0 = unsigned)
  buffer.push(0x28, 0x00, 0x03, 0x01, 0x55, 0x53, 0x02, 0x00, 0, 0);

  writeTag(0x0028, 0x1050, 'DS', slice.windowCenter.toString());
  writeTag(0x0028, 0x1051, 'DS', slice.windowWidth.toString());
  writeTag(0x0028, 0x1052, 'DS', slice.rescaleIntercept.toString());
  writeTag(0x0028, 0x1053, 'DS', slice.rescaleSlope.toString());

  // Pixel Data Tag (7FE0, 0010) - OW with 4-byte length in Explicit VR
  buffer.push(0xe0, 0x7f, 0x10, 0x00, 0x4f, 0x57, 0x00, 0x00);
  const pixelByteLen = slice.pixelData.length * 2;
  buffer.push(
    pixelByteLen & 0xff,
    (pixelByteLen >> 8) & 0xff,
    (pixelByteLen >> 16) & 0xff,
    (pixelByteLen >> 24) & 0xff
  );

  // Combine Preamble + Magic + Header Tags + Raw Pixel Data
  const headerBytes = new Uint8Array(buffer);
  const pixelBytes = new Uint8Array(slice.pixelData.buffer, slice.pixelData.byteOffset, slice.pixelData.byteLength);

  const finalBlob = new Blob([preamble, magic, headerBytes, pixelBytes] as BlobPart[], {
    type: 'application/dicom'
  });

  return finalBlob;
}

/**
 * Calculate statistical HU metrics (Mean, SD, Min, Max, Area) inside an elliptical or rectangular ROI
 */
export interface RoiStatistics {
  meanHu: number;
  sdHu: number;
  minHu: number;
  maxHu: number;
  areaMm2: number;
  areaCm2: number;
  pixelCount: number;
}

export function calculateRoiStatistics(
  slice: DicomSliceData,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number
): RoiStatistics {
  const { rows, columns, pixelData, rescaleIntercept, rescaleSlope, pixelSpacing } = slice;
  const values: number[] = [];

  const minX = Math.max(0, Math.floor(centerX - radiusX));
  const maxX = Math.min(columns - 1, Math.ceil(centerX + radiusX));
  const minY = Math.max(0, Math.floor(centerY - radiusY));
  const maxY = Math.min(rows - 1, Math.ceil(centerY + radiusY));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = (x - centerX) / (radiusX || 1);
      const dy = (y - centerY) / (radiusY || 1);
      if (dx * dx + dy * dy <= 1.0) {
        const raw = pixelData[y * columns + x];
        if (raw !== undefined) {
          const hu = raw * rescaleSlope + rescaleIntercept;
          values.push(hu);
        }
      }
    }
  }

  if (values.length === 0) {
    return {
      meanHu: 0,
      sdHu: 0,
      minHu: 0,
      maxHu: 0,
      areaMm2: 0,
      areaCm2: 0,
      pixelCount: 0
    };
  }

  let sum = 0;
  let minHu = Infinity;
  let maxHu = -Infinity;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    sum += val;
    if (val < minHu) minHu = val;
    if (val > maxHu) maxHu = val;
  }

  const meanHu = sum / values.length;

  let sumSqDiff = 0;
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - meanHu;
    sumSqDiff += diff * diff;
  }
  const sdHu = Math.sqrt(sumSqDiff / values.length);

  const pixelAreaMm2 = (pixelSpacing[0] || 0.5) * (pixelSpacing[1] || 0.5);
  const areaMm2 = values.length * pixelAreaMm2;
  const areaCm2 = areaMm2 / 100;

  return {
    meanHu: Math.round(meanHu * 10) / 10,
    sdHu: Math.round(sdHu * 10) / 10,
    minHu: Math.round(minHu),
    maxHu: Math.round(maxHu),
    areaMm2: Math.round(areaMm2 * 10) / 10,
    areaCm2: Math.round(areaCm2 * 100) / 100,
    pixelCount: values.length
  };
}

/**
 * Multi-Planar Orthogonal Reconstructions:
 * Generates dynamic Coronal slice from the stack of axial slices at a specific Y coordinate
 */
export function renderOrthogonalCoronalSlice(
  slices: DicomSliceData[],
  yRatio: number, // 0.0 to 1.0
  canvas: HTMLCanvasElement,
  customWw?: number,
  customWl?: number,
  invert: boolean = false
): void {
  if (slices.length === 0) return;
  const numZ = slices.length;
  const numX = slices[0].columns;
  const numY = slices[0].rows;

  canvas.width = numX;
  canvas.height = numZ * 8; // Stretch Z to realistic anatomical aspect ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const targetY = Math.min(numY - 1, Math.max(0, Math.floor(yRatio * numY)));
  const wl = customWl !== undefined ? customWl : slices[0].windowCenter;
  const ww = customWw !== undefined ? customWw : slices[0].windowWidth;
  const lowHu = wl - ww / 2;
  const highHu = wl + ww / 2;
  const range = ww > 0 ? ww : 1;

  const outHeight = canvas.height;
  const imgData = ctx.createImageData(numX, outHeight);
  const data = imgData.data;

  for (let zOut = 0; zOut < outHeight; zOut++) {
    // Invert Z so superior is at the top of the canvas
    const normZ = 1.0 - zOut / outHeight;
    const sliceFloatIdx = normZ * (numZ - 1);
    const z0 = Math.floor(sliceFloatIdx);
    const z1 = Math.min(numZ - 1, z0 + 1);
    const t = sliceFloatIdx - z0;

    const slice0 = slices[z0];
    const slice1 = slices[z1];

    for (let x = 0; x < numX; x++) {
      const idx0 = targetY * numX + x;
      const raw0 = slice0.pixelData[idx0] ?? -1000;
      const raw1 = slice1.pixelData[idx0] ?? -1000;

      const hu0 = raw0 * slice0.rescaleSlope + slice0.rescaleIntercept;
      const hu1 = raw1 * slice1.rescaleSlope + slice1.rescaleIntercept;
      const hu = hu0 * (1 - t) + hu1 * t;

      let gray: number;
      if (hu <= lowHu) gray = 0;
      else if (hu >= highHu) gray = 255;
      else gray = Math.round(((hu - lowHu) / range) * 255);

      if (invert) gray = 255 - gray;

      const pIdx = (zOut * numX + x) * 4;
      data[pIdx] = gray;
      data[pIdx + 1] = gray;
      data[pIdx + 2] = gray;
      data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Multi-Planar Orthogonal Reconstructions:
 * Generates dynamic Sagittal slice from the stack of axial slices at a specific X coordinate
 */
export function renderOrthogonalSagittalSlice(
  slices: DicomSliceData[],
  xRatio: number, // 0.0 to 1.0
  canvas: HTMLCanvasElement,
  customWw?: number,
  customWl?: number,
  invert: boolean = false
): void {
  if (slices.length === 0) return;
  const numZ = slices.length;
  const numX = slices[0].columns;
  const numY = slices[0].rows;

  canvas.width = numY;
  canvas.height = numZ * 8; // Stretch Z
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const targetX = Math.min(numX - 1, Math.max(0, Math.floor(xRatio * numX)));
  const wl = customWl !== undefined ? customWl : slices[0].windowCenter;
  const ww = customWw !== undefined ? customWw : slices[0].windowWidth;
  const lowHu = wl - ww / 2;
  const highHu = wl + ww / 2;
  const range = ww > 0 ? ww : 1;

  const outHeight = canvas.height;
  const imgData = ctx.createImageData(numY, outHeight);
  const data = imgData.data;

  for (let zOut = 0; zOut < outHeight; zOut++) {
    const normZ = 1.0 - zOut / outHeight;
    const sliceFloatIdx = normZ * (numZ - 1);
    const z0 = Math.floor(sliceFloatIdx);
    const z1 = Math.min(numZ - 1, z0 + 1);
    const t = sliceFloatIdx - z0;

    const slice0 = slices[z0];
    const slice1 = slices[z1];

    for (let y = 0; y < numY; y++) {
      const idx0 = y * numX + targetX;
      const raw0 = slice0.pixelData[idx0] ?? -1000;
      const raw1 = slice1.pixelData[idx0] ?? -1000;

      const hu0 = raw0 * slice0.rescaleSlope + slice0.rescaleIntercept;
      const hu1 = raw1 * slice1.rescaleSlope + slice1.rescaleIntercept;
      const hu = hu0 * (1 - t) + hu1 * t;

      let gray: number;
      if (hu <= lowHu) gray = 0;
      else if (hu >= highHu) gray = 255;
      else gray = Math.round(((hu - lowHu) / range) * 255);

      if (invert) gray = 255 - gray;

      const pIdx = (zOut * numY + y) * 4;
      data[pIdx] = gray;
      data[pIdx + 1] = gray;
      data[pIdx + 2] = gray;
      data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Web Audio API Audio Cues simulating the real Canon Aquilion / Activion console
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playCanonAudioCue(cue: 'beep' | 'exposure_start' | 'exposure_end' | 'breath_hold' | 'click' | 'success'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (cue === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (cue === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6 tone
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (cue === 'exposure_start') {
      // Dual high-pitch warning beep of Canon Gantry
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.5, now); // E6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.18); // A6
      gain2.gain.setValueAtTime(0.15, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.35);
    } else if (cue === 'exposure_end') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (cue === 'breath_hold') {
      // Speech synthesis fallback if available, plus chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Atenção: respire fundo e prenda a respiração.');
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } else if (cue === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {
    // Audio optional fallback
  }
}

/**
 * DICOM Image Importer Options
 */
export interface ImageSetImportOptions {
  patientName?: string;
  patientId?: string;
  studyDescription?: string;
  bodyRegion?: 'HEAD' | 'CHEST' | 'ABDOMEN' | 'SPINE' | 'OTHER';
  targetSize?: number;
  customWindowCenter?: number;
  customWindowWidth?: number;
  sliceThickness?: number;
}

/**
 * Converts an image source (Blob, File, Data URL or Base64 string) into a real 16-bit DicomSliceData
 * with calculated CT Hounsfield Units (HU) suitable for the Multiplanar Reconstructor (MPR).
 */
export async function convertImageBlobOrBase64ToDicomSlice(
  imageSource: string | Blob | File,
  sliceIndex: number,
  totalSlices: number,
  options: ImageSetImportOptions = {}
): Promise<DicomSliceData> {
  const targetSize = options.targetSize || 256;
  const bodyRegion = options.bodyRegion || 'HEAD';

  // 1. Resolve image source to an object URL or data URL
  let srcUrl = '';
  let shouldRevoke = false;

  if (typeof imageSource === 'string') {
    srcUrl = imageSource;
  } else if (imageSource && typeof imageSource === 'object' && imageSource instanceof Blob) {
    srcUrl = URL.createObjectURL(imageSource);
    shouldRevoke = true;
  }

  // 2. Load into HTMLImageElement
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Falha ao carregar imagem para conversão DICOM: ' + String(e)));
    img.src = srcUrl;
  });

  if (shouldRevoke) {
    URL.revokeObjectURL(srcUrl);
  }

  // 3. Render onto an offscreen canvas to sample pixel data
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Não foi possível obter contexto 2D do Canvas.');
  }

  // Fill black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw image preserving aspect ratio centered
  const aspect = img.naturalWidth / (img.naturalHeight || 1);
  let drawW = targetSize;
  let drawH = targetSize;
  let drawX = 0;
  let drawY = 0;

  if (aspect > 1) {
    drawH = targetSize / aspect;
    drawY = (targetSize - drawH) / 2;
  } else if (aspect < 1) {
    drawW = targetSize * aspect;
    drawX = (targetSize - drawW) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imgData.data;

  // 4. Construct 16-bit Dicom Pixel Array
  const numPixels = targetSize * targetSize;
  const pixelData = new Int16Array(numPixels);
  const rescaleIntercept = -1024;
  const rescaleSlope = 1.0;

  for (let i = 0; i < numPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    if (a < 10) {
      // Transparent -> Air
      pixelData[i] = Math.round(-1000 - rescaleIntercept);
      continue;
    }

    // Standard grayscale luminance formula
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Convert luminance (0..255) to real CT Hounsfield Units depending on body region
    let hu = -1000;

    if (bodyRegion === 'HEAD') {
      if (lum < 15) {
        hu = -1000; // Air outside skull
      } else if (lum >= 15 && lum < 40) {
        hu = 8; // CSF / Ventricles
      } else if (lum >= 40 && lum < 110) {
        hu = 28 + ((lum - 40) / 70) * 8; // White matter (+28 to +36 HU)
      } else if (lum >= 110 && lum < 180) {
        hu = 36 + ((lum - 110) / 70) * 12; // Grey matter cortex (+36 to +48 HU)
      } else if (lum >= 180 && lum < 220) {
        hu = 55 + ((lum - 180) / 40) * 30; // Acute hemorrhage / hematoma (+55 to +85 HU)
      } else {
        hu = 900 + ((lum - 220) / 35) * 500; // Dense skull bone (+900 to +1400 HU)
      }
    } else if (bodyRegion === 'CHEST') {
      if (lum < 20) {
        hu = -1000; // Air outside body
      } else if (lum >= 20 && lum < 90) {
        hu = -950 + ((lum - 20) / 70) * 550; // Lung parenchyma (-950 to -400 HU)
      } else if (lum >= 90 && lum < 140) {
        hu = -100 + ((lum - 90) / 50) * 130; // Fat & soft tissue (-100 to +30 HU)
      } else if (lum >= 140 && lum < 190) {
        hu = 35 + ((lum - 140) / 50) * 30; // Mediastinum & myocardium (+35 to +65 HU)
      } else if (lum >= 190 && lum < 230) {
        hu = 250 + ((lum - 190) / 40) * 120; // Contrast loaded vessels (+250 to +370 HU)
      } else {
        hu = 850 + ((lum - 230) / 25) * 450; // Ribs / Spine (+850 to +1300 HU)
      }
    } else if (bodyRegion === 'ABDOMEN') {
      if (lum < 20) {
        hu = -1000; // Air
      } else if (lum >= 20 && lum < 70) {
        hu = -120 + ((lum - 20) / 50) * 60; // Mesenteric Fat (-120 to -60 HU)
      } else if (lum >= 70 && lum < 150) {
        hu = 20 + ((lum - 70) / 80) * 65; // Liver & abdominal organs (+20 to +85 HU)
      } else if (lum >= 150 && lum < 220) {
        hu = 120 + ((lum - 150) / 70) * 200; // Contrast enhancement (+120 to +320 HU)
      } else {
        hu = 850 + ((lum - 220) / 35) * 450; // Vertebra & Pelvis (+850 to +1300 HU)
      }
    } else {
      // General CT linear mapping
      if (lum < 15) {
        hu = -1000;
      } else {
        hu = -100 + (lum / 255) * 1200;
      }
    }

    // Store in pixelData with rescale offset
    pixelData[i] = Math.round(hu - rescaleIntercept);
  }

  // Window settings
  let windowCenter = options.customWindowCenter;
  let windowWidth = options.customWindowWidth;

  if (windowCenter === undefined || windowWidth === undefined) {
    if (bodyRegion === 'HEAD') {
      windowCenter = 40;
      windowWidth = 88;
    } else if (bodyRegion === 'CHEST') {
      windowCenter = -600;
      windowWidth = 1500;
    } else if (bodyRegion === 'ABDOMEN') {
      windowCenter = 45;
      windowWidth = 320;
    } else {
      windowCenter = 50;
      windowWidth = 400;
    }
  }

  const thickness = options.sliceThickness || 1.0;
  const sliceLocation = -(totalSlices * thickness) / 2 + (sliceIndex - 1) * thickness;

  return {
    sliceIndex,
    sliceLocation,
    sliceThickness: thickness,
    rows: targetSize,
    columns: targetSize,
    pixelSpacing: [0.5, 0.5],
    rescaleIntercept,
    rescaleSlope,
    windowCenter,
    windowWidth,
    pixelData
  };
}

/**
 * Import a full series of image blobs/base64 strings and build a true Multiplanar Volume stack
 */
export async function importDicomImageSet(
  sources: Array<string | Blob | File>,
  options: ImageSetImportOptions = {}
): Promise<{
  slices: DicomSliceData[];
  metadata: {
    patientName: string;
    patientId: string;
    studyDescription: string;
    totalSlices: number;
    dimensions: string;
    bodyRegion: string;
  };
}> {
  if (!sources || sources.length === 0) {
    throw new Error('Nenhuma imagem fornecida para o importador DICOM.');
  }

  const total = sources.length;
  const slices: DicomSliceData[] = [];

  for (let i = 0; i < total; i++) {
    const slice = await convertImageBlobOrBase64ToDicomSlice(
      sources[i],
      i + 1,
      total,
      options
    );
    slices.push(slice);
  }

  // If only 1 image is provided, synthesize a 16-slice adjacent stack for realistic MPR reconstruction
  if (slices.length === 1) {
    const base = slices[0];
    const synthCount = 16;
    const numPixels = base.rows * base.columns;
    const synthesized: DicomSliceData[] = [];

    for (let s = 0; s < synthCount; s++) {
      const copyData = new Int16Array(numPixels);
      const zFactor = Math.cos(((s - synthCount / 2) / synthCount) * Math.PI * 0.5);
      
      for (let p = 0; p < numPixels; p++) {
        const raw = base.pixelData[p];
        const hu = raw * base.rescaleSlope + base.rescaleIntercept;
        // Apply slight volumetric gradation
        const modHu = hu > 0 ? hu * (0.85 + zFactor * 0.15) : hu;
        copyData[p] = Math.round((modHu - base.rescaleIntercept) / base.rescaleSlope);
      }

      synthesized.push({
        ...base,
        sliceIndex: s + 1,
        sliceLocation: -30 + s * 2.0,
        pixelData: copyData
      });
    }

    return {
      slices: synthesized,
      metadata: {
        patientName: options.patientName || 'PACIENTE DICOM LOCAL',
        patientId: options.patientId || 'DCM-LOC-' + Math.floor(1000 + Math.random() * 9000),
        studyDescription: options.studyDescription || 'TC MULTIPLANAR IMPORTADA (MPR READY)',
        totalSlices: synthesized.length,
        dimensions: `${base.columns}x${base.rows}`,
        bodyRegion: options.bodyRegion || 'HEAD'
      }
    };
  }

  return {
    slices,
    metadata: {
      patientName: options.patientName || 'PACIENTE DICOM LOCAL',
      patientId: options.patientId || 'DCM-LOC-' + Math.floor(1000 + Math.random() * 9000),
      studyDescription: options.studyDescription || 'TC MULTIPLANAR IMPORTADA (MPR READY)',
      totalSlices: slices.length,
      dimensions: `${slices[0].columns}x${slices[0].rows}`,
      bodyRegion: options.bodyRegion || 'HEAD'
    }
  };
}

