import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Stack,
    Chip,
    Checkbox,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    InputAdornment,
    IconButton,
    Paper,
    Grid,
    Divider,
} from '@mui/material';
import {
    Search,
    Close,
    Groups,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    KeyboardDoubleArrowRight,
    KeyboardDoubleArrowLeft,
    PersonAdd,
} from '@mui/icons-material';
import {
    fetchInscritosDisponiveis,
    fetchMembrosDoCirculo,
    salvarMembrosCirculoBatch,
    type InscricaoDisponivel,
} from '../../services/circuloService';
import type { Circulo } from '../../types';

interface CirculoMembrosDialogProps {
    open: boolean;
    eventoId: number;
    circulo: Circulo | null;
    onClose: () => void;
    onSave: () => void;
}

export default function CirculoMembrosDialog({
    open,
    eventoId,
    circulo,
    onClose,
    onSave,
}: CirculoMembrosDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [inscritos, setInscritos] = useState<InscricaoDisponivel[]>([]);
    const [membrosIds, setMembrosIds] = useState<string[]>([]);

    // Seleção temporária em cada painel
    const [leftChecked, setLeftChecked] = useState<string[]>([]);
    const [rightChecked, setRightChecked] = useState<string[]>([]);

    // Filtros de busca
    const [buscaEsquerda, setBuscaEsquerda] = useState('');
    const [buscaDireita, setBuscaDireita] = useState('');

    useEffect(() => {
        if (open && circulo) {
            carregarDados();
        }
    }, [open, circulo]);

    const carregarDados = async () => {
        if (!circulo) return;
        setLoading(true);
        setError('');
        try {
            const [disponiveis, alocadosAtuais] = await Promise.all([
                fetchInscritosDisponiveis(eventoId, circulo.id),
                fetchMembrosDoCirculo(circulo.id),
            ]);

            setInscritos(disponiveis);
            setMembrosIds(alocadosAtuais);
            setLeftChecked([]);
            setRightChecked([]);
            setBuscaEsquerda('');
            setBuscaDireita('');
        } catch (err: any) {
            console.error('Erro ao carregar membros do círculo:', err);
            setError('Erro ao carregar membros do evento: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Lista da Esquerda: Inscritos sem círculo (ou elegíveis para alocação)
    const disponiveisSemCirculo = useMemo(() => {
        return inscritos.filter((item) => {
            // Não pode estar no círculo atual
            if (membrosIds.includes(item.id)) return false;
            // Não pode estar em outro círculo
            if (item.jaAlocadoOutroCirculo) return false;

            if (!buscaEsquerda.trim()) return true;
            const term = buscaEsquerda.toLowerCase().trim();
            const nomeEsposo = item.esposo_nome.toLowerCase();
            const nomeEsposa = item.esposa_nome?.toLowerCase() || '';
            const paroquia = item.paroquia?.toLowerCase() || '';

            return nomeEsposo.includes(term) || nomeEsposa.includes(term) || paroquia.includes(term);
        });
    }, [inscritos, membrosIds, buscaEsquerda]);

    // Lista da Direita: Membros alocados no círculo atual
    const membrosNoCirculo = useMemo(() => {
        return inscritos.filter((item) => {
            if (!membrosIds.includes(item.id)) return false;

            if (!buscaDireita.trim()) return true;
            const term = buscaDireita.toLowerCase().trim();
            const nomeEsposo = item.esposo_nome.toLowerCase();
            const nomeEsposa = item.esposa_nome?.toLowerCase() || '';
            const paroquia = item.paroquia?.toLowerCase() || '';

            return nomeEsposo.includes(term) || nomeEsposa.includes(term) || paroquia.includes(term);
        });
    }, [inscritos, membrosIds, buscaDireita]);

    // Toggle de seleção no painel esquerdo
    const handleToggleLeft = (id: string) => {
        setLeftChecked((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Toggle de seleção no painel direito
    const handleToggleRight = (id: string) => {
        setRightChecked((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Marcar/Desmarcar todos na esquerda
    const handleSelectAllLeft = () => {
        const todosIds = disponiveisSemCirculo.map((i) => i.id);
        const todosMarcados = todosIds.every((id) => leftChecked.includes(id));
        if (todosMarcados) {
            setLeftChecked((prev) => prev.filter((id) => !todosIds.includes(id)));
        } else {
            setLeftChecked(Array.from(new Set([...leftChecked, ...todosIds])));
        }
    };

    // Marcar/Desmarcar todos na direita
    const handleSelectAllRight = () => {
        const todosIds = membrosNoCirculo.map((i) => i.id);
        const todosMarcados = todosIds.every((id) => rightChecked.includes(id));
        if (todosMarcados) {
            setRightChecked((prev) => prev.filter((id) => !todosIds.includes(id)));
        } else {
            setRightChecked(Array.from(new Set([...rightChecked, ...todosIds])));
        }
    };

    // Ações de Transferência
    const handleMoveRight = () => {
        setMembrosIds((prev) => Array.from(new Set([...prev, ...leftChecked])));
        setLeftChecked([]);
    };

    const handleMoveAllRight = () => {
        const todosDisponiveisIds = disponiveisSemCirculo.map((i) => i.id);
        setMembrosIds((prev) => Array.from(new Set([...prev, ...todosDisponiveisIds])));
        setLeftChecked([]);
    };

    const handleMoveLeft = () => {
        setMembrosIds((prev) => prev.filter((id) => !rightChecked.includes(id)));
        setRightChecked([]);
    };

    const handleMoveAllLeft = () => {
        setMembrosIds([]);
        setRightChecked([]);
    };

    const handleSave = async () => {
        if (!circulo) return;
        setSaving(true);
        setError('');
        try {
            await salvarMembrosCirculoBatch(circulo.id, membrosIds);
            onSave();
            onClose();
        } catch (err: any) {
            setError('Erro ao salvar membros do círculo: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!circulo) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle
                sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: circulo.cor || '#0284C7',
                    color: '#FFFFFF',
                    py: 1.5,
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <Groups fontSize="medium" />
                    <Typography variant="h6" fontWeight="bold">
                        Alocação Dual-List — {circulo.nome}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2.5 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                            Carregando participantes do evento...
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2} alignItems="center">
                        {/* PAINEL DA ESQUERDA: DISPONÍVEIS */}
                        <Grid item xs={12} md={5}>
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                {/* Header do Painel */}
                                <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                            Participantes Sem Círculo
                                        </Typography>
                                        <Chip
                                            label={`${disponiveisSemCirculo.length} disponível(is)`}
                                            size="small"
                                            color="default"
                                            sx={{ fontWeight: 'bold', height: 22, fontSize: 11 }}
                                        />
                                    </Stack>

                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Buscar por nome ou paróquia..."
                                        value={buscaEsquerda}
                                        onChange={(e) => setBuscaEsquerda(e.target.value)}
                                        sx={{ mt: 1, bgcolor: '#FFFFFF' }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search size={18} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={handleSelectAllLeft}
                                            disabled={disponiveisSemCirculo.length === 0}
                                            sx={{ fontSize: 11, textTransform: 'none', p: 0 }}
                                        >
                                            Marcar/Desmarcar Todos
                                        </Button>
                                        {leftChecked.length > 0 && (
                                            <Typography variant="caption" color="primary" fontWeight="bold">
                                                {leftChecked.length} marcado(s)
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Lista da Esquerda */}
                                <Box sx={{ height: 340, overflowY: 'auto', bgcolor: '#FFFFFF' }}>
                                    {disponiveisSemCirculo.length === 0 ? (
                                        <Box sx={{ p: 4, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Nenhum participante disponível.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <List dense disablePadding>
                                            {disponiveisSemCirculo.map((item) => {
                                                const checked = leftChecked.includes(item.id);
                                                const labelText = item.tipo === 'casal'
                                                    ? `${item.esposo_nome} & ${item.esposa_nome || ''}`
                                                    : item.esposo_nome;

                                                return (
                                                    <ListItem
                                                        key={item.id}
                                                        onClick={() => handleToggleLeft(item.id)}
                                                        sx={{
                                                            borderBottom: '1px solid #F1F5F9',
                                                            bgcolor: checked ? '#F0F9FF' : '#FFFFFF',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: checked ? '#E0F2FE' : '#F8FAFC' },
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <Checkbox
                                                                edge="start"
                                                                checked={checked}
                                                                size="small"
                                                                tabIndex={-1}
                                                                disableRipple
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body2" fontWeight={checked ? 'bold' : 'medium'}>
                                                                    {labelText}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.paroquia ? `Paróquia: ${item.paroquia}` : 'Sem paróquia'}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        {/* BOTÕES DE TRANSFERÊNCIA NO CENTRO */}
                        <Grid item xs={12} md={2}>
                            <Stack
                                direction={{ xs: 'row', md: 'column' }}
                                spacing={1}
                                justifyContent="center"
                                alignItems="center"
                                sx={{ py: { xs: 1, md: 0 } }}
                            >
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleMoveRight}
                                    disabled={leftChecked.length === 0}
                                    startIcon={<ChevronRight />}
                                    sx={{ minWidth: 110, textTransform: 'none' }}
                                >
                                    Mover ({leftChecked.length})
                                </Button>

                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleMoveAllRight}
                                    disabled={disponiveisSemCirculo.length === 0}
                                    startIcon={<KeyboardDoubleArrowRight />}
                                    sx={{ minWidth: 110, textTransform: 'none', bgcolor: circulo.cor || '#0284C7' }}
                                >
                                    Mover Todos
                                </Button>

                                <Divider flexItem sx={{ my: 1, display: { xs: 'none', md: 'block' } }} />

                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    onClick={handleMoveLeft}
                                    disabled={rightChecked.length === 0}
                                    startIcon={<ChevronLeft />}
                                    sx={{ minWidth: 110, textTransform: 'none' }}
                                >
                                    Remover ({rightChecked.length})
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    onClick={handleMoveAllLeft}
                                    disabled={membrosNoCirculo.length === 0}
                                    startIcon={<KeyboardDoubleArrowLeft />}
                                    sx={{ minWidth: 110, textTransform: 'none' }}
                                >
                                    Remover Todos
                                </Button>
                            </Stack>
                        </Grid>

                        {/* PAINEL DA DIREITA: MEMBROS ALOCADOS NO CÍRCULO */}
                        <Grid item xs={12} md={5}>
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: circulo.cor || '#0284C7' }}>
                                {/* Header do Painel */}
                                <Box sx={{ p: 1.5, bgcolor: `${circulo.cor}15`, borderBottom: `1px solid ${circulo.cor}30` }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: circulo.cor || '#0284C7' }}>
                                            Membros no Círculo ({circulo.nome})
                                        </Typography>
                                        <Chip
                                            icon={<CheckCircle fontSize="small" />}
                                            label={`${membrosNoCirculo.length} no círculo`}
                                            size="small"
                                            sx={{ bgcolor: circulo.cor, color: '#FFFFFF', fontWeight: 'bold', height: 22, fontSize: 11 }}
                                        />
                                    </Stack>

                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Buscar membros no círculo..."
                                        value={buscaDireita}
                                        onChange={(e) => setBuscaDireita(e.target.value)}
                                        sx={{ mt: 1, bgcolor: '#FFFFFF' }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search size={18} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={handleSelectAllRight}
                                            disabled={membrosNoCirculo.length === 0}
                                            sx={{ fontSize: 11, textTransform: 'none', p: 0 }}
                                        >
                                            Marcar/Desmarcar Todos
                                        </Button>
                                        {rightChecked.length > 0 && (
                                            <Typography variant="caption" color="error" fontWeight="bold">
                                                {rightChecked.length} marcado(s)
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Lista da Direita */}
                                <Box sx={{ height: 340, overflowY: 'auto', bgcolor: '#FFFFFF' }}>
                                    {membrosNoCirculo.length === 0 ? (
                                        <Box sx={{ p: 4, textAlign: 'center' }}>
                                            <PersonAdd sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Nenhum membro alocado neste círculo ainda.
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Selecione participantes da lista à esquerda e clique em Mover.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <List dense disablePadding>
                                            {membrosNoCirculo.map((item) => {
                                                const checked = rightChecked.includes(item.id);
                                                const labelText = item.tipo === 'casal'
                                                    ? `${item.esposo_nome} & ${item.esposa_nome || ''}`
                                                    : item.esposo_nome;

                                                return (
                                                    <ListItem
                                                        key={item.id}
                                                        onClick={() => handleToggleRight(item.id)}
                                                        sx={{
                                                            borderBottom: '1px solid #F1F5F9',
                                                            bgcolor: checked ? '#FEF2F2' : '#FFFFFF',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: checked ? '#FEE2E2' : '#F8FAFC' },
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <Checkbox
                                                                edge="start"
                                                                checked={checked}
                                                                size="small"
                                                                tabIndex={-1}
                                                                disableRipple
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="body2" fontWeight={checked ? 'bold' : 'medium'}>
                                                                    {labelText}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.paroquia ? `Paróquia: ${item.paroquia}` : 'Sem paróquia'}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                    Total alocado no círculo: <strong>{membrosIds.length} participante(s)</strong>
                </Typography>

                <Stack direction="row" spacing={1}>
                    <Button onClick={onClose} disabled={saving} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ bgcolor: circulo.cor || '#0284C7', '&:hover': { opacity: 0.9, bgcolor: circulo.cor || '#0284C7' } }}
                    >
                        {saving ? 'Salvando...' : `Salvar Alocação (${membrosIds.length})`}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
