import { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Alert, CircularProgress
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function RegisterPage() {

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
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
            // Cria usuário com metadado role: 'user'
            // O redirecionamento garante que, após clicar no email, ele vá para a tela de login nova.
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { role: 'user' }, // Define como usuário comum (casal)
                    emailRedirectTo: window.location.origin + '/login'
                }
            });

            if (error) throw error;

            if (data.user) {
                // Se a confirmação de email estiver ativa, o user é criado mas session é null (ou user.identities vazio)
                // Vamos assumir o pior caso: precisa confirmar.
                setMsg({
                    type: 'success',
                    text: 'Cadastro realizado! Verifique sua caixa de entrada (e spam) para confirmar seu email antes de entrar.'
                });

                // Não redirecionamos imediatamente para dar tempo de ler o aviso
            }
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes('already registered')) {
                setMsg({ type: 'error', text: 'Este email já possui cadastro. Tente fazer login ou recuperar a senha.' });
            } else {
                setMsg({ type: 'error', text: err.message || 'Erro ao cadastrar.' });
            }
            setLoading(false); // Garante que loading pare no erro
        } finally {
            if (!msg?.type) setLoading(false); // Se deu sucesso, mantemos loading visualmente limpo ou tratamos no if data.user
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
            <Paper elevation={3} sx={{ maxWidth: 400, width: '100%', p: 4, borderRadius: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="primary" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 1 }}>
                    Criar Conta
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Bom Pastor Digital
                </Typography>

                {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}

                {!msg?.text.includes('sucesso') && (
                    <form onSubmit={handleRegister}>
                        <TextField
                            fullWidth label="Email" type="email" variant="outlined" margin="normal"
                            value={email} onChange={(e) => setEmail(e.target.value)} required
                        />
                        <TextField
                            fullWidth label="Senha" type="password" variant="outlined" margin="normal"
                            value={password} onChange={(e) => setPassword(e.target.value)} required
                        />
                        <TextField
                            fullWidth label="Confirmar Senha" type="password" variant="outlined" margin="normal"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                        />

                        <Button
                            fullWidth type="submit" variant="contained" size="large"
                            disabled={loading} sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'CADASTRAR'}
                        </Button>
                    </form>
                )}

                <Box sx={{ mt: 2 }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Typography variant="body2" color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                            Já tem uma conta? Entrar
                        </Typography>
                    </Link>
                </Box>
            </Paper>
        </Box>
    );
}
