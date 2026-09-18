/**
 * BadgeCutMarks.tsx
 * Marcas de corte reutilizáveis para o layout de crachás em folha A4.
 * Posicionadas absolutamente nos 4 cantos de cada crachá.
 */
import { View, StyleSheet } from '@react-pdf/renderer';

const CUT_LEN = 10;    // comprimento visível da marca (pt)
const CUT_GAP = 3;     // gap entre a borda do crachá e a marca
const CUT_CLR = '#BDBDBD';
const CUT_W = 0.5;     // espessura da linha

const s = StyleSheet.create({
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
});

interface BadgeCutMarksProps {
    /** Posição X do canto superior-esquerdo do crachá */
    x: number;
    /** Posição Y do canto superior-esquerdo do crachá */
    y: number;
    /** Largura do crachá em pontos */
    badgeWidth: number;
    /** Altura do crachá em pontos */
    badgeHeight: number;
}

export default function BadgeCutMarks({ x, y, badgeWidth, badgeHeight }: BadgeCutMarksProps) {
    const g = CUT_GAP;
    const l = CUT_LEN;

    return (
        <>
            {/* Canto superior-esquerdo */}
            <View style={[s.cutH, { top: y - g, left: x - g - l }]} />
            <View style={[s.cutV, { top: y - g - l, left: x - g }]} />

            {/* Canto superior-direito */}
            <View style={[s.cutH, { top: y - g, left: x + badgeWidth + g }]} />
            <View style={[s.cutV, { top: y - g - l, left: x + badgeWidth + g }]} />

            {/* Canto inferior-esquerdo */}
            <View style={[s.cutH, { top: y + badgeHeight + g, left: x - g - l }]} />
            <View style={[s.cutV, { top: y + badgeHeight + g, left: x - g }]} />

            {/* Canto inferior-direito */}
            <View style={[s.cutH, { top: y + badgeHeight + g, left: x + badgeWidth + g }]} />
            <View style={[s.cutV, { top: y + badgeHeight + g, left: x + badgeWidth + g }]} />
        </>
    );
}
