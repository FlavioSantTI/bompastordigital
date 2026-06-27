/**
 * Payment Strategies — Padrão Strategy para extensibilidade de métodos de pagamento.
 * 
 * Hoje: Apenas PIX.
 * Futuro: Boleto, Cartão de Crédito, etc. — basta criar uma nova strategy e registrar no factory.
 * 
 * PRD v1.2 §2.2 Nota de Arquitetura:
 * "o código deve prever ganchos limpos para acoplamento futuro de outras modalidades
 *  sem a necessidade de reestruturação da view principal."
 */

import type { PixParams } from './pixService';
import { generatePixCopiaECola } from './pixService';

// ==============================================================================
// Interfaces base do padrão Strategy
// ==============================================================================

export interface PaymentParams {
    pixKey: string;
    pixKeyType: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    txId: string;
}

export interface PaymentPayload {
    method: string;
    copiaECola: string;
    displayData: {
        chave: string;
        chaveTipo: string;
        beneficiario: string;
        cidade: string;
        valor: string;
    };
}

export interface PaymentStrategy {
    /** Identificador do método (ex: 'pix', 'boleto', 'credit_card') */
    method: string;
    /** Gera o payload de pagamento a partir dos parâmetros do evento */
    generatePayload(params: PaymentParams): PaymentPayload;
}

// ==============================================================================
// Implementação: Estratégia PIX
// ==============================================================================

const pixStrategy: PaymentStrategy = {
    method: 'pix',

    generatePayload(params: PaymentParams): PaymentPayload {
        const pixParams: PixParams = {
            pixKey: params.pixKey,
            pixKeyType: params.pixKeyType,
            merchantName: params.merchantName,
            merchantCity: params.merchantCity,
            amount: params.amount,
            txId: params.txId,
        };

        const copiaECola = generatePixCopiaECola(pixParams);

        return {
            method: 'pix',
            copiaECola,
            displayData: {
                chave: params.pixKey,
                chaveTipo: params.pixKeyType,
                beneficiario: params.merchantName,
                cidade: params.merchantCity,
                valor: params.amount.toFixed(2).replace('.', ','),
            },
        };
    },
};

// ==============================================================================
// Factory — Seleciona a estratégia de pagamento
// ==============================================================================

const strategies: Record<string, PaymentStrategy> = {
    pix: pixStrategy,
    // Futuro: boleto: boletoStrategy,
    // Futuro: credit_card: creditCardStrategy,
};

/**
 * Retorna a estratégia de pagamento para o método informado.
 * Fallback para PIX caso o método não seja reconhecido.
 */
export function getPaymentStrategy(method: string): PaymentStrategy {
    return strategies[method] || strategies.pix;
}

/**
 * Lista os métodos de pagamento disponíveis.
 */
export function getAvailablePaymentMethods(): string[] {
    return Object.keys(strategies);
}
