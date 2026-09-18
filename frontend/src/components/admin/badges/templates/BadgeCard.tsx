/**
 * BadgeCard.tsx
 * Componente visual de um crachá individual no PDF.
 * 
 * Consome o CanonicalBadgePayload e BadgeLayoutConfig para renderizar:
 * - Molduras dinâmicas (Padrão Pastoral, Dourada Clássica, Minimalista, Custom Image, Tenda)
 * - Tarja de cor temática (accent_color)
 * - Fit-to-width para nomes longos
 * - Nomenclatura tradicional de casais ("da Silvia" / "do Flavio")
 * - Imagem de fundo/moldura personalizada (PNG/JPG)
 * - QR Code e Avatar
 */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { CanonicalBadgePayload, BadgeLayoutConfig } from '../../../../types/badge';
import { DEFAULT_BADGE_LAYOUT } from '../../../../types/badge';

// ── Constantes de layout ───────────────────────────────────────────────
const PT = 2.8346; // pontos por milímetro

interface BadgeCardProps {
    payload: CanonicalBadgePayload;
    /** Largura do crachá em mm */
    widthMm: number;
    /** Altura do crachá em mm */
    heightMm: number;
    /** Configurações de layout e moldura */
    layoutConfig?: BadgeLayoutConfig;
    /** QR code como imagem Data URL (pré-gerado pelo BadgeRenderer) */
    qrCodeDataUrl?: string | null;
}

// ── Fit-to-Width: calcula fontSize baseado no comprimento do nome e tamanho ──────
function computeFontSize(name: string, maxWidth: number, maxFont: number, minFont: number): number {
    const charWidthFactor = 0.55;
    const idealSize = maxWidth / (name.length * charWidthFactor);
    return Math.max(minFont, Math.min(maxFont, Math.floor(idealSize)));
}

export default function BadgeCard({
    payload,
    widthMm,
    heightMm,
    layoutConfig = DEFAULT_BADGE_LAYOUT,
    qrCodeDataUrl,
}: BadgeCardProps) {
    const W = widthMm * PT;
    const H = heightMm * PT;

    const isSmall = widthMm <= 65 || layoutConfig.size_preset === 'SMALL';
    const isMedium = (!isSmall && widthMm <= 95) || layoutConfig.size_preset === 'MEDIUM';

    const maxNameFont = isSmall ? 15 : (isMedium ? 18 : 22);
    const minNameFont = isSmall ? 10 : (isMedium ? 12 : 13);
    const nameFontSize = computeFontSize(payload.primary_name, W * 0.85, maxNameFont, minNameFont);

    const preset = layoutConfig.frame_preset || 'PASTORAL';
    const isGoldClassic = preset === 'GOLD_CLASSIC';
    const isMinimal = preset === 'MINIMAL';
    const isDeskTent = preset === 'DESK_TENT';

    // Determinar cor da borda
    const borderColor =
        isGoldClassic ? '#C5A059' :
        layoutConfig.border_color_mode === 'ACCENT' ? payload.accent_color :
        (layoutConfig.custom_border_color || '#E0E0E0');

    const borderWidth = isMinimal ? 0 : (layoutConfig.border_width ?? 1.5);
    const borderRadius = isMinimal || isDeskTent ? 0 : (layoutConfig.border_radius ?? (isSmall ? 4 : 5));

    const logoSize = isSmall ? 28 : (isMedium ? 36 : 48);
    const qrSize = isSmall ? 26 : (isMedium ? 32 : 40);
    const avatarSize = isSmall ? 30 : (isMedium ? 36 : 44);

    const s = StyleSheet.create({
        card: {
            width: W,
            height: H,
            backgroundColor: '#FFFFFF',
            borderRadius: borderRadius,
            overflow: 'hidden',
            flexDirection: 'column',
            borderWidth: borderWidth,
            borderColor: borderColor,
            borderStyle: isDeskTent ? 'dashed' : 'solid',
            position: 'relative',
        },
        // ── Imagem de moldura gráfica de fundo ──
        bgImage: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            objectFit: 'cover',
        },
        // ── Friso dourado interno (efeito clássico) ──
        goldInnerFrame: {
            position: 'absolute',
            top: isSmall ? 2.5 : 4,
            left: isSmall ? 2.5 : 4,
            width: W - (isSmall ? 5 : 8),
            height: H - (isSmall ? 5 : 8),
            borderWidth: 0.8,
            borderColor: '#C5A059',
            borderRadius: Math.max(0, borderRadius - 2),
        },
        // ── Tarja de cor no topo ──────────────
        accentBar: {
            width: '100%',
            height: isMinimal ? 3 : (isSmall ? 5 : (isMedium ? 6 : 8)),
            backgroundColor: payload.accent_color,
        },
        // ── Cabeçalho ────────────────────────
        header: {
            width: '100%',
            paddingVertical: isSmall ? 4 : (isMedium ? 6 : 8),
            paddingHorizontal: isSmall ? 6 : 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: isMinimal ? 0 : 0.5,
            borderBottomColor: '#EEEEEE',
        },
        logo: {
            width: logoSize,
            height: logoSize,
            objectFit: 'contain',
            marginBottom: isSmall ? 1.5 : 3,
        },
        eventName: {
            color: isGoldClassic ? '#1E293B' : '#1A237E',
            fontSize: isSmall ? 7 : (isMedium ? 8.5 : 9.5),
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            textTransform: isGoldClassic ? 'uppercase' : 'none',
            letterSpacing: isGoldClassic ? 0.5 : 0,
        },
        headerDivider: {
            width: isSmall ? 18 : 25,
            height: isSmall ? 1 : 1.5,
            backgroundColor: isGoldClassic ? '#C5A059' : payload.accent_color,
            marginTop: isSmall ? 3 : 5,
        },
        // ── Corpo ────────────────────────────
        body: {
            flex: 1,
            paddingHorizontal: isSmall ? 6 : (isMedium ? 10 : 14),
            paddingTop: isSmall ? 3 : (isMedium ? 4 : 6),
            paddingBottom: isSmall ? 3 : (isMedium ? 4 : 6),
            alignItems: 'center',
            justifyContent: 'center',
        },
        // ── Category label chip ──────────────
        categoryChip: {
            backgroundColor: `${payload.accent_color}18`,
            borderRadius: 20,
            paddingHorizontal: isSmall ? 6 : 10,
            paddingVertical: isSmall ? 1.5 : 3,
            marginBottom: isSmall ? 3 : 6,
            borderWidth: 0.8,
            borderColor: `${payload.accent_color}50`,
        },
        categoryLabel: {
            color: payload.accent_color,
            fontSize: isSmall ? 5.5 : (isMedium ? 6.5 : 7),
            fontWeight: 'bold',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
        },
        // ── Role badge chip ──────────────────
        roleBadge: {
            backgroundColor: `${payload.accent_color}25`,
            borderRadius: 12,
            paddingHorizontal: isSmall ? 6 : 8,
            paddingVertical: isSmall ? 1.5 : 2,
            marginBottom: isSmall ? 4 : 8,
        },
        roleBadgeText: {
            color: payload.accent_color,
            fontSize: isSmall ? 5.5 : 6.5,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        // ── Nome principal ───────────────────
        primaryName: {
            fontSize: nameFontSize,
            fontWeight: 'bold',
            color: isGoldClassic ? '#0F172A' : '#212121',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: isSmall ? 1.5 : 3,
        },
        // ── Nome secundário / Vínculo (Ex: "da Adeniza" / "do Waltuir") ──
        secondaryName: {
            fontSize: isSmall ? 8.5 : (isMedium ? 10.5 : 12),
            color: isGoldClassic ? '#475569' : '#333333',
            textAlign: 'center',
            fontFamily: 'Helvetica-Oblique',
            marginTop: -1,
            marginBottom: isSmall ? 4 : 8,
        },
        // ── Avatar ───────────────────────────
        avatarContainer: {
            marginBottom: isSmall ? 3 : 6,
        },
        avatar: {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            objectFit: 'cover',
            borderWidth: 1.5,
            borderColor: payload.accent_color,
        },
        // ── QR Code ──────────────────────────
        qrContainer: {
            marginTop: isSmall ? 2 : 4,
            marginBottom: isSmall ? 3 : 6,
            alignItems: 'center',
        },
        qrImage: {
            width: qrSize,
            height: qrSize,
            objectFit: 'contain',
        },
        // ── Linha pontilhada de dobra (Desk Tent) ──
        tentFoldLine: {
            width: '90%',
            borderBottomWidth: 1,
            borderBottomColor: '#9E9E9E',
            borderBottomStyle: 'dashed',
            marginVertical: isSmall ? 3 : 6,
        },
        // ── Footer metadata ──────────────────
        footerSection: {
            width: '100%',
            borderTopWidth: 0.5,
            borderTopColor: '#EEEEEE',
            paddingTop: isSmall ? 2.5 : 5,
            paddingHorizontal: 2,
        },
        metaRow: {
            flexDirection: 'row',
            marginBottom: isSmall ? 1.5 : 2.5,
            alignItems: 'flex-start',
        },
        metaLabel: {
            color: '#424242',
            fontSize: isSmall ? 5.5 : (isMedium ? 6.5 : 7),
            fontWeight: 'bold',
            textTransform: 'uppercase',
            width: isSmall ? 42 : (isMedium ? 48 : 55),
            letterSpacing: 0.3,
        },
        metaValue: {
            color: '#616161',
            fontSize: isSmall ? 5.5 : (isMedium ? 6.5 : 7),
            flex: 1,
            lineHeight: 1.2,
        },
        // ── Rodapé colorido ──────────────────
        footer: {
            backgroundColor: isGoldClassic ? '#F8F5EE' : `${payload.accent_color}12`,
            borderTopWidth: 0.5,
            borderTopColor: isGoldClassic ? '#C5A05940' : `${payload.accent_color}30`,
            paddingVertical: isSmall ? 3 : (isMedium ? 4 : 5),
            paddingHorizontal: isSmall ? 6 : 12,
            alignItems: 'center',
        },
        footerText: {
            color: isGoldClassic ? '#C5A059' : payload.accent_color,
            fontSize: isSmall ? 6.5 : (isMedium ? 7.5 : 8),
            fontWeight: 'bold',
            letterSpacing: 0.5,
        },
    });

    // Processar metadados vindos do banco respeitando os toggles de exibição
    const finalMetadata = payload.footer_metadata.filter((m) => {
        const lbl = m.label.toLowerCase();
        if ((lbl.includes('paróquia') || lbl.includes('paroquia')) && layoutConfig.show_parish === false) return false;
        if (lbl.includes('diocese') && layoutConfig.show_diocese === false) return false;
        if (lbl.includes('cidade') && layoutConfig.show_cidade === false) return false;
        return true;
    });

    const paroquiaMeta = finalMetadata.find((m) => m.label.toLowerCase().includes('paróquia') || m.label.toLowerCase().includes('paroquia'));
    const cidadeMeta = finalMetadata.find((m) => m.label.toLowerCase().includes('cidade'));
    const footerSummary = [
        paroquiaMeta?.value,
        cidadeMeta?.value,
    ].filter(Boolean).join(' • ');

    return (
        <View style={s.card}>
            {/* Imagem de Moldura Gráfica Personalizada (se houver) */}
            {layoutConfig.bg_image_url && (
                <Image style={s.bgImage} src={layoutConfig.bg_image_url} />
            )}

            {/* Friso Dourado Interno (Preset Dourada Clássica) */}
            {isGoldClassic && <View style={s.goldInnerFrame} />}

            {/* Tarja de cor no topo */}
            <View style={s.accentBar} />

            {/* Cabeçalho com logo + nome do evento */}
            <View style={s.header}>
                {layoutConfig.show_header_logo !== false && (
                    <Image style={s.logo} src="/img/logo.jpg" />
                )}
                <Text style={s.eventName}>{payload.event_info.event_name}</Text>
                <View style={s.headerDivider} />
            </View>

            {/* Corpo */}
            <View style={s.body}>
                {/* Category label (se ativado) */}
                {layoutConfig.show_category_chip !== false && (
                    <View style={s.categoryChip}>
                        <Text style={s.categoryLabel}>{payload.category_label}</Text>
                    </View>
                )}

                {/* Avatar (se disponível) */}
                {payload.avatar_url && (
                    <View style={s.avatarContainer}>
                        <Image style={s.avatar} src={payload.avatar_url} />
                    </View>
                )}

                {/* Nome principal */}
                <Text style={s.primaryName}>{payload.primary_name}</Text>

                {/* Nome secundário / Vínculo (ex: "da Adeniza" / "do Waltuir") */}
                {payload.secondary_name && (
                    <Text style={s.secondaryName}>{payload.secondary_name}</Text>
                )}

                {/* Role badge */}
                {payload.role_badge && (
                    <View style={s.roleBadge}>
                        <Text style={s.roleBadgeText}>{payload.role_badge}</Text>
                    </View>
                )}

                {/* Linha de vinco para tenda de mesa */}
                {isDeskTent && <View style={s.tentFoldLine} />}

                {/* QR Code */}
                {layoutConfig.has_qr_code !== false && qrCodeDataUrl && (
                    <View style={s.qrContainer}>
                        <Image style={s.qrImage} src={qrCodeDataUrl} />
                    </View>
                )}

                {/* Footer metadata */}
                {finalMetadata.length > 0 && (
                    <View style={s.footerSection}>
                        {finalMetadata.map((meta, i) => (
                            <View key={i} style={s.metaRow}>
                                <Text style={s.metaLabel}>{meta.label}</Text>
                                <Text style={s.metaValue}>{meta.value}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Rodapé colorido */}
            <View style={s.footer}>
                <Text style={s.footerText}>
                    {footerSummary || (payload.event_info.edition || payload.event_info.event_name)}
                </Text>
            </View>
        </View>
    );
}
