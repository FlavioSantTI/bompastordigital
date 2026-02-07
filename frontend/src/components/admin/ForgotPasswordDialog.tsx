import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Alert
} from '@mui/material';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function ForgotPasswordDialog({ open, onClose }: ForgotPasswordDialogProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // O link de reset deve apontar para uma página capaz de lidar com a troca de senha
            // Por enquanto, vamos usar a URL base do site.
            // O fluxo completo exige uma página de /reset-password para onde o usuário é redirecionado.
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password',
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.'
            });
        } catch (error: any) {
            console.error('Erro ao solicitar reset:', error);
            // Por segurança, não confirmamos se o email existe ou não, mas aqui no erro genérico mostramos:
            setMessage({
                type: 'error',
                text: 'Ocorreu um erro ao tentar enviar o email. Tente novamente mais tarde.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setMessage(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleReset}>
                <DialogTitle>Recuperar Senha</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Digite seu e-mail abaixo para receber as instruções de recuperação de senha.
                    </DialogContentText>

                    {message && (
                        <Alert severity={message.type} sx={{ mb: 2 }}>
                            {message.text}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="E-mail cadastrado"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || (message?.type === 'success')}
                    />
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 2, p: 3 }}>
                    {message?.type !== 'success' && (
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            size="large"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar link por Email'}
                        </Button>
                    )}

                    <Button onClick={handleClose} disabled={loading} size="small" sx={{ mt: 1 }}>
                        Cancelar / Fechar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
