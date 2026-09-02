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
    Tooltip,
} from '@mui/material';
import {
    Search,
    Close,
    Groups,
    CheckCircle,
    Lock,
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
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [busca, setBusca] = useState('');
    const [ocultarAlocadosEmOutros, setOcultarAlocadosEmOutros] = useState(true);

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
            setSelectedIds(alocadosAtuais);
        } catch (err: any) {
            console.error('Erro ao carregar membros do círculo:', err);
            setError('Erro ao carregar membros do evento: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (inscId: string, jaAlocadoOutroCirculo?: boolean) => {
        if (jaAlocadoOutroCirculo) return; // Não permite selecionar quem está em outro círculo

        setSelectedIds((prev) => {
            if (prev.includes(inscId)) {
                return prev.filter((id) => id !== inscId);
            } else {
                return [...prev, inscId];
            }
        });
    };

    const handleSelectAllDisponiveis = () => {
        const disponiveisElegiveis = listaFiltrada
            .filter((item) => !item.jaAlocadoOutroCirculo)
            .map((item) => item.id);

        const todosJaSelecionados = disponiveisElegiveis.every((id) => selectedIds.includes(id));

        if (todosJaSelecionados) {
            setSelectedIds((prev) => prev.filter((id) => !disponiveisElegiveis.includes(id)));
        } else {
            const setUnico = new Set([...selectedIds, ...disponiveisElegiveis]);
            setSelectedIds(Array.from(setUnico));
        }
    };

    const handleSave = async () => {
        if (!circulo) return;
        setSaving(true);
        setError('');
        try {
            await salvarMembrosCirculoBatch(circulo.id, selectedIds);
            onSave();
            onClose();
        } catch (err: any) {
            setError('Erro ao salvar membros do círculo: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const listaFiltrada = useMemo(() => {
        return inscritos.filter((item) => {
            if (ocultarAlocadosEmOutros && item.jaAlocadoOutroCirculo) {
                return false;
            }

            if (!busca.trim()) return true;
            const term = busca.toLowerCase().trim();
            const nomeEsposo = item.esposo_nome.toLowerCase();
            const nomeEsposa = item.esposa_nome?.toLowerCase() || '';
            const paroquia = item.paroquia?.toLowerCase() || '';

            return nomeEsposo.includes(term) || nomeEsposa.includes(term) || paroquia.includes(term);
        });
    }, [inscritos, busca, ocultarAlocadosEmOutros]);

    const totalAlocadosOutros = useMemo(() => {
        return inscritos.filter((i) => i.jaAlocadoOutroCirculo).length;
    }, [inscritos]);

    if (!circulo) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                        Alocação de Membros — {circulo.nome}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2.5 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Métricas e Resumo */}
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    <Chip
                        icon={<CheckCircle fontSize="small" />}
                        label={`Selecionados no Círculo: ${selectedIds.length}`}
                        color="primary"
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                        label={`Total de Inscritos no Evento: ${inscritos.length}`}
                        variant="outlined"
                    />
                    {totalAlocadosOutros > 0 && (
                        <Chip
                            icon={<Lock fontSize="small" />}
                            label={`Em Outros Círculos: ${totalAlocadosOutros}`}
                            color="warning"
                            variant="outlined"
                        />
                    )}
                </Stack>

                {/* Filtros de Busca e Toggle */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Buscar por nome do participante ou paróquia..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={20} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        size="small"
                        variant={ocultarAlocadosEmOutros ? 'contained' : 'outlined'}
                        color={ocultarAlocadosEmOutros ? 'primary' : 'inherit'}
                        onClick={() => setOcultarAlocadosEmOutros(!ocultarAlocadosEmOutros)}
                        sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}
                    >
                        {ocultarAlocadosEmOutros ? 'Mostrando Apenas Elegíveis' : 'Mostrando Todos'}
                    </Button>
                </Stack>

                {/* Botão de Selecionar Todos da Lista Atual */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, px: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        {listaFiltrada.length} participante(s) encontrado(s)
                    </Typography>
                    <Button size="small" onClick={handleSelectAllDisponiveis} sx={{ fontSize: 12 }}>
                        Marcar / Desmarcar Todos Elegíveis
                    </Button>
                </Stack>

                {/* Lista de Participantes */}
                {loading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Carregando inscritos do evento...
                        </Typography>
                    </Box>
                ) : listaFiltrada.length === 0 ? (
                    <Alert severity="info" sx={{ my: 2 }}>
                        Nenhum participante encontrado com os filtros atuais.
                    </Alert>
                ) : (
                    <Box
                        sx={{
                            maxHeight: 380,
                            overflowY: 'auto',
                            border: '1px solid #E0E0E0',
                            borderRadius: 2,
                            bgcolor: '#FAFAFA',
                        }}
                    >
                        <List dense disablePadding>
                            {listaFiltrada.map((item) => {
                                const isSelected = selectedIds.includes(item.id);
                                const isDisabled = item.jaAlocadoOutroCirculo;

                                const labelText = item.tipo === 'casal'
                                    ? `${item.esposo_nome} & ${item.esposa_nome || ''}`
                                    : item.esposo_nome;

                                return (
                                    <ListItem
                                        key={item.id}
                                        onClick={() => handleToggle(item.id, isDisabled)}
                                        sx={{
                                            borderBottom: '1px solid #EEEEEE',
                                            bgcolor: isSelected ? '#F0F9FF' : (isDisabled ? '#F5F5F5' : '#FFFFFF'),
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            '&:hover': {
                                                bgcolor: isDisabled ? '#F5F5F5' : (isSelected ? '#E0F2FE' : '#F9FAFB'),
                                            },
                                            py: 1,
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Checkbox
                                                edge="start"
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                tabIndex={-1}
                                                disableRipple
                                                size="small"
                                            />
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={isSelected ? 'bold' : 'normal'}
                                                        sx={{ color: isDisabled ? 'text.secondary' : 'text.primary' }}
                                                    >
                                                        {labelText}
                                                    </Typography>
                                                    <Chip
                                                        label={item.tipo === 'casal' ? 'Casal' : 'Individual'}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 18, fontSize: 10 }}
                                                    />
                                                </Stack>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.paroquia ? `Paróquia: ${item.paroquia}` : 'Sem paróquia'}
                                                    {item.telefone ? ` • Tel: ${item.telefone}` : ''}
                                                </Typography>
                                            }
                                        />

                                        {isDisabled && (
                                            <Tooltip title={`Já alocado no círculo: ${item.nomeCirculoAtual}`}>
                                                <Chip
                                                    icon={<Lock fontSize="inherit" />}
                                                    label={`Em: ${item.nomeCirculoAtual}`}
                                                    size="small"
                                                    color="default"
                                                    sx={{ height: 20, fontSize: 10, bgcolor: '#E0E0E0' }}
                                                />
                                            </Tooltip>
                                        )}
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
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
                    {saving ? 'Salvando...' : `Salvar Alocação (${selectedIds.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
