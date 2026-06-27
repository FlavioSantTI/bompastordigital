/**
 * Serviço de Palestrantes — CRUD de Palestrantes e Vínculos com Atividades
 * Módulo Palestrantes v5.3
 */
import { supabase } from '../lib/supabase';
import type { Palestrante, AtividadePalestrante, TipoParticipacao } from '../types';

// =============================================
// PALESTRANTES (CRUD)
// =============================================

export async function fetchPalestrantes(): Promise<Palestrante[]> {
    const { data, error } = await supabase
        .from('palestrantes')
        .select('*')
        .order('nome', { ascending: true });

    if (error) throw new Error('Erro ao carregar palestrantes: ' + error.message);
    return (data || []) as Palestrante[];
}

export async function createPalestrante(
    palestrante: Omit<Palestrante, 'id' | 'created_at'>
): Promise<Palestrante> {
    const { data, error } = await supabase
        .from('palestrantes')
        .insert([palestrante])
        .select()
        .single();

    if (error) throw new Error('Erro ao criar palestrante: ' + error.message);
    return data as Palestrante;
}

export async function updatePalestrante(
    id: number,
    updates: Partial<Palestrante>
): Promise<Palestrante> {
    const { data, error } = await supabase
        .from('palestrantes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error('Erro ao atualizar palestrante: ' + error.message);
    return data as Palestrante;
}

export async function deletePalestrante(id: number, fotoUrl?: string | null): Promise<void> {
    // Se houver foto no Storage, tentar remover
    if (fotoUrl && fotoUrl.includes('/palestrantes/')) {
        try {
            const fileName = fotoUrl.split('/palestrantes/').pop();
            if (fileName) {
                await supabase.storage.from('palestrantes').remove([fileName]);
            }
        } catch (e) {
            console.warn('Erro ao remover foto do storage ao deletar palestrante:', e);
        }
    }

    const { error } = await supabase
        .from('palestrantes')
        .delete()
        .eq('id', id);

    if (error) throw new Error('Erro ao excluir palestrante: ' + error.message);
}

// =============================================
// UPLOAD DE FOTO
// =============================================

export async function uploadFotoPalestrante(file: File): Promise<string> {
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Apenas imagens JPG, PNG ou WEBP são permitidas.');
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `palestrante_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('palestrantes')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        throw new Error('Erro ao enviar foto: ' + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
        .from('palestrantes')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
}

// =============================================
// VÍNCULOS COM ATIVIDADES (N:N)
// =============================================

export async function fetchVinculosByAtividade(atividadeId: string): Promise<AtividadePalestrante[]> {
    const { data, error } = await supabase
        .from('atividade_palestrantes')
        .select('*, palestrante:palestrantes(*)')
        .eq('atividade_id', atividadeId);

    if (error) throw new Error('Erro ao carregar palestrantes da atividade: ' + error.message);
    return (data || []) as AtividadePalestrante[];
}

export async function salvarVinculosAtividade(
    atividadeId: string,
    vinculos: { palestrante_id: number; tipo_participacao: TipoParticipacao }[]
): Promise<void> {
    // 1. Remover vínculos existentes para substituir pelos novos
    const { error: deleteError } = await supabase
        .from('atividade_palestrantes')
        .delete()
        .eq('atividade_id', atividadeId);

    if (deleteError) throw new Error('Erro ao atualizar vínculos anteriores: ' + deleteError.message);

    if (vinculos.length === 0) return;

    // 2. Inserir novos vínculos
    const rowsToInsert = vinculos.map(v => ({
        atividade_id: atividadeId,
        palestrante_id: v.palestrante_id,
        tipo_participacao: v.tipo_participacao,
    }));

    const { error: insertError } = await supabase
        .from('atividade_palestrantes')
        .insert(rowsToInsert);

    if (insertError) throw new Error('Erro ao salvar palestrantes da atividade: ' + insertError.message);
}
