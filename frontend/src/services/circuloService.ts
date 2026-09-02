import { supabase } from '../lib/supabase';
import type { Circulo } from '../types';

export interface CasalCoordenadorOpcao {
    esposo: {
        id: string;
        nome: string;
        cpf?: string;
        telefone?: string;
        email?: string;
    };
    esposa?: {
        id: string;
        nome: string;
        cpf?: string;
        telefone?: string;
        email?: string;
    };
    paroquia?: string;
}

export interface InscricaoDisponivel {
    id: string;
    tipo: 'casal' | 'individual';
    status: string;
    esposo_nome: string;
    esposa_nome?: string;
    telefone?: string;
    paroquia?: string;
    jaAlocadoOutroCirculo?: boolean;
    nomeCirculoAtual?: string;
}

/**
 * Busca todos os círculos de um evento com dados dos coordenadores e membros
 */
export async function fetchCirculos(eventoId: number): Promise<Circulo[]> {
    const { data: circulosRaw, error } = await supabase
        .from('circulos')
        .select(`
            *,
            esposo_coordenador:pessoas!circulos_esposo_coordenador_id_fkey ( id, nome, telefone, email ),
            esposa_coordenador:pessoas!circulos_esposa_coordenador_id_fkey ( id, nome, telefone, email ),
            circulo_membros ( id, inscricao_id )
        `)
        .eq('evento_id', eventoId)
        .order('nome', { ascending: true });

    if (error) {
        // Tentar fallback se os nomes das FKeys não forem resolvidos automaticamente
        console.warn('Busca simples de círculos devido a formato de FKey...', error.message);
        const { data: simpleData, error: simpleError } = await supabase
            .from('circulos')
            .select(`*, circulo_membros(id, inscricao_id)`)
            .eq('evento_id', eventoId)
            .order('nome', { ascending: true });

        if (simpleError) throw simpleError;

        // Populate manual das pessoas coordenadoras
        const result: Circulo[] = [];
        for (const c of (simpleData || [])) {
            const pessoaIds: string[] = [c.esposo_coordenador_id];
            if (c.esposa_coordenador_id) pessoaIds.push(c.esposa_coordenador_id);

            const { data: pessoas } = await supabase
                .from('pessoas')
                .select('id, nome, telefone, email')
                .in('id', pessoaIds);

            const esposo = (pessoas || []).find(p => p.id === c.esposo_coordenador_id);
            const esposa = (pessoas || []).find(p => p.id === c.esposa_coordenador_id);

            result.push({
                ...c,
                esposo_coordenador: esposo,
                esposa_coordenador: esposa,
                total_membros: (c.circulo_membros || []).length,
            });
        }
        return result;
    }

    return (circulosRaw || []).map((c: any) => ({
        ...c,
        total_membros: (c.circulo_membros || []).length,
    }));
}

/**
 * Busca casais candidatos a coordenadores na base de pessoas.
 * REGRA: Pessoas inscritas no evento atual NÃO PODEM ser coordenadoras deste evento.
 */
export async function buscarCasalCoordenador(query: string, eventoId: number): Promise<CasalCoordenadorOpcao[]> {
    if (!query || query.trim().length < 2) return [];

    // 1. Obter IDs de pessoas inscritas no evento atual para excluir
    const { data: inscritosEvento } = await supabase
        .from('inscricoes')
        .select('esposo_id, esposa_id')
        .eq('evento_id', eventoId);

    const pessoaIdsInscritasNoEvento = new Set<string>();
    (inscritosEvento || []).forEach(i => {
        if (i.esposo_id) pessoaIdsInscritasNoEvento.add(i.esposo_id);
        if (i.esposa_id) pessoaIdsInscritasNoEvento.add(i.esposa_id);
    });

    // 2. Buscar pessoas por nome ou telefone
    const { data: pessoas, error } = await supabase
        .from('pessoas')
        .select('id, nome, cpf, email, telefone')
        .ilike('nome', `%${query.trim()}%`)
        .limit(25);

    if (error || !pessoas) return [];

    // 3. Filtrar quem está inscrito no evento atual
    const pessoasElegiveis = pessoas.filter(p => !pessoaIdsInscritasNoEvento.has(p.id));
    if (pessoasElegiveis.length === 0) return [];

    // 4. Buscar os vínculos de casal e paróquias em inscricoes (de outros eventos)
    const pessoaIds = pessoasElegiveis.map(p => p.id);
    const { data: vinculosInscricoes } = await supabase
        .from('inscricoes')
        .select('esposo_id, esposa_id, dados_conjuntos')
        .or(`esposo_id.in.(${pessoaIds.join(',')}),esposa_id.in.(${pessoaIds.join(',')})`);

    const resultados: CasalCoordenadorOpcao[] = [];
    const processados = new Set<string>();

    for (const p of pessoasElegiveis) {
        if (processados.has(p.id)) continue;

        // Tentar achar a inscrição que conecta essa pessoa a seu cônjuge
        const vinculo = (vinculosInscricoes || []).find(
            v => v.esposo_id === p.id || v.esposa_id === p.id
        );

        let esposa: any = undefined;
        let paroquia: string | undefined = undefined;

        if (vinculo) {
            paroquia = vinculo.dados_conjuntos?.paroquia;

            const outroPessoaId = vinculo.esposo_id === p.id ? vinculo.esposa_id : vinculo.esposo_id;
            if (outroPessoaId && !pessoaIdsInscritasNoEvento.has(outroPessoaId)) {
                // Buscar dados do cônjuge se também não estiver no evento atual
                const { data: conjuge } = await supabase
                    .from('pessoas')
                    .select('id, nome, cpf, email, telefone')
                    .eq('id', outroPessoaId)
                    .single();

                if (conjuge) {
                    esposa = conjuge;
                    processados.add(conjuge.id);
                }
            }
        }

        processados.add(p.id);
        resultados.push({
            esposo: p,
            esposa,
            paroquia,
        });
    }

    return resultados;
}

/**
 * Busca todas as inscrições ativas do evento e marca se já pertencem a outro círculo
 */
export async function fetchInscritosDisponiveis(
    eventoId: number,
    circuloIdAtual?: string
): Promise<InscricaoDisponivel[]> {
    // 1. Buscar todos os círculos do evento com seus membros alocados
    const { data: circulos } = await supabase
        .from('circulos')
        .select('id, nome, circulo_membros(inscricao_id)')
        .eq('evento_id', eventoId);

    const alocacoesMap = new Map<string, { circuloId: string; circuloNome: string }>();
    (circulos || []).forEach(c => {
        (c.circulo_membros || []).forEach((m: any) => {
            if (m.inscricao_id) {
                alocacoesMap.set(m.inscricao_id, { circuloId: c.id, circuloNome: c.nome });
            }
        });
    });

    // 2. Buscar todas as inscrições do evento
    const { data: rawInscricoes, error } = await supabase
        .from('inscricoes')
        .select('*')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    if (!rawInscricoes || rawInscricoes.length === 0) return [];

    // 3. Carregar nomes dos esposos e esposas
    const pessoaIdsSet = new Set<string>();
    rawInscricoes.forEach(i => {
        if (i.esposo_id) pessoaIdsSet.add(i.esposo_id);
        if (i.esposa_id) pessoaIdsSet.add(i.esposa_id);
    });

    let pessoasMap: Record<string, any> = {};
    if (pessoaIdsSet.size > 0) {
        const { data: pessoas } = await supabase
            .from('pessoas')
            .select('id, nome, telefone')
            .in('id', Array.from(pessoaIdsSet));

        (pessoas || []).forEach(p => {
            pessoasMap[p.id] = p;
        });
    }

    return rawInscricoes.map(insc => {
        const esposo = pessoasMap[insc.esposo_id] || {};
        const esposa = insc.esposa_id ? pessoasMap[insc.esposa_id] : undefined;
        const alocacao = alocacoesMap.get(insc.id);

        const jaAlocadoOutroCirculo = !!alocacao && (!circuloIdAtual || alocacao.circuloId !== circuloIdAtual);

        const telefone = esposo.telefone || esposa?.telefone || '';
        const paroquia = insc.dados_conjuntos?.paroquia || '';

        return {
            id: insc.id,
            tipo: insc.esposa_id ? 'casal' : 'individual',
            status: insc.status || 'pendente',
            esposo_nome: esposo.nome || 'Participante',
            esposa_nome: esposa?.nome,
            telefone,
            paroquia,
            jaAlocadoOutroCirculo,
            nomeCirculoAtual: alocacao?.circuloNome,
        };
    });
}

/**
 * Retorna os IDs de inscrição já vinculados a um círculo
 */
export async function fetchMembrosDoCirculo(circuloId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('circulo_membros')
        .select('inscricao_id')
        .eq('circulo_id', circuloId);

    if (error) throw error;
    return (data || []).map(m => m.inscricao_id);
}

/**
 * Cria um novo círculo
 */
export async function createCirculo(dados: {
    evento_id: number;
    nome: string;
    descricao?: string;
    cor: string;
    esposo_coordenador_id: string;
    esposa_coordenador_id?: string;
}): Promise<Circulo> {
    const { data, error } = await supabase
        .from('circulos')
        .insert({
            evento_id: dados.evento_id,
            nome: dados.nome,
            descricao: dados.descricao || null,
            cor: dados.cor || '#0284C7',
            esposo_coordenador_id: dados.esposo_coordenador_id,
            esposa_coordenador_id: dados.esposa_coordenador_id || null,
        })
        .select('*')
        .single();

    if (error) {
        console.error('Erro ao criar círculo:', error);
        throw error;
    }

    return data;
}

/**
 * Atualiza metadados e coordenadores de um círculo existente
 */
export async function updateCirculo(
    id: string,
    dados: {
        nome: string;
        descricao?: string;
        cor: string;
        esposo_coordenador_id: string;
        esposa_coordenador_id?: string;
    }
): Promise<Circulo> {
    const { data, error } = await supabase
        .from('circulos')
        .update({
            nome: dados.nome,
            descricao: dados.descricao || null,
            cor: dados.cor,
            esposo_coordenador_id: dados.esposo_coordenador_id,
            esposa_coordenador_id: dados.esposa_coordenador_id || null,
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        console.error('Erro ao atualizar círculo:', error);
        throw error;
    }

    return data;
}

/**
 * Exclui um círculo e suas associações (deleção em cascata via FK)
 */
export async function deleteCirculo(id: string): Promise<void> {
    const { error } = await supabase
        .from('circulos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erro ao excluir círculo:', error);
        throw error;
    }
}

/**
 * Atualiza em lote (batch) a lista de membros de um círculo
 */
export async function salvarMembrosCirculoBatch(
    circuloId: string,
    inscricaoIds: string[]
): Promise<void> {
    // 1. Remover membros antigos
    const { error: deleteError } = await supabase
        .from('circulo_membros')
        .delete()
        .eq('circulo_id', circuloId);

    if (deleteError) {
        console.error('Erro ao limpar membros antigos do círculo:', deleteError);
        throw deleteError;
    }

    if (inscricaoIds.length === 0) return;

    // 2. Inserir os novos membros selecionados
    const rowsToInsert = inscricaoIds.map(inscId => ({
        circulo_id: circuloId,
        inscricao_id: inscId,
    }));

    const { error: insertError } = await supabase
        .from('circulo_membros')
        .insert(rowsToInsert);

    if (insertError) {
        console.error('Erro ao inserir novos membros no círculo:', insertError);
        throw insertError;
    }
}
