import { Box, Typography, Paper, Button, Alert, Divider } from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PIX_CONFIG } from '../../types';

export default function ConfirmationStep() {
    const [copied, setCopied] = useState(false);
    const [copiedCola, setCopiedCola] = useState(false);

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_CONFIG.chave);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyPixCola = () => {
        navigator.clipboard.writeText(PIX_CONFIG.pixCopiaCola);
        setCopiedCola(true);
        setTimeout(() => setCopiedCola(false), 2000);
    };

    // TODO: Buscar valor do evento selecionado
    const valorEvento = 100.00;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                    Inscrição Quase Concluída!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Falta apenas confirmar o pagamento
                </Typography>
            </Box>

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
                    width: '100%'
                }}
            >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Valor da Inscrição
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                    R$ {valorEvento.toFixed(2).replace('.', ',')}
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
                            {PIX_CONFIG.chaveTipo}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Beneficiário:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {PIX_CONFIG.beneficiario}
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
                                borderRadius: 1
                            }}
                        >
                            {PIX_CONFIG.chave}
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
                        bgcolor: 'white'
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
                            borderColor: 'primary.main'
                        }}
                    >
                        <QRCodeSVG
                            value={PIX_CONFIG.pixCopiaCola}
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
                                overflow: 'auto'
                            }}
                        >
                            {PIX_CONFIG.pixCopiaCola}
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
                    bgcolor: '#FFF3E0'
                }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        � Importante: Enviar Comprovante
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
                            boxShadow: '0 0 0 4px rgba(255, 87, 34, 0.2)'
                        }}
                    >
                        <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                                color: '#D32F2F',
                                fontFamily: 'monospace'
                            }}
                        >
                            {PIX_CONFIG.whatsappContato}
                        </Typography>
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Sua inscrição será confirmada após a verificação do pagamento.
                    </Typography>
                </Alert>
            </Box>

            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                Ao clicar em "Finalizar Inscrição" abaixo, seus dados serão salvos.
                <br />
                Não esqueça de realizar o pagamento e enviar o comprovante!
            </Typography>
        </Box>
    );
}
