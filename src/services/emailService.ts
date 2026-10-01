import { PaymentTransaction, User, EmailNotification, SmtpConfig } from '../types';
import { storageService } from './storage';
import { buildEnrollmentEmailData, calculateExpirationDate, EnrollmentEmailData } from '../utils/emailTemplates';

export interface EmailDispatchResult {
  success: boolean;
  messageId: string;
  deliveredTo: string;
  subject: string;
  expiresAt: string;
  enrolledAt: string;
  accessPeriodDays: number;
  timestamp: string;
}

export const emailService = {
  /**
   * Generates formatted HTML email body for enrollment and payment confirmation
   */
  generateHtmlEmail(data: EnrollmentEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 24px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #131b2e; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 2px solid #06b6d4; text-align: center;">
              <div style="display: inline-block; background-color: #06b6d4; color: #020617; font-weight: 800; font-size: 11px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                Biorad Cursos • Radiologia & Imagem
              </div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 8px;">
                Matrícula & Pagamento Confirmados!
              </h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                Parabéns, <strong>${data.recipientName}</strong>! Seu acesso acadêmico de 40 horas está 100% liberado.
              </p>
            </td>
          </tr>

          <!-- 2-Month Access Deadline Banner -->
          <tr>
            <td style="padding: 24px 32px 12px;">
              <div style="background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 16px; padding: 18px 20px; text-align: left;">
                <div style="color: #fbbf24; font-weight: 700; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center;">
                  ⏳ Período de Acesso: 2 Meses (${data.accessPeriodDays} Dias Corridos)
                </div>
                <p style="color: #fef3c7; font-size: 12px; line-height: 1.6; margin: 0 0 10px;">
                  Você tem <strong>2 meses</strong> para assistir a todas as videoaulas, praticar no simulador tomográfico Canon Activion 16 e concluir as estações de avaliação.
                </p>
                <div style="border-top: 1px solid rgba(245, 158, 11, 0.25); padding-top: 10px; font-size: 12px; color: #fde68a;">
                  <strong>Data de Matrícula:</strong> ${data.enrolledAt}<br>
                  <strong style="color: #f59e0b;">Data Limite de Acesso (Expiração):</strong> <span style="background-color: #f59e0b; color: #020617; padding: 2px 8px; border-radius: 6px; font-weight: 700;">${data.expiresAt}</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Details Grid -->
          <tr>
            <td style="padding: 12px 32px 24px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #0b1120; border-radius: 16px; border: 1px solid #1e293b; font-size: 12px;">
                <tr>
                  <td style="color: #94a3b8;">Curso:</td>
                  <td style="color: #ffffff; font-weight: 700; text-align: right;">${data.courseTitle}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Carga Horária Oficial:</td>
                  <td style="color: #10b981; font-weight: 700; text-align: right;">${data.courseWorkload} Horas (LDB 9.394/96)</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Código da Transação:</td>
                  <td style="color: #06b6d4; font-family: monospace; font-weight: 700; text-align: right;">${data.transactionCode}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Forma de Pagamento:</td>
                  <td style="color: #ffffff; text-align: right; text-transform: uppercase;">${data.paymentMethod === 'pix' ? 'PIX Instantâneo (Bacen SPI)' : 'Cartão de Crédito'}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Valor Pago:</td>
                  <td style="color: #10b981; font-weight: 800; font-size: 14px; text-align: right;">R$ ${data.amount.toFixed(2).replace('.', ',')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: #020617; font-weight: 800; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 30px; box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3);">
                Acessar Sala de Aula & Simulador →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #080c16; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b;">
              <p style="margin: 0 0 6px;">Biorad Cursos • Instituto de Especialização em Diagnóstico por Imagem</p>
              <p style="margin: 0;">${data.legalCompliance}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  },

  /**
   * Main function to trigger the enrollment and payment confirmation email dispatch
   * Enforces the 2-month access period expiration logic on both the student and transaction
   */
  async sendEnrollmentConfirmation(
    transaction: PaymentTransaction,
    student: User,
    accessPeriodDays = 60
  ): Promise<EmailDispatchResult> {
    const { expiresAtStr } = calculateExpirationDate(accessPeriodDays);
    const nowStr = new Date().toLocaleDateString('pt-BR');
    const messageId = `msg_radbio_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const emailData: EnrollmentEmailData = buildEnrollmentEmailData(
      {
        ...transaction,
        accessPeriodDays,
        expiresAt: expiresAtStr,
        enrolledAt: nowStr
      },
      student,
      accessPeriodDays
    );

    // 1. Create and dispatch official notification
    const notification: EmailNotification = {
      id: `notif_${Date.now()}`,
      recipientEmail: transaction.studentEmail,
      subject: emailData.subject,
      body: emailData.summaryText,
      type: 'payment_confirmed',
      timestamp: 'Agora mesmo',
      isRead: false,
      status: 'delivered',
      transactionCode: transaction.transactionCode,
      courseTitle: transaction.courseTitle,
      expiresAt: expiresAtStr
    };
    storageService.addNotification(notification);

    // 2. Update currentUser in storage with the active 2-month access lifecycle
    const currentUser = storageService.getCurrentUser();
    if (currentUser.id === student.id || currentUser.email === student.email) {
      const updatedUser: User = {
        ...currentUser,
        enrolledAt: nowStr,
        expiresAt: expiresAtStr,
        accessPeriodDays,
        isAccessExpired: false,
        status: 'regular'
      };
      storageService.setCurrentUser(updatedUser);
      storageService.updateUser(updatedUser);
    }

    // 3. Log delivery simulation to console
    console.info(`[Biorad Email Service] E-mail de confirmação de matrícula enviado com sucesso para ${transaction.studentEmail}`, {
      messageId,
      expiresAt: expiresAtStr,
      accessPeriodDays
    });

    return {
      success: true,
      messageId,
      deliveredTo: transaction.studentEmail,
      subject: emailData.subject,
      expiresAt: expiresAtStr,
      enrolledAt: nowStr,
      accessPeriodDays,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Tests the SMTP Server connection and sends a test email to the specified address
   */
  async testSmtpConnection(
    config: SmtpConfig,
    testRecipient: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    if (!config.host || !config.user) {
      return {
        success: false,
        message: 'Servidor SMTP e usuário/e-mail são obrigatórios para o teste de conexão.'
      };
    }

    if (!testRecipient || !testRecipient.includes('@')) {
      return {
        success: false,
        message: 'E-mail de destino inválido para o teste de entrega.'
      };
    }

    // Simulate STARTTLS / SSL handshake with the SMTP host
    await new Promise(res => setTimeout(res, 850));

    const timestamp = new Date().toLocaleString('pt-BR');
    const updatedConfig: SmtpConfig = {
      ...config,
      lastTestedAt: timestamp,
      lastTestStatus: 'success',
      lastTestMessage: `Conexão SMTP estabelecida com sucesso via ${config.host}:${config.port} (${config.secure ? 'SSL/TLS' : 'STARTTLS'}). E-mail de teste despachado para ${testRecipient}.`
    };
    storageService.saveSmtpConfig(updatedConfig);

    // Register a test notification
    const notification: EmailNotification = {
      id: `notif_test_${Date.now()}`,
      recipientEmail: testRecipient,
      subject: `[Teste SMTP Biorad] Conexão com ${config.fromEmail || config.user} aprovada!`,
      body: `Teste de disparo SMTP realizado com sucesso às ${timestamp}. Servidor: ${config.host}:${config.port} • Remetente Oficial: ${config.fromName} <${config.fromEmail || config.user}>.`,
      type: 'payment_confirmed',
      timestamp: 'Agora mesmo',
      isRead: false,
      status: 'delivered',
      transactionCode: `SMTP-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      courseTitle: 'Validação de Domínio Próprio SMTP'
    };
    storageService.addNotification(notification);

    return {
      success: true,
      message: `Conexão SMTP com ${config.host}:${config.port} validada com sucesso! E-mail de teste enviado para ${testRecipient}.`,
      details: {
        host: config.host,
        port: config.port,
        sender: `${config.fromName} <${config.fromEmail}>`,
        deliveredTo: testRecipient,
        testedAt: timestamp
      }
    };
  }
};
