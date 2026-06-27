import type { Evento, EventoStatus } from '../types';

/**
 * Computa o status do evento com base na data/hora atual e nos períodos configurados.
 * Prioridade: status_manual 'cancelado' > publicado > períodos cronológicos
 */
export function computeEventStatus(evento: Evento): EventoStatus {
    // 1. Override manual: cancelado sempre prevalece
    if (evento.status_manual === 'cancelado') return 'CANCELLED';

    const now = new Date();
    const inscInicio = new Date(evento.inscricao_inicio);
    const inscFim = new Date(evento.inscricao_fim);
    const realInicio = new Date(evento.realizacao_inicio);
    const realFim = new Date(evento.realizacao_fim);

    // 2. Se a data de término do evento já passou, ele está encerrado (mesmo se não publicado)
    if (now >= realFim) return 'FINISHED';

    // 3. Evento não publicado e ainda não encerrado = Rascunho
    if (!evento.publicado) return 'DRAFT';

    // 4. Períodos cronológicos para eventos publicados e ativos
    if (now < inscInicio) return 'REGISTRATION_UPCOMING';
    if (now >= inscInicio && now < inscFim) return 'REGISTRATION_OPEN';
    if (now >= inscFim && now < realInicio) return 'REGISTRATION_CLOSED';
    if (now >= realInicio && now < realFim) return 'IN_PROGRESS';
    return 'FINISHED';
}

/** Configuração visual de cada status */
export interface StatusConfig {
    label: string;
    color: 'default' | 'info' | 'success' | 'warning' | 'error';
    icon: string;
    variant?: 'filled' | 'outlined';
}

/** Retorna a configuração visual do Chip para um dado status */
export function getStatusConfig(status: EventoStatus): StatusConfig {
    switch (status) {
        case 'DRAFT':
            return { label: 'Rascunho', color: 'default', icon: '📝', variant: 'outlined' };
        case 'REGISTRATION_UPCOMING':
            return { label: 'Inscrições em Breve', color: 'info', icon: '🔜' };
        case 'REGISTRATION_OPEN':
            return { label: 'Inscrições Abertas', color: 'success', icon: '✅' };
        case 'REGISTRATION_CLOSED':
            return { label: 'Inscrições Encerradas', color: 'warning', icon: '⏳' };
        case 'IN_PROGRESS':
            return { label: 'Em Andamento', color: 'error', icon: '🔴' };
        case 'FINISHED':
            return { label: 'Encerrado', color: 'default', icon: '⬛' };
        case 'CANCELLED':
            return { label: 'Cancelado', color: 'error', icon: '🚫', variant: 'outlined' };
        default:
            return { label: 'Desconhecido', color: 'default', icon: '❓' };
    }
}

/**
 * Verifica se inscrições estão permitidas para o evento.
 * Retorna um objeto com `allowed` e `reason` (mensagem de erro se não permitido).
 */
export function canRegister(evento: Evento): { allowed: boolean; reason?: string } {
    const status = computeEventStatus(evento);

    switch (status) {
        case 'DRAFT':
            return { allowed: false, reason: 'Este evento ainda não foi publicado.' };
        case 'REGISTRATION_UPCOMING': {
            const dt = new Date(evento.inscricao_inicio);
            const formatted = dt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            return { allowed: false, reason: `As inscrições abrem em ${formatted}.` };
        }
        case 'REGISTRATION_OPEN':
            return { allowed: true };
        case 'REGISTRATION_CLOSED':
            return { allowed: false, reason: 'O período de inscrição para este evento já foi encerrado.' };
        case 'IN_PROGRESS':
            return { allowed: false, reason: 'Este evento está em andamento.' };
        case 'FINISHED':
            return { allowed: false, reason: 'Este evento já foi encerrado.' };
        case 'CANCELLED':
            return { allowed: false, reason: 'Este evento foi cancelado.' };
        default:
            return { allowed: false, reason: 'Status desconhecido.' };
    }
}

/**
 * Formata uma data TIMESTAMPTZ para exibição no formato brasileiro.
 */
export function formatDateTime(isoStr: string): string {
    if (!isoStr) return '--/--/---- --:--';
    const date = new Date(isoStr);
    return date.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formata apenas a data (sem hora) de uma string TIMESTAMPTZ.
 */
export function formatDateOnly(isoStr: string): string {
    if (!isoStr) return '--/--/----';
    const date = new Date(isoStr);
    return date.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
    });
}

/**
 * Converte uma string datetime-local (do input HTML) para ISO 8601 com timezone de Brasília.
 * Exemplo: '2026-07-01T08:00' -> '2026-07-01T08:00:00-03:00'
 */
export function toISOWithTimezone(localDatetime: string): string {
    if (!localDatetime) return '';
    return `${localDatetime}:00-03:00`;
}

/**
 * Converte uma string ISO/TIMESTAMPTZ para o formato datetime-local do HTML input.
 * Exemplo: '2026-07-01T11:00:00+00:00' -> '2026-07-01T08:00' (in America/Sao_Paulo)
 */
export function toDatetimeLocal(isoStr: string): string {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    // Format as YYYY-MM-DDTHH:MM in São Paulo timezone
    const parts = date.toLocaleString('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    // sv-SE locale gives 'YYYY-MM-DD HH:MM' format, just replace space with T
    return parts.replace(' ', 'T');
}
