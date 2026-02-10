import { Box, Paper, Typography, Chip, Button, Divider, useTheme, Alert } from '@mui/material';
import { Event, AccessTime, LocationOn, Person, WhatsApp, Edit, ContentCopy, Pix } from '@mui/icons-material';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PIX_CONFIG } from '../types';

interface RegistrationSummaryProps {
    inscricao: any; // Tiparia melhor se tivesse os types globais, vou usar any por praticidade agora e garantir compatibilidade
    onEdit: () => void;
}

export default function RegistrationSummary({ inscricao, onEdit }: RegistrationSummaryProps) {
    const theme = useTheme();
    const [copiedChave, setCopiedChave] = useState(false);
    const [copiedCola, setCopiedCola] = useState(false);

    const handleCopyChave = () => {
        navigator.clipboard.writeText(PIX_CONFIG.chave);
        setCopiedChave(true);
        setTimeout(() => setCopiedChave(false), 2000);
    };

    const handleCopyCola = () => {
        navigator.clipboard.writeText(PIX_CONFIG.pixCopiaCola);
        setCopiedCola(true);
        setTimeout(() => setCopiedCola(false), 2000);
    };

    if (!inscricao) return null;

    const evento = inscricao.eventos;
    const esposo = inscricao.esposo;
    const esposa = inscricao.esposa;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmado': return 'success';
            case 'pendente': return 'warning';
            case 'cancelado': return 'error';
            default: return 'default';
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '--/--/----';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            {/* Cabeçalho do Cartão */}
            <Paper
                elevation={3}
                sx={{
                    overflow: 'hidden',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Event fontSize="small" />
                            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                                ENCONTRO DE CASAIS
                            </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight="bold">
                            {evento?.nome || 'Nome do Evento Indisponível'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, opacity: 0.9 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime fontSize="small" />
                                <Typography variant="body2">
                                    {formatDate(evento?.data_inicio)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn fontSize="small" />
                                <Typography variant="body2">
                                    {inscricao.dioceses?.nome_completo || 'Local à definir'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Chip
                        label={(inscricao.status || 'Pendente').toUpperCase()}
                        color={getStatusColor(inscricao.status) as any}
                        sx={{ fontWeight: 'bold', bgcolor: 'white', color: 'primary.main' }}
                    />
                </Box>

                {/* Corpo do Cartão */}
                <Box sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" /> DADOS DO ESPOSO
                            </Typography>
                            <Typography variant="h6" color="primary.dark">
                                {esposo?.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                CPF: {esposo?.cpf}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'success.main' }}>
                                <WhatsApp fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                    {esposo?.telefone || 'Não informado'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1, borderLeft: { md: `1px solid ${theme.palette.divider}` }, pl: { md: 4 } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" /> DADOS DA ESPOSA
                            </Typography>
                            <Typography variant="h6" color="secondary.main">
                                {esposa?.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                CPF: {esposa?.cpf}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'success.main' }}>
                                <WhatsApp fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                    {esposa?.telefone || 'Não informado'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Seção de Pagamento PIX - Mostrar quando status é pendente */}
                    {inscricao.status === 'pendente' && (
                        <Box sx={{ mb: 3 }}>
                            <Alert
                                severity="warning"
                                icon={<Pix />}
                                sx={{
                                    mb: 2,
                                    border: '2px solid',
                                    borderColor: 'warning.main',
                                    bgcolor: '#FFF8E1'
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight="bold">
                                    💰 Pagamento Pendente — Confirme sua participação!
                                </Typography>
                            </Alert>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    bgcolor: '#FAFAFA',
                                    borderRadius: 2
                                }}
                            >
                                {/* Valor */}
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Valor da Inscrição
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                                        R$ 100,00
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
                                    {/* QR Code */}
                                    <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            📱 Escaneie o QR Code
                                        </Typography>
                                        <Box sx={{
                                            display: 'inline-block',
                                            p: 1.5,
                                            bgcolor: 'white',
                                            borderRadius: 2,
                                            border: '2px solid',
                                            borderColor: 'primary.main'
                                        }}>
                                            <QRCodeSVG
                                                value={PIX_CONFIG.pixCopiaCola}
                                                size={150}
                                                level="M"
                                            />
                                        </Box>
                                    </Box>

                                    {/* Dados do PIX */}
                                    <Box sx={{ flex: 1, width: '100%' }}>
                                        {/* Chave PIX */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Chave PIX ({PIX_CONFIG.chaveTipo})
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    sx={{
                                                        flex: 1, py: 1, px: 1.5,
                                                        bgcolor: 'white',
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'grey.300',
                                                        fontFamily: 'monospace'
                                                    }}
                                                >
                                                    {PIX_CONFIG.chave}
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<ContentCopy />}
                                                    onClick={handleCopyChave}
                                                    color={copiedChave ? 'success' : 'primary'}
                                                >
                                                    {copiedChave ? 'Copiado!' : 'Copiar'}
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Beneficiário */}
                                        <Typography variant="caption" color="text.secondary">
                                            Beneficiário
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                                            {PIX_CONFIG.beneficiario}
                                        </Typography>

                                        {/* Copia e Cola */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                PIX Copia e Cola
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        flex: 1, py: 1, px: 1.5,
                                                        bgcolor: 'white',
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'grey.300',
                                                        fontFamily: 'monospace',
                                                        wordBreak: 'break-all',
                                                        maxHeight: '60px',
                                                        overflow: 'auto'
                                                    }}
                                                >
                                                    {PIX_CONFIG.pixCopiaCola}
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<ContentCopy />}
                                                    onClick={handleCopyCola}
                                                    color={copiedCola ? 'success' : 'primary'}
                                                >
                                                    {copiedCola ? 'Copiado!' : 'Copiar'}
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* WhatsApp para enviar comprovante */}
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Após pagar, envie o comprovante via WhatsApp:
                                    </Typography>
                                    <Box sx={{
                                        display: 'inline-block',
                                        p: 1.5,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        border: '3px solid #FF5722',
                                        boxShadow: '0 0 0 3px rgba(255, 87, 34, 0.15)'
                                    }}>
                                        <Typography
                                            variant="h6"
                                            fontWeight="bold"
                                            sx={{ color: '#D32F2F', fontFamily: 'monospace' }}
                                        >
                                            {PIX_CONFIG.whatsappContato}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={onEdit}
                            disabled={inscricao.status === 'confirmado'}
                            title={inscricao.status === 'confirmado' ? 'Inscrição já confirmada' : 'Editar inscrição'}
                        >
                            Editar Inscrição
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Número de Protocolo: #{inscricao.id}
                </Typography>
            </Box>
        </Box>
    );
}
