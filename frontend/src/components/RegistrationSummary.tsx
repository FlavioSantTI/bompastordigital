import { Box, Paper, Typography, Chip, Button, Divider, useTheme, Alert, IconButton, Tooltip } from '@mui/material';
import { Event, AccessTime, LocationOn, Person, WhatsApp, Edit, ContentCopy, Pix } from '@mui/icons-material';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PIX_CONFIG } from '../types';

interface RegistrationSummaryProps {
    inscricao: any;
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
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
            <Paper
                elevation={2}
                sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                {/* Cabeçalho */}
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2.5,
                        py: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Event sx={{ fontSize: 16 }} />
                            <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.65rem', letterSpacing: 1 }}>
                                ENCONTRO DE CASAIS
                            </Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                            {evento?.nome || 'Nome do Evento Indisponível'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, opacity: 0.9 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: 14 }} />
                                <Typography variant="caption">{formatDate(evento?.data_inicio)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn sx={{ fontSize: 14 }} />
                                <Typography variant="caption">{inscricao.dioceses?.nome_completo || 'Local à definir'}</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Chip
                        label={(inscricao.status || 'Pendente').toUpperCase()}
                        color={getStatusColor(inscricao.status) as any}
                        size="small"
                        sx={{ fontWeight: 'bold', bgcolor: 'white', color: 'primary.main', fontSize: '0.7rem' }}
                    />
                </Box>

                {/* Corpo */}
                <Box sx={{ px: 2.5, py: 2 }}>
                    {/* Dados do Casal */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Person sx={{ fontSize: 14 }} /> ESPOSO
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary.dark">
                                {esposo?.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                CPF: {esposo?.cpf}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                                <WhatsApp sx={{ fontSize: 14 }} />
                                <Typography variant="caption">{esposo?.telefone || 'Não informado'}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1, borderLeft: { sm: `1px solid ${theme.palette.divider}` }, pl: { sm: 2 } }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Person sx={{ fontSize: 14 }} /> ESPOSA
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="secondary.main">
                                {esposa?.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                CPF: {esposa?.cpf}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                                <WhatsApp sx={{ fontSize: 14 }} />
                                <Typography variant="caption">{esposa?.telefone || 'Não informado'}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Seção PIX — quando pendente */}
                    {inscricao.status === 'pendente' && (
                        <Box sx={{ mb: 2 }}>
                            {/* Alerta com valor integrado */}
                            <Alert
                                severity="warning"
                                icon={<Pix />}
                                sx={{
                                    mb: 1.5,
                                    py: 0.5,
                                    border: '1px solid',
                                    borderColor: 'warning.main',
                                    bgcolor: '#FFF8E1',
                                    '& .MuiAlert-message': { width: '100%' }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        Pagamento Pendente
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                                        R$ 100,00
                                    </Typography>
                                </Box>
                            </Alert>

                            {/* QR Code + Dados PIX */}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                                alignItems: { xs: 'center', sm: 'flex-start' },
                                p: 2,
                                bgcolor: '#FAFAFA',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'grey.200'
                            }}>
                                {/* QR Code */}
                                <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                                    <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                                        📱 QR Code PIX
                                    </Typography>
                                    <Box sx={{
                                        display: 'inline-block',
                                        p: 1,
                                        bgcolor: 'white',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'primary.main'
                                    }}>
                                        <QRCodeSVG value={PIX_CONFIG.pixCopiaCola} size={120} level="M" />
                                    </Box>
                                </Box>

                                {/* Dados */}
                                <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
                                    {/* Chave PIX */}
                                    <Typography variant="caption" color="text.secondary">
                                        Chave PIX ({PIX_CONFIG.chaveTipo})
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight="bold"
                                            sx={{
                                                flex: 1,
                                                py: 0.5, px: 1,
                                                bgcolor: 'white',
                                                borderRadius: 0.5,
                                                border: '1px solid',
                                                borderColor: 'grey.300',
                                                fontFamily: 'monospace',
                                                fontSize: '0.8rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {PIX_CONFIG.chave}
                                        </Typography>
                                        <Tooltip title={copiedChave ? '✅ Copiado!' : 'Copiar chave'}>
                                            <IconButton
                                                size="small"
                                                onClick={handleCopyChave}
                                                color={copiedChave ? 'success' : 'primary'}
                                            >
                                                <ContentCopy sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* Beneficiário */}
                                    <Typography variant="caption" color="text.secondary">Beneficiário</Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                        {PIX_CONFIG.beneficiario}
                                    </Typography>

                                    {/* Copia e Cola */}
                                    <Typography variant="caption" color="text.secondary">PIX Copia e Cola</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                flex: 1,
                                                py: 0.5, px: 1,
                                                bgcolor: 'white',
                                                borderRadius: 0.5,
                                                border: '1px solid',
                                                borderColor: 'grey.300',
                                                fontFamily: 'monospace',
                                                fontSize: '0.65rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {PIX_CONFIG.pixCopiaCola}
                                        </Typography>
                                        <Tooltip title={copiedCola ? '✅ Copiado!' : 'Copiar código'}>
                                            <IconButton
                                                size="small"
                                                onClick={handleCopyCola}
                                                color={copiedCola ? 'success' : 'primary'}
                                            >
                                                <ContentCopy sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* WhatsApp inline */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        <WhatsApp sx={{ fontSize: 16, color: '#25D366' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Envie o comprovante:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#D32F2F', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            {PIX_CONFIG.whatsappContato}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Botão Editar */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            size="small"
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

            <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Protocolo: #{inscricao.id}
                </Typography>
            </Box>
        </Box>
    );
}
