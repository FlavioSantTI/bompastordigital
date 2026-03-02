import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Box, CircularProgress, Alert
} from '@mui/material';
import { supabase } from '../../lib/supabase';

interface SafeUser {
    id: string;
    email: string;
    role: string;
    nome: string;
    created_at: string;
    last_sign_in_at: string | null;
}

interface ManageUserDialogProps {
    open: boolean;
    user: SafeUser | null;
    onClose: () => void;
    onSave: () => void;
}

export default function ManageUserDialog({ open, user, onClose, onSave }: ManageUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [role, setRole] = useState('usuario');
    const [password, setPassword] = useState('');

    const isEditing = !!user;

    useEffect(() => {
        if (open) {
            if (user) {
                setEmail(user.email || '');
                setNome(user.nome || '');
                setRole(user.role || 'usuario');
                setPassword(''); // Senha vazia significa "não alterar" na edição
            } else {
                setEmail('');
                setNome('');
                setRole('usuario');
                setPassword('');
            }
            setError('');
        }
    }, [open, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEditing && !password) {
            setError('A senha é obrigatória para criar um novo usuário.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const action = isEditing ? 'updateUser' : 'createUser';
            const payload: any = {
                email,
                role,
                nome
            };

            if (isEditing) {
                payload.uid = user.id;
            }

            // Só envia senha se foi preenchida
            if (password) {
                payload.password = password;
            }

            // Invocamos a Edge Function
            const { data, error: funcError } = await supabase.functions.invoke('admin-users', {
                body: { action, payload }
            });

            if (funcError) throw funcError;
            if (data?.error) throw new Error(data.error);

            onSave();
            onClose();
        } catch (err: any) {
            console.error('Erro ao salvar usuário:', err);
            setError('Falha ao salvar usuário: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Nome Completo"
                            fullWidth
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />

                        <TextField
                            label="E-mail"
                            fullWidth
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <FormControl fullWidth required>
                            <InputLabel id="role-select-label">Nível de Acesso (Role)</InputLabel>
                            <Select
                                labelId="role-select-label"
                                value={role}
                                label="Nível de Acesso (Role)"
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <MenuItem value="usuario">Usuário Padrão (Sem acesso Root)</MenuItem>
                                <MenuItem value="admin">Administrador (Total Acesso)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label={isEditing ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
                            fullWidth
                            required={!isEditing}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            helperText={isEditing ? "Só preencha se quiser resetar a senha deste usuário." : "Mínimo 6 caracteres"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
