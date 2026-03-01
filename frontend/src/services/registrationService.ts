import { supabase } from '../lib/supabase';
import type { RegistrationData } from '../types';

export interface RegistrationPayload extends RegistrationData {
    evento_id: number;
    user_id?: string;
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
 * VALIDAÇÃO NO FRONTEND - não depende de função do banco
 */
export async function validateCoupleAvailability(
    eventoId: number,
    cpfEsposo: string,
    cpfEsposa: string
): Promise<{ available: boolean; message?: string }> {
    try {
        // 1. Validar formato dos CPFs
        if (!isValidCPF(cpfEsposo)) {
            return { available: false, message: 'CPF do esposo está inválido.' };
        }
        if (!isValidCPF(cpfEsposa)) {
            return { available: false, message: 'CPF da esposa está inválido.' };
        }

        // 2. Verificar se CPFs são diferentes
        const cpfEsposoClean = cpfEsposo.replace(/\D/g, '');
        const cpfEsposaClean = cpfEsposa.replace(/\D/g, '');

        if (cpfEsposoClean === cpfEsposaClean) {
            return { available: false, message: 'Os CPFs do esposo e esposa devem ser diferentes.' };
        }

        // 3. Buscar IDs das pessoas com esses CPFs
        const { data: pessoasData } = await supabase
            .from('pessoas')
            .select('id, cpf')
            .in('cpf', [cpfEsposo, cpfEsposa]);

        if (!pessoasData || pessoasData.length === 0) {
            // CPFs não existem no banco = disponíveis
            return { available: true };
        }

        // 4. Verificar se algum dos CPFs já está inscrito neste evento
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
    // Se já estiver em formato ISO, retorna direto
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

        // 1. Chamar a procedure RPC no Supabase
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

        console.log('Resultado da RPC:', data);

        // A RPC retorna um JSON com { success, message, inscricaoId, evento }
        // Precisamos fazer um cast para o tipo correto pois o TypeScript vê como Json genérico
        interface RpcResponse {
            success: boolean;
            message: string;
            inscricaoId?: string;
            evento?: { nome: string; data_inicio: string; data_fim: string };
        }

        const rpcResult = data as unknown as RpcResponse;

        // A procedure retorna exatamente o formato do objeto de resultado esperado
        if (!rpcResult?.success) {
            return { success: false, message: rpcResult?.message || 'Erro desconhecido' };
        }

        console.log('Inscrição criada atômicamente:', rpcResult);

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
