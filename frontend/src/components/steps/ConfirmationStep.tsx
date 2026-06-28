import { Box, Typography, Paper, Button, Alert, Divider, CircularProgress } from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getPaymentStrategy } from '../../services/paymentStrategies';

interface ConfirmationStepProps {
    registration?: {
        tipo: 'casal' | 'individual';
        inscricaoId: number;
        status?: string;
        evento: {
            id: number;
            nome: string;
            data_inicio: string;
            data_fim: string;
            is_paid: boolean;
            event_price?: number | null;
            pix_key_type?: string | null;
            pix_key?: string | null;
            merchant_name?: string | null;
            merchant_city?: string | null;
        };
        esposo?: { nome: string; email: string };
        esposa?: { nome: string; email: string };
        participante?: { nome: string; email: string };
    } | null;
}

export default function ConfirmationStep({ registration }: ConfirmationStepProps) {
    const [copied, setCopied] = useState(false);
    const [copiedCola, setCopiedCola] = useState(false);

    if (!registration) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Carregando dados da inscrição...</Typography>
            </Box>
        );
    }

    const { evento, inscricaoId, status } = registration;

    // Se a inscrição estiver no CADASTRO DE RESERVA (Lista de Espera)
    if (status === 'reserva') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
                <Typography variant="h4" fontWeight="bold" color="warning.dark" gutterBottom>
                    Cadastro de Reserva Registrado!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                    As vagas principais para o evento <strong>{evento.nome}</strong> já foram preenchidas. Sua inscrição foi registrada com sucesso na <strong>Lista de Espera / Cadastro de Reserva</strong>.
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, width: '100%', bgcolor: '#fff8e1', mt: 2, borderRadius: 3, borderColor: '#ffe082' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Número da sua Inscrição na Reserva:
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="warning.dark" sx={{ mt: 0.5, mb: 1 }}>
                        #{inscricaoId}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.primary" fontWeight="500">
                        📋 Como funciona o Cadastro de Reserva?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Havendo alguma desistência ou abertura de novas vagas pela organização, a equipe entrará em contato para promover sua vaga e orientar sobre o pagamento (caso o evento seja pago).
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Se o evento for GRATUITO, confirmação imediata sem PIX
    if (!evento.is_paid) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    Inscrição Realizada!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Parabéns! Sua inscrição para o evento <strong>{evento.nome}</strong> foi enviada com sucesso!
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, width: '100%', bgcolor: '#fbfbfb', mt: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Número da Inscrição:
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                        #{inscricaoId}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                        Sua inscrição foi confirmada automaticamente. Nos vemos lá!
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Gerar payload PIX dinamicamente usando Strategy
    const txId = `BPD${inscricaoId}`;
    const paymentStrategy = getPaymentStrategy('pix');
    const paymentPayload = paymentStrategy.generatePayload({
        pixKey: evento.pix_key || '',
        pixKeyType: evento.pix_key_type || '',
        merchantName: evento.merchant_name || 'PAROQUIA BOM PASTOR',
        merchantCity: evento.merchant_city || 'PALMAS',
        amount: evento.event_price || 0,
        txId,
    });

    const handleCopyPix = () => {
        navigator.clipboard.writeText(evento.pix_key || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyPixCola = () => {
        navigator.clipboard.writeText(paymentPayload.copiaECola);
        setCopiedCola(true);
        setTimeout(() => setCopiedCola(false), 2000);
    };

    const whatsappContato = '(63) 98405-5758';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                    Pré-inscrição Realizada!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Para confirmar sua participação, efetue o pagamento do PIX abaixo.
                </Typography>
            </Box>

            {/* Número da Inscrição */}
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                Inscrição Nº #{inscricaoId}
            </Typography>

            {/* Valor da Inscrição */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    bgcolor: 'primary.50',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Valor da Inscrição
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                    R$ {paymentPayload.displayData.valor}
                </Typography>
            </Paper>

            {/* Informações PIX */}
            <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Pague com PIX
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Tipo de Chave:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {paymentPayload.displayData.chaveTipo}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Beneficiário:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {paymentPayload.displayData.beneficiario}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{
                                flex: 1,
                                fontFamily: 'monospace',
                                py: 1,
                                px: 2,
                                bgcolor: 'grey.100',
                                borderRadius: 1,
                                overflowX: 'auto',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {paymentPayload.displayData.chave}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<ContentCopy />}
                            onClick={handleCopyPix}
                            color={copied ? 'success' : 'primary'}
                        >
                            {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                    </Box>
                </Paper>

                {/* QR Code PIX */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 2,
                        textAlign: 'center',
                        bgcolor: 'white',
                    }}
                >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        📱 Escaneie o QR Code
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        Abra o app do seu banco e escaneie o código abaixo
                    </Typography>
                    <Box
                        sx={{
                            display: 'inline-block',
                            p: 2,
                            bgcolor: 'white',
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: 'primary.main',
                        }}
                    >
                        <QRCodeSVG
                            value={paymentPayload.copiaECola}
                            size={200}
                            level="M"
                            includeMargin={false}
                        />
                    </Box>
                </Paper>

                {/* PIX Copia e Cola */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        PIX Copia e Cola
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Use este código no seu aplicativo de banco (opção "PIX Copia e Cola")
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography
                            variant="caption"
                            sx={{
                                flex: 1,
                                fontFamily: 'monospace',
                                py: 1.5,
                                px: 2,
                                bgcolor: 'white',
                                border: '1px solid',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                wordBreak: 'break-all',
                                maxHeight: '80px',
                                overflow: 'auto',
                            }}
                        >
                            {paymentPayload.copiaECola}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<ContentCopy />}
                            onClick={handleCopyPixCola}
                            color={copiedCola ? 'success' : 'primary'}
                        >
                            {copiedCola ? 'Copiado!' : 'Copiar'}
                        </Button>
                    </Box>
                </Paper>

                {/* Envio de Comprovante */}
                <Alert severity="warning" sx={{
                    border: '2px solid',
                    borderColor: 'warning.main',
                    bgcolor: '#FFF3E0',
                }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        ⚠️ Importante: Enviar Comprovante
                    </Typography>
                    <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                        Após realizar o pagamento, envie o comprovante via WhatsApp para:
                    </Typography>
                    <Box
                        sx={{
                            display: 'inline-block',
                            p: 2,
                            bgcolor: 'white',
                            borderRadius: 2,
                            border: '3px solid #FF5722',
                            boxShadow: '0 0 0 4px rgba(255, 87, 34, 0.2)',
                        }}
                    >
                        <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                                color: '#D32F2F',
                                fontFamily: 'monospace',
                            }}
                        >
                            {whatsappContato}
                        </Typography>
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Sua inscrição será confirmada após a verificação do pagamento pela organização.
                    </Typography>
                </Alert>
            </Box>

            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                Guarde o número da sua inscrição e faça o envio do comprovante. Nos vemos no encontro!
            </Typography>
        </Box>
    );
}
