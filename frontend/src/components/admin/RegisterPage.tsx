import { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { validateStrongPassword } from '../../utils/passwordUtils';

export default function RegisterPage() {

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: 'As senhas não conferem.' });
            setLoading(false);
            return;
        }

        const passValidation = validateStrongPassword(password);
        if (!passValidation.isValid) {
            setMsg({ type: 'error', text: passValidation.message || 'Senha inválida.' });
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
                setMsg({
                    type: 'success',
                    text: 'Cadastro realizado com sucesso! Você já pode fazer login na plataforma.'
                });
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
                            fullWidth label="Senha" type={showPassword ? 'text' : 'password'} variant="outlined" margin="normal"
                            value={password} onChange={(e) => setPassword(e.target.value)} required
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                            }}
                        />
                        <TextField
                            fullWidth label="Confirmar Senha" type={showConfirmPassword ? 'text' : 'password'} variant="outlined" margin="normal"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                            }}
                        />

                        {/* Quadro de Regras de Senha harmonizado */}
                        <Box sx={{ p: 2, my: 2, bgcolor: '#f0f4f8', textAlign: 'left', borderRadius: 3, border: '1px solid #d0dbe5' }}>
                            <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, fontSize: '0.8rem' }}>
                                🔒 Requisitos obrigatórios da senha:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    📏 <strong>Comprimento:</strong> Mínimo de 10 caracteres
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    🔤 <strong>Letras:</strong> Ao menos uma letra (maiúscula/minúscula)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    🔢 <strong>Números:</strong> Ao menos um número (0-9)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    🔣 <strong>Símbolos:</strong> Ao menos um caractere especial (@, #, $, !, *, &)
                                </Typography>
                            </Box>
                        </Box>

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
