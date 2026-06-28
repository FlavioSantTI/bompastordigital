/**
 * Tipos centralizados para o sistema Bom Pastor Digital
 */

/** Versão Global do Sistema */
export const APP_VERSION = '5.5';

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

/** Status possíveis de uma inscrição (incluindo Cadastro de Reserva / Lista de Espera) */
export type StatusInscricao = 'pendente' | 'confirmada' | 'cancelada' | 'reserva';

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
 * Status computado do evento baseado nos períodos
 */
export type EventoStatus =
  | 'DRAFT'
  | 'REGISTRATION_UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';

/**
 * Interface centralizada para Eventos
 * v5.2: Inclui campos de períodos (inscrição e realização)
 */
export interface Evento {
    id: number;
    nome: string;
    // Períodos (v5.2)
    inscricao_inicio: string;
    inscricao_fim: string;
    realizacao_inicio: string;
    realizacao_fim: string;
    // Campos legados (DEPRECATED v5.2 — usar campos de período)
    data_inicio: string;
    data_fim: string;
    hora_inicio?: string | null;
    hora_fim?: string | null;
    // Localização
    municipio_id: number | null;
    vagas: number;
    // Controle
    publicado: boolean;
    status_manual: string | null;
    // Campos financeiros (PRD v1.2)
    is_paid: boolean;
    event_price?: number | null;
    pix_key_type?: string | null;
    pix_key?: string | null;
    merchant_name?: string | null;
    merchant_city?: string | null;
    accepted_payment_methods?: string[] | null;
    // Campos expandidos (joins)
    municipio?: {
        nome_ibge: string | null;
        uf: string | null;
    };
}

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
    palestrantes_vinculados?: AtividadePalestrante[];
}

// ========================================
// FASE 4.0: GERENCIAMENTO DE EQUIPES
// ========================================

/** Status possíveis de uma tarefa de equipe */
export type StatusTarefa = 'pendente' | 'em_andamento' | 'concluida';

/** Prioridade de uma tarefa de equipe */
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta';

/** Cargo de membro em uma equipe (tabela auxiliar cargos_equipe) */
export interface CargoEquipe {
    id: number;
    nome: string;         // "Chefe", "Subchefe", "Componente"
    descricao?: string;
    nivel: number;        // 1=Chefe, 2=Subchefe, 3=Componente
}

/** Equipe vinculada a um evento */
export interface Equipe {
    id: number;
    evento_id: number;
    nome: string;
    descricao?: string;
    cor?: string;
    created_at: string;
    membros?: EquipeMembro[];
    tarefas?: EquipeTarefa[];
}

/** Membro de uma equipe (vínculo pessoa ↔ equipe ↔ cargo) */
export interface EquipeMembro {
    id: number;
    equipe_id: number;
    pessoa_id: string;
    cargo_id: number;
    observacao?: string;
    created_at: string;
    pessoa?: {
        id: string;
        nome: string;
        cpf: string;
        telefone?: string;
        email?: string;
    };
    cargo?: CargoEquipe;
}

/** Tarefa atribuída a uma equipe */
export interface EquipeTarefa {
    id: number;
    equipe_id: number;
    titulo: string;
    descricao?: string;
    status: StatusTarefa;
    prioridade: PrioridadeTarefa;
    data_limite?: string;
    created_at: string;
}

// ========================================
// MÓDULO PALESTRANTES (v5.3)
// ========================================

export type TipoParticipacao = 'principal' | 'painelista' | 'mediador';

export interface Palestrante {
    id: number;
    nome: string;
    email?: string | null;
    bio?: string | null;
    foto_url?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    website?: string | null;
    created_at?: string;
}

export interface AtividadePalestrante {
    id: number;
    atividade_id: string;
    palestrante_id: number;
    tipo_participacao: TipoParticipacao;
    created_at?: string;
    palestrante?: Palestrante;
}

