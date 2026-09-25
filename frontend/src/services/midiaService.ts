import { supabase } from '../lib/supabase';
import type { EventoArquivo, CategoriaArquivo, MidiaQuotaInfo } from '../types';

export const STORAGE_BUCKET = 'eventos_midias';
export const MAX_EVENTO_QUOTA_BYTES = 150 * 1024 * 1024; // 150 MB

// Limites específicos por tipo (ajustados para cota de 150 MB)
export const MAX_FILE_SIZE_LIMITS: Record<string, number> = {
    video: 50 * 1024 * 1024,       // 50 MB para vídeos MP4
    audio: 25 * 1024 * 1024,       // 25 MB para áudios MP3/AAC
    documento: 15 * 1024 * 1024,   // 15 MB para documentos PDF/DOCX/XLSX
    imagem: 10 * 1024 * 1024,      // 10 MB para fotos JPG/PNG
};

// Formatos estritamente proibidos
const FORBIDDEN_EXTENSIONS = ['.wav'];
const FORBIDDEN_MIMETYPES = ['audio/wav', 'audio/x-wav', 'audio/wave'];

/**
 * Utilitário de formatação legível de bytes
 */
export const formatBytes = (bytes: number, decimals = 1): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Detecta a categoria inicial do arquivo baseado no mimetype ou extensão
 */
export const detectCategoria = (file: File): CategoriaArquivo => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const type = file.type.toLowerCase();

    if (type.startsWith('image/')) return 'foto';
    if (type.startsWith('video/') || ext === '.mp4') return 'video';
    if (type.startsWith('audio/') || ext === '.mp3' || ext === '.aac' || ext === '.m4a') return 'audio';

    const lowerName = file.name.toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext) || lowerName.includes('planilh') || lowerName.includes('escala') || lowerName.includes('tabela') || lowerName.includes('crono')) {
        return 'planilhas';
    }

    return 'documentos';
};

/**
 * Validação rigorosa do arquivo antes de iniciar upload
 */
export const validarArquivo = (file: File, bytesUsadosAtualmente: number): { valido: boolean; erro?: string } => {
    if (!file) return { valido: false, erro: 'Nenhum arquivo fornecido.' };

    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const mime = file.type.toLowerCase();

    // 1. Checagem de Proibição Estrita (.WAV)
    if (FORBIDDEN_EXTENSIONS.includes(ext) || FORBIDDEN_MIMETYPES.includes(mime)) {
        return {
            valido: false,
            erro: 'O formato de áudio .WAV é proibido devido ao alto consumo de armazenamento. Utilize MP3 ou AAC.'
        };
    }

    // 2. Checagem de Extensões Permitidas
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.doc', '.xls', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mp3', '.aac', '.m4a'];
    if (!allowedExtensions.includes(ext)) {
        return {
            valido: false,
            erro: `Formato de arquivo não suportado (${ext}). Permitidos: PDF, DOCX, XLSX, JPG, PNG, MP4, MP3, AAC.`
        };
    }

    // 3. Checagem de Tamanho Individual por Categoria
    if (mime.startsWith('video/') || ext === '.mp4') {
        if (file.size > MAX_FILE_SIZE_LIMITS.video) {
            return { valido: false, erro: `Vídeos não podem ultrapassar ${formatBytes(MAX_FILE_SIZE_LIMITS.video)}.` };
        }
    } else if (mime.startsWith('audio/') || ['.mp3', '.aac', '.m4a'].includes(ext)) {
        if (file.size > MAX_FILE_SIZE_LIMITS.audio) {
            return { valido: false, erro: `Áudios não podem ultrapassar ${formatBytes(MAX_FILE_SIZE_LIMITS.audio)}.` };
        }
    } else if (mime.startsWith('image/')) {
        if (file.size > MAX_FILE_SIZE_LIMITS.imagem) {
            return { valido: false, erro: `Imagens não podem ultrapassar ${formatBytes(MAX_FILE_SIZE_LIMITS.imagem)}.` };
        }
    } else {
        if (file.size > MAX_FILE_SIZE_LIMITS.documento) {
            return { valido: false, erro: `Documentos não podem ultrapassar ${formatBytes(MAX_FILE_SIZE_LIMITS.documento)}.` };
        }
    }

    // 4. Checagem de Cota Global (150 MB)
    if (bytesUsadosAtualmente + file.size > MAX_EVENTO_QUOTA_BYTES) {
        const disponivel = Math.max(0, MAX_EVENTO_QUOTA_BYTES - bytesUsadosAtualmente);
        return {
            valido: false,
            erro: `Cota de 150 MB do evento excedida! Espaço livre atual: ${formatBytes(disponivel)}. O arquivo selecionado possui ${formatBytes(file.size)}.`
        };
    }

    return { valido: true };
};

/**
 * Serviço de Mídias e Documentos
 */
export const midiaService = {
    /**
     * Retorna a lista de arquivos de um determinado evento
     */
    async getArquivosByEvento(eventoId: number, categoria?: CategoriaArquivo): Promise<EventoArquivo[]> {
        try {
            let query = supabase
                .from('evento_arquivos')
                .select('*')
                .eq('evento_id', eventoId)
                .order('created_at', { ascending: false });

            if (categoria) {
                query = query.eq('categoria', categoria);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Erro ao buscar arquivos do evento:', error);
                return [];
            }
            return (data as EventoArquivo[]) || [];
        } catch (err) {
            console.error('Exceção ao listar arquivos do evento:', err);
            return [];
        }
    },

    /**
     * Calcula o consumo da cota de 500 MB para o evento
     */
    async getQuotaInfo(eventoId: number): Promise<MidiaQuotaInfo> {
        try {
            const { data, error } = await supabase
                .from('evento_arquivos')
                .select('tamanho_bytes')
                .eq('evento_id', eventoId);

            if (error) {
                console.warn('Erro ao obter cota via banco:', error);
            }

            const usadoBytes = (data || []).reduce((acc: number, item: any) => acc + (Number(item.tamanho_bytes) || 0), 0);
            const limiteBytes = MAX_EVENTO_QUOTA_BYTES;
            const percentual = Math.min(100, Math.round((usadoBytes / limiteBytes) * 100));
            const disponivelBytes = Math.max(0, limiteBytes - usadoBytes);

            let status: 'normal' | 'alerta' | 'critico' = 'normal';
            if (percentual >= 90) {
                status = 'critico';
            } else if (percentual >= 80) {
                status = 'alerta';
            }

            return {
                usadoBytes,
                limiteBytes,
                percentual,
                disponivelBytes,
                status
            };
        } catch (err) {
            console.error('Erro ao calcular cota:', err);
            return {
                usadoBytes: 0,
                limiteBytes: MAX_EVENTO_QUOTA_BYTES,
                percentual: 0,
                disponivelBytes: MAX_EVENTO_QUOTA_BYTES,
                status: 'normal'
            };
        }
    },

    /**
     * Realiza o upload do arquivo para o Storage e registra na tabela evento_arquivos
     */
    async uploadArquivo(
        eventoId: number,
        file: File,
        titulo: string,
        categoria: CategoriaArquivo,
        criadoPorId?: string
    ): Promise<{ success: boolean; data?: EventoArquivo; error?: string }> {
        try {
            // 1. Recalcula a cota em tempo real para evitar race conditions
            const quota = await this.getQuotaInfo(eventoId);
            const validacao = validarArquivo(file, quota.usadoBytes);
            if (!validacao.valido) {
                return { success: false, error: validacao.erro };
            }

            // 2. Sanitiza o nome do arquivo e monta o caminho físico no Storage
            // Formato: evento_{id}/{categoria}/{timestamp}_{hash}_{nome_sanitizado}
            const cleanName = file.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileExt = cleanName.split('.').pop();
            const uniqueId = Math.random().toString(36).substring(2, 8);
            const filePath = `evento_${eventoId}/${categoria}/${Date.now()}_${uniqueId}.${fileExt}`;

            // 3. Upload para o Supabase Storage
            const { error: uploadError } = await (supabase as any).storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Falha no upload para o Supabase Storage:', uploadError);
                return {
                    success: false,
                    error: `Falha ao enviar arquivo para o Storage: ${uploadError.message}. Certifique-se de que o bucket '${STORAGE_BUCKET}' foi criado no Supabase.`
                };
            }

            // 4. Obter a URL pública do Storage
            const { data: publicUrlData } = (supabase as any).storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            const storageUrl = publicUrlData?.publicUrl || '';

            // 5. Inserir metadados no banco de dados
            const payload = {
                evento_id: eventoId,
                titulo: titulo.trim() || file.name,
                nome_original: file.name,
                categoria,
                tamanho_bytes: file.size,
                mimetype: file.type || 'application/octet-stream',
                storage_path: filePath,
                storage_url: storageUrl,
                criado_por: criadoPorId || null
            };

            const { data: dbData, error: dbError } = await supabase
                .from('evento_arquivos')
                .insert([payload])
                .select()
                .single();

            if (dbError) {
                console.error('Erro ao registrar no banco de dados:', dbError);
                // Rollback: remove o arquivo recém-enviado do Storage
                await (supabase as any).storage.from(STORAGE_BUCKET).remove([filePath]);
                return {
                    success: false,
                    error: `Erro ao salvar registro no banco de dados: ${dbError.message}`
                };
            }

            return {
                success: true,
                data: dbData as EventoArquivo
            };
        } catch (err: any) {
            console.error('Exceção inesperada no uploadArquivo:', err);
            return {
                success: false,
                error: err?.message || 'Erro inesperado ao realizar upload.'
            };
        }
    },

    /**
     * Remove um arquivo tanto do Supabase Storage quanto da tabela do banco de dados
     */
    async deleteArquivo(arquivo: EventoArquivo): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Remove do Storage
            if (arquivo.storage_path) {
                const { error: storageError } = await (supabase as any).storage
                    .from(STORAGE_BUCKET)
                    .remove([arquivo.storage_path]);

                if (storageError) {
                    console.warn('Aviso: falha ao remover arquivo do storage:', storageError);
                }
            }

            // 2. Remove do Banco
            const { error: dbError } = await supabase
                .from('evento_arquivos')
                .delete()
                .eq('id', arquivo.id);

            if (dbError) {
                return {
                    success: false,
                    error: `Falha ao excluir registro do banco: ${dbError.message}`
                };
            }

            return { success: true };
        } catch (err: any) {
            console.error('Erro ao excluir arquivo:', err);
            return {
                success: false,
                error: err?.message || 'Erro inesperado ao excluir arquivo.'
            };
        }
    },

    /**
     * Atualiza o título amigável de um arquivo
     */
    async updateTitulo(arquivoId: string, novoTitulo: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!novoTitulo.trim()) {
                return { success: false, error: 'O título não pode ser vazio.' };
            }

            const { data, error: dbError } = await supabase
                .from('evento_arquivos')
                .update({ titulo: novoTitulo.trim() })
                .eq('id', arquivoId)
                .select();

            if (dbError) {
                console.error('Erro ao atualizar título no Supabase:', dbError);
                return {
                    success: false,
                    error: `Falha ao atualizar título: ${dbError.message}`
                };
            }

            if (!data || data.length === 0) {
                console.warn('Nenhum registro atualizado. Verifique a política de UPDATE no Supabase.');
                return {
                    success: false,
                    error: 'A alteração foi bloqueada pelas políticas de segurança (RLS UPDATE). Execute o script de permissão no Supabase.'
                };
            }

            return { success: true };
        } catch (err: any) {
            console.error('Erro ao atualizar título do arquivo:', err);
            return {
                success: false,
                error: err?.message || 'Erro inesperado ao atualizar título.'
            };
        }
    }
};
