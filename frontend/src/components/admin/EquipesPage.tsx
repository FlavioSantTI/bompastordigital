import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Tooltip,
    Badge,
} from '@mui/material';
import { Add, Edit, Delete, Groups, Person, Assignment } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { fetchEquipes, deleteEquipe } from '../../services/equipeService';
import EquipeDialog from './EquipeDialog';

interface Evento {
    id: number;
    nome: string;
}

export default function EquipesPage() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [eventoSelecionado, setEventoSelecionado] = useState<number>(0);
    const [equipes, setEquipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingEquipeId, setEditingEquipeId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    useEffect(() => {
        carregarEventos();
    }, []);

    useEffect(() => {
        if (eventoSelecionado > 0) {
            carregarEquipes();
        } else {
            setEquipes([]);
        }
    }, [eventoSelecionado]);

    const carregarEventos = async () => {
        const { data } = await supabase
            .from('eventos')
            .select('id, nome')
            .order('data_inicio', { ascending: false });
        setEventos(data || []);
    };

    const carregarEquipes = async () => {
        if (eventoSelecionado <= 0) return;
        setLoading(true);
        setError('');
        try {
            const data = await fetchEquipes(eventoSelecionado);
            setEquipes(data);
        } catch (err: any) {
            setError('Erro ao carregar equipes: ' + (err?.message || 'Erro desconhecido'));
        }
        setLoading(false);
    };

    const handleNovaEquipe = () => {
        setEditingEquipeId(null);
        setOpenDialog(true);
    };

    const handleEditarEquipe = (equipeId: number) => {
        setEditingEquipeId(equipeId);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEquipeId(null);
    };

    const handleSaveSuccess = () => {
        setSuccess(editingEquipeId ? 'Equipe atualizada com sucesso!' : 'Equipe criada com sucesso!');
        handleCloseDialog();
        carregarEquipes();
    };

    const handleDeleteRequest = (equipe: any) => {
        setDeleteTarget(equipe);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setLoadingDelete(true);
        try {
            await deleteEquipe(deleteTarget.id);
            setSuccess('Equipe excluída com sucesso!');
            carregarEquipes();
        } catch (err: any) {
            setError('Erro ao excluir equipe: ' + (err?.message || 'Erro desconhecido'));
        }
        setLoadingDelete(false);
        setDeleteTarget(null);
    };

    // Helpers
    const getChefe = (equipe: any) => {
        return equipe.equipe_membros?.find((m: any) => m.cargo?.nivel === 1);
    };

    const getSubchefe = (equipe: any) => {
        return equipe.equipe_membros?.find((m: any) => m.cargo?.nivel === 2);
    };

    const getTotalMembros = (equipe: any) => {
        return equipe.equipe_membros?.length || 0;
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                    <Groups sx={{ mr: 1, verticalAlign: 'middle', fontSize: 32 }} />
                    Gerenciar Equipes
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        select
                        size="small"
                        label="Selecionar Evento"
                        value={eventoSelecionado}
                        onChange={(e) => setEventoSelecionado(Number(e.target.value))}
                        sx={{ minWidth: 280 }}
                    >
                        <MenuItem value={0}>-- Selecione um Evento --</MenuItem>
                        {eventos.map((evento) => (
                            <MenuItem key={evento.id} value={evento.id}>
                                {evento.nome}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleNovaEquipe}
                        disabled={eventoSelecionado <= 0}
                        sx={{ whiteSpace: 'nowrap', px: 3 }}
                    >
                        Nova Equipe
                    </Button>
                </Box>
            </Box>

            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Conteúdo */}
            {eventoSelecionado <= 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                    <Groups sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Selecione um evento para gerenciar suas equipes
                    </Typography>
                </Box>
            ) : loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : equipes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                    <Groups sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Nenhuma equipe cadastrada para este evento
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Clique em "Nova Equipe" para começar
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {equipes.map((equipe) => {
                        const chefe = getChefe(equipe);
                        const subchefe = getSubchefe(equipe);
                        const totalMembros = getTotalMembros(equipe);

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={equipe.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderLeft: `5px solid ${equipe.cor || '#1E3A5F'}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        {/* Nome e badge */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: equipe.cor || 'primary.main' }}>
                                                {equipe.nome}
                                            </Typography>
                                            <Tooltip title={`${totalMembros} membro${totalMembros !== 1 ? 's' : ''}`}>
                                                <Badge badgeContent={totalMembros} color="primary">
                                                    <Person />
                                                </Badge>
                                            </Tooltip>
                                        </Box>

                                        {/* Descrição */}
                                        {equipe.descricao && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {equipe.descricao}
                                            </Typography>
                                        )}

                                        {/* Chefe */}
                                        {chefe && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Chip
                                                    label="Chefe"
                                                    size="small"
                                                    color="primary"
                                                    sx={{ fontWeight: 'bold', minWidth: 70 }}
                                                />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {chefe.pessoa?.nome || '—'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Subchefe */}
                                        {subchefe && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Chip
                                                    label="Subchefe"
                                                    size="small"
                                                    color="secondary"
                                                    sx={{ fontWeight: 'bold', minWidth: 70 }}
                                                />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {subchefe.pessoa?.nome || '—'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Contador de componentes */}
                                        {totalMembros > (chefe ? 1 : 0) + (subchefe ? 1 : 0) && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                + {totalMembros - (chefe ? 1 : 0) - (subchefe ? 1 : 0)} componente(s)
                                            </Typography>
                                        )}
                                    </CardContent>

                                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                        <Tooltip title="Editar equipe">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEditarEquipe(equipe.id)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir equipe">
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteRequest(equipe)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    ⚠️ Confirmar Exclusão
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir a equipe{' '}
                        <strong>"{deleteTarget?.nome}"</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Todos os membros e tarefas vinculados serão removidos. Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={loadingDelete}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirm}
                        disabled={loadingDelete}
                        startIcon={loadingDelete ? <CircularProgress size={16} /> : <Delete />}
                    >
                        {loadingDelete ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Criar/Editar Equipe */}
            <EquipeDialog
                open={openDialog}
                equipeId={editingEquipeId}
                eventoId={eventoSelecionado}
                onClose={handleCloseDialog}
                onSave={handleSaveSuccess}
            />
        </Box>
    );
}
