/**
 * Serviço de PIX — Geração de QR Code e validação de chaves
 * Implementa o padrão BR Code (EMV QRCPS) do Banco Central do Brasil
 */

// ==============================================================================
// CRC16-CCITT (Polinômio 0x1021)
// ==============================================================================

export function calculateCRC16(str: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < str.length; i++) {
        const b = str.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            const bit = ((b >> (7 - j)) & 1) === 1;
            const c15 = ((crc >> 15) & 1) === 1;
            crc <<= 1;
            if (c15 !== bit) {
                crc ^= polynomial;
            }
        }
    }

    crc &= 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ==============================================================================
// Normalização de strings para conformidade EMV
// ==============================================================================

function removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeEMV(str: string, maxLength: number): string {
    return removeAccents(str)
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, '')
        .trim()
        .substring(0, maxLength);
}

// ==============================================================================
// Montagem de Tag-Length-Value (TLV) — padrão EMV
// ==============================================================================

function tlv(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${tag}${length}${value}`;
}

// ==============================================================================
// Parâmetros de entrada para geração do PIX
// ==============================================================================

export interface PixParams {
    pixKey: string;
    pixKeyType: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    txId?: string;
}

// ==============================================================================
// Geração da String PIX Copia e Cola (BR Code / EMV QRCPS)
// ==============================================================================

export function generatePixCopiaECola(params: PixParams): string {
    const { pixKey, merchantName, merchantCity, amount, txId } = params;

    // Tag 00 — Payload Format Indicator
    const tag00 = tlv('00', '01');

    // Tag 26 — Merchant Account Information
    const gui = tlv('00', 'BR.GOV.BCB.PIX');
    const chave = tlv('01', pixKey);
    const tag26 = tlv('26', gui + chave);

    // Tag 52 — Merchant Category Code (genérico)
    const tag52 = tlv('52', '0000');

    // Tag 53 — Transaction Currency (986 = BRL)
    const tag53 = tlv('53', '986');

    // Tag 54 — Transaction Amount
    const tag54 = tlv('54', amount.toFixed(2));

    // Tag 58 — Country Code
    const tag58 = tlv('58', 'BR');

    // Tag 59 — Merchant Name (max 25 chars, sem acentos, uppercase)
    const normalizedName = normalizeEMV(merchantName, 25);
    const tag59 = tlv('59', normalizedName);

    // Tag 60 — Merchant City (max 15 chars, sem acentos, uppercase)
    const normalizedCity = normalizeEMV(merchantCity, 15);
    const tag60 = tlv('60', normalizedCity);

    // Tag 62 — Additional Data Field Template (contém txId)
    const txIdValue = txId
        ? txId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)
        : '***'; // Valor padrão se não houver txId
    const tag62 = tlv('62', tlv('05', txIdValue));

    // Montar payload base (sem CRC)
    const payloadBase = tag00 + tag26 + tag52 + tag53 + tag54 + tag58 + tag59 + tag60 + tag62;

    // Tag 63 — CRC16 (calculado sobre payload + "6304")
    const crcInput = payloadBase + '6304';
    const crc = calculateCRC16(crcInput);

    return crcInput + crc;
}

// ==============================================================================
// Validação de Chave PIX por Tipo
// ==============================================================================

export interface PixKeyValidation {
    isValid: boolean;
    error?: string;
}

export function validatePixKey(type: string, key: string): PixKeyValidation {
    if (!key || key.trim().length === 0) {
        return { isValid: false, error: 'Chave PIX não pode estar vazia.' };
    }

    const cleanKey = key.trim();

    switch (type) {
        case 'CPF': {
            const digits = cleanKey.replace(/\D/g, '');
            if (digits.length !== 11) {
                return { isValid: false, error: 'CPF deve conter exatamente 11 dígitos.' };
            }
            return { isValid: true };
        }

        case 'CNPJ': {
            const digits = cleanKey.replace(/\D/g, '');
            if (digits.length !== 14) {
                return { isValid: false, error: 'CNPJ deve conter exatamente 14 dígitos.' };
            }
            return { isValid: true };
        }

        case 'E-mail': {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanKey)) {
                return { isValid: false, error: 'Formato de e-mail inválido.' };
            }
            return { isValid: true };
        }

        case 'Telefone': {
            const phoneDigits = cleanKey.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 13) {
                return { isValid: false, error: 'Telefone deve conter entre 10 e 13 dígitos (com DDD).' };
            }
            return { isValid: true };
        }

        case 'Chave Aleatória': {
            // Formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            const evpRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!evpRegex.test(cleanKey)) {
                return { isValid: false, error: 'Chave aleatória deve estar no formato UUID (ex: a1b2c3d4-...).' };
            }
            return { isValid: true };
        }

        default:
            return { isValid: false, error: `Tipo de chave desconhecido: ${type}` };
    }
}
