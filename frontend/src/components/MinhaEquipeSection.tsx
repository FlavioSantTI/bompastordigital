import { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, CircularProgress,
    List, ListItem, ListItemText, TextField, MenuItem, Button,
    IconButton, Alert, Divider,
} from '@mui/material';
import { Groups, Add, Delete, Edit } from '@mui/icons-material';
import { fetchPessoasPorEmail, fetchMinhasEquipes, createTarefa, updateTarefa, deleteTarefa } from '../services/equipeService';
import type { PrioridadeTarefa, StatusTarefa } from '../types';

interface Props {
    userEmail: string;
}

const PRIORIDADE_COLORS: Record<string, string> = {
    baixa: '#4caf50', media: '#ff9800', alta: '#f44336',
};
const STATUS_COLORS: Record<string, string> = {
    pendente: '#9e9e9e', em_andamento: '#2196f3', concluida: '#4caf50',
};
const STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente', em_andamento: 'Em Andamento', concluida: 'Concluída',
};
const PRIORIDADE_LABELS: Record<string, string> = {
    baixa: 'Baixa', media: 'Média', alta: 'Alta',
};

export default function MinhaEquipeSection({ userEmail }: Props) {
    const [equipes, setEquipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Nova tarefa form por equipe
    const [novaTarefaEquipeId, setNovaTarefaEquipeId] = useState<number | null>(null);
    const [novaTarefa, setNovaTarefa] = useState({ titulo: '', descricao: '', prioridade: 'media' as PrioridadeTarefa, data_limite: '' });
    const [editandoTarefaId, setEditandoTarefaId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ titulo: '', status: 'pendente' as StatusTarefa, prioridade: 'media' as PrioridadeTarefa, data_limite: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        carregarEquipes();
    }, [userEmail]);

    const carregarEquipes = async () => {
        setLoading(true);
        console.log('[MinhaEquipe] Buscando dados para:', userEmail);
        try {
            const pessoas = await fetchPessoasPorEmail(userEmail.toLowerCase().trim());
            const ids = pessoas.map(p => p.id);
            console.log('[MinhaEquipe] IDs de pessoas resolvidos:', ids);
            
            if (ids.length === 0) { 
                console.warn('[MinhaEquipe] Nenhuma pessoa vinculada ao e-mail:', userEmail);
                setEquipes([]); 
                setLoading(false); 
                return; 
            }
            
            const data = await fetchMinhasEquipes(ids);
            console.log('[MinhaEquipe] Equipes carregadas do banco:', data);
            setEquipes(data);
        } catch (err: any) {
            console.error('[MinhaEquipe] Erro:', err);
            setError('Erro ao carregar equipes: ' + (err?.message || ''));
        }
        setLoading(false);
    };

    const podeEditar = (equipe: any) => (equipe.meuCargoNivel || 99) <= 2;

    const handleCriarTarefa = async (equipeId: number) => {
        if (!novaTarefa.titulo.trim()) { setError('Título é obrigatório'); return; }
        setSaving(true);
        try {
            await createTarefa({
                equipe_id: equipeId,
                titulo: novaTarefa.titulo,
                descricao: novaTarefa.descricao || undefined,
                prioridade: novaTarefa.prioridade,
                data_limite: novaTarefa.data_limite || undefined,
            });
            setNovaTarefaEquipeId(null);
            setNovaTarefa({ titulo: '', descricao: '', prioridade: 'media', data_limite: '' });
            setSuccess('Tarefa criada!');
            carregarEquipes();
        } catch (err: any) {
            setError('Erro ao criar tarefa: ' + (err?.message || ''));
        }
        setSaving(false);
    };

    const handleEditarTarefa = async (tarefaId: number) => {
        setSaving(true);
        try {
            await updateTarefa(tarefaId, {
                titulo: editForm.titulo,
                status: editForm.status,
                prioridade: editForm.prioridade,
                data_limite: editForm.data_limite || null,
            });
            setEditandoTarefaId(null);
            setSuccess('Tarefa atualizada!');
            carregarEquipes();
        } catch (err: any) {
            setError('Erro ao atualizar: ' + (err?.message || ''));
        }
        setSaving(false);
    };

    const handleExcluirTarefa = async (tarefaId: number) => {
        if (!confirm('Excluir esta tarefa?')) return;
        try {
            await deleteTarefa(tarefaId);
            setSuccess('Tarefa excluída!');
            carregarEquipes();
        } catch (err: any) {
            setError('Erro ao excluir: ' + (err?.message || ''));
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>;

    return (
        <Box sx={{ mt: 5, mb: 8 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Groups /> Minhas Equipes
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {equipes.length === 0 && !loading && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Você ainda não está vinculado a nenhuma equipe deste evento. 
                    <br/><small>E-mail monitorado: {userEmail}</small>
                </Alert>
            )}

            {equipes.map((equipe) => {
                const isEditor = podeEditar(equipe);
                const tarefas = equipe.equipe_tarefas || [];

                return (
                    <Card key={equipe.id} sx={{ mb: 3, borderLeft: `5px solid ${equipe.cor || '#1E3A5F'}` }}>
                        <CardContent>
                            {/* Header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: equipe.cor || 'primary.main' }}>
                                    {equipe.nome}
                                </Typography>
                                <Chip label={equipe.meuCargo?.nome || 'Membro'} size="small" color={equipe.meuCargoNivel <= 2 ? 'primary' : 'default'} />
                            </Box>
                            {equipe.descricao && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{equipe.descricao}</Typography>}

                            {/* Membros */}
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Membros</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {(equipe.equipe_membros || []).map((m: any) => (
                                    <Chip key={m.id} label={`${m.pessoa?.nome} (${m.cargo?.nome})`} size="small" variant="outlined" />
                                ))}
                            </Box>

                            {/* Tarefas */}
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Tarefas ({tarefas.length})
                            </Typography>

                            {tarefas.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">Nenhuma tarefa</Typography>
                            ) : (
                                <List dense>
                                    {tarefas.map((t: any) => {
                                        const isEditing = editandoTarefaId === t.id;

                                        return (
                                            <ListItem key={t.id} sx={{
                                                bgcolor: 'action.hover', borderRadius: 1, mb: 0.5,
                                                borderLeft: `3px solid ${PRIORIDADE_COLORS[t.prioridade] || '#9e9e9e'}`,
                                                flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'stretch' : 'center',
                                            }}>
                                                {isEditing ? (
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', py: 1, width: '100%' }}>
                                                        <TextField size="small" label="Título" value={editForm.titulo}
                                                            onChange={(e) => setEditForm(f => ({ ...f, titulo: e.target.value }))} sx={{ flex: '2 1 180px' }} />
                                                        <TextField size="small" label="Status" select value={editForm.status}
                                                            onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as StatusTarefa }))} sx={{ flex: '1 1 130px' }}>
                                                            {Object.entries(STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                                                        </TextField>
                                                        <TextField size="small" label="Prioridade" select value={editForm.prioridade}
                                                            onChange={(e) => setEditForm(f => ({ ...f, prioridade: e.target.value as PrioridadeTarefa }))} sx={{ flex: '1 1 110px' }}>
                                                            {Object.entries(PRIORIDADE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                                                        </TextField>
                                                        <TextField size="small" label="Prazo" type="date" InputLabelProps={{ shrink: true }}
                                                            value={editForm.data_limite} onChange={(e) => setEditForm(f => ({ ...f, data_limite: e.target.value }))} sx={{ flex: '1 1 130px' }} />
                                                        <Button size="small" variant="contained" onClick={() => handleEditarTarefa(t.id)} disabled={saving}>Salvar</Button>
                                                        <Button size="small" onClick={() => setEditandoTarefaId(null)}>Cancelar</Button>
                                                    </Box>
                                                ) : (
                                                    <>
                                                        <ListItemText
                                                            primary={t.titulo}
                                                            sx={{ '& .MuiListItemText-primary': { textDecoration: t.status === 'concluida' ? 'line-through' : 'none' } }}
                                                        />
                                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                            <Chip label={STATUS_LABELS[t.status] || t.status} size="small"
                                                                sx={{ bgcolor: STATUS_COLORS[t.status], color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }} />
                                                            <Chip label={PRIORIDADE_LABELS[t.prioridade] || t.prioridade} size="small" variant="outlined"
                                                                sx={{ borderColor: PRIORIDADE_COLORS[t.prioridade], color: PRIORIDADE_COLORS[t.prioridade], fontSize: '0.7rem' }} />
                                                            {t.data_limite && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                                                    {new Date(t.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                                </Typography>
                                                            )}
                                                            {isEditor && (
                                                                <>
                                                                    <IconButton size="small" onClick={() => {
                                                                        setEditandoTarefaId(t.id);
                                                                        setEditForm({ titulo: t.titulo, status: t.status, prioridade: t.prioridade, data_limite: t.data_limite || '' });
                                                                    }}><Edit fontSize="small" /></IconButton>
                                                                    <IconButton size="small" color="error" onClick={() => handleExcluirTarefa(t.id)}>
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </>
                                                )}
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}

                            {/* Botão Nova Tarefa (somente Chefe/Subchefe) */}
                            {isEditor && (
                                novaTarefaEquipeId === equipe.id ? (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                        <TextField size="small" label="Título" value={novaTarefa.titulo}
                                            onChange={(e) => setNovaTarefa(f => ({ ...f, titulo: e.target.value }))} sx={{ flex: '2 1 180px' }} />
                                        <TextField size="small" label="Prioridade" select value={novaTarefa.prioridade}
                                            onChange={(e) => setNovaTarefa(f => ({ ...f, prioridade: e.target.value as PrioridadeTarefa }))} sx={{ flex: '1 1 110px' }}>
                                            {Object.entries(PRIORIDADE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                                        </TextField>
                                        <TextField size="small" label="Prazo" type="date" InputLabelProps={{ shrink: true }}
                                            value={novaTarefa.data_limite} onChange={(e) => setNovaTarefa(f => ({ ...f, data_limite: e.target.value }))} sx={{ flex: '1 1 130px' }} />
                                        <Button size="small" variant="contained" onClick={() => handleCriarTarefa(equipe.id)} disabled={saving}>Salvar</Button>
                                        <Button size="small" onClick={() => setNovaTarefaEquipeId(null)}>Cancelar</Button>
                                    </Box>
                                ) : (
                                    <Button size="small" startIcon={<Add />} onClick={() => setNovaTarefaEquipeId(equipe.id)} sx={{ mt: 1 }}>
                                        Nova Tarefa
                                    </Button>
                                )
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
}
