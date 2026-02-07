import { useState } from 'react';
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
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordDialog from './ForgotPasswordDialog';

export default function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error; // Lança para o catch

            if (data.session) {
                // Forçar refresh do usuário para garantir roles atualizadas
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const role = user.user_metadata?.role;
                    if (role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/inscricao');
                    }
                }
            }
        } catch (error: any) {
            console.error('Erro detalhado:', error);

            // Tratamento humanizado de erros
            let errorMsg = 'Falha ao entrar. Tente novamente mais tarde.';

            if (error.message?.includes('Email not confirmed')) {
                errorMsg = 'Sua conta ainda não foi ativada. Por favor, verifique sua caixa de entrada (e spam) e clique no link de confirmação enviado.';
            } else if (error.message?.includes('Invalid login credentials')) {
                errorMsg = 'Email ou senha incorretos. Verifique seus dados.';
            } else if (error.message) {
                errorMsg = error.message; // Erros menos comuns (rate limit, etc)
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
                    maxWidth: 400,
                    width: '100%',
                    p: 4,
                    borderRadius: 4,
                    textAlign: 'center'
                }}
            >
                {/* Logo Placeholder (Simulando o Design enviado) */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Aqui entraria a imagem real: <img src="/logo.png" width={120} /> */}
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1E3A5F 50%, #6B9AC4 50%)',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '2rem',
                            fontFamily: '"Playfair Display", serif'
                        }}
                    >
                        BP
                    </Box>
                    <Typography variant="h5" color="primary" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>
                        BOM PASTOR DIGITAL
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gestão de Eventos Pastorais
                    </Typography>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                    Acesse sua Conta
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handleLogin}>
                    <TextField
                        fullWidth
                        label="Email"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Typography
                            variant="body2"
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
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'ENTRAR'}
                    </Button>

                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary">
                            Ainda não tem uma conta?
                        </Typography>
                        <Button
                            color="secondary"
                            sx={{ mt: 0.5, fontWeight: 'bold' }}
                            onClick={() => navigate('/register')}
                        >
                            CRIAR NOVA CONTA
                        </Button>
                    </Box>
                </form>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                        © 2026 Bom Pastor Digital
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
