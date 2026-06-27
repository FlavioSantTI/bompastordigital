/**
 * AtividadeDialog — Modal lateral para criar/editar atividade do cronograma
 * Módulo Cronograma & Palestrantes v5.3
 */
import { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    IconButton,
    Switch,
    FormControlLabel,
    Divider,
    Autocomplete,
    Chip,
    Paper,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
} from '@mui/material';
import { Close, Save, Delete, Add, PersonAdd } from '@mui/icons-material';
import type { Sala, Atividade, CategoriaAtividade, Palestrante, TipoParticipacao } from '../../types';
import {
    createAtividade,
    updateAtividade,
    deleteAtividade,
    validarConflitos,
} from '../../services/cronogramaService';
import {
    fetchPalestrantes,
    createPalestrante,
    salvarVinculosAtividade,
} from '../../services/palestranteService';

interface AtividadeDialogProps {
    open: boolean;
    onClose: () => void;
    eventoId: number;
    salas: Sala[];
    dataSelecionada: string;
    atividadesDoDia: Atividade[];
    editingAtividade?: Atividade | null;
    /** Pré-preencher sala e horário ao clicar numa célula da grade */
    presetSalaId?: number | null;
    presetHoraInicio?: string | null;
    /** Lista de categorias vindas do banco (apenas id e nome) */
    categorias: { id: number; nome: string }[];
    onUpdate: () => void;
}

export interface VinculoFormState {
    palestrante_id: number;
    tipo_participacao: TipoParticipacao;
    palestrante_nome?: string;
}

export default function AtividadeDialog({
    open,
    onClose,
    eventoId,
    salas,
    dataSelecionada,
    atividadesDoDia,
    editingAtividade,
    presetSalaId,
    presetHoraInicio,
    categorias,
    onUpdate,
}: AtividadeDialogProps) {
    const [titulo, setTitulo] = useState('');
    const [palestrante, setPalestrante] = useState(''); // Texto livre legado
    const [categoria, setCategoria] = useState<CategoriaAtividade>('');
    const [salaId, setSalaId] = useState<number>(0);
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFim, setHoraFim] = useState('');
    const [descricao, setDescricao] = useState('');
    const [publicado, setPublicado] = useState(false);

    // Lista global de palestrantes e vínculos selecionados
    const [listaPalestrantes, setListaPalestrantes] = useState<Palestrante[]>([]);
    const [vinculos, setVinculos] = useState<VinculoFormState[]>([]);
    const [selectedAutoComplete, setSelectedAutoComplete] = useState<Palestrante | null>(null);

    // Modal de Atalho Rápido para novo palestrante
    const [quickDialogOpen, setQuickDialogOpen] = useState(false);
    const [quickNome, setQuickNome] = useState('');
    const [quickEmail, setQuickEmail] = useState('');
    const [quickSaving, setQuickSaving] = useState(false);

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Carregar lista de palestrantes do banco ao abrir
    useEffect(() => {
        if (open) {
            loadPalestrantesList();
        }
    }, [open]);

    const loadPalestrantesList = async () => {
        try {
            const data = await fetchPalestrantes();
            setListaPalestrantes(data);

            // Se estiver editando uma atividade, carregar vínculos reais do banco
            if (editingAtividade) {
                const vinculosDb = await fetchVinculosByAtividade(editingAtividade.id);
                if (vinculosDb && vinculosDb.length > 0) {
                    const mapVinculos: VinculoFormState[] = vinculosDb.map(v => ({
                        palestrante_id: v.palestrante_id,
                        tipo_participacao: v.tipo_participacao,
                        palestrante_nome: v.palestrante?.nome,
                    }));
                    setVinculos(mapVinculos);
                } else if (editingAtividade.palestrante) {
                    // Tentar associar texto legado com palestrante existente na base
                    const legadoNome = editingAtividade.palestrante.trim().toLowerCase();
                    const encontrado = data.find(p => p.nome.trim().toLowerCase() === legadoNome);
                    if (encontrado) {
                        setVinculos([{
                            palestrante_id: encontrado.id,
                            tipo_participacao: 'principal',
                            palestrante_nome: encontrado.nome,
                        }]);
                    }
                }
            }
        } catch (err: any) {
            console.error('Erro ao carregar lista de palestrantes:', err);
        }
    };

    // Popular form quando editando ou preset
    useEffect(() => {
        if (!open) return;

        if (editingAtividade) {
            setTitulo(editingAtividade.titulo);
            setPalestrante(editingAtividade.palestrante || '');
            setSalaId(editingAtividade.sala_id);
            setCategoria(editingAtividade.categoria);
            setHoraInicio(editingAtividade.hora_inicio.substring(0, 5));
            setHoraFim(editingAtividade.hora_fim.substring(0, 5));
            setDescricao(editingAtividade.descricao || '');
            setPublicado(editingAtividade.publicado);
        } else {
            setTitulo('');
            setPalestrante('');
            setVinculos([]);

            // Categoria: busca a "Palestra" ou a primeira da lista
            const safeCategorias = categorias || [];
            if (safeCategorias.length > 0) {
                const palestraCat = safeCategorias.find(c => c.nome.trim().toLowerCase() === 'palestra');
                const defaultCat = palestraCat ? palestraCat.nome : safeCategorias[0].nome;
                setCategoria(defaultCat);
            } else {
                setCategoria('');
            }

            setDescricao('');
            setPublicado(false);

            // Sala e Horário
            const safeSalas = salas || [];
            const targetSalaId = presetSalaId || (safeSalas.length > 0 ? safeSalas[0].id : 0);
            if (targetSalaId) {
                setSalaId(targetSalaId);
            }

            if (presetHoraInicio) {
                setHoraInicio(presetHoraInicio);
            } else if (targetSalaId) {
                const safeAtividades = atividadesDoDia || [];
                const ultimaNaSala = safeAtividades
                    .filter(a => a.sala_id === targetSalaId)
                    .sort((a, b) => b.hora_fim.localeCompare(a.hora_fim))[0];

                if (ultimaNaSala) {
                    setHoraInicio(ultimaNaSala.hora_fim.substring(0, 5));
                } else {
                    setHoraInicio('08:00');
                }
            }
            setHoraFim('');
        }
        setError('');
    }, [open, editingAtividade, presetSalaId, presetHoraInicio, salas, categorias]);

    const handleSalaChange = (newSalaId: number) => {
        setSalaId(newSalaId);
        if (!editingAtividade) {
            const safeAtividades = atividadesDoDia || [];
            const ultimaNaSala = safeAtividades
                .filter(a => a.sala_id === newSalaId)
                .sort((a, b) => b.hora_fim.localeCompare(a.hora_fim))[0];

            if (ultimaNaSala) {
                setHoraInicio(ultimaNaSala.hora_fim.substring(0, 5));
            }
        }
    };

    // Adicionar palestrante à atividade
    const handleAddVinculo = (palestranteObj: Palestrante | null) => {
        if (!palestranteObj) return;
        if (vinculos.some(v => v.palestrante_id === palestranteObj.id)) return;

        setVinculos(prev => [
            ...prev,
            {
                palestrante_id: palestranteObj.id,
                tipo_participacao: 'principal',
                palestrante_nome: palestranteObj.nome,
            },
        ]);
    };

    const handleRemoveVinculo = (palestranteId: number) => {
        setVinculos(prev => prev.filter(v => v.palestrante_id !== palestranteId));
    };

    const handleChangeTipoParticipacao = (palestranteId: number, tipo: TipoParticipacao) => {
        setVinculos(prev =>
            prev.map(v => (v.palestrante_id === palestranteId ? { ...v, tipo_participacao: tipo } : v))
        );
    };

    // Cadastro rápido de palestrante
    const handleCreateQuickPalestrante = async () => {
        if (!quickNome.trim()) return;

        setQuickSaving(true);
        try {
            const novo = await createPalestrante({
                nome: quickNome.trim(),
                email: quickEmail.trim() || null,
            });
            await loadPalestrantesList();
            handleAddVinculo(novo);
            setQuickDialogOpen(false);
            setQuickNome('');
            setQuickEmail('');
        } catch (err: any) {
            alert('Erro ao criar palestrante rápido: ' + err.message);
        } finally {
            setQuickSaving(false);
        }
    };

    const handleSubmit = async () => {
        setError('');

        if (!titulo.trim()) {
            setError('O título é obrigatório.');
            return;
        }
        if (!salaId) {
            setError('Selecione uma sala.');
            return;
        }
        if (!horaInicio || !horaFim) {
            setError('Preencha os horários de início e término.');
            return;
        }
        if (!dataSelecionada) {
            setError('A data do evento é inválida ou não foi selecionada.');
            return;
        }
        if (horaFim <= horaInicio) {
            setError('O horário de término deve ser posterior ao de início.');
            return;
        }

        // Validação de conflitos (incluindo IDs dos palestrantes vinculados)
        const conflito = validarConflitos(
            {
                sala_id: salaId,
                palestrante,
                palestrante_ids: vinculos.map(v => v.palestrante_id),
                hora_inicio: horaInicio,
                hora_fim: horaFim,
            },
            atividadesDoDia,
            editingAtividade?.id
        );

        if (!conflito.valido) {
            setError(conflito.mensagem);
            return;
        }

        setSaving(true);

        try {
            const payload = {
                evento_id: eventoId,
                sala_id: salaId,
                titulo: titulo.trim(),
                palestrante: palestrante.trim() || null,
                categoria,
                data: dataSelecionada,
                hora_inicio: horaInicio,
                hora_fim: horaFim,
                descricao: descricao.trim() || null,
                publicado,
            };

            let atvResult: Atividade;
            if (editingAtividade) {
                atvResult = await updateAtividade(editingAtividade.id, payload);
            } else {
                atvResult = await createAtividade(payload);
            }

            // Salvar vínculos N:N na tabela de junção
            await salvarVinculosAtividade(
                atvResult.id,
                vinculos.map(v => ({
                    palestrante_id: v.palestrante_id,
                    tipo_participacao: v.tipo_participacao,
                }))
            );

            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingAtividade) return;
        if (!confirm(`Excluir a atividade "${editingAtividade.titulo}"?`)) return;

        setSaving(true);
        try {
            await deleteAtividade(editingAtividade.id);
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const categoriaConfig = {
        cor: '#1e3a5f',
        icone: '📅',
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                sx={{
                    zIndex: 3000,
                    '& .MuiBackdrop-root': { bgcolor: 'rgba(0,0,0,0.3)' },
                }}
                PaperProps={{
                    sx: {
                        width: { xs: '95%', sm: 450 },
                        m: { xs: 0, sm: 2 },
                        borderRadius: { xs: 0, sm: 2 },
                        p: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'auto',
                        maxHeight: 'calc(100% - 32px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        zIndex: 3001,
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 1.5,
                        px: 2,
                        background: `linear-gradient(135deg, ${categoriaConfig.cor}15, ${categoriaConfig.cor}05)`,
                        borderBottom: `2px solid ${categoriaConfig.cor}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Typography sx={{ fontSize: 20 }}>{categoriaConfig.icone}</Typography>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {editingAtividade ? 'Editar Atividade' : 'Nova Atividade'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {dataSelecionada.split('-').reverse().join('/')}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

                {/* Body */}
                <Box
                    sx={{
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        overflowY: 'auto',
                        bgcolor: 'background.paper',
                    }}
                >
                    {error && (
                        <Alert severity="error" onClose={() => setError('')} sx={{ py: 0.5 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            id="atividade-titulo"
                            label="Título da Atividade"
                            fullWidth
                            required
                            size="small"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Palestra de Abertura"
                            autoFocus
                        />

                        {/* Seção de Palestrantes Vinculados */}
                        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafafa', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" fontWeight="bold" color="primary">
                                    🎤 Palestrantes Associados
                                </Typography>
                                <Tooltip title="Cadastrar novo palestrante rápido">
                                    <Button
                                        size="small"
                                        startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                                        onClick={() => setQuickDialogOpen(true)}
                                        sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                                    >
                                        Novo Rápido
                                    </Button>
                                </Tooltip>
                            </Box>

                            {/* Seletor de Palestrantes (Native Select para máxima compatibilidade) */}
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Adicionar Palestrante da Base"
                                value=""
                                onChange={(e) => {
                                    const pId = Number(e.target.value);
                                    if (pId) {
                                        const pObj = listaPalestrantes.find(p => p.id === pId);
                                        if (pObj) handleAddVinculo(pObj);
                                    }
                                }}
                                SelectProps={{ native: true }}
                                sx={{ bgcolor: 'white' }}
                            >
                                <option value="">-- Selecionar palestrante da base --</option>
                                {listaPalestrantes
                                    .filter(p => !vinculos.some(v => v.palestrante_id === p.id))
                                    .map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nome} {p.email ? `(${p.email})` : ''}
                                        </option>
                                    ))
                                }
                            </TextField>
                            {listaPalestrantes.length === 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    Nenhum palestrante cadastrado na base. Clique em <strong>"+ Novo Rápido"</strong> para cadastrar.
                                </Typography>
                            )}

                            {/* Lista de Palestrantes Selecionados */}
                            {vinculos.length > 0 && (
                                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {vinculos.map((v) => {
                                        const palObj = listaPalestrantes.find(p => p.id === v.palestrante_id);
                                        const nomeExibicao = palObj?.nome || v.palestrante_nome || 'Palestrante';

                                        return (
                                            <Paper key={v.palestrante_id} variant="outlined" sx={{ p: 1, px: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
                                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                                                    👤 {nomeExibicao}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Select
                                                        size="small"
                                                        value={v.tipo_participacao}
                                                        onChange={(e) => handleChangeTipoParticipacao(v.palestrante_id, e.target.value as TipoParticipacao)}
                                                        sx={{ fontSize: '0.75rem', height: 28, '& .MuiSelect-select': { py: 0.2, px: 1 } }}
                                                    >
                                                        <MenuItem value="principal" sx={{ fontSize: '0.75rem' }}>Principal</MenuItem>
                                                        <MenuItem value="painelista" sx={{ fontSize: '0.75rem' }}>Painelista</MenuItem>
                                                        <MenuItem value="mediador" sx={{ fontSize: '0.75rem' }}>Mediador</MenuItem>
                                                    </Select>
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveVinculo(v.palestrante_id)}>
                                                        <Close sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                            id="atividade-categoria"
                            label="Categoria"
                            select
                            fullWidth
                            required
                            size="small"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value as any)}
                            SelectProps={{ native: true }}
                        >
                            <option value="" disabled>Selecione uma categoria...</option>
                            {(categorias || []).map((cat) => (
                                <option key={cat.id} value={cat.nome}>
                                    {cat.nome}
                                </option>
                            ))}
                        </TextField>

                        <TextField
                            id="atividade-sala"
                            label="Sala"
                            select
                            fullWidth
                            required
                            size="small"
                            value={salaId || ''}
                            onChange={(e) => handleSalaChange(Number(e.target.value))}
                            SelectProps={{ native: true }}
                        >
                            <option value="" disabled>Selecione uma sala...</option>
                            {(salas || []).map((sala) => (
                                <option key={sala.id} value={sala.id}>
                                    {sala.nome}
                                </option>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Início"
                            type="time"
                            fullWidth
                            required
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={horaInicio}
                            onChange={(e) => setHoraInicio(e.target.value)}
                        />
                        <TextField
                            label="Término"
                            type="time"
                            fullWidth
                            required
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={horaFim}
                            onChange={(e) => setHoraFim(e.target.value)}
                            inputProps={{ min: horaInicio }}
                        />
                    </Box>

                    <TextField
                        id="atividade-descricao"
                        label="Descrição da Atividade (Opcional)"
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Detalhes adicionais..."
                        sx={{ bgcolor: 'white' }}
                    />

                    <Divider />

                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={publicado}
                                onChange={(e) => setPublicado(e.target.checked)}
                                color="success"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="caption" fontWeight="bold" sx={{ display: 'block' }}>
                                    Publicar na Agenda
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    Visível para participantes na timeline
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        p: 2,
                        px: 3,
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: '#fcfcfc',
                    }}
                >
                    <Box>
                        {editingAtividade && (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                onClick={handleDelete}
                                sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: 2, px: 2 }}
                            >
                                Excluir
                            </Button>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button onClick={onClose} variant="text" sx={{ color: 'text.secondary', textTransform: 'none' }}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSubmit}
                            disabled={saving || !titulo || !salaId}
                            sx={{
                                bgcolor: '#1e3a5f',
                                color: 'white !important',
                                fontWeight: 'bold',
                                px: 3,
                                borderRadius: 2,
                                textTransform: 'none',
                            }}
                        >
                            {saving ? 'Salvando...' : (editingAtividade ? 'Salvar' : 'Criar')}
                        </Button>
                    </Box>
                </Box>
            </Drawer>

            {/* Dialog Modal de Atalho Rápido para novo Palestrante */}
            <Dialog open={quickDialogOpen} onClose={() => setQuickDialogOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 4000 }}>
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1rem' }}>⚡ Cadastro Rápido de Palestrante</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nome Completo"
                            fullWidth
                            required
                            size="small"
                            value={quickNome}
                            onChange={(e) => setQuickNome(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            label="E-mail (opcional)"
                            fullWidth
                            type="email"
                            size="small"
                            value={quickEmail}
                            onChange={(e) => setQuickEmail(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 1.5 }}>
                    <Button onClick={() => setQuickDialogOpen(false)} size="small" color="inherit">Cancelar</Button>
                    <Button onClick={handleCreateQuickPalestrante} variant="contained" size="small" disabled={quickSaving || !quickNome.trim()}>
                        {quickSaving ? 'Salvando...' : 'Adicionar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
