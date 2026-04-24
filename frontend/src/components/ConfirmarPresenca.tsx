import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    CircularProgress, 
    Alert,
    Stack,
    Fade
} from '@mui/material';
import { CheckCircle, ErrorOutline, Fingerprint, QrCode } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function ConfirmarPresenca() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const codigoSessao = searchParams.get('codigo');

    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [sessaoInfo, setSessaoInfo] = useState<any>(null);

    useEffect(() => {
        if (codigoSessao) {
            // Decodificar info básica do código (PRESENCA_20260425_MANHA)
            const partes = codigoSessao.split('_');
            if (partes.length >= 3) {
                setSessaoInfo({
                    data: partes[1].replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'),
                    turno: partes[2]
                });
            }
        }
    }, [codigoSessao]);

    const handleConfirmar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cpf || !codigoSessao) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            // 1. Buscar a pessoa pelo CPF
            const { data: pessoa, error: pessoaError } = await supabase
                .from('pessoas')
                .select('id, nome')
                .eq('cpf', cpf.replace(/\D/g, ''))
                .single();

            if (pessoaError || !pessoa) {
                throw new Error('Participante não encontrado com este CPF. Verifique se digitou corretamente.');
            }

            // 2. Buscar a inscrição ativa para esta pessoa
            // (Assumindo que o participante deve estar inscrito em algum evento ativo)
            const { data: inscricao, error: inscError } = await supabase
                .from('inscricoes')
                .select('id, evento_id')
                .or(`esposo_id.eq.${pessoa.id},esposa_id.eq.${pessoa.id}`)
                .limit(1)
                .single();

            if (inscError || !inscricao) {
                throw new Error('Não encontramos uma inscrição ativa para este CPF.');
            }

            // 3. Registrar a presença na tabela presencas_eventos
            const { error: presencaError } = await supabase
                .from('presencas_eventos')
                .insert([{
                    pessoa_id: pessoa.id,
                    inscricao_id: inscricao.id,
                    evento_id: inscricao.evento_id,
                    turno: sessaoInfo.turno,
                    data_evento: codigoSessao.split('_')[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    metodo: 'WEB_QRCODE'
                }]);

            if (presencaError) {
                if (presencaError.code === '23505') {
                    throw new Error('Sua presença já foi registrada para este turno!');
                }
                throw presencaError;
            }

            setStatus('success');
            setMessage(`Presença confirmada com sucesso, ${pessoa.nome.split(' ')[0]}!`);
            
        } catch (err: any) {
            console.error('Erro ao confirmar presença:', err);
            setStatus('error');
            setMessage(err.message || 'Erro ao processar sua presença. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!codigoSessao) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>QR Code Inválido</Typography>
                <Typography color="text.secondary">Por favor, escaneie novamente o código exibido pela organização.</Typography>
                <Button onClick={() => navigate('/landing')} sx={{ mt: 4 }}>Voltar para o Início</Button>
            </Container>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', py: { xs: 4, md: 8 } }}>
            <Container maxWidth="sm">
                <Fade in={true} timeout={800}>
                    <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center', border: '1px solid #e0e0e0' }}>
                        <QrCode color="primary" sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontFamily: '"Playfair Display", serif' }}>
                            Validar Presença
                        </Typography>
                        
                        {sessaoInfo && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                Sessão: <strong>{sessaoInfo.data}</strong> — Turno: <strong>{sessaoInfo.turno}</strong>
                            </Typography>
                        )}

                        {status === 'success' ? (
                            <Stack spacing={3} alignItems="center">
                                <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
                                <Typography variant="h5" color="success.main" fontWeight="bold">{message}</Typography>
                                <Typography color="text.secondary">Você já pode fechar esta página.</Typography>
                                <Button variant="outlined" onClick={() => window.location.reload()}>Fazer novo registro</Button>
                            </Stack>
                        ) : (
                            <form onSubmit={handleConfirmar}>
                                <Stack spacing={3}>
                                    {status === 'error' && (
                                        <Alert severity="error" sx={{ borderRadius: 2, textAlign: 'left' }}>{message}</Alert>
                                    )}

                                    <Typography variant="body1" textAlign="left" color="text.secondary">
                                        Digite seu CPF para confirmar sua chegada:
                                    </Typography>

                                    <TextField
                                        label="CPF"
                                        variant="outlined"
                                        fullWidth
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value)}
                                        placeholder="000.000.000-00"
                                        InputProps={{
                                            startAdornment: <Fingerprint sx={{ mr: 1, color: 'action.active' }} />,
                                        }}
                                        disabled={loading}
                                        required
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={loading || !cpf}
                                        sx={{ 
                                            py: 2, 
                                            borderRadius: 2, 
                                            fontWeight: 'bold',
                                            bgcolor: '#1e3a5f',
                                            '&:hover': { bgcolor: '#162b46' }
                                        }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Presença'}
                                    </Button>
                                    
                                    <Typography variant="caption" color="text.secondary">
                                        Bom Pastor Digital • Validação Segura
                                    </Typography>
                                </Stack>
                            </form>
                        )}
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}
