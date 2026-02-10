/**
 * Tipos centralizados para o sistema Bom Pastor Digital
 */

export interface Pessoa {
    nome: string;
    cpf: string;
    nascimento: string; // Formato: DD/MM/YYYY
    email: string;
    telefone: string;
}

export interface DadosConjuntos {
    paroquia: string;
    paroco: string;
    endereco: string;
    nova_uniao: boolean;
    membro_pasfam: boolean;
    pastorais?: string[];
    necessita_hospedagem: boolean;
    restricoes_alimentares?: string;
    observacoes?: string;
}

export interface Contato {
    municipio_id: number;
}

export interface RegistrationData {
    esposo: Pessoa;
    esposa: Pessoa;
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
