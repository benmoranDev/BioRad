// Helper for Pix BRCode (EMV standard) and Dynamic / Custom Pix Keys
import QRCode from 'qrcode';

export interface PixConfig {
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  keyValue: string;
  merchantName: string;
  merchantCity: string;
  defaultDescription?: string;
}

export const DEFAULT_PIX_CONFIG: PixConfig = {
  keyType: 'email',
  keyValue: 'benmoran29dev@gmail.com', // Chave Pix Principal do Administrador
  merchantName: 'BIORAD CURSOS',
  merchantCity: 'SAO PAULO',
  defaultDescription: 'Curso Livre 40h Biorad Cursos'
};

/**
 * Remove acentos e caracteres especiais para conformidade estrita com o padrão BACEN BRCode EMV
 */
export function removeAccents(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .trim();
}

/**
 * Normaliza a chave Pix de acordo com seu tipo
 */
export function normalizePixKey(key: string, type: PixConfig['keyType']): string {
  const k = (key || '').trim();
  if (type === 'cpf' || type === 'cnpj') {
    return k.replace(/\D/g, '');
  }
  if (type === 'phone') {
    const digits = k.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) {
      return `+${digits}`;
    }
    return `+55${digits}`;
  }
  if (type === 'email') {
    return k.toLowerCase();
  }
  return k;
}

// CRC16-CCITT calculation for EMV QR Code standards
function crc16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Gera o código PIX Copia e Cola Oficial (BR Code EMV)
 */
export function generatePixBrCode(
  amount: number,
  pixKey: string = DEFAULT_PIX_CONFIG.keyValue,
  merchantName: string = DEFAULT_PIX_CONFIG.merchantName,
  merchantCity: string = DEFAULT_PIX_CONFIG.merchantCity,
  txId: string = 'RAD40H',
  keyType: PixConfig['keyType'] = 'email'
): string {
  const cleanKey = normalizePixKey(pixKey, keyType);
  const cleanTxId = (txId.replace(/[^A-Za-z0-9]/g, '') || 'RAD40H').slice(0, 25);
  const cleanCity = removeAccents(merchantCity || 'SAO PAULO').slice(0, 15).toUpperCase() || 'SAO PAULO';
  const cleanName = removeAccents(merchantName || 'RADBIO EDUCACAO').slice(0, 25).toUpperCase() || 'RADBIO EDUCACAO';

  // 26: Merchant Account Information - GUI + Key
  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const keyField = formatEmvField('01', cleanKey);
  const merchantAccountInfo = formatEmvField('26', `${gui}${keyField}`);

  // Payload elements
  let payload = '';
  payload += formatEmvField('00', '01'); // Payload Format Indicator
  payload += merchantAccountInfo;
  payload += formatEmvField('52', '0000'); // Merchant Category Code
  payload += formatEmvField('53', '986'); // Currency (BRL = 986)
  if (amount > 0) {
    payload += formatEmvField('54', amount.toFixed(2));
  }
  payload += formatEmvField('58', 'BR'); // Country Code
  payload += formatEmvField('59', cleanName); // Merchant Name
  payload += formatEmvField('60', cleanCity); // Merchant City

  // 62: Additional Data Field (TxID)
  const additionalData = formatEmvField('05', cleanTxId);
  payload += formatEmvField('62', additionalData);

  // 63: CRC16 calculation placeholder
  payload += '6304';
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}

/**
 * Gera uma imagem Real em Data URL (PNG) a partir do BR Code para escanear com qualquer aplicativo de banco
 */
export async function generatePixQrCodeDataUrl(pixPayload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(pixPayload, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Erro ao renderizar QRCode PIX:', err);
    return '';
  }
}
