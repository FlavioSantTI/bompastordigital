/**
 * CrachaTemplate.tsx
 * Layout A4 com 2 crachás por folha (esposo no topo, esposa embaixo).
 * Marcas de corte ao redor de cada crachá.
 *
 * Dimensões em pontos PDF (1mm ≈ 2.8346 pt):
 *  - A4:  595.28 × 841.89 pt  (210 × 297 mm)
 *  - Crachá: 283.46 × 396.85 pt  (100 × 140 mm) — ajustado para 2 caberem em A4 com margem
 *  - Metade da folha: 420.94 pt (148.5 mm)
 */
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from '@react-pdf/renderer';

export interface CrachaData {
    inscricao_id: string;
    tipo: 'esposo' | 'esposa';
    nome: string;
    paroquia: string | null;
    diocese: string | null;
    evento: string;
}

// ── Constantes de layout ───────────────────────────────────────────────
const PT = 2.8346; // pontos por milímetro
const A4W = 210 * PT;   // 595.28 pt
const A4H = 297 * PT;   // 841.89 pt

const BADGE_W = 100 * PT;  // 283.46 pt
const BADGE_H = 140 * PT;  // 396.85 pt  (ajuste para 2 caberem com margem)

const HALF_H = A4H / 2;             // 420.94 pt — metade da folha
const BADGE_X = (A4W - BADGE_W) / 2; // posição X centralizada = 155.91 pt
const BADGE_Y = (HALF_H - BADGE_H) / 2; // margem vertical dentro de cada metade = 12.05 pt

const CUT_LEN = 10; // tamanho visível da marca de corte (pt)
const CUT_GAP = 3;  // gap entre a borda do crachá e a marca
const CUT_CLR = '#BDBDBD';
const CUT_W = 0.5;

// Cor primária
const PRIMARY = '#4A148C';
const PRIMARY_LIGHT = '#7B1FA2';

// ── Estilos ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width: A4W,
        height: A4H,
        backgroundColor: '#FAFAFA',
    },

    // ── Cada metade da folha (topo / baixo) ──────────────────
    half: {
        width: A4W,
        height: HALF_H,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Separador central (linha de dobra) ───────────────────
    separator: {
        position: 'absolute',
        top: HALF_H - 0.5,
        left: 0,
        width: A4W,
        height: 0.5,
        backgroundColor: '#E0E0E0',
    },

    // ── O crachá em si ───────────────────────────────────────
    card: {
        width: BADGE_W,
        height: BADGE_H,
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        overflow: 'hidden',
        flexDirection: 'column',
        // sombra leve emulada pela borda
        border: '2pt solid #90CAF9',
    },

    // Cabeçalho colorido
    header: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orgName: {
        color: '#FFFFFF',
        fontSize: 7,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    eventName: {
        color: '#1A237E',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'center',
    },
    headerDivider: {
        width: 30,
        height: 1.5,
        backgroundColor: '#CE93D8',
        marginTop: 8,
    },
    logo: {
        width: 70,
        height: 70,
        objectFit: 'contain',
        marginBottom: 6,
    },

    // Corpo
    body: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipoChip: {
        backgroundColor: '#EDE7F6',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 14,
        border: `1pt solid ${PRIMARY_LIGHT}`,
    },
    tipoLabel: {
        color: PRIMARY,
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    nome: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#212121',
        textAlign: 'center',
        lineHeight: 1.3,
        marginBottom: 16,
    },

    // Linha de info (paróquia / diocese)
    infoBlock: {
        width: '100%',
        borderTop: `0.5pt solid #EEEEEE`,
        paddingTop: 10,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'flex-start',
    },
    infoLabel: {
        color: '#212121',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        width: 70,
        letterSpacing: 0.5,
        paddingTop: 1,
    },
    infoValue: {
        color: '#424242',
        fontSize: 12,
        flex: 1,
        lineHeight: 1.4,
    },

    // ── Marcas de corte ─────────────────────────────────────
    // São posicionadas absolutamente em relação à metade da folha
    cutH: {
        position: 'absolute',
        height: CUT_W,
        width: CUT_LEN,
        backgroundColor: CUT_CLR,
    },
    cutV: {
        position: 'absolute',
        width: CUT_W,
        height: CUT_LEN,
        backgroundColor: CUT_CLR,
    },

    // ── Rodapé ───────────────────────────────────────────────
    footer: {
        backgroundColor: '#E3F2FD',
        borderTop: '0.5pt solid #90CAF9',
        paddingVertical: 7,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    footerText: {
        color: '#1565C0',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

// ── Componente de Marcas de Corte ──────────────────────────────────────
function CutMarks({ x, y }: { x: number; y: number }) {
    // 4 cantos × 2 linhas (H + V) cada
    const g = CUT_GAP;
    const l = CUT_LEN;

    return (
        <>
            {/* Canto superior-esquerdo */}
            <View style={[s.cutH, { top: y - g, left: x - g - l }]} />
            <View style={[s.cutV, { top: y - g - l, left: x - g }]} />

            {/* Canto superior-direito */}
            <View style={[s.cutH, { top: y - g, left: x + BADGE_W + g }]} />
            <View style={[s.cutV, { top: y - g - l, left: x + BADGE_W + g }]} />

            {/* Canto inferior-esquerdo */}
            <View style={[s.cutH, { top: y + BADGE_H + g, left: x - g - l }]} />
            <View style={[s.cutV, { top: y + BADGE_H + g, left: x - g }]} />

            {/* Canto inferior-direito */}
            <View style={[s.cutH, { top: y + BADGE_H + g, left: x + BADGE_W + g }]} />
            <View style={[s.cutV, { top: y + BADGE_H + g, left: x + BADGE_W + g }]} />
        </>
    );
}

// ── Crachá individual ──────────────────────────────────────────────────
function Cracha({ p }: { p: CrachaData }) {
    return (
        <View style={s.card}>
            {/* Cabeçalho */}
            <View style={s.header}>
                <Image style={s.logo} src="/img/logo.png" />
                <View style={s.headerDivider} />
                <Text style={s.eventName}>{p.evento}</Text>
            </View>

            {/* Corpo */}
            <View style={s.body}>
                <Text style={s.nome}>{p.nome}</Text>

                <View style={s.infoBlock}>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Paróquia</Text>
                        <Text style={s.infoValue}>{p.paroquia || '—'}</Text>
                    </View>
                    <View style={s.infoRow}>
                        <Text style={s.infoLabel}>Diocese</Text>
                        <Text style={s.infoValue}>{p.diocese || '—'}</Text>
                    </View>
                </View>
            </View>

            {/* Rodapé */}
            <View style={s.footer}>
                <Text style={s.footerText}>Palmas - 2026</Text>
            </View>
        </View>
    );
}

// ── Metade da página (topo ou baixo) com crachá + marcas de corte ──────
function HalfPage({ p }: { p: CrachaData | null }) {
    return (
        <View style={[s.half, { position: 'relative' }]}>
            {p ? (
                <>
                    {/* Posiciona o crachá centralizado */}
                    <Cracha p={p} />
                    {/* Marcas de corte absolutas dentro da metade */}
                    <CutMarks x={BADGE_X} y={BADGE_Y} />
                </>
            ) : (
                // Espaço vazio quando não há cônjuge
                <View style={{ width: BADGE_W, height: BADGE_H }} />
            )}
        </View>
    );
}

// ── Agrupa participantes em pares (esposo + esposa por inscrição) ───────
function agruparCasais(participantes: CrachaData[]) {
    const map = new Map<string, { esposo?: CrachaData; esposa?: CrachaData }>();
    for (const p of participantes) {
        const entry = map.get(p.inscricao_id) ?? {};
        if (p.tipo === 'esposo') entry.esposo = p;
        else entry.esposa = p;
        map.set(p.inscricao_id, entry);
    }
    return Array.from(map.values());
}

// ── Componente principal exportado ─────────────────────────────────────
interface CrachaTemplateProps {
    participantes: CrachaData[];
}

export default function CrachaTemplate({ participantes }: CrachaTemplateProps) {
    const casais = agruparCasais(participantes);

    return (
        <Document title="Crachás – Bom Pastor Digital" author="Bom Pastor Digital">
            {casais.map((casal, i) => (
                <Page key={i} size="A4" style={s.page}>
                    {/* Metade superior → Esposo */}
                    <HalfPage p={casal.esposo ?? null} />

                    {/* Linha divisória central */}
                    <View style={s.separator} />

                    {/* Metade inferior → Esposa */}
                    <HalfPage p={casal.esposa ?? null} />
                </Page>
            ))}
        </Document>
    );
}
