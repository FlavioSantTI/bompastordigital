/**
 * badge.ts
 * Tipos centralizados para o Módulo Unificado de Crachás.
 * 
 * Contrato canônico (CanonicalBadgePayload) que desacopla a origem dos dados
 * do motor de renderização PDF. Qualquer fonte de dados (inscritos, equipes,
 * palestrantes, círculos) deve ser normalizada para esta interface.
 * 
 * @see docs/PRD_Modulo_Crachas_Unificado.md — Seção 3.3
 */

// ============================================================
// CANONICAL BADGE PAYLOAD
// ============================================================

/**
 * Contrato canônico para o motor unificado de crachás.
 * Qualquer fonte de dados deve ser normalizada para esta interface
 * antes de ser passada ao renderizador PDF.
 */
export interface CanonicalBadgePayload {
    /** Identificador único da entidade/inscrição */
    id: string;

    /** URL ou Base64 da foto do titular (opcional) */
    avatar_url?: string | null;

    /** Nome principal exibido em destaque (nome de crachá) */
    primary_name: string;

    /** Nome completo formal ou subtítulo (opcional) */
    secondary_name?: string | null;

    /**
     * Rótulo da categoria.
     * Ex: "Círculo Amarelo", "Equipe Cozinha", "Palestrante", "Encontrista"
     */
    category_label: string;

    /**
     * Tag visual de cargo/papel.
     * Ex: "Coordenador", "Casal Apoio", "Chefe", "Convidado"
     */
    role_badge?: string | null;

    /** Hexadecimal (#RRGGBB) para tarja temática / acento de cor */
    accent_color: string;

    /** Informações do evento */
    event_info: {
        event_name: string;
        edition?: string;
        date_range?: string;
        parish_name?: string;
    };

    /**
     * Conteúdo para geração do QR Code.
     * Token encriptado ou URL de check-in.
     */
    qr_code_content?: string | null;

    /**
     * Metadados exibidos no rodapé do crachá.
     * Ex: [{ label: "Paróquia", value: "São José" }]
     */
    footer_metadata: Array<{
        label: string;
        value: string;
    }>;

    /** Conteúdo do verso do crachá (opcional) */
    backside_content?: {
        type: 'PRAYER' | 'SCHEDULE' | 'MAP' | 'CUSTOM_TEXT' | 'BLANK';
        title?: string;
        body_markdown?: string;
    } | null;
}

// ============================================================
// TIPOS AUXILIARES
// ============================================================

/** Fontes de dados disponíveis para geração de crachás */
export type BadgeSourceEntity =
    | 'INSCRITO'
    | 'PALESTRANTE'
    | 'EQUIPE'
    | 'CIRCULO';

/** Metadados de cada fonte para o seletor de origem */
export interface BadgeSourceOption {
    value: BadgeSourceEntity;
    label: string;
    icon: string;
    description: string;
}

/** Presets de tamanho físico do crachá */
export type BadgeSizePreset =
    | 'SMALL'   // Cartão Padrão (54 × 86 mm / 8,6 × 5,4 cm) - até 9 por folha A4
    | 'MEDIUM'  // Credencial Média (90 × 120 mm / 9 × 12 cm) - 4 por folha A4
    | 'LARGE';  // Credencial Grande Pastoral / A6 (100 × 140 mm / 10 × 14 cm) - 2 por folha A4

/** Metadados de cada tamanho para a galeria de seleção */
export interface BadgeSizePresetOption {
    id: BadgeSizePreset;
    name: string;
    subtitle: string;
    dimensions: string;
    width_mm: number;
    height_mm: number;
    grid_columns: number;
    grid_rows: number;
    perPage: number;
    icon: string;
    description: string;
    recommendedFor: string;
}

/** Presets de moldura e layout visual */
export type BadgeFramePreset =
    | 'PASTORAL'      // Tarja superior temática + logo oficial + borda suave
    | 'GOLD_CLASSIC'  // Borda dupla dourada clássica para palestrantes/dirigentes
    | 'MINIMAL'       // Minimalista sem borda com foco no nome
    | 'CUSTOM_BG'     // Imagem de fundo/moldura completa PNG/JPG (Canva/Photoshop)
    | 'DESK_TENT';    // Crachá tenda de mesa dobrável

/** Metadados de cada preset para a galeria de seleção */
export interface BadgeFramePresetOption {
    id: BadgeFramePreset;
    name: string;
    subtitle: string;
    description: string;
    icon: string;
    recommendedFor: string;
    defaultBorderWidth: number;
    defaultBorderRadius: number;
    defaultBorderColorMode: 'ACCENT' | 'CUSTOM';
    defaultCustomBorderColor?: string;
    defaultBorderStyle: 'solid' | 'double' | 'dashed' | 'none';
}

/** Configuração completa de layout e estilo de crachás */
export interface BadgeLayoutConfig {
    layout_type: 'GRID_A4' | 'THERMAL_ROLL' | 'DESK_TENT';
    size_preset?: BadgeSizePreset;
    grid_columns: number;
    grid_rows: number;
    width_mm: number;
    height_mm: number;
    margin_mm: number;
    has_backside: boolean;
    has_qr_code: boolean;
    has_cut_marks: boolean;
    show_header_logo: boolean;
    show_category_chip: boolean;
    
    // ── Estilo e Moldura ──
    frame_preset: BadgeFramePreset;
    border_width: number;
    border_radius: number;
    border_style: 'solid' | 'double' | 'dashed' | 'none';
    border_color_mode: 'ACCENT' | 'CUSTOM';
    custom_border_color?: string;
    bg_image_url?: string;

    // ── Informações Paroquiais / Diocese / Cidade ──
    show_parish_info: boolean;
    override_parish_info: boolean;
    show_parish: boolean;
    custom_parish: string;
    show_diocese: boolean;
    custom_diocese: string;
    show_cidade: boolean;
    custom_cidade: string;
}

/** Filtro contextual por fonte de dados */
export interface BadgeFilter {
    source: BadgeSourceEntity;
    equipe_id?: number;
    circulo_id?: string;
    cargo_nivel?: number;
    status?: string;
    busca?: string;
}

// ============================================================
// CONSTANTES
// ============================================================

/** Galeria de presets de moldura disponíveis */
export const BADGE_FRAME_PRESETS: BadgeFramePresetOption[] = [
    {
        id: 'PASTORAL',
        name: 'Padrão Pastoral',
        subtitle: 'Tarja temática + borda suave',
        description: 'Design oficial com tarja colorida no topo na cor do círculo/equipe e logotipo centralizado.',
        icon: '⛪',
        recommendedFor: 'Encontristas, Inscrições de Casal e Geral',
        defaultBorderWidth: 1.5,
        defaultBorderRadius: 6,
        defaultBorderColorMode: 'CUSTOM',
        defaultCustomBorderColor: '#E0E0E0',
        defaultBorderStyle: 'solid',
    },
    {
        id: 'GOLD_CLASSIC',
        name: 'Dourada Clássica',
        subtitle: 'Borda dupla dourada refinada',
        description: 'Moldura dupla em tom dourado nobre (#C5A059) com tipografia sóbria e acabamento solene.',
        icon: '✨',
        recommendedFor: 'Palestrantes, Sacerdotes, Bispos e Dirigentes',
        defaultBorderWidth: 2.5,
        defaultBorderRadius: 4,
        defaultBorderColorMode: 'CUSTOM',
        defaultCustomBorderColor: '#C5A059',
        defaultBorderStyle: 'double',
    },
    {
        id: 'MINIMAL',
        name: 'Minimalista Clean',
        subtitle: 'Sem moldura, foco total no nome',
        description: 'Design moderno sem bordas laterais, com contraste alto e tarja sutil na cor da equipe.',
        icon: '🔲',
        recommendedFor: 'Equipes de Apoio, Cozinha e Trânsito',
        defaultBorderWidth: 0,
        defaultBorderRadius: 0,
        defaultBorderColorMode: 'ACCENT',
        defaultBorderStyle: 'none',
    },
    {
        id: 'CUSTOM_BG',
        name: 'Moldura Gráfica (Upload)',
        subtitle: 'Imagem de fundo PNG/JPG personalizada',
        description: 'Utiliza uma arte gráfica completa de moldura (feita no Canva/Photoshop) posicionando os dados automaticamente.',
        icon: '🖼️',
        recommendedFor: 'Eventos com identidade visual própria ou temáticas especiais',
        defaultBorderWidth: 0,
        defaultBorderRadius: 0,
        defaultBorderColorMode: 'CUSTOM',
        defaultBorderStyle: 'none',
    },
    {
        id: 'DESK_TENT',
        name: 'Tenda de Mesa',
        subtitle: 'Crachá dobrável para mesas de grupo',
        description: 'Layout duplo com linha de dobra pontilhada no centro para apoiar em mesas de reflexão e salas.',
        icon: '⛺',
        recommendedFor: 'Mesas de Círculos, Salas de Coordenação e Palestras',
        defaultBorderWidth: 1,
        defaultBorderRadius: 0,
        defaultBorderColorMode: 'CUSTOM',
        defaultCustomBorderColor: '#BDBDBD',
        defaultBorderStyle: 'dashed',
    },
];

/** Opções de fonte de dados para o seletor */
export const BADGE_SOURCE_OPTIONS: BadgeSourceOption[] = [
    {
        value: 'INSCRITO',
        label: 'Inscritos / Encontristas',
        icon: '👥',
        description: 'Casais e participantes individuais inscritos no evento',
    },
    {
        value: 'EQUIPE',
        label: 'Equipes de Apoio',
        icon: '🛠️',
        description: 'Membros das equipes de trabalho (Cozinha, Liturgia, Sala...)',
    },
    {
        value: 'CIRCULO',
        label: 'Círculos / Grupos',
        icon: '⭕',
        description: 'Participantes organizados por círculos ou grupos de reflexão',
    },
    {
        value: 'PALESTRANTE',
        label: 'Palestrantes',
        icon: '🎤',
        description: 'Palestrantes e dirigentes vinculados às atividades',
    },
];

/** Presets de tamanho físico do crachá */
export const BADGE_SIZE_PRESETS: BadgeSizePresetOption[] = [
    {
        id: 'SMALL',
        name: 'Pequeno (Cartão)',
        subtitle: '54 × 86 mm • 8,6 × 5,4 cm',
        dimensions: '54 × 86 mm',
        width_mm: 54,
        height_mm: 86,
        grid_columns: 3,
        grid_rows: 3,
        perPage: 9,
        icon: '📇',
        description: 'Formato cartão de bolso / PVC padrão (8,6 × 5,4 cm). Economia máxima de papel com até 9 crachás por folha A4.',
        recommendedFor: 'Crachás de bolso, protetor rígido PVC e equipes de apoio',
    },
    {
        id: 'MEDIUM',
        name: 'Médio (Credencial)',
        subtitle: '90 × 120 mm • 9 × 12 cm',
        dimensions: '90 × 120 mm',
        width_mm: 90,
        height_mm: 120,
        grid_columns: 2,
        grid_rows: 2,
        perPage: 4,
        icon: '🏷️',
        description: 'Credencial intermediária (9 × 12 cm). Formato equilibrado para congressos e eventos com 4 crachás por folha A4.',
        recommendedFor: 'Congressos, dirigentes e equipes de acolhida',
    },
    {
        id: 'LARGE',
        name: 'Grande (Pastoral)',
        subtitle: '100 × 140 mm • 10 × 14 cm',
        dimensions: '100 × 140 mm',
        width_mm: 100,
        height_mm: 140,
        grid_columns: 1,
        grid_rows: 2,
        perPage: 2,
        icon: '📜',
        description: 'Credencial grande tradicional Bom Pastor (10 × 14 cm / formato A6 aproximado). Máxima visibilidade em plenária (2 por folha A4).',
        recommendedFor: 'Encontristas, casais e padrão histórico Bom Pastor',
    },
];

/** Layout padrão para crachás em grade A4 (2 por folha) */
export const DEFAULT_BADGE_LAYOUT: BadgeLayoutConfig = {
    layout_type: 'GRID_A4',
    size_preset: 'LARGE',
    grid_columns: 1,
    grid_rows: 2,
    width_mm: 100,
    height_mm: 140,
    margin_mm: 5,
    has_backside: false,
    has_qr_code: true,
    has_cut_marks: true,
    show_header_logo: true,
    show_category_chip: true,
    
    // Configurações padrão de moldura
    frame_preset: 'PASTORAL',
    border_width: 1.5,
    border_radius: 6,
    border_style: 'solid',
    border_color_mode: 'CUSTOM',
    custom_border_color: '#E0E0E0',

    // Informações Paroquiais Padrão do Bom Pastor
    show_parish_info: true,
    override_parish_info: true,
    show_parish: true,
    custom_parish: 'Santuário Mãe Rainha',
    show_diocese: true,
    custom_diocese: 'Arquidiocese de Palmas',
    show_cidade: true,
    custom_cidade: 'Palmas - TO',
};

/** Cores padrão por fonte de dados (fallback quando a entidade não tem cor) */
export const DEFAULT_ACCENT_COLORS: Record<BadgeSourceEntity, string> = {
    INSCRITO: '#0284C7',      // Azul primário do tema
    EQUIPE: '#F44336',        // Vermelho Material
    CIRCULO: '#FFC107',       // Amarelo Material
    PALESTRANTE: '#7E22CE',   // Roxo Litúrgico
};
