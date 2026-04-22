/**
 * Tipos centralizados para o sistema Bom Pastor Digital
 */

/** Versão Global do Sistema */
export const APP_VERSION = '4.5';

/**
 * Tipo de inscrição
 */
export type TipoInscricao = 'casal' | 'individual';

export interface Pessoa {
    nome: string;
    cpf: string;
    nascimento: string; // Formato: DD/MM/YYYY
    email: string;
    telefone: string;
}

/** Pessoa com campos opcionais (para uso do admin) */
export interface PessoaAdmin {
    nome: string;
    cpf: string;
    nascimento: string;
    email?: string;
    telefone?: string;
}

export interface DadosConjuntos {
    paroquia: string;
    paroco: string;
    endereco: string;
    cidade?: string;
    nova_uniao: boolean;
    membro_pasfam: boolean;
    pastorais?: string[];
    necessita_hospedagem: boolean;
    restricoes_alimentares?: string;
    observacoes?: string;
}

export interface Contato {
    diocese_id?: number;
    diocese_nome?: string;
    municipio_id: number;
    municipio_nome?: string;
}

/** Dados de inscrição de casal (fluxo original) */
export interface RegistrationData {
    esposo: Pessoa;
    esposa: Pessoa;
    contato: Contato;
    dados_conjuntos: DadosConjuntos;
}

/** Dados de inscrição individual */
export interface IndividualRegistrationData {
    participante: Pessoa;
    contato: Contato;
    dados_conjuntos: DadosConjuntos;
}

/**
 * Lista de pastorais disponíveis para seleção
 * TODO: Migrar para tabela no banco de dados futuramente
 */
export const PASTORAIS_DISPONIVEIS = [
    'Pastoral Familiar (Pasfam)',
    'Batismo',
    'Crisma',
    'Catequese',
    'Jovens',
    'Liturgia',
    'Música',
    'Caridade',
    'Comunicação',
    'Dízimo',
    'Idosos',
    'Saúde',
    'Creche',
] as const;

/**
 * Informações de pagamento PIX
 * TODO: Buscar do banco ou arquivo de configuração
 */
export const PIX_CONFIG = {
    chave: 'grayceperini@gmail.com',
    chaveTipo: 'E-mail',
    beneficiario: 'Grayce Kelly Perini Gomes',
    whatsappContato: '(63) 98405-5758',
    pixCopiaCola: '00020126440014BR.GOV.BCB.PIX0122grayceperini@gmail.com5204000053039865802BR5925Grayce Kelly Perini Gomes6009SAO PAULO621405103o0UGlysGH63049897',
} as const;

// =============================================
// MÓDULO CRONOGRAMA (v4.0)
// =============================================

/** Categorias de atividades do cronograma */
export interface Categoria {
    id: number;
    nome: string;
    cor: string;
    icone: string;
    evento_id: number;
    created_at: string;
}

export type CategoriaAtividade = string; // Mantido como string para compatibilidade, mas agora alimentado pelo banco

/** Configuração visual de cada categoria */
export const CATEGORIAS_CONFIG: Record<CategoriaAtividade, { label: string; cor: string; corFundo: string; icone: string }> = {
    palestra:  { label: 'Palestra',  cor: '#1565C0', corFundo: '#E3F2FD', icone: '🎤' },
    workshop:  { label: 'Workshop',  cor: '#2E7D32', corFundo: '#E8F5E9', icone: '🛠️' },
    intervalo: { label: 'Intervalo', cor: '#616161', corFundo: '#F5F5F5', icone: '☕' },
    cerimonia: { label: 'Cerimônia', cor: '#F9A825', corFundo: '#FFF8E1', icone: '✨' },
    outros:    { label: 'Outros',    cor: '#424242', corFundo: '#FFFFFF', icone: '📋' },
};

/** Sala de um evento */
export interface Sala {
    id: number;
    evento_id: number;
    nome: string;
    capacidade?: number | null;
    ordem: number;
    created_at?: string;
}

/** Atividade do cronograma */
export interface Atividade {
    id: string;
    evento_id: number;
    sala_id: number;
    titulo: string;
    palestrante?: string | null;
    categoria: CategoriaAtividade;
    data: string;          // Formato: YYYY-MM-DD
    hora_inicio: string;   // Formato: HH:MM:SS ou HH:MM
    hora_fim: string;      // Formato: HH:MM:SS ou HH:MM
    descricao?: string | null;
    publicado: boolean;
    created_at?: string;
    // Campos expandidos (joins)
    sala?: Sala;
}
