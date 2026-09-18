/**
 * BadgeRenderer.tsx
 * Motor principal de renderização PDF.
 *
 * Recebe CanonicalBadgePayload[] e um layout config, e produz um Document
 * @react-pdf/renderer com as páginas A4 diagramadas (grade + marcas de corte).
 *
 * Substituição desacoplada do CrachaTemplate.tsx legado.
 */
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import type { CanonicalBadgePayload, BadgeLayoutConfig } from '../../../../types/badge';
import { DEFAULT_BADGE_LAYOUT } from '../../../../types/badge';
import BadgeCard from './BadgeCard';
import BadgeCutMarks from './BadgeCutMarks';

// ── Constantes ─────────────────────────────────────────────────────────
const PT = 2.8346; // pontos por milímetro
const A4W = 210 * PT;  // 595.28 pt
const A4H = 297 * PT;  // 841.89 pt

// ── Estilos ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        width: A4W,
        height: A4H,
        backgroundColor: '#FAFAFA',
        position: 'relative',
    },
});

// ── Tipos internos ─────────────────────────────────────────────────────

/** Posição de um crachá na folha A4 */
interface BadgeSlot {
    payload: CanonicalBadgePayload;
    qrCodeDataUrl?: string | null;
    x: number;
    y: number;
}

/** Uma página com slots posicionados */
interface PageData {
    slots: BadgeSlot[];
}

// ── Função de paginação ────────────────────────────────────────────────

/**
 * Organiza os payloads em páginas A4 respeitando a grade configurada.
 * Calcula automaticamente a posição X/Y de cada crachá na folha.
 */
function organizarPaginas(
    payloads: CanonicalBadgePayload[],
    layout: BadgeLayoutConfig,
    qrCodes: Map<string, string>
): PageData[] {
    const { grid_columns, grid_rows, width_mm, height_mm, margin_mm } = layout;
    const badgesPerPage = grid_columns * grid_rows;

    const badgeW = width_mm * PT;
    const badgeH = height_mm * PT;
    const marginPt = margin_mm * PT;

    // Calcular posição de início para centralizar a grade na folha A4
    const totalGridW = grid_columns * badgeW + (grid_columns - 1) * marginPt;
    const totalGridH = grid_rows * badgeH + (grid_rows - 1) * marginPt;
    const startX = (A4W - totalGridW) / 2;
    const startY = (A4H - totalGridH) / 2;

    const pages: PageData[] = [];
    let currentSlots: BadgeSlot[] = [];

    payloads.forEach((payload, index) => {
        const posInPage = index % badgesPerPage;
        const col = posInPage % grid_columns;
        const row = Math.floor(posInPage / grid_columns);

        const x = startX + col * (badgeW + marginPt);
        const y = startY + row * (badgeH + marginPt);

        currentSlots.push({
            payload,
            qrCodeDataUrl: qrCodes.get(payload.id) || null,
            x,
            y,
        });

        // Página cheia → salvar e iniciar nova
        if (currentSlots.length === badgesPerPage) {
            pages.push({ slots: currentSlots });
            currentSlots = [];
        }
    });

    // Última página (parcial)
    if (currentSlots.length > 0) {
        pages.push({ slots: currentSlots });
    }

    return pages;
}

// ── Componente principal ───────────────────────────────────────────────

interface BadgeRendererProps {
    payloads: CanonicalBadgePayload[];
    layout?: BadgeLayoutConfig;
    /** Map<payload.id, dataUrl> — QR Codes pré-gerados */
    qrCodes?: Map<string, string>;
}

export default function BadgeRenderer({
    payloads,
    layout = DEFAULT_BADGE_LAYOUT,
    qrCodes = new Map(),
}: BadgeRendererProps) {
    const pages = organizarPaginas(payloads, layout, qrCodes);
    const badgeW = layout.width_mm * PT;
    const badgeH = layout.height_mm * PT;

    const eventName = payloads[0]?.event_info.event_name || 'Bom Pastor';

    return (
        <Document title={`Crachás – ${eventName}`} author="Bom Pastor Digital">
            {pages.map((page, pageIdx) => (
                <Page key={pageIdx} size="A4" style={s.page}>
                    {page.slots.map((slot, slotIdx) => (
                        <View
                            key={slotIdx}
                            style={{
                                position: 'absolute',
                                left: slot.x,
                                top: slot.y,
                            }}
                        >
                            <BadgeCard
                                payload={slot.payload}
                                widthMm={layout.width_mm}
                                heightMm={layout.height_mm}
                                layoutConfig={layout}
                                qrCodeDataUrl={slot.qrCodeDataUrl}
                            />
                        </View>
                    ))}

                    {/* Marcas de corte */}
                    {layout.has_cut_marks &&
                        page.slots.map((slot, slotIdx) => (
                            <BadgeCutMarks
                                key={`cut-${slotIdx}`}
                                x={slot.x}
                                y={slot.y}
                                badgeWidth={badgeW}
                                badgeHeight={badgeH}
                            />
                        ))}
                </Page>
            ))}
        </Document>
    );
}
