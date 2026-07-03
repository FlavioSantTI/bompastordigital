import { supabase } from '../lib/supabase';

export interface ResumoReservas {
    totalReservas: number;
    vagasDisponiveis: number;
}

export interface InscricaoReserva {
    id: string;
    created_at: string;
    tipo: 'casal' | 'individual';
    status: string;
    esposo?: { nome: string; telefone: string; email: string };
    esposa?: { nome: string; telefone: string; email: string };
}

export interface ResultadoPromocao {
    success: boolean;
    message?: string;
    promovidos: Array<{
        inscricao_id: string;
        posicao_anterior: number;
        esposo_nome: string;
        esposo_telefone: string;
        esposo_email: string;
        esposa_nome: string;
        esposa_telefone: string;
        esposa_email: string;
        novo_status: string;
    }>;
    total_promovidos: number;
    restantes_na_fila: number;
}

/**
 * Busca o resumo de vagas e fila de reservas para um evento específico.
 */
export async function getResumoReservas(eventoId: number): Promise<ResumoReservas> {
    // 1. Contar reservas
    const { count: totalReservas } = await supabase
        .from('inscricoes')
        .select('*', { count: 'exact', head: true })
        .eq('evento_id', eventoId)
        .eq('status', 'reserva');

    // 2. Buscar vagas totais do evento
    const { data: evento } = await supabase
        .from('eventos')
        .select('vagas')
        .eq('id', eventoId)
        .single();

    const totalVagas = evento?.vagas || 0;

    // 3. Contar inscrições ativas (confirmada / pendente)
    const { count: ativos } = await supabase
        .from('inscricoes')
        .select('*', { count: 'exact', head: true })
        .eq('evento_id', eventoId)
        .in('status', ['confirmada', 'pendente']);

    const vagasDisponiveis = Math.max(0, totalVagas - (ativos || 0));

    return {
        totalReservas: totalReservas || 0,
        vagasDisponiveis
    };
}

/**
 * Busca a fila de espera ordenada cronologicamente (FIFO).
 */
export async function getFilaEspera(eventoId: number): Promise<InscricaoReserva[]> {
    const { data, error } = await supabase
        .from('inscricoes')
        .select(`
            id,
            created_at,
            tipo,
            status,
            esposo:esposo_id(nome, telefone, email),
            esposa:esposa_id(nome, telefone, email)
        `)
        .eq('evento_id', eventoId)
        .eq('status', 'reserva')
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return (data || []) as any[];
}

/**
 * Promove reservas em lote via RPC SQL.
 */
export async function promoverReservasLote(eventoId: number, quantidade: number): Promise<ResultadoPromocao> {
    const { data, error } = await supabase
        .rpc('promover_reservas_lote', {
            p_evento_id: eventoId,
            p_quantidade: quantidade
        });

    if (error) {
        throw new Error(error.message);
    }

    return data as ResultadoPromocao;
}
