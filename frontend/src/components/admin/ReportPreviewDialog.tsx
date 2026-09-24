import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography,
    CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper,
    IconButton
} from '@mui/material';
import { useState } from 'react';
import { Download, Close, CloudUpload } from '@mui/icons-material';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Backdrop } from '@mui/material';
import { ListaPresencaTemplate, FichasInscricaoTemplate, ListaGeralTemplate, ListaPresencaDioceseTemplate, CrachasEmBrancoTemplate, RelatorioEquipesTemplate, RelatorioParoquiaTemplate, RelatorioCirculosTemplate } from './ReportTemplates';
import BadgeRenderer from './badges/templates/BadgeRenderer';
import { type CanonicalBadgePayload, type BadgeLayoutConfig, DEFAULT_BADGE_LAYOUT } from '../../types/badge';
import { formatarVinculoConjuge } from '../../services/badgeAdapters';
import { type DadosExportacao, exportService } from '../../services/exportService';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ReportPreviewDialogProps {
    open: boolean;
    tipo: 'lista' | 'fichas' | 'lista_geral' | 'crachas' | 'lista_presenca_diocese' | 'crachas_branco' | 'presenca_gerencial' | 'equipes' | 'paroquia' | 'circulos';
    dados: any[];
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
    const isMobile = useIsMobile();
    const [isExportingXLS, setIsExportingXLS] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
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
        if (tipo === 'equipes') {
            return <RelatorioEquipesTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        if (tipo === 'paroquia') {
            return <RelatorioParoquiaTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        if (tipo === 'circulos') {
            return <RelatorioCirculosTemplate dados={dados} tituloEvento={tituloEvento} />;
        }
        
        // Mapeamento para Crachás Unificados
        let layoutConfig: BadgeLayoutConfig = DEFAULT_BADGE_LAYOUT;
        try {
            const saved = localStorage.getItem('bpd_badge_layout_config');
            if (saved) layoutConfig = JSON.parse(saved);
        } catch {}

        const payloads: CanonicalBadgePayload[] = [];
        dados.forEach(d => {
            const paroquia = d.pastoral?.paroquia;
            const diocese = d.pastoral?.diocese;
            const cidade = d.endereco?.cidade;

            const footerMeta: Array<{ label: string; value: string }> = [];
            if (paroquia) footerMeta.push({ label: 'Paróquia', value: paroquia });
            if (diocese) footerMeta.push({ label: 'Diocese', value: diocese });
            if (cidade) footerMeta.push({ label: 'Cidade', value: cidade });

            const nomeEsposo = d.esposo?.nome;
            const nomeEsposa = d.esposa?.nome;

            if (d.tipo === 'individual' || !nomeEsposa) {
                payloads.push({
                    id: `${d.id}-individual`,
                    primary_name: nomeEsposo,
                    secondary_name: null,
                    category_label: 'Individual',
                    accent_color: '#0284C7',
                    event_info: { event_name: tituloEvento },
                    qr_code_content: `BPD:INS:${d.id}`,
                    footer_metadata: footerMeta,
                });
            } else {
                // Casal
                payloads.push({
                    id: `${d.id}-esposo`,
                    primary_name: nomeEsposo,
                    secondary_name: formatarVinculoConjuge('esposo', nomeEsposa),
                    category_label: 'Esposo',
                    accent_color: '#0284C7',
                    event_info: { event_name: tituloEvento },
                    qr_code_content: `BPD:INS:${d.id}`,
                    footer_metadata: footerMeta,
                });
                payloads.push({
                    id: `${d.id}-esposa`,
                    primary_name: nomeEsposa,
                    secondary_name: formatarVinculoConjuge('esposa', nomeEsposo),
                    category_label: 'Esposa',
                    accent_color: '#0284C7',
                    event_info: { event_name: tituloEvento },
                    qr_code_content: `BPD:INS:${d.id}`,
                    footer_metadata: footerMeta,
                });
            }
        });
        return <BadgeRenderer payloads={payloads} layout={layoutConfig} />;
    };

    const getTitle = () => {
        switch (tipo) {
            case 'lista': return 'Pré-visualização: Lista de Presença';
            case 'lista_geral': return 'Pré-visualização: Lista Geral de Inscritos';
            case 'fichas': return 'Pré-visualização: Fichas de Inscrição';
            case 'crachas': return 'Pré-visualização: Crachás do Evento';
            case 'lista_presenca_diocese': return 'Pré-visualização: Lista de Presença por Diocese';
            case 'crachas_branco': return 'Pré-visualização: Crachás em Branco';
            case 'presenca_gerencial': return 'Relatório de Presença Gerencial';
            case 'equipes': return 'Pré-visualização: Relatório de Equipes por Evento';
            case 'paroquia': return 'Pré-visualização: Relatório por Paróquia';
            case 'circulos': return 'Pré-visualização: Relatório de Círculos por Evento';
            default: return 'Pré-visualização';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6">
                        {getTitle()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {tituloEvento} ({dados.length} registro{dados.length !== 1 ? 's' : ''})
                    </Typography>
                </Box>
                <IconButton onClick={onClose} edge="end" aria-label="fechar">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: '#F5F5F5', height: '75vh' }}>
                {dados.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Nenhum dado para exibir.</Typography>
                    </Box>
                ) : tipo === 'presenca_gerencial' ? (
                    <Box sx={{ p: 3, bgcolor: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                            {tituloEvento}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, overflow: 'auto' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>Participante</TableCell>
                                        <TableCell sx={{ backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>Turno</TableCell>
                                        <TableCell sx={{ backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>Data</TableCell>
                                        <TableCell sx={{ backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>Chegada</TableCell>
                                        <TableCell sx={{ backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>Diocese</TableCell>
                                        <TableCell sx={{ backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>Cidade</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dados
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((row, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell>{row.participante}</TableCell>
                                            <TableCell>{row.turno}</TableCell>
                                            <TableCell>{new Date(row.data_evento).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{row.hora_chegada ? new Date(row.hora_chegada).toLocaleTimeString('pt-BR') : '-'}</TableCell>
                                            <TableCell>{row.diocese}</TableCell>
                                            <TableCell>{row.cidade_inscricao}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={dados.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            labelRowsPerPage="Linhas por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
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
                                if (tipo === 'presenca_gerencial') {
                                    exportService.exportarPresencaExcel(dados, `Presenca_${tituloEvento}`);
                                } else if (tipo === 'equipes') {
                                    exportService.exportarEquipesExcel(dados, `Equipes_${tituloEvento}`);
                                } else if (tipo === 'paroquia') {
                                    exportService.exportarParoquiaExcel(dados, `Paroquia_${tituloEvento}`);
                                } else if (tipo === 'circulos') {
                                    exportService.exportarCirculosExcel(dados, `Circulos_${tituloEvento}`);
                                } else {
                                    const individualizar = tipo === 'lista_presenca_diocese' || tipo === 'lista';
                                    const fileTitle = tipo === 'lista_presenca_diocese' ? 'Lista de Presença' : getTitle();
                                    exportService.exportarExcel(dados, fileTitle, individualizar);
                                }
                            } finally {
                                setIsExportingXLS(false);
                            }
                        }, 800);
                    }}
                >
                    {isExportingXLS ? 'Gerando XLS...' : 'Baixar XLS'}
                </Button>

                {tipo !== 'presenca_gerencial' && (
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
                )}
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
