import { supabase } from '../lib/supabase';
import type { RegistrationData, IndividualRegistrationData, TipoInscricao } from '../types';

export interface RegistrationPayload extends RegistrationData {
    evento_id: number;
    user_id?: string;
}

export interface IndividualRegistrationPayload extends IndividualRegistrationData {
    evento_id: number;
    user_id?: string;
}

export interface AdminRegistrationPayload {
    tipo: TipoInscricao;
    evento_id?: number;
    diocese_id?: number;
    pessoa1: {
        nome: string;
        cpf: string;
        nascimento: string;
        email?: string;
        telefone?: string;
    };
    pessoa2?: {
        nome: string;
        cpf: string;
        nascimento: string;
        email?: string;
        telefone?: string;
    };
    dados_conjuntos?: Record<string, any>;
    status?: string;
}

interface RpcResponse {
    success: boolean;
    message: string;
    inscricaoId?: string;
    tipo?: string;
    evento?: { nome: string; data_inicio: string; data_fim: string };
}

/**
 * Valida formato de CPF (apenas dígitos)
 */
function isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
}

/**
 * Valida se os CPFs do casal estão disponíveis para o evento
 */
export async function validateCoupleAvailability(
    eventoId: number,
    cpfEsposo: string,
    cpfEsposa: string
): Promise<{ available: boolean; message?: string }> {
    try {
        if (!isValidCPF(cpfEsposo)) {
            return { available: false, message: 'CPF do esposo está inválido.' };
        }
        if (!isValidCPF(cpfEsposa)) {
            return { available: false, message: 'CPF da esposa está inválido.' };
        }

        const cpfEsposoClean = cpfEsposo.replace(/\D/g, '');
        const cpfEsposaClean = cpfEsposa.replace(/\D/g, '');

        if (cpfEsposoClean === cpfEsposaClean) {
            return { available: false, message: 'Os CPFs do esposo e esposa devem ser diferentes.' };
        }

        const { data: pessoasData } = await supabase
            .from('pessoas')
            .select('id, cpf')
            .in('cpf', [cpfEsposo, cpfEsposa]);

        if (!pessoasData || pessoasData.length === 0) {
            return { available: true };
        }

        const pessoaIds = pessoasData.map(p => p.id);

        const { data: inscricoesExistentes } = await supabase
            .from('inscricoes')
            .select('esposo_id, esposa_id')
            .eq('evento_id', eventoId)
            .or(`esposo_id.in.(${pessoaIds.join(',')}),esposa_id.in.(${pessoaIds.join(',')})`);

        if (inscricoesExistentes && inscricoesExistentes.length > 0) {
            return {
                available: false,
                message: 'Um ou ambos os CPFs já estão inscritos neste evento.'
            };
        }

        return { available: true };
    } catch (error) {
        console.error('Erro ao validar disponibilidade:', error);
        return { available: false, message: 'Erro ao verificar disponibilidade. Tente novamente.' };
    }
}

/**
 * Converte data de DD/MM/YYYY para YYYY-MM-DD
 */
function convertDateToISO(dateStr: string): string {
    if (dateStr.includes('-')) {
        return dateStr;
    }
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Remove formatação de telefone
 */
function cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
}

/**
 * Registra um novo casal no evento
 */
export async function registerCouple(payload: RegistrationPayload): Promise<{
    success: boolean;
    message: string;
    inscricaoId?: string;
    evento?: {
        nome: string;
        data_inicio: string;
        data_fim: string;
        local?: string;
    };
}> {
    try {
        console.log('Iniciando registro do casal via RPC atômica...', payload);

        const rpcPayload = {
            ...payload,
            esposo: {
                ...payload.esposo,
                nascimento: convertDateToISO(payload.esposo.nascimento),
                telefone: cleanPhone(payload.esposo.telefone)
            },
            esposa: {
                ...payload.esposa,
                nascimento: convertDateToISO(payload.esposa.nascimento),
                telefone: cleanPhone(payload.esposa.telefone)
            }
        };

        const { data, error } = await supabase.rpc('registrar_casal_ecc', {
            payload: rpcPayload as unknown as Record<string, any>
        });

        if (error) {
            console.error('Erro na RPC registrar_casal_ecc:', error);
            throw error;
        }

        const rpcResult = data as unknown as RpcResponse;

        if (!rpcResult?.success) {
            return { success: false, message: rpcResult?.message || 'Erro desconhecido' };
        }

        return {
            success: true,
            message: rpcResult.message,
            inscricaoId: rpcResult.inscricaoId,
            evento: rpcResult.evento,
        };

    } catch (error: any) {
        console.error('Erro inesperado no registro:', error);
        return { success: false, message: 'Erro inesperado: ' + (error?.message || 'Tente novamente.') };
    }
}

/**
 * Registra uma inscrição individual
 */
export async function registerIndividual(payload: IndividualRegistrationPayload): Promise<{
    success: boolean;
    message: string;
    inscricaoId?: string;
    evento?: {
        nome: string;
        data_inicio: string;
        data_fim: string;
    };
}> {
    try {
        console.log('Iniciando registro individual via RPC...', payload);

        const rpcPayload = {
            ...payload,
            participante: {
                ...payload.participante,
                nascimento: convertDateToISO(payload.participante.nascimento),
                telefone: cleanPhone(payload.participante.telefone)
            }
        };

        const { data, error } = await supabase.rpc('registrar_individual_ecc' as any, {
            payload: rpcPayload as unknown as Record<string, any>
        });

        if (error) {
            console.error('Erro na RPC registrar_individual_ecc:', error);
            throw error;
        }

        const rpcResult = data as unknown as RpcResponse;

        if (!rpcResult?.success) {
            return { success: false, message: rpcResult?.message || 'Erro desconhecido' };
        }

        return {
            success: true,
            message: rpcResult.message,
            inscricaoId: rpcResult.inscricaoId,
            evento: rpcResult.evento,
        };

    } catch (error: any) {
        console.error('Erro inesperado no registro individual:', error);
        return { success: false, message: 'Erro inesperado: ' + (error?.message || 'Tente novamente.') };
    }
}

/**
 * Registra inscrição via admin (campos mínimos obrigatórios)
 */
export async function registerByAdmin(payload: AdminRegistrationPayload): Promise<{
    success: boolean;
    message: string;
    inscricaoId?: string;
}> {
    try {
        console.log('Registro admin via RPC...', payload);

        const rpcPayload: Record<string, any> = {
            tipo: payload.tipo,
            evento_id: payload.evento_id,
            diocese_id: payload.diocese_id,
            dados_conjuntos: payload.dados_conjuntos || {},
            status: payload.status || 'pendente',
            pessoa1: {
                ...payload.pessoa1,
                nascimento: convertDateToISO(payload.pessoa1.nascimento),
                telefone: payload.pessoa1.telefone ? cleanPhone(payload.pessoa1.telefone) : undefined,
            },
        };

        if (payload.tipo === 'casal' && payload.pessoa2) {
            rpcPayload.pessoa2 = {
                ...payload.pessoa2,
                nascimento: convertDateToISO(payload.pessoa2.nascimento),
                telefone: payload.pessoa2.telefone ? cleanPhone(payload.pessoa2.telefone) : undefined,
            };
        }

        const { data, error } = await supabase.rpc('registrar_inscricao_admin' as any, {
            payload: rpcPayload as unknown as Record<string, any>
        });

        if (error) {
            console.error('Erro na RPC registrar_inscricao_admin:', error);
            throw error;
        }

        const rpcResult = data as unknown as RpcResponse;

        if (!rpcResult?.success) {
            return { success: false, message: rpcResult?.message || 'Erro desconhecido' };
        }

        return {
            success: true,
            message: rpcResult.message,
            inscricaoId: rpcResult.inscricaoId,
        };

    } catch (error: any) {
        console.error('Erro no registro admin:', error);
        return { success: false, message: 'Erro inesperado: ' + (error?.message || 'Tente novamente.') };
    }
}

/**
 * Busca eventos disponíveis para inscrição
 */
export async function fetchAvailableEvents() {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('id, nome, data_inicio, data_fim, vagas')
            .eq('status', 'aberto')
            .order('data_inicio', { ascending: true });

        if (error) {
            console.error('Erro ao buscar eventos:', error);
            return { data: null, error: 'Erro ao carregar eventos disponíveis.' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Erro inesperado:', error);
        return { data: null, error: 'Erro inesperado ao carregar eventos.' };
    }
}
