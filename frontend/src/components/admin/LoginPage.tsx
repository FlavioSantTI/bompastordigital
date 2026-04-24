import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    CircularProgress,
    Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, CalendarToday } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import { useAuth } from '../../contexts/AuthContext';
import { APP_VERSION } from '../../types';

export default function LoginPage() {
    const { user, role, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

    useEffect(() => {
        // Se está na página de login sem estar autenticado, 
        // limpar qualquer sessão local corrompida que possa causar loops
        if (!authLoading && !user) {
            console.log('[Login] Nenhum usuário autenticado. Tela de login pronta.');
        }
        
        // Só redireciona se não estiver carregando, se houver usuário E se o role já tiver sido resolvido
        if (!authLoading && user && role) {
            console.log('[Login] Sessão ativa detectada, redirecionando conforme cargo:', role, '- Email:', user.email);
            if (role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/inscricao', { replace: true });
            }
        }
    }, [user, role, authLoading, navigate]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('[Login] Tentando login para:', email);
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            console.log('[Login] Login realizado com sucesso. User ID:', data.user?.id, 'Role:', data.user?.user_metadata?.role);
            // O redirecionamento será feito pelo useEffect ao detectar o user no AuthContext

        } catch (err: any) {
            console.error('[Login] Erro detalhado no login:', err);

            // Tratamento humanizado de erros
            let errorMsg = 'Falha ao entrar. Tente novamente mais tarde.';

            if (!err) {
                errorMsg = 'Erro desconhecido ao tentar logar.';
            } else if (err.message?.includes('Email not confirmed')) {
                errorMsg = 'Sua conta ainda não foi ativada. Verifique seu e-mail.';
            } else if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid_credentials')) {
                errorMsg = 'E-mail ou senha incorretos. Verifique seus dados.';
            } else if (err.message?.includes('missing email or phone')) {
                errorMsg = 'Por favor, preencha o e-mail e a senha.';
            } else if (err.message?.includes('Refresh Token') || err.message?.includes('refresh_token')) {
                errorMsg = 'Sessão anterior expirada. Tente fazer login novamente.';
                // Limpar sessão local corrompida
                supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            } else if (err.message?.includes('fetch') || err.message?.includes('network') || err.name === 'TypeError') {
                errorMsg = 'Erro de conexão. Verifique sua internet e tente novamente.';
            } else if (typeof err.message === 'string') {
                errorMsg = err.message;
            }

            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 2
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    maxWidth: 380,
                    width: '100%',
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center'
                }}
            >
                {/* Logo Compacto */}
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                        component="img"
                        src="/img/logo.jpg"
                        alt="Logo Bom Pastor"
                        sx={{
                            width: 80,
                            height: 80,
                            objectFit: 'contain',
                            mb: 1
                        }}
                    />
                    <Typography variant="h6" color="primary" sx={{ 
                        fontFamily: '"Playfair Display", serif', 
                        fontWeight: 700,
                        lineHeight: 1.2
                    }}>
                        BOM PASTOR DIGITAL
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Gestão de Eventos Pastorais
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2, py: 0 }}>{error}</Alert>}

                <form onSubmit={handleLogin}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Email"
                        variant="outlined"
                        margin="dense"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        margin="dense"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                        <Typography
                            variant="caption"
                            color="primary"
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => setForgotPasswordOpen(true)}
                        >
                            Esqueci minha senha
                        </Typography>
                    </Box>

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="medium"
                        disabled={loading}
                        sx={{ mt: 2, py: 1, fontWeight: 'bold' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'ENTRAR'}
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={() => navigate('/central')}
                        sx={{ 
                            mt: 1.5, 
                            py: 0.8, 
                            textTransform: 'none', 
                            borderStyle: 'dashed',
                            fontWeight: 'bold',
                            color: '#FF921C',
                            borderColor: '#FF921C',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(255, 146, 28, 0.2)',
                                borderColor: '#ECA427',
                                bgcolor: 'rgba(255, 146, 28, 0.05)',
                                color: '#ECA427'
                            },
                            '&:active': {
                                transform: 'scale(0.98)'
                            }
                        }}
                    >
                        Portal do Participante
                    </Button>

                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                        <Typography variant="caption" color="text.secondary">
                            Ainda não tem uma conta?
                        </Typography>
                        <Box>
                            <Button
                                size="small"
                                color="secondary"
                                sx={{ mt: 0, fontWeight: 'bold' }}
                                onClick={() => navigate('/register')}
                            >
                                CRIAR NOVA CONTA
                            </Button>
                        </Box>
                    </Box>
                </form>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        <strong>© 2026 Bom Pastor Digital</strong> • <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Versão {APP_VERSION}</span>
                    </Typography>
                </Box>
            </Paper>

            <ForgotPasswordDialog
                open={forgotPasswordOpen}
                onClose={() => setForgotPasswordOpen(false)}
            />
        </Box>
    );
}
