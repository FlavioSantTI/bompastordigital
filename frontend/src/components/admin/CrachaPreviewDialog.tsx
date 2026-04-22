/**
 * CrachaPreviewDialog.tsx
 * Modal de pré-visualização e download/impressão dos crachás selecionados.
 */
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography,
    CircularProgress,
} from '@mui/material';
import { Download, Print, Close } from '@mui/icons-material';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import CrachaTemplate, { type CrachaData } from './CrachaTemplate';
import * as XLSX from 'xlsx';

interface CrachaPreviewDialogProps {
    open: boolean;
    participantes: CrachaData[];
    onClose: () => void;
}

export default function CrachaPreviewDialog({
    open,
    participantes,
    onClose,
}: CrachaPreviewDialogProps) {
    const eventoNome = participantes[0]?.evento ?? 'crachas';
    const nomeArquivo = `crachas_${eventoNome.replace(/\s+/g, '_').toLowerCase()}.pdf`;

        const rows = participantes.map(p => ({
            'Nome': p.nome,
            'Paróquia': p.paroquia || '-',
            'Diocese': p.diocese || '-',
            'Cidade': p.cidade || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Crachas');
        XLSX.writeFile(workbook, `lista_impressao_${eventoNome.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
    };

    const handleDirectPrint = async () => {
        const doc = <CrachaTemplate participantes={participantes} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) win.focus();
    };



    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6">Pré-visualização dos Crachás</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {Math.ceil(participantes.length / 2)} folha{Math.ceil(participantes.length / 2) !== 1 ? 's' : ''} A4
                        ({participantes.length} participante{participantes.length !== 1 ? 's' : ''})
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: '#F5F5F5', height: '70vh' }}>
                {participantes.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Nenhum participante selecionado.</Typography>
                    </Box>
                ) : (
                    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                        <CrachaTemplate participantes={participantes} />
                    </PDFViewer>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<Close />} color="inherit">
                    Fechar
                </Button>

                <Button
                    variant="outlined"
                    color="success"
                    startIcon={<Download />}
                    onClick={exportToExcel}
                    disabled={participantes.length === 0}
                >
                    Baixar XLS
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handleDirectPrint}
                    disabled={participantes.length === 0}
                >
                    Abrir para Imprimir
                </Button>

                <PDFDownloadLink
                    document={<CrachaTemplate participantes={participantes} />}
                    fileName={nomeArquivo}
                    style={{ textDecoration: 'none' }}
                >
                    {({ loading }) => (
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Download />}
                            disabled={loading || participantes.length === 0}
                        >
                            {loading ? 'Gerando PDF...' : 'Baixar PDF'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </DialogActions>
        </Dialog>
    );
}
