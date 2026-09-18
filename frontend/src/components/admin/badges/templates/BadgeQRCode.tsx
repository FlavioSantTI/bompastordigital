/**
 * BadgeQRCode.tsx
 * Componente que gera QR Code como imagem PNG base64 para uso no @react-pdf/renderer.
 * 
 * Utiliza a lib `qrcode` para gerar a imagem (compatível com react-pdf via <Image>),
 * pois SVGs inline não são suportados nativamente pelo react-pdf.
 */
import { useState, useEffect } from 'react';
import { Image, View, StyleSheet } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const s = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrImage: {
        objectFit: 'contain',
    },
});

interface BadgeQRCodeProps {
    /** Conteúdo codificado no QR Code (ex.: "BPD:INS:uuid:42") */
    content: string;
    /** Tamanho em pontos PDF (default: 50pt ≈ 18mm) */
    size?: number;
}

/**
 * Hook que gera o QR Code como Data URL PNG base64.
 * Retorna null enquanto está gerando.
 */
function useQRCodeDataUrl(content: string, size: number): string | null {
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        QRCode.toDataURL(content, {
            width: size * 3,    // 3x para qualidade em 300 DPI
            margin: 1,
            errorCorrectionLevel: 'M',  // 15% — bom equilíbrio entre densidade e robustez
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        })
        .then((url) => {
            if (!cancelled) setDataUrl(url);
        })
        .catch(() => {
            // Silencioso — não quebra o crachá se o QR falhar
        });

        return () => { cancelled = true; };
    }, [content, size]);

    return dataUrl;
}

export default function BadgeQRCode({ content, size = 50 }: BadgeQRCodeProps) {
    const dataUrl = useQRCodeDataUrl(content, size);

    if (!dataUrl) {
        // Placeholder enquanto gera
        return <View style={[s.container, { width: size, height: size }]} />;
    }

    return (
        <View style={[s.container, { width: size, height: size }]}>
            <Image
                style={[s.qrImage, { width: size, height: size }]}
                src={dataUrl}
            />
        </View>
    );
}

/**
 * Utilitário para pré-gerar QR Codes em batch (para renderização server-side ou SSR).
 * Retorna um Map<id, dataUrl>.
 */
export async function generateQRCodeBatch(
    items: Array<{ id: string; content: string }>,
    size: number = 50
): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
        items.map(async (item) => {
            try {
                const url = await QRCode.toDataURL(item.content, {
                    width: size * 3,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                });
                results.set(item.id, url);
            } catch {
                // Skip silenciosamente
            }
        })
    );

    return results;
}
