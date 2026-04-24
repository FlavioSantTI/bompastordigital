import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Typography, CircularProgress, Container, Paper, Stack, Button, IconButton } from '@mui/material';
import { QrCode, Wifi, Refresh, ArrowBack } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function PresencaExibicao() {
    const navigate = useNavigate();
    const [log, setLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Busca inicial do QR Code mais recente
        fetchUltimoQRCode();

        // 2. Escuta mudanças em tempo real (Realtime)
        // Sempre que um novo log for inserido no admin, a TV atualiza sozinha
        const channel = supabase
            .channel('public:qrcode_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qrcode_logs' }, (payload) => {
                console.log('Novo QR Code detectado:', payload.new);
                setLog(payload.new);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchUltimoQRCode = async () => {
        try {
            const { data, error } = await supabase
                .from('qrcode_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setLog(data);
            }
        } catch (err) {
            console.error('Erro ao buscar QR Code:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e3a5f' }}>
                <CircularProgress sx={{ color: '#fff' }} />
            </Box>
        );
    }

    // URL formatada para o WhatsApp (como o n8n espera)
    const urlWhatsapp = log 
        ? `https://wa.me/${log.numero_whatsapp.replace(/\D/g, '')}?text=${log.codigo_gerado}`
        : '';

    return (
        <Box 
            sx={{ 
                height: '100vh', 
                bgcolor: '#FF921C', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'auto',
                color: '#fff',
                position: 'relative',
                background: 'radial-gradient(circle at center, #FF921C 0%, #ECA427 100%)'
            }}
        >
            {/* Elementos Decorativos de Fundo */}
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />
            <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />

            <Container maxWidth="xs">
                <Paper 
                    elevation={24} 
                    sx={{ 
                        p: { xs: 3, md: 4 }, 
                        borderRadius: 6, 
                        textAlign: 'center', 
                        bgcolor: '#fff',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
                    }}
                >
                    {!log ? (
                        <Stack spacing={2} alignItems="center" sx={{ color: '#666', py: 4 }}>
                            <QrCode sx={{ fontSize: 80, opacity: 0.2 }} />
                            <Typography variant="h5">Aguardando geração do QR Code...</Typography>
                            <Typography variant="body2">O administrador precisa gerar uma sessão no painel.</Typography>
                        </Stack>
                    ) : (
                        <Box>
                            <Box 
                                component="img" 
                                src="/img/logo.jpg" 
                                alt="Logo Bom Pastor" 
                                sx={{ 
                                    height: 50, 
                                    mb: 0.5, 
                                    borderRadius: '50%',
                                    border: '2px solid #eee'
                                }} 
                            />
                            <Typography variant="overline" sx={{ color: '#FF921C', fontWeight: 800, letterSpacing: 2, display: 'block', mb: 0, lineHeight: 1 }}>
                                REGISTRO DE PRESENÇA
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#ECA427', mb: 0, fontFamily: '"Playfair Display", serif', lineHeight: 1.1 }}>
                                Bom Pastor
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block', mt: 0.5 }}>
                                Escaneie com a câmera do seu celular
                            </Typography>

                            <Box sx={{ 
                                display: 'inline-block', 
                                p: 1, 
                                border: '1px solid #f0f0f0', 
                                borderRadius: 4,
                                bgcolor: '#fff',
                                mb: 1
                            }}>
                                <QRCodeSVG 
                                    value={urlWhatsapp} 
                                    size={280}
                                    level="Q"
                                    includeMargin={false}
                                />
                            </Box>

                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ color: '#FF921C', mt: 0.5 }}>
                                <Wifi sx={{ fontSize: 18 }} />
                                <Typography variant="button" sx={{ fontWeight: 800, letterSpacing: 1, fontSize: '0.8rem' }}>
                                    {log.codigo_gerado}
                                </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0, color: '#999', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                Turno: {log.turno} • {new Date(log.data_geracao).toLocaleDateString('pt-BR')}
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        <Button 
                            variant="contained" 
                            startIcon={<ArrowBack />}
                            size="small"
                            onClick={() => navigate('/central')}
                            sx={{ 
                                bgcolor: 'rgba(255,255,255,0.15)', 
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                borderRadius: 2,
                                fontWeight: 'bold',
                                px: 3
                            }}
                        >
                            Voltar
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<Refresh />}
                            size="small"
                            onClick={() => fetchUltimoQRCode()}
                            sx={{ 
                                bgcolor: '#fff', 
                                color: '#FF921C',
                                '&:hover': { bgcolor: '#f5f5f5' },
                                borderRadius: 2,
                                fontWeight: 'bold',
                                px: 3
                            }}
                        >
                            Atualizar
                        </Button>
                    </Stack>

                    <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1, display: 'block', opacity: 0.8, fontSize: '0.65rem' }}>
                        SISTEMA BOM PASTOR DIGITAL • ATUALIZADO EM TEMPO REAL
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
