/**
 * Serviço de Cronograma — CRUD de Salas e Atividades + Validação de Conflitos
 * Módulo Cronograma v4.0
 */
import { supabase } from '../lib/supabase';
import type { Sala, Atividade, CategoriaAtividade, Categoria } from '../types';
import { APP_VERSION, CATEGORIAS_CONFIG } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// =============================================
// SALAS
// =============================================

export async function fetchSalasByEvento(eventoId: number): Promise<Sala[]> {
    const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('evento_id', eventoId)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

    if (error) throw new Error('Erro ao carregar salas: ' + error.message);
    return (data || []) as Sala[];
}

export async function createSala(sala: Omit<Sala, 'id' | 'created_at'>): Promise<Sala> {
    const { data, error } = await supabase
        .from('salas')
        .insert([sala])
        .select()
        .single();

    if (error) throw new Error('Erro ao criar sala: ' + error.message);
    return data as Sala;
}

export async function updateSala(id: number, updates: Partial<Sala>): Promise<Sala> {
    const { data, error } = await supabase
        .from('salas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error('Erro ao atualizar sala: ' + error.message);
    return data as Sala;
}

export async function deleteSala(id: number): Promise<void> {
    const { error } = await supabase
        .from('salas')
        .delete()
        .eq('id', id);

    if (error) throw new Error('Erro ao excluir sala: ' + error.message);
}

// =============================================
// CATEGORIAS
// =============================================

export async function fetchCategoriasByEvento(eventoId: number): Promise<Categoria[]> {
    const { data, error } = await supabase
        .from('categorias_atividade')
        .select('id, nome')
        .eq('evento_id', eventoId)
        .order('nome', { ascending: true });

    if (error) throw new Error('Erro ao carregar categorias: ' + error.message);
    return (data || []) as Categoria[];
}

export async function createCategoria(categoria: Omit<Categoria, 'id' | 'created_at'>): Promise<Categoria> {
    const { data, error } = await supabase
        .from('categorias_atividade')
        .insert([categoria])
        .select()
        .single();

    if (error) throw new Error('Erro ao criar categoria: ' + error.message);
    return data as Categoria;
}

export async function updateCategoria(id: number, updates: Partial<Categoria>): Promise<Categoria> {
    const { data, error } = await supabase
        .from('categorias_atividade')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error('Erro ao atualizar categoria: ' + error.message);
    return data as Categoria;
}

export async function deleteCategoria(id: number): Promise<void> {
    const { error } = await supabase
        .from('categorias_atividade')
        .delete()
        .eq('id', id);

    if (error) throw new Error('Erro ao excluir categoria: ' + error.message);
}

// =============================================
// ATIVIDADES
// =============================================

export async function fetchAtividadesByEventoEData(
    eventoId: number,
    data?: string
): Promise<Atividade[]> {
    let query = supabase
        .from('atividades')
        .select('*, sala:salas(*)')
        .eq('evento_id', eventoId)
        .order('hora_inicio', { ascending: true });

    if (data) {
        query = query.eq('data', data);
    }

    const { data: result, error } = await query;

    if (error) throw new Error('Erro ao carregar atividades: ' + error.message);
    return (result || []) as Atividade[];
}

/** Buscar atividades publicadas de um evento (para visão pública) */
export async function fetchAtividadesPublicadas(eventoId: number): Promise<Atividade[]> {
    const { data, error } = await supabase
        .from('atividades')
        .select('*, sala:salas(id, nome)')
        .eq('evento_id', eventoId)
        .eq('publicado', true)
        .order('data', { ascending: true })
        .order('hora_inicio', { ascending: true });

    if (error) throw new Error('Erro ao carregar agenda: ' + error.message);
    return (data || []) as Atividade[];
}

export async function createAtividade(
    atividade: Omit<Atividade, 'id' | 'created_at' | 'sala'>
): Promise<Atividade> {
    const { data, error } = await supabase
        .from('atividades')
        .insert([atividade])
        .select('*, sala:salas(*)')
        .single();

    if (error) throw new Error('Erro ao criar atividade: ' + error.message);
    return data as Atividade;
}

export async function updateAtividade(
    id: string,
    updates: Partial<Omit<Atividade, 'sala'>>
): Promise<Atividade> {
    const { data, error } = await supabase
        .from('atividades')
        .update(updates)
        .eq('id', id)
        .select('*, sala:salas(*)')
        .single();

    if (error) throw new Error('Erro ao atualizar atividade: ' + error.message);
    return data as Atividade;
}

export async function deleteAtividade(id: string): Promise<void> {
    const { error } = await supabase
        .from('atividades')
        .delete()
        .eq('id', id);

    if (error) throw new Error('Erro ao excluir atividade: ' + error.message);
}

/** Publicar/Despublicar atividades em lote */
export async function togglePublicarAtividades(
    ids: string[],
    publicado: boolean
): Promise<void> {
    const { error } = await supabase
        .from('atividades')
        .update({ publicado })
        .in('id', ids);

    if (error) throw new Error('Erro ao atualizar publicação: ' + error.message);
}

// =============================================
// VALIDAÇÃO DE CONFLITOS
// =============================================

export interface ConflictResult {
    valido: boolean;
    mensagem: string;
}

/**
 * Valida se uma nova atividade (ou edição) gera conflito de sala ou palestrante.
 * A verificação é feita client-side para feedback instantâneo.
 *
 * Regra: CONFLITO se (mesma sala OU mesmo palestrante não-vazio)
 *        E os horários se sobrepõem no mesmo dia.
 *
 * @param atividade - A atividade sendo criada/editada
 * @param existentes - Todas as atividades do mesmo dia
 * @param editingId - ID da atividade sendo editada (para excluir da verificação)
 */
export function validarConflitos(
    atividade: {
        sala_id: number;
        palestrante?: string | null;
        hora_inicio: string;
        hora_fim: string;
    },
    existentes: Atividade[],
    editingId?: string
): ConflictResult {
    const novoInicio = timeToMinutes(atividade.hora_inicio);
    const novoFim = timeToMinutes(atividade.hora_fim);

    if (novoFim <= novoInicio) {
        return { valido: false, mensagem: 'O horário de término deve ser posterior ao de início.' };
    }

    for (const existente of existentes) {
        // Não comparar consigo mesma na edição
        if (editingId && existente.id === editingId) continue;

        const existenteInicio = timeToMinutes(existente.hora_inicio);
        const existenteFim = timeToMinutes(existente.hora_fim);

        // Verificar sobreposição temporal
        const temSobreposicao = novoInicio < existenteFim && novoFim > existenteInicio;

        if (!temSobreposicao) continue;

        // Conflito de SALA
        if (atividade.sala_id === existente.sala_id) {
            return {
                valido: false,
                mensagem: `Conflito de sala: "${existente.titulo}" já ocupa esta sala das ${formatTime(existente.hora_inicio)} às ${formatTime(existente.hora_fim)}.`,
            };
        }

        // Conflito de PALESTRANTE (apenas se ambos tiverem palestrante preenchido)
        const novoPalestrante = (atividade.palestrante || '').trim().toLowerCase();
        const existentePalestrante = (existente.palestrante || '').trim().toLowerCase();

        if (novoPalestrante && existentePalestrante && novoPalestrante === existentePalestrante) {
            return {
                valido: false,
                mensagem: `Conflito de palestrante: "${existente.palestrante}" já tem "${existente.titulo}" das ${formatTime(existente.hora_inicio)} às ${formatTime(existente.hora_fim)}.`,
            };
        }
    }

    return { valido: true, mensagem: '' };
}

// =============================================
// UTILITÁRIOS
// =============================================

/** Converte string de horário (HH:MM ou HH:MM:SS) para minutos desde meia-noite */
export function timeToMinutes(time: string): number {
    const parts = time.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
}

/** Formata horário para exibição (HH:MM) */
export function formatTime(time: string): string {
    return time.substring(0, 5);
}

/** Gera lista de datas entre início e fim de um evento */
export function gerarDatasEvento(dataInicio: string, dataFim: string): string[] {
    const datas: string[] = [];
    const [anoI, mesI, diaI] = dataInicio.split('-').map(Number);
    const [anoF, mesF, diaF] = dataFim.split('-').map(Number);
    const inicio = new Date(anoI, mesI - 1, diaI);
    const fim = new Date(anoF, mesF - 1, diaF);

    const current = new Date(inicio);
    while (current <= fim) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        datas.push(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
    }

    return datas;
}

/** Formata data ISO para exibição pt-BR (ex: "Sex, 12 Abr") */
export function formatDataCurta(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${diasSemana[date.getDay()]}, ${day} ${meses[month - 1]}`;
}

/** Gera array de slots de horário (para linhas da grade) */
export function gerarSlotsHorario(
    horaInicio: number = 6,
    horaFim: number = 23,
    intervaloMinutos: number = 30
): string[] {
    const slots: string[] = [];
    for (let h = horaInicio; h <= horaFim; h++) {
        for (let m = 0; m < 60; m += intervaloMinutos) {
            if (h === horaFim && m > 0) break;
            slots.push(
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
            );
        }
    }
    return slots;
}

// =============================================
// EXPORTAÇÃO PDF / EXCEL
// =============================================

const sanitizarNome = (nome: string) =>
    nome.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/__+/g, '_');

/**
 * Exporta a grade do cronograma como PDF (paisagem).
 * Uma página por dia, grade Salas × Horários.
 */
export function exportarCronogramaPDF(
    eventoNome: string,
    datasEvento: string[],
    salas: Sala[],
    todasAtividades: Atividade[]
) {
    const doc = new jsPDF({ orientation: 'landscape' });

    datasEvento.forEach((data, pageIdx) => {
        if (pageIdx > 0) doc.addPage('landscape');

        const atividadesDoDia = todasAtividades
            .filter(a => a.data === data)
            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

        // Cabeçalho
        doc.setFillColor(30, 58, 95);
        doc.rect(0, 0, 297, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Cronograma: ${eventoNome}`, 10, 14);

        const dataFormatada = data.split('-').reverse().join('/');
        doc.setFontSize(11);
        doc.text(formatDataCurta(data) + ` (${dataFormatada})`, 250, 14);

        // Montar tabela: colunas = [Horário, Sala1, Sala2, ...]
        const columns = ['Horário', ...salas.map(s => s.nome)];

        // Linhas: uma por atividade, posicionada na sala correta
        // Agrupar por horário de início
        const horariosUnicos = [...new Set(atividadesDoDia.map(a => formatTime(a.hora_inicio)))].sort();

        const rows: string[][] = [];

        if (horariosUnicos.length === 0) {
            rows.push(['Sem atividades neste dia', ...salas.map(() => '')]);
        } else {
            horariosUnicos.forEach(horario => {
                const row: string[] = [horario];
                salas.forEach(sala => {
                    const atv = atividadesDoDia.find(
                        a => formatTime(a.hora_inicio) === horario && a.sala_id === sala.id
                    );
                    if (atv) {
                        const cat = CATEGORIAS_CONFIG[atv.categoria as keyof typeof CATEGORIAS_CONFIG] || CATEGORIAS_CONFIG.outros;
                        let cell = `${cat.icone} ${atv.titulo}`;
                        if (atv.palestrante) cell += `\n${atv.palestrante}`;
                        cell += `\n${formatTime(atv.hora_inicio)}-${formatTime(atv.hora_fim)}`;
                        row.push(cell);
                    } else {
                        row.push('');
                    }
                });
                rows.push(row);
            });
        }

        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 95], fontSize: 8, halign: 'center' },
            styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
            columnStyles: {
                0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
            },
        });

        // Rodapé
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `© 2026 Bom Pastor Digital • v${APP_VERSION} | Página ${pageIdx + 1} de ${datasEvento.length}`,
            148, 200, { align: 'center' }
        );
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cronograma_${sanitizarNome(eventoNome)}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exporta todas as atividades como planilha Excel.
 */
export function exportarCronogramaExcel(
    eventoNome: string,
    salas: Sala[],
    todasAtividades: Atividade[]
) {
    const salasMap: Record<number, string> = {};
    salas.forEach(s => { salasMap[s.id] = s.nome; });

    const linhas = todasAtividades
        .sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio))
        .map(a => ({
            'Data': a.data.split('-').reverse().join('/'),
            'Início': formatTime(a.hora_inicio),
            'Término': formatTime(a.hora_fim),
            'Sala': salasMap[a.sala_id] || `Sala ${a.sala_id}`,
            'Título': a.titulo,
            'Palestrante': a.palestrante || '-',
            'Categoria': (CATEGORIAS_CONFIG[a.categoria as keyof typeof CATEGORIAS_CONFIG] || CATEGORIAS_CONFIG.outros).label,
            'Publicado': a.publicado ? 'Sim' : 'Não',
        }));

    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
    XLSX.writeFile(wb, `Cronograma_${sanitizarNome(eventoNome)}.xlsx`);
}
