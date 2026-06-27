import { supabase } from '../lib/supabase';
import type { CargoEquipe, Equipe, EquipeMembro, EquipeTarefa } from '../types';

// ========================================
// FUNÇÕES ADMIN: CARGOS
// ========================================

/**
 * Lista todos os cargos disponíveis (tabela auxiliar)
 */
export async function fetchCargos(): Promise<CargoEquipe[]> {
    const { data, error } = await supabase
        .from('cargos_equipe')
        .select('*')
        .order('nivel', { ascending: true });

    if (error) {
        console.error('Erro ao buscar cargos:', error);
        throw error;
    }
    return (data as CargoEquipe[]) || [];
}

// ========================================
// FUNÇÕES ADMIN: EQUIPES
// ========================================

/**
 * Lista equipes de um evento com contagem de membros
 */
export async function fetchEquipes(eventoId: number): Promise<any[]> {
    const { data, error } = await supabase
        .from('equipes')
        .select(`
            *,
            equipe_membros (
                id,
                pessoa_id,
                cargo_id,
                pessoa:pessoas ( id, nome, cpf, email, telefone ),
                cargo:cargos_equipe ( id, nome, nivel )
            )
        `)
        .eq('evento_id', eventoId)
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao buscar equipes:', error);
        throw error;
    }
    return data || [];
}

/**
 * Carrega equipe completa com membros (join pessoas + cargos)
 */
export async function fetchEquipeComMembros(equipeId: number): Promise<any> {
    const { data, error } = await supabase
        .from('equipes')
        .select(`
            *,
            equipe_membros (
                id,
                pessoa_id,
                cargo_id,
                observacao,
                pessoa:pessoas ( id, nome, cpf, email, telefone ),
                cargo:cargos_equipe ( id, nome, descricao, nivel )
            )
        `)
        .eq('id', equipeId)
        .single();

    if (error) {
        console.error('Erro ao buscar equipe com membros:', error);
        throw error;
    }
    return data;
}

/**
 * Cria nova equipe
 */
export async function createEquipe(data: {
    evento_id: number;
    nome: string;
    descricao?: string;
    cor?: string;
}): Promise<Equipe> {
    const { data: equipe, error } = await supabase
        .from('equipes')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('Erro ao criar equipe:', error);
        throw error;
    }
    return equipe as Equipe;
}

/**
 * Atualiza dados de uma equipe
 */
export async function updateEquipe(id: number, data: {
    nome?: string;
    descricao?: string;
    cor?: string;
}): Promise<Equipe> {
    const { data: equipe, error } = await supabase
        .from('equipes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erro ao atualizar equipe:', error);
        throw error;
    }
    return equipe as Equipe;
}

/**
 * Remove uma equipe (CASCADE remove membros e tarefas)
 */
export async function deleteEquipe(id: number): Promise<void> {
    const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir equipe:', error);
        throw error;
    }
}

// ========================================
// FUNÇÕES ADMIN: MEMBROS
// ========================================

/**
 * Adiciona membro a uma equipe com cargo
 */
export async function addMembro(
    equipeId: number,
    pessoaId: string,
    cargoId: number,
    observacao?: string
): Promise<EquipeMembro> {
    const { data, error } = await supabase
        .from('equipe_membros')
        .insert({
            equipe_id: equipeId,
            pessoa_id: pessoaId,
            cargo_id: cargoId,
            observacao: observacao || null,
        })
        .select(`
            *,
            pessoa:pessoas ( id, nome, cpf, email, telefone ),
            cargo:cargos_equipe ( id, nome, descricao, nivel )
        `)
        .single();

    if (error) {
        console.error('Erro ao adicionar membro:', error);
        throw error;
    }
    return data as EquipeMembro;
}

/**
 * Altera o cargo de um membro
 */
export async function updateMembroCargo(membroId: number, cargoId: number): Promise<void> {
    const { error } = await supabase
        .from('equipe_membros')
        .update({ cargo_id: cargoId })
        .eq('id', membroId);

    if (error) {
        console.error('Erro ao atualizar cargo do membro:', error);
        throw error;
    }
}

/**
 * Remove um membro de uma equipe
 */
export async function removeMembro(membroId: number): Promise<void> {
    const { error } = await supabase
        .from('equipe_membros')
        .delete()
        .eq('id', membroId);

    if (error) {
        console.error('Erro ao remover membro:', error);
        throw error;
    }
}

/**
 * Busca pessoas por nome ou CPF para autocomplete (LIMIT 20)
 */
export async function buscarPessoas(termo: string): Promise<any[]> {
    if (!termo || termo.trim().length < 2) return [];

    const termoLimpo = termo.trim();

    const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome, cpf, email, telefone')
        .or(`nome.ilike.%${termoLimpo}%,cpf.ilike.%${termoLimpo}%`)
        .order('nome', { ascending: true })
        .limit(20);

    if (error) {
        console.error('Erro ao buscar pessoas:', error);
        throw error;
    }
    return data || [];
}

// ========================================
// FUNÇÕES ADMIN: TAREFAS
// ========================================

/**
 * Lista tarefas de uma equipe
 */
export async function fetchTarefas(equipeId: number): Promise<EquipeTarefa[]> {
    const { data, error } = await supabase
        .from('equipe_tarefas')
        .select('*')
        .eq('equipe_id', equipeId)
        .order('prioridade', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
    }
    return (data as EquipeTarefa[]) || [];
}

/**
 * Cria nova tarefa em uma equipe
 */
export async function createTarefa(data: {
    equipe_id: number;
    titulo: string;
    descricao?: string;
    status?: string;
    prioridade?: string;
    data_limite?: string;
}): Promise<EquipeTarefa> {
    const { data: tarefa, error } = await supabase
        .from('equipe_tarefas')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('Erro ao criar tarefa:', error);
        throw error;
    }
    return tarefa as EquipeTarefa;
}

/**
 * Atualiza uma tarefa existente
 */
export async function updateTarefa(id: number, data: {
    titulo?: string;
    descricao?: string;
    status?: string;
    prioridade?: string;
    data_limite?: string | null;
}): Promise<EquipeTarefa> {
    const { data: tarefa, error } = await supabase
        .from('equipe_tarefas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw error;
    }
    return tarefa as EquipeTarefa;
}

/**
 * Exclui uma tarefa
 */
export async function deleteTarefa(id: number): Promise<void> {
    const { error } = await supabase
        .from('equipe_tarefas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir tarefa:', error);
        throw error;
    }
}

// ========================================
// FUNÇÕES PARTICIPANTE: MINHAS EQUIPES
// ========================================

/**
 * Busca pessoa pelo email (vincula auth.user ↔ pessoa)
 */
export async function fetchPessoasPorEmail(email: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome, cpf, email, telefone')
        .ilike('email', email.trim());

    if (error) {
        console.error('Erro ao buscar pessoas por email:', error);
        return [];
    }
    return data || [];
}

/**
 * Busca todas as equipes onde a pessoa (ou lista de IDs de pessoas) é membro.
 */
export async function fetchMinhasEquipes(pessoaIds: string[]): Promise<any[]> {
    if (pessoaIds.length === 0) return [];

    // Busca direta: Equipes onde qualquer um dos pessoaIds é membro
    const { data, error } = await supabase
        .from('equipes')
        .select(`
            *,
            equipe_membros!inner (
                id,
                pessoa_id,
                cargo_id,
                cargo:cargos_equipe ( id, nome, nivel )
            ),
            all_membros:equipe_membros (
                id,
                pessoa_id,
                cargo_id,
                pessoa:pessoas ( id, nome, cpf, email, telefone ),
                cargo:cargos_equipe ( id, nome, nivel )
            ),
            equipe_tarefas (
                *
            )
        `)
        .in('equipe_membros.pessoa_id', pessoaIds)
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao buscar minhas equipes (query única):', error);
        throw error;
    }

    // Processar para que o formato seja amigável ao frontend
    return (data || []).map(equipe => {
        // O membro logado é aquele que casou com algum dos pessoaIds
        const meuMembro = (equipe.equipe_membros as any[]).find(m => pessoaIds.includes(m.pessoa_id));
        
        return {
            ...equipe,
            equipe_membros: equipe.all_membros,
            meuCargo: meuMembro?.cargo,
            meuCargoNivel: meuMembro?.cargo?.nivel ?? 99,
        };
    });
}
