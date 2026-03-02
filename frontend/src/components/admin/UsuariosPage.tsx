import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, IconButton,
    Chip, Tooltip, CircularProgress, Alert, TextField, InputAdornment
} from '@mui/material';
import { Edit, Delete, PersonAdd, Replay, Search } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import ManageUserDialog from './ManageUserDialog';

interface SafeUser {
    id: string;
    email: string;
    role: string;
    nome: string;
    created_at: string;
    last_sign_in_at: string | null;
}

export default function UsuariosPage() {
    const [users, setUsers] = useState<SafeUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error: rpcError } = await supabase.rpc('get_admin_users' as any);

            if (rpcError) {
                // Se a RPC falhar ou não existir, lança
                throw rpcError;
            }

            // O Supabase retorna any do RPC, forçamos o casting pro nosso tipo
            setUsers((data as unknown as SafeUser[]) || []);
        } catch (err: any) {
            console.error('Erro ao carregar usuários:', err.message);
            setError('Não foi possível carregar a lista de usuários. Talvez as permissões de banco não estejam configuradas ainda.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEdit = (user: SafeUser) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleDelete = async (user: SafeUser) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR o usuário ${user.email}? Esta ação é irreversível.`)) return;

        try {
            // Chamamos a Edge Function para deletar o usuário
            const { data, error } = await supabase.functions.invoke('admin-users', {
                body: { action: 'deleteUser', payload: { uid: user.id } }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            loadUsers();
        } catch (err: any) {
            console.error('Erro ao deletar:', err);
            alert('Falha ao excluir usuário: ' + err.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" color="primary" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
                    Gerenciar Usuários
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar e-mail ou nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Replay />}
                        onClick={loadUsers}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleCreate}
                    >
                        Novo Usuário
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Usuário (Nome e E-mail)</strong></TableCell>
                            <TableCell><strong>Nível (Role)</strong></TableCell>
                            <TableCell><strong>Criado em</strong></TableCell>
                            <TableCell><strong>Último Login</strong></TableCell>
                            <TableCell align="right"><strong>Ações</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                            {user.id.substring(0, 8)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="500">{user.nome || '-'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                                            color={user.role === 'admin' ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{new Date(user.created_at).toLocaleDateString('pt-BR')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca acessou'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar Usuário e Permissões">
                                            <IconButton onClick={() => handleEdit(user)} color="primary" size="small">
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Deletar Usuário">
                                            <IconButton onClick={() => handleDelete(user)} color="error" size="small">
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {dialogOpen && (
                <ManageUserDialog
                    open={dialogOpen}
                    user={selectedUser}
                    onClose={() => setDialogOpen(false)}
                    onSave={loadUsers}
                />
            )}
        </Box>
    );
}
