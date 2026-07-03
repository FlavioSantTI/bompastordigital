import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import {
    WhatsApp,
    ContentCopy,
    PictureAsPdf,
    CheckCircleOutline,
    ErrorOutline,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface Promovido {
    inscricao_id: string;
    posicao_anterior: number;
    esposo_nome: string;
    esposo_telefone: string;
    esposo_email: string;
    esposa_nome: string;
    esposa_telefone: string;
    esposa_email: string;
    novo_status: string;
}

interface PromoverReservaDialogProps {
    open: boolean;
    onClose: () => void;
    eventoNome: string;
    quantidade: number;
    previewList: Array<{
        tipo: 'casal' | 'individual';
        esposo?: { nome: string; telefone: string };
        esposa?: { nome: string; telefone: string };
    }>;
    isPromoted: boolean; // false = modo confirmação, true = modo relatório
    promovidosList: Promovido[];
    restantesNaFila: number;
    onConfirm: () => void;
    loading: boolean;
}

export default function PromoverReservaDialog({
    open,
    onClose,
    eventoNome,
    quantidade,
    previewList,
    isPromoted,
    promovidosList,
    restantesNaFila,
    onConfirm,
    loading,
}: PromoverReservaDialogProps) {

    // 1. WhatsApp link helper
    const handleWhatsAppClick = (nome: string, telefone: string) => {
        if (!telefone) return;
        const cleanNumber = telefone.replace(/\D/g, '');
        // Adiciona DDI 55 se necessário
        const ddiNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
        const message = `Olá ${nome}! Temos uma excelente notícia! Sua inscrição para o evento "${eventoNome}" foi liberada! Favor acessar o Painel do Participante para conferir as instruções. Ficamos no aguardo! Deus abençoe.`;
        window.open(`https://wa.me/${ddiNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // 2. Copiar resumo para Área de Transferência
    const handleCopySummary = () => {
        let text = `🚀 *Inscrições Promovidas - ${eventoNome}*\n`;
        text += `Restantes na lista de espera: ${restantesNaFila}\n\n`;
        text += `📋 *Lista de Promovidos:*\n`;

        promovidosList.forEach((p, idx) => {
            text += `\n#${idx + 1} - `;
            if (p.esposo_nome && p.esposa_nome) {
                text += `${p.esposo_nome} & ${p.esposa_nome}\n`;
                if (p.esposo_telefone) text += `   - Cel Esposo: ${p.esposo_telefone}\n`;
                if (p.esposa_telefone) text += `   - Cel Esposa: ${p.esposa_telefone}\n`;
            } else {
                const nome = p.esposo_nome || p.esposa_nome || 'N/A';
                const tel = p.esposo_telefone || p.esposa_telefone || 'N/A';
                text += `${nome}\n   - Cel: ${tel}\n`;
            }
        });

        navigator.clipboard.writeText(text);
        alert('Resumo copiado com sucesso para a área de transferência!');
    };

    // 3. Exportar relatório em PDF
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Relatório de Promoção - Lista de Espera', pageWidth / 2, 20, { align: 'center' });

        // Evento info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Evento: ${eventoNome}`, 14, 32);
        doc.text(`Data da Promoção: ${new Date().toLocaleDateString('pt-BR')}`, 14, 38);
        doc.text(`Restantes na fila: ${restantesNaFila}`, 14, 44);

        // Tabela de Promovidos
        const headers = [['#', 'Participante(s)', 'Telefone(s)', 'E-mail(s)', 'Novo Status']];
        const data = promovidosList.map((p, idx) => {
            const participantes = p.esposo_nome && p.esposa_nome
                ? `${p.esposo_nome}\n${p.esposa_nome}`
                : (p.esposo_nome || p.esposa_nome || '-');
            const telefones = p.esposo_telefone && p.esposa_telefone
                ? `${p.esposo_telefone}\n${p.esposa_telefone}`
                : (p.esposo_telefone || p.esposa_telefone || '-');
            const emails = p.esposo_email && p.esposa_email
                ? `${p.esposo_email}\n${p.esposa_email}`
                : (p.esposo_email || p.esposa_email || '-');
            
            return [
                idx + 1,
                participantes,
                telefones,
                emails,
                p.novo_status.toUpperCase()
            ];
        });

        (doc as any).autoTable({
            startY: 50,
            head: headers,
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 60 },
                2: { cellWidth: 40 },
                3: { cellWidth: 50 },
                4: { cellWidth: 30 }
            }
        });

        doc.save(`relatorio-promovidos-${eventoNome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
            {/* Título adaptável */}
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {isPromoted ? (
                        <CheckCircleOutline color="success" sx={{ fontSize: 32 }} />
                    ) : (
                        <ErrorOutline color="warning" sx={{ fontSize: 32 }} />
                    )}
                    <Typography variant="h5" fontWeight="bold">
                        {isPromoted ? 'Promoções Realizadas com Sucesso!' : 'Confirmar Promoção em Lote'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* ESTADO 1: CONFIRMAÇÃO ANTES DE PROMOVER */}
                {!isPromoted && (
                    <Box>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Você está prestes a promover as seguintes <strong>{quantidade}</strong> inscrições da lista de espera do evento <strong>{eventoNome}</strong> seguindo a fila cronológica (FIFO).
                        </Alert>

                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Lista de participantes que serão promovidos:
                        </Typography>

                        <TableContainer component={Paper} variant="outlined" elevation={0} sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" width="60"><strong>Posição</strong></TableCell>
                                        <TableCell><strong>Tipo</strong></TableCell>
                                        <TableCell><strong>Nome</strong></TableCell>
                                        <TableCell><strong>Contato</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewList.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell align="center" fontWeight="bold">#{idx + 1}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                    {item.tipo}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {item.tipo === 'casal' ? (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">👨 {item.esposo?.nome}</Typography>
                                                        <Typography variant="body2" fontWeight="bold">👩 {item.esposa?.nome}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" fontWeight="bold">👤 {item.esposo?.nome || item.esposa?.nome}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.tipo === 'casal' ? (
                                                    <Box>
                                                        <Typography variant="caption" display="block">{item.esposo?.telefone}</Typography>
                                                        <Typography variant="caption" display="block">{item.esposa?.telefone}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption">{item.esposo?.telefone || item.esposa?.telefone}</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                            ⚠️ Esta ação irá alterar o status das inscrições e notificará os dados internos. Não pode ser desfeita.
                        </Typography>
                    </Box>
                )}

                {/* ESTADO 2: RELATÓRIO APÓS PROMOÇÃO */}
                {isPromoted && (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Foram promovidas <strong>{promovidosList.length}</strong> inscrições para a fila de pagantes! Restam <strong>{restantesNaFila}</strong> reservas na lista de espera.
                        </Alert>

                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                            📋 Relatório de Contato dos Promovidos
                        </Typography>

                        <TableContainer component={Paper} variant="outlined" elevation={0} sx={{ maxHeight: 350 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" width="50"><strong>#</strong></TableCell>
                                        <TableCell><strong>Nome(s)</strong></TableCell>
                                        <TableCell><strong>Telefone(s)</strong></TableCell>
                                        <TableCell align="center"><strong>Novo Status</strong></TableCell>
                                        <TableCell align="center" width="120"><strong>WhatsApp Rápido</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {promovidosList.map((p, idx) => (
                                        <TableRow key={p.inscricao_id} hover>
                                            <TableCell align="center" fontWeight="bold">{idx + 1}</TableCell>
                                            <TableCell>
                                                {p.esposo_nome && p.esposa_nome ? (
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">👨 {p.esposo_nome}</Typography>
                                                        <Typography variant="body2" fontWeight="bold">👩 {p.esposa_nome}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" fontWeight="bold">👤 {p.esposo_nome || p.esposa_nome}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {p.esposo_nome && p.esposa_nome ? (
                                                    <Box>
                                                        <Typography variant="caption" display="block">{p.esposo_telefone}</Typography>
                                                        <Typography variant="caption" display="block">{p.esposa_telefone}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption">{p.esposo_telefone || p.esposa_telefone}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={p.novo_status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                                                    color={p.novo_status === 'confirmada' ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    {p.esposo_telefone && (
                                                        <Tooltip title={`Conversar com ${p.esposo_nome || 'Esposo'}`}>
                                                            <IconButton
                                                                color="success"
                                                                size="small"
                                                                onClick={() => handleWhatsAppClick(p.esposo_nome || 'Participante', p.esposo_telefone)}
                                                            >
                                                                <WhatsApp fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {p.esposa_telefone && (
                                                        <Tooltip title={`Conversar com ${p.esposa_nome || 'Esposa'}`}>
                                                            <IconButton
                                                                color="success"
                                                                size="small"
                                                                onClick={() => handleWhatsAppClick(p.esposa_nome, p.esposa_telefone)}
                                                            >
                                                                <WhatsApp fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PictureAsPdf />}
                                onClick={handleDownloadPDF}
                            >
                                Baixar Relatório PDF
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<ContentCopy />}
                                onClick={handleCopySummary}
                            >
                                Copiar Resumo Textual
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                {!isPromoted ? (
                    <>
                        <Button onClick={onClose} color="inherit" disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={onConfirm}
                            color="success"
                            variant="contained"
                            disabled={loading || previewList.length === 0}
                        >
                            {loading ? 'Processando...' : 'Confirmar e Promover'}
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose} color="primary" variant="contained">
                        Fechar Relatório
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
