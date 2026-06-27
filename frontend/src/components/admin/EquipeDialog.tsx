import { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Button, TextField, Typography, Tab, Tabs,
    Autocomplete, IconButton, Chip, Alert, CircularProgress,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    MenuItem, Divider,
} from '@mui/material';
import { Delete, Add, Close } from '@mui/icons-material';
import {
    fetchCargos, fetchEquipeComMembros, fetchTarefas,
    createEquipe, updateEquipe, addMembro, removeMembro,
    buscarPessoas, createTarefa, updateTarefa, deleteTarefa,
} from '../../services/equipeService';
import type { CargoEquipe, EquipeTarefa, StatusTarefa, PrioridadeTarefa } from '../../types';

interface Props {
    open: boolean;
    equipeId: number | null;
    eventoId: number;
    onClose: () => void;
    onSave: () => void;
}

interface MembroLocal {
    id?: number;
    pessoa_id: string;
    cargo_id: number;
    pessoaNome: string;
    pessoaCpf: string;
    cargoNome: string;
    cargoNivel: number;
    isNew?: boolean;
    toRemove?: boolean;
}

interface TarefaLocal {
    id?: number;
    titulo: string;
    descricao: string;
    status: StatusTarefa;
    prioridade: PrioridadeTarefa;
    data_limite: string;
    isNew?: boolean;
    isModified?: boolean;
    toRemove?: boolean;
}

const PRIORIDADE_OPTIONS: { value: PrioridadeTarefa; label: string; color: string }[] = [
    { value: 'baixa', label: 'Baixa', color: '#4caf50' },
    { value: 'media', label: 'Média', color: '#ff9800' },
    { value: 'alta', label: 'Alta', color: '#f44336' },
];

const STATUS_OPTIONS: { value: StatusTarefa; label: string; color: string }[] = [
    { value: 'pendente', label: 'Pendente', color: '#9e9e9e' },
    { value: 'em_andamento', label: 'Em Andamento', color: '#2196f3' },
    { value: 'concluida', label: 'Concluída', color: '#4caf50' },
];

export default function EquipeDialog({ open, equipeId, eventoId, onClose, onSave }: Props) {
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [cargos, setCargos] = useState<CargoEquipe[]>([]);

    // Aba 1: Dados
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [cor, setCor] = useState('#1E3A5F');

    // Aba 2 & 3: Membros
    const [membros, setMembros] = useState<MembroLocal[]>([]);
    const [pessoasBusca, setPessoasBusca] = useState<any[]>([]);
    const [buscando, setBuscando] = useState(false);

    // Aba 4: Tarefas
    const [tarefas, setTarefas] = useState<TarefaLocal[]>([]);
    const [novaTarefa, setNovaTarefa] = useState({ titulo: '', descricao: '', prioridade: 'media' as PrioridadeTarefa, data_limite: '' });
    const [editandoTarefaIdx, setEditandoTarefaIdx] = useState<number | null>(null);

    // Reset ao abrir
    useEffect(() => {
        if (open) {
            setTabIndex(0);
            setError('');
            carregarDados();
        }
    }, [open, equipeId]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const cargosData = await fetchCargos();
            setCargos(cargosData);

            if (equipeId) {
                const equipe = await fetchEquipeComMembros(equipeId);
                setNome(equipe.nome || '');
                setDescricao(equipe.descricao || '');
                setCor(equipe.cor || '#1E3A5F');

                const membrosLocais: MembroLocal[] = (equipe.equipe_membros || []).map((m: any) => ({
                    id: m.id,
                    pessoa_id: m.pessoa_id,
                    cargo_id: m.cargo_id,
                    pessoaNome: m.pessoa?.nome || '',
                    pessoaCpf: m.pessoa?.cpf || '',
                    cargoNome: m.cargo?.nome || '',
                    cargoNivel: m.cargo?.nivel || 3,
                }));
                setMembros(membrosLocais);

                const tarefasData = await fetchTarefas(equipeId);
                setTarefas(tarefasData.map(t => ({
                    id: t.id,
                    titulo: t.titulo,
                    descricao: t.descricao || '',
                    status: t.status,
                    prioridade: t.prioridade,
                    data_limite: t.data_limite || '',
                })));
            } else {
                setNome('');
                setDescricao('');
                setCor('#1E3A5F');
                setMembros([]);
                setTarefas([]);
            }
        } catch (err: any) {
            setError('Erro ao carregar dados: ' + (err?.message || ''));
        }
        setLoading(false);
    };

    // Busca de pessoas (debounce)
    const handleBuscarPessoas = useCallback(async (termo: string) => {
        if (termo.length < 2) { setPessoasBusca([]); return; }
        setBuscando(true);
        try {
            const result = await buscarPessoas(termo);
            const idsJaAdicionados = membros.filter(m => !m.toRemove).map(m => m.pessoa_id);
            setPessoasBusca(result.filter(p => !idsJaAdicionados.includes(p.id)));
        } catch { setPessoasBusca([]); }
        setBuscando(false);
    }, [membros]);

    const adicionarMembro = (pessoa: any, cargoNivel: number) => {
        const cargo = cargos.find(c => c.nivel === cargoNivel);
        if (!cargo) return;

        // Validação: máx 1 chefe / 1 subchefe
        if (cargoNivel <= 2) {
            const jaExiste = membros.find(m => !m.toRemove && m.cargoNivel === cargoNivel);
            if (jaExiste) {
                setError(`Já existe um ${cargo.nome} na equipe. Remova o atual antes.`);
                return;
            }
        }

        setMembros(prev => [...prev, {
            pessoa_id: pessoa.id,
            cargo_id: cargo.id,
            pessoaNome: pessoa.nome,
            pessoaCpf: pessoa.cpf,
            cargoNome: cargo.nome,
            cargoNivel: cargo.nivel,
            isNew: true,
        }]);
        setError('');
    };

    const removerMembro = (index: number) => {
        setMembros(prev => prev.map((m, i) => {
            if (i !== index) return m;
            if (m.id) return { ...m, toRemove: true };
            return m;
        }).filter((m, i) => i !== index || m.id));
    };

    // Tarefas locais
    const adicionarTarefa = () => {
        if (!novaTarefa.titulo.trim()) { setError('Título da tarefa é obrigatório'); return; }
        setTarefas(prev => [...prev, {
            titulo: novaTarefa.titulo,
            descricao: novaTarefa.descricao,
            status: 'pendente',
            prioridade: novaTarefa.prioridade,
            data_limite: novaTarefa.data_limite,
            isNew: true,
        }]);
        setNovaTarefa({ titulo: '', descricao: '', prioridade: 'media', data_limite: '' });
        setError('');
    };

    const atualizarTarefa = (index: number, campo: string, valor: any) => {
        setTarefas(prev => prev.map((t, i) => i === index ? { ...t, [campo]: valor, isModified: !t.isNew } : t));
    };

    const removerTarefa = (index: number) => {
        setTarefas(prev => {
            const t = prev[index];
            if (t.id) return prev.map((item, i) => i === index ? { ...item, toRemove: true } : item);
            return prev.filter((_, i) => i !== index);
        });
    };

    // SALVAR TUDO
    const handleSalvar = async () => {
        setError('');
        if (!nome.trim()) { setError('Nome da equipe é obrigatório'); setTabIndex(0); return; }

        setSaving(true);
        try {
            let eqId = equipeId;

            // 1. Criar ou atualizar equipe
            if (eqId) {
                await updateEquipe(eqId, { nome, descricao: descricao || undefined, cor });
            } else {
                const novaEquipe = await createEquipe({ evento_id: eventoId, nome, descricao: descricao || undefined, cor });
                eqId = novaEquipe.id;
            }

            // 2. Processar membros: remover marcados
            for (const m of membros.filter(m => m.toRemove && m.id)) {
                await removeMembro(m.id!);
            }
            // Adicionar novos
            for (const m of membros.filter(m => m.isNew && !m.toRemove)) {
                await addMembro(eqId!, m.pessoa_id, m.cargo_id);
            }

            // 3. Processar tarefas
            for (const t of tarefas.filter(t => t.toRemove && t.id)) {
                await deleteTarefa(t.id!);
            }
            for (const t of tarefas.filter(t => t.isNew && !t.toRemove)) {
                await createTarefa({
                    equipe_id: eqId!,
                    titulo: t.titulo,
                    descricao: t.descricao || undefined,
                    prioridade: t.prioridade,
                    data_limite: t.data_limite || undefined,
                    status: t.status,
                });
            }
            for (const t of tarefas.filter(t => t.isModified && !t.isNew && !t.toRemove && t.id)) {
                await updateTarefa(t.id!, {
                    titulo: t.titulo,
                    descricao: t.descricao || undefined,
                    prioridade: t.prioridade,
                    data_limite: t.data_limite || null,
                    status: t.status,
                });
            }

            onSave();
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('unique_equipe_evento')) {
                setError('Já existe uma equipe com este nome neste evento.');
            } else if (msg.includes('unique_membro_equipe')) {
                setError('Uma pessoa já está vinculada a esta equipe.');
            } else {
                setError('Erro ao salvar: ' + msg);
            }
        }
        setSaving(false);
    };

    const membrosVisiveis = membros.filter(m => !m.toRemove);
    const tarefasVisiveis = tarefas.filter(t => !t.toRemove);
    const lideranca = membrosVisiveis.filter(m => m.cargoNivel <= 2);
    const componentes = membrosVisiveis.filter(m => m.cargoNivel >= 3);

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {equipeId ? 'Editar Equipe' : 'Nova Equipe'}
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                ) : (
                    <>
                        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
                            <Tab label="Dados" />
                            <Tab label={`Liderança (${lideranca.length})`} />
                            <Tab label={`Componentes (${componentes.length})`} />
                            <Tab label={`Tarefas (${tarefasVisiveis.length})`} />
                        </Tabs>

                        {/* ABA 1: DADOS */}
                        {tabIndex === 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                                <TextField label="Nome da Equipe" required fullWidth value={nome}
                                    onChange={(e) => setNome(e.target.value)} placeholder="Ex: Liturgia" />
                                <TextField label="Descrição" fullWidth multiline rows={3} value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)} placeholder="Objetivo da equipe..." />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography>Cor:</Typography>
                                    <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
                                        style={{ width: 50, height: 35, border: 'none', cursor: 'pointer' }} />
                                    <Box sx={{ width: 120, height: 8, borderRadius: 4, bgcolor: cor }} />
                                </Box>
                            </Box>
                        )}

                        {/* ABA 2: LIDERANÇA */}
                        {tabIndex === 1 && (
                            <Box sx={{ pt: 1 }}>
                                {[1, 2].map(nivel => {
                                    const cargo = cargos.find(c => c.nivel === nivel);
                                    const membro = lideranca.find(m => m.cargoNivel === nivel);
                                    return (
                                        <Box key={nivel} sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                {cargo?.nome || (nivel === 1 ? 'Chefe' : 'Subchefe')}
                                            </Typography>
                                            {membro ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                    <Typography flex={1}>{membro.pessoaNome} — CPF: {membro.pessoaCpf}</Typography>
                                                    <IconButton size="small" color="error" onClick={() => removerMembro(membros.indexOf(membro))}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Autocomplete
                                                    options={pessoasBusca}
                                                    getOptionLabel={(o: any) => `${o.nome} — CPF: ${o.cpf}`}
                                                    loading={buscando}
                                                    onInputChange={(_, v) => handleBuscarPessoas(v)}
                                                    onChange={(_, pessoa) => { if (pessoa) adicionarMembro(pessoa, nivel); setPessoasBusca([]); }}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label={`Buscar ${cargo?.nome || ''} por nome ou CPF`}
                                                            size="small" placeholder="Digite pelo menos 2 caracteres..." />
                                                    )}
                                                    noOptionsText="Nenhuma pessoa encontrada"
                                                    value={null}
                                                    blurOnSelect
                                                />
                                            )}
                                            {nivel === 1 && <Divider sx={{ mt: 2 }} />}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}

                        {/* ABA 3: COMPONENTES */}
                        {tabIndex === 2 && (
                            <Box sx={{ pt: 1 }}>
                                <Autocomplete
                                    options={pessoasBusca}
                                    getOptionLabel={(o: any) => `${o.nome} — CPF: ${o.cpf}`}
                                    loading={buscando}
                                    onInputChange={(_, v) => handleBuscarPessoas(v)}
                                    onChange={(_, pessoa) => { if (pessoa) adicionarMembro(pessoa, 3); setPessoasBusca([]); }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Buscar pessoa por nome ou CPF" size="small"
                                            placeholder="Digite pelo menos 2 caracteres..." />
                                    )}
                                    noOptionsText="Nenhuma pessoa encontrada"
                                    value={null}
                                    blurOnSelect
                                    sx={{ mb: 2 }}
                                />
                                {componentes.length === 0 ? (
                                    <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                                        Nenhum componente adicionado
                                    </Typography>
                                ) : (
                                    <List dense>
                                        {componentes.map((m) => {
                                            const idx = membros.indexOf(m);
                                            return (
                                                <ListItem key={idx} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}>
                                                    <ListItemText primary={m.pessoaNome} secondary={`CPF: ${m.pessoaCpf}`} />
                                                    <ListItemSecondaryAction>
                                                        <IconButton size="small" color="error" onClick={() => removerMembro(idx)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                )}
                            </Box>
                        )}

                        {/* ABA 4: TAREFAS */}
                        {tabIndex === 3 && (
                            <Box sx={{ pt: 1 }}>
                                {/* Form nova tarefa */}
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <TextField label="Título" size="small" value={novaTarefa.titulo}
                                        onChange={(e) => setNovaTarefa(p => ({ ...p, titulo: e.target.value }))}
                                        sx={{ flex: '2 1 200px' }} placeholder="Nova tarefa..." />
                                    <TextField label="Prioridade" size="small" select value={novaTarefa.prioridade}
                                        onChange={(e) => setNovaTarefa(p => ({ ...p, prioridade: e.target.value as PrioridadeTarefa }))}
                                        sx={{ flex: '1 1 120px' }}>
                                        {PRIORIDADE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                    </TextField>
                                    <TextField label="Prazo" type="date" size="small" InputLabelProps={{ shrink: true }}
                                        value={novaTarefa.data_limite}
                                        onChange={(e) => setNovaTarefa(p => ({ ...p, data_limite: e.target.value }))}
                                        sx={{ flex: '1 1 140px' }} />
                                    <Button variant="outlined" startIcon={<Add />} onClick={adicionarTarefa}
                                        sx={{ whiteSpace: 'nowrap' }}>Adicionar</Button>
                                </Box>

                                {tarefasVisiveis.length === 0 ? (
                                    <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                                        Nenhuma tarefa adicionada
                                    </Typography>
                                ) : (
                                    <List dense>
                                        {tarefasVisiveis.map((t, visIdx) => {
                                            const realIdx = tarefas.indexOf(t);
                                            const prioOption = PRIORIDADE_OPTIONS.find(o => o.value === t.prioridade);
                                            const statusOption = STATUS_OPTIONS.find(o => o.value === t.status);
                                            const isEditing = editandoTarefaIdx === realIdx;

                                            return (
                                                <ListItem key={realIdx} sx={{
                                                    bgcolor: 'action.hover', borderRadius: 1, mb: 0.5,
                                                    borderLeft: `4px solid ${prioOption?.color || '#9e9e9e'}`,
                                                    flexDirection: 'column', alignItems: 'stretch',
                                                }}>
                                                    {isEditing ? (
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', py: 1 }}>
                                                            <TextField size="small" label="Título" value={t.titulo}
                                                                onChange={(e) => atualizarTarefa(realIdx, 'titulo', e.target.value)}
                                                                sx={{ flex: '2 1 200px' }} />
                                                            <TextField size="small" label="Status" select value={t.status}
                                                                onChange={(e) => atualizarTarefa(realIdx, 'status', e.target.value)}
                                                                sx={{ flex: '1 1 140px' }}>
                                                                {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                                            </TextField>
                                                            <TextField size="small" label="Prioridade" select value={t.prioridade}
                                                                onChange={(e) => atualizarTarefa(realIdx, 'prioridade', e.target.value)}
                                                                sx={{ flex: '1 1 120px' }}>
                                                                {PRIORIDADE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                                            </TextField>
                                                            <TextField size="small" label="Prazo" type="date" InputLabelProps={{ shrink: true }}
                                                                value={t.data_limite}
                                                                onChange={(e) => atualizarTarefa(realIdx, 'data_limite', e.target.value)}
                                                                sx={{ flex: '1 1 140px' }} />
                                                            <Button size="small" onClick={() => setEditandoTarefaIdx(null)}>OK</Button>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography flex={1} fontWeight="medium"
                                                                sx={{ textDecoration: t.status === 'concluida' ? 'line-through' : 'none' }}>
                                                                {t.titulo}
                                                            </Typography>
                                                            <Chip label={statusOption?.label} size="small"
                                                                sx={{ bgcolor: statusOption?.color, color: '#fff', fontWeight: 'bold', fontSize: '0.7rem' }} />
                                                            <Chip label={prioOption?.label} size="small" variant="outlined"
                                                                sx={{ borderColor: prioOption?.color, color: prioOption?.color, fontSize: '0.7rem' }} />
                                                            {t.data_limite && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {new Date(t.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                                </Typography>
                                                            )}
                                                            <IconButton size="small" onClick={() => setEditandoTarefaIdx(realIdx)}>
                                                                <Add fontSize="small" sx={{ transform: 'rotate(45deg)' }} />
                                                            </IconButton>
                                                            <IconButton size="small" color="error" onClick={() => removerTarefa(realIdx)}>
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    )}
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button variant="contained" onClick={handleSalvar} disabled={saving || loading}
                    startIcon={saving ? <CircularProgress size={16} /> : undefined}>
                    {saving ? 'Salvando...' : 'Salvar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
