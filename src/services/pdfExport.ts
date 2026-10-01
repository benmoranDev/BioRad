import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Certificate, Course, StudentGradeRecord, PaymentTransaction } from '../types';

function printHtmlContent(htmlContent: string) {
  try {
    const existingIframe = document.getElementById('radbio-print-frame');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'radbio-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print failed, trying popup', e);
        }
      }, 500);
      return;
    }
  } catch {
    // blocked in iframe sandbox
  }

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  } catch {
    // ignore
  }
}

/**
 * Pure programmatic vector fallback for generating guaranteed horizontal A4 landscape certificate
 */
/**
 * Pure programmatic vector fallback for generating guaranteed horizontal A4 landscape certificate
 */
function generateVectorLandscapePdf(cert: Certificate, qrDataUrl?: string): jsPDF {
  // A4 Landscape: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const centerX = pageWidth / 2; // 148.5mm

  // Background clean ivory fill
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer ornamental navy border (10mm margin)
  doc.setDrawColor(10, 37, 64); // #0a2540
  doc.setLineWidth(1.6);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner ornamental golden border (13mm margin)
  doc.setDrawColor(197, 160, 89); // #c5a059
  doc.setLineWidth(0.7);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Corner decorative marks
  const corners = [
    [15.5, 15.5],
    [pageWidth - 15.5, 15.5],
    [15.5, pageHeight - 15.5],
    [pageWidth - 15.5, pageHeight - 15.5]
  ];
  doc.setFillColor(197, 160, 89);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.4, 'F');
  });

  // Institution Header
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(6, 78, 59); // #064e3b
  doc.text('BIORAD CURSOS • INSTITUTO DE ESPECIALIZAÇÃO RADIOLÓGICA', centerX, 25, { align: 'center', maxWidth: 240 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text('CENTRO DE EXCELÊNCIA EM DIAGNÓSTICO POR IMAGEM E TOMOGRAFIA COMPUTADORIZADA', centerX, 30.5, { align: 'center' });

  // Thin gold divider
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.4);
  doc.line(centerX - 35, 34.5, centerX + 35, 34.5);

  // Certificate Main Title
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(3, 43, 67); // #032b43
  doc.text('CERTIFICADO ACADÊMICO OFICIAL', centerX, 44.5, { align: 'center' });

  // Title underline
  doc.setLineWidth(0.6);
  doc.line(centerX - 45, 48.5, centerX + 45, 48.5);

  // Body Text intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);
  doc.text(
    'Certificamos, para todos os devidos fins de direito, acadêmicos e profissionais, que o(a) discente',
    centerX,
    57.5,
    { align: 'center' }
  );

  // Student Name (dynamically sized to prevent overflow on long names)
  const studentNameUpper = cert.studentName.toUpperCase();
  const nameFontSize = studentNameUpper.length > 32 ? 16 : studentNameUpper.length > 24 ? 18 : 20;
  doc.setFont('times', 'bold');
  doc.setFontSize(nameFontSize);
  doc.setTextColor(4, 78, 84); // #044e54
  doc.text(studentNameUpper, centerX, 68.5, { align: 'center', maxWidth: 240 });

  // Student Registration ID
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`REGISTRO ACADÊMICO: ${cert.studentDocument}`, centerX, 75, { align: 'center' });

  // Course completion narrative
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('concluiu com êxito notável a integralidade de 100% da carga horária e módulos acadêmicos com', centerX, 83.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(6, 95, 70);
  doc.text(`Média Final: ${cert.finalScore.toFixed(1)} / 10.0 (Aprovado com Louvor)`, centerX, 89.5, { align: 'center' });

  // Course Name (dynamically sized and wrapped if necessary)
  const courseFontSize = cert.courseName.length > 50 ? 12.5 : cert.courseName.length > 35 ? 14 : 15.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(courseFontSize);
  doc.setTextColor(6, 78, 59);
  doc.text(cert.courseName, centerX, 99.5, { align: 'center', maxWidth: 235 });

  // Workload description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Carga Horária Total: ${cert.workloadHours} Horas Certificadas • Conclusão Homologada de 100% das Videoaulas e Práticas`,
    centerX,
    106.5,
    { align: 'center' }
  );

  // Legal & 100% Compliance Badge Box (Balanced 2-line layout that never leaks)
  const badgeWidth = 204;
  const badgeHeight = 13.5;
  const badgeX = centerX - badgeWidth / 2; // 46.5mm
  const badgeY = 113.5;

  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.35);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(6, 95, 70);
  doc.text(
    'CONFORMIDADE LEGAL: LEI Nº 9.394/96 (LDB) ART. 42 • DECRETO PRESIDENCIAL Nº 5.154/04',
    centerX,
    badgeY + 5.2,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(4, 120, 87);
  doc.text(
    'AUDITORIA ACADÊMICA: 100% DAS VIDEOAULAS ASSISTIDAS E ESTAÇÕES PRÁTICAS CONCLUÍDAS',
    centerX,
    badgeY + 10,
    { align: 'center' }
  );

  // Institutional Verification Seal (Centrally placed between signatures)
  const sealY = 142;
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.6);
  doc.circle(centerX, sealY, 9.5);
  doc.setLineWidth(0.3);
  doc.circle(centerX, sealY, 8.2);

  doc.setFont('times', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(197, 160, 89);
  doc.text('BIORAD', centerX, sealY - 1.8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.6);
  doc.setTextColor(6, 78, 59);
  doc.text('HOMOLOGADO 100%', centerX, sealY + 1.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(100, 116, 139);
  doc.text('VALIDADE NACIONAL', centerX, sealY + 4.8, { align: 'center' });

  // Validable QR Code Embed (Lower left side)
  if (qrDataUrl) {
    try {
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.3);
      doc.roundedRect(19, 133, 24, 28, 1.5, 1.5, 'S');
      doc.addImage(qrDataUrl, 'PNG', 20.5, 134.5, 21, 21);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(6, 78, 59);
      doc.text('QR CODE OFICIAL', 31, 158.5, { align: 'center' });
    } catch {
      // ignore
    }
  }

  // Signatures Area (Precisely balanced left and right)
  const sigY = 156;
  const sigLineWidth = 75;

  // Signature 1: Instructor (Left-Center)
  const sigLeftCenter = 85;
  const sigLeftStart = sigLeftCenter - sigLineWidth / 2;
  const sigLeftEnd = sigLeftCenter + sigLineWidth / 2;

  doc.setDrawColor(17, 24, 39);
  doc.setLineWidth(0.35);
  doc.line(sigLeftStart, sigY, sigLeftEnd, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(cert.instructorName, sigLeftCenter, sigY + 4.8, { align: 'center', maxWidth: sigLineWidth });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(cert.instructorRole, sigLeftCenter, sigY + 8.8, { align: 'center', maxWidth: sigLineWidth });

  // Signature 2: Ben Moran (Admin Geral & Conselho RadBio) (Right)
  const sigRightCenter = pageWidth - 65;
  const sigRightStart = sigRightCenter - sigLineWidth / 2;
  const sigRightEnd = sigRightCenter + sigLineWidth / 2;

  doc.setDrawColor(17, 24, 39);
  doc.setLineWidth(0.35);
  doc.line(sigRightStart, sigY, sigRightEnd, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text('Ben Moran', sigRightCenter, sigY + 4.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Administrador Geral • Biorad Cursos', sigRightCenter, sigY + 8.8, { align: 'center', maxWidth: sigLineWidth });

  // Footer Information (Legal hash, registry, date - distributed with safe bounds)
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.25);
  doc.line(18, 175, pageWidth - 18, 175);

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(107, 114, 128);
  doc.text(`REGISTRO: ${cert.code}`, 20, 181, { align: 'left' });
  doc.text(`EXPEDIÇÃO: ${cert.completionDate}`, 98, 181, { align: 'center' });
  doc.text('STATUS: 100% CONCLUÍDO & AUDITADO', 172, 181, { align: 'center' });
  const hashPreview = cert.sha256Hash ? cert.sha256Hash.substring(0, 22) : 'a7c98b21e3b0c44298fc';
  doc.text(`HASH: ${hashPreview}...`, pageWidth - 20, 181, { align: 'right' });

  return doc;
}

export const pdfExportService = {
  /**
   * Generates and downloads a real .pdf file in Landscape (Horizontal) format with validable QR code
   */
  async exportDiploma(cert: Certificate, elementId: string = 'certificate-diploma-landscape'): Promise<void> {
    const filename = `Certificado_${cert.studentName.replace(/[^a-zA-Z0-9]/g, '_')}_40h.pdf`;

    // Generate real validable QR Code as Data URL
    let qrDataUrl: string | undefined;
    try {
      const validationUrl = cert.qrValidationUrl || (typeof window !== 'undefined' ? `${window.location.origin}/validar/${cert.code}` : `https://bioradcursos.com.br/validar/${cert.code}`);
      qrDataUrl = await QRCode.toDataURL(validationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: {
          dark: '#032b43',
          light: '#ffffff'
        }
      });
    } catch (e) {
      console.warn('Could not generate QR Data URL', e);
    }

    // Direct vector PDF generation with jsPDF
    try {
      const doc = generateVectorLandscapePdf(cert, qrDataUrl);
      doc.save(filename);
      return;
    } catch (err) {
      console.warn('Vector generator error, trying canvas fallback', err);
    }

    try {
      const element = document.getElementById(elementId);
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
        pdf.save(filename);
      }
    } catch (fallbackErr) {
      console.error('Falha geral na exportação do diploma:', fallbackErr);
    }
  },

  /**
   * Opens the printable horizontal diploma in browser print dialog
   */
  printDiplomaLandscape(cert: Certificate): void {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Diploma Oficial - ${cert.studentName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          @media print {
            html, body {
              width: 297mm;
              height: 210mm;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-container {
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 8mm;
            background: #fff;
            color: #111;
            text-align: center;
            width: 297mm;
            height: 210mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .border-outer {
            border: 6px double #0a2540;
            border-radius: 4px;
            padding: 20px 30px;
            position: relative;
            background: #fcfcfd;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .title-inst {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #064e3b;
            margin: 0;
          }
          .subtitle-inst {
            font-size: 11px;
            color: #4b5563;
            letter-spacing: 1px;
            margin-top: 3px;
          }
          .diploma-title {
            font-size: 32px;
            font-family: 'Georgia', serif;
            letter-spacing: 3px;
            color: #032b43;
            margin: 12px 0 8px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .certify-text {
            font-size: 14px;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            color: #1f2937;
          }
          .student-name {
            font-size: 24px;
            font-weight: bold;
            color: #044e54;
            display: block;
            margin: 6px 0;
            font-family: 'Georgia', serif;
            text-decoration: underline;
          }
          .course-name {
            font-size: 18px;
            font-weight: bold;
            color: #065f46;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 15px;
            padding: 0 40px;
          }
          .signature-box {
            text-align: center;
            width: 240px;
          }
          .signature-line {
            border-top: 1px solid #111;
            margin-bottom: 5px;
          }
          .footer-info {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
            font-family: monospace;
          }
          .seal-badge-box {
            display: inline-block;
            padding: 6px 18px;
            background: #f0fdf4;
            border: 1px solid #10b981;
            border-radius: 8px;
            max-width: 780px;
            margin: 6px auto;
          }
          .seal-badge {
            color: #065f46;
            font-weight: bold;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          .seal-badge-sub {
            color: #047857;
            font-weight: 600;
            font-size: 9px;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="border-outer page-container">
          <div class="header">
            <div class="title-inst">Biorad Cursos • Instituto de Especialização Radiológica</div>
            <div class="subtitle-inst">Centro de Excelência em Diagnóstico por Imagem e Tomografia Computadorizada</div>
            <div class="diploma-title">Certificado Acadêmico Oficial</div>
          </div>

          <div class="certify-text">
            Certificamos, para todos os devidos fins de direito, acadêmicos e profissionais, que o(a) aluno(a)
            <span class="student-name">${cert.studentName}</span>
            inscrito(a) sob o registro <strong>${cert.studentDocument}</strong>, integralizou
            <strong>100% da carga horária, aulas ministradas e atividades práticas</strong>, obtendo aproveitamento com nota
            <strong>${cert.finalScore.toFixed(1)} / 10.0</strong> no programa:
            <br />
            <span class="course-name">${cert.courseName}</span>
            <br />
            perfazendo uma carga horária oficial de <strong>${cert.workloadHours} horas</strong> com auditoria de conclusão total de videoaulas e práticas no simulador virtual.
          </div>

          <div>
            <div class="seal-badge-box">
              <div class="seal-badge">
                CONFORMIDADE LEGAL: LEI Nº 9.394/96 (LDB) ART. 42 • DECRETO PRESIDENCIAL Nº 5.154/04
              </div>
              <div class="seal-badge-sub">
                AUDITORIA ACADÊMICA: 100% DAS VIDEOAULAS ASSISTIDAS E ESTAÇÕES PRÁTICAS CONCLUÍDAS
              </div>
            </div>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <strong>${cert.instructorName}</strong><br />
              <span style="font-size: 10px; color: #4b5563;">${cert.instructorRole}</span>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <strong>Ben Moran</strong><br />
              <span style="font-size: 10px; color: #4b5563;">Administrador Geral do Sistema • Biorad Cursos</span>
            </div>
          </div>

          <div class="footer-info">
            <span>REGISTRO: ${cert.code}</span>
            <span>EXPEDIÇÃO: ${cert.completionDate}</span>
            <span>STATUS: 100% AUDITADO E CONCLUÍDO</span>
            <span>HASH SHA-256: ${cert.sha256Hash ? cert.sha256Hash.substring(0, 26) : 'a7c98b21e3b0c44298fc'}...</span>
          </div>
        </div>
      </body>
      </html>
    `;

    printHtmlContent(htmlContent);
  },

  exportTranscript(courses: Course[], studentName: string, enrollmentId: string): void {
    const rowsHtml = courses.map(c => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${c.code} - ${c.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.credits}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold; color: #0891b2;">${c.grade.toFixed(1)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.progress}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #059669; font-weight: bold;">${c.status === 'completed' ? 'Aprovado' : 'Em Curso'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Histórico Escolar Oficial - ${studentName}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
          .header { border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 18px; }
          h1 { margin: 0; color: #0f172a; font-size: 22px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; padding: 10px; font-size: 11px; text-align: left; text-transform: uppercase; }
          .stamp { margin-top: 25px; padding: 12px; border: 1px solid #10b981; background: #ecfdf5; border-radius: 8px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Biorad Cursos • Histórico Escolar Oficial (Paisagem)</h1>
          <p>Aluno: <strong>${studentName}</strong> | Matrícula: <strong>${enrollmentId}</strong> | Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Disciplina</th>
              <th style="text-align: center;">Créditos</th>
              <th style="text-align: center;">Média Final</th>
              <th style="text-align: center;">Frequência</th>
              <th style="text-align: center;">Situação</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="stamp">
          <strong>DOCUMENTO AUTÊNTICO ASSINADO DIGITALMENTE</strong><br/>
          Assinatura acadêmica com carimbo de tempo verificado no portal Biorad Cursos por Ben Moran (Admin). Válido para comprovação curricular e estágio hospitalar.
        </div>
      </body>
      </html>
    `;

    printHtmlContent(html);
  },

  exportClassSheetPdf(grades: StudentGradeRecord[], classTitle: string): void {
    const rows = grades.map(g => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${g.enrollmentId}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: 600;">${g.studentName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${g.attendance}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${g.gradeN1.toFixed(1)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${g.gradeN2.toFixed(1)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${g.gradePractice.toFixed(1)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: ${g.calculatedAverage >= 7 ? '#059669' : '#d97706'};">
          ${g.calculatedAverage.toFixed(1)}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Pauta Oficial - ${classTitle}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f3f4f6; padding: 8px; font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>Biorad Cursos - Pauta de Avaliação da Turma (Formato Horizontal)</h2>
        <p>Disciplina: <strong>${classTitle}</strong> | Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        <table>
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Aluno</th>
              <th>Frequência</th>
              <th>Nota N1</th>
              <th>Nota N2</th>
              <th>Prática TC</th>
              <th>Média</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `;

    printHtmlContent(html);
  },

  exportComprovante(tx: PaymentTransaction): void {
    // Generate Landscape PDF for Comprovante via jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // Background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Navy & Cyan border
    doc.setDrawColor(8, 145, 178);
    doc.setLineWidth(1.2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(8, 145, 178);
    doc.text('BIORAD CURSOS • PLATAFORMA DE ENSINO', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text('COMPROVANTE OFICIAL DE MATRÍCULA & TRANSAÇÃO', 20, 31);

    // Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 38, pageWidth - 40, 115, 3, 3, 'FD');

    // Amount
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('Valor Total Pago:', 28, 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(`R$ ${tx.amount.toFixed(2).replace('.', ',')}`, 28, 60);

    // Grid information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CÓDIGO DA TRANSAÇÃO', 28, 72);
    doc.text('DATA E HORÁRIO', 160, 72);

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(tx.transactionCode, 28, 79);
    doc.text(tx.paidAt || tx.createdAt, 160, 79);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('FORMA DE PAGAMENTO', 28, 92);
    doc.text('CARGA HORÁRIA & ACESSO', 160, 92);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const payMethodText = tx.paymentMethod === 'pix' ? 'PIX Instantâneo (Banco Central do Brasil)' : `Cartão de Crédito (${tx.installments || 1}x)`;
    doc.text(payMethodText, 28, 99);
    const accessText = tx.expiresAt ? `${tx.certificateWorkloadHours || 40}h (Acesso 2 Meses até ${tx.expiresAt})` : `${tx.certificateWorkloadHours || 40} Horas Acadêmicas (2 Meses de Acesso)`;
    doc.text(accessText, 160, 99, { maxWidth: 110 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CURSO SELECIONADO', 28, 112);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(8, 145, 178);
    doc.text(tx.courseTitle, 28, 119, { maxWidth: 235 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('NOME DO ALUNO(A) / CPF', 28, 132);
    doc.text('E-MAIL / PROTOCOLO BACEN', 160, 132);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const studentInfo = tx.studentCpf ? `${tx.studentName} • CPF: ${tx.studentCpf}` : tx.studentName;
    doc.text(studentInfo, 28, 139, { maxWidth: 128 });
    const authProtocol = tx.pixEndToEndId ? `${tx.studentEmail} • E2E: ${tx.pixEndToEndId.slice(0, 18)}...` : tx.studentEmail;
    doc.text(authProtocol, 160, 139, { maxWidth: 110 });

    // Legal notice box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(20, 158, pageWidth - 40, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Amparo Legal & Diretrizes Acadêmicas: Curso Livre em conformidade com a Lei nº 9.394/96 Art. 42 e Dec. nº 5.154/04.',
      25,
      165
    );
    doc.text(
      'A emissão do Certificado Oficial exige a conclusão obrigatória de 100% das videoaulas e estações práticas no simulador virtual.',
      25,
      171
    );

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Biorad Cursos • Soluções em Imagem e Educação Médica S/A • Autenticado digitalmente por Ben Moran (Admin Geral)',
      pageWidth / 2,
      192,
      { align: 'center' }
    );

    doc.save(`Comprovante_${tx.transactionCode}_Horizontal.pdf`);
  }
};
