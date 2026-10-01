import { PaymentTransaction, User } from '../types';

export function calculateExpirationDate(days = 60): { expiresAtStr: string; expiresAtISO: string; daysRemaining: number } {
  const now = new Date();
  const exp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  const day = String(exp.getDate()).padStart(2, '0');
  const month = String(exp.getMonth() + 1).padStart(2, '0');
  const year = exp.getFullYear();
  
  return {
    expiresAtStr: `${day}/${month}/${year}`,
    expiresAtISO: exp.toISOString(),
    daysRemaining: days
  };
}

export interface EnrollmentEmailData {
  recipientEmail: string;
  recipientName: string;
  recipientCpf?: string;
  courseTitle: string;
  courseWorkload: number;
  transactionCode: string;
  paymentMethod: 'pix' | 'credit';
  amount: number;
  paidAt: string;
  enrolledAt: string;
  expiresAt: string;
  accessPeriodDays: number;
  subject: string;
  summaryText: string;
  legalCompliance: string;
}

export function buildEnrollmentEmailData(
  transaction: PaymentTransaction,
  student: User,
  accessPeriodDays = 60
): EnrollmentEmailData {
  const { expiresAtStr } = calculateExpirationDate(accessPeriodDays);
  const paidDateStr = transaction.paidAt || new Date().toLocaleString('pt-BR');
  const enrolledDateStr = transaction.createdAt || new Date().toLocaleString('pt-BR');

  const subject = `[Matrícula & Pagamento Confirmados] ${transaction.courseTitle} • Acesso Liberado por 2 Meses`;

  const summaryText = `Prezado(a) ${transaction.studentName},

Sua matrícula no curso "${transaction.courseTitle}" (${transaction.certificateWorkloadHours} Horas) foi confirmada com sucesso via ${transaction.paymentMethod === 'pix' ? 'PIX Instantâneo' : 'Cartão de Crédito'}!

DADOS DA MATRÍCULA E DO PAGAMENTO:
• Código da Transação: ${transaction.transactionCode}
• Aluno: ${transaction.studentName}
• Documento (CPF): ${transaction.studentCpf || student.cpf || 'Cadastrado'}
• Curso: ${transaction.courseTitle}
• Carga Horária Oficial: ${transaction.certificateWorkloadHours} Horas
• Valor Pago: R$ ${transaction.amount.toFixed(2).replace('.', ',')}
• Data de Confirmação: ${paidDateStr}

PERÍODO DE ACESSO AO CURSO (2 MESES):
• Prazo Total de Acesso: 60 Dias (2 Meses corridos)
• Data Limite de Acesso & Emissão do Certificado: ${expiresAtStr}
• Você tem até ${expiresAtStr} para assistir às videoaulas, praticar no simulador tomográfico Activion 16 e concluir os questionários para emissão do seu Certificado Oficial de 40 Horas (Lei nº 9.394/96).

COMO ACESSAR:
1. Acesse o portal Biorad Cursos com seu e-mail: ${transaction.studentEmail}
2. Vá para a aba "Minhas Aulas" ou "Cursos Livres"
3. Inicie os módulos teóricos, simulador DICOM e realize os testes de fixação.

Atenciosamente,
Coordenação Acadêmica Biorad Cursos & Hospital Imagem
Suporte Acadêmico: suporte@radbio.edu.br`;

  return {
    recipientEmail: transaction.studentEmail,
    recipientName: transaction.studentName,
    recipientCpf: transaction.studentCpf || student.cpf,
    courseTitle: transaction.courseTitle,
    courseWorkload: transaction.certificateWorkloadHours,
    transactionCode: transaction.transactionCode,
    paymentMethod: transaction.paymentMethod,
    amount: transaction.amount,
    paidAt: paidDateStr,
    enrolledAt: enrolledDateStr,
    expiresAt: expiresAtStr,
    accessPeriodDays,
    subject,
    summaryText,
    legalCompliance: 'Certificado Válido em Todo o Território Nacional conforme a Lei nº 9.394/96 (LDB) e Decreto nº 5.154/04'
  };
}
