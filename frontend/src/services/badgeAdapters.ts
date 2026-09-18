/**
 * badgeAdapters.ts
 * Camada de Adapters que transforma dados de cada entidade Supabase
 * para o formato CanonicalBadgePayload.
 *
 * Cada Adapter:
 * 1. Chama a RPC/query Supabase correspondente
 * 2. Normaliza os campos para o contrato canônico
 * 3. Retorna CanonicalBadgePayload[]
 *
 * @see docs/PRD_Modulo_Crachas_Unificado.md — Seção 3.1 (Arquitetura)
 */

import { supabase } from '../lib/supabase';
import {
    type CanonicalBadgePayload,
    type BadgeSourceEntity,
    DEFAULT_ACCENT_COLORS,
} from '../types/badge';

// ============================================================
// TIPOS INTERNOS (retorno bruto das RPCs)
// ============================================================

/** Retorno da RPC get_inscritos_para_cracha (v3) */
interface InscritoRaw {
    inscricao_id: string;
    tipo: 'esposo' | 'esposa' | 'individual';
    nome: string;
    nome_conjuge: string | null;
    paroquia: string | null;
    diocese: string | null;
    cidade: string | null;
    evento: string;
}

/**
 * Formata o vínculo tradicional de casal para o crachá no padrão Bom Pastor.
 * Ex: Esposo "Flavio" com esposa "Silvia" -> "(da Silvia)" ou "da Silvia"
 * Ex: Esposa "Silvia" com esposo "Flavio" -> "(do Flavio)" ou "do Flavio"
 */
export function formatarVinculoConjuge(
    tipo: 'esposo' | 'esposa' | 'individual',
    nomeConjuge?: string | null
): string | null {
    if (!nomeConjuge || tipo === 'individual') return null;

    const trimmed = nomeConjuge.trim();
    if (!trimmed) return null;

    // Extrai o primeiro nome do cônjuge
    const primeiroNome = trimmed.split(/\s+/)[0];

    if (tipo === 'esposo') {
        return `da ${primeiroNome}`;
    } else if (tipo === 'esposa') {
        return `do ${primeiroNome}`;
    }

    return null;
}

/** Retorno da RPC get_equipe_membros_para_cracha */
interface EquipeMembroRaw {
    membro_id: number;
    pessoa_id: string;
    nome: string;
    equipe_nome: string;
    equipe_cor: string | null;
    cargo_nome: string;
    cargo_nivel: number;
    observacao: string | null;
    evento_nome: string;
}

/** Retorno da RPC get_palestrantes_para_cracha */
interface PalestranteRaw {
    palestrante_id: number;
    nome: string;
    foto_url: string | null;
    tipo_participacao: string;
    atividade_titulo: string;
    atividade_data: string;
    atividade_hora: string;
    evento_nome: string;
}

/** Retorno da RPC get_circulo_membros_para_cracha */
interface CirculoMembroRaw {
    membro_id: string;
    inscricao_id: string;
    pessoa_nome: string;
    circulo_nome: string;
    circulo_cor: string;
    is_coordenador: boolean;
    coord_esposo_nome: string | null;
    coord_esposa_nome: string | null;
    evento_nome: string;
}

// ============================================================
// ADAPTER: INSCRITOS (Encontristas — Casais e Individuais)
// ============================================================

/**
 * Busca inscritos de um evento e normaliza para CanonicalBadgePayload.
 * Utiliza a RPC existente `get_inscritos_para_cracha` (v2).
 */
export async function fetchInscritosBadges(eventoId: number): Promise<CanonicalBadgePayload[]> {
    const { data, error } = await supabase
        .rpc('get_inscritos_para_cracha' as any, { p_evento_id: eventoId });

    if (error) throw new Error(`Erro ao carregar inscritos: ${error.message}`);

    const inscritos = (data as InscritoRaw[]) ?? [];

    return inscritos.map((p): CanonicalBadgePayload => {
        const tipoLabel =
            p.tipo === 'esposo' ? 'Esposo' :
            p.tipo === 'esposa' ? 'Esposa' : 'Individual';

        const footerMeta: Array<{ label: string; value: string }> = [];
        if (p.paroquia) footerMeta.push({ label: 'Paróquia', value: p.paroquia });
        if (p.diocese)  footerMeta.push({ label: 'Diocese', value: p.diocese });
        if (p.cidade)   footerMeta.push({ label: 'Cidade', value: p.cidade });

        const secondaryName = formatarVinculoConjuge(p.tipo, p.nome_conjuge);

        return {
            id: `${p.inscricao_id}-${p.tipo}`,
            primary_name: p.nome,
            secondary_name: secondaryName,
            category_label: tipoLabel,
            accent_color: DEFAULT_ACCENT_COLORS.INSCRITO,
            event_info: {
                event_name: p.evento,
            },
            qr_code_content: `BPD:INS:${p.inscricao_id}:${eventoId}`,
            footer_metadata: footerMeta,
        };
    });
}

// ============================================================
// ADAPTER: EQUIPES DE APOIO
// ============================================================

/**
 * Busca membros de equipes de um evento e normaliza para CanonicalBadgePayload.
 * Utiliza a RPC `get_equipe_membros_para_cracha`.
 */
export async function fetchEquipesBadges(
    eventoId: number,
    equipeId?: number
): Promise<CanonicalBadgePayload[]> {
    const params: Record<string, any> = { p_evento_id: eventoId };
    if (equipeId) params.p_equipe_id = equipeId;

    const { data, error } = await supabase
        .rpc('get_equipe_membros_para_cracha' as any, params);

    if (error) throw new Error(`Erro ao carregar equipes: ${error.message}`);

    const membros = (data as EquipeMembroRaw[]) ?? [];

    return membros.map((m): CanonicalBadgePayload => {
        // Liderança de Equipes (níveis 1 e 2) é exibida como "Casal Coordenador" (padrão v6.4+)
        let roleBadgeText: string | null = null;
        if (m.cargo_nivel === 1 || m.cargo_nivel === 2 || m.cargo_nome === 'Chefe' || m.cargo_nome === 'Subchefe') {
            roleBadgeText = 'Casal Coordenador';
        } else if (m.cargo_nivel !== 3 && m.cargo_nome && m.cargo_nome !== 'Componente') {
            roleBadgeText = m.cargo_nome;
        }

        const footerMeta: Array<{ label: string; value: string }> = [
            { label: 'Equipe', value: m.equipe_nome },
        ];
        if (m.observacao) {
            footerMeta.push({ label: 'Obs', value: m.observacao });
        }

        return {
            id: `EQP-${m.membro_id}`,
            primary_name: m.nome,
            category_label: m.equipe_nome,
            role_badge: roleBadgeText,
            accent_color: m.equipe_cor || DEFAULT_ACCENT_COLORS.EQUIPE,
            event_info: {
                event_name: m.evento_nome,
            },
            qr_code_content: `BPD:EQP:${m.membro_id}:PES:${m.pessoa_id}`,
            footer_metadata: footerMeta,
        };
    });
}

// ============================================================
// ADAPTER: PALESTRANTES
// ============================================================

/**
 * Busca palestrantes vinculados a atividades de um evento
 * e normaliza para CanonicalBadgePayload.
 * Utiliza a RPC `get_palestrantes_para_cracha`.
 */
export async function fetchPalestrantesBadges(eventoId: number): Promise<CanonicalBadgePayload[]> {
    const { data, error } = await supabase
        .rpc('get_palestrantes_para_cracha' as any, { p_evento_id: eventoId });

    if (error) throw new Error(`Erro ao carregar palestrantes: ${error.message}`);

    const palestrantes = (data as PalestranteRaw[]) ?? [];

    return palestrantes.map((p): CanonicalBadgePayload => {
        const tipoLabel =
            p.tipo_participacao === 'principal' ? 'Principal' :
            p.tipo_participacao === 'painelista' ? 'Painelista' : 'Mediador';

        const footerMeta: Array<{ label: string; value: string }> = [];
        if (p.atividade_titulo) footerMeta.push({ label: 'Palestra', value: p.atividade_titulo });
        if (p.atividade_data && p.atividade_hora) {
            const dataFormatada = new Date(p.atividade_data).toLocaleDateString('pt-BR', {
                weekday: 'long',
            });
            const hora = p.atividade_hora.slice(0, 5);
            footerMeta.push({ label: 'Horário', value: `${dataFormatada} - ${hora}` });
        }

        return {
            id: `PAL-${p.palestrante_id}`,
            avatar_url: p.foto_url,
            primary_name: p.nome,
            category_label: 'Palestrante',
            role_badge: tipoLabel,
            accent_color: DEFAULT_ACCENT_COLORS.PALESTRANTE,
            event_info: {
                event_name: p.evento_nome,
            },
            qr_code_content: `BPD:PAL:${p.palestrante_id}:EVT:${eventoId}`,
            footer_metadata: footerMeta,
        };
    });
}

// ============================================================
// ADAPTER: CÍRCULOS / GRUPOS
// ============================================================

/**
 * Busca membros de círculos de um evento e normaliza para CanonicalBadgePayload.
 * Utiliza a RPC `get_circulo_membros_para_cracha`.
 */
export async function fetchCirculosBadges(
    eventoId: number,
    circuloId?: string
): Promise<CanonicalBadgePayload[]> {
    const params: Record<string, any> = { p_evento_id: eventoId };
    if (circuloId) params.p_circulo_id = circuloId;

    const { data, error } = await supabase
        .rpc('get_circulo_membros_para_cracha' as any, params);

    if (error) throw new Error(`Erro ao carregar círculos: ${error.message}`);

    const membros = (data as CirculoMembroRaw[]) ?? [];

    return membros.map((m): CanonicalBadgePayload => {
        const role = m.is_coordenador ? 'Coordenador de Círculo' : 'Encontrista';

        // Montar nome do casal coordenador para o rodapé
        const coordLabel = [m.coord_esposo_nome, m.coord_esposa_nome]
            .filter(Boolean)
            .join(' e ');

        const footerMeta: Array<{ label: string; value: string }> = [];
        if (coordLabel) footerMeta.push({ label: 'Coord.', value: coordLabel });

        return {
            id: `CIR-${m.membro_id}`,
            primary_name: m.pessoa_nome,
            category_label: m.circulo_nome,
            role_badge: role,
            accent_color: m.circulo_cor || DEFAULT_ACCENT_COLORS.CIRCULO,
            event_info: {
                event_name: m.evento_nome,
            },
            qr_code_content: `BPD:CIR:${m.membro_id}:INS:${m.inscricao_id}`,
            footer_metadata: footerMeta,
        };
    });
}

// ============================================================
// DISPATCHER: Carrega dados pelo tipo de fonte selecionado
// ============================================================

/**
 * Função dispatcher que chama o Adapter correto baseado no BadgeSourceEntity.
 */
export async function fetchBadgesBySource(
    source: BadgeSourceEntity,
    eventoId: number,
    filtros?: { equipe_id?: number; circulo_id?: string }
): Promise<CanonicalBadgePayload[]> {
    switch (source) {
        case 'INSCRITO':
            return fetchInscritosBadges(eventoId);
        case 'EQUIPE':
            return fetchEquipesBadges(eventoId, filtros?.equipe_id);
        case 'PALESTRANTE':
            return fetchPalestrantesBadges(eventoId);
        case 'CIRCULO':
            return fetchCirculosBadges(eventoId, filtros?.circulo_id);
        default:
            throw new Error(`Fonte de dados desconhecida: ${source}`);
    }
}
