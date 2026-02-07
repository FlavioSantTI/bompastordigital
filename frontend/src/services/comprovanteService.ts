import { supabase } from '../lib/supabase';

// Tipos permitidos para validação
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
// Tamanho máximo (ex: 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Serviço responsável pelo gerenciamento de uploads de comprovantes.
 */
export const comprovanteService = {

    /**
     * Realiza o upload do comprovante para o Supabase Storage e registra no banco.
     * 
     * @param inscricaoId ID da inscrição (string UUID ou number)
     * @param file Arquivo vindo do input (File)
     * @param adminId ID do administrador que está fazendo o upload (opcional)
     */
    async uploadComprovante(
        inscricaoId: string | number,
        file: File,
        adminId?: string
    ): Promise<UploadResult> {
        try {
            // 1. Validações Iniciais
            if (!file) {
                throw new Error('Nenhum arquivo fornecido.');
            }

            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                throw new Error('Formato inválido. Apenas PDF, JPG e PNG são permitidos.');
            }

            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`Arquivo muito grande. O máximo permitido é ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
            }

            // 2. Gerar nome único para o arquivo
            // Formato: inscricao_ID_TIMESTAMP_RANDOM.ext
            const fileExt = file.name.split('.').pop();
            const fileName = `inscricao_${inscricaoId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 3. Upload para o Supabase Storage
            const { error: uploadError } = await (supabase as any).storage
                .from('comprovantes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Erro no upload storage:', uploadError);
                throw new Error('Falha ao enviar arquivo para o servidor de armazenamento.');
            }

            // 4. Obter URL Pública
            const { data: { publicUrl } } = (supabase as any).storage
                .from('comprovantes')
                .getPublicUrl(filePath);

            // 5. Inserir registro no Banco de Dados
            const { data: dbData, error: dbError } = await supabase
                .from('comprovantes_inscricao')
                .insert({
                    inscricao_id: inscricaoId,
                    url_storage: publicUrl,
                    path_storage: filePath,
                    tipo_mimetype: file.type,
                    upload_por: adminId || null // Se tiver auth user
                })
                .select()
                .single();

            if (dbError) {
                // Se falhar no banco, idealmente deveríamos limpar o arquivo do storage (rollback manual)
                await (supabase as any).storage.from('comprovantes').remove([filePath]);
                console.error('Erro ao salvar no banco:', dbError);
                throw new Error('Falha ao registrar comprovante no banco de dados.');
            }

            return {
                success: true,
                data: dbData
            };

        } catch (error: any) {
            console.error('Erro no processo de upload:', error);
            return {
                success: false,
                error: error.message || 'Erro desconhecido ao processar comprovante.'
            };
        }
    },

    /**
     * Busca os comprovantes de uma inscrição específica
     */
    async getComprovantes(inscricaoId: string | number) {
        const { data, error } = await supabase
            .from('comprovantes_inscricao')
            .select('*')
            .eq('inscricao_id', inscricaoId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar comprovantes:', error);
            return [];
        }

        return data;
    },

    /**
     * Remove um comprovante (do banco e do storage)
     */
    async deleteComprovante(comprovanteId: string, pathStorage: string) {
        // 1. Remove do Storage
        const { error: storageError } = await (supabase as any).storage
            .from('comprovantes')
            .remove([pathStorage]);

        if (storageError) {
            console.error('Erro ao remover do storage:', storageError);
            return { success: false, error: 'Erro ao remover arquivo físico.' };
        }

        // 2. Remove do Banco
        const { error: dbError } = await supabase
            .from('comprovantes_inscricao')
            .delete()
            .eq('id', comprovanteId);

        if (dbError) {
            return { success: false, error: 'Erro ao remover registro do banco.' };
        }

        return { success: true };
    }
};
