/**
 * BadgePreviewDialog.tsx
 * Modal de pré-visualização e download/impressão dos crachás unificados.
 * Substituição desacoplada do CrachaPreviewDialog.tsx legado.
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, CircularProgress, LinearProgress,
} from '@mui/material';
import { Download, Print, Close } from '@mui/icons-material';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import type { CanonicalBadgePayload, BadgeLayoutConfig } from '../../../types/badge';
import { DEFAULT_BADGE_LAYOUT } from '../../../types/badge';
import BadgeRenderer from './templates/BadgeRenderer';
import { generateQRCodeBatch } from './templates/BadgeQRCode';

interface BadgePreviewDialogProps {
    open: boolean;
    payloads: CanonicalBadgePayload[];
    layout?: BadgeLayoutConfig;
    onClose: () => void;
}

export default function BadgePreviewDialog({
    open,
    payloads,
    layout = DEFAULT_BADGE_LAYOUT,
    onClose,
}: BadgePreviewDialogProps) {
    const [qrCodes, setQrCodes] = useState<Map<string, string>>(new Map());
    const [qrLoading, setQrLoading] = useState(false);

    const eventName = payloads[0]?.event_info.event_name ?? 'crachas';
    const fileName = `crachas_${eventName.replace(/\s+/g, '_').toLowerCase()}.pdf`;

    // Calcular quantas folhas A4
    const badgesPerPage = layout.grid_columns * layout.grid_rows;
    const totalPages = Math.ceil(payloads.length / badgesPerPage);

    // Pré-gerar QR Codes em batch quando o dialog abre
    useEffect(() => {
        if (!open || !layout.has_qr_code) return;

        const items = payloads
            .filter((p) => p.qr_code_content)
            .map((p) => ({ id: p.id, content: p.qr_code_content! }));

        if (items.length === 0) return;

        setQrLoading(true);
        generateQRCodeBatch(items, 50)
            .then(setQrCodes)
            .finally(() => setQrLoading(false));
    }, [open, payloads, layout.has_qr_code]);

    // Impressão direta (abre em nova aba)
    const handleDirectPrint = useCallback(async () => {
        const doc = (
            <BadgeRenderer payloads={payloads} layout={layout} qrCodes={qrCodes} />
        );
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) win.focus();
    }, [payloads, layout, qrCodes]);

    const isReady = !qrLoading;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6">Pré-visualização dos Crachás</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {totalPages} folha{totalPages !== 1 ? 's' : ''} A4
                        ({payloads.length} crachá{payloads.length !== 1 ? 's' : ''})
                        — Grade {layout.grid_columns}×{layout.grid_rows}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: '#F5F5F5', height: '70vh' }}>
                {qrLoading && (
                    <Box sx={{ px: 3, pt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Gerando QR Codes...
                        </Typography>
                        <LinearProgress sx={{ mt: 0.5 }} />
                    </Box>
                )}

                {payloads.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Nenhum participante selecionado.</Typography>
                    </Box>
                ) : isReady ? (
                    <PDFViewer
                        key={`${layout.size_preset}-${layout.width_mm}x${layout.height_mm}-${layout.frame_preset}-${layout.border_width}-${layout.border_radius}-${layout.has_cut_marks}-${layout.has_qr_code}-${layout.show_header_logo}-${layout.show_category_chip}-${layout.show_parish}-${layout.show_diocese}-${layout.show_cidade}-${payloads.length}`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    >
                        <BadgeRenderer payloads={payloads} layout={layout} qrCodes={qrCodes} />
                    </PDFViewer>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<Close />} color="inherit">
                    Fechar
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handleDirectPrint}
                    disabled={!isReady || payloads.length === 0}
                >
                    Abrir para Imprimir
                </Button>

                {isReady && payloads.length > 0 && (
                    <PDFDownloadLink
                        key={`${layout.size_preset}-${layout.width_mm}x${layout.height_mm}-${layout.frame_preset}-${layout.border_width}-${layout.border_radius}-${layout.has_cut_marks}-${layout.has_qr_code}-${layout.show_header_logo}-${layout.show_category_chip}-${layout.show_parish}-${layout.show_diocese}-${layout.show_cidade}-${payloads.length}`}
                        document={
                            <BadgeRenderer payloads={payloads} layout={layout} qrCodes={qrCodes} />
                        }
                        fileName={fileName}
                        style={{ textDecoration: 'none' }}
                    >
                        {({ loading }) => (
                            <Button
                                variant="contained"
                                startIcon={
                                    loading ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        <Download />
                                    )
                                }
                                disabled={loading}
                            >
                                {loading ? 'Gerando PDF...' : 'Baixar PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                )}
            </DialogActions>
        </Dialog>
    );
}
