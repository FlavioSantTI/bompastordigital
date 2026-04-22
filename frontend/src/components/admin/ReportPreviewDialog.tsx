import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography,
    CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { Download, Close, CloudUpload } from '@mui/icons-material';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Backdrop } from '@mui/material';
import { ListaPresencaTemplate, FichasInscricaoTemplate, ListaGeralTemplate, ListaPresencaDioceseTemplate, CrachasEmBrancoTemplate } from './ReportTemplates';
import CrachaTemplate, { type CrachaData } from './CrachaTemplate';
import { type DadosExportacao, exportService } from '../../services/exportService';

interface ReportPreviewDialogProps {
    open: boolean;
    tipo: 'lista' | 'fichas' | 'lista_geral' | 'crachas' | 'lista_presenca_diocese' | 'crachas_branco';
    dados: DadosExportacao[];
    tituloEvento: string;
    onClose: () => void;
}

export default function ReportPreviewDialog({
    open,
    tipo,
    dados,
    tituloEvento,
    onClose,
}: ReportPreviewDialogProps) {
    const [isExportingXLS, setIsExportingXLS] = useState(false);
    
    // Nome do arquivo padrão
    const prefixo = tipo === 'lista_presenca_diocese' ? 'Lista_de_Presenca' : tipo.replace('_', ' ');
    const nomeArquivo = `${prefixo}_${tituloEvento.replace(/\s+/g, '_')}.pdf`;

    const getDocument = () => {
        if (tipo === 'lista') {
            return <ListaPresencaTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        if (tipo === 'lista_geral') {
            return <ListaGeralTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        if (tipo === 'fichas') {
            return <FichasInscricaoTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        if (tipo === 'lista_presenca_diocese') {
            return <ListaPresencaDioceseTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        if (tipo === 'crachas_branco') {
            return <CrachasEmBrancoTemplate />;
        }
        
        // Mapeamento para Crachás
        const crachaParticipants: CrachaData[] = [];
        dados.forEach(d => {
            crachaParticipants.push({
                inscricao_id: d.id,
                tipo: d.tipo === 'individual' ? 'individual' : 'esposo',
                nome: d.esposo.nome,
                paroquia: d.pastoral.paroquia,
                diocese: d.pastoral.diocese,
                cidade: d.endereco.cidade,
                evento: tituloEvento
            });
            if (d.tipo === 'casal' && d.esposa) {
                crachaParticipants.push({
                    inscricao_id: d.id,
                    tipo: 'esposa',
                    nome: d.esposa.nome,
                    paroquia: d.pastoral.paroquia,
                    diocese: d.pastoral.diocese,
                    cidade: d.endereco.cidade,
                    evento: tituloEvento
                });
            }
        });
        return <CrachaTemplate participantes={crachaParticipants} />;
    };

    const getTitle = () => {
        switch (tipo) {
            case 'lista': return 'Pré-visualização: Lista de Presença';
            case 'lista_geral': return 'Pré-visualização: Lista Geral de Inscritos';
            case 'fichas': return 'Pré-visualização: Fichas de Inscrição';
            case 'crachas': return 'Pré-visualização: Crachás do Evento';
            case 'lista_presenca_diocese': return 'Pré-visualização: Lista de Presença por Diocese';
            case 'crachas_branco': return 'Pré-visualização: Crachás em Branco';
            default: return 'Pré-visualização';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6">
                        {getTitle()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {tituloEvento} ({dados.length} registro{dados.length !== 1 ? 's' : ''})
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: '#F5F5F5', height: '75vh' }}>
                {dados.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Nenhum dado para exibir.</Typography>
                    </Box>
                ) : (
                    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                        {getDocument()}
                    </PDFViewer>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} startIcon={<Close />} color="inherit">
                    Fechar
                </Button>

                <Button 
                    variant="contained" 
                    color="success" 
                    sx={{ 
                        color: '#fff !important', 
                        '&.Mui-disabled': { 
                            color: 'rgba(255, 255, 255, 0.8) !important',
                            bgcolor: '#1b5e20 !important',
                            opacity: 0.7
                        } 
                    }}
                    startIcon={isExportingXLS ? <CircularProgress size={18} color="inherit" /> : <Download />}
                    disabled={dados.length === 0 || isExportingXLS}
                    onClick={async () => {
                        setIsExportingXLS(true);
                        setTimeout(() => {
                            try {
                                const individualizar = tipo === 'lista_presenca_diocese' || tipo === 'lista';
                                const fileTitle = tipo === 'lista_presenca_diocese' ? 'Lista de Presença' : getTitle();
                                exportService.exportarExcel(dados, fileTitle, individualizar);
                            } finally {
                                setIsExportingXLS(false);
                            }
                        }, 800);
                    }}
                >
                    {isExportingXLS ? 'Gerando XLS...' : 'Baixar XLS'}
                </Button>

                <PDFDownloadLink
                    document={getDocument()}
                    fileName={nomeArquivo}
                    style={{ textDecoration: 'none' }}
                >
                    {({ loading }) => (
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ 
                                color: '#fff !important',
                                '&.Mui-disabled': { 
                                    color: 'rgba(255, 255, 255, 0.8) !important',
                                    bgcolor: '#0d47a1 !important',
                                    opacity: 0.7
                                } 
                            }}
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Download />}
                            disabled={loading || dados.length === 0}
                        >
                            {loading ? 'Preparando PDF...' : 'Baixar PDF'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </DialogActions>

            {/* Overlay de Processamento Circular */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1000, flexDirection: 'column', gap: 2 }}
                open={isExportingXLS}
            >
                <CircularProgress color="inherit" size={60} thickness={4} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Gerando sua planilha...</Typography>
                <Typography variant="body2">Aguarde um instante.</Typography>
            </Backdrop>
        </Dialog>
    );
}
