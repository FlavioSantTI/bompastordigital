import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Box, Paper, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function UpdatePasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Melhoria para suportar fluxo PKCE (sem hash na URL) e Implicit (com hash)
        // O Supabase client processa a URL automaticamente ao montar.

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Damos um pequeno delay pois o processamento do PKCE pode levar alguns ms
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (!retrySession) {
                        setMsg({ type: 'error', text: 'Link inválido ou expirado. Por favor, solicite a recuperação novamente.' });
                    }
                }, 1000);
            }
        };

        checkSession();

        // Escuta eventos de auth (como PASSWORD_RECOVERY)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setMsg(null); // Tudo certo, usuário autenticado para trocar senha
            }
            if (event === 'SIGNED_OUT') {
                setMsg({ type: 'error', text: 'Sessão encerrada. Solicite o link novamente.' });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: 'As senhas não conferem.' });
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMsg({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) throw error;

            setMsg({ type: 'success', text: 'Senha atualizada com sucesso! Você será redirecionado...' });

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error: any) {
            console.error(error);
            let errorMessage = error.message || 'Erro desconhecido.';

            // Traduções de erros comuns
            if (errorMessage.includes('New password should be different from the old password')) {
                errorMessage = 'A nova senha deve ser diferente da senha anterior.';
            } else if (errorMessage.includes('Password should be at least')) {
                errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            }

            setMsg({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
            <Paper elevation={3} sx={{ maxWidth: 400, width: '100%', p: 4, borderRadius: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="primary" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 1 }}>
                    Nova Senha
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Defina sua nova senha de acesso.
                </Typography>

                {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}

                <form onSubmit={handleUpdate}>
                    <TextField
                        fullWidth
                        label="Nova Senha"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

                    <TextField
                        fullWidth
                        label="Confirmar Nova Senha"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        margin="normal"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || !!(msg?.type === 'error' && msg.text.includes('Token'))}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'DEFINIR NOVA SENHA'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}
