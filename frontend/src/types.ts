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
    chave: '000.000.000-00', // CPF da instituição
    chaveTipo: 'CPF',
    beneficiario: 'Bom Pastor Digital',
    whatsappContato: '(00) 00000-0000',
} as const;
