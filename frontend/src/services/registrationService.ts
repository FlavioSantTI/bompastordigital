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
    inscricaoId?: number;
}> {
    try {
        console.log('Iniciando registro do casal...', payload);

        // 1. Validar disponibilidade dos CPFs
        const validation = await validateCoupleAvailability(
            payload.evento_id,
            payload.esposo.cpf,
            payload.esposa.cpf
        );

        if (!validation.available) {
            return { success: false, message: validation.message || 'CPFs indisponíveis.' };
        }

        // 2. UPSERT dados do esposo na tabela pessoas (por CPF)
        const { data: esposo, error: errorEsposo } = await supabase
            .from('pessoas')
            .upsert(
                {
                    cpf: payload.esposo.cpf,
                    nome: payload.esposo.nome,
                    nascimento: convertDateToISO(payload.esposo.nascimento),
                    email: payload.esposo.email,
                    telefone: cleanPhone(payload.esposo.telefone),
                },
                {
                    onConflict: 'cpf',
                    ignoreDuplicates: false
                }
            )
            .select('id')
            .single();

        if (errorEsposo || !esposo) {
            console.error('Erro ao inserir/atualizar esposo:', errorEsposo);
            return { success: false, message: 'Erro ao cadastrar dados do esposo.' };
        }

        console.log('Esposo cadastrado:', esposo);

        // 3. UPSERT dados da esposa na tabela pessoas (por CPF)
        const { data: esposa, error: errorEsposa } = await supabase
            .from('pessoas')
            .upsert(
                {
                    cpf: payload.esposa.cpf,
                    nome: payload.esposa.nome,
                    nascimento: convertDateToISO(payload.esposa.nascimento),
                    email: payload.esposa.email,
                    telefone: cleanPhone(payload.esposa.telefone),
                },
                {
                    onConflict: 'cpf',
                    ignoreDuplicates: false
                }
            )
            .select('id')
            .single();

        if (errorEsposa || !esposa) {
            console.error('Erro ao inserir/atualizar esposa:', errorEsposa);
            return { success: false, message: 'Erro ao cadastrar dados da esposa.' };
        }

        console.log('Esposa cadastrada:', esposa);

        // 4. Buscar diocese_id do município selecionado
        const { data: municipioData } = await supabase
            .from('municipios')
            .select('diocese_id')
            .eq('codigo_tom', payload.contato.municipio_id)
            .single();

        // 5. Inserir inscrição com dados completos
        const { data: inscricaoData, error: errorInscricao } = await supabase
            .from('inscricoes')
            .insert({
                evento_id: payload.evento_id,
                esposo_id: esposo.id,
                esposa_id: esposa.id,
                diocese_id: municipioData?.diocese_id || null,
                user_id: payload.user_id, // Vinculando ao usuário logado
                dados_conjuntos: {
                    paroquia: payload.dados_conjuntos.paroquia,
                    paroco: payload.dados_conjuntos.paroco,
                    endereco: payload.dados_conjuntos.endereco,
                    nova_uniao: payload.dados_conjuntos.nova_uniao,
                    membro_pasfam: payload.dados_conjuntos.membro_pasfam,
                    pastorais: payload.dados_conjuntos.pastorais || [],
                    necessita_hospedagem: payload.dados_conjuntos.necessita_hospedagem,
                    restricoes_alimentares: payload.dados_conjuntos.restricoes_alimentares || null,
                    observacoes: payload.dados_conjuntos.observacoes || null,
                },
            })
            .select('id')
            .single();

        if (errorInscricao) {
            console.error('Erro ao inserir inscrição:', errorInscricao);

            // Tratamento específico para duplicidade (Erro 23505)
            if (errorInscricao.code === '23505') {
                return { success: false, message: 'Já existe uma inscrição para este casal neste evento.' };
            }

            return { success: false, message: 'Erro ao finalizar inscrição: ' + (errorInscricao.message || 'desconhecido') };
        }

        if (!inscricaoData) {
            return { success: false, message: 'Erro ao recuperar dados da inscrição criada.' };
        }

        console.log('Inscrição criada:', inscricaoData);

        return {
            success: true,
            message: 'Inscrição realizada com sucesso!',
            inscricaoId: inscricaoData.id,
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
