/**
 * SalasDialog — Gerenciamento de salas de um evento
 * Módulo Cronograma v4.0
 */
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Alert,
    Divider,
    CircularProgress,
} from '@mui/material';
import { Edit, Delete, Add, Save, Close } from '@mui/icons-material';
import type { Sala } from '../../types';
import {
    fetchSalasByEvento,
    createSala,
    updateSala,
    deleteSala,
} from '../../services/cronogramaService';

interface SalasDialogProps {
    open: boolean;
    onClose: () => void;
    eventoId: number;
    eventoNome: string;
    onSalasChanged: () => void;
}

export default function SalasDialog({
    open,
    onClose,
    eventoId,
    eventoNome,
    onSalasChanged,
}: SalasDialogProps) {
    const [salas, setSalas] = useState<Sala[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formNome, setFormNome] = useState('');
    const [formCapacidade, setFormCapacidade] = useState('');
    const [formOrdem, setFormOrdem] = useState('0');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (open && eventoId) {
            loadSalas();
        }
    }, [open, eventoId]);

    const loadSalas = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchSalasByEvento(eventoId);
            setSalas(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormNome('');
        setFormCapacidade('');
        setFormOrdem('0');
        setShowForm(false);
    };

    const handleEdit = (sala: Sala) => {
        setEditingId(sala.id);
        setFormNome(sala.nome);
        setFormCapacidade(sala.capacidade?.toString() || '');
        setFormOrdem(sala.ordem.toString());
        setShowForm(true);
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!formNome.trim()) {
            setError('Nome da sala é obrigatório.');
            return;
        }

        try {
            if (editingId) {
                await updateSala(editingId, {
                    nome: formNome.trim(),
                    capacidade: formCapacidade ? parseInt(formCapacidade) : null,
                    ordem: parseInt(formOrdem) || 0,
                });
                setSuccess('Sala atualizada!');
            } else {
                await createSala({
                    evento_id: eventoId,
                    nome: formNome.trim(),
                    capacidade: formCapacidade ? parseInt(formCapacidade) : null,
                    ordem: parseInt(formOrdem) || 0,
                });
                setSuccess('Sala criada!');
            }

            resetForm();
            await loadSalas();
            onSalasChanged();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (sala: Sala) => {
        if (!confirm(`Excluir a sala "${sala.nome}"? Todas as atividades nesta sala serão excluídas.`)) {
            return;
        }

        setError('');
        try {
            await deleteSala(sala.id);
            setSuccess('Sala excluída!');
            await loadSalas();
            onSalasChanged();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleClose = () => {
        resetForm();
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Gerenciar Salas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {eventoNome}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {/* Formulário de criação/edição */}
                {showForm ? (
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: 'grey.50',
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                            {editingId ? 'Editar Sala' : 'Nova Sala'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                                label="Nome da Sala"
                                size="small"
                                fullWidth
                                required
                                value={formNome}
                                onChange={(e) => setFormNome(e.target.value)}
                                placeholder="Ex: Auditório Principal"
                                autoFocus
                            />
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <TextField
                                    label="Capacidade"
                                    size="small"
                                    type="number"
                                    value={formCapacidade}
                                    onChange={(e) => setFormCapacidade(e.target.value)}
                                    placeholder="Opcional"
                                    inputProps={{ min: 1 }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Ordem"
                                    size="small"
                                    type="number"
                                    value={formOrdem}
                                    onChange={(e) => setFormOrdem(e.target.value)}
                                    helperText="Posição na grade"
                                    inputProps={{ min: 0 }}
                                    sx={{ flex: 1 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button size="small" onClick={resetForm}>
                                    Cancelar
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSubmit}
                                >
                                    {editingId ? 'Salvar' : 'Criar'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Button
                        startIcon={<Add />}
                        variant="outlined"
                        size="small"
                        onClick={() => setShowForm(true)}
                        sx={{ mb: 2 }}
                    >
                        Nova Sala
                    </Button>
                )}

                <Divider sx={{ mb: 1 }} />

                {/* Lista de salas */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : salas.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', py: 3 }}
                    >
                        Nenhuma sala cadastrada para este evento.
                    </Typography>
                ) : (
                    <List dense>
                        {salas.map((sala) => (
                            <ListItem
                                key={sala.id}
                                sx={{
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <ListItemText
                                    primary={sala.nome}
                                    secondary={
                                        [
                                            sala.capacidade ? `${sala.capacidade} lugares` : null,
                                            `Ordem: ${sala.ordem}`,
                                        ]
                                            .filter(Boolean)
                                            .join(' • ')
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleEdit(sala)}
                                        color="primary"
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleDelete(sala)}
                                        color="error"
                                        sx={{ ml: 0.5 }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>

            <DialogActions>
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, pl: 2 }}>
                    {salas.length} sala{salas.length !== 1 ? 's' : ''} cadastrada{salas.length !== 1 ? 's' : ''}
                </Typography>
                <Button onClick={handleClose}>
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
